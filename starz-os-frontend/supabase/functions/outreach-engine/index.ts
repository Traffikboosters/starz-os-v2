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
  metadata?: {
    revenue_tier?:  string;
    offer_system?:  string;
    business_name?: string;
    niche?:         string;
    city?:          string;
    estimated_revenue?: number;
  };
};

const SCHEMA        = "outreach";
const QUEUE_TABLE   = "outreach_queue";
const STALE_MINUTES = 10;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function generateSteveMessage(
  job: QueueJob,
  anthropicApiKey: string
): Promise<{ subject: string; htmlBody: string }> {

  const toEmail = job.lead_email ?? job.email;
  const score   = job.deal_score ?? job.ai_score ?? null;

  const meta         = job.metadata ?? {};
  const revenueTier  = meta.revenue_tier  ?? null;
  const offerSystem  = meta.offer_system  ?? null;
  const businessName = meta.business_name ?? null;
  const niche        = meta.niche         ?? null;
  const city         = meta.city          ?? null;
  const estRevenue   = meta.estimated_revenue ?? null;

  const leadContext = [
    `Email: ${toEmail}`,
    businessName ? `Business: ${businessName}`                              : null,
    niche        ? `Industry: ${niche}`                                     : null,
    city         ? `Location: ${city}`                                      : null,
    estRevenue   ? `Estimated monthly revenue: $${estRevenue.toLocaleString()}` : null,
    score        ? `Lead score: ${score}/100`                               : null,
    revenueTier  ? `Revenue tier: ${revenueTier}`                           : null,
    offerSystem  ? `Recommended offer: ${offerSystem}`                      : null,
    job.lead_id  ? `Lead ID: ${job.lead_id}`                                : null,
  ].filter(Boolean).join("\n");

  const prompt = `You are Steve, a Business Growth Expert at Traffik Boosters. You help businesses grow their revenue through professional web design, SEO, digital marketing, and business growth consulting.

Your personality:
- Professional and formal but warm
- Confident without being pushy
- Consultative - you lead with value, not a hard sell
- You keep emails concise (150-200 words max)
- You always end with a clear, low-pressure call to action

Lead information:
${leadContext}

${score && score >= 80 ? "This is a HIGH SCORE lead - prioritize urgency and personalization." : ""}
${score && score >= 50 && score < 80 ? "This is a MEDIUM SCORE lead - focus on value and education." : ""}
${score && score < 50 ? "This is a LOWER SCORE lead - focus on awareness and soft introduction." : ""}
${revenueTier === "ignition"  ? "Pitch the Revenue Ignition System. Goal: break past $65K/month. Pain points: unpredictable revenue, invisible online, no consistent lead system. Keep tone empathetic." : ""}
${revenueTier === "dominance" ? "Pitch the Dominance Growth System. Goal: own their market. Angles: competitor intelligence, full automation, top-3 SEO domination. Tone: peer-to-peer, strategic." : ""}

Write a personalized cold outreach email from Steve to this lead. The email should:
1. Open with a compelling, professional hook
2. Briefly introduce Steve and Traffik Boosters
3. ${revenueTier === "ignition" ? "Focus on Revenue Ignition System and breaking the $65K/month ceiling" : revenueTier === "dominance" ? "Focus on Dominance Growth System and market domination" : "Mention 1-2 specific services relevant to their business"}
4. Include a soft call to action
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
        "Content-Type":      "application/json",
        "x-api-key":         anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-5",
        max_tokens: 1024,
        messages:   [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const data   = await response.json();
    const text   = data.content?.[0]?.text ?? "";
    const clean  = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const subject = parsed.subject ?? "Growing Your Business with Traffik Boosters";
    const body    = parsed.body    ?? "";

    const accentColor = revenueTier === "ignition"
      ? "#1D9E75"
      : revenueTier === "dominance"
      ? "#534AB7"
      : "#6366f1";

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:Arial,sans-serif;font-size:15px;color:#222;line-height:1.7;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e3dc;">
  <tr><td style="background:${accentColor};height:5px;padding:0;font-size:0"> </td></tr>
  <tr><td style="padding:32px 36px;">
    ${body.split("\n").map((line: string) =>
        line.trim() === ""
          ? "<br/>"
          : `<p style="margin:0 0 14px 0;">${line}</p>`
      ).join("")}
  </td></tr>
  <tr><td style="padding:20px 36px;background:#f5f4f0;border-top:1px solid #e5e3dc;">
    <p style="margin:0;font-size:13px;color:#888;">
      Steve Williams - Business Growth Expert<br/>
      Traffik Boosters - Web Design - SEO - Digital Marketing - Business Growth<br/>
      <a href="https://traffikboosters.com" style="color:${accentColor};text-decoration:none;">traffikboosters.com</a>
       - 786-254-1592
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    return { subject, htmlBody };

  } catch (err) {
    console.error("Claude AI failed, using fallback:", err);

    const fallbackBody = revenueTier === "ignition"
      ? `<p>Hello${businessName ? ` ${businessName}` : ""},</p><p>My name is Steve, and I am a Business Growth Expert at Traffik Boosters.</p><p>I took a look at your business and noticed you are in a strong position to grow. We built the <strong>Revenue Ignition System</strong> specifically for businesses looking to break past $65K/month consistently.</p><p>Would you be open to a quick 15-minute call this week?</p><p>Best regards,<br/><strong>Steve Williams</strong><br/>Traffik Boosters</p>`
      : revenueTier === "dominance"
      ? `<p>Hello${businessName ? ` ${businessName}` : ""},</p><p>My name is Steve, and I am a Business Growth Expert at Traffik Boosters.</p><p>After analyzing your market, there is a significant opportunity to dominate your space. We use the <strong>Dominance Growth System</strong> for businesses at your level, focused on top-3 rankings, competitor intelligence, and full automation.</p><p>Would you have 15 minutes this week?</p><p>Best regards,<br/><strong>Steve Williams</strong><br/>Traffik Boosters</p>`
      : `<p>Hello,</p><p>My name is Steve, and I am a Business Growth Expert at Traffik Boosters.</p><p>We specialize in helping businesses grow through professional web design, SEO, and targeted digital marketing.</p><p>I would love to schedule a quick 15-minute call. Would you be open to connecting this week?</p><p>Best regards,<br/><strong>Steve Williams</strong><br/>Traffik Boosters</p>`;

    const fallbackHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f5f4f0;font-family:Arial,sans-serif;font-size:15px;color:#222;line-height:1.7;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e3dc;"><tr><td style="background:#6366f1;height:5px;padding:0;font-size:0"> </td></tr><tr><td style="padding:32px 36px;">${fallbackBody}</td></tr><tr><td style="padding:20px 36px;background:#f5f4f0;border-top:1px solid #e5e3dc;"><p style="margin:0;font-size:13px;color:#888;">Traffik Boosters - <a href="https://traffikboosters.com" style="color:#6366f1;text-decoration:none;">traffikboosters.com</a></p></td></tr></table></td></tr></table></body></html>`;

    return {
      subject: job.subject ?? (
        revenueTier === "ignition"  ? `Quick question about ${businessName ?? "your business"} growth` :
        revenueTier === "dominance" ? `${businessName ?? "Your business"} - we mapped your competitive gap` :
        "Growing Your Business - Traffik Boosters"
      ),
      htmlBody: fallbackHtml,
    };
  }
}

async function handleProposalGenerate(req: Request) {
  const { lead } = await req.json();
  const tier = lead?.revenue_tier ?? "ignition";
  const name = lead?.business_name ?? lead?.name ?? "your business";

  const proposal = tier === "dominance" ? {
    title:        "Dominance Growth System",
    tagline:      "Own your market",
    positioning:  `We turn ${name} into the dominant player in your market.`,
    deliverables: [
      "Advanced SEO - top 3 keyword domination",
      "Competitor intelligence engine (24/7 monitoring)",
      "Full automation - STARZ-OS + Steve + PowerDial",
      "Paid ads + retargeting (Google + social)",
      "Conversion rate optimization (CRO)",
      "Dedicated growth director + monthly strategy sessions",
    ],
    option_a: { label: "Premium Monthly",          price: "$4,000 - $10,000+/month",        detail: "Full system. Fixed monthly. Dedicated growth director." },
    option_b: { label: "Base + Performance Bonus", price: "$2,500/month + KPI bonuses",      detail: "Lower base with bonuses tied to agreed milestones." },
    option_c: { label: "Revenue Share",            price: "$1,000/month + % attributed rev", detail: "Fully aligned incentives. We grow when you grow." },
    commitment: "3-month initial term. Month-to-month after.",
    guarantee:  "System live within 72 hours of first payment.",
  } : {
    title:        "Revenue Ignition System",
    tagline:      "Break your revenue ceiling",
    positioning:  `We help ${name} build the predictable growth system that breaks you past $65K/month.`,
    deliverables: [
      "SEO foundation + local rankings",
      "Lead generation engine (scraping + enrichment)",
      "Conversion system (funnels + follow-ups)",
      "Review boost + reputation management",
      "AI outreach - Steve BGE 24/7",
    ],
    option_a: { label: "Standard Monthly",   price: "$1,500 - $3,500/month",       detail: "Fixed monthly. Full system. 35% deposit to start." },
    option_b: { label: "Performance Hybrid", price: "Lower base + % closed deals", detail: "Pay more when we perform. Best for tight budgets." },
    commitment: "3-month initial term. Month-to-month after.",
    guarantee:  "System live within 72 hours of first payment.",
  };

  return new Response(JSON.stringify({ success: true, proposal, tier }), {
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
    }});
  }

  const url = new URL(req.url);

  if (url.pathname.includes("/proposal/generate")) {
    return await handleProposalGenerate(req);
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    if (body?.lead) {
      const lead            = body.lead;
      const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
      const resendApiKey    = Deno.env.get("RESEND_API_KEY")!;
      const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
      const serviceRole     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const mockJob: QueueJob = {
        id: 0, lead_id: lead.id ?? null, email: lead.email ?? "",
        lead_email: lead.email ?? null, subject: null, status: "pending",
        attempts: 0, max_attempts: 4, deal_score: null, ai_score: null,
        scheduled_for: null, last_attempt_at: null, next_retry_at: null,
        created_at: null, last_error: null,
        metadata: {
          revenue_tier:      lead.revenue_tier,
          offer_system:      lead.recommended_offer ?? lead.offer_system,
          business_name:     lead.business_name,
          niche:             lead.niche,
          city:              lead.city,
          estimated_revenue: lead.estimated_revenue,
        },
      };

      const { subject, htmlBody } = await generateSteveMessage(mockJob, anthropicApiKey);

      if (lead.email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Steve from Traffik Boosters <steve@traffikboosters.com>",
            to: [lead.email], subject, html: htmlBody,
          }),
        });

        if (lead.id) {
          await fetch(`${supabaseUrl}/rest/v1/outreach_logs`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRole}`,
              "Content-Type": "application/json",
              apikey: serviceRole,
            },
            body: JSON.stringify({
              lead_id: lead.id, channel: "email", message: subject,
              to_email: lead.email, status: "sent",
              sent_at: new Date().toISOString(), metadata: mockJob.metadata,
            }),
          });
        }
      }

      return json({ success: true, subject, tier: lead.revenue_tier });
    }
  }

  try {
    const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
    const serviceRole     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey    = Deno.env.get("RESEND_API_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    const supabase  = createClient(supabaseUrl, serviceRole);
    const staleTime = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();

    await supabase
      .schema(SCHEMA).from(QUEUE_TABLE)
      .update({ status: "pending", last_error: "Reset from stale" })
      .eq("status", "processing").lt("last_attempt_at", staleTime);

    const { data: jobs, error: fetchError } = await supabase
      .schema(SCHEMA).from(QUEUE_TABLE)
      .select("*").eq("status", "pending")
      .order("id", { ascending: true }).limit(1);

    if (fetchError) throw fetchError;
    if (!jobs || jobs.length === 0) return json({ message: "No pending jobs" }, 200);

    const job: QueueJob = jobs[0];
    const toEmail = job.lead_email ?? job.email;
    console.log("Processing job:", job.id, "->", toEmail);

    const attempts = (job.attempts ?? 0) + 1;
    const now      = new Date().toISOString();

    const { data: claimed } = await supabase
      .schema(SCHEMA).from(QUEUE_TABLE)
      .update({ status: "processing", attempts, last_attempt_at: now, last_error: null })
      .eq("id", job.id).eq("status", "pending").select("id");

    if (!claimed || claimed.length === 0) return json({ message: "Already claimed" }, 200);

    console.log("Steve AI generating for:", toEmail,
      job.metadata?.revenue_tier ? `(tier: ${job.metadata.revenue_tier})` : "");
    const { subject, htmlBody } = await generateSteveMessage(job, anthropicApiKey);
    console.log("Subject:", subject);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Steve from Traffik Boosters <steve@traffikboosters.com>",
        to: [toEmail], subject, html: htmlBody,
      }),
    });

    if (!emailRes.ok) {
      const errorData = await emailRes.json().catch(() => ({}));
      throw new Error((errorData as { message?: string })?.message ?? "Email send failed");
    }

    const emailData = await emailRes.json();
    console.log("Email sent! Resend ID:", (emailData as { id?: string })?.id);

    await supabase
      .schema(SCHEMA).from(QUEUE_TABLE)
      .update({ status: "sent", last_attempt_at: now })
      .eq("id", job.id);

    return json({ success: true, jobId: job.id, email: toEmail, subject });

  } catch (err) {
    console.error("Engine error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});