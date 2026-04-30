// ============================================================
// STARZ-OS — scraper-worker Edge Function
// SerpApi integration — real SERP data, no CAPTCHA
// Deploy: supabase functions deploy scraper-worker
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY") ?? "d89fab76fa392aacff9d5a2683da394885766a9001781dfac1173f1ca92484f9";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const BATCH_SIZE = 5;

// ─────────────────────────────────────────────────────────────
// SCHEMA-SCOPED CLIENTS
// ─────────────────────────────────────────────────────────────
function getClients() {
  const base = { auth: { persistSession: false } };

  const publicClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, base);

  const scrapingClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    ...base,
    db: { schema: "scraping" },
  });

  const seoClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    ...base,
    db: { schema: "seo" },
  });

  return { publicClient, scrapingClient, seoClient };
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { publicClient, scrapingClient, seoClient } = getClients();

  // ── Cost gate ──────────────────────────────────────────────
  const { data: withinLimit, error: limitErr } = await publicClient.rpc("check_limit");

  if (limitErr) {
    console.error("Limit check error:", limitErr.message);
    return new Response(JSON.stringify({ error: "Limit check failed", detail: limitErr.message }), {
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
  const { data: jobs, error: jobErr } = await scrapingClient
    .from("jobs")
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
    jobs.map((job: Job) => processJob(publicClient, scrapingClient, seoClient, job))
  );

  const summary = results.map((r, i) => ({
    jobId: jobs[i].id,
    keyword: jobs[i].keyword,
    status: r.status,
    reason: r.status === "rejected" ? String((r as PromiseRejectedResult).reason) : undefined,
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
async function processJob(
  publicClient: SupabaseClient,
  scrapingClient: SupabaseClient,
  seoClient: SupabaseClient,
  job: Job
): Promise<void> {
  await scrapingClient
    .from("jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", job.id);

  try {
    // ── 1. Cache check ──────────────────────────────────────
    const { data: cached } = await seoClient
      .from("serp_cache")
      .select("results, fetched_at, hit_count")
      .eq("keyword", job.keyword)
      .eq("location", job.location)
      .maybeSingle();

    const cacheAge = cached
      ? Date.now() - new Date(cached.fetched_at).getTime()
      : Infinity;

    if (cached && cacheAge < CACHE_TTL_MS) {
      await seoClient.from("serp_data").insert({
        keyword: job.keyword,
        location: job.location,
        results: cached.results,
        source: "cache",
        job_id: job.id,
      });

      await seoClient
        .from("serp_cache")
        .update({ hit_count: (cached.hit_count ?? 0) + 1 })
        .eq("keyword", job.keyword)
        .eq("location", job.location);

      await markComplete(scrapingClient, job.id);
      console.log(`[CACHE HIT] ${job.keyword}`);
      return;
    }

    // ── 2. Fetch from SerpApi ───────────────────────────────
    const serpData = await fetchSerpApi(job.keyword, job.location);

    // ── 3. Parse into standard format ──────────────────────
    const parsed = parseSerpApiResponse(serpData);

    if (parsed.length === 0) {
      throw new Error("SerpApi returned 0 results");
    }

    // ── 4. Store results ────────────────────────────────────
    await seoClient.from("serp_data").insert({
      keyword: job.keyword,
      location: job.location,
      results: parsed,
      source: "serpapi",
      job_id: job.id,
    });

    // ── 5. Update cache ─────────────────────────────────────
    await seoClient.from("serp_cache").upsert(
      {
        keyword: job.keyword,
        location: job.location,
        results: parsed,
        fetched_at: new Date().toISOString(),
        hit_count: 0,
      },
      { onConflict: "keyword,location" }
    );

    // ── 6. Increment usage counter ──────────────────────────
    await publicClient.rpc("check_and_increment_limit");

    await markComplete(scrapingClient, job.id);
    console.log(`[SCRAPED] ${job.keyword} — ${parsed.length} results`);

  } catch (err) {
    console.error(`[ERROR] job ${job.id} — ${job.keyword}:`, err);
    await retryJob(scrapingClient, job, String(err));
  }
}

// ─────────────────────────────────────────────────────────────
// SERPAPI FETCH
// ─────────────────────────────────────────────────────────────
async function fetchSerpApi(keyword: string, location: string): Promise<SerpApiResponse> {
  const gl = locationToGL(location);
  const hl = locationToLang(location);

  const params = new URLSearchParams({
    engine: "google",
    q: keyword,
    location: location === "United States" ? "United States" : location,
    gl,
    hl,
    num: "10",
    api_key: SERPAPI_KEY,
  });

  const url = `https://serpapi.com/search?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`SerpApi error ${res.status}: ${errText}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ─────────────────────────────────────────────────────────────
// SERPAPI RESPONSE PARSER
// Maps SerpApi JSON into STARZ-OS standard SERPResult format
// ─────────────────────────────────────────────────────────────
function parseSerpApiResponse(data: SerpApiResponse): SERPResult[] {
  const results: SERPResult[] = [];

  // ── Organic results ─────────────────────────────────────────
  if (data.organic_results) {
    for (const item of data.organic_results) {
      results.push({
        position: item.position ?? results.length + 1,
        title: item.title ?? "",
        link: item.link ?? "",
        domain: extractDomain(item.link ?? ""),
        snippet: item.snippet ?? "",
        displayed_link: item.displayed_link ?? "",
        type: "organic",
      });
    }
  }

  // ── Featured snippet ────────────────────────────────────────
  if (data.answer_box) {
    const box = data.answer_box;
    results.unshift({
      position: 0,
      title: box.title ?? "Featured Snippet",
      link: box.link ?? "",
      domain: extractDomain(box.link ?? ""),
      snippet: box.answer ?? box.snippet ?? box.result ?? "",
      displayed_link: box.displayed_link ?? "",
      type: "featured_snippet",
    });
  }

  // ── People Also Ask ─────────────────────────────────────────
  if (data.related_questions && data.related_questions.length > 0) {
    const questions = data.related_questions.slice(0, 4).map((q) => q.question).join(" | ");
    results.push({
      position: -1,
      title: "People Also Ask",
      link: "",
      domain: "",
      snippet: questions,
      displayed_link: "",
      type: "paa",
    });
  }

  // ── Related searches ────────────────────────────────────────
  if (data.related_searches && data.related_searches.length > 0) {
    const searches = data.related_searches.slice(0, 8).map((s) => s.query).join(" | ");
    results.push({
      position: -2,
      title: "Related Searches",
      link: "",
      domain: "",
      snippet: searches,
      displayed_link: "",
      type: "related",
    });
  }

  // ── Ads (top) ───────────────────────────────────────────────
  if (data.ads) {
    for (const ad of data.ads.slice(0, 3)) {
      results.push({
        position: -3,
        title: ad.title ?? "",
        link: ad.link ?? "",
        domain: extractDomain(ad.link ?? ""),
        snippet: ad.description ?? "",
        displayed_link: ad.displayed_link ?? "",
        type: "ad",
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
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
    "United Kingdom": "en-gb",
    "Canada": "en-ca",
    "Australia": "en-au",
  };
  return map[location] ?? "en";
}

function locationToGL(location: string): string {
  const map: Record<string, string> = {
    "United States": "us",
    "United Kingdom": "gb",
    "Canada": "ca",
    "Australia": "au",
  };
  return map[location] ?? "us";
}

// ─────────────────────────────────────────────────────────────
// RETRY WITH EXPONENTIAL BACKOFF
// ─────────────────────────────────────────────────────────────
async function retryJob(
  scrapingClient: SupabaseClient,
  job: Job,
  errorMsg: string
): Promise<void> {
  const nextAttempt = job.attempts + 1;

  if (nextAttempt >= job.max_attempts) {
    await scrapingClient
      .from("jobs")
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

  const backoffSeconds = Math.pow(2, nextAttempt) * 60;
  const scheduledAt = new Date(Date.now() + backoffSeconds * 1000);

  await scrapingClient
    .from("jobs")
    .update({
      status: "pending",
      attempts: nextAttempt,
      scheduled_at: scheduledAt.toISOString(),
      error_msg: errorMsg.substring(0, 500),
    })
    .eq("id", job.id);

  console.log(`[RETRY] job ${job.id} — attempt ${nextAttempt}, retry in ${backoffSeconds}s`);
}

async function markComplete(scrapingClient: SupabaseClient, jobId: string): Promise<void> {
  await scrapingClient
    .from("jobs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
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

interface SERPResult {
  position: number;
  title: string;
  link: string;
  domain: string;
  snippet: string;
  displayed_link: string;
  type: "organic" | "featured_snippet" | "paa" | "related" | "ad";
}

interface SerpApiResponse {
  organic_results?: Array<{
    position: number;
    title: string;
    link: string;
    displayed_link: string;
    snippet: string;
  }>;
  answer_box?: {
    title?: string;
    link?: string;
    displayed_link?: string;
    answer?: string;
    snippet?: string;
    result?: string;
  };
  related_questions?: Array<{ question: string }>;
  related_searches?: Array<{ query: string }>;
  ads?: Array<{
    title: string;
    link: string;
    displayed_link: string;
    description: string;
  }>;
}

type SupabaseClient = ReturnType<typeof createClient>;
