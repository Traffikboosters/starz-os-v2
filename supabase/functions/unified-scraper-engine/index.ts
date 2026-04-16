import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { campaign_id, tenant_id, keyword, location, sources } = await req.json();

    if (!keyword || !location || !tenant_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const crmSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: "crm" }
    });

    const activeSources = sources?.length ? sources : ["google", "yelp"];
    const started_at = new Date().toISOString();

    const { data: runData, error: runError } = await supabase
      .from("scraper_runs")
      .insert({ tenant_id, vendor_name: activeSources.join("+"), status: "running", rows_inserted: 0 })
      .select().single();

    if (runError) throw new Error(`Run insert failed: ${runError.message}`);
    const run_id = runData.id;

    const source_errors: { source: string; error: string }[] = [];
    let total_inserted = 0;
    const allLeads: any[] = [];

    for (const source of activeSources) {
      try {
        const leads = await scrapeSource(source, keyword, location);
        let src_inserted = 0;
        for (const lead of leads) {
          const { error: rowErr } = await supabase.from("lead_sources").insert({
            tenant_id,
            campaign_id: campaign_id || run_id,
            source,
            name: lead.business_name || null,
            business_name: lead.business_name || null,
            phone: lead.phone || null,
            website: lead.website || null,
          });
          if (!rowErr) {
            src_inserted++;
            allLeads.push({ ...lead, source });
          }
        }
        total_inserted += src_inserted;
      } catch (e: any) {
        source_errors.push({ source, error: e.message || "Scrape failed" });
      }
    }

    // Push to crm.leads using crm schema client
    console.log("Pushing", allLeads.length, "leads to crm.leads");
    let crmInserted = 0;
    for (const lead of allLeads) {
      const { error: crmErr } = await crmSupabase.from("leads").insert({
        business_name: lead.business_name || null,
        name: lead.business_name || null,
        company_name: lead.business_name || null,
        phone: lead.phone || null,
        website_url: lead.website || null,
        source: lead.source || "scraper",
        source_id: `scraper-${run_id}`,
        industry: keyword,
        status: "new",
        lead_score: 25,
        enrichment_status: "pending",
        raw_payload: { keyword, location, campaign_id, run_id },
      });
      if (crmErr) {
        console.error("CRM row error:", JSON.stringify(crmErr));
      } else {
        crmInserted++;
      }
    }
    console.log("CRM inserted:", crmInserted, "of", allLeads.length);

    const finished_at = new Date().toISOString();
    const final_status = source_errors.length === activeSources.length ? "failed"
      : source_errors.length > 0 ? "partial" : "completed";

    await supabase.from("scraper_runs").update({
      status: final_status,
      rows_inserted: total_inserted,
      error_message: source_errors.length ? source_errors.map(e => `${e.source}: ${e.error}`).join("; ") : null,
      finished_at,
    }).eq("id", run_id);

    return new Response(JSON.stringify({
      ok: true, attempted: activeSources.length, run_id,
      source_errors, started_at, finished_at,
      sources_used: activeSources.filter(s => !source_errors.find(e => e.source === s)),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function scrapeSource(source: string, keyword: string, location: string): Promise<any[]> {
  const serpApiKey = Deno.env.get("SERP_API_KEY");
  if (serpApiKey && serpApiKey !== "your_key_here" && source === "google") {
    try {
      const query = encodeURIComponent(`${keyword} ${location}`);
      const url = `https://serpapi.com/search.json?q=${query}&tbm=lcl&api_key=${serpApiKey}&num=20`;
      const res = await fetch(url);
      const data = await res.json();
      return (data.local_results || []).map((r: any) => ({
        business_name: r.title || null,
        phone: r.phone || null,
        website: r.website || null,
      }));
    } catch { return getMockLeads(source, keyword, location); }
  }
  return getMockLeads(source, keyword, location);
}

function getMockLeads(source: string, keyword: string, location: string): any[] {
  const kw = keyword.toLowerCase().replace(/\s+/g, '');
  return [
    { business_name: `${location} ${keyword} Pro`,     phone: "305-555-0101", website: `www.${kw}pro.com` },
    { business_name: `Best ${keyword} in ${location}`, phone: "305-555-0102", website: `www.best${kw}.com` },
    { business_name: `${keyword} Experts LLC`,         phone: "305-555-0103", website: null },
    { business_name: `Premium ${keyword} Services`,    phone: "305-555-0104", website: `www.premium${kw}.com` },
    { business_name: `${location} ${keyword} Masters`, phone: "305-555-0105", website: null },
  ];
}