import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Content-Type': 'application/json' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const { keyword, location, limit = 20 } = await req.json()
    if (!keyword || !location) return new Response(JSON.stringify({ error: 'keyword and location required' }), { headers: CORS, status: 400 })

    const MAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
    const SB_URL = Deno.env.get('SUPABASE_URL')
    const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword + ' ' + location)}&key=${MAPS_KEY}`
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()
    const places = (searchData.results || []).slice(0, limit)

    const leads = []
    for (const place of places) {
      const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,user_ratings_total,types&key=${MAPS_KEY}`
      const detailRes = await fetch(detailUrl)
      const detailData = await detailRes.json()
      const detail = detailData.result || {}

      const signals = []
      if (!detail.website) signals.push('no website')
      if ((detail.user_ratings_total || 0) < 50) signals.push('few reviews')
      if ((detail.rating || 0) < 4.0) signals.push('low rating')
      const aiScore = Math.min(99, 50 + (detail.website ? 10 : 20) + Math.min(20, Math.floor((detail.user_ratings_total || 0) / 10)))

      const lead = {
        business_name: place.name,
        name: place.name,
        phone: detail.formatted_phone_number || null,
        website_url: detail.website || null,
        google_rating: detail.rating || null,
        google_reviews: detail.user_ratings_total || 0,
        industry: (place.types || [])[0]?.replace(/_/g, ' ') || keyword,
        source: 'google_maps',
        source_id: place.place_id,
        status: 'new',
        lead_score: aiScore,
        ai_score: aiScore,
        priority_level: aiScore >= 75 ? 'high' : aiScore >= 50 ? 'medium' : 'low',
        inferred_pain_points: signals,
        ai_notes: signals.length ? 'Needs: ' + signals.join(', ') : 'Established business with growth potential',
        normalized: true,
        created_at: new Date().toISOString()
      }
      leads.push(lead)
    }

    let inserted = 0, skipped = 0
    for (const lead of leads) {
      const checkRes = await fetch(`${SB_URL}/rest/v1/leads?source_id=eq.${lead.source_id}&select=id`, {
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': 'crm', 'Content-Profile': 'crm' }
      })
      const existing = await checkRes.json()
      if (existing.length > 0) { skipped++; continue }

      await fetch(`${SB_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Accept-Profile': 'crm', 'Content-Profile': 'crm', 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(lead)
      })
      inserted++
    }

    return new Response(JSON.stringify({ ok: true, found: places.length, inserted, skipped, leads }), { headers: CORS })
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { headers: CORS, status: 500 })
  }
})