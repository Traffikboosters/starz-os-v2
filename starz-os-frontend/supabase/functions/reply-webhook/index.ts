import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

const BOOKING_LINK = "https://calendly.com/traffikboosters/strategy-call";

serve(async (req) => {
  console.log("💬 STEVE BGE ENGINE (STATEFUL)");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();

    const email = body.from || "";
    const textRaw = body.text || body.html || "";
    const text = textRaw.toLowerCase();

    console.log("📨 Incoming:", email, text);

    // 🔍 1. GET EXISTING DEAL
    const { data: existing } = await supabase
      .from("deals.pipeline")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    let deal = existing?.[0] || null;

    let stage = deal?.conversation_stage || "new";
    let reply = "";

    // 🧠 2. STAGE-BASED LOGIC

    if (stage === "new") {
      if (text.includes("yes") || text.includes("interested")) {
        stage = "qualified";

        reply = `Nice — that tells me you're open to improving this.

Quick question so I can point you in the right direction:

How are you currently getting most of your leads right now?`;
      } else {
        stage = "contacted";

        reply = `Got it — quick question:

Are you currently doing anything to increase your inbound leads right now?`;
      }
    }

    else if (stage === "qualified") {
      if (text.includes("ads") || text.includes("google") || text.includes("facebook")) {
        stage = "lead_source";

        reply = `That makes sense.

Most businesses using that approach are still leaving a lot of opportunities on the table.

Roughly how many leads are you getting per month?`;
      } else {
        reply = `Got it — and roughly how many leads are you getting per month right now?`;
      }
    }

    else if (stage === "lead_source") {
      if (text.match(/\d+/)) {
        stage = "ready_to_close";

        reply = `That’s solid.

Based on that, there’s usually a way to increase that by 20–40% without increasing ad spend.

Let me show you exactly how:

👉 Book a quick strategy call here:
${BOOKING_LINK}`;
      } else {
        reply = `Got it — and roughly how many leads are you getting monthly?`;
      }
    }

    else if (stage === "ready_to_close") {
      reply = `If you're open to it, this will make a lot more sense on a quick call.

Here’s the link:
${BOOKING_LINK}`;
    }

    // ❌ HANDLE STOP
    if (text.includes("stop") || text.includes("not interested")) {
      stage = "closed";

      reply = `Got it — totally understand.

If anything changes, feel free to reach out anytime.`;
    }

    // 💾 3. UPSERT DEAL (NO DUPLICATES)
    if (deal) {
      await supabase
        .from("deals.pipeline")
        .update({
          conversation_stage: stage,
          last_message: textRaw,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deal.id);
    } else {
      await supabase.from("deals.pipeline").insert({
        email,
        conversation_stage: stage,
        last_message: textRaw,
      });
    }

    // 📧 4. RESPOND
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Steve <steve@traffikboosters.com>",
        to: email,
        subject: "Re:",
        html: `<p>${reply.replace(/\n/g, "<br/>")}</p>`,
      }),
    });

    return new Response(JSON.stringify({ success: true, stage }), {
      status: 200,
    });

  } catch (err) {
    console.error("🔥 ERROR:", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});