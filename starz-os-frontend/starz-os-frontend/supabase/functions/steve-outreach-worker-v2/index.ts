import { createClient } from "npm:@supabase/supabase-js@2.49.8";

type QueueStatus = "queued" | "processing" | "sent" | "failed" | "done" | "paused" | "canceled";
type Priority = "hot" | "warm" | "cold";
type Channel = "email" | "sms" | "call" | "social";

type QueueRow = {
  id: string;
  tenant_id: string;
  lead_id: string;
  channel: Channel;
  step: number;
  status: QueueStatus;
  scheduled_at: string;
  attempt_count: number;
  max_attempts: number;
  payload: Record<string, unknown>;
};

type LeadRow = {
  id: string;
  tenant_id?: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  business_name: string | null;
  seo_score: number | null;
  website_quality_score: number | null;
  google_rating: number | null;
  google_reviews: number | null;
  revenue_estimate: number | null;
  has_ads: boolean | null;
  lead_score: number | null;
  status: string | null;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function computeLeadScore(lead: LeadRow): { score: number; priority: Priority; channel: Channel } {
  const seo = clamp(Number(lead.seo_score ?? 0), 0, 100);
  const site = clamp(Number(lead.website_quality_score ?? 0), 0, 100);
  const rating = clamp((Number(lead.google_rating ?? 0) / 5) * 100, 0, 100);
  const reviews = clamp((Number(lead.google_reviews ?? 0) / 250) * 100, 0, 100);
  const revenue = clamp((Number(lead.revenue_estimate ?? 0) / 100000) * 100, 0, 100);
  const ads = lead.has_ads ? 80 : 30;

  const weighted = Math.round(
    site * 0.25 +
      seo * 0.2 +
      rating * 0.15 +
      reviews * 0.15 +
      revenue * 0.15 +
      ads * 0.1,
  );

  let priority: Priority = "cold";
  if (weighted >= 80) priority = "hot";
  else if (weighted >= 60) priority = "warm";

  let channel: Channel = "email";
  if (priority === "hot" && lead.phone) channel = "call";
  else if (priority === "warm" && lead.phone) channel = "sms";

  return { score: weighted, priority, channel };
}

function nextDelayHours(step: number): number {
  switch (step) {
    case 0:
      return 24;
    case 1:
      return 24;
    case 2:
      return 48;
    case 3:
      return 48;
    default:
      return 0;
  }
}

async function invokeEdgeFunction(name: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`${name} failed: ${res.status} ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function enqueueNextStep(row: QueueRow, lead: LeadRow, preferredChannel: Channel) {
  const nextStep = row.step + 1;
  if (nextStep > 4) {
    await supabase
      .from("prospecting.outreach_queue")
      .update({ status: "done" })
      .eq("id", row.id);
    return;
  }

  const nextScheduledAt = new Date(Date.now() + nextDelayHours(row.step) * 3600 * 1000).toISOString();

  const nextChannelByStep: Record<number, Channel> = {
    1: "call",
    2: "email",
    3: "sms",
    4: "email",
  };

  const nextChannel = nextChannelByStep[nextStep] ?? preferredChannel;

  await supabase.from("prospecting.outreach_queue").upsert({
    tenant_id: row.tenant_id,
    lead_id: row.lead_id,
    channel: nextChannel,
    step: nextStep,
    status: "queued",
    priority: row.payload.priority ?? "warm",
    scheduled_at: nextScheduledAt,
    payload: {
      ...(row.payload ?? {}),
      lead_name: lead.name,
      business_name: lead.business_name,
    },
  }, { onConflict: "lead_id,channel,step" });
}

async function processOne(row: QueueRow): Promise<{ ok: boolean; id: string; error?: string }> {
  const { data: lead, error: leadErr } = await supabase
    .from("crm.leads")
    .select("id,tenant_id,email,phone,name,business_name,seo_score,website_quality_score,google_rating,google_reviews,revenue_estimate,has_ads,lead_score,status")
    .eq("id", row.lead_id)
    .single<LeadRow>();

  if (leadErr || !lead) {
    const msg = `lead not found: ${leadErr?.message ?? "unknown"}`;
    await supabase.from("prospecting.outreach_queue").update({ status: "failed", last_error: msg }).eq("id", row.id);
    return { ok: false, id: row.id, error: msg };
  }

  const intel = computeLeadScore(lead);

  await supabase.from("crm.leads").update({
    lead_score: intel.score,
    communication_channel: intel.channel,
    priority_level: intel.priority === "hot" ? "critical" : intel.priority === "warm" ? "high" : "normal",
    targeting_status: intel.score >= 60 ? "qualified" : "nurture",
    last_contacted_at: new Date().toISOString(),
  }).eq("id", lead.id);

  await supabase.from("prospecting.outreach_state").upsert({
    tenant_id: row.tenant_id,
    lead_id: row.lead_id,
    current_step: row.step,
    last_channel: row.channel,
    last_message: `step:${row.step} channel:${row.channel}`,
    next_action_at: new Date(Date.now() + nextDelayHours(row.step) * 3600 * 1000).toISOString(),
  });

  const recipientEmail = lead.email;
  const recipientPhone = lead.phone;

  let dispatchResult: unknown = null;

  if (row.channel === "email") {
    if (!recipientEmail) throw new Error("lead missing email");
    dispatchResult = await invokeEdgeFunction("send-email", {
      to: recipientEmail,
      subject: `Quick win for ${lead.business_name ?? "your business"}`,
      html: `<p>Hey ${lead.name ?? "there"}, we found conversion gaps hurting local demand. Want a 10-min strategy breakdown?</p>`,
      lead_id: row.lead_id,
      tenant_id: row.tenant_id,
      sequence_step: row.step,
    });
  } else if (row.channel === "sms") {
    if (!recipientPhone) throw new Error("lead missing phone");
    dispatchResult = await invokeEdgeFunction("send-sms", {
      to: recipientPhone,
      message: `Hey ${lead.name ?? "there"}, we found a fast growth gap for ${lead.business_name ?? "your company"}. Open to details?`,
      lead_id: row.lead_id,
      tenant_id: row.tenant_id,
      sequence_step: row.step,
    });
  } else if (row.channel === "call") {
    if (!recipientPhone) throw new Error("lead missing phone");
    dispatchResult = await invokeEdgeFunction("steve_call_now", {
      phone: recipientPhone,
      lead_id: row.lead_id,
      tenant_id: row.tenant_id,
      context: {
        business_name: lead.business_name,
        score: intel.score,
        priority: intel.priority,
      },
    });
  }

  await supabase.from("prospecting.outreach_logs").insert({
    lead_id: row.lead_id,
    channel: row.channel,
    status: "sent",
    message: `step ${row.step} dispatched`,
    payload: {
      result: dispatchResult,
      score: intel.score,
      priority: intel.priority,
      recommended_channel: intel.channel,
    },
    sent_at: new Date().toISOString(),
  });

  await supabase.from("prospecting.outreach_queue").update({
    status: "sent",
    attempt_count: row.attempt_count + 1,
    payload: {
      ...(row.payload ?? {}),
      score: intel.score,
      priority: intel.priority,
      recommended_channel: intel.channel,
    },
  }).eq("id", row.id);

  await enqueueNextStep(row, lead, intel.channel);

  return { ok: true, id: row.id };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const limit = clamp(Number((body as Record<string, unknown>).limit ?? 25), 1, 100);

    const { data: rows, error } = await supabase
      .from("prospecting.outreach_queue")
      .select("id,tenant_id,lead_id,channel,step,status,scheduled_at,attempt_count,max_attempts,payload")
      .eq("status", "queued")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results: Array<{ ok: boolean; id: string; error?: string }> = [];

    for (const row of (rows ?? []) as QueueRow[]) {
      await supabase.from("prospecting.outreach_queue").update({ status: "processing" }).eq("id", row.id).eq("status", "queued");
      try {
        const result = await processOne(row);
        results.push(result);
      } catch (e) {
        const message = e instanceof Error ? e.message : "unknown error";
        const failed = row.attempt_count + 1 >= row.max_attempts;

        await supabase.from("prospecting.outreach_queue").update({
          status: failed ? "failed" : "queued",
          attempt_count: row.attempt_count + 1,
          last_error: message,
          scheduled_at: failed ? row.scheduled_at : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        }).eq("id", row.id);

        await supabase.from("prospecting.outreach_logs").insert({
          lead_id: row.lead_id,
          channel: row.channel,
          status: "failed",
          message,
          payload: { step: row.step },
        });

        results.push({ ok: false, id: row.id, error: message });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});