import { createClient } from "npm:@supabase/supabase-js@2.46.1";

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: unknown;
};

function extractAiText(aiData: OpenAIResponse): string {
  // 1) Preferred Responses API convenience field
  if (typeof aiData?.output_text === "string" && aiData.output_text.trim().length > 0) {
    return aiData.output_text.trim();
  }

  // 2) Responses API structured output
  const outputParts = aiData?.output ?? [];
  const collected = outputParts
    .flatMap((item) => item?.content ?? [])
    .map((c) => (typeof c?.text === "string" ? c.text : ""))
    .join("\n")
    .trim();

  if (collected.length > 0) return collected;

  // 3) Chat Completions style fallback
  const choiceContent = aiData?.choices?.[0]?.message?.content;
  if (typeof choiceContent === "string" && choiceContent.trim().length > 0) {
    return choiceContent.trim();
  }

  return "";
}

Deno.serve(async () => {
  console.log("🔥 OUTREACH ENGINE V4 RUNNING");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1) Get next pending job
    const { data: jobs, error: fetchError } = await supabase
      .schema("prospecting")
      .from("outreach_logs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (fetchError) throw fetchError;

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No jobs" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const job = jobs[0];
    console.log("📨 Processing job:", job.id);

    // 2) Generate message
    let message = "";

    if (openAiKey) {
      try {
        const aiRes = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            input: `Write a short, high-converting cold outreach email.

Business: ${job.business_name || "local business"}
Goal: Increase leads
Tone: casual, confident, not salesy
Length: under 80 words`,
          }),
        });

        const aiData = (await aiRes.json()) as OpenAIResponse;
        console.log("🧠 AI status:", aiRes.status);
        console.log("🧠 AI RAW:", JSON.stringify(aiData));

        if (aiRes.ok) {
          message = extractAiText(aiData);
        } else {
          console.error("AI non-200 response:", aiData?.error ?? aiData);
        }
      } catch (aiError) {
        console.error("AI ERROR:", aiError);
      }
    } else {
      console.warn("OPENAI_API_KEY missing; using fallback message");
    }

    // 3) Fallback copy if AI empty
    if (!message || message.length < 10) {
      message = `Hey — I came across your business and noticed a few missed opportunities to bring in more leads.

I put together a quick breakdown of what’s working right now in your market.

Want me to send it over?`;
    }

    // 4) Send email
    if (!resendKey) {
      await supabase
        .schema("prospecting")
        .from("outreach_logs")
        .update({
          status: "failed",
          error: "Missing RESEND_API_KEY",
          attempts: (job.attempts || 0) + 1,
        })
        .eq("id", job.id);

      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Traffik Boosters <steve@traffikboosters.com>",
        to: job.to_email,
        subject: job.subject || "Quick idea to increase your leads",
        html: `<p>${message.replace(/\n/g, "<br/>")}</p>`,
      }),
    });

    const emailData = await emailRes.json();
    console.log("📬 Email status:", emailRes.status);
    console.log("📬 Email response:", emailData);

    if (!emailRes.ok) {
      await supabase
        .schema("prospecting")
        .from("outreach_logs")
        .update({
          status: "failed",
          error: JSON.stringify(emailData),
          attempts: (job.attempts || 0) + 1,
        })
        .eq("id", job.id);

      return new Response(JSON.stringify({ error: "Email failed", details: emailData }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5) Success
    await supabase
      .schema("prospecting")
      .from("outreach_logs")
      .update({
        status: "sent",
        message,
        sent_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", job.id);

    return new Response(JSON.stringify({ message: "Outreach sent", job_id: job.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🔥 ENGINE ERROR:", err);

    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});