/**
 * STARZ-OS — Rank Tracking Edge Function
 * POST /functions/v1/rank-tracking
 * Idempotent: one row per keyword / device / day
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  })

// ── SERP fetcher — REPLACE with your real crawler ─────────────────────────────
async function fetchPosition(
  keyword: string, device: string, location: string
): Promise<number | null> {
  try {
    // TODO: replace with your internal SERP checker
    // const res = await fetch(`${Deno.env.get("SERP_API_URL")}/check`, {
    //   method: "POST",
    //   headers: { "Authorization": `Bearer ${Deno.env.get("SERP_API_KEY")}` },
    //   body: JSON.stringify({ keyword, device, location }),
    // })
    // return (await res.json()).position ?? null
    console.log(`[stub] checking "${keyword}" on ${device}/${location}`)
    return Math.floor(Math.random() * 80) + 1
  } catch (e) {
    console.error("fetchPosition error:", e)
    return null
  }
}

// ── Daily dedup check ─────────────────────────────────────────────────────────
async function alreadySnapshotted(
  sb: ReturnType<typeof createClient>,
  tenantId: string, keywordId: string, device: string
): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10)
  const { count, error } = await sb
    .from("rank_tracking")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id",  tenantId)
    .eq("keyword_id", keywordId)
    .eq("device",     device)
    .gte("checked_at", `${today}T00:00:00Z`)
    .lt("checked_at",  `${today}T23:59:59Z`)
  if (error) { console.warn("dedup error:", error.message); return false }
  return (count ?? 0) > 0
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST")    return json({ error: "Use POST" }, 405)

  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) return json({ error: "Missing env vars" }, 500)

  const sb = createClient(url, key, { auth: { persistSession: false } })

  let body: any = {}
  try { body = await req.json() } catch {}

  const tenantId = body.tenant_id ?? Deno.env.get("STARZOS_DEFAULT_TENANT") ?? ""
  const device   = body.device   ?? "desktop"
  const location = body.location ?? "us"
  if (!tenantId) return json({ error: "tenant_id required" }, 400)

  let q = sb.from("keywords").select("id, keyword").eq("tenant_id", tenantId)
  if (body.keyword_ids?.length) q = q.in("id", body.keyword_ids)

  const { data: keywords, error: kwErr } = await q
  if (kwErr) return json({ error: kwErr.message }, 500)
  if (!keywords?.length) return json({ success: true, inserted: 0, message: "No keywords found" })

  const results: any[] = []
  const checkedAt = new Date().toISOString()

  for (const kw of keywords) {
    if (await alreadySnapshotted(sb, tenantId, kw.id, device)) {
      results.push({ keyword_id: kw.id, position: -1, skipped: true })
      continue
    }
    let position = body.positions?.[kw.id] ?? null
    if (position === null) position = await fetchPosition(kw.keyword, device, location)
    if (position === null) {
      results.push({ keyword_id: kw.id, skipped: false, error: "position null" })
      continue
    }
    const { error: insErr } = await sb.from("rank_tracking").insert({
      tenant_id: tenantId, keyword_id: kw.id,
      position, device, location, checked_at: checkedAt,
    })
    results.push({ keyword_id: kw.id, position, skipped: false,
      ...(insErr ? { error: insErr.message } : {}) })
  }

  const inserted = results.filter((r: any) => !r.skipped && !r.error).length
  const skipped  = results.filter((r: any) =>  r.skipped).length
  const failed   = results.filter((r: any) => !r.skipped && !!r.error).length

  return json({
    success: failed === 0, tenant_id: tenantId, device, location,
    total: keywords.length, inserted, skipped, failed,
    results, ran_at: checkedAt,
  }, failed > 0 ? 207 : 200)
})