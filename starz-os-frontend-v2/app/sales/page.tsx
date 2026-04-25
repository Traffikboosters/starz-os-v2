"use client"
import { useEffect, useState } from "react"
import { StatCard, LoadingGrid, SectionHeader, Badge } from "@/components/DashboardCards"
import { DataTable } from "@/components/DataTable"
import { fetchPipeline, fetchDialerCalls } from "@/lib/supabase"

const stageBadge = (s:string) => { const m:Record<string,any>={won:"success",closing:"warn",proposal:"info",lost:"danger"};return <Badge label={s??"â€”"} variant={m[s?.toLowerCase()]??"neutral"}/> }

export default function SalesPage() {
  const [pipeline, setPipeline] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState("all")

  useEffect(()=>{Promise.all([fetchPipeline().catch(()=>[]),fetchDialerCalls(30).catch(()=>[])]).then(([p,c])=>{setPipeline(p);setCalls(c)}).finally(()=>setLoading(false))},[])

  const stages = ["new","contacted","proposal","closing","won","lost"]
  const displayed = stage==="all"?pipeline:pipeline.filter(p=>String(p.stage??"").toLowerCase()===stage)
  const totalVal = pipeline.reduce((s,p)=>s+(Number(p.value)||0),0)

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 space-y-8">
      <SectionHeader title="ðŸ“ž Sales Dashboard" sub="Live pipeline Â· Call floor Â· Lead intelligence"/>
      {loading?<LoadingGrid/>:<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pipeline Value" value={`$${(totalVal/1000).toFixed(1)}K`} accent="green" icon="ðŸ’¼"/>
          <StatCard label="Total Deals" value={pipeline.length} accent="blue" icon="ðŸ”„"/>
          <StatCard label="Won" value={pipeline.filter(p=>p.stage?.toLowerCase()==="won").length} accent="green" icon="ðŸ†"/>
          <StatCard label="Live Calls" value={calls.filter(c=>c.call_status==="active").length} accent="amber" icon="ðŸŽ™ï¸"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all",...stages].map(s=><button key={s} onClick={()=>setStage(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize ${stage===s?"bg-blue-500/20 border-blue-500/50 text-blue-300":"border-slate-700 text-slate-400"}`}>{s} ({s==="all"?pipeline.length:pipeline.filter(p=>p.stage?.toLowerCase()===s).length})</button>)}
        </div>
        <div><h2 className="text-lg font-semibold text-slate-200 mb-3">Pipeline</h2>
          <DataTable secure columns={[{key:"name",label:"Deal"},{key:"company",label:"Company"},{key:"stage",label:"Stage",render:v=>stageBadge(String(v))},{key:"value",label:"Value",render:v=>v?`$${Number(v).toLocaleString()}`:"â€”"},{key:"close_probability",label:"Close %",render:v=>v?`${(Number(v)*100).toFixed(0)}%`:"â€”"},{key:"assigned_to",label:"Assigned"}]} rows={displayed} emptyMessage="No deals"/>
        </div>
        <div><h2 className="text-lg font-semibold text-slate-200 mb-3">Recent Calls</h2>
          <DataTable columns={[{key:"started_at",label:"Time",render:v=>v?new Date(String(v)).toLocaleString():"â€”"},{key:"phone_number",label:"Number"},{key:"call_status",label:"Status",render:v=><Badge label={String(v??"â€”")} variant={v==="completed"?"success":v==="active"?"warn":"neutral"}/>},{key:"duration",label:"Duration",render:v=>v?`${v}s`:"â€”"},{key:"sentiment",label:"Sentiment"},{key:"deal_heat_score",label:"Heat"}]} rows={calls}/>
        </div>
      </>}
    </main>
  )
}