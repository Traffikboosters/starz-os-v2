"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { useRouter } from "next/navigation";

const LOGO = "https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/logo/STARZ-OS%20LOGO555.png";
const TENANT = "00000000-0000-0000-0000-000000000301";

type SeoSection = "overview"|"backlinks"|"keywords"|"rankings"|"audit"|"competitors"|"domain"|"sandbox"|"docs"|"onboarding"|"googleads"|"outreach"|"workorders";

type WorkOrder = {
  id: string;
  client_name: string | null;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  package: string | null;
  status: string | null;
  payment_status: string | null;
  total_amount: number | null;
  deposit_amount: number | null;
  monthly_amount: number | null;
  signed_at: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  created_at: string | null;
};

type Deliverable = {
  id: string;
  work_order_id: string;
  category: string;
  title: string;
  description: string | null;
  status: string;
  proof_type: string | null;
  proof_value: string | null;
  created_at: string | null;
  completed_at: string | null;
};

type OutreachQueueItem = {
  id: number;
  tenant_id: string | null;
  lead_id: string | null;
  status: string | null;
  attempts: number | null;
  planned_for: string | null;
  created_at: string | null;
};

type OutreachLogItem = {
  id: number;
  lead_id: string | null;
  email: string | null;
  subject: string | null;
  status: string | null;
  sent_at: string | null;
  created_at: string | null;
};

type GoogleAdsKeyword = {
  id: number;
  keyword: string | null;
  location: string | null;
  avg_monthly_searches: number | null;
  competition: string | null;
  cpc: number | null;
  pulled_at: string | null;
  pulled_month: string | null;
};

type Backlink = {
  id: string;
  url: string | null;
  anchor_text: string | null;
  score: number | null;
  spam_score: number | null;
  placed_at: string | null;
  created_at: string | null;
  domain: string | null;
};

type Keyword = {
  id: string;
  keyword: string | null;
  search_volume: number | null;
  difficulty: number | null;
  intent: string | null;
  last_checked: string | null;
};

type RankTracking = {
  id: string;
  keyword_id: string;
  position: number | null;
  device: string | null;
  location: string | null;
  checked_at: string | null;
  keyword_text?: string;
};

type Competitor = { id: string; competitor_domain: string | null; overlap_score: number | null; created_at: string | null; };
type Audit = { id: string; url: string | null; score: number | null; issues: number | null; created_at: string | null; };

type OverviewStats = {
  keywordCount: number;
  backlinkCount: number;
  avgPosition: number | null;
  tableCount: number;
};

export default function DeveloperPortal() {
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(true);
  const [logoErr, setLogoErr] = useState(false);
  const [section, setSection] = useState<SeoSection>("overview");
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [rankings, setRankings] = useState<RankTracking[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({ keywordCount: 0, backlinkCount: 0, avgPosition: null, tableCount: 0 });
  const [loading, setLoading] = useState(false);
  const [googleAds, setGoogleAds] = useState<GoogleAdsKeyword[]>([]);
  const [outreachQueue, setOutreachQueue] = useState<OutreachQueueItem[]>([]);
  const [outreachLog, setOutreachLog] = useState<OutreachLogItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [proofInput, setProofInput] = useState<{[key: string]: string}>({});
  const [uploadingProof, setUploadingProof] = useState<{[key: string]: boolean}>({});

  const uploadProofFile = async (id: string, file: File) => {
    setUploadingProof(p => ({ ...p, [id]: true }));
    try {
      const ext = file.name.split('.').pop();
      const path = `deliverables/${id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('reports').upload(path, file, { upsert: true });
      if (upErr) { console.error(upErr); return; }
      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path);
      const url = urlData?.publicUrl ?? path;
      await supabase.schema("deals").from("deliverables").update({ proof_value: url, proof_type: "file", status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
      if (selectedWorkOrder) loadDeliverables(selectedWorkOrder.id);
    } catch (e) { console.error(e); }
    setUploadingProof(p => ({ ...p, [id]: false }));
  };
  const [sandboxQuery, setSandboxQuery] = useState("SELECT keyword, search_volume, difficulty FROM seo.keywords ORDER BY search_volume DESC LIMIT 5;");
  const [sandboxResult, setSandboxResult] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    try { if (localStorage.getItem("starz-theme") === "light") setDark(false); } catch {}
  }, []);

  const toggle = () => setDark(p => {
    try { localStorage.setItem("starz-theme", p ? "light" : "dark"); } catch {}
    return !p;
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      setReady(true);
    });
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    if (section === "overview") loadOverviewStats();
    else loadSectionData(section);
  }, [ready, section]);

  const loadOverviewStats = async () => {
    setLoading(true);
    try {
      const [kwRes, blRes, rtRes] = await Promise.all([
        supabase.schema("seo").from("keywords").select("id", { count: "exact", head: true }).eq("tenant_id", TENANT),
        supabase.schema("seo").from("backlink_prospects").select("id", { count: "exact", head: true }).eq("tenant_id", TENANT),
        supabase.schema("seo").from("rank_tracking").select("position").eq("tenant_id", TENANT).eq("device", "desktop").order("checked_at", { ascending: false }).limit(50),
      ]);

      const positions = (rtRes.data ?? []).map(r => r.position).filter((p): p is number => p !== null);
      const avgPos = positions.length > 0 ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length) : null;

      setOverviewStats({
        keywordCount: kwRes.count ?? 0,
        backlinkCount: blRes.count ?? 0,
        avgPosition: avgPos,
        tableCount: 12,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadSectionData = async (s: SeoSection) => {
    setLoading(true);
    try {
      if (s === "backlinks") {
        // Query backlink_prospects (backlinks go through prospect flow)
        const { data } = await supabase
          .schema("seo")
          .from("backlink_prospects")
          .select("id, domain, url, score, spam_score, created_at")
          .eq("tenant_id", TENANT)
          .order("score", { ascending: false })
          .limit(50);
        setBacklinks((data ?? []).map((d: any) => ({
          id: d.id,
          url: d.url,
          anchor_text: null,
          score: d.score,
          spam_score: d.spam_score,
          placed_at: null,
          created_at: d.created_at,
          domain: d.domain,
        })));
      }

      if (s === "keywords") {
        const { data } = await supabase
          .schema("seo")
          .from("keywords")
          .select("id, keyword, search_volume, difficulty, intent, last_checked")
          .eq("tenant_id", TENANT)
          .order("search_volume", { ascending: false })
          .limit(50);
        setKeywords(data ?? []);
      }

      if (s === "rankings") {
        // Fetch rank_tracking rows with keyword text via join
        const { data: rtData } = await supabase
          .schema("seo")
          .from("rank_tracking")
          .select("id, keyword_id, position, device, location, checked_at")
          .eq("tenant_id", TENANT)
          .eq("device", "desktop")
          .order("checked_at", { ascending: false })
          .limit(50);

        if (rtData && rtData.length > 0) {
          // Get unique keyword IDs and fetch their text
          const kwIds = [...new Set(rtData.map((r: any) => r.keyword_id))];
          const { data: kwData } = await supabase
            .schema("seo")
            .from("keywords")
            .select("id, keyword")
            .eq("tenant_id", TENANT)
            .in("id", kwIds);

          const kwMap: Record<string, string> = {};
          (kwData ?? []).forEach((k: any) => { kwMap[k.id] = k.keyword; });

          setRankings(rtData.map((r: any) => ({
            id: r.id,
            keyword_id: r.keyword_id,
            position: r.position,
            device: r.device,
            location: r.location,
            checked_at: r.checked_at,
            keyword_text: kwMap[r.keyword_id] ?? "--",
          })));
        } else {
          setRankings([]);
        }
      }

      if (s === "googleads") {
        const { data } = await supabase
          .schema("analytics")
          .from("google_ads_keyword_data")
          .select("id, keyword, location, avg_monthly_searches, competition, cpc, pulled_at, pulled_month")
          .order("avg_monthly_searches", { ascending: false })
          .limit(100);
        setGoogleAds(data ?? []);
      }

      if (s === "workorders") {
        const { data } = await supabase
          .schema("deals")
          .from("work_orders")
          .select("id, client_name, business_name, email, phone, package, status, payment_status, total_amount, deposit_amount, monthly_amount, signed_at, paid_at, pdf_url, created_at")
          .order("created_at", { ascending: false })
          .limit(50);
        setWorkOrders(data ?? []);
      }

      if (s === "outreach") {
        const [qRes, lRes] = await Promise.all([
          supabase.schema("outreach").from("outreach_queue")
            .select("id, tenant_id, lead_id, status, attempts, planned_for, created_at")
            .order("created_at", { ascending: false }).limit(50),
          supabase.schema("outreach").from("outreach_log")
            .select("id, lead_id, email, subject, status, sent_at, created_at")
            .order("created_at", { ascending: false }).limit(50),
        ]);
        setOutreachQueue(qRes.data ?? []);
        setOutreachLog(lRes.data ?? []);
      }

      if (s === "competitors") {
        const { data } = await supabase
          .schema("intelligence")
          .from("seo_competitor_analysis")
          .select("*")
          .limit(50);
        setCompetitors(data ?? []);
      }

      if (s === "audit") {
        const { data } = await supabase
          .schema("intelligence")
          .from("website_audits")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        setAudits(data ?? []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const DELIVERABLE_CATS = [
    { id: "seo",       label: "SEO Deliverables",      items: ["Full SEO Audit Report (PDF)", "Keyword Research Sheet (Top 50-200)", "On-Page Optimization (titles, meta, H1s)", "Technical SEO Fixes (speed, indexing, schema)", "Google Search Console + Analytics Setup", "Monthly SEO Performance Report"] },
    { id: "website",   label: "Website Deliverables",  items: ["Website Build / Redesign", "Mobile Optimization", "Page Speed Optimization", "Conversion Landing Pages", "Lead Capture Forms", "CRM Integration (STARZ-OS)"] },
    { id: "ai",        label: "AI + Automation",       items: ["STARZ-OS CRM Setup", "Pipeline (Deals + Stages)", "Auto Follow-Up System (48h/72h)", "AI Response System (Steve)", "Lead Tracking System"] },
    { id: "analytics", label: "Analytics + Reporting", items: ["KPI Dashboard (STARZ-OS)", "Monthly Performance Report", "Lead Tracking", "Conversion Tracking"] },
    { id: "ads",       label: "Paid Ads (Premium)",    items: ["Google Ads Setup", "Meta Ads Campaigns", "Retargeting Setup", "Ad Creatives + Copy"] },
    { id: "voiceai",   label: "Voice AI (Premium)",    items: ["AI Calling System (Steve Voice)", "Lead Qualification Calls", "Appointment Booking Automation"] },
  ];

  const loadDeliverables = async (workOrderId: string) => {
    const { data } = await supabase.schema("deals").from("deliverables").select("*").eq("work_order_id", workOrderId);
    setDeliverables(data ?? []);
    return data ?? [];
  };

  const openWorkOrder = async (wo: WorkOrder) => {
    setSelectedWorkOrder(wo);
    const existing = await loadDeliverables(wo.id);
    if (existing.length === 0) {
      const rows = DELIVERABLE_CATS.flatMap(cat => cat.items.map(item => ({ work_order_id: wo.id, category: cat.id, title: item, status: "pending" })));
      await supabase.schema("deals").from("deliverables").insert(rows);
      await loadDeliverables(wo.id);
    }
  };

  const startDeliverable = async (id: string) => {
    await supabase.schema("deals").from("deliverables").update({ status: "in_progress" }).eq("id", id);
    if (selectedWorkOrder) loadDeliverables(selectedWorkOrder.id);
  };

  const completeDeliverable = async (id: string) => {
    await supabase.schema("deals").from("deliverables").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    if (selectedWorkOrder) loadDeliverables(selectedWorkOrder.id);
  };

  const saveProof = async (id: string) => {
    const url = proofInput[id];
    if (!url) return;
    await supabase.schema("deals").from("deliverables").update({ proof_value: url, proof_type: "url", status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    setProofInput(p => ({ ...p, [id]: "" }));
    if (selectedWorkOrder) loadDeliverables(selectedWorkOrder.id);
  };

  // Theme
  const bg = dark ? "#0a0a0f" : "#f4f4f8";
  const sidebarBg = dark ? "#0d0d14" : "#ffffff";
  const bdr = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const txt = dark ? "#ffffff" : "#0f0f1a";
  const txt2 = dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)";
  const txt3 = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)";
  const cardBg = dark ? "#111118" : "#ffffff";
  const navAC = dark ? "#818cf8" : "#4f46e5";
  const navABg = dark ? "rgba(99,102,241,0.12)" : "rgba(79,70,229,0.08)";
  const btnBdr = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";
  const divC = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const tagBg = dark ? "rgba(99,102,241,0.12)" : "rgba(79,70,229,0.08)";

  const NAV_SECTIONS = [
    { key: "workorders" as SeoSection, label: "Work Orders",     icon: "W" },
    { key: "googleads"  as SeoSection, label: "Google Ads",      icon: "G" },
    { key: "outreach"   as SeoSection, label: "Outreach",         icon: "E" },
    { key: "overview"   as SeoSection, label: "Overview",         icon: "O"  },
    { key: "docs"       as SeoSection, label: "API Docs",         icon: "?" },
    { key: "onboarding" as SeoSection, label: "Onboarding",       icon: "?" },
    { key: "sandbox"    as SeoSection, label: "Sandbox",          icon: "??" },
    { key: "backlinks"  as SeoSection, label: "Backlinks",        icon: "?" },
    { key: "keywords"   as SeoSection, label: "Keywords",         icon: "?" },
    { key: "rankings"   as SeoSection, label: "Rank Tracking",    icon: "?" },
    { key: "audit"      as SeoSection, label: "Site Audit",       icon: "?" },
    { key: "competitors"as SeoSection, label: "Competitors",      icon: "??" },
    { key: "domain"     as SeoSection, label: "Domain Authority", icon: "?" },
  ];

  if (!ready) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: txt3, fontFamily: "monospace", fontSize: 13 }}>LOADING DEVELOPER PORTAL...</p>
    </div>
  );

  const renderSection = () => {
    // ?? OVERVIEW ??????????????????????????????????????????????????????????????
    if (section === "overview") return (
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: txt, marginBottom: 8 }}>STARZ-OS Developer Portal</h2>
        <p style={{ fontSize: 14, color: txt2, marginBottom: 24, lineHeight: 1.7 }}>Access SEO tools, API documentation, sandbox environment and onboarding resources for building on top of STARZ-OS.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            {
              label: "Keywords tracked",
              value: loading ? "..." : overviewStats.keywordCount.toString(),
              color: "#34d399",
              sub: "in seo.keywords",
            },
            {
              label: "Backlink prospects",
              value: loading ? "..." : overviewStats.backlinkCount.toString(),
              color: navAC,
              sub: "in seo.backlink_prospects",
            },
            {
              label: "Avg. position",
              value: loading ? "..." : overviewStats.avgPosition !== null ? `#${overviewStats.avgPosition}` : "--",
              color: dark ? "#fbbf24" : "#d97706",
              sub: "desktop ? latest snapshot",
            },
          ].map(m => (
            <div key={m.label} style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 11, color: txt2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 12, color: txt3, marginTop: 4 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {[
            { title: "SEO Tools", desc: "Backlinks, keywords, rank tracking, site audit, competitor analysis and domain authority -- all powered by your Supabase data.", action: "backlinks" as SeoSection },
            { title: "API Docs", desc: "Interactive documentation for all STARZ-OS endpoints including outreach, pipeline, leads and SEO data APIs.", action: "docs" as SeoSection },
            { title: "Sandbox", desc: "Test API calls live in the browser. Query your SEO data, test outreach endpoints and explore the data model.", action: "sandbox" as SeoSection },
            { title: "Onboarding", desc: "Step by step guide for external developers to get started building on top of STARZ-OS in minutes.", action: "onboarding" as SeoSection },
          ].map(card => (
            <div key={card.title} onClick={() => setSection(card.action)}
              style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "20px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = navAC; el.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = bdr; el.style.transform = "translateY(0)"; }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: txt, marginBottom: 8 }}>{card.title}</div>
              <div style={{ fontSize: 13, color: txt2, lineHeight: 1.6 }}>{card.desc}</div>
              <div style={{ fontSize: 12, color: navAC, marginTop: 12 }}>Open {"->"}</div>
            </div>
          ))}
        </div>
      </div>
    );

    // ?? API DOCS ???????????????????????????????????????????????????????????????
    if (section === "docs") return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 20 }}>API Documentation</h2>
        {[
          { method: "POST", path: "/functions/v1/rank-tracking",      desc: "Snapshots SERP positions for all tenant keywords. Idempotent -- one row per keyword/device/day.", auth: "anon" },
          { method: "POST", path: "/functions/v1/outreach-engine",     desc: "Processes next pending outreach job. Steve AI generates personalized email and sends via Resend.", auth: "service_role" },
          { method: "POST", path: "/functions/v1/reply-webhook",       desc: "Receives inbound email replies from Resend. Parses intent and updates pipeline.", auth: "webhook_secret" },
          { method: "POST", path: "/functions/v1/steve-outreach-worker",desc: "CRON runner that processes outreach queue every minute.", auth: "service_role" },
          { method: "GET",  path: "/rest/v1/seo/keywords",             desc: "Returns SEO keywords with search volume, difficulty and intent.", auth: "authenticated" },
          { method: "GET",  path: "/rest/v1/seo/rank_tracking",        desc: "Returns keyword ranking history. Filter by device and location.", auth: "authenticated" },
          { method: "GET",  path: "/rest/v1/seo/backlink_prospects",   desc: "Returns backlink prospects with domain score and spam score.", auth: "authenticated" },
          { method: "GET",  path: "/rest/v1/pipeline",                 desc: "Returns all deals in the pipeline. Supports filtering by stage.", auth: "authenticated" },
        ].map((ep, i) => (
          <div key={i} style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "16px 20px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: ep.method === "POST" ? "rgba(251,191,36,0.12)" : "rgba(52,211,153,0.12)", color: ep.method === "POST" ? (dark ? "#fbbf24" : "#d97706") : (dark ? "#34d399" : "#059669") }}>{ep.method}</span>
              <code style={{ fontSize: 13, color: navAC, fontFamily: "monospace" }}>{ep.path}</code>
              <span style={{ marginLeft: "auto", fontSize: 11, color: txt3, background: tagBg, padding: "2px 8px", borderRadius: 20 }}>{ep.auth}</span>
            </div>
            <div style={{ fontSize: 13, color: txt2 }}>{ep.desc}</div>
          </div>
        ))}
      </div>
    );

    // ?? ONBOARDING ?????????????????????????????????????????????????????????????
    if (section === "onboarding") return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 20 }}>Developer Onboarding</h2>
        {[
          { step: 1, title: "Get your API keys", desc: "Contact admin@traffikboosters.com to request API access. You'll receive a Supabase anon key and service role key for your integration.", code: null },
          { step: 2, title: "Install the Supabase client", desc: "Install the official Supabase JavaScript client to connect to STARZ-OS data.", code: "npm install @supabase/supabase-js" },
          { step: 3, title: "Initialize the client", desc: "Create a Supabase client with the STARZ-OS project URL and your API key.", code: `import { createClient } from '@supabase/supabase-js'\nconst supabase = createClient(\n  'https://szguizvpiiuiyugrjeks.supabase.co',\n  'YOUR_ANON_KEY'\n)` },
          { step: 4, title: "Query SEO data", desc: "Access keywords and rank tracking data from the seo schema.", code: `const { data } = await supabase\n  .schema('seo')\n  .from('keywords')\n  .select('*')\n  .eq('tenant_id', 'YOUR_TENANT_ID')\n  .order('search_volume', { ascending: false })` },
          { step: 5, title: "Trigger rank tracking", desc: "Call the rank-tracking edge function to snapshot positions for all tracked keywords.", code: `const res = await fetch(\n  'https://szguizvpiiuiyugrjeks.supabase.co/functions/v1/rank-tracking',\n  { method: 'POST',\n    headers: { 'Authorization': 'Bearer YOUR_ANON_KEY',\n               'Content-Type': 'application/json' },\n    body: JSON.stringify({ device: 'desktop', location: 'us' })\n  }\n)` },
        ].map(step => (
          <div key={step.step} style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: navABg, border: `1px solid ${navAC}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: navAC }}>{step.step}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: txt, marginBottom: 6 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: txt2, marginBottom: step.code ? 10 : 0, lineHeight: 1.6 }}>{step.desc}</div>
              {step.code && (
                <pre style={{ background: dark ? "#0a0a14" : "#f0f0f8", border: `0.5px solid ${bdr}`, borderRadius: 8, padding: "12px 16px", fontSize: 12, color: dark ? "#a5b4fc" : "#4f46e5", fontFamily: "monospace", overflow: "auto", margin: 0, lineHeight: 1.6 }}>{step.code}</pre>
              )}
            </div>
          </div>
        ))}
      </div>
    );

    // ?? SANDBOX ????????????????????????????????????????????????????????????????
    if (section === "sandbox") return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 8 }}>API Sandbox</h2>
        <p style={{ fontSize: 13, color: txt2, marginBottom: 16 }}>Test queries against your live STARZ-OS data.</p>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: txt2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Quick queries</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Top keywords",    q: `SELECT keyword, search_volume, difficulty, intent FROM seo.keywords WHERE tenant_id = '${TENANT}' ORDER BY search_volume DESC LIMIT 10;` },
              { label: "Rank snapshots",  q: `SELECT rt.position, rt.device, rt.checked_at, k.keyword FROM seo.rank_tracking rt JOIN seo.keywords k ON k.id = rt.keyword_id WHERE rt.tenant_id = '${TENANT}' AND rt.device = 'desktop' ORDER BY rt.checked_at DESC LIMIT 10;` },
              { label: "Backlink prospects", q: `SELECT domain, url, score, spam_score FROM seo.backlink_prospects WHERE tenant_id = '${TENANT}' ORDER BY score DESC LIMIT 10;` },
              { label: "Outreach drafts", q: `SELECT prospect_id, approved_at, review_required FROM seo.outreach_drafts WHERE tenant_id = '${TENANT}' LIMIT 10;` },
            ].map(q => (
              <button key={q.label} onClick={() => setSandboxQuery(q.q)}
                style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, background: tagBg, color: navAC, border: `0.5px solid ${navAC}`, cursor: "pointer", fontFamily: "inherit" }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
        <textarea value={sandboxQuery} onChange={e => setSandboxQuery(e.target.value)}
          style={{ width: "100%", height: 100, background: dark ? "#0a0a14" : "#f0f0f8", border: `0.5px solid ${bdr}`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: dark ? "#a5b4fc" : "#4f46e5", fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }} />
        <button onClick={() => setSandboxResult("Direct SQL is not supported via the browser client.\n\nUse the Supabase SQL Editor for raw queries:\nhttps://supabase.com/dashboard/project/szguizvpiiuiyugrjeks/sql\n\nOr use the quick query buttons above to fetch live data via the JS client.")}
          style={{ marginTop: 8, padding: "8px 20px", borderRadius: 6, background: navAC, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>
          Run Query
        </button>
        {sandboxResult && (
          <pre style={{ marginTop: 12, background: dark ? "#0a0a14" : "#f0f0f8", border: `0.5px solid ${bdr}`, borderRadius: 8, padding: "12px 16px", fontSize: 12, color: txt2, fontFamily: "monospace", overflow: "auto", whiteSpace: "pre-wrap" }}>{sandboxResult}</pre>
        )}
      </div>
    );

    // ?? BACKLINKS ??????????????????????????????????????????????????????????????
    if (section === "backlinks") return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 4 }}>Backlink Prospects</h2>
        <p style={{ fontSize: 13, color: txt2, marginBottom: 16 }}>{backlinks.length} prospects found</p>
        {loading && <p style={{ color: txt3 }}>Loading...</p>}
        <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto auto", gap: 12, padding: "10px 16px", borderBottom: `0.5px solid ${divC}`, fontSize: 11, color: txt3, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <div>Domain</div><div>URL</div><div>Score</div><div>Spam</div>
          </div>
          {backlinks.length === 0 && !loading && (
            <p style={{ color: txt3, padding: "20px 16px", fontSize: 13 }}>No backlink prospects found.</p>
          )}
          {backlinks.map((bl, i) => (
            <div key={bl.id ?? i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto auto", gap: 12, padding: "10px 16px", borderBottom: i < backlinks.length - 1 ? `0.5px solid ${divC}` : "none", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: txt, fontWeight: 500 }}>{bl.domain ?? "--"}</div>
              <div style={{ fontSize: 12, color: txt2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{bl.url ?? "--"}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: navAC }}>{bl.score ?? "-"}</div>
              <div style={{ fontSize: 12, color: (bl.spam_score ?? 0) > 30 ? (dark ? "#f472b6" : "#db2777") : (dark ? "#34d399" : "#059669"), fontWeight: 500 }}>{bl.spam_score ?? "-"}</div>
            </div>
          ))}
        </div>
      </div>
    );

    // ?? KEYWORDS ???????????????????????????????????????????????????????????????
    if (section === "keywords") return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 4 }}>Keyword Tracking</h2>
        <p style={{ fontSize: 13, color: txt2, marginBottom: 16 }}>{keywords.length} keywords tracked</p>
        {loading && <p style={{ color: txt3 }}>Loading...</p>}
        <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr auto auto auto", gap: 12, padding: "10px 16px", borderBottom: `0.5px solid ${divC}`, fontSize: 11, color: txt3, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <div>Keyword</div><div>Volume</div><div>Difficulty</div><div>Intent</div>
          </div>
          {keywords.length === 0 && !loading && <p style={{ color: txt3, padding: "20px 16px", fontSize: 13 }}>No keywords found.</p>}
          {keywords.map((kw, i) => (
            <div key={kw.id ?? i} style={{ display: "grid", gridTemplateColumns: "2fr auto auto auto", gap: 12, padding: "10px 16px", borderBottom: i < keywords.length - 1 ? `0.5px solid ${divC}` : "none", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: txt, fontWeight: 500 }}>{kw.keyword ?? "--"}</div>
              <div style={{ fontSize: 12, color: navAC, fontWeight: 600 }}>{kw.search_volume?.toLocaleString() ?? "-"}</div>
              <div style={{ fontSize: 12, color: kw.difficulty && kw.difficulty > 70 ? (dark ? "#f472b6" : "#db2777") : kw.difficulty && kw.difficulty > 40 ? (dark ? "#fbbf24" : "#d97706") : (dark ? "#34d399" : "#059669"), fontWeight: 600 }}>{kw.difficulty ?? "-"}</div>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: kw.intent === "transactional" ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.1)", color: kw.intent === "transactional" ? (dark ? "#34d399" : "#059669") : txt2 }}>{kw.intent ?? "--"}</span>
            </div>
          ))}
        </div>
      </div>
    );

    // ?? RANK TRACKING ??????????????????????????????????????????????????????????
    if (section === "rankings") return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 4 }}>Rank Tracking</h2>
        <p style={{ fontSize: 13, color: txt2, marginBottom: 16 }}>{rankings.length} ranking records -- desktop ? latest</p>
        {loading && <p style={{ color: txt3 }}>Loading...</p>}
        <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr auto auto auto", gap: 12, padding: "10px 16px", borderBottom: `0.5px solid ${divC}`, fontSize: 11, color: txt3, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <div>Keyword</div><div>Position</div><div>Location</div><div>Checked</div>
          </div>
          {rankings.length === 0 && !loading && <p style={{ color: txt3, padding: "20px 16px", fontSize: 13 }}>No rank tracking data found.</p>}
          {rankings.map((r, i) => (
            <div key={r.id ?? i} style={{ display: "grid", gridTemplateColumns: "2fr auto auto auto", gap: 12, padding: "10px 16px", borderBottom: i < rankings.length - 1 ? `0.5px solid ${divC}` : "none", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: txt, fontWeight: 500 }}>{r.keyword_text ?? "--"}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: r.position && r.position <= 3 ? navAC : r.position && r.position <= 10 ? (dark ? "#34d399" : "#059669") : (dark ? "#fbbf24" : "#d97706") }}>#{r.position ?? "--"}</div>
              <div style={{ fontSize: 12, color: txt2 }}>{r.location ?? "us"}</div>
              <div style={{ fontSize: 11, color: txt3 }}>{r.checked_at ? new Date(r.checked_at).toLocaleDateString() : "--"}</div>
            </div>
          ))}
        </div>
      </div>
    );

    // ?? COMPETITORS ????????????????????????????????????????????????????????????
    if (section === "competitors") return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 4 }}>Competitor Analysis</h2>
        <p style={{ fontSize: 13, color: txt2, marginBottom: 16 }}>{competitors.length} competitors tracked</p>
        {loading && <p style={{ color: txt3 }}>Loading...</p>}
        <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
          {competitors.length === 0 && !loading && <p style={{ color: txt3, padding: "20px 16px", fontSize: 13 }}>No competitor data found.</p>}
          {competitors.map((c, i) => (
            <div key={c.id ?? i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: i < competitors.length - 1 ? `0.5px solid ${divC}` : "none" }}>
              <div style={{ fontSize: 13, color: txt, fontWeight: 500 }}>{c.competitor_domain ?? "Unknown"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80, height: 4, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${c.overlap_score ?? 0}%`, height: "100%", background: navAC, borderRadius: 2 }}></div>
                </div>
                <div style={{ fontSize: 12, color: navAC, fontWeight: 600, width: 40, textAlign: "right" }}>{c.overlap_score ?? 0}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    // ?? AUDIT ??????????????????????????????????????????????????????????????????
    if (section === "audit") return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 4 }}>Site Audit</h2>
        <p style={{ fontSize: 13, color: txt2, marginBottom: 16 }}>{audits.length} audit records</p>
        {loading && <p style={{ color: txt3 }}>Loading...</p>}
        <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
          {audits.length === 0 && !loading && <p style={{ color: txt3, padding: "20px 16px", fontSize: 13 }}>No audit data found.</p>}
          {audits.map((a, i) => (
            <div key={a.id ?? i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: i < audits.length - 1 ? `0.5px solid ${divC}` : "none" }}>
              <div style={{ fontSize: 13, color: txt, fontWeight: 500 }}>{a.url ?? "Unknown URL"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {a.issues !== null && <span style={{ fontSize: 12, color: dark ? "#f472b6" : "#db2777" }}>{a.issues} issues</span>}
                <div style={{ fontSize: 14, fontWeight: 700, color: a.score && a.score >= 80 ? (dark ? "#34d399" : "#059669") : a.score && a.score >= 50 ? (dark ? "#fbbf24" : "#d97706") : (dark ? "#f472b6" : "#db2777") }}>{a.score ?? "-"}/100</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    // ?? DOMAIN AUTHORITY ???????????????????????????????????????????????????????
    if (section === "domain") return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 8 }}>Domain Authority</h2>
        <p style={{ fontSize: 13, color: txt2, marginBottom: 20 }}>Domain scores pulled from your backlink prospects.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Avg. prospect score", value: backlinks.length > 0 ? Math.round(backlinks.reduce((a, b) => a + (b.score ?? 0), 0) / backlinks.length) : "--", color: navAC },
            { label: "High score (80+)",    value: backlinks.filter(b => (b.score ?? 0) >= 80).length, color: dark ? "#34d399" : "#059669" },
            { label: "Total prospects",     value: backlinks.length, color: dark ? "#fbbf24" : "#d97706" },
          ].map(m => (
            <div key={m.label} style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 11, color: txt2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ fontSize: 12, color: txt2, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: 14 }}>Score Distribution</div>
          {[
            { label: "Score 90-100", min: 90, max: 100, color: "#34d399" },
            { label: "Score 70-89",  min: 70, max: 89,  color: "#818cf8" },
            { label: "Score 50-69",  min: 50, max: 69,  color: "#fbbf24" },
            { label: "Score 30-49",  min: 30, max: 49,  color: "#f472b6" },
            { label: "Score 0-29",   min: 0,  max: 29,  color: "#94a3b8" },
          ].map(range => {
            const count = backlinks.filter(b => (b.score ?? 0) >= range.min && (b.score ?? 0) <= range.max).length;
            const pct = backlinks.length > 0 ? Math.round((count / backlinks.length) * 100) : 0;
            return (
              <div key={range.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: txt2, width: 90, flexShrink: 0 }}>{range.label}</div>
                <div style={{ flex: 1, height: 6, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: range.color, borderRadius: 3 }}></div>
                </div>
                <div style={{ fontSize: 12, color: txt3, width: 40, textAlign: "right" }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    );

    // -- GOOGLE ADS --
    if (section === "googleads") {
      const totalKeywords = googleAds.length;
      const avgCpc = googleAds.length > 0 ? (googleAds.reduce((a, b) => a + (b.cpc ?? 0), 0) / googleAds.length).toFixed(2) : "0.00";
      const avgVolume = googleAds.length > 0 ? Math.round(googleAds.reduce((a, b) => a + (b.avg_monthly_searches ?? 0), 0) / googleAds.length) : 0;
      const highComp = googleAds.filter(k => k.competition === "HIGH").length;

      return (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 4 }}>Google Ads Keywords</h2>
          <p style={{ fontSize: 13, color: txt2, marginBottom: 20 }}>Keyword data from analytics.google_ads_keyword_data</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Keywords", value: totalKeywords, color: navAC },
              { label: "Avg. Monthly Searches", value: avgVolume.toLocaleString(), color: dark ? "#34d399" : "#059669" },
              { label: "Avg. CPC", value: "$" + avgCpc, color: dark ? "#fbbf24" : "#d97706" },
              { label: "High Competition", value: highComp, color: dark ? "#f472b6" : "#db2777" },
            ].map(m => (
              <div key={m.label} style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, color: txt2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
              </div>
            ))}
          </div>

          {loading && <p style={{ color: txt3 }}>Loading...</p>}
          <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr auto auto auto auto", gap: 12, padding: "10px 16px", borderBottom: `0.5px solid ${divC}`, fontSize: 11, color: txt3, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              <div>Keyword</div><div>Location</div><div>Searches/mo</div><div>CPC</div><div>Competition</div>
            </div>
            {googleAds.length === 0 && !loading && <p style={{ color: txt3, padding: "20px 16px", fontSize: 13 }}>No Google Ads data found.</p>}
            {googleAds.map((k, i) => (
              <div key={k.id ?? i} style={{ display: "grid", gridTemplateColumns: "2fr auto auto auto auto", gap: 12, padding: "10px 16px", borderBottom: i < googleAds.length - 1 ? `0.5px solid ${divC}` : "none", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: txt, fontWeight: 500 }}>{k.keyword ?? "--"}</div>
                <div style={{ fontSize: 12, color: txt2 }}>{k.location ?? "US"}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: navAC }}>{k.avg_monthly_searches?.toLocaleString() ?? "-"}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: dark ? "#fbbf24" : "#d97706" }}>${k.cpc?.toFixed(2) ?? "-"}</div>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                  background: k.competition === "HIGH" ? "rgba(244,114,182,0.12)" : k.competition === "MEDIUM" ? "rgba(251,191,36,0.12)" : "rgba(52,211,153,0.12)",
                  color: k.competition === "HIGH" ? (dark ? "#f472b6" : "#db2777") : k.competition === "MEDIUM" ? (dark ? "#fbbf24" : "#d97706") : (dark ? "#34d399" : "#059669"),
                }}>{k.competition ?? "--"}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // -- OUTREACH --
    if (section === "outreach") {
      const pending = outreachQueue.filter(q => q.status === "pending").length;
      const processing = outreachQueue.filter(q => q.status === "processing").length;
      const sent = outreachQueue.filter(q => q.status === "sent").length;
      const failed = outreachQueue.filter(q => q.status === "failed").length;

      return (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 4 }}>Outreach Fulfillment</h2>
          <p style={{ fontSize: 13, color: txt2, marginBottom: 20 }}>Email queue and send log via Resend</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Pending",    value: pending,    color: dark ? "#fbbf24" : "#d97706" },
              { label: "Processing", value: processing, color: navAC },
              { label: "Sent",       value: sent,       color: dark ? "#34d399" : "#059669" },
              { label: "Failed",     value: failed,     color: dark ? "#f472b6" : "#db2777" },
            ].map(m => (
              <div key={m.label} style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, color: txt2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: txt, marginBottom: 10 }}>Outreach Queue</div>
          {loading && <p style={{ color: txt3 }}>Loading...</p>}
          <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 12, padding: "10px 16px", borderBottom: `0.5px solid ${divC}`, fontSize: 11, color: txt3, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              <div>ID</div><div>Lead</div><div>Status</div><div>Attempts</div><div>Planned</div>
            </div>
            {outreachQueue.length === 0 && !loading && <p style={{ color: txt3, padding: "20px 16px", fontSize: 13 }}>No queue items found.</p>}
            {outreachQueue.map((q, i) => (
              <div key={q.id ?? i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 12, padding: "10px 16px", borderBottom: i < outreachQueue.length - 1 ? `0.5px solid ${divC}` : "none", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: txt3, fontFamily: "monospace" }}>#{q.id}</div>
                <div style={{ fontSize: 12, color: txt, fontWeight: 500 }}>{q.lead_id ? q.lead_id.substring(0, 8) + "..." : "--"}</div>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                  background: q.status === "sent" ? "rgba(52,211,153,0.12)" : q.status === "failed" ? "rgba(244,114,182,0.12)" : q.status === "processing" ? "rgba(129,140,248,0.12)" : "rgba(251,191,36,0.12)",
                  color: q.status === "sent" ? (dark ? "#34d399" : "#059669") : q.status === "failed" ? (dark ? "#f472b6" : "#db2777") : q.status === "processing" ? navAC : (dark ? "#fbbf24" : "#d97706"),
                }}>{q.status ?? "--"}</span>
                <div style={{ fontSize: 12, color: txt2, textAlign: "center" }}>{q.attempts ?? 0}</div>
                <div style={{ fontSize: 11, color: txt3 }}>{q.planned_for ? new Date(q.planned_for).toLocaleDateString() : "--"}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: txt, marginBottom: 10 }}>Send Log</div>
          <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr auto auto", gap: 12, padding: "10px 16px", borderBottom: `0.5px solid ${divC}`, fontSize: 11, color: txt3, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              <div>Email</div><div>Subject</div><div>Status</div><div>Sent</div>
            </div>
            {outreachLog.length === 0 && !loading && <p style={{ color: txt3, padding: "20px 16px", fontSize: 13 }}>No send log entries found.</p>}
            {outreachLog.map((l, i) => (
              <div key={l.id ?? i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr auto auto", gap: 12, padding: "10px 16px", borderBottom: i < outreachLog.length - 1 ? `0.5px solid ${divC}` : "none", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: txt, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.email ?? "--"}</div>
                <div style={{ fontSize: 12, color: txt2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.subject ?? "--"}</div>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 20,
                  background: l.status === "sent" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
                  color: l.status === "sent" ? (dark ? "#34d399" : "#059669") : (dark ? "#fbbf24" : "#d97706"),
                }}>{l.status ?? "--"}</span>
                <div style={{ fontSize: 11, color: txt3 }}>{l.sent_at ? new Date(l.sent_at).toLocaleDateString() : "--"}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // -- WORK ORDERS FULFILLMENT PANEL --
    if (section === "workorders") {

      if (selectedWorkOrder) {
        const wo = selectedWorkOrder;
        const completed = deliverables.filter(d => d.status === "completed").length;
        const inProgress = deliverables.filter(d => d.status === "in_progress").length;
        const total = deliverables.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        return (
          <div>
            <button onClick={() => { setSelectedWorkOrder(null); setDeliverables([]); }}
              style={{ fontSize: 12, color: navAC, background: "transparent", border: "none", cursor: "pointer", marginBottom: 16, fontFamily: "inherit", padding: 0 }}>
              {"<-"} Back to Work Orders
            </button>

            {/* Project Header */}
            <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: txt, marginBottom: 4 }}>{wo.business_name ?? wo.client_name ?? "Unknown"}</div>
                  <div style={{ fontSize: 13, color: txt2 }}>{wo.client_name} | {wo.email}</div>
                </div>
                <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, fontWeight: 600, background: wo.payment_status === "paid" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)", color: wo.payment_status === "paid" ? (dark ? "#34d399" : "#059669") : (dark ? "#fbbf24" : "#d97706") }}>
                  {wo.payment_status ?? "unknown"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
                {[
                  { label: "Package",  value: wo.package ?? "--" },
                  { label: "Total",    value: wo.total_amount ? "$" + wo.total_amount.toLocaleString() : "--" },
                  { label: "Paid At",  value: wo.paid_at ? new Date(wo.paid_at).toLocaleDateString() : "--" },
                  { label: "Progress", value: pct + "%" },
                ].map(m => (
                  <div key={m.label} style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, color: txt3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: txt }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div style={{ height: 6, background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", background: pct === 100 ? (dark ? "#34d399" : "#059669") : navAC, borderRadius: 3, transition: "width 0.5s" }}></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: txt3 }}>
                <span>{completed} of {total} completed</span>
                <span>{inProgress} in progress</span>
              </div>
              {wo.pdf_url && (
                <a href={wo.pdf_url} target="_blank" rel="noreferrer"
                  style={{ display: "inline-block", marginTop: 12, fontSize: 12, color: navAC, textDecoration: "none", background: dark ? "rgba(99,102,241,0.1)" : "rgba(79,70,229,0.08)", padding: "6px 14px", borderRadius: 6 }}>
                  View Contract PDF
                </a>
              )}
            </div>

            {/* Deliverable Tracker */}
            <div style={{ fontSize: 14, fontWeight: 700, color: txt, marginBottom: 14 }}>Deliverable Tracker</div>
            {DELIVERABLE_CATS.map(cat => {
              const catItems = deliverables.filter(d => d.category === cat.id);
              const catDone = catItems.filter(d => d.status === "completed").length;
              return (
                <div key={cat.id} style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ padding: "12px 18px", borderBottom: `0.5px solid ${divC}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: navAC, textTransform: "uppercase", letterSpacing: "0.07em" }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: txt3 }}>{catDone}/{catItems.length} done</div>
                  </div>
                  {catItems.map((d, i) => (
                    <div key={d.id} style={{ padding: "12px 18px", borderBottom: i < catItems.length - 1 ? `0.5px solid ${divC}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: d.proof_value || proofInput[d.id] !== undefined ? 8 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: d.status === "completed" ? (dark ? "#34d399" : "#059669") : d.status === "in_progress" ? navAC : (dark ? "#fbbf24" : "#d97706") }}></div>
                          <div style={{ fontSize: 13, color: txt, fontWeight: 500 }}>{d.title}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: d.status === "completed" ? "rgba(52,211,153,0.12)" : d.status === "in_progress" ? "rgba(99,102,241,0.12)" : "rgba(251,191,36,0.12)", color: d.status === "completed" ? (dark ? "#34d399" : "#059669") : d.status === "in_progress" ? navAC : (dark ? "#fbbf24" : "#d97706") }}>
                            {d.status === "in_progress" ? "In Progress" : d.status === "completed" ? "Completed" : "Pending"}
                          </span>
                          {d.status === "pending" && (
                            <button onClick={() => startDeliverable(d.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: navAC, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Start</button>
                          )}
                          {d.status === "in_progress" && (
                            <button onClick={() => completeDeliverable(d.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "transparent", color: dark ? "#34d399" : "#059669", border: `0.5px solid ${dark ? "#34d399" : "#059669"}`, cursor: "pointer", fontFamily: "inherit" }}>Complete</button>
                          )}
                          {d.status !== "completed" && (
                            <button onClick={() => setProofInput(p => ({ ...p, [d.id]: p[d.id] === undefined ? "" : undefined as any }))}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "transparent", color: txt2, border: `0.5px solid ${bdr}`, cursor: "pointer", fontFamily: "inherit" }}>
                              + Proof
                            </button>
                          )}
                          {d.proof_value && (
                            <a href={d.proof_value} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: navAC, textDecoration: "none" }}>View Proof</a>
                          )}
                        </div>
                      </div>
                      {proofInput[d.id] !== undefined && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                            <input value={proofInput[d.id]} onChange={e => setProofInput(p => ({ ...p, [d.id]: e.target.value }))}
                              placeholder="Paste URL or proof link..."
                              style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `0.5px solid ${bdr}`, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: txt, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                            <button onClick={() => saveProof(d.id)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6, background: navAC, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Save URL</button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <label style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: txt2, border: `0.5px solid ${bdr}`, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                              {uploadingProof[d.id] ? "Uploading..." : "Upload File (PDF/Image)"}
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display: "none" }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) uploadProofFile(d.id, f); }} />
                            </label>
                            <span style={{ fontSize: 11, color: txt3 }}>PDF, PNG, JPG supported</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Activity Timeline */}
            <div style={{ fontSize: 14, fontWeight: 700, color: txt, marginBottom: 14, marginTop: 20 }}>Activity Timeline</div>
            <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "16px 20px" }}>
              {[
                ...deliverables.filter(d => d.completed_at).map(d => ({ time: new Date(d.completed_at!).toLocaleString(), event: d.title + " -- Completed", color: dark ? "#34d399" : "#059669" })),
                ...[],
                { time: wo.paid_at ? new Date(wo.paid_at).toLocaleString() : "--", event: "Payment confirmed -- Work order activated", color: dark ? "#34d399" : "#059669" },
                { time: wo.created_at ? new Date(wo.created_at).toLocaleString() : "--", event: "Work order created by sales", color: txt2 },
              ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10).map((entry, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0, marginTop: 4 }}></div>
                  <div>
                    <div style={{ fontSize: 12, color: txt, fontWeight: 500 }}>{entry.event}</div>
                    <div style={{ fontSize: 11, color: txt3, marginTop: 2 }}>{entry.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Work Orders List
      return (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 4 }}>Work Orders</h2>
          <p style={{ fontSize: 13, color: txt2, marginBottom: 20 }}>Assigned fulfillment tasks -- execution only, no client contact</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Orders",   value: workOrders.length,                                               color: navAC },
              { label: "Paid + Active",  value: workOrders.filter(w => w.payment_status === "paid").length,      color: dark ? "#34d399" : "#059669" },
              { label: "Pending Setup",  value: workOrders.filter(w => w.payment_status !== "paid").length,      color: dark ? "#fbbf24" : "#d97706" },
            ].map(m => (
              <div key={m.label} style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, color: txt2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
              </div>
            ))}
          </div>

          {loading && <p style={{ color: txt3 }}>Loading...</p>}
          {workOrders.length === 0 && !loading && (
            <div style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "40px 20px", textAlign: "center" }}>
              <p style={{ color: txt3, fontSize: 13 }}>No work orders assigned yet. Rico will assign work orders after payment is confirmed.</p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {workOrders.map(wo => (
              <div key={wo.id}
                onClick={() => openWorkOrder(wo)}
                style={{ background: cardBg, border: `0.5px solid ${bdr}`, borderRadius: 10, padding: "16px 20px", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = navAC; el.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = bdr; el.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: txt, marginBottom: 4 }}>{wo.business_name ?? wo.client_name ?? "Unknown Business"}</div>
                    <div style={{ fontSize: 12, color: txt2 }}>{wo.client_name} | {wo.package ?? "No package"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {wo.total_amount && <div style={{ fontSize: 14, fontWeight: 700, color: navAC }}>${wo.total_amount.toLocaleString()}</div>}
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                      background: wo.payment_status === "paid" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
                      color: wo.payment_status === "paid" ? (dark ? "#34d399" : "#059669") : (dark ? "#fbbf24" : "#d97706") }}>
                      {wo.payment_status ?? "pending"}
                    </span>
                    <div style={{ fontSize: 12, color: navAC, fontWeight: 500 }}>Open {"->"}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["SEO", "Website", "AI/Automation", "Lead Gen", "Analytics"].map(tag => (
                    <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: txt3 }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", fontFamily: "'Inter',-apple-system,sans-serif" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: `0.5px solid ${bdr}`, background: sidebarBg, position: "sticky", top: 0, zIndex: 10 }}>
        {!logoErr
          ? <img src={LOGO} alt="STARZ-OS" height={32} style={{ objectFit: "contain", maxWidth: 140 }} onError={() => setLogoErr(true)} />
          : <span style={{ fontSize: 16, fontWeight: 700, color: txt }}>? STARZ-OS</span>
        }
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: navAC, background: tagBg, padding: "4px 12px", borderRadius: 20 }}>Developer Portal</span>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 13, color: txt2, border: `0.5px solid ${btnBdr}`, background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>? Dashboard</button>
          <button onClick={toggle} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 13, color: txt2, border: `0.5px solid ${btnBdr}`, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
            {dark ? "?? Light" : "? Dark"}
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* SIDEBAR */}
        <div style={{ width: 220, background: sidebarBg, borderRight: `0.5px solid ${bdr}`, padding: "20px 12px", flexShrink: 0, position: "sticky", top: 57, height: "calc(100vh - 57px)", overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: txt3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, paddingLeft: 8 }}>Navigation</div>
          {NAV_SECTIONS.map(({ key, label, icon }) => (
            <div key={key} onClick={() => setSection(key)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, marginBottom: 2, cursor: "pointer", fontSize: 13, color: section === key ? navAC : txt2, background: section === key ? navABg : "transparent", transition: "all 0.15s" }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </div>
          ))}
          <div style={{ borderTop: `0.5px solid ${bdr}`, marginTop: 16, paddingTop: 16 }}>
            <div style={{ fontSize: 10, color: txt3, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, paddingLeft: 8 }}>Resources</div>
            <a href="https://supabase.com/docs" target="_blank" rel="noreferrer"
              style={{ display: "block", padding: "8px 10px", borderRadius: 6, fontSize: 13, color: txt2, textDecoration: "none", marginBottom: 2 }}>
              Supabase Docs {"->"}
            </a>
            <a href="https://docs.anthropic.com" target="_blank" rel="noreferrer"
              style={{ display: "block", padding: "8px 10px", borderRadius: 6, fontSize: 13, color: txt2, textDecoration: "none" }}>
              Anthropic Docs {"->"}
            </a>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
