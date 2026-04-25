"use client"
import { useEffect, useState } from "react"
import { StatCard, LoadingGrid, SectionHeader, Badge } from "@/components/DashboardCards"
import { DataTable } from "@/components/DataTable"
import { fetchLeadMetrics, fetchCampaigns, fetchLeadsSecure } from "@/lib/supabase"

export default function MarketingPage() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{Promise.all([fetchLeadMetrics().catch(()=>[]),fetchCampaigns().catch(()=>[]),fetchLeadsSecure(500).catch(()=>[])]).then(([m,c,l])=>{setMetrics(m);setCampaigns(c);setLeads(l)}).finally(()=>setLoading(false))},[])

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 space-y-8">
      <SectionHeader title="ðŸ“£ Marketing Dashboard" sub="Lead generation Â· Campaigns Â· Funnel metrics"/>
      {loading?<LoadingGrid/>:<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Leads" value={leads.length} accent="blue" icon="ðŸŽ¯"/>
          <StatCard label="Assigned" value={leads.filter((l:any)=>l.assigned_to).length} accent="green" icon="âœ…"/>
          <StatCard label="Unassigned" value={leads.filter((l:any)=>!l.assigned_to).length} accent="amber" icon="â³"/>
          <StatCard label="Campaigns" value={campaigns.length} accent="purple" icon="ðŸ“£"/>
        </div>
        <div><h2 className="text-lg font-semibold text-slate-200 mb-3">Lead Funnel (14 Days)</h2>
          <DataTable columns={[{key:"date",label:"Date"},{key:"leads_created",label:"Created"},{key:"leads_contacted",label:"Contacted"},{key:"calls_completed",label:"Calls"},{key:"deals_closed",label:"Deals"},{key:"conversion_rate",label:"CVR",render:v=>v?`${Number(v).toFixed(1)}%`:"â€”"}]} rows={metrics}/>
        </div>
        <div><h2 className="text-lg font-semibold text-slate-200 mb-3">Campaigns</h2>
          <DataTable columns={[{key:"name",label:"Campaign"},{key:"offer_name",label:"Offer"},{key:"status",label:"Status",render:v=><Badge label={String(v)} variant={v==="active"?"success":"neutral"}/>},{key:"daily_limit",label:"Daily Limit"}]} rows={campaigns} emptyMessage="No campaigns"/>
        </div>
      </>}
    </main>
  )
}