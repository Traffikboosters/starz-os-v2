// =============================================
// STARZ-OS CORE AUTOMATION ENGINE — FULL MERGE
// =============================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const REPLY_SECRET = Deno.env.get("REPLY_WEBHOOK_SECRET") ?? "";
const INTERNAL_TOKEN = Deno.env.get("INTERNAL_AUTOMATION_SECRET") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "hello@traffikboosters.com";

const H: Record<string,string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-token, resend-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function resp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: H });
}

function assertInternal(req: Request) {
  const token = req.headers.get("x-internal-token") ?? "";
  if (token !== INTERNAL_TOKEN) throw new Error("Unauthorized internal action");
}

async function dbFetch(path: string, opts: RequestInit = {}, schema?: string) {
  const extra: Record<string,string> = {};
  if (schema) { extra["Accept-Profile"] = schema; extra["Content-Profile"] = schema; }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${SERVICE_ROLE}`, apikey: SERVICE_ROLE, "Content-Type": "application/json", ...extra, ...(opts.headers||{}) },
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`DB ${r.status}: ${txt}`);
  return txt ? JSON.parse(txt) : null;
}

async function rpc(fn: string, params: Record<string,unknown> = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_ROLE}`, apikey: SERVICE_ROLE, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

async function eventAlreadyProcessed(eventKey: string): Promise<boolean> {
  try {
    const rows = await dbFetch(`learning_log?event_key=eq.${encodeURIComponent(eventKey)}&select=id&limit=1`, { method: "GET" }, "ai");
    return Array.isArray(rows) && rows.length > 0;
  } catch(_e) { return false; }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: H });
  try {
    const body = await req.json().catch(() => ({})) as Record<string,unknown>;
    const action = String(body?.action ?? "");
    const tenantId = String(body?.tenant_id ?? "11111111-1111-1111-1111-111111111111");
    const payload = (body?.payload ?? {}) as Record<string,unknown>;

    // ── HEALTH ──
    if (!action || action === "health") {
      return resp({ ok: true, message: "core-automation-engine running" });
    }

    // ── VOX MESSAGE ──
    if (action === "vox_message") {
      const message = String(body?.message ?? "");
      const target = String(body?.target ?? "");
      if (!message || !target) return resp({ ok: false, error: "Missing message/target" }, 400);
      if (!["steve","rico","zara"].includes(target)) return resp({ ok: false, error: "Invalid target" }, 400);

      let aiResponse = "";
      if (target === "steve") {
        let hint = "";
        try {
          const mem = await dbFetch("steve_memory?select=patterns&id=eq.global&limit=1", { method: "GET" }, "ai");
          if (Array.isArray(mem) && mem[0]?.patterns?.length > 0) {
            hint = ` Top pattern: ${JSON.stringify(mem[0].patterns[0]).slice(0,200)}`;
          }
        } catch(_e) {}
        aiResponse = `Steve: Focus on urgency + ROI.${hint}`;
      } else if (target === "rico") {
        aiResponse = "Rico: Delivery is solid. Reinforce trust and keep the project on track.";
      } else if (target === "zara") {
        aiResponse = "Zara: Follow policy guidelines. Ensure compliance and team alignment.";
      }

      await dbFetch("learning_log", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ agent: target, input: message, deal_id: (payload?.deal_id as string)||null }),
      }, "ai").catch(() => {});

      return resp({ ok: true, response: aiResponse });
    }

    // ── TRAIN STEVE ──
    if (action === "train_steve") {
      let patterns: unknown[] = [];
      try {
        patterns = await dbFetch("v_steve_patterns?select=*&order=win_rate.desc&limit=50", { method: "GET" }, "ai") ?? [];
      } catch(_e) {}
      await dbFetch("steve_memory?on_conflict=id", {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ id: "global", patterns, updated_at: new Date().toISOString() }),
      }, "ai").catch(() => {});
      return resp({ ok: true, patterns_loaded: patterns.length });
    }

    // ── LEAD DISTRIBUTION ──
    if (action === "lead_distribution") {
      const result = await rpc("assign_lead_atomic", { p_lead_id: (payload.lead_id as string)||null, p_user_id: (payload.user_id as string)||null })
        .catch(() => rpc("dispense_leads", { tenant_id: tenantId }).catch((e: Error) => ({ error: e.message })));
      return resp({ ok: true, result, message: "Lead distribution complete" });
    }

    // ── LEAD ROTATION ──
    if (action === "lead_rotation") {
      const result = await rpc("rotate_stale_leads", { p_tenant_id: tenantId }).catch((e: Error) => ({ error: e.message }));
      return resp({ ok: true, result });
    }

    // ── SENTINEL SCAN ──
    if (action === "sentinel_scan") {
      const result = await rpc("run_sentinel_scan", { p_tenant_id: tenantId }).catch((e: Error) => ({ error: e.message }));
      return resp({ ok: true, result });
    }

    // ── DECISION ENGINE ──
    if (action === "decision_engine") {
      const result = await rpc("run_decision_engine", { p_tenant_id: tenantId, ...payload }).catch((e: Error) => ({ error: e.message }));
      return resp({ ok: true, result });
    }

    // ── PRIORITY DISPATCH ──
    if (action === "priority_dispatch") {
      const result = await rpc("dispatch_priority_leads", { p_tenant_id: tenantId }).catch((e: Error) => ({ error: e.message }));
      return resp({ ok: true, result });
    }

    // ── COMPUTE RISK ──
    if (action === "compute_risk") {
      const result = await rpc("compute_deal_risk", { p_tenant_id: tenantId, ...payload }).catch((e: Error) => ({ error: e.message }));
      return resp({ ok: true, result });
    }

    // ── REASSIGN STALE ──
    if (action === "reassign_stale") {
      const result = await rpc("reassign_stale_leads", { p_tenant_id: tenantId }).catch((e: Error) => ({ error: e.message }));
      return resp({ ok: true, result, message: "Stale leads reassigned" });
    }

    // ── REQUALIFY LEAD ──
    if (action === "requalify_lead") {
      const leadId = String(payload?.lead_id ?? "");
      if (leadId) {
        await dbFetch(`leads?id=eq.${leadId}`, {
          method: "PATCH", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ status: "requalifying", last_activity_at: new Date().toISOString() }),
        }, "crm").catch(() => {});
      }
      return resp({ ok: true, message: "Lead sent to Steve for requalification" });
    }

    // ── INVITE USER ──
    if (action === "invite_user") {
      const { email, role_key } = payload;
      await dbFetch("user_invites", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ email, role_key, status: "pending", invited_at: new Date().toISOString() }),
      }, "hr").catch(() => {});
      if (RESEND_API_KEY && email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: `Zara | Traffik Boosters <${FROM_EMAIL}>`, to: [email], subject: "You're invited to Traffik Boosters BGE Portal", html: `<p>Hi,</p><p>You've been invited to join as a ${role_key||"BGE Contractor"}.</p><p>— Zara, HR Director</p>` }),
        }).catch(() => {});
      }
      return resp({ ok: true, message: `Invite sent to ${email}` });
    }

    // ── TRIGGER ZARA ONBOARDING ──
    if (action === "trigger_zara_onboarding" || action === "onboard_contractor") {
      const { email, role_key, name } = payload;
      await dbFetch("onboarding_log", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ email, full_name: name||email, role_key: role_key||"bge_contractor", status: "pending", sent_at: new Date().toISOString() }),
      }, "hr").catch(() => {});
      if (RESEND_API_KEY && email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: `Zara | Traffik Boosters <${FROM_EMAIL}>`, to: [email], subject: "Welcome to Traffik Boosters — BGE Onboarding", html: `<p>Hi ${name||"there"},</p><p>Welcome aboard! Your onboarding has been initiated.</p><p>— Zara, HR Director</p>` }),
        }).catch(() => {});
      }
      return resp({ ok: true, message: `Onboarding triggered for ${email}` });
    }

    // ── CREATE TASK ──
    if (action === "create_task") {
      const { user_id, title, category } = payload;
      await dbFetch("onboarding_log", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ user_id, full_name: title, role_key: category||"task", status: "pending", sent_at: new Date().toISOString() }),
      }, "hr").catch(() => {});
      return resp({ ok: true, message: `Task created: ${title}` });
    }

    // ── RESOLVE HR ALERT ──
    if (action === "resolve_hr_alert") {
      const alertId = String(payload?.alert_id ?? "");
      await dbFetch(`alerts?id=eq.${alertId}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "resolved", resolved_at: new Date().toISOString() }),
      }, "hr").catch(() => {});
      return resp({ ok: true, message: "Alert resolved" });
    }

    // ── GENERATE HR REPORT ──
    if (action === "generate_hr_report") {
      const result = await rpc("generate_hr_summary", { p_tenant_id: tenantId }).catch(() => null);
      return resp({ ok: true, message: "HR report generated", result });
    }

    // ── FLAG COACHING ──
    if (action === "flag_coaching") {
      const result = await rpc("flag_low_performers", { p_daily_target: payload.daily_target||30, p_min_conversion: payload.min_conversion||8 }).catch(() => null);
      return resp({ ok: true, message: "Low performers flagged", result });
    }

    // ── AUTO RECRUIT ──
    if (action === "auto_recruit") {
      const result = await rpc("trigger_auto_recruit", { p_tenant_id: tenantId, p_threshold: payload.threshold||15 }).catch(() => null);
      return resp({ ok: true, message: "Auto recruit triggered", result });
    }

    // ── PLACE CALL ──
    if (action === "place_call") {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/dialpad-call`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "call", phone: payload.phone_number, queue_id: payload.queue_id, tenant_id: tenantId }),
      });
      const data = await r.json().catch(() => ({}));
      return resp({ ok: true, ...data });
    }

    // ── DRAFT EMAIL REPLY ──
    if (action === "draft_email_reply") {
      const emailId = body?.email_id;
      if (!emailId) return resp({ ok: false, error: "Missing email_id" }, 400);
      const rows = await dbFetch(`emails?id=eq.${encodeURIComponent(String(emailId))}&select=*`, { method: "GET" }, "communications").catch(() => null);
      const email = Array.isArray(rows) ? rows[0] : null;
      if (!email) return resp({ ok: false, error: "Email not found" }, 404);
      const draft = "Thanks for reaching out — we can absolutely help. I'll send over your custom plan and activation link right now so you can get started immediately.";
      return resp({ ok: true, draft, email });
    }

    // ── EMAIL WEBHOOK ──
    if (action === "email_webhook") {
      const signature = req.headers.get("resend-signature") ?? "";
      if (!signature || signature !== REPLY_SECRET) return resp({ ok: false, error: "Invalid signature" }, 401);
      const d = (body?.data ?? {}) as Record<string,unknown>;
      const fromEmail = String(d.from ?? "").toLowerCase().trim();
      const toEmail = Array.isArray(d.to) ? d.to[0] : d.to;
      await dbFetch("emails", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ message_id: d.id||null, from: fromEmail, to: toEmail||null, subject: d.subject||"(no subject)", text: d.text||"", html: d.html||"", direction: "inbound", status: "received", created_at: new Date().toISOString() }),
      }, "communications").catch(() => {});
      return resp({ ok: true });
    }

    // ── PAYMENT RECEIVED (IDEMPOTENT) ──
    if (action === "payment_received") {
      assertInternal(req);
      const { proposal_id, deal_id = null, amount, stripe_event_id = null, stripe_session_id = null, invoice_id = null } = payload;
      if (!proposal_id || !amount) return resp({ ok: false, error: "Missing proposal_id or amount" }, 400);
      const parsedAmount = typeof amount === "number" ? amount : Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return resp({ ok: false, error: "Invalid amount" }, 400);
      const stableId = stripe_event_id ?? invoice_id ?? stripe_session_id ?? proposal_id;
      const eventKey = `payment_received:${stableId}`;
      if (await eventAlreadyProcessed(eventKey)) return resp({ ok: true, duplicate: true });
      await dbFetch("learning_log", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ event: "payment_received", event_key: eventKey, deal_id, revenue: parsedAmount, created_at: new Date().toISOString() }),
      }, "ai").catch(() => {});
      if (deal_id) {
        await rpc("update_rep_revenue_score", { p_deal_id: deal_id, p_amount: parsedAmount }).catch(() => {});
      }
      await dbFetch("router_logs", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ event: "sale_closed", metadata: { proposal_id, deal_id, amount: parsedAmount } }),
      }, "analytics").catch(() => {});
      return resp({ ok: true });
    }

    // ── PAYMENT FAILED ──
    if (action === "payment_failed") {
      assertInternal(req);
      const { customer_id = null, stripe_event_id = null, invoice_id = null, stripe_session_id = null } = payload;
      const stableId = stripe_event_id ?? invoice_id ?? stripe_session_id ?? customer_id;
      if (!stableId) return resp({ ok: false, error: "Missing stable identifier" }, 400);
      const eventKey = `payment_failed:${stableId}`;
      if (await eventAlreadyProcessed(eventKey)) return resp({ ok: true, duplicate: true });
      await dbFetch("learning_log", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ event: "payment_failed", event_key: eventKey, customer_id, created_at: new Date().toISOString() }),
      }, "ai").catch(() => {});
      await dbFetch("router_logs", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ event: "payment_failed", metadata: { customer_id } }),
      }, "analytics").catch(() => {});
      return resp({ ok: true });
    }

    // ── DEFAULT ──
    return resp({ ok: true, message: "core-automation-engine running" });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unhandled error";
    console.error("core-automation-engine:", msg);
    return resp({ ok: false, error: msg }, 500);
  }
});
