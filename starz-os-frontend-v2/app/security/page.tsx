"use client"
import { useEffect, useState } from "react"
import { StatCard, LoadingGrid, SectionHeader, Badge } from "@/components/DashboardCards"
import { DataTable } from "@/components/DataTable"
import { fetchAccessEvents, fetchViolations } from "@/lib/supabase"

export default function SecurityPage() {
  const [events, setEvents] = useState<any[]>([])
  const [violations, setViolations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{Promise.all([fetchAccessEvents(50).catch(()=>[]),fetchViolations().catch(()=>[])]).then(([e,v])=>{setEvents(e);setViolations(v)}).finally(()=>setLoading(false))},[])

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 space-y-8">
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5"><SectionHeader title="ðŸ” Security Command Center" sub="Access violations Â· Risk events Â· Incident response"/></div>
      {loading?<LoadingGrid/>:<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Critical Events" value={events.filter(e=>e.severity==="critical").length} accent={events.filter(e=>e.severity==="critical").length>0?"red":"green"} icon="ðŸš¨"/>
          <StatCard label="High Severity" value={events.filter(e=>e.severity==="high").length} accent="amber" icon="âš ï¸"/>
          <StatCard label="Violations" value={violations.length} accent={violations.length>0?"red":"green"} icon="â›”"/>
          <StatCard label="Total Events" value={events.length} accent="blue" icon="ðŸ“"/>
        </div>
        {violations.length>0&&<div><h2 className="text-lg font-semibold text-red-400 mb-3">Active Violations</h2>
          <DataTable columns={[{key:"last_seen_at",label:"Last Seen",render:v=>new Date(String(v)).toLocaleString()},{key:"category",label:"Category"},{key:"subject",label:"Subject"},{key:"severity",label:"Severity",render:v=><Badge label={String(v)} variant="danger"/>},{key:"occurrence_count",label:"Count"}]} rows={violations}/>
        </div>}
        <div><h2 className="text-lg font-semibold text-slate-200 mb-3">Access Event Log</h2>
          <DataTable columns={[{key:"created_at",label:"Time",render:v=>new Date(String(v)).toLocaleString()},{key:"event_type",label:"Event"},{key:"actor_role",label:"Role"},{key:"resource_schema",label:"Schema"},{key:"resource_table",label:"Table"},{key:"severity",label:"Severity",render:v=><Badge label={String(v??"info")} variant={v==="critical"?"danger":v==="high"?"warn":"neutral"}/>}]} rows={events}/>
        </div>
      </>}
    </main>
  )
}