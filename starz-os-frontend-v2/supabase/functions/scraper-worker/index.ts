// ============================================================
// STARZ-OS — scraper-worker Edge Function
// Phase 1 + Phase 2: Batch jobs, proxy rotation, retry/backoff,
// structured parsing, cache, cost control
// Deploy: supabase functions deploy scraper-worker
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const BATCH_SIZE = 5;

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Only accept POST (from cron pg_net) or GET (manual trigger)
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // ── Cost gate ──────────────────────────────────────────────
  const { data: withinLimit, error: limitErr } = await supabase.rpc(
    "check_limit"
  );
  if (limitErr) {
    console.error("Limit check error:", limitErr.message);
    return new Response(JSON.stringify({ error: "Limit check failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!withinLimit) {
    return new Response(
      JSON.stringify({ error: "Daily SERP limit reached" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Fetch batch of pending jobs ────────────────────────────
  const { data: jobs, error: jobErr } = await supabase
    .from("scraping.jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (jobErr) {
    console.error("Job fetch error:", jobErr.message);
    return new Response(JSON.stringify({ error: jobErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!jobs || jobs.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Process each job ──────────────────────────────────────
  const results = await Promise.allSettled(
    jobs.map((job: Job) => processJob(supabase, job))
  );

  const summary = results.map((r, i) => ({
    jobId: jobs[i].id,
    keyword: jobs[i].keyword,
    status: r.status,
    reason: r.status === "rejected" ? String(r.reason) : undefined,
  }));

  console.log("Batch complete:", JSON.stringify(summary));
  return new Response(
    JSON.stringify({ ok: true, processed: jobs.length, summary }),
    { headers: { "Content-Type": "application/json" } }
  );
});

// ─────────────────────────────────────────────────────────────
// JOB PROCESSOR
// ─────────────────────────────────────────────────────────────
async function processJob(supabase: SupabaseClient, job: Job): Promise<void> {
  // Mark processing
  await supabase
    .from("scraping.jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", job.id);

  try {
    // ── 1. Cache check ──────────────────────────────────────
    const { data: cached } = await supabase
      .from("seo.serp_cache")
      .select("results, fetched_at, hit_count")
      .eq("keyword", job.keyword)
      .eq("location", job.location)
      .maybeSingle();

    const cacheAge = cached
      ? Date.now() - new Date(cached.fetched_at).getTime()
      : Infinity;

    if (cached && cacheAge < CACHE_TTL_MS) {
      // Serve from cache
      await supabase.from("seo.serp_data").insert({
        keyword: job.keyword,
        location: job.location,
        results: cached.results,
        source: "cache",
        job_id: job.id,
      });

      await supabase
        .from("seo.serp_cache")
        .update({ hit_count: (cached.hit_count ?? 0) + 1 })
        .eq("keyword", job.keyword)
        .eq("location", job.location);

      await markComplete(supabase, job.id);
      console.log(`[CACHE HIT] ${job.keyword}`);
      return;
    }

    // ── 2. Select proxy ─────────────────────────────────────
    const proxy = await getProxy(supabase);

    // ── 3. Fetch SERP ───────────────────────────────────────
    const html = await fetchSERP(job.keyword, job.location, proxy);

    // ── 4. Parse structured results ─────────────────────────
    const parsed = parseSERP(html);

    if (parsed.length === 0) {
      // Possible block — increment proxy fail_count
      if (proxy) await incrementProxyFail(supabase, proxy.id);
      throw new Error("Parsed 0 results — possible CAPTCHA/block");
    }

    // Mark proxy success
    if (proxy) await markProxySuccess(supabase, proxy.id);

    // ── 5. Store results ────────────────────────────────────
    await supabase.from("seo.serp_data").insert({
      keyword: job.keyword,
      location: job.location,
      results: parsed,
      source: "scraper",
      job_id: job.id,
    });

    // ── 6. Update cache ─────────────────────────────────────
    await supabase.from("seo.serp_cache").upsert(
      {
        keyword: job.keyword,
        location: job.location,
        results: parsed,
        fetched_at: new Date().toISOString(),
        hit_count: 0,
      },
      { onConflict: "keyword,location" }
    );

    // ── 7. Increment usage counter ──────────────────────────
    await supabase.rpc("check_and_increment_limit");

    // ── 8. Update tracked keyword last_checked ──────────────
    await supabase
      .from("seo.tracked_keywords")
      .update({ last_checked: new Date().toISOString() })
      .eq("keyword", job.keyword)
      .eq("location", job.location);

    await markComplete(supabase, job.id);
    console.log(`[SCRAPED] ${job.keyword} — ${parsed.length} results`);
  } catch (err) {
    console.error(`[ERROR] job ${job.id} — ${job.keyword}:`, err);
    await retryJob(supabase, job, String(err));
  }
}

// ─────────────────────────────────────────────────────────────
// FETCH WITH PROXY SUPPORT + USER-AGENT ROTATION
// ─────────────────────────────────────────────────────────────
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchSERP(
  keyword: string,
  location: string,
  proxy: Proxy | null
): Promise<string> {
  const lang = locationToLang(location);
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=${lang}&num=10&gl=${locationToGL(location)}`;

  const headers: Record<string, string> = {
    "User-Agent": randomUA(),
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
  };

  // Note: Deno's built-in fetch does not support HTTP proxies via URL auth
  // For production proxy routing, deploy a proxy relay or use a paid SERP API.
  // The proxy object is stored but direct tunnel is handled by the relay.
  // Phase 3 upgrades this with Playwright + proper proxy tunneling.

  const fetchOptions: RequestInit = {
    headers,
    redirect: "follow",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

// ─────────────────────────────────────────────────────────────
// STRUCTURED SERP PARSER
// Phase 2: Extracts title, URL, snippet, featured snippet, PAA
// ─────────────────────────────────────────────────────────────
function parseSERP(html: string): SERPResult[] {
  const results: SERPResult[] = [];

  // ── Organic results via multiple selector patterns ─────────
  // Google's HTML is obfuscated — use multiple patterns for resilience

  // Pattern A: Standard <div class="g"> blocks
  const blockSplits = html.split(/(?=<div[^>]+\bclass="[^"]*\bg\b[^"]*")/);

  for (const block of blockSplits) {
    if (results.length >= 10) break;

    const titleMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    const linkMatch = block.match(/href="(https?:\/\/(?!google\.)[^"&]+)"/);
    const snippetMatch = block.match(
      /<div[^>]*class="[^"]*(?:VwiC3b|IsZvec|lEBKkf)[^"]*"[^>]*>([\s\S]*?)<\/div>/
    );

    if (!titleMatch || !linkMatch) continue;

    const title = stripHTML(titleMatch[1]).trim();
    const link = linkMatch[1];
    const snippet = snippetMatch ? stripHTML(snippetMatch[1]).trim() : "";

    if (!title || !link || title.length < 3) continue;

    // Avoid duplicates
    if (results.some((r) => r.link === link)) continue;

    const domain = extractDomain(link);

    results.push({
      position: results.length + 1,
      title,
      link,
      domain,
      snippet: snippet.substring(0, 300),
      type: "organic",
    });
  }

  // ── Featured snippet detection ──────────────────────────────
  const featuredMatch = html.match(
    /data-attrid="wa:\/description"[^>]*>([\s\S]*?)<\/div>/
  );
  if (featuredMatch) {
    const text = stripHTML(featuredMatch[1]).trim();
    if (text.length > 10) {
      results.unshift({
        position: 0,
        title: "Featured Snippet",
        link: "",
        domain: "",
        snippet: text.substring(0, 400),
        type: "featured_snippet",
      });
    }
  }

  // ── People Also Ask ─────────────────────────────────────────
  const paaMatches = [
    ...html.matchAll(/<div[^>]+\bdata-q="([^"]+)"[^>]*>/g),
  ].slice(0, 4);
  if (paaMatches.length > 0) {
    results.push({
      position: -1,
      title: "People Also Ask",
      link: "",
      domain: "",
      snippet: paaMatches.map((m) => m[1]).join(" | "),
      type: "paa",
    });
  }

  return results;
}

function stripHTML(str: string): string {
  return str
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function locationToLang(location: string): string {
  const map: Record<string, string> = {
    "United States": "en",
    "United Kingdom": "en-GB",
    Canada: "en-CA",
    Australia: "en-AU",
  };
  return map[location] ?? "en";
}

function locationToGL(location: string): string {
  const map: Record<string, string> = {
    "United States": "us",
    "United Kingdom": "gb",
    Canada: "ca",
    Australia: "au",
  };
  return map[location] ?? "us";
}

// ─────────────────────────────────────────────────────────────
// PROXY HELPERS
// ─────────────────────────────────────────────────────────────
async function getProxy(supabase: SupabaseClient): Promise<Proxy | null> {
  const { data } = await supabase
    .from("scraping.proxies")
    .select("id, host, port, username, password, protocol")
    .eq("active", true)
    .order("last_used", { ascending: true, nullsFirst: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  await supabase
    .from("scraping.proxies")
    .update({ last_used: new Date().toISOString() })
    .eq("id", data.id);

  return data;
}

async function incrementProxyFail(
  supabase: SupabaseClient,
  proxyId: string
): Promise<void> {
  await supabase.rpc("increment_proxy_fail", { proxy_id: proxyId });
}

async function markProxySuccess(
  supabase: SupabaseClient,
  proxyId: string
): Promise<void> {
  await supabase
    .from("scraping.proxies")
    .update({
      fail_count: 0,
      last_success: new Date().toISOString(),
    })
    .eq("id", proxyId);
}

// ─────────────────────────────────────────────────────────────
// RETRY WITH EXPONENTIAL BACKOFF
// ─────────────────────────────────────────────────────────────
async function retryJob(
  supabase: SupabaseClient,
  job: Job,
  errorMsg: string
): Promise<void> {
  const nextAttempt = job.attempts + 1;

  if (nextAttempt >= job.max_attempts) {
    await supabase
      .from("scraping.jobs")
      .update({
        status: "failed",
        attempts: nextAttempt,
        error_msg: errorMsg.substring(0, 500),
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    console.warn(`[FAILED] job ${job.id} exhausted retries`);
    return;
  }

  // Exponential backoff: 2^attempts minutes (2, 4, 8 min)
  const backoffSeconds = Math.pow(2, nextAttempt) * 60;
  const scheduledAt = new Date(Date.now() + backoffSeconds * 1000);

  await supabase
    .from("scraping.jobs")
    .update({
      status: "pending",
      attempts: nextAttempt,
      scheduled_at: scheduledAt.toISOString(),
      error_msg: errorMsg.substring(0, 500),
    })
    .eq("id", job.id);

  console.log(
    `[RETRY] job ${job.id} — attempt ${nextAttempt}, retry in ${backoffSeconds}s`
  );
}

async function markComplete(
  supabase: SupabaseClient,
  jobId: string
): Promise<void> {
  await supabase
    .from("scraping.jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Job {
  id: string;
  keyword: string;
  location: string;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  source: string;
  scheduled_at: string;
}

interface Proxy {
  id: string;
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  protocol: string;
}

interface SERPResult {
  position: number;
  title: string;
  link: string;
  domain: string;
  snippet: string;
  type: "organic" | "featured_snippet" | "paa" | "ads";
}

type SupabaseClient = ReturnType<typeof createClient>;
