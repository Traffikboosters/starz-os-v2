import { createClient } from "npm:@supabase/supabase-js@2.46.1";

type QueueJob = {
  id: number;
  lead_id: string | null;
  email: string;
  lead_email: string | null;
  subject: string | null;
  status: string;
  attempts: number | null;
  max_attempts: number | null;
  deal_score: number | null;
  ai_score: number | null;
  scheduled_for: string | null;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  created_at: string | null;
  last_error: string | null;
};

const SCHEMA = "outreach";
const QUEUE_TABLE = "outreach_queue";
const STALE_MINUTES = 10;
const FALLBACK_MAX_ATTEMPTS = 4;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ═══════════════════════════════════════════════
// 🧠 STEVE AI — Powered by Claude Sonnet
// ═══════════════════════════════════════════════
async function generateSteveMessage(
  job: QueueJob,
  anthropicApiKey: string
): Promise<{ subject: string; htmlBody: string }> {

  const toEmail = job.lead_email ?? job.email;
  const score = job.deal_score ?? job.ai_score ?? null;

  const leadContext = [
    `Email: ${toEmail}`,
    score ? `Lead score: ${score}/100` : null,
    job.lead_id ? `Lead ID: ${job.lead_id}` : null,
  ].filter(Boolean).join("\n");

  const prompt = `You are Steve, a Business Growth Expert at Traffik Boosters. You help businesses grow their revenue through professional web design, SEO, digital marketing, and business growth consulting.

Your personality:
- Professional and formal but warm
- Confident without being pushy
- Consultative — you lead with value, not a hard sell
- You keep emails concise (150-200 words max)
- You always end with a clear, low-pressure call to action

Lead information:
${leadContext}

${score && score >= 80 ? "This is a HIGH SCORE lead — prioritize urgency and personalization." : ""}
${score && score >= 50 && score < 80 ? "This is a MEDIUM SCORE lead — focus on value and education." : ""}
${score && score < 50 ? "This is a LOWER SCORE lead — focus on awareness and soft introduction." : ""}

Write a personalized cold outreach email from Steve to this lead. The email should:
1. Open with a compelling, professional hook
2. Briefly introduce Steve and Traffik Boosters
3. Mention 1-2 specific services relevant to their business
4. Include a soft call to action (schedule a quick call, reply to learn more)
5. Sign off professionally as Steve from Traffik Boosters

Respond ONLY in this exact JSON format with no other text:
{
  "subject": "email subject line here",
  "body": "full email body here with line breaks as \\n"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const subject = parsed.subject ?? "Growing Your Business with Traffik Boosters";
    const body = parsed.body ?? "";

    const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;font-size:15px;color:#222;line-height:1.7;max-width:600px;margin:0 auto;padding:20px;">
  ${body.split("\n").map((line: string) =>
      line.trim() === "" ? "<br/>" : `<p style="margin:0 0 12px 0;">${line}</p>`
    ).join("")}
  <br/>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
  <p style="font-size:13px;color:#888;margin:0;">
    Traffik Boosters | Web Design · SEO · Digital Marketing · Business Growth<br/>
    <a href="https://traffikboosters.com" style="color:#6366f1;text-decoration:none;">traffikboosters.com</a>
  </p>
</body>
</html>`;

    return { subject, htmlBody };

  } catch (err) {
    console.error("❌ Claude AI failed, using fallback:", err);

    const fallbackHtml = `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;font-size:15px;color:#222;line-height:1.7;max-width:600px;margin:0 auto;padding:20px;">
  <p>Hello,</p>
  <p>My name is Steve, and I'm a Business Growth Expert at Traffik Boosters.</p>
  <p>We specialize in helping businesses grow through professional web design, SEO, targeted digital marketing, and proven business growth strategies.</p>
  <p>I'd love to schedule a quick 15-minute call to explore how we can help drive more traffic and revenue to your business. Would you be open to connecting this week?</p>
  <p>Best regards,<br/><strong>Steve</strong><br/>Business Growth Expert<br/>Traffik Boosters</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
  <p style="font-size:13px;color:#888;">Traffik Boosters | Web Design · SEO · Digital Marketing · Business Growth</p>
</body>
</html>`;

    return {
      subject: job.subject ?? "Growing Your Business — Traffik Boosters",
      htmlBody: fallbackHtml,
    };
  }
}

// ═══════════════════════════════════════════════
// 🚀 MAIN ENGINE
// ═══════════════════════════════════════════════
Deno.serve(async () => {
  try {
    const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
    const serviceRole     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey    = Deno.env.get("RESEND_API_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRole);
    const staleTime = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();

    // Reset stale processing jobs
    await supabase
      .schema(SCHEMA)
      .from(QUEUE_TABLE)
      .update({ status: "pending", last_error: "Reset from stale" })
      .eq("status", "processing")
      .lt("last_attempt_at", staleTime);

    // Get next pending job
    const { data: jobs, error: fetchError } = await supabase
      .schema(SCHEMA)
      .from(QUEUE_TABLE)
      .select("*")
      .eq("status", "pending")
      .order("id", { ascending: true })
      .limit(1);

    if (fetchError) throw fetchError;
    if (!jobs || jobs.length === 0) {
      return json({ message: "No pending jobs" }, 200);
    }

    const job: QueueJob = jobs[0];
    const toEmail = job.lead_email ?? job.email;
    console.log("🤖 Processing job:", job.id, "→", toEmail);

    const attempts = (job.attempts ?? 0) + 1;
    const now = new Date().toISOString();

    // Claim job
    const { data: claimed } = await supabase
      .schema(SCHEMA)
      .from(QUEUE_TABLE)
      .update({
        status: "processing",
        attempts,
        last_attempt_at: now,
        last_error: null,
      })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id");

    if (!claimed || claimed.length === 0) {
      return json({ message: "Already claimed" }, 200);
    }

    // 🧠 Generate personalized message with Steve AI
    console.log("🧠 Steve AI generating message for:", toEmail);
    const { subject, htmlBody } = await generateSteveMessage(job, anthropicApiKey);
    console.log("✅ Steve AI subject:", subject);

    // 📬 Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Steve <steve@traffikboosters.com>",
        to: [toEmail],
        subject,
        html: htmlBody,
      }),
    });

    if (!emailRes.ok) {
      const errorData = await emailRes.json().catch(() => ({}));
      throw new Error((errorData as { message?: string })?.message ?? "Email send failed");
    }

    const emailData = await emailRes.json();
    console.log("📨 Email sent! Resend ID:", (emailData as { id?: string })?.id);

    // ✅ Mark as sent
    await supabase
      .schema(SCHEMA)
      .from(QUEUE_TABLE)
      .update({ status: "sent", last_attempt_at: now })
      .eq("id", job.id);

    return json({
      success: true,
      jobId: job.id,
      email: toEmail,
      subject,
    });

  } catch (err) {
    console.error("❌ Engine error:", err);
    return json({
      error: err instanceof Error ? err.message : "Unknown error",
    }, 500);
  }
});