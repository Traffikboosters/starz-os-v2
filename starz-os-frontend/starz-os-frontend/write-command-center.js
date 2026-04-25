const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "starz-os-frontend", "app", "command-center");
fs.mkdirSync(outDir, { recursive: true });

const content = `"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function fmtMoney(v) {
  if (v == null) return "—";
  if (v >= 1000000) return "$" + (v / 1000000).toFixed(1) + "M";
  if (v >= 1000) return "$" + Math.round(v / 1000) + "k";
  return "$" + Math.round(v);
}
function fmtNum(v) { return v != null ? String(v) : "—"; }
function fmtPct(v) { return v != null ? Math.round(v) + "%" : "—"; }
function initials(first, last) { return ((first?.[0] || "") + (last?.[0] || "")).toUpperCase() || "??"; }
function stageColor(s) { return s === "closed_won" ? "#00e5b4" : s === "proposal" ? "#f5a623" : s === "discovery" ? "#4d9fff" : "#64748b"; }
function statusColor(s) { return s === "active" ? "#00e5b4" : s === "completed" ? "#4d9fff" : s === "probation" ? "#f5a623" : "#64748b"; }
function alertColor(s) { return s === "critical" ? "#ff4d4d" : s === "warning" ? "#f5a623" : "#00e5b4"; }

function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#111418", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px", position: "relative", overflow: "hidden", flex: 1, minWidth: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent, borderRadius: "10px 10px 0 0" }} />
      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500, letterSpacing: "0.5px", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1, marginBottom: 4, fontFamily: "monospace", color: accent }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#64748b" }}>{sub}</div>}
    </div>
  );
}

function FunnelCard({ icon, label, value, color }) {
  return (
    <div style={{ background: "#111418", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "monospace", color }}>{value}</div>
      </div>
    </div>
  );
}

function ModuleRow({ name, status }) {
  const colors = { LIVE: { bg: "rgba(0,229,180,0.12)", color: "#00e5b4" }, BUILDING: { bg: "rgba(245,166,35,0.12)", color: "#f5a623" }, QUEUED: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" } };
  const c = colors[status];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <span style={{ fontSize: 12, fontWeight: 500 }}>{name}</span>
      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontFamily: "monospace", fontWeight: 600, background: c.bg, color: c.color }}>{status}</span>
    </div>
  );
}

function SectionHeader({ title, badge, badgeType = "teal" }) {
  const colors = { teal: { bg: "rgba(0,229,180,0.12)", color: "#00e5b4" }, amber: { bg: "rgba(245,166,35,0.12)", color: "#f5a623" }, red: { bg: "rgba(255,77,77,0.1)", color: "#ff4d4d" } };
  const c = colors[badgeType];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "monospace" }}>{title}</span>
      {badge && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontFamily: "monospace", fontWeight: 700, background: c.bg, color: c.color }}>{badge}</span>}
    </div>
  );
}

function Panel({ children }) {
  return <div style={{ background: "#111418", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 16 }}>{children}</div>;
}

export default function CommandCenter() {
  const [activePanel, setActivePanel] = useState("overview");
  const [time, setTime] = useState("");
  const [progress, setProgress] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [daily, setDaily] = useState([]);
  const [leads, setLeads] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [mrr, setMrr] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [progRes, alertRes, dailyRes, leadsRes, pipelineRes, woRes, closedRes] = await Promise.allSettled([
      supabase.schema("analytics").from("v_steve_monthly_progress").select("*").limit(1).single(),
      supabase.schema("analytics").from("steve_alerts").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.schema("analytics").from("steve_kpis_daily").select("kpi_date, deals_closed").order("kpi_date", { ascending: true }).limit(30),
      supabase.schema("crm").from("leads").select("first_name, last_name, company_name, lead_score").order("lead_score", { ascending: false }).limit(5),
      supabase.schema("deals").from("pipeline").select("id, business_name, service_type, stage, deal_value").order("created_at", { ascending: false }).limit(8),
      supabase.schema("deals").from("work_orders").select("id, service_type, status, assigned_to").order("created_at", { ascending: false }).limit(8),
      supabase.schema("deals").from("pipeline").select("deal_value").eq("stage", "closed_won"),
    ]);
    if (progRes.status === "fulfilled" && progRes.value.data) setProgress(progRes.value.data);
    if (alertRes.status === "fulfilled" && alertRes.value.data) setAlerts(alertRes.value.data);
    if (dailyRes.status === "fulfilled" && dailyRes.value.data) setDaily(dailyRes.value.data);
    if (leadsRes.status === "fulfilled" && leadsRes.value.data) setLeads(leadsRes.value.data);
    if (pipelineRes.status === "fulfilled" && pipelineRes.value.data) setPipeline(pipelineRes.value.data);
    if (woRes.status === "fulfilled" && woRes.value.data) setWorkOrders(woRes.value.data);
    if (closedRes.status === "fulfilled" && closedRes.value.data) {
      setMrr(closedRes.value.data.reduce((s, d) => s + (d.deal_value || 0), 0));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const maxDeals = Math.max(...daily.map(d => d.deals_closed || 0), 1);
  const woCounts = {
    total: workOrders.length,
    active: workOrders.filter(w => w.status === "active").length,
    completed: workOrders.filter(w => w.status === "completed").length,
    probation: workOrders.filter(w => w.status === "probation").length,
    pending: workOrders.filter(w => w.status === "pending").length,
  };

  const navTabs = [
    { key: "overview", label: "Overview" },
    { key: "sales", label: "Sales" },
    { key: "fulfillment", label: "Fulfillment" },
    { key: "roadmap", label: "Roadmap" },
  ];

  return (
    <div style={{ background: "#0a0c0f", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#111418", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 20px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#00e5b4", letterSpacing: 2, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, background: "#00e5b4", borderRadius: "50%" }} />
          STARZ-OS
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {navTabs.map(tab => (
            <button key={tab.key} onClick={() => setActivePanel(tab.key)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", borderRadius: 6, border: "none", background: activePanel === tab.key ? "rgba(0,229,180,0.12)" : "transparent", color: activePanel === tab.key ? "#00e5b4" : "#64748b" }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>LIVE | {time}</div>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#111418", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, fontSize: 11, fontFamily: "monospace", color: "#64748b", flexWrap: "wrap" }}>
          {[["MRR", fmtMoney(mrr)], ["Open Deals", fmtNum(pipeline.length)], ["Hot Leads", fmtNum(leads.length)], ["Work Orders", fmtNum(woCounts.total)], ["Close Rate", fmtPct(progress?.close_rate)], ["System", "OPERATIONAL"]].map(([label, val], i, arr) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
              {label} <span style={{ color: "#00e5b4", fontWeight: 700 }}>{loading ? "…" : val}</span>
              {i < arr.length - 1 && <span style={{ color: "rgba(255,255,255,0.12)", marginLeft: 4 }}>|</span>}
            </span>
          ))}
        </div>

        {activePanel === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionHeader title="Performance KPIs" badge="THIS MONTH" />
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <KpiCard label="Deals Closed" value={fmtNum(progress?.deals_closed)} sub={"Target: " + fmtNum(progress?.deal_target)} accent="#00e5b4" />
              <KpiCard label="Revenue" value={fmtMoney(progress?.revenue_generated)} sub="Generated" accent="#f5a623" />
              <KpiCard label="Close Rate" value={fmtPct(progress?.close_rate)} sub="Conversion" accent="#4d9fff" />
              <KpiCard label="Progress" value={fmtPct(progress?.progress_percent)} sub="Goal Completion" accent="#a78bfa" />
              <KpiCard label="Calls Booked" value={fmtNum(progress?.calls_booked)} sub="Pipeline" accent="#00e5b4" />
            </div>
            <SectionHeader title="Sales Funnel" />
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <FunnelCard icon="📥" label="LEADS" value={fmtNum(progress?.leads_contacted)} color="#00e5b4" />
              <FunnelCard icon="🎯" label="QUALIFIED" value={fmtNum(progress?.leads_qualified)} color="#4d9fff" />
              <FunnelCard icon="📞" label="BOOKED" value={fmtNum(progress?.calls_booked)} color="#f5a623" />
              <FunnelCard icon="✅" label="SHOWS" value={fmtNum(progress?.shows_completed)} color="#a78bfa" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
              <Panel>
                <SectionHeader title="Daily Deals Trend" badge="30 DAYS" />
                <div style={{ height: 140, display: "flex", alignItems: "flex-end", gap: 6, padding: "0 4px" }}>
                  {(daily.length > 0 ? daily : Array.from({length:30},(_,i)=>({kpi_date:String(i+1).padStart(2,"0"),deals_closed:[1,0,2,1,3,2,4,1,2,3,1,0,2,3,4,2,1,3,2,1,4,3,2,1,2,3,4,2,3,4][i]}))).map((d, i) => {
                    const h = Math.max(Math.round(((d.deals_closed||0)/maxDeals)*100),4);
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                        <div style={{ width: "100%", height: h+"%", background: "#00e5b4", opacity: daily.length > 0 ? 0.75 : 0.3, borderRadius: "4px 4px 0 0" }} />
                        <span style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>{(d.kpi_date||"").slice(5)||d.kpi_date}</span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
              <Panel>
                <SectionHeader title="AI Alerts" badge={String(alerts.length)} badgeType="amber" />
                {alerts.length > 0 ? alerts.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < alerts.length-1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: alertColor(a.severity), marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{a.message}</div>
                      {a.created_at && <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", marginTop: 4 }}>{new Date(a.created_at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</div>}
                    </div>
                  </div>
                )) : (
                  <div style={{ display: "flex", gap: 10, padding: "10px 0" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5b4", marginTop: 5 }} />
                    <div><div style={{ fontSize: 12, fontWeight: 600 }}>All systems operational</div><div style={{ fontSize: 11, color: "#64748b" }}>No active alerts</div></div>
                  </div>
                )}
              </Panel>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Panel>
                <SectionHeader title="Monthly Target" badge={fmtPct(progress?.progress_percent)} />
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 8, overflow: "hidden", margin: "10px 0 6px" }}>
                  <div style={{ height: "100%", width: Math.min(100, Math.round(progress?.progress_percent||0))+"%", background: "linear-gradient(90deg,#00e5b4,#00c9ff)", borderRadius: 4, transition: "width 1s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>
                  <span>{progress?.deals_closed||0} closed</span>
                  <span>Target: {fmtNum(progress?.deal_target)}</span>
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
                  <div style={{ flex: 1, background: "#181c22", borderRadius: 6, padding: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Generated</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#f5a623", fontFamily: "monospace" }}>{fmtMoney(progress?.revenue_generated)}</div>
                  </div>
                  <div style={{ flex: 1, background: "#181c22", borderRadius: 6, padding: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Close Rate</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#4d9fff", fontFamily: "monospace" }}>{fmtPct(progress?.close_rate)}</div>
                  </div>
                </div>
              </Panel>
              <Panel>
                <SectionHeader title="System Modules" />
                <ModuleRow name="Steve AI (Sales)" status="LIVE" />
                <ModuleRow name="Rico (Fulfillment)" status="LIVE" />
                <ModuleRow name="Zara (HR)" status="BUILDING" />
                <ModuleRow name="PowerDial" status="QUEUED" />
                <ModuleRow name="Partner Portal" status="QUEUED" />
                <ModuleRow name="TB Billing" status="BUILDING" />
              </Panel>
              <Panel>
                <SectionHeader title="Hot Leads" badge="STEVE QUEUE" badgeType="red" />
                {leads.length > 0 ? leads.map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < leads.length-1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(0,229,180,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#00e5b4", fontFamily: "monospace", flexShrink: 0 }}>{initials(l.first_name, l.last_name)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.first_name} {l.last_name}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{l.company_name||"—"}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#00e5b4", fontFamily: "monospace" }}>{l.lead_score||"—"}</div>
                  </div>
                )) : <div style={{ fontSize: 12, color: "#64748b", padding: "8px 0" }}>No hot leads found</div>}
              </Panel>
            </div>
          </div>
        )}

        {activePanel === "sales" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionHeader title="Steve AI — Sales Engine" badge="AUTONOMOUS" />
            <div style={{ display: "flex", gap: 8 }}>
              <KpiCard label="Leads Contacted" value={fmtNum(progress?.leads_contacted)} accent="#00e5b4" />
              <KpiCard label="Qualified" value={fmtNum(progress?.leads_qualified)} accent="#f5a623" />
              <KpiCard label="Calls Booked" value={fmtNum(progress?.calls_booked)} accent="#4d9fff" />
              <KpiCard label="Shows" value={fmtNum(progress?.shows_completed)} accent="#a78bfa" />
              <KpiCard label="Deals Closed" value={fmtNum(progress?.deals_closed)} accent="#00e5b4" />
            </div>
            <Panel>
              <SectionHeader title="Pipeline Deals" badge="LIVE" />
              {pipeline.length > 0 ? pipeline.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < pipeline.length-1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{d.business_name||"—"}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{d.service_type||"—"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 10, color: stageColor(d.stage), fontFamily: "monospace", fontWeight: 700 }}>{(d.stage||"").toUpperCase()}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#f5a623", fontFamily: "monospace" }}>{fmtMoney(d.deal_value)}</span>
                  </div>
                </div>
              )) : <div style={{ fontSize: 12, color: "#64748b", padding: "8px 0" }}>No pipeline deals found</div>}
            </Panel>
          </div>
        )}

        {activePanel === "fulfillment" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionHeader title="Rico — Fulfillment Engine" badge="ACTIVE" />
            <div style={{ display: "flex", gap: 8 }}>
              <KpiCard label="Total Orders" value={fmtNum(woCounts.total)} accent="#00e5b4" />
              <KpiCard label="In Progress" value={fmtNum(woCounts.active)} accent="#f5a623" />
              <KpiCard label="Completed" value={fmtNum(woCounts.completed)} accent="#4d9fff" />
              <KpiCard label="On Probation" value={fmtNum(woCounts.probation)} accent="#a78bfa" />
              <KpiCard label="Pending" value={fmtNum(woCounts.pending)} accent="#ff4d4d" />
            </div>
            <Panel>
              <SectionHeader title="Recent Work Orders" />
              {workOrders.length > 0 ? workOrders.map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < workOrders.length-1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{w.service_type||"—"}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{w.assigned_to||"Unassigned"}</div>
                  </div>
                  <span style={{ fontSize: 10, color: statusColor(w.status), fontFamily: "monospace", fontWeight: 700 }}>{(w.status||"").toUpperCase()}</span>
                </div>
              )) : <div style={{ fontSize: 12, color: "#64748b", padding: "8px 0" }}>No work orders found</div>}
            </Panel>
          </div>
        )}

        {activePanel === "roadmap" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionHeader title="STARZ-OS Build Roadmap" badge="11 PHASES" badgeType="amber" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 }}>
              {[
                { title: "Phase 1 — Core System", color: "#00e5b4", items: [["✓","Supabase backend"],["✓","Next.js frontend"],["✓","Multi-schema architecture"],["○","Multi-tenant org system"]] },
                { title: "Phase 2 — Sales Machine", color: "#f5a623", items: [["✓","Lead qualification"],["✓","Outreach system"],["○","Voice AI calling"],["○","Auto follow-ups"]] },
                { title: "Phase 3 — PowerDial", color: "#a78bfa", items: [["○","Dialpad integration"],["○","Call recording"],["○","AI voice layer"],["○","Call floor UI"]] },
                { title: "Phase 4 — Fulfillment", color: "#4d9fff", items: [["✓","Work order structure"],["○","Auto-generation"],["○","Developer dashboard"],["○","SLA tracking"]] },
                { title: "Phase 5 — SEO Engine", color: "#00e5b4", items: [["○","SEO audit engine"],["○","Keyword tracking"],["○","Competitor spy"],["○","Backlink automation"]] },
                { title: "Phase 6 — Partner Portal", color: "#f5a623", items: [["○","Login dashboard"],["○","ROI reporting"],["○","Vox chat system"],["○","Ticketing support"]] },
                { title: "Phase 7 — TB Billing", color: "#ff4d4d", items: [["✓","Stripe checkout"],["○","Subscriptions"],["○","MRR dashboard"],["○","Churn tracking"]] },
                { title: "Phase 8 — AI Intelligence", color: "#a78bfa", items: [["○","Decision engine"],["○","Revenue forecasting"],["○","Deal probability AI"],["○","Lead scoring AI"]] },
                { title: "Phase 9-11 — Scale", color: "#4d9fff", items: [["○","Role-based access"],["○","Public API layer"],["○","White-label SaaS"],["○","Multi-region"]] },
              ].map((phase, i) => (
                <div key={i} style={{ background: "#111418", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: phase.color }}>{phase.title}</div>
                  {phase.items.map(([check, label], j) => (
                    <div key={j} style={{ fontSize: 11, color: "#64748b", padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: check === "✓" ? "#00e5b4" : "#64748b" }}>{check}</span>{label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(outDir, "page.tsx"), content, { encoding: "utf8" });
console.log("✅ Written: " + path.join(outDir, "page.tsx"));