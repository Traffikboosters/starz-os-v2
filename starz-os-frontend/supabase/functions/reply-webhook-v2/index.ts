const MAX_SKEW_SECONDS = 300;

interface IncomingPayload {
  lead_email?: string;
  reply_text?: string;
  lead_name?: string;
  company?: string;
  provider?: string;
  idempotency_key?: string;
  [key: string]: unknown;
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Connection": "keep-alive",
    },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function fromHex(hex: string): Uint8Array {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hmacSha256Raw(secret: string, message: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return new Uint8Array(sig);
}

function validatePayload(payload: IncomingPayload): string | null {
  if (!isNonEmptyString(payload.lead_email)) return "Missing lead_email";
  if (!isNonEmptyString(payload.reply_text)) return "Missing reply_text";
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  const signingSecret = Deno.env.get("WEBHOOK_SIGNING_SECRET");
  if (!signingSecret) {
    console.error("WEBHOOK_SIGNING_SECRET not configured");
    return json(500, { ok: false, error: "Server not configured" });
  }

  const rawBody = await req.text();

  const timestampHeader = req.headers.get("x-webhook-timestamp");
  const signatureHeader = req.headers.get("x-webhook-signature");

  if (!isNonEmptyString(timestampHeader) || !isNonEmptyString(signatureHeader)) {
    return json(401, { ok: false, error: "Missing signature headers" });
  }

  const ts = Number.parseInt(timestampHeader, 10);
  if (!Number.isFinite(ts)) {
    return json(401, { ok: false, error: "Invalid timestamp" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > MAX_SKEW_SECONDS) {
    return json(401, { ok: false, error: "Stale timestamp" });
  }

  const signed = `${timestampHeader}.${rawBody}`;
  let expectedBytes: Uint8Array;
  let incomingBytes: Uint8Array;

  try {
    expectedBytes = await hmacSha256Raw(signingSecret, signed);
    incomingBytes = fromHex(signatureHeader);
  } catch {
    return json(401, { ok: false, error: "Malformed signature" });
  }

  if (!timingSafeEqual(expectedBytes, incomingBytes)) {
    return json(401, { ok: false, error: "Invalid signature" });
  }

  let payload: IncomingPayload;
  try {
    payload = rawBody.length ? JSON.parse(rawBody) : {};
  } catch {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return json(400, { ok: false, error: validationError });
  }

  return json(200, {
    ok: true,
    received_at: new Date().toISOString(),
    lead_email: payload.lead_email,
    idempotency_key: payload.idempotency_key ?? null,
  });
});