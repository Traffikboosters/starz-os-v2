import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

serve(async () => {
  console.log("🔥 OUTREACH + INTELLIGENCE ENGINE RUNNING");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // 📥 GET JOB
    const { data: jobs, error } = await supabase
      .from("prospecting.outreach_logs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) throw error;

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No jobs" }), { status: 200 });
    }

    const job = jobs[0];

    console.log("📨 Processing job:", job.id);

    // 🧠 ===== MARKET INTELLIGENCE (INLINE) =====
    const industryInsights: Record<string, any> = {
      roofing: { problem: "missing high-intent Google traffic", leads: 40, revenue: 25000 },
      plumbing: { problem: "losing emergency leads due to slow response", leads: 35, revenue: 18000 },
      hvac: { problem: "not capturing seasonal demand", leads: 50, revenue: 30000 },
      dental: { problem: "low patient conversion", leads: 25, revenue: 22000 },
      real_estate: { problem: "inconsistent deal flow", leads: 20, revenue: 40000 },
      marketing: { problem: "over-reliance on referrals", leads: 30, revenue: 15000 },
    };

    const data =
      industryInsights[job.industry?.toLowerCase()] || {
        problem: "missing scalable lead systems",
        leads: 20,
        revenue: 12000,
      };

    const opportunity = `${job.business_name || "This business"} is likely losing ~${data.leads} leads/month due to ${data.problem}${job.city ? ` in ${job.city}` : ""}, resulting in ~$${data.revenue.toLocaleString()} in missed revenue.`;

    const score = Math.min(100, Math.floor(data.leads * 2 + data.revenue / 1000));

    console.log("🧠 Insight:", opportunity);

    // 💾 SAVE INTELLIGENCE
    await supabase.from("market.intelligence").insert({
      lead_id: job.id,
      business_name: job.business_name,
      industry: job.industry,
      city: job.city,
      opportunity,
      estimated_leads_missed: data.leads,
      estimated_revenue_loss: data.revenue,
      score,
    });

    // 💬 ===== BGE MESSAGE BUILDER =====
    const message = `Hey ${job.business_name || "there"} —

Quick question…

Are you currently doing anything to fix this:

${opportunity}

Most businesses don’t realize this until it’s pointed out.

Want me to show you exactly where this is happening and how to fix it?`;

    // 📧 SEND EMAIL
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Traffik Boosters <steve@traffikboosters.com>",
        to: job.to_email,
        subject: job.subject || "Quick question about your lead flow",
        html: `<p>${message.replace(/\n/g, "<br/>")}</p>`,
      }),
    });

    const emailData = await emailRes.json();

    console.log("📬 Email response:", emailData);

    if (!emailRes.ok) {
      await supabase
        .from("prospecting.outreach_logs")
        .update({
          status: "failed",
          error: JSON.stringify(emailData),
          attempts: (job.attempts || 0) + 1,
        })
        .eq("id", job.id);

      return new Response(JSON.stringify({ error: "Email failed" }), { status: 500 });
    }

    // ✅ SUCCESS
    await supabase
      .from("prospecting.outreach_logs")
      .update({
        status: "sent",
        message,
        sent_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", job.id);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        insight: opportunity,
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error("🔥 ENGINE ERROR:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});