import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    await supabase.schema("outreach").from("outreach_queue").update({status:"pending"}).eq("status","processing").lt("last_attempt_at",new Date(Date.now()-5*60*1000).toISOString());

    const {data:jobs,error}=await supabase.schema("outreach").from("outreach_queue").select("*").eq("status","pending").not("lead_id","is",null).order("created_at",{ascending:true}).limit(1);
    if(error) throw error;
    if(!jobs||jobs.length===0) return new Response(JSON.stringify({message:"No jobs"}),{status:200});

    const job=jobs[0];
    await supabase.schema("outreach").from("outreach_queue").update({status:"processing",attempts:(job.attempts||0)+1,last_attempt_at:new Date().toISOString()}).eq("id",job.id).eq("status","pending");

    const {data:lead}=await supabase.from("leads").select("*").eq("id",job.lead_id).single();
    if(!lead||!lead.email){
      await supabase.schema("outreach").from("outreach_queue").update({status:"failed",last_error:"No lead or email"}).eq("id",job.id);
      return new Response(JSON.stringify({error:"Lead not found"}),{status:404});
    }

    const notes=(() => { try{return JSON.parse(lead.notes||"{}");}catch{return {};} })();
    const businessName=lead.business_name||lead.name||"there";
    const painPoints=notes.pain_points?.join(", ")||"inconsistent leads";
    const seoStrength=notes.seo_strength||"unknown";
    const runningAds=notes.likely_running_ads?"currently running ads":"not running ads";

    const prompt=`You are Steve Williams, Business Growth Expert at Traffik Boosters. Write a short punchy cold email.
Lead: ${businessName}, Industry: ${lead.industry||"business"}, Pain points: ${painPoints}, SEO: ${seoStrength}, Ads: ${runningAds}
Rules: sound human, max 4 sentences, no fluff, reference their specific situation, start with Hey [first word of business name], end with ONE question. Never say "Hi there".
Return ONLY JSON: {"subject":"subject line","body":"email body (use \\n for breaks)","preview":"one sentence summary"}`;

    const aiRes=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"x-api-key":ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]}),
    });
    const aiData=await aiRes.json();
    let msg:any={};
    try{msg=JSON.parse((aiData.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());}catch{msg={subject:"Quick question",body:`Hey ${businessName} —\n\nAre you happy with your current lead flow?`,preview:"Outreach sent"};}

    const safeEmail=encodeURIComponent(lead.email);
    const base="https://starzcrm.traffikboosters.com/reply";
    const html=`<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px 24px;">
<div style="display:flex;align-items:center;margin-bottom:24px;">
<img src="https://ui-avatars.com/api/?name=Steve+Williams&background=1a1a2e&color=ff6b35&size=56&bold=true&rounded=true" style="width:56px;height:56px;border-radius:50%;margin-right:14px;"/>
<div><strong>Steve Williams</strong><br/><span style="color:#666;font-size:13px;">Business Growth Expert · Traffik Boosters</span></div></div>
<div style="font-size:15px;line-height:1.7;color:#222;margin-bottom:28px;">${msg.body.replace(/\n/g,"<br/>")}</div>
<p><strong>Quick reply:</strong></p>
<p><a href="${base}?email=${safeEmail}&intent=interested" style="display:inline-block;padding:10px 20px;background:#1a1a2e;color:#fff;border-radius:6px;text-decoration:none;font-size:13px;margin-right:8px;">Yes, interested</a>
<a href="${base}?email=${safeEmail}&intent=curious" style="display:inline-block;padding:10px 20px;background:#f0f0f0;color:#333;border-radius:6px;text-decoration:none;font-size:13px;margin-right:8px;">Tell me more</a>
<a href="${base}?email=${safeEmail}&intent=not_interested" style="display:inline-block;padding:10px 20px;background:#f0f0f0;color:#999;border-radius:6px;text-decoration:none;font-size:13px;">Not now</a></p>
<hr style="margin:24px 0;border:none;border-top:1px solid #eee;"/>
<div style="font-size:13px;color:#555;">Steve Williams · 786-254-1592 · steve@traffikboosters.com · <a href="https://traffikboosters.com">traffikboosters.com</a></div>
</body></html>`;

    const emailRes=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{Authorization:`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({from:"Steve Williams <steve@traffikboosters.com>",to:lead.email,subject:msg.subject,html}),
    });
    const emailData=await emailRes.json();
    if(!emailRes.ok){
      await supabase.schema("outreach").from("outreach_queue").update({status:"failed",last_error:emailData?.message||"Send failed"}).eq("id",job.id);
      throw new Error(emailData?.message||"Email failed");
    }

    await supabase.schema("outreach").from("outreach_queue").update({status:"sent",last_attempt_at:new Date().toISOString(),last_error:null}).eq("id",job.id);
    await supabase.from("leads").update({status:"Contacted",last_contacted_at:new Date().toISOString(),next_action_at:new Date(Date.now()+48*60*60*1000).toISOString(),updated_at:new Date().toISOString()}).eq("id",lead.id);
    await supabase.schema("outreach").from("outreach_log").insert({lead_id:lead.id,channel:"email",message:msg.preview,status:"sent",provider:"resend",provider_id:emailData?.id||null});

    return new Response(JSON.stringify({success:true,to:lead.email,subject:msg.subject,preview:msg.preview}),{status:200});
  } catch(err) {
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
});
