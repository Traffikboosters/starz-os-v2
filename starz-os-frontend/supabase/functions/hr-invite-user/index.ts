import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { email, role_key, invited_by, name, resend } = body;

    if (!email) return json(400, { error: "Email required" });

    // Generate invite link via Supabase Auth
    const { data: invite, error: inviteError } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: { role_key, invited_by: invited_by || "Zara HR Director", full_name: name || email }
      }
    });

    if (inviteError) {
      // Log to hr.onboarding_log regardless
      await supabase.schema("hr").from("onboarding_log").insert({
        email,
        full_name: name || email,
        role_key: role_key || "bge_contractor",
        status: "invite_failed",
        sent_at: new Date().toISOString(),
      }).catch(() => {});
      return json(500, { error: inviteError.message });
    }

    // Update invite status
    await supabase.schema("hr").from("user_invites").upsert({
      email,
      role_key: role_key || "bge_contractor",
      status: "sent",
      invited_at: new Date().toISOString(),
    }, { onConflict: "email" }).catch(() => {});

    // Log to onboarding_log
    await supabase.schema("hr").from("onboarding_log").insert({
      email,
      full_name: name || email,
      role_key: role_key || "bge_contractor",
      status: resend ? "resent" : "invited",
      sent_at: new Date().toISOString(),
    }).catch(() => {});

    // Send welcome email via Resend
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_KEY && invite?.properties?.action_link) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Zara HR <hr@traffikboosters.com>",
          to: [email],
          subject: "You've been invited to join STARZ-OS — Traffik Boosters",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:white;padding:40px;border-radius:16px">
              <div style="text-align:center;margin-bottom:30px">
                <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#f43f5e,#a855f7);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:900;margin:0 auto 15px">Z</div>
                <h1 style="color:#fda4af;margin:0">Welcome to Traffik Boosters</h1>
                <p style="color:#94a3b8">You've been invited by ${invited_by || 'Zara HR Director'}</p>
              </div>
              <div style="background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.3);border-radius:12px;padding:20px;margin-bottom:20px">
                <h2 style="color:white;margin:0 0 10px">Your Role: <span style="color:#fda4af">${role_key || 'Sales Contractor'}</span></h2>
                <p style="color:#94a3b8;margin:0">You've been selected to join our team at Traffik Boosters. Click below to set up your account and access STARZ-OS.</p>
              </div>
              <div style="text-align:center;margin:30px 0">
                <a href="${invite.properties.action_link}" style="background:linear-gradient(135deg,#f43f5e,#a855f7);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px">
                  Accept Invitation & Get Started
                </a>
              </div>
              <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:15px;margin-top:20px">
                <p style="color:#94a3b8;font-size:12px;margin:0">
                  As a ${role_key || 'Sales Contractor'} you'll get access to:<br/>
                  ✅ Lead queue (up to 70 active leads)<br/>
                  📞 Business phone number via Dialpad<br/>
                  🤖 AI sales coaching (Steve BGE)<br/>
                  💰 30% commission + residuals
                </p>
              </div>
              <p style="color:#475569;font-size:11px;text-align:center;margin-top:20px">
                Traffik Boosters · STARZ-OS Platform · Questions? Reply to this email
              </p>
            </div>
          `
        })
      }).catch(() => {});
    }

    return json(200, {
      ok: true,
      message: `Invite sent to ${email}`,
      invite_link: invite?.properties?.action_link || null
    });

  } catch (err) {
    return json(500, { error: String(err) });
  }
});