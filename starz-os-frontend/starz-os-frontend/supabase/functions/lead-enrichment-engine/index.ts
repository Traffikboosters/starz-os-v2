import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const { data: leads, error } = await supabase.from("leads")
      .select("*").eq("status","New")
      .eq("tenant_id","00000000-0000-0000-0000-000000000301")
      .limit(10);

    if (error) throw error;
    if (!leads||leads.length===0) return new Response(JSON.stringify({message:"No leads to enrich"}),{status:200});

    const results = [];
    for (const lead of leads) {
      try {
        const notes = (() => { try { return JSON.parse(lead.notes||"{}"); } catch { return {}; } })();
        const reviews = notes.review_count || 0;
        const rating = notes.rating || 0;
        const hasWebsite = !!notes.website;
        const industry = (lead.industry||"").toLowerCase();

        // INTEREST SCORE (0-30): How likely they need marketing
        // Low reviews = more pain, high reviews = established but needs SEO
        let interest = 0;
        if (reviews < 20) interest = 28;        // tiny — desperately needs leads
        else if (reviews < 50) interest = 25;   // small — needs growth
        else if (reviews < 150) interest = 20;  // medium — has some traction
        else if (reviews < 500) interest = 18;  // growing — needs scale
        else interest = 12;                     // large — harder sell (Roto-Rooter etc)

        // NEED SCORE (0-30): Based on website + SEO signals
        let need = 0;
        if (!hasWebsite) need = 28;             // no website = huge pain
        else if (reviews < 30) need = 24;       // website but tiny presence
        else if (reviews < 100) need = 20;      // website but weak SEO signal
        else if (reviews < 300) need = 16;      // decent but room to grow
        else need = 10;                         // strong presence

        // URGENCY SCORE (0-20): Rating signals
        let urgency = 0;
        if (rating >= 4.8 && reviews < 100) urgency = 18;  // great service, low visibility = urgent
        else if (rating >= 4.5 && reviews < 200) urgency = 15;
        else if (rating >= 4.0) urgency = 10;
        else urgency = 6;

        // AUTHORITY SCORE (0-20): Industry value + phone present
        const highValueIndustries = ["roofing","hvac","dental","attorney","plumber","plumbing"];
        let authority = highValueIndustries.some(i => industry.includes(i)) ? 14 : 8;
        if (lead.phone) authority += 4;
        if (hasWebsite) authority += 2;

        const totalScore = Math.min(100, interest + need + urgency + authority);

        // Real disposition logic
        const disposition = totalScore >= 75 ? "hot_handoff"
          : totalScore >= 55 ? "handoff_ready"
          : totalScore >= 35 ? "nurture"
          : "disqualified";

        // Build pain points from real data
        const painPoints = [];
        if (!hasWebsite) painPoints.push("No website");
        if (reviews < 20) painPoints.push("Almost no online reviews");
        else if (reviews < 50) painPoints.push("Very few reviews — low visibility");
        if (rating < 4.3) painPoints.push("Below average rating");
        if (reviews < 100 && hasWebsite) painPoints.push("Weak SEO presence");
        if (reviews >= 100 && reviews < 300) painPoints.push("Needs more review volume to dominate");
        if (reviews >= 300) painPoints.push("Established but needs lead system optimization");

        await supabase.from("leads").update({
          score: totalScore,
          disposition,
          status: disposition === "disqualified" ? "Disqualified" : "Enriched",
          notes: JSON.stringify({
            ...notes,
            pain_points: painPoints,
            seo_strength: reviews > 300 ? "moderate" : reviews > 100 ? "weak" : "very_weak",
            likely_running_ads: reviews > 200,
            revenue_estimate: reviews > 500 ? "high" : reviews > 100 ? "medium" : "low",
            enriched_at: new Date().toISOString(),
          }),
          updated_at: new Date().toISOString(),
        }).eq("id", lead.id);

        results.push({ id:lead.id, name:lead.business_name||lead.name, score:totalScore, disposition, reviews, rating, hasWebsite });
      } catch(e) { console.error("Lead error", lead.id, e); }
    }

    return new Response(JSON.stringify({ success:true, enriched:results.length, results }), { status:200 });
  } catch(err) {
    return new Response(JSON.stringify({ error:err.message }), { status:500 });
  }
});
