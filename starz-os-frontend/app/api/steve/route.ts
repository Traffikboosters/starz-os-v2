import { NextRequest, NextResponse } from "next/server";

const SVC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z3VpenZwaWl1aXl1Z3JqZWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMyNTg5MiwiZXhwIjoyMDc2OTAxODkyfQ.VPnGM9so9Cp56GV6v6tafzKKs45eNUKpkpwD65Hn7PM";
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
