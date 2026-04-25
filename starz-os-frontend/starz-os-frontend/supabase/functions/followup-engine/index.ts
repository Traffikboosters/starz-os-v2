import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "prospecting" } }
  );

  try {
    const now = new Date().toISOString();

    // 📥 Get leads ready for follow-up
    const { data: leads, error } = await supabase
      .from("outreach_logs")
      .select("*")
      .eq("status", "sent")
      .not("next_follow_up_at", "is", null)
      .lte("next_follow_up_at", now)
      .limit(5);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({ message: "No follow-ups" }), { status: 200 });
    }

    for (const lead of leads) {
      const count = (lead.follow_up_count || 0) + 1;

      let message = "";

      if (count === 1) {
        message = `Just wanted to follow up — did you see my last message?`;
      } else if (count === 2) {
        message = `Quick bump — I can show you exactly how to increase leads this month.`;
      } else {
        message = `Last follow-up — should I close this out or send you the strategy?`;
      }

      // ✉️ SEND EMAIL
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Steve @ Traffik Boosters <steve@traffikboosters.com>",
          to: lead.to_email,
          subject: "Following up",
          html: `<p>${message}</p>`,
        }),
      });

      // 🧠 Schedule next follow-up
      let nextFollowUp = null;

      if (count === 1) {
        nextFollowUp = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      } else if (count === 2) {
        nextFollowUp = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      }

      await supabase
        .from("outreach_logs")
        .update({
          follow_up_count: count,
          next_follow_up_at: nextFollowUp,
        })
        .eq("id", lead.id);
    }

    return new Response(JSON.stringify({ message: "Follow-ups sent" }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});