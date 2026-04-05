import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "https://auth.starzcrm.traffikboosters.com";

const SERVICE_CODES: Record<string,string> = {
  "SEO":"SE","Google Ads":"GA","Website":"WE","Social Media":"SM",
  "Lead Gen":"LG","Content":"CT","Analytics":"AN","Voice AI":"VA","AI/Automation":"AI",
};

function getServiceCode(services: string[]): string {
  if (services.length === 0) return "MS";
  if (services.length === 1) return SERVICE_CODES[services[0]] || services[0].slice(0,2).toUpperCase();
  const combined = services.map(s => SERVICE_CODES[s] || s.slice(0,2).toUpperCase()).join("");
  return combined.length <= 8 ? combined : "MS";
}

serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = await req.json().catch(()=>({}));
  const { lead_id, services, prices, term, notes_override } = body;

  try {
    const { data: lead, error: le } = await sb.from("leads").select("*").eq("id",lead_id).single();
    if (le || !lead) return new Response(JSON.stringify({error:"Lead not found"}),{status:404});
    const notes = (() => { try { return JSON.parse(lead.notes||"{}"); } catch { return {}; } })();

    let seqRow = null;
    try { const sr = await sb.rpc("nextval", { seq_name: "deals.proposal_seq" }); seqRow = sr.data; } catch(_){}
    const seqNum = seqRow ? String(seqRow).padStart(4,"0") : String(Math.floor(Math.random()*9000)+1000);
    const year = new Date().getFullYear();
    const serviceCode = getServiceCode(services || []);
    const proposalId = `TB-${serviceCode}-${year}-${seqNum}`;

    const totalMonthly = Object.values(prices||{}).reduce((a:number,b:any)=>a+Number(b),0);
    const deposit = Math.round(totalMonthly * 0.35);

    const aiPrompt = `You are Steve Williams, Business Growth Expert at Traffik Boosters. Write a personalized discovery summary for a proposal.\n\nBusiness: ${lead.business_name}\nIndustry: ${lead.industry}\nRating: ${notes.rating} stars with ${notes.review_count} reviews\nHas website: ${notes.website ? "Yes" : "No"}\nPain points: ${notes.pain_points?.join(", ")||"Not specified"}\nNotes: ${notes_override||""}\n\nWrite 2-3 sentences starting with "Based on our conversation..." that reflects their specific situation. Sound human, specific, and professional. Do NOT mention any pricing.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,messages:[{role:"user",content:aiPrompt}]}),
    });
    const aiData = await aiRes.json();
    const discoverySummary = aiData.content?.[0]?.text || `Based on our conversation, ${lead.business_name} is looking to grow their online presence and generate more consistent leads in the ${lead.industry} industry.`;

    const deliverableMap: Record<string,string[]> = {
      "SEO":["Google Business Profile optimization","Local keyword targeting","Citation building (50+ directories)","Monthly ranking reports","Map ranking strategy"],
      "Google Ads":["Campaign setup & management","Ad copy creation","Keyword research & bidding","Monthly performance reports","Conversion tracking"],
      "Website":["Custom website design","Mobile optimization","Speed optimization","SEO-ready structure","Contact form & tracking"],
      "Lead Gen":["Funnel creation","Call tracking setup","CRM integration","Lead nurturing automation","Weekly lead reports"],
      "Content":["Blog posts (4/month)","Social media content","Email newsletters","Brand voice guidelines","Content calendar"],
      "Social Media":["Profile optimization","Post scheduling","Engagement management","Monthly analytics","Ad management"],
      "Analytics":["GA4 setup","Dashboard creation","Monthly reports","Conversion tracking","ROI analysis"],
      "Voice AI":["AI voice agent setup","Call handling automation","Lead qualification","CRM integration","Call recordings & reports"],
      "AI/Automation":["Workflow automation","AI chatbot setup","CRM automation","Email sequences","Performance monitoring"],
    };

    const deliverables = (services||[]).map((s:string) => ({
      service: s,
      items: deliverableMap[s] || [],
    }));

    const serviceRows = (services||[]).map((s:string) => {
      const items = deliverableMap[s] || [];
      return `<div style="margin-bottom:24px;padding:20px;background:#f9f9f9;border-radius:8px;border-left:4px solid #ff6b35"><h3 style="color:#1a1a2e;margin:0 0 12px;font-size:16px">${s}</h3><ul style="margin:0;padding-left:20px">${items.map((i:string)=>`<li style="margin-bottom:6px;color:#555">${i}</li>`).join("")}</ul></div>`;
    }).join("");

    const proposalUrl = `${APP_URL}/proposal/${proposalId}`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Growth Proposal - ${proposalId}</title></head>
<body style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:0;color:#333;background:#fff">
<div style="background:#1a1a2e;padding:40px 30px;text-align:center">
  <div style="display:inline-block;background:#ff6b35;padding:8px 20px;border-radius:4px;margin-bottom:16px">
    <span style="color:#fff;font-weight:900;font-size:22px;letter-spacing:2px">TRAFFIK BOOSTERS</span>
  </div>
  <h1 style="color:#fff;margin:0 0 8px;font-size:28px;font-weight:700">GROWTH PROPOSAL</h1>
  <p style="color:#ff6b35;margin:0;font-size:13px;letter-spacing:1px">CONFIDENTIAL · ${proposalId} · ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p>
</div>
<div style="padding:36px 30px">
  <h2 style="color:#1a1a2e;border-bottom:3px solid #ff6b35;padding-bottom:10px;margin-top:0">Prepared For</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
    <tr><td style="padding:8px 0;font-weight:bold;color:#666;width:130px;font-size:13px;text-transform:uppercase">Business</td><td style="padding:8px 0;font-size:15px;font-weight:600">${lead.business_name}</td></tr>
    <tr><td style="padding:8px 0;font-weight:bold;color:#666;font-size:13px;text-transform:uppercase">Industry</td><td style="padding:8px 0;text-transform:capitalize">${lead.industry}</td></tr>
    <tr><td style="padding:8px 0;font-weight:bold;color:#666;font-size:13px;text-transform:uppercase">Phone</td><td style="padding:8px 0">${lead.phone||"N/A"}</td></tr>
    <tr><td style="padding:8px 0;font-weight:bold;color:#666;font-size:13px;text-transform:uppercase">Email</td><td style="padding:8px 0">${lead.email||"N/A"}</td></tr>
    <tr><td style="padding:8px 0;font-weight:bold;color:#666;font-size:13px;text-transform:uppercase">Website</td><td style="padding:8px 0">${notes.website||"N/A"}</td></tr>
  </table>
  <h2 style="color:#1a1a2e;border-bottom:3px solid #ff6b35;padding-bottom:10px;margin-top:36px">Discovery Summary</h2>
  <p style="background:#fff8f5;padding:20px;border-left:4px solid #ff6b35;font-style:italic;line-height:1.8;margin:0;border-radius:0 8px 8px 0;color:#444">${discoverySummary}</p>
  <h2 style="color:#1a1a2e;border-bottom:3px solid #ff6b35;padding-bottom:10px;margin-top:36px">Scope of Services</h2>
  <p style="color:#666;font-size:14px;margin-bottom:20px">Based on your goals and current situation, we recommend the following services. Full investment details will be discussed during our follow-up call.</p>
  ${serviceRows}
  <h2 style="color:#1a1a2e;border-bottom:3px solid #ff6b35;padding-bottom:10px;margin-top:36px">Next Steps</h2>
  <div style="background:#fff8f5;padding:20px;border-radius:8px;border:1px solid #ff6b35;text-align:center">
    <p style="margin:0 0 16px;font-size:15px;color:#1a1a2e;font-weight:600">Ready to move forward?</p>
    <a href="${proposalUrl}" style="display:inline-block;background:#ff6b35;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.5px">Review &amp; Sign Proposal →</a>
    <p style="margin:12px 0 0;font-size:12px;color:#999">Or copy this link: ${proposalUrl}</p>
  </div>
  <h2 style="color:#1a1a2e;border-bottom:3px solid #ff6b35;padding-bottom:10px;margin-top:36px">3-Day Satisfaction Guarantee</h2>
  <div style="background:#fff8f5;padding:20px;border-radius:8px;border:1px solid #ff6b35">
    <p style="margin:0;line-height:1.7">You may cancel within <strong>3 business days</strong> of signing for a <strong>full refund</strong> — no questions asked.</p>
  </div>
  <div style="background:#1a1a2e;padding:28px;margin-top:36px;border-radius:8px;text-align:center">
    <p style="margin:0 0 6px;color:#ff6b35;font-weight:900;font-size:16px;letter-spacing:1px">STEVE WILLIAMS</p>
    <p style="margin:0 0 4px;color:#aaa;font-size:13px">Business Growth Expert · Traffik Boosters</p>
    <p style="margin:0 0 12px;color:#aaa;font-size:13px">786-254-1592 · steve@traffikboosters.com · traffikboosters.com</p>
    <p style="margin:0;color:#555;font-size:11px">Proposal ID: ${proposalId} · ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})} · CONFIDENTIAL</p>
  </div>
</div>
</body></html>`;

    // Save to deals.proposals
    const { data: proposal } = await sb.schema("deals").from("proposals").insert({
      proposal_id: proposalId,
      lead_id: lead.id,
      lead_email: lead.email || null,
      lead_name: lead.contact_name || lead.business_name,
      business_name: lead.business_name,
      phone: lead.phone || null,
      website: notes.website || null,
      industry: lead.industry || null,
      services: services || [],
      prices: prices || {},
      total_monthly: totalMonthly,
      deposit_amount: deposit,
      term: term || "month-to-month",
      conversation_summary: discoverySummary,
      deliverables,
      status: "sent",
      proposal_sent_at: new Date().toISOString(),
    }).select().single();

    // Send proposal email to client
    if (lead.email) {
      await fetch("https://api.resend.com/emails",{
        method:"POST",
        headers:{Authorization:"Bearer "+RESEND_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({
          from:"Steve Williams <steve@traffikboosters.com>",
          to:lead.email,
          subject:"Your Growth Proposal - Traffik Boosters ["+proposalId+"]",
          html,
        }),
      });
    }

    // Notify Rico
    await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{Authorization:"Bearer "+RESEND_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({
        from:"STARZ-OS <steve@traffikboosters.com>",
        to:"admin@traffikboosters.com",
        subject:"Proposal Sent: "+lead.business_name+" ["+proposalId+"]",
        html:"<h2>Proposal Sent</h2><p><strong>"+lead.business_name+"</strong></p><p><strong>ID:</strong> "+proposalId+"</p><p><strong>Services:</strong> "+(services||[]).join(", ")+"</p><p><strong>Monthly Value:</strong> $"+totalMonthly+"/mo</p><p><strong>Deposit (35%):</strong> $"+deposit+"</p><p><strong>Sent to:</strong> "+(lead.email||"N/A")+"</p><p><strong>Proposal Link:</strong> <a href='"+proposalUrl+"'>"+proposalUrl+"</a></p><p><em>Pricing NOT shown to prospect. Follow up call required.</em></p>",
      }),
    });

    return new Response(JSON.stringify({
      success:true,
      proposal_id:proposalId,
      proposal_url:proposalUrl,
      proposal_db_id:proposal?.id,
      total_monthly:totalMonthly,
      deposit,
      sent_to:lead.email,
    }),{status:200});

  } catch(err:any) {
    return new Response(JSON.stringify({error:err.message}),{status:500});
  }
});