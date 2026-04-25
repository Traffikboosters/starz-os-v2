"use client"
import { useEffect, useState } from "react"
import { StatCard, LoadingGrid, SectionHeader, Badge } from "@/components/DashboardCards"
import { DataTable } from "@/components/DataTable"
import { fetchSafeStats } from "@/lib/supabase"

export default function StatsPage() {
  const [stats, setStats] = useState<{kpis:any[],revenue:any[]}>({kpis:[],revenue:[]})
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [msg, setMsg] = useState<string|null>(null)

  useEffect(()=>{fetchSafeStats().catch(()=>({kpis:[],revenue:[]})).then(setStats).finally(()=>setLoading(false))},[])

  const handleExport = async () => {
    setExporting(true); setMsg(null)
    try {
      const res = await fetch("/api/export/stats")
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href=url; a.download=`starz-stats-${new Date().toISOString().split("T")[0]}.json`; a.click()
      URL.revokeObjectURL(url); setMsg("âœ… Exported successfully")
    } catch(e) { setMsg(`âŒ Export failed: ${e}`) } finally { setExporting(false) }
  }

  const totalRev = stats.revenue.reduce((s,r)=>s+(Number(r.revenue)||0),0)
  const k = stats.kpis[0]??{}

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 space-y-8">
      <div className="flex items-center justify-between">
        <SectionHeader title="ðŸ“Š Stats & Reports" sub="Aggregate metrics â€” safe to export Â· No lead PII"/>
        <button onClick={handleExport} disabled={exporting||loading} className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm">
          {exporting?"â³ Exporting...":"â¬‡ï¸ Export Stats"}
        </button>
      </div>
      {msg&&<div className={`rounded-xl border p-4 text-sm ${msg.startsWith("âœ…")?"border-emerald-500/30 bg-emerald-500/10 text-emerald-300":"border-red-500/30 bg-red-500/10 text-red-300"}`}>{msg}</div>}
      {loading?<LoadingGrid/>:<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Revenue 30d" value={`$${(totalRev/1000).toFixed(1)}K`} accent="green" icon="ðŸ’°"/>
          <StatCard label="Deals Closed" value={String(k.deals_closed??"â€”")} accent="blue" icon="ðŸ¤"/>
          <StatCard label="Close Rate" value={k.close_rate?`${(Number(k.close_rate)*100).toFixed(1)}%`:"â€”"} accent="purple" icon="ðŸ“ˆ"/>
          <StatCard label="Revenue/Deal" value={k.revenue_per_deal?`$${Number(k.revenue_per_deal).toLocaleString()}`:"â€”"} accent="amber" icon="ðŸ’Ž"/>
        </div>
        <div><h2 className="text-lg font-semibold text-slate-200 mb-3">KPI Trend</h2>
          <DataTable columns={[{key:"kpi_date",label:"Date"},{key:"leads_contacted",label:"Contacted"},{key:"deals_closed",label:"Deals"},{key:"revenue_generated",label:"Revenue",render:v=>v?`$${Number(v).toLocaleString()}`:"â€”"},{key:"close_rate",label:"Close %",render:v=>v?`${(Number(v)*100).toFixed(1)}%`:"â€”"}]} rows={stats.kpis}/>
        </div>
        <div><h2 className="text-lg font-semibold text-slate-200 mb-3">Daily Revenue</h2>
          <DataTable columns={[{key:"date",label:"Date"},{key:"revenue",label:"Revenue",render:v=>`$${Number(v).toLocaleString()}`}]} rows={stats.revenue}/>
        </div>
      </>}
    </main>
  )
}