"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Lead } from "@/lib/leads";

const supabase = getSupabaseBrowserClient();
const STATUS_OPTIONS = ["all", "new", "contacted", "qualified", "won", "lost"];

export default function LeadsClient({
  initialLeads, initialError, initialCount, initialPage,
  initialQ, initialStatus, pageSize,
}: {
  initialLeads: Lead[]; initialError: string | null; initialCount: number;
  initialPage: number; initialQ: string; initialStatus: string; pageSize: number;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("CONNECTING");
  const [qInput, setQInput] = useState(initialQ);
  const [statusInput, setStatusInput] = useState(initialStatus);
  const page = initialPage;
  const totalPages = Math.max(Math.ceil(initialCount / pageSize), 1);
  const isMountedRef = useRef(true);
  const fetchInFlightRef = useRef(false);
  const queuedRefetchRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = useCallback((next: { q?: string; status?: string; page?: number }) => {
    const params = new URLSearchParams();
    const nextQ = (next.q ?? qInput).trim();
    const nextStatus = (next.status ?? statusInput).trim();
    const nextPage = next.page ?? page;
    if (nextQ) params.set("q", nextQ);
    if (nextStatus && nextStatus !== "all") params.set("status", nextStatus);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/leads${params.toString() ? `?${params.toString()}` : ""}`;
  }, [page, qInput, statusInput]);

  const refreshFromServer = useCallback(async () => {
    if (fetchInFlightRef.current) { queuedRefetchRef.current = true; return; }
    fetchInFlightRef.current = true;
    setLoading(true);
    setErrorMsg(null);
    router.refresh();
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setLoading(false);
      fetchInFlightRef.current = false;
      if (queuedRefetchRef.current) { queuedRefetchRef.current = false; refreshFromServer(); }
    }, 250);
  }, [router]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) return;
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      refreshFromServer();
    }, 250);
  }, [refreshFromServer]);

  const runSearch = useCallback(() => { router.push(buildUrl({ page: 1 })); }, [router, buildUrl]);
  const goToPage = useCallback((nextPage: number) => { router.push(buildUrl({ page: nextPage })); }, [router, buildUrl]);

  const addLead = useCallback(async () => {
    setErrorMsg(null);
    const { error } = await supabase.from("leads").insert([{
      name: "Test Lead",
      business_name: "Test Company",
      status: "new",
      score: 50,
      revenue_tier: "over_5k",
    }]);
    if (error) { setErrorMsg(error.message); return; }
    await refreshFromServer();
  }, [refreshFromServer]);

  const autoAssign = useCallback(async (id: string) => {
    setErrorMsg(null);
    const { error } = await supabase.rpc("assign_best_fit_lead_guarded", {
      p_prospect_id: id,
      p_daily_cap: 20,
      p_load_penalty: 0.2,
      p_fairness_boost: 0.1,
    });
    if (error) { setErrorMsg(error.message); return; }
    await refreshFromServer();
  }, [refreshFromServer]);

  useEffect(() => {
    setLeads(initialLeads);
    setErrorMsg(initialError);
    setQInput(initialQ);
    setStatusInput(initialStatus);
  }, [initialLeads, initialError, initialQ, initialStatus]);

  useEffect(() => {
    isMountedRef.current = true;
    const channel = supabase
      .channel("leads-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => scheduleRefresh())
      .subscribe((status) => setRealtimeStatus(status));
    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [scheduleRefresh]);

  const rows = useMemo(() => leads.map((lead) => (
    <tr key={lead.id}>
      <td>{lead.name || "—"}</td>
      <td>{lead.company || "—"}</td>
      <td>{lead.score ?? "—"}</td>
      <td>{lead.status || "—"}</td>
      <td>{lead.estimated_value ?? "—"}</td>
      <td>{lead.assigned_rep_id || "Unassigned"}</td>
      <td>{lead.updated_at ? new Date(lead.updated_at).toLocaleString() : "—"}</td>
      <td><button onClick={() => autoAssign(lead.id as string)}>Assign</button></td>
    </tr>
  )), [leads, autoAssign]);

  return (
    <div style={{ padding: 20 }}>
      <h1>STARZ-OS Leads</h1>
      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={addLead}>Add Lead</button>
        <button onClick={() => refreshFromServer()}>Refresh</button>
        <input placeholder="Search name/company" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        <select value={statusInput} onChange={(e) => setStatusInput(e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={runSearch}>Apply</button>
      </div>
      <p style={{ fontSize: 12, margin: "8px 0" }}>Realtime: <strong>{realtimeStatus}</strong></p>
      {errorMsg && <p style={{ color: "crimson" }}>Error: {errorMsg}</p>}
      {loading && <p>Refreshing...</p>}
      <table border={1} cellPadding={10} style={{ width: "100%" }}>
        <thead>
          <tr><th>Name</th><th>Company</th><th>Score</th><th>Status</th><th>Value</th><th>Assigned</th><th>Updated</th><th>Action</th></tr>
        </thead>
        <tbody>
          {leads.length === 0
            ? <tr><td colSpan={8} style={{ textAlign: "center" }}>No leads found</td></tr>
            : rows}
        </tbody>
      </table>
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <button disabled={page <= 1} onClick={() => goToPage(page - 1)}>Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
