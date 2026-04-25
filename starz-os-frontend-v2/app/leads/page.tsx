"use client"
import { useEffect, useState } from "react"
import { AIAccessGovernor } from "@/components/AIAccessGovernor"
import { SecureWatermark } from "@/components/SecureWatermark"
import { StatCard, LoadingGrid, SectionHeader, Badge } from "@/components/DashboardCards"
import { DataTable } from "@/components/DataTable"
import { fetchLeadsSecure } from "@/lib/supabase"

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(()=>{fetchLeadsSecure(200).catch(()=>[]).then(setLeads).finally(()=>setLoading(false))},[])

  const statuses = ["all","new","contacted","qualified","disqualified"]
  const displayed = filter==="all"?leads:leads.filter(l=>String(l.status??"").toLowerCase()===filter)

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 space-y-8">
      <AIAccessGovernor/>
      <SecureWatermark/>
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-3">
        <span className="text-xl">ðŸ”’</span>
        <div><p className="text-amber-300 font-semibold text-sm">Secure Lead Intelligence â€” Restricted View</p><p className="text-slate-400 text-xs">All access logged Â· Copy disabled Â· No export available</p></div>
      </div>
      <SectionHeader title="ðŸ‘ï¸ Lead Intelligence" sub="Secure view â€” monitored and logged"/>
      {loading?<LoadingGrid/>:<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Leads" value={leads.length} accent="blue" icon="ðŸŽ¯"/>
          <StatCard label="Qualified" value={leads.filter((l:any)=>l.status==="qualified").length} accent="green" icon="âœ…"/>
          <StatCard label="High Priority" value={leads.filter((l:any)=>l.priority_level==="high").length} accent="red" icon="ðŸ”¥"/>
          <StatCard label="View Mode" value="READ ONLY" accent="amber" icon="ðŸ”’"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s=><button key={s} onClick={()=>setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize ${filter===s?"bg-blue-500/20 border-blue-500/50 text-blue-300":"border-slate-700 text-slate-400"}`}>{s} ({s==="all"?leads.length:leads.filter(l=>String(l.status??"").toLowerCase()===s).length})</button>)}
        </div>
        <DataTable secure columns={[{key:"name",label:"Name"},{key:"business_name",label:"Business"},{key:"industry",label:"Industry"},{key:"status",label:"Status",render:v=><Badge label={String(v??"â€”")} variant={v==="qualified"?"success":v==="disqualified"?"danger":"neutral"}/>},{key:"priority_level",label:"Priority",render:v=><Badge label={String(v??"â€”")} variant={v==="high"?"danger":v==="medium"?"warn":"neutral"}/>},{key:"lead_score",label:"Score"},{key:"close_probability",label:"Close %",render:v=>v?`${(Number(v)*100).toFixed(0)}%`:"â€”"},{key:"intent",label:"Intent"},{key:"assigned_to",label:"Assigned"}]} rows={displayed} emptyMessage="No leads"/>
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 text-center">
          <p className="text-slate-500 text-sm">ðŸ“Š Need stats? Go to <a href="/stats" className="text-blue-400 underline">/stats</a> for the safe export page.</p>
        </div>
      </>}
    </main>
  )
}