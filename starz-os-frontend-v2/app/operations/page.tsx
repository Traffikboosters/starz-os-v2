"use client"
import { useEffect, useState } from "react"
import { StatCard, LoadingGrid, SectionHeader, Badge } from "@/components/DashboardCards"
import { DataTable } from "@/components/DataTable"
import { fetchWorkOrders } from "@/lib/supabase"

export default function OperationsPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{fetchWorkOrders(100).catch(()=>[]).then(setWorkOrders).finally(()=>setLoading(false))},[])

  const active = workOrders.filter(w=>!["completed","cancelled"].includes(String(w.status??"").toLowerCase()))
  const paid = workOrders.filter(w=>w.payment_status==="paid")
  const totalVal = workOrders.reduce((s,w)=>s+(Number(w.total_amount)||0),0)

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 space-y-8">
      <SectionHeader title="âš™ï¸ Operations Dashboard" sub="Work orders Â· Fulfillment Â· Delivery"/>
      {loading?<LoadingGrid/>:<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Orders" value={workOrders.length} accent="blue" icon="ðŸ“‹"/>
          <StatCard label="Active" value={active.length} accent="amber" icon="ðŸ”„"/>
          <StatCard label="Paid" value={paid.length} accent="green" icon="âœ…"/>
          <StatCard label="Total Value" value={`$${(totalVal/1000).toFixed(1)}K`} accent="green" icon="ðŸ’°"/>
        </div>
        <div><h2 className="text-lg font-semibold text-slate-200 mb-3">Work Orders</h2>
          <DataTable columns={[{key:"client_name",label:"Client"},{key:"service_type",label:"Service"},{key:"status",label:"Status",render:v=><Badge label={String(v??"â€”")} variant={v==="active"?"info":v==="completed"?"success":"neutral"}/>},{key:"fulfillment_status",label:"Fulfillment",render:v=><Badge label={String(v??"â€”")} variant="neutral"/>},{key:"total_amount",label:"Amount",render:v=>v?`$${Number(v).toLocaleString()}`:"â€”"},{key:"payment_status",label:"Payment",render:v=><Badge label={String(v??"â€”")} variant={v==="paid"?"success":"warn"}/>},{key:"created_at",label:"Created",render:v=>new Date(String(v)).toLocaleDateString()}]} rows={workOrders} emptyMessage="No work orders"/>
        </div>
      </>}
    </main>
  )
}