import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

export const config = {
  verify_jwt: false,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Lazy init
let supabase: ReturnType<typeof createClient> | null = null;
const getSupabase = () => {
  if (!supabase) {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Missing Supabase credentials");
    supabase = createClient(url, key);
  }
  return supabase;
};

serve(async (req) => {
  // ✅ Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("📥 Incoming request");

    const body = await req.json();
    console.log("BODY:", body);

    const { deal_id, email, proposal_url, name } = body;

    // ✅ Validation
    if (!deal_id || !email || !proposal_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const sb = getSupabase();

    const baseUrl =
      Deno.env.get("SUPABASE_URL") ||
      "https://szguizvpiiuiyugrjeks.supabase.co";

    // =========================
    // ✅ INSERT TRACKING RECORD
    // =========================
    console.log("🚀 Inserting proposal record...");

    const { data: record, error: insertError } = await sb
      .schema("proposals")
      .from("sent_proposals")
      .insert({
        deal_id,
        lead_email: email.toLowerCase().trim(),
        proposal_url,
        status: "sent",
        opened: false,
        clicked: false,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !record) {
      console.error("❌ INSERT ERROR:", insertError);
      throw new Error(insertError?.message || "Insert failed");
    }

    console.log("✅ Insert success:", record);

    const tracking_id = record.id;

    // =========================
    // ✅ TRACKING LINKS
    // =========================
    const trackingPixel = `${baseUrl}/functions/v1/track-open?id=${tracking_id}`;
    const trackedLink = `${baseUrl}/functions/v1/track-click?id=${tracking_id}&redirect=${encodeURIComponent(proposal_url)}`;

    // =========================
    // ✅ EMAIL HTML
    // =========================
    const html = `
      <div style="font-family:sans-serif;padding:20px">
        <h2>Proposal for ${name || "your business"}</h2>
        <p>Your custom proposal is ready 👇</p>

        <a href="${trackedLink}" 
           style="display:inline-block;padding:12px 20px;background:#06b6d4;color:#000;text-decoration:none;border-radius:6px;">
          View Proposal
        </a>

        <p style="margin-top:20px;font-size:12px;color:#888;">
          If the button doesn’t work:
        </p>
        <p style="font-size:12px;">${proposal_url}</p>

        <img src="${trackingPixel}" width="1" height="1" />
      </div>
    `;

    // =========================
    // ✅ SEND EMAIL (SAFE MODE)
    // =========================
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      console.error("❌ Missing RESEND_API_KEY");
      throw new Error("RESEND_API_KEY missing");
    }

    console.log("📨 Sending email via Resend...");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 🔥 SAFE sender (no domain verification needed)
        from: "onboarding@resend.dev",
        to: email,
        subject: "Your Proposal is Ready",
        html,
      }),
    });

    const emailText = await emailRes.text();
    console.log("📩 RESEND RESPONSE:", emailText);

    if (!emailRes.ok) {
      throw new Error("Email failed: " + emailText);
    }

    const emailData = JSON.parse(emailText);

    // =========================
    // ✅ UPDATE RECORD
    // =========================
    await sb
      .schema("proposals")
      .from("sent_proposals")
      .update({ resend_id: emailData.id })
      .eq("id", tracking_id);

    // =========================
    // ✅ UPDATE DEAL PIPELINE
    // =========================
    const { error: dealError } = await sb
      .schema("deals")
      .from("pipeline")
      .update({
        stage: "proposal_sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", deal_id);

    if (dealError) {
      console.error("⚠️ Deal update error:", dealError);
    }

    console.log("✅ SUCCESS FLOW COMPLETE");

    return new Response(
      JSON.stringify({
        success: true,
        tracking_id,
        email_id: emailData.id,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err: any) {
    console.error("🔥 FUNCTION ERROR:", err);

    return new Response(
      JSON.stringify({
        error: err.message || "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});