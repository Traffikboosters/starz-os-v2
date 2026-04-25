import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth:{ persistSession:false } })
  const [kpis, revenue] = await Promise.all([
    (supabase as any).schema("analytics").from("steve_kpis_daily").select("kpi_date,deals_closed,revenue_generated,close_rate").order("kpi_date",{ascending:false}).limit(30),
    (supabase as any).schema("analytics").from("daily_revenue").select("date,revenue").order("date",{ascending:false}).limit(30),
  ])
  const payload = { exported_at:new Date().toISOString(), contains_pii:false, data:{ kpis:kpis.data??[], revenue:revenue.data??[] } }
  return new NextResponse(JSON.stringify(payload,null,2), { headers:{ "Content-Type":"application/json","Content-Disposition":`attachment; filename="starz-stats-${new Date().toISOString().split("T")[0]}.json"` } })
}