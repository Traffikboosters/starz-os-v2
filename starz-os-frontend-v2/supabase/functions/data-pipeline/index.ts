import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' }

const SB_URL = Deno.env.get('SUPABASE_URL')!
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY')
const GOOGLE_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
const DAILY_CAP = 500

async function sb(schema: string, table: string, method = 'GET', body?: object, params = '') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, {
    method,
    headers: {
      'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY,
      'Accept-Profile': schema, 'Content-Profile': schema,
      'Content-Type': 'application/json', 'Prefer': 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return res.json()
}

async function checkCap(): Promise<{ allowed: boolean; used: number; cap: number }> {
  const today = new Date().toISOString().split('T')[0]
  const rows = await sb('scraping', 'usage_limits', 'GET', undefined, `day=eq.${today}`)
  const row = rows[0]
  if (!row) {
    await sb('scraping', 'usage_limits', 'POST', { day: today, queries: 0, daily_cap: DAILY_CAP })
    return { allowed: true, used: 0, cap: DAILY_CAP }
  }
  return { allowed: row.queries < row.daily_cap, used: row.queries, cap: row.daily_cap }
}

async function incrementCap() {
  const today = new Date().toISOString().split('T')[0]
  await fetch(`${SB_URL}/rest/v1/rpc/increment_scraping_usage`, {
    method: 'POST',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_day: today })
  })
}

// Internal scraper using Google Places
async function scrapeInternal(keyword: string, location: string, limit: number) {
  if (!GOOGLE_KEY) return null
  try {
    const query = encodeURIComponent(`${keyword} in ${location}`)
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_KEY}`)
    const data = await res.json()
    if (data.status !== 'OK') return null
    return (data.results || []).slice(0, limit)
  } catch { return null }
}

// SerpApi fallback
async function scrapeSerpApi(keyword: string, location: string, limit: number) {
  if (!SERPAPI_KEY) return null
  try {
    const query = encodeURIComponent(`${keyword} ${location}`)
    const res = await fetch(`https://serpapi.com/search.json?engine=google_maps&q=${query}&api_key=${SERPAPI_KEY}&type=search`)
    const data = await res.json()
    return (data.local_results || []).slice(0, limit).map((r: any) => ({
      name: r.title,
      place_id: r.place_id || r.data_id,
      rating: r.rating,
      user_ratings_total: r.reviews,
      types: [r.type || keyword],
      _phone: r.phone,
      _website: r.website,
      _source: 'serpapi'
    }))
  } catch { return null }
}

async function getPlaceDetails(placeId: string) {
  if (!GOOGLE_KEY) return {}
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,rating,user_ratings_total,types&key=${GOOGLE_KEY}`)
    const data = await res.json()
    return data.result || {}
  } catch { return {} }
}

function scoreLeadAI(place: any, detail: any) {
  const signals: string[] = []
  const website = detail.website || place._website
  const reviews = detail.user_ratings_total || place.user_ratings_total || 0
  const rating = detail.rating || place.rating || 0
  if (!website) signals.push('no website')
  if (reviews < 50) signals.push('few reviews')
  if (rating < 4.0 && rating > 0) signals.push('low rating')
  const score = Math.min(99, 50 + (!website ? 20 : 10) + Math.min(20, Math.floor(reviews / 10)))
  return { score, signals, priority: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low' }
}

async function upsertLead(lead: object) {
  const check = await sb('crm', 'leads', 'GET', undefined, `source_id=eq.${(lead as any).source_id}&select=id`)
  if (Array.isArray(check) && check.length > 0) return false
  await sb('crm', 'leads', 'POST', lead)
  return true
}

async function processBatch(jobs: any[]) {
  const results = []
  for (const job of jobs) {
    const { keyword, location, id: jobId } = job
    const limit = job.payload?.limit || 20

    // Mark job as started
    await fetch(`${SB_URL}/rest/v1/jobs?id=eq.${jobId}`, {
      method: 'PATCH',
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': 'scraping', 'Content-Profile': 'scraping', 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'running', started_at: new Date().toISOString() })
    })

    try {
      // Cap check
      const cap = await checkCap()
      if (!cap.allowed) {
        await fetch(`${SB_URL}/rest/v1/jobs?id=eq.${jobId}`, {
          method: 'PATCH',
          headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': 'scraping', 'Content-Profile': 'scraping', 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: 'paused', error_msg: 'Daily cap reached: ' + cap.used + '/' + cap.cap })
        })
        results.push({ jobId, status: 'cap_reached' })
        continue
      }

      // Hybrid scrape: internal first, SerpApi fallback
      let places = await scrapeInternal(keyword, location, limit)
      let source = 'google_maps'
      if (!places || places.length === 0) {
        places = await scrapeSerpApi(keyword, location, limit)
        source = 'serpapi'
      }
      if (!places || places.length === 0) {
        await fetch(`${SB_URL}/rest/v1/jobs?id=eq.${jobId}`, {
          method: 'PATCH',
          headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': 'scraping', 'Content-Profile': 'scraping', 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: 'failed', error_msg: 'No results from internal or SerpApi' })
        })
        results.push({ jobId, status: 'no_results' })
        continue
      }

      await incrementCap()

      // Store raw results in seo.serp_data
      await sb('seo', 'serp_data', 'POST', {
        keyword, location, source,
        results: places,
        job_id: jobId,
        created_at: new Date().toISOString()
      })

      // Process each place → lead
      let inserted = 0, skipped = 0
      for (const place of places) {
        const detail = place._source === 'serpapi' ? {} : await getPlaceDetails(place.place_id)
        const { score, signals, priority } = scoreLeadAI(place, detail)
        const lead = {
          business_name: place.name,
          name: place.name,
          phone: detail.formatted_phone_number || place._phone || null,
          website_url: detail.website || place._website || null,
          google_rating: detail.rating || place.rating || null,
          google_reviews: detail.user_ratings_total || place.user_ratings_total || 0,
          industry: (place.types || [])[0]?.replace(/_/g, ' ') || keyword,
          source,
          source_id: place.place_id || place.data_id,
          status: 'new',
          lead_score: score,
          ai_score: score,
          priority_level: priority,
          inferred_pain_points: signals,
          ai_notes: signals.length ? 'Needs: ' + signals.join(', ') : 'Established business with growth potential',
          normalized: true,
          created_at: new Date().toISOString()
        }
        const wasInserted = await upsertLead(lead)
        if (wasInserted) inserted++; else skipped++
      }

      // Mark job complete
      await fetch(`${SB_URL}/rest/v1/jobs?id=eq.${jobId}`, {
        method: 'PATCH',
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': 'scraping', 'Content-Profile': 'scraping', 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString(), error_msg: null })
      })

      results.push({ jobId, keyword, location, found: places.length, inserted, skipped, source })
    } catch(e) {
      await fetch(`${SB_URL}/rest/v1/jobs?id=eq.${jobId}`, {
        method: 'PATCH',
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': 'scraping', 'Content-Profile': 'scraping', 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'failed', error_msg: (e as Error).message, attempts: job.attempts + 1 })
      })
      results.push({ jobId, status: 'error', error: (e as Error).message })
    }
  }
  return results
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const body = await req.json()
    const action = body.action || 'run_queue'

    // Action: queue a new batch of jobs
    if (action === 'queue_jobs') {
      const { jobs } = body // [{ keyword, location, priority, limit }]
      if (!jobs || !Array.isArray(jobs)) return new Response(JSON.stringify({ error: 'jobs array required' }), { headers: CORS, status: 400 })
      const inserted = []
      for (const j of jobs) {
        const row = await sb('scraping', 'jobs', 'POST', {
          keyword: j.keyword,
          location: j.location,
          priority: j.priority || 5,
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
          payload: { limit: j.limit || 20 },
          job_type: 'lead_extraction',
          created_at: new Date().toISOString()
        })
        inserted.push(row)
      }
      return new Response(JSON.stringify({ ok: true, queued: inserted.length }), { headers: CORS })
    }

    // Action: run pending jobs from queue
    if (action === 'run_queue') {
      const batchSize = body.batch_size || 5
      const jobs = await sb('scraping', 'jobs', 'GET', undefined, `status=eq.pending&order=priority.desc&limit=${batchSize}`)
      if (!Array.isArray(jobs) || jobs.length === 0) {
        return new Response(JSON.stringify({ ok: true, message: 'No pending jobs', processed: 0 }), { headers: CORS })
      }
      const results = await processBatch(jobs)
      const totalInserted = results.reduce((s: number, r: any) => s + (r.inserted || 0), 0)
      return new Response(JSON.stringify({ ok: true, processed: jobs.length, results, totalInserted }), { headers: CORS })
    }

    // Action: run single job immediately
    if (action === 'run_single') {
      const { keyword, location, limit = 20, priority = 5 } = body
      if (!keyword || !location) return new Response(JSON.stringify({ error: 'keyword and location required' }), { headers: CORS, status: 400 })
      const jobRow = await sb('scraping', 'jobs', 'POST', {
        keyword, location, priority, status: 'pending',
        attempts: 0, max_attempts: 3,
        payload: { limit },
        job_type: 'lead_extraction',
        created_at: new Date().toISOString()
      })
      const job = Array.isArray(jobRow) ? jobRow[0] : jobRow
      const results = await processBatch([{ ...job, keyword, location }])
      return new Response(JSON.stringify({ ok: true, results }), { headers: CORS })
    }

    // Action: get queue status
    if (action === 'queue_status') {
      const [pending, running, completed, failed, cap] = await Promise.all([
        sb('scraping', 'jobs', 'GET', undefined, 'status=eq.pending&select=count'),
        sb('scraping', 'jobs', 'GET', undefined, 'status=eq.running&select=count'),
        sb('scraping', 'jobs', 'GET', undefined, 'status=eq.completed&select=count'),
        sb('scraping', 'jobs', 'GET', undefined, 'status=eq.failed&select=count'),
        checkCap()
      ])
      return new Response(JSON.stringify({ ok: true, pending: pending.length, running: running.length, completed: completed.length, failed: failed.length, cap }), { headers: CORS })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { headers: CORS, status: 400 })
  } catch(e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { headers: CORS, status: 500 })
  }
})