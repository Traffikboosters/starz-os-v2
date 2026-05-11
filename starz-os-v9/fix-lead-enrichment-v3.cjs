const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/supabase/functions/lead-enrichment/index.ts';

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

// ── DB HELPERS (service role — bypasses RLS) ──────────────────────────────────
const SERVICE_HEADERS = {
  apikey: SB_KEY,
  Authorization: 'Bearer ' + SB_KEY,
  'Content-Type': 'application/json',
}

async function dbGet(table: string, params = '') {
  const res = await fetch(\`\${SB_URL}/rest/v1/\${table}?\${params}\`, {
    headers: { ...SERVICE_HEADERS, 'Accept-Profile': 'public' }
  })
  return res.json()
}

async function dbPatchPublic(table: string, filter: string, body: object) {
  const res = await fetch(\`\${SB_URL}/rest/v1/\${table}?\${filter}\`, {
    method: 'PATCH',
    headers: { ...SERVICE_HEADERS, 'Accept-Profile': 'public', 'Content-Profile': 'public', Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(\`PATCH failed: \${res.status} \${err}\`)
  }
}

async function dbGetScraping(table: string, params = '') {
  const res = await fetch(\`\${SB_URL}/rest/v1/\${table}?\${params}\`, {
    headers: { ...SERVICE_HEADERS, 'Accept-Profile': 'scraping' }
  })
  return res.json()
}

async function dbPostScraping(table: string, body: object) {
  await fetch(\`\${SB_URL}/rest/v1/\${table}\`, {
    method: 'POST',
    headers: { ...SERVICE_HEADERS, 'Accept-Profile': 'scraping', 'Content-Profile': 'scraping', Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  })
}

async function dbPatchScraping(table: string, filter: string, body: object) {
  await fetch(\`\${SB_URL}/rest/v1/\${table}?\${filter}\`, {
    method: 'PATCH',
    headers: { ...SERVICE_HEADERS, 'Accept-Profile': 'scraping', 'Content-Profile': 'scraping', Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  })
}

// ── DAILY CAP ────────────────────────────────────────────────────────────────
async function checkAndIncrementCap(): Promise<{ allowed: boolean; used: number; cap: number }> {
  const today = new Date().toISOString().split('T')[0]
  const rows  = await dbGetScraping('usage_limits', \`day=eq.\${today}\`)
  const row   = Array.isArray(rows) ? rows[0] : null
  if (!row) {
    await dbPostScraping('usage_limits', { day: today, queries: 1, daily_cap: DAILY_CAP, updated_at: new Date().toISOString() })
    return { allowed: true, used: 1, cap: DAILY_CAP }
  }
  if (row.queries >= row.daily_cap) return { allowed: false, used: row.queries, cap: row.daily_cap }
  await dbPatchScraping('usage_limits', \`day=eq.\${today}\`, { queries: row.queries + 1, updated_at: new Date().toISOString() })
  return { allowed: true, used: row.queries + 1, cap: row.daily_cap }
}

// ── SERPAPI ───────────────────────────────────────────────────────────────────
async function enrichFromSerpApi(businessName: string, industry: string, phone: string) {
  const query = encodeURIComponent(\`\${businessName} \${industry}\`)
  const url   = \`https://serpapi.com/search.json?engine=google_maps&q=\${query}&type=search&api_key=\${SERPAPI_KEY}\`
  try {
    const res  = await fetch(url)
    const data = await res.json()
    if (!data.local_results?.length) return null
    const results = data.local_results as any[]
    const match = results.find((r: any) =>
      r.phone && phone && r.phone.replace(/\\D/g,'').includes(phone.replace(/\\D/g,'').slice(-7))
    ) || results[0]
    if (!match) return null
    return {
      website:      match.website || null,
      rating:       typeof match.rating === 'number' ? match.rating : null,
      review_count: typeof match.reviews === 'number' ? match.reviews : null,
    }
  } catch (e) {
    console.error('SerpApi error:', e)
    return null
  }
}

// ── SCORING ───────────────────────────────────────────────────────────────────
function calculateEnrichedScore(website: string|null, reviewCount: number|null, rating: number|null, industry: string|null): number {
  let score = 40
  const ind = (industry || '').toLowerCase()
  if (ind.match(/roof|solar|hvac|plumb/))           score += 25
  else if (ind.match(/dental|attorney|law|medspa/)) score += 20
  else if (ind.match(/electric|landscap|pest/))     score += 15
  else                                              score += 5
  if (!website || website.trim() === '') score += 20
  else                                   score -= 5
  if ((reviewCount || 0) < 20)          score += 15
  else if ((reviewCount || 0) > 200)    score -= 10
  if ((rating || 5) < 4.0)             score += 15
  else if ((rating || 5) >= 4.5)       score -= 5
  return Math.min(Math.max(score, 0), 100)
}

function generateAiNotes(score: number, enriched: any, industry: string|null): string {
  const parts = []
  if (!enriched.website) parts.push('No website — high digital pain')
  else parts.push(\`Website: \${enriched.website}\`)
  if (enriched.rating)   parts.push(\`Google: \${enriched.rating}★ (\${enriched.review_count||0} reviews)\`)
  else                   parts.push('No Google reviews found')
  if (score >= 80)       parts.push('🔥 HOT: Call immediately')
  else if (score >= 60)  parts.push('🌡️ WARM: Email + follow-up')
  else                   parts.push('❄️ COLD: Nurture sequence')
  return \`[Enriched \${score}] \${parts.join(' | ')}\`
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body      = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const batchSize = body.batch_size || 50

    const cap = await checkAndIncrementCap()
    if (!cap.allowed) {
      return new Response(JSON.stringify({ error: 'Daily SerpApi cap reached', used: cap.used, cap: cap.cap }), { status: 429, headers: CORS })
    }

    // Select leads without enrichment data
    const leads = await dbGet('leads',
      \`select=id,business_name,phone,industry,score&status=eq.qualified&enriched_at=is.null&phone=not.is.null&limit=\${batchSize}&order=score.desc\`
    )

    if (!Array.isArray(leads) || leads.length === 0) {
      return new Response(JSON.stringify({ message: 'No leads need enrichment', total: 0 }), { headers: CORS })
    }

    console.log(\`Enriching \${leads.length} leads...\`)
    const results = { enriched: 0, failed: 0, skipped: 0 }

    for (const lead of leads) {
      const capCheck = await checkAndIncrementCap()
      if (!capCheck.allowed) { console.log('Cap reached mid-batch'); break }

      const enriched = await enrichFromSerpApi(lead.business_name||'', lead.industry||'', lead.phone||'')
      if (!enriched) { results.skipped++; continue }

      const score = calculateEnrichedScore(enriched.website, enriched.review_count, enriched.rating, lead.industry)

      try {
        // Direct PATCH with service role key — bypasses RLS
        await dbPatchPublic('leads', \`id=eq.\${lead.id}\`, {
          website:          enriched.website      || null,
          rating:           enriched.rating       || null,
          review_count:     enriched.review_count || null,
          score:            score,
          priority_level:   score >= 80 ? 'critical' : score >= 60 ? 'high' : 'low',
          disposition:      score >= 80 ? 'hot_handoff' : score >= 60 ? 'handoff_ready' : 'nurture',
          status:           score >= 60 ? 'qualified' : 'unqualified',
          next_best_action: score >= 80 ? 'call_now' : score >= 60 ? 'email_followup' : 'skip',
          ai_notes:         generateAiNotes(score, enriched, lead.industry),
          enriched_at:      new Date().toISOString(),
        })
        results.enriched++
        console.log(\`✅ Enriched: \${lead.business_name} → score \${score}\`)
      } catch (e) {
        console.error(\`❌ Failed to write \${lead.business_name}:\`, e)
        results.failed++
      }

      await new Promise(r => setTimeout(r, 1100))
    }

    return new Response(JSON.stringify({
      message: 'Enrichment complete',
      ...results,
      total: leads.length,
      serpapi_remaining: cap.cap - cap.used
    }), { headers: CORS })

  } catch (err) {
    console.error('Enrichment error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})
`;

fs.writeFileSync(FILE, Buffer.from(fn, 'utf8'));
console.log('✅ Updated lead-enrichment with direct service role PATCH');
console.log('npx supabase functions deploy lead-enrichment --project-ref szguizvpiiuiyugrjeks');
