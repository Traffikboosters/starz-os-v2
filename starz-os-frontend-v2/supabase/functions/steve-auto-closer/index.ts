Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: "Missing required environment variables" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { event, payload } = await req.json();

    if (!event || typeof event !== "string") {
      return new Response(JSON.stringify({ error: "Invalid event" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const postToRoute = async (path: string, body: unknown) => {
      const url = `${SUPABASE_URL}/functions/v1/${path}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body ?? {}),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Downstream call failed: ${path} (${res.status}) ${text}`);
      }

      return res;
    };

    switch (event) {
      case "new_lead": {
        if ((payload?.score ?? 0) >= 60 && payload?.id) {
          await postToRoute("master-router/outreach-engine/email/send", {
            lead_id: payload.id,
            template: "intro",
          });
        }
        break;
      }

      case "no_reply": {
        if (!payload?.id) break;
        await postToRoute("master-router/outreach-engine/followup/run", {
          lead_id: payload.id,
        });
        break;
      }

      case "lead_interested": {
        if (!payload?.id) break;
        await postToRoute("master-router/deal-engine/proposal/generate", {
          lead_id: payload.id,
        });
        break;
      }

      case "proposal_ready": {
        await postToRoute("master-router/deal-engine/proposal/send", payload ?? {});
        break;
      }

      case "payment_received": {
        await postToRoute("master-router/rico-engine/work-order/create", payload ?? {});
        break;
      }

      default: {
        // Ignore unknown events to keep orchestrator idempotent
        break;
      }
    }

    return new Response(JSON.stringify({ ok: true, event }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});