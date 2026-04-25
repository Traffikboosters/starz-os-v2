"use client"
import { useEffect, useState } from "react"
import { StatCard, LoadingGrid, SectionHeader, Badge } from "@/components/DashboardCards"
import { DataTable } from "@/components/DataTable"
import { fetchDailyRevenue, fetchSteveKPIs, fetchAccessEvents } from "@/lib/supabase"

export default function ExecutivePage() {
  const [revenue, setRevenue] = useState<any[]>([])
  const [kpis, setKPIs] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchDailyRevenue(30).catch(()=>[]), fetchSteveKPIs().catch(()=>[]), fetchAccessEvents(10).catch(()=>[])]).then(([r,k,a])=>{setRevenue(r);setKPIs(k);setAlerts(a.filter((e:any)=>e.severity==="critical"))}).finally(()=>setLoading(false))
  }, [])

  const totalRev = revenue.reduce((s,r)=>s+(Number(r.revenue)||0),0)
  const k = kpis[0]??{}
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 space-y-8">
      <SectionHeader title="âš¡ Executive Dashboard" sub="Real-time business intelligence Â· STARZ-OS" />
      {loading?<LoadingGrid count={6}/>:<>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Revenue 30d" value={`$${(totalRev/1000).toFixed(1)}K`} accent="green" icon="ðŸ’°"/>
          <StatCard label="Deals Closed" value={String(k.deals_closed??"â€”")} accent="blue" icon="ðŸ¤"/>
          <StatCard label="Leads Contacted" value={String(k.leads_contacted??"â€”")} accent="purple" icon="ðŸ“¡"/>
          <StatCard label="Calls Booked" value={String(k.calls_booked??"â€”")} accent="amber" icon="ðŸ“ž"/>
          <StatCard label="Proposals" value={String(k.proposals_sent??"â€”")} accent="blue" icon="ðŸ“‹"/>
          <StatCard label="Security Alerts" value={alerts.length} accent={alerts.length>0?"red":"green"} icon="ðŸ”’"/>
        </div>
        <div><h2 className="text-lg font-semibold text-slate-200 mb-3">KPI Trend (7 Days)</h2>
          <DataTable columns={[{key:"kpi_date",label:"Date"},{key:"leads_qualified",label:"Qualified"},{key:"calls_booked",label:"Calls"},{key:"deals_closed",label:"Deals"},{key:"revenue_generated",label:"Revenue",render:v=>v?`$${Number(v).toLocaleString()}`:"â€”"},{key:"close_rate",label:"Close %",render:v=>v?`${(Number(v)*100).toFixed(1)}%`:"â€”"}]} rows={kpis}/>
        </div>
        {alerts.length>0&&<div><h2 className="text-lg font-semibold text-red-400 mb-3">ðŸš¨ Critical Events</h2>
          <DataTable columns={[{key:"created_at",label:"Time",render:v=>new Date(String(v)).toLocaleString()},{key:"event_type",label:"Event"},{key:"actor_role",label:"Role"},{key:"resource_table",label:"Table"},{key:"severity",label:"Severity",render:v=><Badge label={String(v)} variant="danger"/>}]} rows={alerts}/>
        </div>}
      </>}
    </main>
  )
}