import OpenAI from "https://esm.sh/openai@4.56.0";
import { createClient } from "npm:@supabase/supabase-js@2";

export const config = {
  verify_jwt: false,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !serviceRoleKey || !openaiKey) {
      return new Response(JSON.stringify({ error: "Missing required environment variables" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const openai = new OpenAI({ apiKey: openaiKey });

    let body: { dealId?: string; forceRegenerate?: boolean };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { dealId, forceRegenerate = false } = body;
    if (!dealId || typeof dealId !== "string") {
      return new Response(JSON.stringify({ error: "Valid dealId (string) is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: deal, error: dealError } = await supabase.schema("deals").from("pipeline").select("*").eq("id", dealId).single();
    if (dealError || !deal) {
      console.error("Deal fetch error:", dealError);
      return new Response(JSON.stringify({ error: "Deal not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!forceRegenerate) {
      const cutoffTime = new Date(Date.now() - CACHE_DURATION_MS).toISOString();
      const { data: cachedProposal, error: cacheError } = await supabase.schema("deals").from("proposals").select("*").eq("deal_id", dealId).eq("status", "draft").gte("created_at", cutoffTime).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (cacheError) console.error("Cache check error:", cacheError);
      if (cachedProposal) {
        const ageMinutes = Math.round((Date.now() - new Date(cachedProposal.created_at).getTime()) / 60000);
        console.log(`Cache hit: Returning proposal ${cachedProposal.proposal_id} (${ageMinutes}m old)`);
        return new Response(JSON.stringify({ success: true, cached: true, proposal: cachedProposal, proposal_url: `/proposal/${cachedProposal.proposal_id}`, generated_at: cachedProposal.created_at, cache_age_minutes: ageMinutes }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const sanitize = (str: string | null | undefined): string => {
      if (!str) return "";
      return str.replace(/[\\"]/g, "").replace(/[\n\r]/g, " ").slice(0, 500);
    };

    const companyName = sanitize(deal.company || deal.business_name || deal.lead_name || deal.name || "Client");
    const serviceType = sanitize(deal.service_type || deal.package_type || deal.interest_type || "digital marketing");
    const conversationSummary = sanitize(deal.conversation_summary || deal.notes || deal.last_message || "Prospect is interested in growing their business.");
    const estimatedValue = Math.max(0, Number(deal.value || deal.amount || 1500));

    const systemPrompt = `You are Steve Williams, a Business Growth Expert at Traffik Boosters. Generate a professional sales proposal in valid JSON format.`;
    const userPrompt = `Create a proposal for:\n\nCompany: ${companyName}\nService Type: ${serviceType}\nBudget Range: $${estimatedValue}\nContext: ${conversationSummary}\n\nRespond with ONLY this JSON structure:\n{\n  "title": "Professional proposal title (max 80 chars)",\n  "business_name": "Client company name",\n  "industry": "Industry category",\n  "conversation_summary": "Brief summary of needs (2-3 sentences)",\n  "service_type": "Primary service category",\n  "amount": ${estimatedValue},\n  "deliverables": [\n    {\n      "service": "Service category name",\n      "items": ["Specific deliverable 1", "Specific deliverable 2"]\n    }\n  ]\n}\n\nRules:\n- amount must be a number between ${Math.round(estimatedValue * 0.8)} and ${Math.round(estimatedValue * 1.2)}\n- deliverables should match the service type and budget\n- be specific and professional`;

    let aiResponse;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        aiResponse = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 1500 });
        break;
      } catch (err) {
        attempts++;
        console.error(`OpenAI attempt ${attempts} failed:`, err);
        if (attempts >= maxAttempts) throw err;
        await new Promise(r => setTimeout(r, 1000 * attempts));
      }
    }

    const outputText = aiResponse?.choices[0]?.message?.content?.trim();
    if (!outputText) {
      return new Response(JSON.stringify({ error: "AI returned empty response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let parsed: { title?: string; business_name?: string; industry?: string; conversation_summary?: string; service_type?: string; amount?: number; deliverables?: Array<{ service: string; items: string[] }>; };
    try {
      parsed = JSON.parse(outputText);
    } catch (err) {
      console.error("JSON parse error:", err, "Raw:", outputText);
      return new Response(JSON.stringify({ error: "AI returned invalid JSON", raw: outputText.slice(0, 500) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!parsed.title || !parsed.amount || typeof parsed.amount !== "number") {
      return new Response(JSON.stringify({ error: "AI response missing required fields", parsed }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const proposalId = `TB-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const proposalData = { proposal_id: proposalId, deal_id: deal.id, lead_id: deal.lead_id || null, business_name: parsed.business_name || companyName, industry: parsed.industry || "business services", conversation_summary: parsed.conversation_summary || conversationSummary, service_type: parsed.service_type || serviceType, amount: Math.round(parsed.amount), deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : [], title: parsed.title.slice(0, 120), status: "draft", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { data: proposal, error: insertError } = await supabase.schema("deals").from("proposals").insert(proposalData).select().single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save proposal", details: insertError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, cached: false, proposal, proposal_url: `/proposal/${proposal.proposal_id}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", message: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});