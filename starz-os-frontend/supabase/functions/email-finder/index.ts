import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";
const HUNTER_KEY = Deno.env.get("HUNTER_API_KEY")!;
const TENANT = "00000000-0000-0000-0000-000000000301";
function extractDomain(website: string): string|null {
  try {
    const url = new URL(website.startsWith("http") ? website : "https://"+website);
    return url.hostname.replace("www.","");
  } catch { return null; }
}
serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(()=>({}));
  const limit = body.limit || 20;
  const stats = {processed:0,found:0,skipped:0,errors:[] as string[]};
  try {
    const {data:leads,error:le} = await sb.from("leads")
      .select("id,business_name,email,notes")
      .eq("tenant_id",TENANT)
      .is("email",null)
      .not("notes","is",null)
      .limit(limit);
    if (le) return new Response(JSON.stringify({error:le.message}),{status:500});
    if (!leads||leads.length===0) return new Response(JSON.stringify({message:"No leads need email finding"}),{status:200});
    for (const lead of leads) {
      stats.processed++;
      try {
        const notes = JSON.parse(lead.notes||"{}");
        const website = notes.website;
        if (!website) { stats.skipped++; continue; }
        const domain = extractDomain(website);
        if (!domain) { stats.skipped++; continue; }
        const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&limit=5&api_key=${HUNTER_KEY}`;
        const hr = await fetch(hunterUrl);
        const hd = await hr.json();
        if (!hr.ok || hd.errors) { stats.errors.push(`${lead.business_name}: ${hd.errors?.[0]?.details||"Hunter error"}`); continue; }
        const emails = hd.data?.emails||[];
        if (emails.length===0) { stats.skipped++; continue; }
        const best = emails.sort((a:any,b:any)=>b.confidence-a.confidence)[0];
        if (!best?.value||best.confidence<50) { stats.skipped++; continue; }
        const {error:ue} = await sb.from("leads").update({
          email: best.value,
          updated_at: new Date().toISOString(),
        }).eq("id",lead.id);
        if (ue) { stats.errors.push(`${lead.business_name}: ${ue.message}`); continue; }
        await sb.schema("outreach").from("outreach_queue").upsert({
          email: best.value,
          lead_email: best.value,
          subject: null,
          status: "pending",
          attempts: 0,
          max_attempts: 3,
          ai_score: 70,
          deal_score: 70,
          scheduled_for: new Date().toISOString(),
        },{onConflict:"email"});
        stats.found++;
        console.log(`Found email for ${lead.business_name}: ${best.value} (confidence: ${best.confidence})`);
        await new Promise(r=>setTimeout(r,200));
      } catch(e:any){stats.errors.push(`${lead.business_name}: ${e.message}`);}
    }
    return new Response(JSON.stringify({success:true,...stats}),{status:200});
  } catch(err:any){
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
});