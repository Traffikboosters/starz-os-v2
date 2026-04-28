const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const DEFAULT_FROM = Deno.env.get("FROM_EMAIL");

function json(status: number, body: unknown, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      ...extraHeaders,
    },
  });
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  // ---------- Parse & validate JSON ----------
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const {
    to,
    subject,
    body: bodyHtml,
    text,
    html,
    from,
    ...rest
  } = payload as {
    to?: string | string[];
    subject?: string;
    body?: string;
    text?: string;
    html?: string;
    from?: string;
    [k: string]: unknown;
  };

  const recipients =
    typeof to === "string" ? [to] : Array.isArray(to) ? to : undefined;

  const contentHtml =
    typeof html === "string" ? html :
    typeof bodyHtml === "string" ? bodyHtml : undefined;

  const contentText =
    typeof text === "string" ? text : undefined;

  if (!recipients || recipients.length === 0) {
    return json(400, { error: "Missing 'to' recipient" });
  }

  if (!subject || typeof subject !== "string") {
    return json(400, { error: "Missing or invalid subject" });
  }

  if (!contentHtml && !contentText) {
    return json(400, { error: "Missing email body (html, text, or body)" });
  }

  const sender = from || DEFAULT_FROM;
  if (!sender) {
    return json(500, { error: "FROM_EMAIL not configured" });
  }

  if (!RESEND_API_KEY) {
    return json(500, { error: "RESEND_API_KEY not configured" });
  }

  // ---------- Send via Resend ----------
  const payloadOut = {
    from: sender,
    to: recipients,
    subject,
    ...(contentHtml ? { html: contentHtml } : {}),
    ...(contentText ? { text: contentText } : {}),
    ...rest,
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadOut),
    });

    const result = await res.json();

    if (!res.ok) {
      return json(res.status, {
        error: "Email provider error",
        provider_response: result,
      });
    }

    return json(200, {
      ok: true,
      provider: "resend",
      id: result.id,
    });
  } catch (err) {
    return json(500, {
      error: "Unhandled exception",
      detail: String(err),
    });
  }
});