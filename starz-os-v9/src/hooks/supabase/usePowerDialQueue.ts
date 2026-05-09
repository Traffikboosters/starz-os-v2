import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface DialLead {
  id: string
  lead_db_id: string
  name: string
  company: string
  source: string
  score: number
  status: 'hot' | 'warm' | 'cool' | 'cold'
  time: string
  value: number
  phone: string
  email: string
  industry: string
  urgency_score: number
  heat_tier: string
  close_probability: number
  ai_next_action: string
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'recently'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

function scoreToStatus(score: number): 'hot' | 'warm' | 'cool' | 'cold' {
  if (score >= 80) return 'hot'
  if (score >= 60) return 'warm'
  if (score >= 40) return 'cool'
  return 'cold'
}

export function usePowerDialQueue(limit = 25) {
  const [queue, setQueue] = useState<DialLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQueue = async () => {
    setLoading(true)
    setError(null)
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
      const url = `${SUPABASE_URL}/rest/v1/leads?select=id,name,contact_name,company_name,source,phone,email,industry,revenue_estimate,estimated_revenue,close_probability,ai_score,lead_score,score,next_best_action,last_activity_at,last_contacted_at,created_at,status&order=ai_score.desc.nullslast&limit=${limit}`
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept-Profile': 'crm',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      const leads = await res.json()
      if (!leads?.length) { setQueue([]); setLoading(false); return }
      const leadIds = leads.map((l: any) => l.id).join(',')
      let urgencyMap: Record<string, any> = {}
      let heatMap: Record<string, any> = {}
      try {
        const ur = await fetch(`${SUPABASE_URL}/rest/v1/lead_urgency?select=lead_id,urgency_score,urgency_tier&lead_id=in.(${leadIds})`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Accept-Profile': 'crm' }
        })
        if (ur.ok) { const d = await ur.json(); d?.forEach((u: any) => { urgencyMap[u.lead_id] = u }) }
      } catch { }
      try {
        const hr = await fetch(`${SUPABASE_URL}/rest/v1/lead_engagement_heat?select=lead_id,heat_tier,heat_score&lead_id=in.(${leadIds})`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Accept-Profile': 'crm' }
        })
        if (hr.ok) { const d = await hr.json(); d?.forEach((h: any) => { heatMap[h.lead_id] = h }) }
      } catch { }
      const mapped: DialLead[] = leads.map((l: any, i: number) => {
        const u = urgencyMap[l.id]
        const score = Math.min(Math.round(l.ai_score || l.lead_score || l.score || 0), 100)
        const heatTier = heatMap[l.id]?.heat_tier || scoreToStatus(score)
        return {
          id: `L-${String(9000 + i).padStart(4, '0')}`,
          lead_db_id: l.id,
          name: l.contact_name || l.name || 'Unknown',
          company: l.company_name || l.name || 'Unknown Company',
          source: l.source || 'Inbound',
          score,
          status: scoreToStatus(score),
          time: timeAgo(l.last_activity_at || l.last_contacted_at || l.created_at),
          value: Math.round(l.estimated_revenue || l.revenue_estimate || 0),
          phone: l.phone || '',
          email: l.email || '',
          industry: l.industry || '',
          urgency_score: u?.urgency_score || score,
          heat_tier: heatTier,
          close_probability: l.close_probability || 0,
          ai_next_action: l.next_best_action || 'Call and qualify',
        }
      })
      mapped.sort((a, b) => b.urgency_score - a.urgency_score)
      setQueue(mapped)
    } catch (err: any) {
      console.error('PowerDial queue error:', err)
      setError(err.message || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
    const channel = supabase.channel('powerdial-urgency')
      .on('postgres_changes', { event: '*', schema: 'crm', table: 'lead_urgency' }, () => fetchQueue())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return { queue, loading, error, refresh: fetchQueue }
}