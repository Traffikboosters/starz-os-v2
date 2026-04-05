import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";
serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(()=>({}));
  const { lead_id } = body;
  try {
    let leads: any[] = [];
    if (lead_id) {
      const { data } = await sb.from("leads").select("*").eq("id",lead_id).single();
      if (data) leads = [data];
    } else {
      const { data } = await sb.from("leads").select("*").eq("disposition","hot_handoff").eq("tenant_id","00000000-0000-0000-0000-000000000301").is("assigned_to",null).limit(10);
      leads = data || [];
    }
    if (leads.length === 0) return new Response(JSON.stringify({ message: "No hot leads ready for handoff" }),{status:200});
    const results = [];
    const errors = [];
    for (const lead of leads) {
      const notes = (() => { try { return JSON.parse(lead.notes||"{}"); } catch { return {}; } })();
      const businessName = lead.business_name || lead.name || "Unknown Business";
      // Only create a pipeline deal - NO work order until client pays
      const { data: deal, error: dealErr } = await sb.schema("deals").from("pipeline").insert({
        lead_email: lead.email || null,
        stage: "qualified",
        interest_level: "high",
        notes: JSON.stringify({
          business_name: businessName,
          phone: lead.phone,
          industry: lead.industry,
          score: lead.score,
          pain_points: notes.pain_points,
          website: notes.website,
          rating: notes.rating,
          review_count: notes.review_count,
          source: "Steve BGE - Qualified Lead",
          next_step: "Rico to prepare proposal after Steve confirms conversation",
          handoff_at: new Date().toISOString(),
        }),
      }).select().single();
      if (dealErr) { errors.push({ lead: businessName, error: dealErr.message }); continue; }
      // Mark lead as handed off to Rico
      await sb.from("leads").update({
        status: "Handoff",
        assigned_to: "rico",
        assigned_at: new Date().toISOString(),
        assignment_method: "steve_qualified",
        disposition: "proposal_pending",
        updated_at: new Date().toISOString(),
      }).eq("id",lead.id);
      // Notify Rico via email
      const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
      await fetch("https://api.resend.com/emails",{
        method:"POST",
        headers:{Authorization:"Bearer "+RESEND_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({
          from:"Steve Williams <steve@traffikboosters.com>",
          to:"admin@traffikboosters.com",
          subject:"Qualified Lead Ready for Proposal: "+businessName,
          html:"<h2>New Qualified Lead</h2><p><strong>"+businessName+"</strong> has been qualified by Steve and is ready for a proposal.</p><p><strong>Industry:</strong> "+lead.industry+"</p><p><strong>Phone:</strong> "+(lead.phone||"N/A")+"</p><p><strong>Pain Points:</strong> "+(notes.pain_points?.join(", ")||"N/A")+"</p><p><strong>Next Step:</strong> Prepare proposal after Steve confirms the conversation.</p><p><em>Do NOT create a work order until client signs and pays.</em></p>",
        }),
      });
      results.push({ lead: businessName, deal_id: deal?.id, status: "Qualified - Proposal Pending" });
    }
    return new Response(JSON.stringify({ success:true, handed_off:results.length, results, errors }),{status:200});
  } catch(err:any) {
    return new Response(JSON.stringify({ error:err.message }),{status:500});
  }
});