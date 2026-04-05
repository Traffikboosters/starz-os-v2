import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

serve(async (req) => {
  try {
    const { email, intent } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ✅ FIXED: use to_email instead of email
    const { data: log, error: fetchError } = await supabase
      .from("outreach_logs")
      .select("*")
      .eq("to_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !log) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404 }
      );
    }

    // 🧠 Basic intent classification
    let status = "nurturing";

    if (intent === "interested") status = "qualified";
    if (intent === "not_interested") status = "lost";

    // ✅ Update outreach log
    await supabase
      .from("outreach_logs")
      .update({
        status: status,
        reply_intent: intent,
        replied_at: new Date().toISOString(),
      })
      .eq("id", log.id);

    // ✅ Insert / Update deal pipeline
    await supabase.from("pipeline").insert({
      email: email,
      status: status,
      source: "reply-webhook",
      notes: `User clicked: ${intent}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        intent,
        status,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});