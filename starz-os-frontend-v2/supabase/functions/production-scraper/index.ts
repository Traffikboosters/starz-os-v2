import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' }
const SB_URL = Deno.env.get('SUPABASE_URL')!
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY') || ''
const GOOGLE_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY') || ''
const DAILY_CAP = 500
const CACHE_TTL_HOURS = 24
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// Proxy pool — add residential proxies here when available
const PROXY_POOL: string[] = []

// ── DB HELPERS ────────────────────────────────────────────────────────────────
async function dbGet(schema: string, table: string, params = '') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, {
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': schema, 'Content-Profile': schema }
  })
  return res.json()
}

async function dbPost(schema: string, table: string, body: object) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': schema, 'Content-Profile': schema, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(body)
  })
  return res.json()
}

async function dbPatch(schema: string, table: string, filter: string, body: object) {
  await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': schema, 'Content-Profile': schema, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(body)
  })
}

async function dbUpsert(schema: string, table: string, body: object, onConflict: string) {
  await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': schema, 'Content-Profile': schema, 'Content-Type': 'application/json', 'Prefer': `resolution=merge-duplicates,return=minimal`, 'on-conflict': onConflict },
    body: JSON.stringify(body)
  })
}

// ── COST PROTECTION ───────────────────────────────────────────────────────────
async function checkAndIncrementCap(): Promise<{ allowed: boolean; used: number; cap: number }> {
  const today = new Date().toISOString().split('T')[0]
  const rows = await dbGet('scraping', 'usage_limits', `day=eq.${today}`)
  const row = Array.isArray(rows) ? rows[0] : null

  if (!row) {
    await dbPost('scraping', 'usage_limits', { day: today, queries: 1, daily_cap: DAILY_CAP, updated_at: new Date().toISOString() })
    return { allowed: true, used: 1, cap: DAILY_CAP }
  }
  if (row.queries >= row.daily_cap) return { allowed: false, used: row.queries, cap: row.daily_cap }

  await dbPatch('scraping', 'usage_limits', `day=eq.${today}`, { queries: row.queries + 1, updated_at: new Date().toISOString() })
  return { allowed: true, used: row.queries + 1, cap: row.daily_cap }
}

// ── CACHE LAYER ───────────────────────────────────────────────────────────────
async function getCached(keyword: string, location: string) {
  const rows = await dbGet('seo', 'serp_cache', `keyword=eq.${encodeURIComponent(keyword)}&location=eq.${encodeURIComponent(location)}`)
  if (!Array.isArray(rows) || rows.length === 0) return null
  const row = rows[0]
  const age = (Date.now() - new Date(row.fetched_at).getTime()) / 3600000
  if (age > CACHE_TTL_HOURS) return null
  // Increment hit count
  await dbPatch('seo', 'serp_cache', `keyword=eq.${encodeURIComponent(keyword)}&location=eq.${encodeURIComponent(location)}`, { hit_count: (row.hit_count || 0) + 1 })
  return row.results
}

async function setCache(keyword: string, location: string, results: object[]) {
  await dbUpsert('seo', 'serp_cache', {
    keyword, location,
    results,
    fetched_at: new Date().toISOString(),
    hit_count: 1
  }, 'keyword,location')
}

// ── FETCH WITH RETRY ──────────────────────────────────────────────────────────
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.ok || res.status === 400) return res
      if (i < retries - 1) await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (i + 1)))
    } catch(e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (i + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}

// ── SCRAPERS ──────────────────────────────────────────────────────────────────

// Source 1: Google Maps Places API
async function scrapeGoogleMaps(keyword: string, location: string, limit: number) {
  if (!GOOGLE_KEY) return []
  try {
    const q = encodeURIComponent(`${keyword} in ${location}`)
    const res = await fetchWithRetry(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${GOOGLE_KEY}`)
    const data = await res.json()
    if (data.status !== 'OK') return []
    return (data.results || []).slice(0, limit).map((p: any) => ({
      name: p.name,
      place_id: p.place_id,
      rating: p.rating,
      reviews: p.user_ratings_total,
      types: p.types,
      address: p.formatted_address,
      _source: 'google_maps'
    }))
  } catch { return [] }
}

// Source 2: SerpApi — Google Maps results
async function scrapeSerpApiMaps(keyword: string, location: string, limit: number) {
  if (!SERPAPI_KEY) return []
  try {
    const q = encodeURIComponent(`${keyword} ${location}`)
    const res = await fetchWithRetry(`https://serpapi.com/search.json?engine=google_maps&q=${q}&api_key=${SERPAPI_KEY}&type=search`)
    const data = await res.json()
    return (data.local_results || []).slice(0, limit).map((r: any) => ({
      name: r.title,
      place_id: r.place_id || r.data_id,
      rating: r.rating,
      reviews: r.reviews,
      phone: r.phone,
      website: r.website,
      address: r.address,
      types: [r.type || keyword],
      _source: 'serpapi_maps'
    }))
  } catch { return [] }
}

// Source 3: SerpApi — Organic search results
async function scrapeSerpApiOrganic(keyword: string, location: string, limit: number) {
  if (!SERPAPI_KEY) return []
  try {
    const q = encodeURIComponent(`${keyword} ${location}`)
    const res = await fetchWithRetry(`https://serpapi.com/search.json?engine=google&q=${q}&location=${encodeURIComponent(location)}&api_key=${SERPAPI_KEY}&num=${limit}`)
    const data = await res.json()
    const organic = (data.organic_results || []).slice(0, limit).map((r: any) => ({
      name: r.title,
      website: r.link,
      snippet: r.snippet,
      position: r.position,
      _source: 'serpapi_organic'
    }))
    const ads = (data.ads || []).slice(0, 5).map((r: any) => ({
      name: r.title,
      website: r.link,
      snippet: r.snippet,
      _is_ad: true,
      _source: 'serpapi_ads'
    }))
    return [...organic, ...ads]
  } catch { return [] }
}

// Get place details (phone + website) from Google
async function getPlaceDetails(placeId: string): Promise<any> {
  if (!GOOGLE_KEY || !placeId) return {}
  try {
    const res = await fetchWithRetry(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,rating,user_ratings_total&key=${GOOGLE_KEY}`)
    const data = await res.json()
    return data.result || {}
  } catch { return {} }
}

// ── AI SCORING ────────────────────────────────────────────────────────────────
function scoreLeadAI(place: any, detail: any) {
  const website = detail.website || place.website || place._website
  const reviews = detail.user_ratings_total || place.reviews || 0
  const rating = detail.rating || place.rating || 0
  const isAd = place._is_ad === true

  const signals: string[] = []
  if (!website) signals.push('no website')
  if (reviews < 50) signals.push('few reviews')
  if (rating > 0 && rating < 4.0) signals.push('low rating')
  if (isAd) signals.push('running ads — budget available')

  // Score formula
  let score = 50
  if (!website) score += 20  // no website = high need for digital services
  else score += 10
  score += Math.min(20, Math.floor(reviews / 10))
  if (isAd) score += 15  // running ads = has budget
  if (rating >= 4.5) score += 5
  score = Math.min(99, score)

  return {
    score,
    signals,
    priority: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low',
    recommended_offer: !website ? 'Website + SEO Bundle' : isAd ? 'AI Ad Optimization' : 'SEO + Lead Gen'
  }
}

// ── LEAD UPSERT ───────────────────────────────────────────────────────────────
async function upsertLead(lead: any): Promise<boolean> {
  if (!lead.source_id) return false
  const check = await dbGet('crm', 'leads', `source_id=eq.${lead.source_id}&select=id`)
  if (Array.isArray(check) && check.length > 0) return false
  await dbPost('crm', 'leads', lead)
  return true
}

// ── BATCH PROCESSOR ───────────────────────────────────────────────────────────
async function processSingle(keyword: string, location: string, limit: number, engines: string[]) {
  // 1. Check cache first
  const cached = await getCached(keyword, location)
  if (cached) {
    return { source: 'cache', found: cached.length, inserted: 0, skipped: 0, cached: true, results: cached }
  }

  // 2. Check cost cap
  const cap = await checkAndIncrementCap()
  if (!cap.allowed) {
    return { source: 'blocked', found: 0, inserted: 0, skipped: 0, error: `Daily cap reached: ${cap.used}/${cap.cap}` }
  }

  // 3. Run scrapers in priority order with fallback
  let rawResults: any[] = []
  let usedSource = ''

  if (engines.includes('google_maps') && GOOGLE_KEY) {
    rawResults = await scrapeGoogleMaps(keyword, location, limit)
    usedSource = 'google_maps'
  }

  if (rawResults.length === 0 && engines.includes('serpapi_maps') && SERPAPI_KEY) {
    rawResults = await scrapeSerpApiMaps(keyword, location, limit)
    usedSource = 'serpapi_maps'
  }

  if (rawResults.length === 0 && engines.includes('serpapi_organic') && SERPAPI_KEY) {
    rawResults = await scrapeSerpApiOrganic(keyword, location, limit)
    usedSource = 'serpapi_organic'
  }

  if (rawResults.length === 0) {
    return { source: 'none', found: 0, inserted: 0, skipped: 0, error: 'All engines returned 0 results' }
  }

  // 4. Store in serp_cache
  await setCache(keyword, location, rawResults)

  // 5. Store in seo.serp_data
  await dbPost('seo', 'serp_data', {
    keyword, location,
    source: usedSource,
    results: rawResults,
    created_at: new Date().toISOString()
  })

  // 6. Process each result → lead
  let inserted = 0, skipped = 0
  for (const place of rawResults) {
    const detail = (place._source === 'google_maps' && place.place_id) ? await getPlaceDetails(place.place_id) : {}
    const { score, signals, priority, recommended_offer } = scoreLeadAI(place, detail)

    const lead = {
      business_name: place.name,
      name: place.name,
      phone: detail.formatted_phone_number || place.phone || null,
      website_url: detail.website || place.website || null,
      google_rating: detail.rating || place.rating || null,
      google_reviews: detail.user_ratings_total || place.reviews || 0,
      industry: (place.types || [])[0]?.replace(/_/g, ' ') || keyword,
      source: usedSource,
      source_id: place.place_id || place.data_id || `${keyword}_${location}_${place.name}`.replace(/\s+/g, '_').toLowerCase(),
      status: 'new',
      lead_score: score,
      ai_score: score,
      priority_level: priority,
      inferred_pain_points: signals,
      recommended_offer,
      ai_notes: signals.length ? 'Needs: ' + signals.join(', ') : 'Strong candidate for digital marketing',
      normalized: true,
      created_at: new Date().toISOString()
    }

    const wasInserted = await upsertLead(lead)
    if (wasInserted) inserted++; else skipped++
  }

  return { source: usedSource, found: rawResults.length, inserted, skipped, cached: false }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const body = await req.json()
    const action = body.action || 'scrape'
    const engines = body.engines || ['google_maps', 'serpapi_maps', 'serpapi_organic']

    // Single scrape
    if (action === 'scrape') {
      const { keyword, location, limit = 20 } = body
      if (!keyword || !location) return new Response(JSON.stringify({ error: 'keyword and location required' }), { headers: CORS, status: 400 })
      const result = await processSingle(keyword, location, limit, engines)
      return new Response(JSON.stringify({ ok: true, ...result }), { headers: CORS })
    }

    // Batch scrape
    if (action === 'batch') {
      const { queries } = body // [{ keyword, location, limit }]
      if (!queries || !Array.isArray(queries)) return new Response(JSON.stringify({ error: 'queries array required' }), { headers: CORS, status: 400 })
      const results = []
      let totalInserted = 0
      for (const q of queries) {
        const r = await processSingle(q.keyword, q.location, q.limit || 20, engines)
        results.push({ keyword: q.keyword, location: q.location, ...r })
        totalInserted += r.inserted || 0
        // Small delay between requests to avoid rate limiting
        if (!r.cached) await new Promise(resolve => setTimeout(resolve, 500))
      }
      return new Response(JSON.stringify({ ok: true, processed: queries.length, totalInserted, results }), { headers: CORS })
    }

    // Run from queue
    if (action === 'run_queue') {
      const batchSize = body.batch_size || 5
      const jobs = await dbGet('scraping', 'jobs', `status=eq.pending&order=priority.desc&limit=${batchSize}`)
      if (!Array.isArray(jobs) || jobs.length === 0) {
        return new Response(JSON.stringify({ ok: true, message: 'No pending jobs', processed: 0 }), { headers: CORS })
      }
      const results = []
      let totalInserted = 0
      for (const job of jobs) {
        await dbPatch('scraping', 'jobs', `id=eq.${job.id}`, { status: 'running', started_at: new Date().toISOString() })
        try {
          const r = await processSingle(job.keyword, job.location, job.payload?.limit || 20, engines)
          await dbPatch('scraping', 'jobs', `id=eq.${job.id}`, { status: 'completed', completed_at: new Date().toISOString() })
          results.push({ jobId: job.id, keyword: job.keyword, ...r })
          totalInserted += r.inserted || 0
        } catch(e) {
          await dbPatch('scraping', 'jobs', `id=eq.${job.id}`, { status: 'failed', error_msg: (e as Error).message, attempts: (job.attempts || 0) + 1 })
          results.push({ jobId: job.id, status: 'error', error: (e as Error).message })
        }
        if (results[results.length-1]?.cached !== true) await new Promise(r => setTimeout(r, 300))
      }
      return new Response(JSON.stringify({ ok: true, processed: jobs.length, totalInserted, results }), { headers: CORS })
    }

    // Cache stats
    if (action === 'cache_stats') {
      const cache = await dbGet('seo', 'serp_cache', 'order=hit_count.desc&limit=20')
      const today = new Date().toISOString().split('T')[0]
      const usage = await dbGet('scraping', 'usage_limits', `day=eq.${today}`)
      return new Response(JSON.stringify({ ok: true, cache_entries: Array.isArray(cache) ? cache.length : 0, cache, usage: usage[0] || null }), { headers: CORS })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { headers: CORS, status: 400 })
  } catch(e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { headers: CORS, status: 500 })
  }
})