import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, email, role, subject, html } = body;

    if (action === "send") {
      const res = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/rpc/enqueue_email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY || "", "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY, "Accept-Profile": "ops", "Content-Profile": "ops" },
        body: JSON.stringify({ p_tenant_id: "00000000-0000-0000-0000-000000000301", p_to_email: email, p_subject: subject, p_body: html, p_provider: "ipage_smtp" }),
      });
      const data = await res.json();
      console.log("enqueue:", res.status, JSON.stringify(data).slice(0,200));
      if (!res.ok) return NextResponse.json({ error: JSON.stringify(data) }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: "You are Zara HR Director AI. Respond with ONLY a JSON object. Keys: subject, html, text. No markdown.", messages: [{ role: "user", content: "Onboarding email for " + name + " joining as " + role + " at Traffik Boosters. Sign as Zara HR Director." }] })
    });

    const data = await response.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
    const rawText = (data.content?.[0]?.text || "").trim();
    console.log("Claude raw:", rawText.slice(0,300));

    try { return NextResponse.json(JSON.parse(rawText)); } catch(e1) {}
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) { try { return NextResponse.json(JSON.parse(match[0])); } catch(e2) {} }

    return NextResponse.json({ subject: "Welcome to Traffik Boosters, " + name + "!", html: "<p>Dear " + name + ",</p><p>Welcome to Traffik Boosters! Excited to have you join as " + role + ".</p><p>Log into STARZ-OS to get started.</p><p>Best,<br>Zara<br>HR Director</p>", text: "Dear " + name + ", Welcome to Traffik Boosters! Excited to have you as " + role + ". Log into STARZ-OS. Best, Zara, HR Director." });
  } catch (e) {
    console.error("Zara error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}