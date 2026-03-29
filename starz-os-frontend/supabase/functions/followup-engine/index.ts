import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();

    const { data: jobs } = await supabase
      .from("prospecting.outreach_logs")
      .select("*")
      .eq("status", "sent")
      .lt("follow_up_stage", 3);

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No follow-ups" }));
    }

    for (const job of jobs) {
      const last = new Date(job.last_contacted_at);
      const hoursPassed = (now.getTime() - last.getTime()) / 1000 / 60 / 60;

      let shouldSend = false;
      let message = "";

      if (job.follow_up_stage === 0 && hoursPassed >= 48) {
        shouldSend = true;
        message = `Hey — just wanted to follow up. Still open to seeing how you can get more leads this month?`;
      }

      if (job.follow_up_stage === 1 && hoursPassed >= 72) {
        shouldSend = true;
        message = `Quick nudge — we helped similar businesses increase leads fast. Want me to send a breakdown?`;
      }

      if (!shouldSend) continue;

      // SEND EMAIL (Resend)
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Steve <steve@traffikboosters.com>",
          to: job.to_email,
          subject: "Following up",
          html: `<p>${message}</p>`,
        }),
      });

      await supabase
        .from("prospecting.outreach_logs")
        .update({
          follow_up_stage: job.follow_up_stage + 1,
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }

    return new Response(JSON.stringify({ message: "Follow-ups sent" }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});