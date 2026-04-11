// supabase/functions/dialpad-call/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // ✅ Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    // 📥 Parse request body
    const { phone, lead_id } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Missing phone number" }),
        { status: 400 }
      );
    }

    // 🔐 Environment variables
    const DIALPAD_API_KEY = Deno.env.get("DIALPAD_API_KEY");
    const USER_ID = Deno.env.get("DIALPAD_USER_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DIALPAD_API_KEY || !USER_ID) {
      return new Response(
        JSON.stringify({ error: "Dialpad credentials missing" }),
        { status: 500 }
      );
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Supabase credentials missing" }),
        { status: 500 }
      );
    }

    // 📞 CALL DIALPAD API
    const dialpadRes = await fetch("https://dialpad.com/api/v2/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIALPAD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: phone,
        user_id: USER_ID,
      }),
    });

    const dialpadData = await dialpadRes.json();

    // ❌ Handle Dialpad API error
    if (!dialpadRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Dialpad API failed",
          details: dialpadData,
        }),
        { status: 500 }
      );
    }

    // 🧾 LOG CALL TO SUPABASE
    await fetch(`${SUPABASE_URL}/rest/v1/dialer.calls`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lead_id,
        phone_number: phone,
        status: "initiated",
      }),
    });

    // ✅ SUCCESS RESPONSE
    return new Response(JSON.stringify(dialpadData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // ✅ SAFE ERROR HANDLING
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    );
  }
});