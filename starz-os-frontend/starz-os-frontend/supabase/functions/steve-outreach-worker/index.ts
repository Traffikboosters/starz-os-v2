import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "prospecting" } }
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // 🧠 STEP 1: Recover stuck jobs (older than 5 min)
    await supabase
      .from("outreach_logs")
      .update({ status: "pending" })
      .eq("status", "processing")
      .lt(
        "last_attempt_at",
        new Date(Date.now() - 5 * 60 * 1000).toISOString()
      );

    // 📥 STEP 2: Get ONE pending job
    const { data: jobs, error: fetchError } = await supabase
      .from("outreach_logs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
      });
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No jobs" }), {
        status: 200,
      });
    }

    const job = jobs[0];

    // 🔐 STEP 3: Safely claim job
    const { error: claimError } = await supabase
      .from("outreach_logs")
      .update({
        status: "processing",
        attempts: (job.attempts || 0) + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("status", "pending");

    if (claimError) {
      console.error("Claim error:", claimError);
      return new Response(JSON.stringify({ error: claimError.message }), {
        status: 500,
      });
    }

    // 🧾 STEP 4: Prepare email
    const safeEmail = encodeURIComponent(job.to_email);

    const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background:#ffffff;">
        <div style="max-width:600px;margin:auto;">

          <div style="display:flex;align-items:center;margin-bottom:20px;">
            <img 
              src="https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Steve.png"
              style="width:60px;height:60px;border-radius:50%;margin-right:15px;"
            />
            <div>
              <strong>Steve @ Traffik Boosters</strong><br/>
              <span style="color:#666;">Business Growth Expert</span>
            </div>
          </div>

          <p style="font-size:15px;line-height:1.6;">
            ${job.message || "Hey — I found a way you can increase leads this month."}
          </p>

          <p><strong>Are you interested?</strong></p>

          <p>
            👉 <a href="http://localhost:3000/reply?email=${safeEmail}&intent=interested">Yes</a><br/>
            👉 <a href="http://localhost:3000/reply?email=${safeEmail}&intent=curious">Maybe</a><br/>
            👉 <a href="http://localhost:3000/reply?email=${safeEmail}&intent=not_interested">No</a>
          </p>

          <hr style="margin:30px 0;" />

          <div style="display:flex;align-items:flex-start;">
            <img 
              src="https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Steve.png"
              style="width:50px;height:50px;border-radius:50%;margin-right:12px;"
            />
            <div style="font-size:14px;">
              <strong>Steve Williams</strong><br/>
              Business Growth Expert<br/>
              📞 786-254-1592<br/>
              📧 steve@traffikboosters.com<br/>
              🌐 <a href="https://www.traffikboosters.com">www.traffikboosters.com</a>
            </div>
          </div>

        </div>
      </body>
    </html>
    `;

    // 📤 STEP 5: Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Steve @ Traffik Boosters <steve@traffikboosters.com>",
        to: job.to_email,
        subject: job.subject || "Quick question",
        html,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      throw new Error(emailData?.message || "Email send failed");
    }

    // ✅ STEP 6: Mark as sent
    await supabase
      .from("outreach_logs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        response: JSON.stringify(emailData),
      })
      .eq("id", job.id);

    return new Response(
      JSON.stringify({
        message: "Email sent",
        to: job.to_email,
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error("Worker error:", err);

    return new Response(
      JSON.stringify({
        error: err.message || "Unknown error",
      }),
      { status: 500 }
    );
  }
});