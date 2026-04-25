// supabase/functions/steve-auto-closer/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ROUTER_INTERNAL_SECRET = Deno.env.get("ROUTER_INTERNAL_SECRET") || "";

const jsonHeaders = {
  "Content-Type": "application/json",
};

async function callRouter(path: string, body: unknown) {
  const headers: Record<string, string> = {
    ...jsonHeaders,
    Authorization: `Bearer ${SERVICE_ROLE}`,
  };

  if (ROUTER_INTERNAL_SECRET) {
    headers["x-router-internal-secret"] = ROUTER_INTERNAL_SECRET;
  }

  return await fetch(`${SUPABASE_URL}/functions/v1/master-router/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  let event: string | undefined;
  let payload: Record<string, unknown> = {};

  try {
    const body = await req.json();
    event = body?.event;
    payload = body?.payload ?? {};
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  if (!event) {
    return new Response(JSON.stringify({ error: "Missing event" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  try {
    if (event === "new_lead") {
      const score = Number(payload.score ?? 0);
      if (score >= 60) {
        await callRouter("outreach-engine/email/send", {
          lead_id: payload.id,
          template: "intro",
        });
      }
    }

    if (event === "no_reply") {
      await callRouter("outreach-engine/followup/run", {
        lead_id: payload.id,
      });
    }

    if (event === "lead_interested") {
      await callRouter("deal-engine/proposal/generate", {
        lead_id: payload.id,
      });
    }

    if (event === "proposal_ready") {
      await callRouter("deal-engine/proposal/send", payload);
    }

    if (event === "payment_received") {
      await callRouter("rico-engine/work-order/create", payload);
    }

    return new Response(JSON.stringify({ ok: true, event }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Steve execution failed", detail: String(err) }),
      { status: 500, headers: jsonHeaders }
    );
  }
});