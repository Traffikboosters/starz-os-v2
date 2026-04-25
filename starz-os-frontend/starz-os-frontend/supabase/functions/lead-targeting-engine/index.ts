import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const { data: leads, error } = await supabase.from("leads")
      .select("*")
      .in("status", ["Enriched", "enriched"])
      .eq("tenant_id", "00000000-0000-0000-0000-000000000301")
      .not("disposition", "is", null)
      .limit(50);

    if (error) throw error;
    if (!leads||leads.length===0) return new Response(JSON.stringify({message:"No leads to route"}),{status:200});

    const routed={hot:0,warm:0,cold:0,disqualified:0};
    for (const lead of leads) {
      const disposition = lead.disposition || "";
      let nextStatus="", nextAction="", assignmentMethod="";

      if(disposition==="hot_handoff"){nextStatus="Hot";nextAction="auto_close";assignmentMethod="steve_auto";routed.hot++;}
      else if(disposition==="handoff_ready"){nextStatus="Handoff_Ready";nextAction="human_closer";assignmentMethod="round_robin";routed.warm++;}
      else if(disposition==="nurture"){nextStatus="Nurture";nextAction="followup_sequence";assignmentMethod="steve_auto";routed.cold++;}
      else{nextStatus="Disqualified";nextAction="none";assignmentMethod="none";routed.disqualified++;}

      await supabase.from("leads").update({
        status:nextStatus, assignment_method:assignmentMethod,
        next_action_at:["hot_handoff","handoff_ready"].includes(disposition)?new Date().toISOString():new Date(Date.now()+48*60*60*1000).toISOString(),
        updated_at:new Date().toISOString(),
      }).eq("id",lead.id);

      if(["hot_handoff","handoff_ready"].includes(disposition)&&lead.email){
        const score = lead.score > 0 ? lead.score : 75;
        await supabase.schema("outreach").from("outreach_queue").insert({
          lead_id:lead.id, email:lead.email, lead_email:lead.email,
          subject:disposition==="hot_handoff"?`${lead.business_name||lead.name} — I found something important`:"Quick question about your lead flow",
          status:"pending", attempts:0, max_attempts:4, ai_score:score, deal_score:score,
          scheduled_for:new Date().toISOString(),
        });
        console.log(`📤 Queued: ${lead.email} disposition: ${disposition}`);
      }
    }
    return new Response(JSON.stringify({success:true,routed,total:leads.length}),{status:200});
  } catch(err) {
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
});
