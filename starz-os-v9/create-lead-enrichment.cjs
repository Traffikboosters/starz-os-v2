const fs = require('fs');
const path = require('path');

const DIR = 'C:/Users/mbecn/my-app/starz-os-v9/supabase/functions/lead-enrichment';
fs.mkdirSync(DIR, { recursive: true });

const fn = `import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Content-Type': 'application/json'
}

const SB_URL      = Deno.env.get('SUPABASE_URL')!
const SB_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY') || Deno.env.get('SERP_API_KEY') || ''
const DAILY_CAP   = 500
const BATCH_SIZE  = 50  // leads per run

// ── DB HELPERS (matches production-scraper pattern) ───────────────────────────
async function dbGet(schema: string, table: string, params = '') {
  const res = await fetch(\`\${SB_URL}/rest/v1/\${table}?\${params}\`, {
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Accept-Profile': schema, 'Content-Profile': schema
    }
  })
  return res.json()
}

async function dbPost(schema: string, table: string, body: object) {
  const res = await fetch(\`\${SB_URL}/rest/v1/\${table}\`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Accept-Profile': schema, 'Content-Profile': schema,
      'Content-Type': 'application/json', Prefer: 'return=representation'
    },
    body: JSON.stringify(body)
  })
  return res.json()
}

async function dbPatch(schema: string, table: string, filter: string, body: object) {
  await fetch(\`\${SB_URL}/rest/v1/\${table}?\${filter}\`, {
    method: 'PATCH',
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Accept-Profile': schema, 'Content-Profile': schema,
      'Content-Type': 'application/json', Prefer: 'return=minimal'
    },
    body: JSON.stringify(body)
  })
}

// ── DAILY CAP (shared with production-scraper) ────────────────────────────────
async function checkAndIncrementCap(): Promise<{ allowed: boolean; used: number; cap: number }> {
  const today = new Date().toISOString().split('T')[0]
  const rows  = await dbGet('scraping', 'usage_limits', \`day=eq.\${today}\`)
  const row   = Array.isArray(rows) ? rows[0] : null
  if (!row) {
    await dbPost('scraping', 'usage_limits', { day: today, queries: 1, daily_cap: DAILY_CAP, updated_at: new Date().toISOString() })
    return { allowed: true, used: 1, cap: DAILY_CAP }
  }
  if (row.queries >= row.daily_cap) return { allowed: false, used: row.queries, cap: row.daily_cap }
  await dbPatch('scraping', 'usage_limits', \`day=eq.\${today}\`, { queries: row.queries + 1, updated_at: new Date().toISOString() })
  return { allowed: true, used: row.queries + 1, cap: row.daily_cap }
}

// ── SERPAPI: Google Maps place lookup ─────────────────────────────────────────
async function enrichFromSerpApi(businessName: string, industry: string, phone: string) {
  const query = encodeURIComponent(\`\${businessName} \${industry}\`)
  const url   = \`https://serpapi.com/search.json?engine=google_maps&q=\${query}&type=search&api_key=\${SERPAPI_KEY}\`
  
  try {
    const res  = await fetch(url)
    const data = await res.json()
    
    if (!data.local_results?.length) return null
    
    // Find best match by name similarity or phone
    const results = data.local_results as any[]
    let match = results.find((r: any) =>
      r.phone && phone && r.phone.replace(/\\D/g,'').includes(phone.replace(/\\D/g,'').slice(-7))
    ) || results[0]
    
    if (!match) return null
    
    return {
      website:      match.website || null,
      rating:       match.rating  || null,
      review_count: match.reviews || null,
      address:      match.address || null,
      place_id:     match.place_id || null,
    }
  } catch (e) {
    console.error('SerpApi error:', e)
    return null
  }
}

// ── RESCORE after enrichment ──────────────────────────────────────────────────
async function rescoreLead(leadId: string) {
  // Call the DB scoring function directly via RPC
  await fetch(\`\${SB_URL}/rest/v1/rpc/rescore_single_lead\`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_lead_id: leadId })
  })
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const batchSize = body.batch_size || BATCH_SIZE
    const forceAll  = body.force_all  || false

    // 1. Check SerpApi cap
    const cap = await checkAndIncrementCap()
    if (!cap.allowed) {
      return new Response(JSON.stringify({
        error: 'Daily SerpApi cap reached',
        used: cap.used, cap: cap.cap
      }), { status: 429, headers: CORS })
    }

    // 2. Select leads that need enrichment (no website AND no rating)
    const filter = forceAll
      ? \`status=eq.qualified&limit=\${batchSize}&order=score.desc\`
      : \`status=eq.qualified&website=is.null&rating=is.null&limit=\${batchSize}&order=score.desc\`
    
    const leads = await dbGet('public', 'leads', 
      \`select=id,business_name,phone,industry,score,website,rating,review_count&\${filter}\`
    )

    if (!Array.isArray(leads) || leads.length === 0) {
      return new Response(JSON.stringify({
        message: 'No leads need enrichment',
        total: 0
      }), { headers: CORS })
    }

    console.log(\`Enriching \${leads.length} leads...\`)

    // 3. Enrich each lead
    const results = { enriched: 0, failed: 0, skipped: 0 }
    
    for (const lead of leads) {
      // Check cap before each call
      const capCheck = await checkAndIncrementCap()
      if (!capCheck.allowed) {
        console.log('Cap reached mid-batch, stopping')
        break
      }

      const enriched = await enrichFromSerpApi(
        lead.business_name || '',
        lead.industry      || '',
        lead.phone         || ''
      )

      if (!enriched) { results.skipped++; continue }

      // 4. Write enrichment data back to lead
      const updatePayload: any = {
        enriched_at: new Date().toISOString()
      }
      if (enriched.website)      updatePayload.website      = enriched.website
      if (enriched.rating)       updatePayload.rating       = enriched.rating
      if (enriched.review_count) updatePayload.review_count = enriched.review_count

      await dbPatch('public', 'leads', \`id=eq.\${lead.id}\`, updatePayload)

      // 5. Re-run scoring now that we have real data
      // Use the original score_lead function (text version) with enriched data
      const newScore = calculateEnrichedScore(
        enriched.website,
        enriched.review_count,
        enriched.rating,
        lead.industry
      )

      await dbPatch('public', 'leads', \`id=eq.\${lead.id}\`, {
        score: newScore,
        priority_level: newScore >= 80 ? 'critical' : newScore >= 60 ? 'high' : 'low',
        disposition: newScore >= 80 ? 'hot_handoff' : newScore >= 60 ? 'handoff_ready' : 'nurture',
        status: newScore >= 60 ? 'qualified' : 'unqualified',
        next_best_action: newScore >= 80 ? 'call_now' : newScore >= 60 ? 'email_followup' : 'skip',
        ai_notes: generateAiNotes(newScore, enriched, lead.industry),
      })

      results.enriched++
      
      // Rate limit: 1 req/sec to avoid SerpApi throttling
      await new Promise(r => setTimeout(r, 1100))
    }

    return new Response(JSON.stringify({
      message: 'Enrichment complete',
      ...results,
      total: leads.length,
      serpapi_used: cap.used,
      serpapi_remaining: cap.cap - cap.used
    }), { headers: CORS })

  } catch (err) {
    console.error('Enrichment error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: CORS
    })
  }
})

// ── FINAL SCORE with enriched data (combines intent + pain signals) ────────────
function calculateEnrichedScore(
  website: string | null,
  reviewCount: number | null,
  rating: number | null,
  industry: string | null
): number {
  let score = 40 // base

  // Industry tier (commercial intent)
  const ind = (industry || '').toLowerCase()
  if (ind.match(/roof|solar|hvac|plumb/))          score += 25
  else if (ind.match(/dental|attorney|law|medspa/)) score += 20
  else if (ind.match(/electric|landscap|pest/))      score += 15
  else                                               score += 5

  // Pain signals (SEO opportunity)
  if (!website || website.trim() === '')    score += 20  // no website = high pain
  else                                      score -= 5   // has website = less urgent

  if ((reviewCount || 0) < 20)             score += 15  // low reviews = trust problem
  else if ((reviewCount || 0) > 200)       score -= 10  // very established = harder close

  if ((rating || 5) < 4.0)                score += 15  // bad rating = reputation pain
  else if ((rating || 5) >= 4.5)          score -= 5   // great rating = less urgency

  return Math.min(Math.max(score, 0), 100)
}

function generateAiNotes(score: number, enriched: any, industry: string | null): string {
  const parts = []
  
  if (!enriched.website)     parts.push('No website detected — high digital pain')
  else                       parts.push(\`Website: \${enriched.website}\`)
  
  if (enriched.rating)       parts.push(\`Google rating: \${enriched.rating}★ (\${enriched.review_count || 0} reviews)\`)
  else                       parts.push('No Google reviews found — reputation opportunity')
  
  if (score >= 80)      parts.push('🔥 HOT: Call immediately')
  else if (score >= 60) parts.push('🌡️ WARM: Email + follow-up call')
  else                  parts.push('❄️ COLD: Nurture sequence')

  return \`[Enriched Score \${score}] \${parts.join(' | ')}\`
}
`;

fs.writeFileSync(path.join(DIR, 'index.ts'), Buffer.from(fn, 'utf8'));
console.log('✅ Created: supabase/functions/lead-enrichment/index.ts');
console.log('\nNext — deploy:');
console.log('npx supabase functions deploy lead-enrichment --project-ref szguizvpiiuiyugrjeks');
