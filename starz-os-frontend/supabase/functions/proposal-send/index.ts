import { createClient } from "npm:@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-proxy-secret, content-type",
    }})
  }

  try {
    const { lead_id, override_tier } = await req.json()

    // Use RPC to bypass PostgREST schema exposure issues
    const { data: lead, error: rpcErr } = await supabase
      .rpc("get_lead_for_proposal", { p_lead_id: lead_id })

    if (rpcErr) console.error("[proposal-send] RPC error:", rpcErr)

    if (!lead) {
      return new Response(JSON.stringify({
        error: "Lead not found", lead_id, rpc_error: rpcErr?.message
      }), { status: 404, headers: { "Content-Type": "application/json" } })
    }

    const tier        = override_tier ?? lead.revenue_tier ?? "ignition"
    const clientName  = lead.company_name ?? lead.company ?? lead.business_name ??
                        lead.client_name  ?? lead.name    ?? "there"
    const clientEmail = lead.email ?? lead.lead_email
    if (!clientEmail) return new Response(
      JSON.stringify({ error: "No email on lead", lead_fields: Object.keys(lead) }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )

    const proposalId = `TB-${tier === "dominance" ? "MS" : "SE"}-${new Date().getFullYear()}-${Math.floor(Math.random()*9000+1000)}`
    const today = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })
    const subject = tier === "dominance"
      ? `Your Dominance Growth System Proposal — ${clientName}`
      : `Your Revenue Ignition System Proposal — ${clientName}`

    const html = tier === "dominance"
      ? buildDominance(clientName, proposalId, today)
      : buildIgnition(clientName, proposalId, today)

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Steve from Traffik Boosters <steve@traffikboosters.com>",
        to: [clientEmail], subject, html
      })
    })
    if (!emailRes.ok) throw new Error(await emailRes.text())

    // Update lead status via RPC
    await supabase.rpc("update_lead_proposal_status", { p_lead_id: lead_id })

    console.log(`[proposal-send] ${tier} proposal sent to ${clientEmail} — ${proposalId}`)
    return new Response(JSON.stringify({
      success: true, proposal_id: proposalId, tier, email: clientEmail, client: clientName
    }), { headers: { "Content-Type": "application/json" } })

  } catch (err) {
    console.error("[proposal-send]", err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" }
    })
  }
})

function buildIgnition(name: string, pid: string, date: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e3dc">
<tr><td style="background:#085041;padding:40px 48px 36px">
  <p style="margin:0 0 14px;color:#5DCAA5;font-family:Helvetica;font-size:10px;font-weight:bold;letter-spacing:3px">TRAFFIK BOOSTERS</p>
  <h1 style="margin:0 0 8px;color:#fff;font-size:28px;font-weight:normal">Revenue Ignition System</h1>
  <p style="margin:0;color:#9FE1CB;font-family:Helvetica;font-size:13px">Break your revenue ceiling</p>
</td></tr>
<tr><td style="background:#1D9E75;height:4px;padding:0;font-size:0"> </td></tr>
<tr><td style="padding:36px 48px">
  <p style="color:#3d3d3a;font-size:15px;line-height:1.8">Hi ${name},</p>
  <p style="color:#3d3d3a;font-size:15px;line-height:1.8">Here is your personalized Revenue Ignition System proposal — built to break you past $65K/month.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:8px;overflow:hidden;border:1px solid #e5e3dc">
    <tr><td style="background:#E1F5EE;padding:18px 20px;border-bottom:1px solid #e5e3dc">
      <p style="margin:0 0 2px;color:#085041;font-family:Helvetica;font-size:11px;font-weight:bold">OPTION A — STANDARD MONTHLY</p>
      <p style="margin:0;color:#085041;font-size:24px">$1,500 - $3,500<span style="font-size:14px;font-family:Helvetica">/month</span></p>
      <p style="margin:4px 0 0;color:#0F6E56;font-family:Helvetica;font-size:12px">Fixed monthly. 35% deposit to start. Full system.</p>
    </td></tr>
    <tr><td style="background:#f5f4f0;padding:18px 20px">
      <p style="margin:0 0 2px;color:#5F5E5A;font-family:Helvetica;font-size:11px;font-weight:bold">OPTION B — PERFORMANCE HYBRID</p>
      <p style="margin:0;color:#3d3d3a;font-size:20px">Lower base + % of results</p>
      <p style="margin:4px 0 0;color:#888780;font-family:Helvetica;font-size:12px">Pay more when we perform.</p>
    </td></tr>
  </table>
  <p style="color:#3d3d3a;font-family:Helvetica;font-size:14px">Reply with <strong>Option A</strong> or <strong>Option B</strong> and I will send your agreement within 2 hours.</p>
  <p style="color:#5F5E5A;font-family:Helvetica;font-size:13px;margin-top:24px">Steve Williams · steve@traffikboosters.com · 786-254-1592</p>
</td></tr>
<tr><td style="padding:16px 48px;background:#f5f4f0;border-top:1px solid #e5e3dc;text-align:center">
  <p style="margin:0;color:#B4B2A9;font-family:Helvetica;font-size:11px">Proposal ${pid} · Valid 14 days from ${date} · Traffik Boosters LLC</p>
</td></tr>
</table></td></tr></table></body></html>`
}

function buildDominance(name: string, pid: string, date: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e3dc">
<tr><td style="background:#26215C;padding:40px 48px 36px">
  <p style="margin:0 0 14px;color:#AFA9EC;font-family:Helvetica;font-size:10px;font-weight:bold;letter-spacing:3px">TRAFFIK BOOSTERS</p>
  <h1 style="margin:0 0 8px;color:#fff;font-size:28px;font-weight:normal">Dominance Growth System</h1>
  <p style="margin:0;color:#AFA9EC;font-family:Helvetica;font-size:13px">Own your market</p>
</td></tr>
<tr><td style="background:#BA7517;height:4px;padding:0;font-size:0"> </td></tr>
<tr><td style="padding:36px 48px">
  <p style="color:#3d3d3a;font-size:15px;line-height:1.8">Hi ${name},</p>
  <p style="color:#3d3d3a;font-size:15px;line-height:1.8">Here is your Dominance Growth System proposal — built to make you the category leader.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:8px;overflow:hidden;border:1px solid #e5e3dc">
    <tr><td style="background:#26215C;padding:18px 20px;border-bottom:1px solid #3C3489">
      <p style="margin:0 0 2px;color:#AFA9EC;font-family:Helvetica;font-size:11px;font-weight:bold">OPTION A — PREMIUM MONTHLY</p>
      <p style="margin:0;color:#fff;font-size:24px">$4,000 - $10,000<span style="font-size:14px;font-family:Helvetica">/month</span></p>
    </td></tr>
    <tr><td style="background:#EEEDFE;padding:18px 20px;border-bottom:1px solid #e5e3dc">
      <p style="margin:0 0 2px;color:#3C3489;font-family:Helvetica;font-size:11px;font-weight:bold">OPTION B — BASE + PERFORMANCE BONUS</p>
      <p style="margin:0;color:#26215C;font-size:20px">$2,500/mo + KPI bonuses</p>
    </td></tr>
    <tr><td style="background:#f5f4f0;padding:18px 20px">
      <p style="margin:0 0 2px;color:#5F5E5A;font-family:Helvetica;font-size:11px;font-weight:bold">OPTION C — REVENUE SHARE</p>
      <p style="margin:0;color:#3d3d3a;font-size:20px">$1,000/mo + % of growth</p>
    </td></tr>
  </table>
  <p style="color:#3d3d3a;font-family:Helvetica;font-size:14px">Reply with <strong>Option A</strong>, <strong>B</strong>, or <strong>C</strong> and I will send your agreement within 2 hours.</p>
  <p style="color:#5F5E5A;font-family:Helvetica;font-size:13px;margin-top:24px">Steve Williams · steve@traffikboosters.com · 786-254-1592</p>
</td></tr>
<tr><td style="padding:16px 48px;background:#f5f4f0;border-top:1px solid #e5e3dc;text-align:center">
  <p style="margin:0;color:#B4B2A9;font-family:Helvetica;font-size:11px">Proposal ${pid} · Valid 14 days from ${date} · Traffik Boosters LLC</p>
</td></tr>
</table></td></tr></table></body></html>`
}