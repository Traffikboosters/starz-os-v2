"use client";

import { useEffect, useState } from "react";
import { getWorkOrders, updateWorkOrderStatus, getStatusColor, getPaymentStatusColor, type WorkOrder } from "@/lib/workOrders";

const STATUS_OPTIONS = ["probation", "active", "paused", "fulfilled", "cancelled"];

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filtered, setFiltered] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getWorkOrders();
      setWorkOrders(data);
      setFiltered(data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let result = workOrders;
    if (statusFilter !== "all") result = result.filter((wo) => wo.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((wo) => wo.client_name?.toLowerCase().includes(q) || wo.business_name?.toLowerCase().includes(q) || wo.email?.toLowerCase().includes(q) || wo.proposal_id?.toLowerCase().includes(q) || wo.service?.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [search, statusFilter, workOrders]);

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdating(true);
    const ok = await updateWorkOrderStatus(id, newStatus);
    if (ok) {
      setWorkOrders((prev) => prev.map((wo) => (wo.id === id ? { ...wo, status: newStatus } : wo)));
      if (selected?.id === id) setSelected((s) => s ? { ...s, status: newStatus } : s);
    }
    setUpdating(false);
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatCurrency(n: number | null) {
    if (n == null) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Work Orders</h1>
        <p className="text-gray-400 text-sm mt-1">All active client engagements</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {["all", ...STATUS_OPTIONS].map((s) => {
          const count = s === "all" ? workOrders.length : workOrders.filter((wo) => wo.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)} className={"rounded-lg p-3 text-center border transition-all " + (statusFilter === s ? "border-orange-500 bg-orange-500/10" : "border-gray-800 bg-gray-900 hover:border-gray-600")}>
              <div className="text-xl font-bold">{count}</div>
              <div className="text-xs text-gray-400 capitalize">{s}</div>
            </button>
          );
        })}
      </div>
      <div className="mb-4">
        <input type="text" placeholder="Search by client, email, proposal ID, or service..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
      </div>
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading work orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No work orders found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">Proposal ID</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Start</th>
                <th className="px-4 py-3 text-left">Due</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-900/50 cursor-pointer transition-colors" onClick={() => setSelected(wo)}>
                  <td className="px-4 py-3"><div className="font-medium text-white">{wo.business_name || wo.client_name}</div><div className="text-gray-500 text-xs">{wo.email}</div></td>
                  <td className="px-4 py-3 text-gray-300">{wo.service || wo.service_type || "—"}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{wo.proposal_id || "—"}</td>
                  <td className="px-4 py-3"><span className={"px-2 py-1 rounded-full text-xs font-medium capitalize " + getStatusColor(wo.status)}>{wo.status || "unknown"}</span></td>
                  <td className="px-4 py-3"><span className={"px-2 py-1 rounded-full text-xs font-medium capitalize " + getPaymentStatusColor(wo.payment_status)}>{wo.payment_status || "—"}</span></td>
                  <td className="px-4 py-3 text-gray-300">{formatCurrency(wo.total_amount)}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(wo.production_released_at)}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(wo.clearance_ends_at)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><select value={wo.status || ""} onChange={(e) => handleStatusChange(wo.id, e.target.value)} disabled={updating} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500">{STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}</select></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-xl bg-gray-900 border-l border-gray-700 h-full overflow-y-auto p-6 z-10">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h2 className="text-lg font-bold mb-1">{selected.business_name || selected.client_name}</h2>
            <p className="text-gray-400 text-sm mb-6">{selected.customer_email}</p>
            <div className="space-y-4">
              <Section label="Engagement"><Row label="Proposal ID" value={selected.proposal_id} mono /><Row label="Service" value={selected.service || selected.project_type} /><Row label="Package" value={selected.service_package} /><Row label="Status" value={selected.status} badge color={getStatusColor(selected.status)} /><Row label="Status Detail" value={selected.status_detail} /></Section>
              <Section label="Financials"><Row label="Total" value={formatCurrency(selected.total_amount)} /><Row label="Deposit" value={formatCurrency(selected.deposit_amount)} /><Row label="Installment" value={formatCurrency(selected.installment_amount)} /><Row label="Billing Cycle" value={selected.billing_cycle} /><Row label="Payment Status" value={selected.payment_status} badge color={getPaymentStatusColor(selected.payment_status)} /></Section>
              <Section label="Timeline"><Row label="Start" value={formatDate(selected.start_date)} /><Row label="Due" value={formatDate(selected.due_date)} /><Row label="Submitted" value={formatDate(selected.submitted_at)} /><Row label="Deployed" value={formatDate(selected.deployed_at)} /><Row label="Fulfilled" value={formatDate(selected.fulfilled_at)} /><Row label="Created" value={formatDate(selected.created_at)} /></Section>
              <Section label="Contact"><Row label="Phone" value={selected.customer_phone} /></Section>
              {selected.contract_url && (<a href={selected.contract_url} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 text-sm font-medium mt-4">View Contract ↗</a>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wider">{label}</h3><div className="bg-gray-800/50 rounded-lg divide-y divide-gray-700/50">{children}</div></div>);
}

function Row({ label, value, mono, badge, color }: { label: string; value: string | null | undefined; mono?: boolean; badge?: boolean; color?: string; }) {
  if (!value) return null;
  return (<div className="flex justify-between items-center px-3 py-2 text-sm"><span className="text-gray-400">{label}</span>{badge ? (<span className={"px-2 py-0.5 rounded-full text-xs font-medium capitalize " + color}>{value}</span>) : (<span className={"text-white " + (mono ? "font-mono text-xs" : "")}>{value}</span>)}</div>);
}