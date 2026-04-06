"use client";
// @ts-nocheck
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const LOGO = "https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/logo/STARZ-OS%20LOGO555.png";
const STAGES = ["new","engaged","qualified","nurture","closed_lost"];
type Deal = { id:string; lead_email:string|null; stage:string|null; interest_level?:string|number|null; interest?:number|null; notes?:string|null; created_at?:string|null; };
type OutreachLog = { id:number; to_email:string; subject:string|null; status:string; created_at:string|null; };
type ActiveTab = "pipeline"|"revenue"|"leads"|"outreach"|"steve";

function getLevel(d:Deal):"high"|"medium"|"low"{const v=d.interest_level??d.interest;if(!v)return"low";const s=String(v).toLowerCase();if(s==="high"||Number(v)>=7)return"high";if(s==="medium"||Number(v)>=4)return"medium";return"low";}
function ago(ds:string|null):string{if(!ds)return"";const m=Math.floor((Date.now()-new Date(ds).getTime())/60000);if(m<2)return"just now";if(m<60)return m+"m ago";const h=Math.floor(m/60);if(h<24)return h+"h ago";const day=Math.floor(h/24);if(day<7)return day+"d ago";return Math.floor(day/7)+"w ago";}

function DashboardInner(){
  const [deals,setDeals]=useState<Deal[]>([]);
  const [proposalModal, setProposalModal] = useState<any>(null);
  const [proposalServices, setProposalServices] = useState([]);
  const [proposalPrices, setProposalPrices] = useState({});
  const [proposalNotes, setProposalNotes] = useState("");
  const [proposalTerm, setProposalTerm] = useState("month-to-month");
  const [sendingProposal, setSendingProposal] = useState(false);
  const [logs,setLogs]=useState<OutreachLog[]>([]);
  const [loading,setLoading]=useState(true);
  const [ready,setReady]=useState(false);
  const [dark,setDark]=useState(true);
  const [logoErr,setLogoErr]=useState(false);
  const [tab,setTab]=useState<ActiveTab>("pipeline");
  const [steveLeads,setSteveLeads]=useState<any[]>([]);
  const [steveRunning,setSteveRunning]=useState(false);
  const [steveLog,setSteveLog]=useState<{msg:string;type:string;t:string}[]>([]);
  const [steveScrape,setSteveScrape]=useState({industry:"plumber",city:"Miami",state:"FL",limit:20});
  const [steveSelected,setSteveSelected]=useState<any>(null);
  const TENANT="00000000-0000-0000-0000-000000000301";
  const SVC_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z3VpenZwaWl1aXl1Z3JqZWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMyNTg5MiwiZXhwIjoyMDc2OTAxODkyfQ.VPnGM9so9Cp56GV6v6tafzKKs45eNUKpkpwD65Hn7PM";
  const router=useRouter();

  useEffect(()=>{try{if(localStorage.getItem("starz-theme")==="light")setDark(false);}catch{}},[]);
  const toggle=()=>setDark(p=>{try{localStorage.setItem("starz-theme",p?"light":"dark");}catch{}return!p;});

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{if(!session){router.push("/login");return;}setReady(true);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>{if(!s)router.push("/login");});
    return()=>subscription.unsubscribe();
  },[router]);

  const loadDeals=async()=>{const{data,error}=await supabase.schema("deals").from("pipeline").select("*").order("created_at",{ascending:false});if(error){console.error(error);return;}setDeals(data??[]);};
  const loadLogs=async()=>{const{data,error}=await supabase.schema("prospecting").from("outreach_logs").select("*").order("created_at",{ascending:false}).limit(100);if(error){console.error("logs:",error);return;}setLogs(data??[]);};

  useEffect(()=>{
    if(!ready)return;
    Promise.all([loadDeals(),loadLogs(),loadSteveLeads()]).then(()=>setLoading(false));
    const ch=supabase.channel("pl").on("postgres_changes",{event:"*",schema:"deals",table:"pipeline"},loadDeals).subscribe();
    return()=>{supabase.removeChannel(ch);};
  },[ready]);

  const loadSteveLeads=async()=>{
    const r=await fetch("/api/steve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rest:"leads?tenant_id=eq."+TENANT+"&order=created_at.desc&limit=100"})});
    const d=await r.json();setSteveLeads(Array.isArray(d)?d:(d.value??[]));
  };
  const steveAddLog=(msg:string,type="info")=>setSteveLog(p=>[{msg,type,t:new Date().toLocaleTimeString()},...p.slice(0,19)]);
  const steveFn=async(name:string,body:any={})=>{const r=await fetch("/api/steve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fn:name,body:body})});return r.json();};
  const runStevePipeline=async()=>{
    setSteveRunning(true);
    steveAddLog("Enriching leads...","info");
    for(let i=0;i<6;i++){const e=await steveFn("lead-enrichment-engine");if(!e.enriched)break;steveAddLog(`Batch ${i+1}: ${e.enriched} enriched`,"success");}
    const r=await steveFn("lead-targeting-engine");
    steveAddLog(`Routed → Hot:${r.routed?.hot||0} Warm:${r.routed?.warm||0} Cold:${r.routed?.cold||0}`,"success");
    await loadSteveLeads();setSteveRunning(false);
  };
  const runSteveScrape=async()=>{
    setSteveRunning(true);steveAddLog(`Scraping ${steveScrape.industry} in ${steveScrape.city}...`,"info");
    const r=await steveFn("lead-scraper",steveScrape);
    if(r.error)steveAddLog(`Error: ${r.error}`,"error");
    else steveAddLog(`Scraped ${r.inserted} leads (${r.skipped} skipped)`,"success");
    await loadSteveLeads();setSteveRunning(false);
  };
  const runSteveOutreach=async()=>{
    setSteveRunning(true);steveAddLog("Sending outreach...","info");
    const r=await steveFn("outreach-ai-engine");
    if(r.success)steveAddLog(`Sent to ${r.to} – "${r.subject}"`,"success");
    else steveAddLog(r.message||r.error||"No jobs in queue","warn");
    setSteveRunning(false);
  };
  const parseN=(n:string|null)=>{try{return JSON.parse(n||"{}");}catch{return{};}};
  const sendProposal=async(lead:any)=>{
    if(proposalServices.length===0){alert("Select at least one service.");return;}
    if(!lead.email){alert("No email on file for this lead.");return;}
    setSendingProposal(true);
    try{
      const r=await fetch("/api/steve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fn:"generate-proposal",body:{lead_id:lead.id,services:proposalServices,prices:proposalPrices,term:proposalTerm,notes_override:proposalNotes}})});
      const data=await r.json();
      if(data.success){steveAddLog(`Proposal ${data.proposal_id} sent to ${lead.business_name||lead.name}`,"success");setProposalModal(null);setProposalServices([]);setProposalPrices({});setProposalNotes("");alert(`Proposal ${data.proposal_id} sent to ${data.sent_to}`);}
      else{alert("Error: "+(data.error||"Unknown"));}
    }catch(e:any){alert("Error: "+e.message);}
    setSendingProposal(false);
  };
  const runRicoHandoff=async(leadId:string,businessName:string)=>{
    steveAddLog(`Handing off ${businessName} to Rico...`,"info");
    const r=await steveFn("rico-handoff",{lead_id:leadId});
    if(r.handed_off>0)steveAddLog(`Rico handoff done: ${businessName} → Deal + Work Order created`,"success");
    else if(r.errors?.length>0)steveAddLog(`Handoff error: ${r.errors[0]?.error}`,"error");
    else steveAddLog(r.message||"Already handed off","warn");
    await loadSteveLeads();
  };
  const sScoreC=(s:number)=>s>=82?"#ff6b35":s>=62?"#fbbf24":s>=42?"#34d399":"#666";
  const move=async(id:string,stage:string)=>{await supabase.schema("deals").from("pipeline").update({stage}).eq("id",id);loadDeals();};
  const logout=async()=>{await supabase.auth.signOut();router.push("/login");};

  const sc:Record<string,string>=dark?{new:"#818cf8",engaged:"#34d399",qualified:"#fbbf24",nurture:"#f472b6",closed_lost:"#94a3b8"}:{new:"#4f46e5",engaged:"#059669",qualified:"#d97706",nurture:"#db2777",closed_lost:"#64748b"};
  const ic:Record<string,{bg:string;color:string}>=dark?{high:{bg:"rgba(52,211,153,0.12)",color:"#34d399"},medium:{bg:"rgba(251,191,36,0.12)",color:"#fbbf24"},low:{bg:"rgba(148,163,184,0.1)",color:"#94a3b8"}}:{high:{bg:"rgba(5,150,105,0.1)",color:"#059669"},medium:{bg:"rgba(217,119,6,0.1)",color:"#d97706"},low:{bg:"rgba(100,116,139,0.1)",color:"#64748b"}};
  const bg=dark?"#0a0a0f":"#f4f4f8";
  const hdr=dark?"#0d0d14":"#ffffff";
  const bdr=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)";
  const txt=dark?"#ffffff":"#0f0f1a";
  const txt2=dark?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.45)";
  const txt3=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.25)";
  const colBg=dark?"#0f0f18":"#e8e8f0";
  const colBdr=dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.07)";
  const cardBg=dark?"#161620":"#ffffff";
  const cardBdr=dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)";
  const metBg=dark?"#111118":"#ffffff";
  const pillBg=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.05)";
  const pillC=dark?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.3)";
  const pillHBg=dark?"rgba(99,102,241,0.18)":"rgba(79,70,229,0.1)";
  const pillHC=dark?"#818cf8":"#4f46e5";
  const navAC=dark?"#818cf8":"#4f46e5";
  const navABg=dark?"rgba(99,102,241,0.12)":"rgba(79,70,229,0.08)";
  const btnBdr=dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.12)";
  const cntBg=dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.06)";
  const cntC=dark?"rgba(255,255,255,0.25)":"rgba(0,0,0,0.3)";
  const bdgBg=dark?"rgba(99,102,241,0.2)":"rgba(79,70,229,0.12)";
  const divC=dark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.06)";

  const totalDeals=deals.length;
  const high=deals.filter(d=>getLevel(d)==="high").length;
  const eng=deals.filter(d=>d.stage==="engaged").length;
  const cls=deals.filter(d=>d.stage==="closed_lost").length;
  const stageCount:Record<string,number>={};
  STAGES.forEach(s=>{stageCount[s]=deals.filter(d=>(d.stage??"new")===s).length;});
  const maxCount=Math.max(...Object.values(stageCount),1);
  const totalSent=logs.length;
  const totalDelivered=logs.filter(l=>l.status==="sent").length;
  const replies=logs.filter(l=>l.status==="replied"||l.status==="interested").length;
  const interested=logs.filter(l=>l.status==="interested").length;
  const replyRate=totalSent>0?Math.round((replies/totalSent)*100):0;
  const convRate=totalSent>0?Math.round((cls/totalSent)*100):0;

  const NAV_TABS=[
    {key:"pipeline" as ActiveTab,label:"Pipeline"},
    {key:"revenue"  as ActiveTab,label:"Revenue"},
    {key:"leads"    as ActiveTab,label:"Leads"},
    {key:"outreach" as ActiveTab,label:"Outreach"},
    {key:"steve"    as ActiveTab,label:"Steve BGE"},
  ];

  if(!ready||loading)return(
    <div style={{minHeight:"100vh",background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>☆</div><p style={{color:txt3,fontFamily:"monospace",fontSize:13,letterSpacing:"0.1em"}}>LOADING STARZ-OS...</p></div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:bg,fontFamily:"'Inter',-apple-system,sans-serif",transition:"background 0.25s"}}>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 28px",borderBottom:`0.5px solid ${bdr}`,background:hdr,position:"sticky",top:0,zIndex:10}}>
        {!logoErr
          ?<img src={LOGO} alt="STARZ-OS" height={36} style={{objectFit:"contain",maxWidth:160}} onError={()=>setLogoErr(true)}/>
          :<div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15}}>☆</div>
            <span style={{fontSize:17,fontWeight:700,color:txt}}>STARZ-OS</span>
          </div>
        }
        <div style={{display:"flex",gap:4}}>
          {NAV_TABS.map(({key,label})=>(
            <div key={key} onClick={()=>setTab(key)} style={{padding:"6px 14px",borderRadius:6,fontSize:13,cursor:"pointer",userSelect:"none",color:tab===key?navAC:txt2,background:tab===key?navABg:"transparent",transition:"all 0.15s"}}>
              {label}
              {key==="pipeline"&&<span style={{background:bdgBg,color:navAC,fontSize:11,padding:"1px 7px",borderRadius:20,marginLeft:5}}>{totalDeals}</span>}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={toggle} style={{padding:"6px 14px",borderRadius:6,fontSize:13,color:txt2,border:`0.5px solid ${btnBdr}`,background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",cursor:"pointer",fontFamily:"inherit"}}>{dark?"☀️ Light":"🌙 Dark"}</button>
          <button onClick={()=>router.push("/developer")} style={{padding:"6px 14px",borderRadius:6,fontSize:13,color:txt2,border:`0.5px solid ${btnBdr}`,background:"transparent",cursor:"pointer",fontFamily:"inherit"}}>Developer</button>
          <button onClick={logout} style={{padding:"6px 14px",borderRadius:6,fontSize:13,color:txt2,border:`0.5px solid ${btnBdr}`,background:"transparent",cursor:"pointer",fontFamily:"inherit"}}>Sign out</button>
        </div>
      </div>

      {/* PIPELINE TAB */}
      {tab==="pipeline"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,padding:"20px 28px 10px"}}>
            {[
              {label:"Total Deals",value:totalDeals,sub:"In pipeline",accent:navAC},
              {label:"High Interest",value:high,sub:`${totalDeals?Math.round(high/totalDeals*100):0}% of pipeline`,accent:dark?"#34d399":"#059669"},
              {label:"Engaged",value:eng,sub:"Active conversations",accent:dark?"#fbbf24":"#d97706"},
              {label:"Closed Lost",value:cls,sub:"Need review",accent:dark?"#f472b6":"#db2777"},
            ].map(m=>(
              <div key={m.label} style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px"}}>
                <div style={{fontSize:11,color:txt2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{m.label}</div>
                <div style={{fontSize:30,fontWeight:700,color:m.accent,lineHeight:1}}>{m.value}</div>
                <div style={{fontSize:12,color:txt3,marginTop:5}}>{m.sub}</div>
              </div>
            ))}
          </div>
          <div style={{padding:"14px 28px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:11,color:txt3,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Live Pipeline</div>
            <div style={{fontSize:11,color:dark?"#34d399":"#059669"}}>● Realtime</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,padding:"0 20px 32px"}}>
            {STAGES.map(stage=>{
              const sd=deals.filter(d=>(d.stage??"new")===stage);
              return(
                <div key={stage} style={{background:colBg,border:`0.5px solid ${colBdr}`,borderRadius:10,padding:14,minHeight:320}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:sc[stage],textTransform:"uppercase",letterSpacing:"0.09em"}}>{stage.replace("_"," ")}</div>
                    <div style={{background:cntBg,color:cntC,fontSize:11,padding:"2px 8px",borderRadius:10}}>{sd.length}</div>
                  </div>
                  {sd.map(deal=>{
                    const lv=getLevel(deal);const is=ic[lv];
                    return(
                      <div key={deal.id} style={{background:cardBg,border:`0.5px solid ${cardBdr}`,borderRadius:9,padding:"12px 14px",marginBottom:8,cursor:"pointer",transition:"all 0.15s"}}
                        onMouseEnter={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor=dark?"rgba(99,102,241,0.4)":"rgba(79,70,229,0.3)";el.style.background=dark?"#1a1a28":"#f0f0ff";el.style.transform="translateY(-1px)";}}
                        onMouseLeave={e=>{const el=e.currentTarget as HTMLDivElement;el.style.borderColor=cardBdr;el.style.background=cardBg;el.style.transform="translateY(0)";}}>
                        <div style={{fontSize:12,color:txt,fontWeight:600,marginBottom:8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{deal.lead_email??"No email"}</div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                          <span style={{fontSize:11,padding:"2px 9px",borderRadius:20,fontWeight:600,background:is.bg,color:is.color}}>{lv.charAt(0).toUpperCase()+lv.slice(1)}</span>
                          <span style={{fontSize:10,color:txt3}}>{ago(deal.created_at??null)}</span>
                        </div>
                        {deal.notes&&<div style={{fontSize:11,color:txt3,marginBottom:8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontStyle:"italic"}}>{deal.notes}</div>}
                        <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:8,paddingTop:8,borderTop:`0.5px solid ${cardBdr}`}}>
                          {STAGES.filter(s=>s!==stage).map(s=>(
                            <button key={s} onClick={()=>move(deal.id,s)}
                              style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:pillBg,color:pillC,border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all 0.1s"}}
                              onMouseEnter={e=>{const el=e.currentTarget as HTMLButtonElement;el.style.background=pillHBg;el.style.color=pillHC;}}
                              onMouseLeave={e=>{const el=e.currentTarget as HTMLButtonElement;el.style.background=pillBg;el.style.color=pillC;}}>
                              → {s.replace("_"," ")}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {sd.length===0&&<div style={{textAlign:"center",padding:"40px 10px",color:dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)",fontSize:12}}><div style={{fontSize:20,marginBottom:8,opacity:0.4}}>○</div>No deals</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* REVENUE TAB */}
      {tab==="revenue"&&(
        <div style={{padding:"20px 28px 32px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
            {[
              {label:"Total Deals",value:`${totalDeals}`,sub:"Active pipeline",accent:navAC},
              {label:"Closed Lost",value:`${cls}`,sub:"Need reactivation",accent:dark?"#f472b6":"#db2777"},
              {label:"Conversion Rate",value:`${convRate}%`,sub:"Outreach → Closed",accent:dark?"#fbbf24":"#d97706"},
              {label:"Steve Emails",value:`${totalSent}`,sub:"AI-personalized",accent:dark?"#34d399":"#059669"},
            ].map(m=>(
              <div key={m.label} style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px"}}>
                <div style={{fontSize:11,color:txt2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{m.label}</div>
                <div style={{fontSize:28,fontWeight:700,color:m.accent,lineHeight:1}}>{m.value}</div>
                <div style={{fontSize:12,color:txt3,marginTop:5}}>{m.sub}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px"}}>
              <div style={{fontSize:12,color:txt2,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:16}}>Deals by stage</div>
              {STAGES.map(stage=>{
                const count=stageCount[stage]??0;
                const pct=Math.round((count/maxCount)*100);
                return(
                  <div key={stage} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{fontSize:12,color:txt2,width:90,flexShrink:0}}>{stage.replace("_"," ")}</div>
                    <div style={{flex:1,height:6,background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:sc[stage],borderRadius:3}}></div>
                    </div>
                    <div style={{fontSize:12,color:txt3,width:20,textAlign:"right",flexShrink:0}}>{count}</div>
                  </div>
                );
              })}
            </div>
            <div style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px"}}>
              <div style={{fontSize:12,color:txt2,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:16}}>Outreach performance</div>
              {[
                {label:"Emails sent",value:totalSent,color:navAC},
                {label:"Delivered",value:totalDelivered,color:dark?"#34d399":"#059669"},
                {label:"Replies",value:replies,color:dark?"#fbbf24":"#d97706"},
                {label:"Interested",value:interested,color:dark?"#f472b6":"#db2777"},
                {label:"Reply rate",value:`${replyRate}%`,color:dark?"#34d399":"#059669"},
              ].map((row,i)=>(
                <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<4?`0.5px solid ${divC}`:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:row.color,flexShrink:0}}></div>
                    <div style={{fontSize:13,color:txt2}}>{row.label}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:txt}}>{String(row.value)}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px",marginBottom:16}}>
            <div style={{fontSize:12,color:txt2,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:20}}>Lead conversion funnel</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:100}}>
              {[
                {label:"Leads",value:Math.max(totalDeals*10,1),display:totalDeals*10,color:navAC},
                {label:"Contacted",value:Math.max(totalSent,1),display:totalSent,color:dark?"#34d399":"#059669"},
                {label:"Replied",value:Math.max(replies,1),display:replies,color:dark?"#fbbf24":"#d97706"},
                {label:"Interested",value:Math.max(interested,1),display:interested,color:dark?"#f472b6":"#db2777"},
                {label:"Closed",value:Math.max(cls,1),display:cls,color:dark?"#94a3b8":"#64748b"},
              ].map((bar,_,arr)=>{
                const maxVal=arr[0].value;
                const h=Math.max(Math.round((bar.value/maxVal)*100),8);
                return(
                  <div key={bar.label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                    <div style={{fontSize:12,color:txt2,fontWeight:600}}>{bar.display}</div>
                    <div style={{width:"100%",height:`${h}px`,background:bar.color,borderRadius:"4px 4px 0 0"}}></div>
                    <div style={{fontSize:10,color:txt3,textAlign:"center"}}>{bar.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {logs.length>0&&(
            <div style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px"}}>
              <div style={{fontSize:12,color:txt2,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:14}}>Recent Steve outreach</div>
              {logs.slice(0,8).map((log,i)=>(
                <div key={log.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<7?`0.5px solid ${divC}`:"none"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,color:txt,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{log.to_email}</div>
                    <div style={{fontSize:11,color:txt3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{log.subject??"—"}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0,marginLeft:12}}>
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:log.status==="sent"?(dark?"rgba(52,211,153,0.12)":"rgba(5,150,105,0.1)"):(dark?"rgba(251,191,36,0.12)":"rgba(217,119,6,0.1)"),color:log.status==="sent"?(dark?"#34d399":"#059669"):(dark?"#fbbf24":"#d97706")}}>{log.status}</span>
                    <span style={{fontSize:10,color:txt3}}>{ago(log.created_at??null)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEADS TAB */}
      {tab==="leads"&&(
        <div style={{padding:"20px 28px 32px"}}>
          <div style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px"}}>
            <div style={{fontSize:12,color:txt2,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:14}}>All Leads in Pipeline</div>
            {deals.map((deal,i)=>{
              const lv=getLevel(deal);const is=ic[lv];
              return(
                <div key={deal.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<deals.length-1?`0.5px solid ${divC}`:"none"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:txt,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{deal.lead_email??"No email"}</div>
                    <div style={{fontSize:11,color:txt3,marginTop:2}}>{deal.notes??"—"}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,marginLeft:12}}>
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:600,background:is.bg,color:is.color}}>{lv}</span>
                    <span style={{fontSize:10,color:sc[deal.stage??"new"],textTransform:"uppercase"}}>{(deal.stage??"new").replace("_"," ")}</span>
                    <span style={{fontSize:10,color:txt3}}>{ago(deal.created_at??null)}</span>
                  </div>
                </div>
              );
            })}
            {deals.length===0&&<p style={{color:txt3,fontSize:13,textAlign:"center",padding:"40px 0"}}>No leads yet</p>}
          </div>
        </div>
      )}

      {/* OUTREACH TAB */}
      {tab==="outreach"&&(
        <div style={{padding:"20px 28px 32px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
            {[
              {label:"Total Sent",value:totalSent,accent:navAC},
              {label:"Reply Rate",value:`${replyRate}%`,accent:dark?"#34d399":"#059669"},
              {label:"Interested",value:interested,accent:dark?"#f472b6":"#db2777"},
            ].map(m=>(
              <div key={m.label} style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px"}}>
                <div style={{fontSize:11,color:txt2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{m.label}</div>
                <div style={{fontSize:28,fontWeight:700,color:m.accent,lineHeight:1}}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px"}}>
            <div style={{fontSize:12,color:txt2,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:600,marginBottom:14}}>Steve&apos;s Outreach Log</div>
            {logs.length===0&&<p style={{color:txt3,fontSize:13,textAlign:"center",padding:"40px 0"}}>No outreach logs yet</p>}
            {logs.map((log,i)=>(
              <div key={log.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<logs.length-1?`0.5px solid ${divC}`:"none"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:txt,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{log.to_email}</div>
                  <div style={{fontSize:11,color:txt3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:2}}>{log.subject??"—"}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0,marginLeft:12}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:log.status==="sent"?(dark?"rgba(52,211,153,0.12)":"rgba(5,150,105,0.1)"):(dark?"rgba(251,191,36,0.12)":"rgba(217,119,6,0.1)"),color:log.status==="sent"?(dark?"#34d399":"#059669"):(dark?"#fbbf24":"#d97706")}}>{log.status}</span>
                  <span style={{fontSize:10,color:txt3}}>{ago(log.created_at??null)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEVE BGE TAB */}
      {tab==="steve"&&(
        <div style={{padding:"20px 28px 32px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
            {([["TOTAL",steveLeads.length,"#e0e0f0"],["HOT",steveLeads.filter((l:any)=>l.status==="Hot").length,"#ff6b35"],["WARM",steveLeads.filter((l:any)=>l.status==="Handoff_Ready").length,"#fbbf24"],["NURTURE",steveLeads.filter((l:any)=>l.status==="Nurture").length,"#34d399"],["CONTACTED",steveLeads.filter((l:any)=>l.status==="Contacted").length,"#818cf8"]] as [string,number,string][]).map(([label,value,color])=>(
              <div key={label} style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:700,color,lineHeight:1}}>{value}</div>
                <div style={{fontSize:10,color:txt3,marginTop:4,letterSpacing:"0.1em"}}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            <button onClick={runStevePipeline} disabled={steveRunning} style={{padding:"8px 18px",background:steveRunning?"transparent":"#ff6b35",color:steveRunning?txt3:"#000",border:`0.5px solid ${steveRunning?bdr:"#ff6b35"}`,borderRadius:6,fontSize:12,fontWeight:700,cursor:steveRunning?"not-allowed":"pointer",fontFamily:"inherit"}}>{steveRunning?"Running...":"▶ Run Pipeline"}</button>
            <button onClick={loadSteveLeads} style={{padding:"8px 16px",background:"transparent",color:txt2,border:`0.5px solid ${bdr}`,borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>↺ Refresh</button>
            <button onClick={runSteveOutreach} disabled={steveRunning} style={{padding:"8px 16px",background:"transparent",color:"#818cf8",border:"0.5px solid rgba(129,140,248,0.3)",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✉ Send Outreach</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
            {([["HOT",steveLeads.filter((l:any)=>l.status==="Hot"),"#ff6b35"],["WARM",steveLeads.filter((l:any)=>l.status==="Handoff_Ready"),"#fbd23f"],["NURTURE",steveLeads.filter((l:any)=>l.status==="Nurture"),"#34d399"],["NEW",steveLeads.filter((l:any)=>l.status==="New"),"#666"]] as [string,any[],string][]).map(([label,arr,color])=>(
              <div key={label} style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${bdr}`,display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontSize:11,fontWeight:700,color,letterSpacing:"0.08em"}}>{label}</div>
                  <div style={{fontSize:11,color:txt3}}>{arr.length}</div>
                </div>
                <div style={{maxHeight:360,overflowY:"auto",padding:"8px"}}>
                  {arr.map((lead:any)=>{const n=parseN(lead.notes);return(
                    <div key={lead.id} onClick={()=>setSteveSelected(lead)} style={{background:cardBg,border:`0.5px solid ${cardBdr}`,borderRadius:6,padding:"10px 12px",marginBottom:6,cursor:"pointer"}} onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=color;}} onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=cardBdr;}}>
                      <div style={{fontSize:12,fontWeight:600,color:txt,marginBottom:4,lineHeight:1.3}}>{lead.business_name||lead.name}</div>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <div style={{fontSize:10,color:txt3}}>{(lead.industry||"").toUpperCase()}</div>
                        {lead.score>0&&<div style={{fontSize:11,fontWeight:700,color:sScoreC(lead.score)}}>{lead.score}</div>}
                      </div>
                      {lead.status==="Hot"&&<>
                        <button onClick={e=>{e.stopPropagation();runRicoHandoff(lead.id,lead.business_name||lead.name);}} style={{marginTop:6,width:"100%",padding:"4px 0",background:"rgba(255,107,53,0.15)",color:"#ff6b35",border:"0.5px solid rgba(255,107,53,0.4)",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Rico Handoff</button>
                        <button onClick={e=>{e.stopPropagation();setProposalModal(lead);setProposalServices([]);setProposalPrices({});setProposalNotes("");}} style={{marginTop:4,width:"100%",padding:"4px 0",background:"rgba(0,200,100,0.15)",color:"#00c864",border:"0.5px solid rgba(0,200,100,0.4)",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Send Proposal</button>
                      </>}
                    </div>
                  );})}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
            <div style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px"}}>
              <div style={{fontSize:11,color:txt2,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:14}}>Google Maps Scraper</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {([["Industry","industry","select"],["City","city","text"],["State","state","text"],["Limit","limit","number"]] as [string,string,string][]).map(([label,key,type])=>(
                  <div key={key}>
                    <div style={{fontSize:10,color:txt3,marginBottom:4}}>{label.toUpperCase()}</div>
                    {type==="select"?(
                      <select value={(steveScrape as any)[key]} onChange={e=>setSteveScrape(p=>({...p,[key]:e.target.value}))} style={{width:"100%",background:bg,border:`0.5px solid ${bdr}`,color:txt,padding:"7px 10px",borderRadius:6,fontSize:12,fontFamily:"inherit"}}>
                        {["plumber","HVAC","roofing","electrician","dentist","chiropractor","attorney","auto repair","cleaning","pest control","landscaping"].map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ):(
                      <input type={type} value={(steveScrape as any)[key]} onChange={e=>setSteveScrape(p=>({...p,[key]:type==="number"?parseInt(e.target.value)||(p as any)[key]:e.target.value}))} style={{width:"100%",background:bg,border:`0.5px solid ${bdr}`,color:txt,padding:"7px 10px",borderRadius:6,fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}} />
                    )}
                  </div>
                ))}
              </div>
              <button onClick={runSteveScrape} disabled={steveRunning} style={{width:"100%",padding:"9px",background:steveRunning?"transparent":"#ff6b35",color:steveRunning?txt3:"#000",border:`0.5px solid ${steveRunning?bdr:"#ff6b35"}`,borderRadius:6,fontSize:12,fontWeight:700,cursor:steveRunning?"not-allowed":"pointer",fontFamily:"inherit"}}>{steveRunning?"Scraping...":"▶ Scrape + Inject"}</button>
            </div>
            <div style={{background:metBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"16px 20px"}}>
              <div style={{fontSize:11,color:txt2,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:14}}>Activity Log</div>
              <div style={{fontFamily:"monospace",fontSize:12}}>
                {steveLog.length===0&&<div style={{color:txt3}}>No activity yet.</div>}
                {steveLog.map((l,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:6,color:l.type==="success"?(dark?"#34d399":"#059669"):l.type==="error"?(dark?"#f472b6":"#db2777"):l.type==="warn"?(dark?"#fbbf24":"#d97706"):txt3}}>
                    <span style={{color:txt3,flexShrink:0}}>{l.t}</span><span>{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {steveSelected&&(
            <div onClick={()=>setSteveSelected(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
              <div onClick={e=>e.stopPropagation()} style={{background:cardBg,border:`0.5px solid ${bdr}`,borderRadius:10,padding:"24px",width:460,maxHeight:"80vh",overflowY:"auto"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{fontSize:15,fontWeight:700,color:txt}}>{steveSelected.business_name||steveSelected.name}</div>
                  <button onClick={()=>setSteveSelected(null)} style={{background:"transparent",border:"none",color:txt3,cursor:"pointer",fontSize:16}}>✕</button>
                </div>
                {(()=>{const n=parseN(steveSelected.notes);return(
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                      {([["Status",steveSelected.status],["Score",steveSelected.score||"—"],["Industry",steveSelected.industry||"—"],["Phone",steveSelected.phone||"—"],["Rating",`★ ${n.rating||"—"}`],["Reviews",n.review_count||0]] as [string,any][]).map(([k,v])=>(
                        <div key={k} style={{background:bg,borderRadius:6,padding:"8px 12px"}}>
                          <div style={{fontSize:9,color:txt3,letterSpacing:"0.08em",marginBottom:2}}>{k.toUpperCase()}</div>
                          <div style={{fontSize:13,fontWeight:600,color:txt}}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                    {n.website&&<div style={{marginBottom:10}}><div style={{fontSize:10,color:txt3,marginBottom:4}}>WEBSITE</div><a href={n.website} target="_blank" rel="noreferrer" style={{fontSize:12,color:navAC}}>{n.website}</a></div>}
                    {n.address&&<div style={{marginBottom:10}}><div style={{fontSize:10,color:txt3,marginBottom:4}}>ADDRESS</div><div style={{fontSize:12,color:txt2}}>{n.address}</div></div>}
                    {n.pain_points?.length>0&&<div style={{marginBottom:14}}><div style={{fontSize:10,color:txt3,marginBottom:6}}>PAIN POINTS</div>{n.pain_points.map((p:string,i:number)=><div key={i} style={{fontSize:12,color:"#ff6b35",marginBottom:3}}>→ {p}</div>)}</div>}
                    {steveSelected.phone&&<a href={`tel:${steveSelected.phone}`} style={{display:"block",padding:"10px 0",background:"#ff6b35",color:"#000",borderRadius:6,fontSize:13,fontWeight:700,textAlign:"center",textDecoration:"none"}}>📞 Call {steveSelected.phone}</a>}
                  </div>
                );})()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROPOSAL MODAL */}
      {proposalModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setProposalModal(null)}>
          <div style={{background:"#1a1a2e",borderRadius:12,padding:28,width:"100%",maxWidth:500,maxHeight:"88vh",overflowY:"auto",border:"1px solid rgba(255,107,53,0.3)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{color:"#ff6b35",fontWeight:900,fontSize:12,letterSpacing:1,marginBottom:4}}>SEND PROPOSAL</div>
                <div style={{color:"#fff",fontWeight:700,fontSize:15}}>{proposalModal.business_name||proposalModal.name}</div>
                <div style={{color:"#aaa",fontSize:12,marginTop:2}}>{proposalModal.email||"No email on file"}</div>
              </div>
              <button onClick={()=>setProposalModal(null)} style={{background:"none",border:"none",color:"#aaa",fontSize:18,cursor:"pointer",padding:4}}>X</button>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{color:"#aaa",fontSize:11,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Select Services</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                {["SEO","Google Ads","Website","Lead Gen","Content","Social Media","Analytics","Voice AI","AI/Automation"].map(s=>(
                  <label key={s} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:proposalServices.includes(s)?"rgba(255,107,53,0.15)":"rgba(255,255,255,0.04)",borderRadius:5,border:`1px solid ${proposalServices.includes(s)?"#ff6b35":"rgba(255,255,255,0.08)"}`,cursor:"pointer",fontSize:11,color:"#fff"}}>
                    <input type="checkbox" checked={proposalServices.includes(s)} onChange={e=>{if(e.target.checked){setProposalServices([...proposalServices,s]);setProposalPrices({...proposalPrices,[s]:proposalPrices[s]||0});}else{setProposalServices(proposalServices.filter(x=>x!==s));const p={...proposalPrices};delete p[s];setProposalPrices(p);}}} style={{accentColor:"#ff6b35",marginRight:2}}/>
                    {s}
                  </label>
                ))}
              </div>
            </div>
            {proposalServices.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{color:"#aaa",fontSize:11,fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Monthly Price Per Service</div>
                {proposalServices.map(s=>(
                  <div key={s} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                    <div style={{color:"#ccc",fontSize:12,width:110,flexShrink:0}}>{s}</div>
                    <span style={{color:"#666",fontSize:13}}>$</span>
                    <input type="number" value={proposalPrices[s]||""} onChange={e=>setProposalPrices({...proposalPrices,[s]:parseInt(e.target.value)||0})} placeholder="0" style={{flex:1,padding:"5px 8px",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#fff",fontSize:13}}/>
                    <span style={{color:"#666",fontSize:11}}>/mo</span>
                  </div>
                ))}
                <div style={{background:"rgba(255,107,53,0.1)",borderRadius:5,padding:"7px 10px",marginTop:6,display:"flex",justifyContent:"space-between"}}>
                  <span style={{color:"#ff6b35",fontWeight:600,fontSize:12}}>Total Monthly</span>
                  <span style={{color:"#ff6b35",fontWeight:700,fontSize:12}}>${Object.values(proposalPrices).reduce((a,b)=>Number(a)+Number(b),0).toLocaleString()}/mo</span>
                </div>
              </div>
            )}
            <div style={{marginBottom:14}}>
              <div style={{color:"#aaa",fontSize:11,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Contract Term</div>
              <select value={proposalTerm} onChange={e=>setProposalTerm(e.target.value)} style={{width:"100%",padding:"7px 10px",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#fff",fontSize:13}}>
                <option value="month-to-month">Month-to-month</option>
                <option value="3-month">3 months</option>
                <option value="6-month">6 months</option>
                <option value="12-month">12 months</option>
              </select>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{color:"#aaa",fontSize:11,fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Conversation Notes (AI uses this)</div>
              <textarea value={proposalNotes} onChange={e=>setProposalNotes(e.target.value)} placeholder="e.g. Client relies on referrals, wants more Google visibility..." rows={3} style={{width:"100%",padding:"8px 10px",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#fff",fontSize:12,resize:"vertical",boxSizing:"border-box"}}/>
            </div>
            <button onClick={()=>sendProposal(proposalModal)} disabled={sendingProposal||proposalServices.length===0} style={{width:"100%",padding:"13px",background:sendingProposal||proposalServices.length===0?"#444":"#ff6b35",color:"#fff",border:"none",borderRadius:7,fontSize:14,fontWeight:700,cursor:sendingProposal||proposalServices.length===0?"not-allowed":"pointer",letterSpacing:0.5}}>
              {sendingProposal?"Generating & Sending...":"Generate & Send Proposal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard(){
  return(
    <Suspense fallback={
      <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>☆</div>
          <p style={{color:"rgba(255,255,255,0.2)",fontFamily:"monospace",fontSize:13,letterSpacing:"0.1em"}}>LOADING STARZ-OS...</p>
        </div>
      </div>
    }>
      <DashboardInner/>
    </Suspense>
  );
}