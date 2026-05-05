import { useEffect, useState, useCallback } from 'react'
import { db } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  business_name: string
  email: string
  phone?: string
  website?: string
  status: string
  score?: number
  source?: string
  assigned_to?: string
  created_at: string
  city?: string
  state?: string
  industry?: string
}

export interface Deal {
  id: string
  business_name?: string
  client_name?: string
  stage: string
  value?: number
  amount?: number
  assigned_to?: string
  rep_name?: string
  created_at: string
  updated_at?: string
  service_type?: string
  probability?: number
}

export interface WorkOrder {
  id: string
  client_name?: string
  service_type?: string
  status: string
  amount?: number
  assigned_to?: string
  created_at: string
  due_date?: string
  progress?: number
}

export interface CallRecord {
  id: string
  lead_id?: string
  phone_number?: string
  status: string
  direction?: string
  duration?: number
  created_at: string
  rep_name?: string
}

// ─── Dashboard KPI Hook ───────────────────────────────────────────────────────

export function useDashboardKPIs() {
  const [data, setData] = useState({
    totalLeads: 0,
    activeDeals: 0,
    pipelineValue: 0,
    workOrders: 0,
    leadsToday: 0,
    closedDeals: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsRes, dealsRes, ordersRes] = await Promise.all([
        db.crm.from('leads').select('id, status, created_at, business_name, company_name', { count: 'exact' }).limit(1000),
        db.deals.from('pipeline').select('id, stage, value, estimated_value, created_at, company, lead_name, assigned_to', { count: 'exact' }).limit(1000),
        db.rico.from('work_orders').select('id, status', { count: 'exact' }).limit(500),
      ])

      const leads = leadsRes.data || []
      const deals = dealsRes.data || []
      const orders = ordersRes.data || []

      const today = new Date().toISOString().split('T')[0]
      const leadsToday = leads.filter(l => l.created_at?.startsWith(today)).length
      const closedDeals = deals.filter(d =>
        ['closed', 'closed_won', 'won', 'Closed Won'].includes(d.stage)
      ).length
      const pipelineValue = deals.reduce((sum, d) => sum + (d.estimated_value || d.value || 0), 0)

      setData({
        totalLeads: leadsRes.count || leads.length,
        activeDeals: dealsRes.count || deals.length,
        pipelineValue,
        workOrders: orders.filter(o => o.status === 'active' || o.status === 'in_progress').length,
        leadsToday,
        closedDeals,
      })
    } catch (err) {
      console.error('KPI fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, refetch: fetch }
}

// ─── Leads Hook ───────────────────────────────────────────────────────────────

export function useLeads(limit = 100) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error, count: total } = await db.crm
        .from('leads')
        .select('id, business_name, company_name, contact_name, name, email, phone, status, score, industry, created_at, updated_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      setLeads(data || [])
      setCount(total || 0)
    } catch (err) {
      console.error('Leads fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => { fetch() }, [fetch])
  return { leads, loading, count, refetch: fetch }
}

// ─── Pipeline / Deals Hook ────────────────────────────────────────────────────

export function useDeals(limit = 200) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await db.deals
        .from('pipeline')
        .select('id, stage, value, estimated_value, company, lead_name, lead_email, assigned_to, owner_name, service, created_at, updated_at, ai_score, monthly_revenue_estimate')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      setDeals(data || [])
    } catch (err) {
      console.error('Deals fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => { fetch() }, [fetch])
  return { deals, loading, refetch: fetch }
}

// ─── Work Orders Hook ─────────────────────────────────────────────────────────

export function useWorkOrders() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await db.rico
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Work orders fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { orders, loading, refetch: fetch }
}

// ─── Call Queue Hook ──────────────────────────────────────────────────────────

export function useCallQueue() {
  const [queue, setQueue] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await db.dialer
        .from('call_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setQueue(data || [])
    } catch (err) {
      console.error('Call queue fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { queue, loading, refetch: fetch }
}

// ─── SEO Data Hook ────────────────────────────────────────────────────────────

export function useSEOData() {
  const [keywords, setKeywords] = useState<any[]>([])
  const [serpData, setSerpData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [kwRes, serpRes] = await Promise.all([
        db.seo.from('keywords').select('*').order('created_at', { ascending: false }).limit(50),
        db.seo.from('serp_data').select('*').order('checked_at', { ascending: false }).limit(50),
      ])
      setKeywords(kwRes.data || [])
      setSerpData(serpRes.data || [])
    } catch (err) {
      console.error('SEO data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { keywords, serpData, loading, refetch: fetch }
}

// ─── Proposals Hook ───────────────────────────────────────────────────────────

export function useProposals() {
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await db.deals
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setProposals(data || [])
    } catch (err) {
      console.error('Proposals fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { proposals, loading, refetch: fetch }
}

// ─── Security Log Hook ────────────────────────────────────────────────────────

export function useSecurityLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, alertsRes] = await Promise.allSettled([
        db.security.from('access_log').select('*').order('created_at', { ascending: false }).limit(50),
        db.security.from('alerts').select('*').order('created_at', { ascending: false }).limit(20),
      ])
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data || [])
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data || [])
    } catch (err) {
      console.error('Security fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { logs, alerts, loading, refetch: fetch }
}

// ─── Realtime subscription helper ────────────────────────────────────────────

export function useRealtimeLeads(onInsert: (lead: Lead) => void) {
  useEffect(() => {
    const channel = db.crm
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'crm', table: 'leads' }, (payload) => {
        onInsert(payload.new as Lead)
      })
      .subscribe()

    return () => { db.crm.removeChannel(channel) }
  }, [onInsert])
}

// ─── AI Learning Log Hook ─────────────────────────────────────────────────────

export function useAILearning() {
  const [patterns, setPatterns] = useState<any[]>([])
  const [learningLog, setLearningLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [patternsRes, logRes] = await Promise.allSettled([
        db.ai.from('v_steve_patterns').select('*').limit(20),
        db.ai.from('learning_log').select('*').order('created_at', { ascending: false }).limit(50),
      ])
      if (patternsRes.status === 'fulfilled') setPatterns(patternsRes.value.data || [])
      if (logRes.status === 'fulfilled') setLearningLog(logRes.value.data || [])
    } catch (err) {
      console.error('AI fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { patterns, learningLog, loading, refetch: fetch }
}

// ─── Sales Performance Hook ───────────────────────────────────────────────────

export function useSalesPerformance() {
  const [repPerformance, setRepPerformance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await db.sales
        .from('v_rep_performance')
        .select('*')
        .limit(20)

      if (!error) setRepPerformance(data || [])
    } catch (err) {
      console.error('Sales performance fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { repPerformance, loading, refetch: fetch }
}
