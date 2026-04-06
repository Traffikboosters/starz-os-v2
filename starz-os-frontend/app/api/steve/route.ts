import { NextRequest, NextResponse } from "next/server";

const SVC_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FN_BASE = "https://szguizvpiiuiyugrjeks.supabase.co/functions/v1";
const REST_BASE = "https://szguizvpiiuiyugrjeks.supabase.co/rest/v1";

export async function POST(req: NextRequest) {
  const { fn, body, rest } = await req.json();

  if (rest) {
    const r = await fetch(`${REST_BASE}/${rest}`, {
      headers: { apikey: SVC_KEY, Authorization: `Bearer ${SVC_KEY}` },
    });
    const d = await r.json();
    return NextResponse.json(d);
  }

  const r = await fetch(`${FN_BASE}/${fn}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SVC_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const d = await r.json();
  return NextResponse.json(d);
}
