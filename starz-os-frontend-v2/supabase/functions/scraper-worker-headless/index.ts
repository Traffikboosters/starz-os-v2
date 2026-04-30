// ============================================================
// STARZ-OS — scraper-worker-headless (Phase 3)
// Playwright cluster + Google Maps + Ads + CAPTCHA handling
// Deploy: supabase functions deploy scraper-worker-headless
//
// ⚠️  IMPORTANT: Deno Edge Functions have a 2MB size limit and
// cannot install native binaries (Playwright requires Chromium).
// Phase 3 MUST run on a separate service. Two options:
//   A) Docker container on Railway/Fly.io (recommended)
//   B) Deno Deploy with --allow-run and a pre-built Chromium layer
//
// This file is the WORKER LOGIC — deploy Option A below.
// ============================================================

// ─────────────────────────────────────────────────────────────
// OPTION A — Docker-ready Node.js worker
// Dockerfile at bottom of this file (as comments)
// ─────────────────────────────────────────────────────────────

import { chromium, Browser, BrowserContext, Page } from "playwright";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BATCH_SIZE = 3; // Smaller — headless is heavier
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min for headless (fresher)

// ─────────────────────────────────────────────────────────────
// BROWSER FINGERPRINT ROTATION
// ─────────────────────────────────────────────────────────────
const FINGERPRINTS = [
  {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
    timezone: "America/New_York",
  },
  {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezone: "America/Chicago",
  },
  {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    viewport: { width: 1680, height: 1050 },
    locale: "en-US",
    timezone: "America/Los_Angeles",
  },
];

function randomFingerprint() {
  return FINGERPRINTS[Math.floor(Math.random() * FINGERPRINTS.length)];
}

// ─────────────────────────────────────────────────────────────
// BROWSER POOL
// ─────────────────────────────────────────────────────────────
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  browserInstance = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
  });

  return browserInstance;
}

async function newStealthContext(
  browser: Browser,
  proxy?: ProxyConfig
): Promise<BrowserContext> {
  const fp = randomFingerprint();

  const contextOptions: Parameters<Browser["newContext"]>[0] = {
    userAgent: fp.userAgent,
    viewport: fp.viewport,
    locale: fp.locale,
    timezoneId: fp.timezone,
    permissions: ["geolocation"],
    geolocation: { latitude: 25.7617, longitude: -80.1918 }, // Miami
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      "sec-ch-ua":
        '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "Upgrade-Insecure-Requests": "1",
    },
  };

  if (proxy) {
    contextOptions.proxy = {
      server: `${proxy.protocol}://${proxy.host}:${proxy.port}`,
      username: proxy.username ?? undefined,
      password: proxy.password ?? undefined,
    };
  }

  const ctx = await browser.newContext(contextOptions);

  // Remove automation fingerprints
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
    // @ts-ignore
    window.chrome = {
      runtime: {},
      loadTimes: function () {},
      csi: function () {},
      app: {},
    };
  });

  return ctx;
}

// ─────────────────────────────────────────────────────────────
// MAIN WORKER LOOP
// ─────────────────────────────────────────────────────────────
async function runWorker(): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Cost gate
  const { data: withinLimit } = await supabase.rpc("check_limit");
  if (!withinLimit) {
    console.log("[LIMIT] Daily SERP limit reached");
    return;
  }

  // Get pending jobs tagged for headless
  const { data: jobs } = await supabase
    .from("scraping.jobs")
    .select("*")
    .in("status", ["pending"])
    .in("source", ["headless", "maps", "ads"]) // headless-specific job types
    .order("priority", { ascending: false })
    .limit(BATCH_SIZE);

  if (!jobs || jobs.length === 0) {
    console.log("[IDLE] No headless jobs");
    return;
  }

  const browser = await getBrowser();

  for (const job of jobs) {
    await processHeadlessJob(supabase, browser, job);
  }
}

// ─────────────────────────────────────────────────────────────
// HEADLESS JOB ROUTER
// ─────────────────────────────────────────────────────────────
async function processHeadlessJob(
  supabase: SupabaseClient,
  browser: Browser,
  job: Job
): Promise<void> {
  await supabase
    .from("scraping.jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", job.id);

  const proxy = await getProxy(supabase);
  let ctx: BrowserContext | null = null;

  try {
    ctx = await newStealthContext(browser, proxy ?? undefined);
    const page = await ctx.newPage();

    let results: unknown[] = [];

    if (job.source === "maps") {
      results = await scrapeGoogleMaps(page, job.keyword, job.location);
    } else if (job.source === "ads") {
      results = await scrapeGoogleAds(page, job.keyword);
    } else {
      results = await scrapeHeadlessSERP(page, job.keyword, job.location);
    }

    if (proxy) await markProxySuccess(supabase, proxy.id);

    await supabase.from("seo.serp_data").insert({
      keyword: job.keyword,
      location: job.location,
      results,
      source: `headless_${job.source ?? "serp"}`,
      job_id: job.id,
    });

    await supabase
      .from("scraping.jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    console.log(`[HEADLESS] ${job.keyword} — ${results.length} results`);
  } catch (err) {
    console.error(`[HEADLESS ERROR] ${job.keyword}:`, err);
    if (proxy) await incrementProxyFail(supabase, proxy.id);
    await retryJob(supabase, job, String(err));
  } finally {
    await ctx?.close();
  }
}

// ─────────────────────────────────────────────────────────────
// HEADLESS SERP (full page, JS-rendered)
// ─────────────────────────────────────────────────────────────
async function scrapeHeadlessSERP(
  page: Page,
  keyword: string,
  location: string
): Promise<SERPResult[]> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=en&num=10`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

  // Human-like delay: 1–3 seconds
  await page.waitForTimeout(1000 + Math.random() * 2000);

  // CAPTCHA detection
  const isCaptcha = await page
    .$eval("body", (el: Element) =>
      el.innerHTML.includes("captcha") ||
      el.innerHTML.includes("unusual traffic") ||
      el.innerHTML.includes("I'm not a robot")
    )
    .catch(() => false);

  if (isCaptcha) {
    throw new Error("CAPTCHA detected — rotating proxy on next attempt");
  }

  // Extract organic results
  const results = await page.$$eval(
    "div.g, div[data-sokoban-container]",
    (nodes: Element[]) => {
      return nodes
        .map((node: Element, i: number) => {
          const titleEl = node.querySelector("h3");
          const linkEl = node.querySelector("a[href]");
          const snippetEl = node.querySelector(
            ".VwiC3b, .IsZvec, .lEBKkf, [data-sncf], span.aCOpRe"
          );

          if (!titleEl || !linkEl) return null;

          const href = (linkEl as HTMLAnchorElement).href;
          if (!href.startsWith("http")) return null;

          return {
            position: i + 1,
            title: titleEl.innerText.trim(),
            link: href,
            domain: new URL(href).hostname.replace(/^www\./, ""),
            snippet: snippetEl ? (snippetEl as HTMLElement).innerText.trim().substring(0, 300) : "",
            type: "organic",
          };
        })
        .filter(Boolean)
        .slice(0, 10);
    }
  );

  return results as SERPResult[];
}

// ─────────────────────────────────────────────────────────────
// GOOGLE MAPS SCRAPER (Phase 3)
// ─────────────────────────────────────────────────────────────
async function scrapeGoogleMaps(
  page: Page,
  keyword: string,
  location: string
): Promise<MapsResult[]> {
  const query = `${keyword} ${location}`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

  await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000 + Math.random() * 2000);

  // Scroll to load more results
  const resultsPanel = await page.$('[role="feed"]');
  if (resultsPanel) {
    for (let i = 0; i < 3; i++) {
      await resultsPanel.evaluate((el: Element) =>
        el.scrollBy(0, 500)
      );
      await page.waitForTimeout(1000);
    }
  }

  const listings = await page.$$eval(
    'a[href*="/maps/place/"]',
    (nodes: Element[]) => {
      const seen = new Set<string>();
      return nodes
        .map((node: Element) => {
          const anchor = node as HTMLAnchorElement;
          const name = anchor.querySelector(
            ".qBF1Pd, .fontHeadlineSmall, [jsan*=fontHeadline]"
          );
          const rating = anchor.querySelector(".MW4etd");
          const reviews = anchor.querySelector(".UY7F9");
          const address = anchor.querySelector(".W4Efsd span:last-child");
          const phone = anchor.querySelector('[data-dtype="d3ph"]');
          const category = anchor.querySelector(".W4Efsd:first-child");

          const nameText = (name as HTMLElement)?.innerText?.trim() ?? "";
          if (!nameText || seen.has(nameText)) return null;
          seen.add(nameText);

          const href = anchor.href;
          // Extract Place ID from URL
          const placeMatch = href.match(/place\/([^/]+)/);

          return {
            name: nameText,
            rating: parseFloat((rating as HTMLElement)?.innerText ?? "0") || null,
            reviews: (reviews as HTMLElement)?.innerText?.replace(/[()]/g, "").trim() ?? null,
            address: (address as HTMLElement)?.innerText?.trim() ?? null,
            phone: (phone as HTMLElement)?.innerText?.trim() ?? null,
            category: (category as HTMLElement)?.innerText?.split("·")[0]?.trim() ?? null,
            maps_url: href.split("?")[0],
            place_id: placeMatch ? placeMatch[1] : null,
            type: "maps_listing",
          };
        })
        .filter(Boolean)
        .slice(0, 20);
    }
  );

  return listings as MapsResult[];
}

// ─────────────────────────────────────────────────────────────
// GOOGLE ADS INTELLIGENCE (Phase 3)
// ─────────────────────────────────────────────────────────────
async function scrapeGoogleAds(
  page: Page,
  keyword: string
): Promise<AdsResult[]> {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=en`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1500 + Math.random() * 1500);

  const ads = await page.$$eval(
    '[data-text-ad], .uEierd, div[aria-label="Ads"]',
    (nodes: Element[]) => {
      return nodes
        .map((node: Element, i: number) => {
          const titleEl = node.querySelector(
            ".cfxYMc, .CCgQ5, [role=heading]"
          );
          const urlEl = node.querySelector(".qzEoUe, .UdQCqe");
          const descEl = node.querySelector(".MUxGbd, .yDYNvb");
          const sponsorLabel = node.querySelector(".uEierd-1niv61-mkwWKc");

          const title = (titleEl as HTMLElement)?.innerText?.trim() ?? "";
          if (!title) return null;

          return {
            position: i + 1,
            title,
            display_url: (urlEl as HTMLElement)?.innerText?.trim() ?? "",
            description:
              (descEl as HTMLElement)?.innerText?.trim().substring(0, 300) ??
              "",
            is_sponsored: !!sponsorLabel || node.innerHTML.includes("Sponsored"),
            type: "paid_ad",
          };
        })
        .filter(Boolean)
        .slice(0, 5);
    }
  );

  return ads as AdsResult[];
}

// ─────────────────────────────────────────────────────────────
// SHARED HELPERS
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
  const { data } = await supabase
    .from("scraping.proxies")
    .select("fail_count")
    .eq("id", proxyId)
    .single();

  await supabase
    .from("scraping.proxies")
    .update({ fail_count: (data?.fail_count ?? 0) + 1 })
    .eq("id", proxyId);
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

async function retryJob(
  supabase: SupabaseClient,
  job: Job,
  errorMsg: string
): Promise<void> {
  const nextAttempt = job.attempts + 1;

  if (nextAttempt >= job.max_attempts) {
    await supabase
      .from("scraping.jobs")
      .update({ status: "failed", attempts: nextAttempt, error_msg: errorMsg.substring(0, 500), completed_at: new Date().toISOString() })
      .eq("id", job.id);
    return;
  }

  const backoffSeconds = Math.pow(2, nextAttempt) * 60;
  await supabase
    .from("scraping.jobs")
    .update({
      status: "pending",
      attempts: nextAttempt,
      scheduled_at: new Date(Date.now() + backoffSeconds * 1000).toISOString(),
      error_msg: errorMsg.substring(0, 500),
    })
    .eq("id", job.id);
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Job {
  id: string;
  keyword: string;
  location: string;
  status: string;
  source: string;
  priority: number;
  attempts: number;
  max_attempts: number;
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

interface ProxyConfig {
  host: string;
  port: number;
  username?: string | null;
  password?: string | null;
  protocol: string;
}

interface SERPResult {
  position: number;
  title: string;
  link: string;
  domain: string;
  snippet: string;
  type: string;
}

interface MapsResult {
  name: string;
  rating: number | null;
  reviews: string | null;
  address: string | null;
  phone: string | null;
  category: string | null;
  maps_url: string;
  place_id: string | null;
  type: string;
}

interface AdsResult {
  position: number;
  title: string;
  display_url: string;
  description: string;
  is_sponsored: boolean;
  type: string;
}

// ─────────────────────────────────────────────────────────────
// ENTRY POINT (run as long-running process, not serverless)
// ─────────────────────────────────────────────────────────────
(async () => {
  console.log("[STARZ-OS] Headless SERP Worker starting...");

  // Poll every 30 seconds
  const POLL_INTERVAL_MS = 30000;

  while (true) {
    try {
      await runWorker();
    } catch (err) {
      console.error("[WORKER ERROR]", err);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
})();

// ─────────────────────────────────────────────────────────────
// DOCKERFILE (copy to /scraper-worker-headless/Dockerfile)
// ─────────────────────────────────────────────────────────────
/*
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

ENV SUPABASE_URL=""
ENV SUPABASE_SERVICE_ROLE_KEY=""

CMD ["node", "index.js"]
*/

// package.json:
/*
{
  "name": "starz-serp-headless",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2.43.4",
    "playwright": "^1.44.0"
  }
}
*/
