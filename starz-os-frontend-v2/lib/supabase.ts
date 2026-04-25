import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchExecSnapshot() {
  const { data, error } = await (supabase as any).schema("analytics").from("exec_dashboard_snapshots").select("*").order("captured_at", { ascending: false }).limit(1).single()
  if (error) throw error
  return data
}
export async function fetchDailyRevenue(days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0]
  const { data, error } = await (supabase as any).schema("analytics").from("daily_revenue").select("*").gte("date", since).order("date", { ascending: true })
  if (error) throw error
  return data ?? []
}
export async function fetchSteveKPIs() {
  const { data, error } = await (supabase as any).schema("analytics").from("steve_kpis_daily").select("*").order("kpi_date", { ascending: false }).limit(7)
  if (error) throw error
  return data ?? []
}
export async function fetchPipeline() {
  const { data, error } = await (supabase as any).schema("deals").from("pipeline").select("id,name,stage,value,company,close_probability,assigned_to,updated_at").order("updated_at", { ascending: false }).limit(200)
  if (error) throw error
  return data ?? []
}
export async function fetchDialerCalls(limit = 50) {
  const { data, error } = await (supabase as any).schema("dialer").from("calls").select("id,phone_number,call_status,duration,sentiment,ai_tip,started_at,deal_heat_score").order("created_at", { ascending: false }).limit(limit)
  if (error) throw error
  return data ?? []
}
export async function fetchLeadsSecure(limit = 200) {
  const { data, error } = await (supabase as any).schema("crm").from("leads").select("id,name,business_name,industry,status,lead_score,close_probability,priority_level,intent,next_best_action,assigned_to,last_activity_at,revenue_tier,tier").order("lead_score", { ascending: false }).limit(limit)
  if (error) throw error
  return data ?? []
}
export async function fetchWorkOrders(limit = 100) {
  const { data, error } = await (supabase as any).schema("deals").from("work_orders").select("id,client_name,business_name,status,fulfillment_status,service_type,department,total_amount,payment_status,created_at").order("created_at", { ascending: false }).limit(limit)
  if (error) throw error
  return data ?? []
}
export async function fetchLeadMetrics() {
  const { data, error } = await (supabase as any).schema("analytics").from("lead_metrics_daily_2026_04").select("*").order("date", { ascending: false }).limit(14)
  if (error) throw error
  return data ?? []
}
export async function fetchCampaigns() {
  const { data, error } = await (supabase as any).schema("outreach").from("campaigns").select("*").order("created_at", { ascending: false }).limit(20)
  if (error) throw error
  return data ?? []
}
export async function fetchAccessEvents(limit = 50) {
  const { data, error } = await (supabase as any).schema("security").from("access_events").select("*").order("created_at", { ascending: false }).limit(limit)
  if (error) throw error
  return data ?? []
}
export async function fetchViolations() {
  const { data, error } = await (supabase as any).schema("security").from("violations").select("*").order("last_seen_at", { ascending: false }).limit(30)
  if (error) throw error
  return data ?? []
}
export async function fetchSafeStats() {
  const [kpis, revenue] = await Promise.all([
    (supabase as any).schema("analytics").from("steve_kpis_daily").select("kpi_date,deals_closed,revenue_generated,close_rate,calls_booked,proposals_sent").order("kpi_date", { ascending: false }).limit(30),
    (supabase as any).schema("analytics").from("daily_revenue").select("date,revenue").order("date", { ascending: false }).limit(30),
  ])
  return { kpis: kpis.data ?? [], revenue: revenue.data ?? [] }
}