// @ts-nocheck
"use client";
import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://szguizvpiiuiyugrjeks.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z3VpenZwaWl1aXl1Z3JqZWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMyNTg5MiwiZXhwIjoyMDc2OTAxODkyfQ.VPnGM9so9Cp56GV6v6tafzKKs45eNUKpkpwD65Hn7PM";
const FN_URL = "https://szguizvpiiuiyugrjeks.supabase.co/functions/v1";
const TENANT = "00000000-0000-0000-0000-000000000301";

const api = async (path: string, opts: any = {}) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  return r.json();
};

const fn = async (name: string, body: any = {}) => {
  const r = await fetch(`${FN_URL}/${name}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
};

const parseNotes = (notes) => { try { return JSON.parse(notes || "{}"); } catch { return {}; } };
const scoreColor = (s) => s >= 82 ? "#ff6b35" : s >= 62 ? "#ffd23f" : s >= 42 ? "#06ffa5" : "#666";
const statusColor = (s) => ({ Hot:"#ff6b35", Handoff_Ready:"#ffd23f", Nurture:"#06ffa5", Disqualified:"#666", New:"#888", Contacted:"#818cf8", Enriched:"#60a5fa" }[s] || "#888");

export default function SteveDashboard() {
  const [tab, setTab] = useState("pipeline");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [scrapeForm, setScrapeForm] = useState({ industry: "plumber", city: "Miami", state: "FL", limit: 20 });
  const [stats, setStats] = useState({ total:0, hot:0, warm:0, cold:0, contacted:0 });

  const addLog = (msg, type="info") => setLog(p => [{ msg, type, t: new Date().toLocaleTimeString() }, ...p.slice(0,19)]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const data = await api(`leads?tenant_id=eq.${TENANT}&order=created_at.desc&limit=100`);
    const arr = Array.isArray(data) ? data : (data.value || []);
    setLeads(arr);
    setStats({ total:arr.length, hot:arr.filter(l=>l.status==="Hot").length, warm:arr.filter(l=>l.status==="Handoff_Ready").length, cold:arr.filter(l=>l.status==="Nurture").length, contacted:arr.filter(l=>l.status==="Contacted").length });
    setLoading(false);
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const runPipeline = async () => {
    setRunning(true);
    addLog("Starting enrichment...", "info");
    for (let i = 0; i < 6; i++) {
      const e = await fn("lead-enrichment-engine");
      if (!e.enriched) break;
      addLog(`Enriched batch ${i+1}: ${e.enriched} leads`, "success");
    }
    addLog("Routing leads...", "info");
    const r = await fn("lead-targeting-engine");
    addLog(`Routed → Hot: ${r.routed?.hot||0} | Warm: ${r.routed?.warm||0} | Cold: ${r.routed?.cold||0}`, "success");
    await loadLeads();
    setRunning(false);
  };

  const runScrape = async () => {
    setRunning(true);
    addLog(`Scraping ${scrapeForm.industry} in ${scrapeForm.city}...`, "info");
    const r = await fn("lead-scraper", scrapeForm);
    if (r.error) addLog(`Error: ${r.error}`, "error");
    else addLog(`Scraped ${r.inserted} new leads (${r.skipped} skipped)`, "success");
    await loadLeads();
    setRunning(false);
  };

  const runOutreach = async () => {
    setRunning(true);
    addLog("Sending outreach...", "info");
    const r = await fn("outreach-ai-engine");
    if (r.success) addLog(`Sent to ${r.to} — "${r.subject}"`, "success");
    else addLog(r.message || r.error || "No jobs in queue", "warn");
    setRunning(false);
  };

  const hotLeads = leads.filter(l=>l.status==="Hot");
  const warmLeads = leads.filter(l=>l.status==="Handoff_Ready");
  const coldLeads = leads.filter(l=>l.status==="Nurture");
  const newLeads = leads.filter(l=>l.status==="New");

  return (
    <div style={{ background:"#080810", minHeight:"100vh", fontFamily:"'DM Mono','Courier New',monospace", color:"#e0e0f0" }}>
      <div style={{ borderBottom:"1px solid #1a1a2e", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#0a0a18" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#ff6b35,#ff3366)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700 }}>S</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"#ff6b35" }}>STEVE BGE</div>
            <div style={{ fontSize:10, color:"#444", letterSpacing:"0.1em" }}>REVENUE COMMAND CENTER</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={runPipeline} disabled={running} style={{ padding:"7px 16px", background:running?"#1a1a2e":"#ff6b35", color:running?"#444":"#000", border:"none", borderRadius:4, fontSize:11, fontWeight:700, cursor:running?"not-allowed":"pointer", letterSpacing:"0.1em", fontFamily:"inherit" }}>{running?"RUNNING...":"▶ RUN PIPELINE"}</button>
          <button onClick={loadLeads} style={{ padding:"7px 16px", background:"transparent", color:"#666", border:"1px solid #1a1a2e", borderRadius:4, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>↺ REFRESH</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:1, borderBottom:"1px solid #1a1a2e", background:"#1a1a2e" }}>
        {[["TOTAL LEADS",stats.total,"#e0e0f0"],["HOT 🔥",stats.hot,"#ff6b35"],["WARM ⚡",stats.warm,"#ffd23f"],["NURTURE 🌱",stats.cold,"#06ffa5"],["CONTACTED",stats.contacted,"#818cf8"]].map(([label,value,color])=>(
          <div key={label} style={{ background:"#080810", padding:"16px 20px", textAlign:"center" }}>
            <div style={{ fontSize:28, fontWeight:700, color, lineHeight:1 }}>{loading?"—":value}</div>
            <div style={{ fontSize:9, color:"#444", marginTop:4, letterSpacing:"0.12em" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2e", background:"#0a0a18" }}>
        {[["pipeline","PIPELINE"],["hot",`HOT (${stats.hot})`],["warm",`WARM (${stats.warm})`],["scraper","SCRAPER"],["log","ACTIVITY"]].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:"12px 20px", background:"transparent", color:tab===k?"#ff6b35":"#444", border:"none", borderBottom:tab===k?"2px solid #ff6b35":"2px solid transparent", cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:"0.1em", fontFamily:"inherit" }}>{label}</button>
        ))}
      </div>

      <div style={{ padding:"20px 24px" }}>
        {tab==="pipeline" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[["🔥 HOT",hotLeads,"#ff6b35","Auto-close → Rico"],["⚡ WARM",warmLeads,"#ffd23f","Human closer queue"],["🌱 NURTURE",coldLeads,"#06ffa5","Follow-up sequence"],["📥 NEW",newLeads,"#666","Awaiting enrichment"]].map(([label,arr,color,desc])=>(
              <div key={label}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ fontSize:11, fontWeight:700, color, letterSpacing:"0.1em" }}>{label}</div>
                  <div style={{ fontSize:10, color:"#444" }}>{arr.length}</div>
                </div>
                <div style={{ fontSize:9, color:"#444", marginBottom:10, letterSpacing:"0.08em" }}>{desc}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:480, overflowY:"auto" }}>
                  {arr.map(lead=>{
                    const n=parseNotes(lead.notes);
                    return (
                      <div key={lead.id} onClick={()=>setSelectedLead(lead)} style={{ background:"#0d0d1a", border:`1px solid ${color}22`, borderRadius:4, padding:"10px 12px", cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.borderColor=color} onMouseLeave={e=>e.currentTarget.style.borderColor=`${color}22`}>
                        <div style={{ fontSize:12, fontWeight:600, color:"#e0e0f0", marginBottom:4, lineHeight:1.3 }}>{lead.business_name||lead.name}</div>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <div style={{ fontSize:10, color:"#444" }}>{lead.industry?.toUpperCase()}</div>
                          {lead.score>0&&<div style={{ fontSize:11, fontWeight:700, color:scoreColor(lead.score) }}>{lead.score}</div>}
                        </div>
                        {n.review_count>0&&<div style={{ fontSize:9, color:"#333", marginTop:3 }}>★ {n.rating} · {n.review_count} reviews</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="hot" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ fontSize:11, color:"#666", marginBottom:8, letterSpacing:"0.08em" }}>HOT LEADS — Score 82+ · Steve auto-closes · Routes to Rico on proposal</div>
            {hotLeads.map(lead=>{
              const n=parseNotes(lead.notes);
              return (
                <div key={lead.id} style={{ background:"#0d0d1a", border:"1px solid #ff6b3533", borderRadius:6, padding:"16px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:"#e0e0f0", marginBottom:2 }}>{lead.business_name||lead.name}</div>
                      <div style={{ fontSize:11, color:"#666" }}>{lead.phone||"No phone"} · {lead.industry?.toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:24, fontWeight:700, color:"#ff6b35" }}>{lead.score}</div>
                      <div style={{ fontSize:9, color:"#ff6b3588" }}>SCORE</div>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                    {[["REVIEWS",n.review_count||0,"#e0e0f0"],["RATING",`★ ${n.rating||"—"}`,"#ffd23f"],["WEBSITE",n.website?"YES":"NONE",n.website?"#06ffa5":"#ff3366"]].map(([k,v,c])=>(
                      <div key={k} style={{ background:"#080810", borderRadius:4, padding:"8px 10px" }}>
                        <div style={{ fontSize:9, color:"#444", letterSpacing:"0.08em" }}>{k}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {n.pain_points?.length>0&&(
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:9, color:"#444", marginBottom:6 }}>PAIN POINTS</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {n.pain_points.map((p,i)=><span key={i} style={{ fontSize:10, padding:"2px 8px", background:"#ff6b3511", color:"#ff6b35", borderRadius:3, border:"1px solid #ff6b3533" }}>{p}</span>)}
                      </div>
                    </div>
                  )}
                  <div style={{ background:"#080810", borderRadius:4, padding:"10px 12px", marginBottom:12, borderLeft:"2px solid #ff6b35" }}>
                    <div style={{ fontSize:9, color:"#444", marginBottom:4 }}>SUGGESTED OPENER</div>
                    <div style={{ fontSize:12, color:"#aaa", fontStyle:"italic", lineHeight:1.5 }}>"Hey {lead.business_name?.split(" ")[0]||"there"} — I noticed {n.review_count<50?`you only have ${n.review_count} reviews online`:n.website?"your online presence could be pulling in more leads":"you don't have a website"}. Are you currently getting enough calls each week, or are there gaps in your schedule?"</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {lead.phone&&<a href={`tel:${lead.phone}`} style={{ flex:1, padding:"8px 0", background:"#ff6b35", color:"#000", borderRadius:4, fontSize:11, fontWeight:700, textAlign:"center", textDecoration:"none" }}>📞 CALL NOW</a>}
                    {n.website&&<a href={n.website} target="_blank" rel="noreferrer" style={{ padding:"8px 14px", background:"transparent", color:"#666", border:"1px solid #1a1a2e", borderRadius:4, fontSize:11, textDecoration:"none" }}>🌐</a>}
                    <button onClick={runOutreach} style={{ padding:"8px 14px", background:"transparent", color:"#818cf8", border:"1px solid #818cf833", borderRadius:4, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>✉ OUTREACH</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab==="warm" && (
          <div>
            <div style={{ fontSize:11, color:"#666", marginBottom:16, letterSpacing:"0.08em" }}>WARM LEADS — Score 62-81 · Ready for human closer · 60% close probability</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
              {warmLeads.map(lead=>{
                const n=parseNotes(lead.notes);
                return (
                  <div key={lead.id} style={{ background:"#0d0d1a", border:"1px solid #ffd23f22", borderRadius:6, padding:"14px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#e0e0f0", marginBottom:2 }}>{lead.business_name||lead.name}</div>
                        <div style={{ fontSize:10, color:"#555" }}>{lead.phone||"No phone"} · {lead.industry?.toUpperCase()}</div>
                      </div>
                      <div style={{ fontSize:20, fontWeight:700, color:"#ffd23f" }}>{lead.score}</div>
                    </div>
                    <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                      {n.pain_points?.slice(0,2).map((p,i)=><span key={i} style={{ fontSize:9, padding:"2px 6px", background:"#ffd23f11", color:"#ffd23f", borderRadius:3 }}>{p}</span>)}
                    </div>
                    <div style={{ display:"flex", gap:4, fontSize:10, color:"#444", marginBottom:10 }}>
                      <span>★ {n.rating||"—"}</span><span>·</span><span>{n.review_count||0} reviews</span><span>·</span>
                      <span style={{ color:n.website?"#06ffa5":"#ff3366" }}>{n.website?"Has website":"No website"}</span>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {lead.phone&&<a href={`tel:${lead.phone}`} style={{ flex:1, padding:"6px 0", background:"#ffd23f", color:"#000", borderRadius:3, fontSize:10, fontWeight:700, textAlign:"center", textDecoration:"none" }}>📞 CALL</a>}
                      <button onClick={runOutreach} style={{ padding:"6px 10px", background:"transparent", color:"#818cf8", border:"1px solid #818cf822", borderRadius:3, fontSize:10, cursor:"pointer", fontFamily:"inherit" }}>✉</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="scraper" && (
          <div style={{ maxWidth:500 }}>
            <div style={{ fontSize:11, color:"#666", marginBottom:20, letterSpacing:"0.08em" }}>GOOGLE MAPS SCRAPER — Pull real businesses into the pipeline</div>
            <div style={{ background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:"20px" }}>
              {[{label:"INDUSTRY",key:"industry",type:"select",options:["plumber","HVAC","roofing","electrician","landscaping","pest control","dentist","chiropractor","attorney","auto repair","cleaning"]},{label:"CITY",key:"city",type:"text"},{label:"STATE",key:"state",type:"text"},{label:"LIMIT",key:"limit",type:"number"}].map(f=>(
                <div key={f.key} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:9, color:"#444", letterSpacing:"0.12em", marginBottom:4 }}>{f.label}</div>
                  {f.type==="select"?(
                    <select value={scrapeForm[f.key]} onChange={e=>setScrapeForm(p=>({...p,[f.key]:e.target.value}))} style={{ width:"100%", background:"#080810", border:"1px solid #1a1a2e", color:"#e0e0f0", padding:"8px 10px", borderRadius:4, fontSize:12, fontFamily:"inherit" }}>
                      {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                  ):(
                    <input type={f.type} value={scrapeForm[f.key]} onChange={e=>setScrapeForm(p=>({...p,[f.key]:f.type==="number"?parseInt(e.target.value):e.target.value}))} style={{ width:"100%", background:"#080810", border:"1px solid #1a1a2e", color:"#e0e0f0", padding:"8px 10px", borderRadius:4, fontSize:12, fontFamily:"inherit", boxSizing:"border-box" }} />
                  )}
                </div>
              ))}
              <button onClick={runScrape} disabled={running} style={{ width:"100%", padding:"12px", background:running?"#1a1a2e":"#ff6b35", color:running?"#444":"#000", border:"none", borderRadius:4, fontSize:12, fontWeight:700, cursor:running?"not-allowed":"pointer", letterSpacing:"0.1em", fontFamily:"inherit" }}>{running?"SCRAPING...":"▶ SCRAPE + INJECT INTO PIPELINE"}</button>
            </div>
            <div style={{ marginTop:16, background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:"14px 16px" }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:"0.12em", marginBottom:10 }}>QUICK TARGETS</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[["plumber","Miami","FL"],["HVAC","Miami","FL"],["roofing","Miami","FL"],["dentist","Miami","FL"],["electrician","Miami","FL"],["attorney","Miami","FL"]].map(([ind,city,state])=>(
                  <button key={ind} onClick={()=>setScrapeForm({industry:ind,city,state,limit:20})} style={{ padding:"4px 10px", background:"#1a1a2e", color:"#666", border:"1px solid #222", borderRadius:3, fontSize:10, cursor:"pointer", fontFamily:"inherit" }}>{ind}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==="log" && (
          <div>
            <div style={{ fontSize:11, color:"#666", marginBottom:16 }}>ACTIVITY LOG</div>
            <div style={{ background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:6, padding:"16px", fontSize:12 }}>
              {log.length===0&&<div style={{ color:"#333" }}>No activity yet. Run the pipeline to see logs.</div>}
              {log.map((l,i)=>(
                <div key={i} style={{ display:"flex", gap:12, marginBottom:8, color:l.type==="success"?"#06ffa5":l.type==="error"?"#ff3366":l.type==="warn"?"#ffd23f":"#666" }}>
                  <span style={{ color:"#333", flexShrink:0 }}>{l.t}</span>
                  <span>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedLead&&(
        <div onClick={()=>setSelectedLead(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#0d0d1a", border:"1px solid #ff6b3533", borderRadius:8, padding:"24px", width:480, maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:700 }}>{selectedLead.business_name||selectedLead.name}</div>
              <button onClick={()=>setSelectedLead(null)} style={{ background:"transparent", border:"none", color:"#666", cursor:"pointer", fontSize:16 }}>✕</button>
            </div>
            {(()=>{
              const n=parseNotes(selectedLead.notes);
              return (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                    {[["Status",selectedLead.status],["Score",selectedLead.score],["Industry",selectedLead.industry],["Phone",selectedLead.phone||"—"],["Rating",`★ ${n.rating||"—"}`],["Reviews",n.review_count||0]].map(([k,v])=>(
                      <div key={k} style={{ background:"#080810", padding:"8px 10px", borderRadius:4 }}>
                        <div style={{ fontSize:9, color:"#444" }}>{k.toUpperCase()}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:k==="Status"?statusColor(v):"#e0e0f0" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {n.website&&<div style={{ marginBottom:12 }}><div style={{ fontSize:9, color:"#444", marginBottom:4 }}>WEBSITE</div><a href={n.website} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"#818cf8" }}>{n.website}</a></div>}
                  {n.address&&<div style={{ marginBottom:12 }}><div style={{ fontSize:9, color:"#444", marginBottom:4 }}>ADDRESS</div><div style={{ fontSize:12, color:"#666" }}>{n.address}</div></div>}
                  {n.pain_points?.length>0&&<div style={{ marginBottom:16 }}><div style={{ fontSize:9, color:"#444", marginBottom:6 }}>PAIN POINTS</div>{n.pain_points.map((p,i)=><div key={i} style={{ fontSize:12, color:"#ff6b35", marginBottom:4 }}>→ {p}</div>)}</div>}
                  {selectedLead.phone&&<a href={`tel:${selectedLead.phone}`} style={{ display:"block", padding:"10px 0", background:"#ff6b35", color:"#000", borderRadius:4, fontSize:12, fontWeight:700, textAlign:"center", textDecoration:"none" }}>📞 CALL</a>}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
