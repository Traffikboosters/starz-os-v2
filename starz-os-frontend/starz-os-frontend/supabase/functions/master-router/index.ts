// supabase/functions/master-router/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const INTERNAL_SECRET = Deno.env.get("ROUTER_INTERNAL_SECRET") || "";
const ROUTER_ENABLED = Deno.env.get("ROUTER_ENABLED") ?? "true";

const ALLOWLIST = (Deno.env.get("ROUTER_ALLOWLIST") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-router-internal-secret",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

function decodeJwtClaims(authHeader: string | null): Record<string, unknown> | null {
  try {
    if (!authHeader?.toLowerCase().startsWith("bearer ")) return null;

    const token = authHeader.slice(7);
    const payload = token.split(".")[1];
    if (!payload) return null;

    const norm = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = norm + "=".repeat((4 - (norm.length % 4)) % 4);

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function callRpc(functionName: string, payload: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
    body: JSON.stringify(payload),
  });

  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (ROUTER_ENABLED !== "true") {
    return new Response("System paused", {
      status: 503,
      headers: corsHeaders,
    });
  }

  const start = Date.now();

  try {
    const url = new URL(req.url);

    const marker = "/master-router/";
    const idx = url.pathname.indexOf(marker);
    const path =
      idx >= 0
        ? url.pathname.slice(idx + marker.length).replace(/^\/+/, "")
        : "";

    if (!path) {
      return new Response("Router active", {
        status: 200,
        headers: corsHeaders,
      });
    }

    const [engine, ...rest] = path.split("/");
    const route = rest.join("/");

    if (!ALLOWLIST.includes(engine)) {
      return new Response("Forbidden", {
        status: 403,
        headers: corsHeaders,
      });
    }

    const incomingAuth = req.headers.get("authorization");
    const internalSecret = req.headers.get("x-router-internal-secret");

    const isInternal =
      Boolean(INTERNAL_SECRET) && internalSecret === INTERNAL_SECRET;

    const authHeader = isInternal ? `Bearer ${SERVICE_ROLE}` : incomingAuth;

    if (!authHeader) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const claims = decodeJwtClaims(incomingAuth);
    const tenantId = (claims?.tenant_id as string | undefined) ?? null;
    const userId = (claims?.sub as string | undefined) ?? null;

    if (!isInternal && !isUuid(tenantId)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid tenant_id" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "content-type": "application/json",
          },
        }
      );
    }

    // Existing per-user/tenant rate limit
    const rateKey = isInternal
      ? `internal:${engine}`
      : `${tenantId}:${userId || "anon"}`;

    const rateRes = await callRpc("check_and_increment_rate_limit", {
      p_key: rateKey,
      p_limit: 1000,
      p_window_seconds: 60,
    });

    if (!rateRes.ok) {
      const txt = await rateRes.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: "Rate limit backend error", detail: txt || null }),
        {
          status: 503,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    const rateJson = await rateRes.json().catch(() => null);
    const allowed =
      typeof rateJson === "boolean"
        ? rateJson
        : Array.isArray(rateJson)
        ? Boolean(rateJson[0]?.check_and_increment_rate_limit ?? rateJson[0]?.allowed)
        : Boolean(rateJson?.check_and_increment_rate_limit ?? rateJson?.allowed);

    if (!allowed) {
      return new Response("Rate limit exceeded", {
        status: 429,
        headers: corsHeaders,
      });
    }

    // Cost protection gate (atomic consume)
    const budgetRes = await callRpc("consume_api_budget", { p_service: engine });

    if (!budgetRes.ok) {
      const txt = await budgetRes.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: "Budget backend error", detail: txt || null }),
        {
          status: 503,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    const budgetJson = await budgetRes.json().catch(() => null);
    const budgetAllowed =
      typeof budgetJson === "boolean"
        ? budgetJson
        : Array.isArray(budgetJson)
        ? Boolean(budgetJson[0]?.consume_api_budget)
        : Boolean(budgetJson?.consume_api_budget);

    if (!budgetAllowed) {
      return new Response("API budget exceeded", {
        status: 429,
        headers: corsHeaders,
      });
    }

    const contentType = req.headers.get("content-type") || "";

    const forwardHeaders: Record<string, string> = {
      authorization: authHeader,
    };
    if (ANON_KEY) forwardHeaders.apikey = ANON_KEY;

    let forwardBody: BodyInit | undefined;

    if (!["GET", "HEAD"].includes(req.method)) {
      if (contentType.includes("multipart/form-data")) {
        forwardBody = await req.formData();
      } else {
        const raw = await req.text();
        forwardBody = raw || undefined;
        if (contentType) forwardHeaders["content-type"] = contentType;
      }
    }

    const forwardUrl = `${SUPABASE_URL}/functions/v1/${engine}${
      route ? `/${route}` : ""
    }${url.search}`;

    const res = await fetch(forwardUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: forwardBody,
    });

    const duration = Date.now() - start;

    EdgeRuntime.waitUntil(
      (async () => {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/router_logs`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Profile": "analytics",
              apikey: SERVICE_ROLE,
              Authorization: `Bearer ${SERVICE_ROLE}`,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              engine,
              route,
              method: req.method,
              user_id: userId,
              tenant_id: tenantId,
              is_internal: isInternal,
              request_body: null,
              response_status: res.status,
              duration_ms: duration,
            }),
          });

          await fetch(`${SUPABASE_URL}/functions/v1/steve-auto-closer`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SERVICE_ROLE}`,
            },
            body: JSON.stringify({
              event: "api_call",
              payload: {
                engine,
                route,
                status: res.status,
                duration_ms: duration,
                tenant_id: tenantId,
                user_id: userId,
              },
            }),
          });
        } catch (bgErr) {
          console.error("router background task failed", bgErr);
        }
      })()
    );

    const responseHeaders = new Headers(corsHeaders);
    const ct = res.headers.get("content-type");
    if (ct) responseHeaders.set("content-type", ct);

    return new Response(await res.arrayBuffer(), {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
    });
  }
});