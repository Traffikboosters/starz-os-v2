import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    console.log("Dialpad webhook received:", JSON.stringify(payload));

    const event = payload.event || payload.type || "unknown";
    const call = payload.call || payload;

    const phone = call.external_number || call.to_number || call.from_number || null;
    const dialpadCallId = call.call_id || call.id || null;
    const duration = call.duration || call.total_duration || 0;
    const recordingUrl = call.recording_url || null;
    const transcript = call.transcript || null;
    const status = call.state || call.status || event;

    // Save to public.calls
    const { error: callError } = await supabase.from("calls").insert({
      contact_number: phone,
      direction: call.direction || "outbound",
      duration_seconds: duration,
      status: status,
      transcript: transcript,
      recording_url: recordingUrl,
      external_call_id: dialpadCallId,
      provider: "dialpad",
      tenant_id: "00000000-0000-0000-0000-000000000301",
      started_at: call.date_started ? new Date(call.date_started * 1000).toISOString() : new Date().toISOString(),
      ended_at: call.date_ended ? new Date(call.date_ended * 1000).toISOString() : null,
    });

    if (callError) console.error("Call insert error:", callError);

    // Auto-update lead if phone matches
    if (phone) {
      const { data: lead } = await supabase
        .from("leads")
        .select("id, score")
        .eq("phone", phone)
        .eq("tenant_id", "00000000-0000-0000-0000-000000000301")
        .maybeSingle();

      if (lead) {
        // Analyze transcript for interest signals
        const text = (transcript || "").toLowerCase();
        const interested = text.includes("yes") || text.includes("interested") || text.includes("send me") || text.includes("tell me more");
        const notInterested = text.includes("not interested") || text.includes("remove") || text.includes("do not call");

        let newStatus = "Contacted";
        if (interested) newStatus = "Hot";
        if (notInterested) newStatus = "Disqualified";

        await supabase.from("leads").update({
          status: newStatus,
          last_contacted_at: new Date().toISOString(),
          score: interested ? Math.min(100, (lead.score || 0) + 20) : lead.score,
          updated_at: new Date().toISOString(),
        }).eq("id", lead.id);

        // Create deal if interested
        if (interested) {
          const { data: existingDeal } = await supabase
            .schema("deals")
            .from("pipeline")
            .select("id")
            .eq("lead_email", lead.id)
            .maybeSingle();

          if (!existingDeal) {
            await supabase.schema("deals").from("pipeline").insert({
              lead_email: phone,
              stage: "qualified",
              notes: `Auto-created from Dialpad call. Transcript signal: interested. Call ID: ${dialpadCallId}`,
              interest_level: "high",
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, event }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Dialpad webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
