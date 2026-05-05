import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Search, Phone, Mail, RefreshCw, Target, Star,
  UserPlus, Download, Zap, Shield, TrendingUp, AlertCircle,
  ChevronRight, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { db, SUPABASE_FUNCTIONS_URL } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'

const CAP = 70 // Daily lead cap per rep

const statusStyles: Record<string,string> = {
  new:           'bg-cyan/10 text-cyan border-cyan/30',
  qualified:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  nurture:       'bg-violet/10 text-violet border-violet/30',
  engaged:       'bg-blue-500/10 text-blue-400 border-blue-500/30',
  proposal:      'bg-amber-500/10 text-amber-400 border-amber-500/30',
  hot:           'bg-red-500/10 text-red-400 border-red-500/30',
  contacted:     'bg-slate-500/10 text-slate-400 border-slate-500/30',
  disqualified:  'bg-red-500/10 text-red-400 border-red-500/30',
  converted:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
}

const tierColor = (tier: string) => {
  if (tier === 'A' || tier === 'premium') return 'text-cyan'
  if (tier === 'B' || tier === 'standard') return 'text-emerald-400'
  return 'text-muted-foreground'
}

export default function Leads() {
  const [leads, setLeads]           = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [contractors, setContractors] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [count, setCount]           = useState(0)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all')
  const [activeTab, setActiveTab]   = useState<'leads'|'distribution'|'caps'>('leads')
  const [distributing, setDistributing] = useState(false)
  const [distResult, setDistResult] = useState<{ok:boolean;msg:string}|null>(null)
  const [overriding, setOverriding] = useState<string|null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsRes, assignRes, contractRes] = await Promise.all([
        db.crm.from('leads')
          .select('id,business_name,company_name,contact_name,email,phone,status,score,lead_score,ai_score,source,industry,assigned_to,revenue_tier,target_tier,tier,priority_level,next_best_action,ai_notes,created_at,updated_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(200),
        db.crm.from('lead_assignments')
          .select('id,lead_id,contractor_id,reason,assigned_at,meta')
          .order('assigned_at', { ascending: false })
          .limit(100),
        db.crm.from('contractors')
          .select('id,active,close_rate,active_load,recent_misses,response_speed_score,availability_score')
          .eq('active', true)
          .limit(50),
      ])
      setLeads(leadsRes.data || [])
      setCount(leadsRes.count || 0)
      setAssignments(assignRes.data || [])
      setContractors(contractRes.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => leads.filter(l => {
    const name = l.business_name || l.company_name || l.contact_name || l.email || ''
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || (l.email||'').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || l.status === filter
    return matchSearch && matchFilter
  }), [leads, search, filter])

  const statusCounts = useMemo(() => {
    const c: Record<string,number> = {}
    leads.forEach(l => { c[l.status] = (c[l.status]||0)+1 })
    return c
  }, [leads])

  // Unassigned leads (no entry in lead_assignments)
  const assignedIds = new Set(assignments.map(a => a.lead_id))
  const unassigned = leads.filter(l => !assignedIds.has(l.id))

  // Cap utilization per contractor
  const capByContractor = useMemo(() => {
    const map: Record<string,number> = {}
    assignments.forEach(a => {
      map[a.contractor_id] = (map[a.contractor_id]||0) + 1
    })
    return map
  }, [assignments])

  // Trigger lead_distribution automation
  const triggerDistribution = async () => {
    setDistributing(true)
    setDistResult(null)
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/core-automation-engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'lead_distribution' }),
      })
      const data = await res.json()
      setDistResult({ ok: res.ok, msg: data?.message || data?.detail || (res.ok ? 'Distribution triggered successfully' : 'Engine error') })
      if (res.ok) setTimeout(load, 2000)
    } catch (e: any) {
      setDistResult({ ok: false, msg: e.message })
    } finally {
      setDistributing(false)
    }
  }

  // Manual assign a lead
  const manualAssign = async (leadId: string, contractorId: string) => {
    setOverriding(leadId)
    try {
      await db.crm.from('lead_assignments').upsert({
        lead_id: leadId,
        contractor_id: contractorId,
        reason: 'manual_override',
        assigned_at: new Date().toISOString(),
        meta: { source: 'starz-os-frontend' },
      })
      await load()
    } catch (e) { console.error(e) }
    finally { setOverriding(null) }
  }

  const getLeadName = (l: any) => l.business_name || l.company_name || l.contact_name || l.email || 'Unknown'
  const getLeadScore = (l: any) => l.lead_score || l.ai_score || l.score || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan"/> Lead Distribution Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? 'Loading...' : `${count.toLocaleString()} total · ${unassigned.length} unassigned · ${contractors.length} active reps`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading?'animate-spin':''}`}/>Refresh
          </Button>
          <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-bold" onClick={triggerDistribution} disabled={distributing}>
            <Zap className="w-3.5 h-3.5 mr-1.5"/>
            {distributing ? 'Distributing...' : 'Run Distribution'}
          </Button>
        </div>
      </div>

      {/* Distribution Result */}
      {distResult && (
        <div className={`p-3 rounded-xl border text-xs ${distResult.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {distResult.ok ? '✓' : '✗'} {distResult.msg}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Leads',    value:count,              icon:Users,     color:'text-cyan' },
          { label:'Unassigned',     value:unassigned.length,  icon:AlertCircle,color:'text-amber-400' },
          { label:'Assignments',    value:assignments.length, icon:UserPlus,  color:'text-emerald-400' },
          { label:'Active Reps',    value:contractors.length, icon:Shield,    color:'text-violet' },
        ].map((m,i) => (
          <motion.div key={m.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`}/>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {loading ? <div className="h-8 w-16 bg-muted/30 rounded animate-pulse"/> : <AnimatedCounter end={m.value}/>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border/40 rounded-xl w-fit">
        {(['leads','distribution','caps'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              activeTab===tab ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'leads' ? 'Lead Inbox' : tab === 'distribution' ? 'Assignments' : 'Rep Caps'}
          </button>
        ))}
      </div>

      {/* Tab: Lead Inbox */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
              <Input placeholder="Search leads..." value={search} onChange={e=>setSearch(e.target.value)}
                className="pl-9 bg-card border-border/40 h-9 text-sm"/>
            </div>
            <div className="flex gap-1 flex-wrap">
              {['all','new','qualified','nurture','engaged','proposal'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    filter===s ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground hover:text-foreground bg-card border border-border/40'}`}>
                  {s}{s!=='all' && statusCounts[s] ? ` (${statusCounts[s]})` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 border-b border-border/20 text-[10px] text-muted-foreground uppercase tracking-wider">
              <span>Lead</span><span>Score</span><span>Tier</span><span>Status</span><span>Added</span>
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading leads from CRM...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No leads matching filter</div>
            ) : (
              <div className="divide-y divide-border/10 max-h-[500px] overflow-y-auto">
                {filtered.map((lead,i) => {
                  const score = getLeadScore(lead)
                  const isAssigned = assignedIds.has(lead.id)
                  return (
                    <motion.div key={lead.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.01}}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors items-center">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{getLeadName(lead)}</p>
                          {!isAssigned && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">unassigned</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lead.email && <p className="text-[10px] text-muted-foreground truncate">{lead.email}</p>}
                          {lead.industry && <p className="text-[10px] text-muted-foreground">· {lead.industry}</p>}
                        </div>
                        {lead.next_best_action && (
                          <p className="text-[10px] text-cyan/70 mt-0.5 truncate">→ {lead.next_best_action}</p>
                        )}
                      </div>
                      <div className={`text-sm font-mono font-bold ${score>=80?'text-red-400':score>=60?'text-amber-400':'text-muted-foreground'}`}>
                        {score || '—'}
                      </div>
                      <div className={`text-xs font-bold ${tierColor(lead.revenue_tier||lead.target_tier||lead.tier||'')}`}>
                        {lead.revenue_tier||lead.target_tier||lead.tier||'—'}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${statusStyles[lead.status]||'bg-muted text-muted-foreground'}`}>
                        {lead.status||'—'}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(lead.created_at)}</span>
                    </motion.div>
                  )
                })}
              </div>
            )}
            {!loading && filtered.length > 0 && (
              <div className="px-4 py-2 border-t border-border/10 text-[10px] text-muted-foreground">
                Showing {filtered.length} of {count} leads
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === 'distribution' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{assignments.length} total assignments · {unassigned.length} leads need assignment</p>
          </div>

          {unassigned.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400"/>
                  <p className="text-sm font-semibold text-amber-400">{unassigned.length} Unassigned Leads</p>
                </div>
                <Button size="sm" className="bg-gradient-primary text-space text-xs h-7 font-bold" onClick={triggerDistribution} disabled={distributing}>
                  <Zap className="w-3 h-3 mr-1.5"/>Auto-Assign All
                </Button>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {unassigned.slice(0,10).map(lead => (
                  <div key={lead.id} className="flex items-center gap-3 p-2 rounded-lg bg-card/50">
                    <p className="text-xs text-foreground flex-1 truncate">{getLeadName(lead)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusStyles[lead.status]||'bg-muted text-muted-foreground'}`}>{lead.status}</span>
                  </div>
                ))}
                {unassigned.length > 10 && (
                  <p className="text-[10px] text-muted-foreground text-center">+{unassigned.length-10} more</p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/20">
              <h3 className="text-sm font-semibold text-foreground">Recent Assignments — crm.lead_assignments</h3>
            </div>
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No assignments yet. Run distribution to assign leads.</div>
            ) : (
              <div className="divide-y divide-border/10 max-h-80 overflow-y-auto">
                {assignments.map((a,i) => (
                  <div key={a.id||i} className="flex items-center gap-4 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground font-mono truncate">{a.lead_id?.slice(0,8)}...</p>
                      <p className="text-[10px] text-muted-foreground">{a.reason || 'auto-assigned'}</p>
                    </div>
                    <p className="text-[10px] text-cyan font-mono truncate max-w-[120px]">{a.contractor_id?.slice(0,8)}...</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(a.assigned_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Rep Caps */}
      {activeTab === 'caps' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Daily cap: <span className="text-cyan font-bold">{CAP} leads/rep</span> · Showing active contractors from crm.contractors</p>

          {contractors.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border/40 text-center text-muted-foreground text-sm">
              No active contractors in crm.contractors
            </div>
          ) : (
            <div className="grid gap-3">
              {contractors.map((c,i) => {
                const assigned = capByContractor[c.id] || 0
                const pct = Math.min(Math.round((assigned/CAP)*100), 100)
                const atCap = assigned >= CAP
                return (
                  <motion.div key={c.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                    className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center text-xs font-bold text-cyan">
                          {String.fromCharCode(65+i)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground font-mono">{c.id.slice(0,8)}...</p>
                          <p className="text-[10px] text-muted-foreground">
                            Close rate: <span className="text-cyan">{c.close_rate ? `${Math.round(Number(c.close_rate)*100)}%` : '—'}</span>
                            {c.recent_misses > 0 && <span className="text-red-400 ml-2">{c.recent_misses} misses</span>}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${atCap?'text-red-400':'text-foreground'}`}>{assigned}/{CAP}</p>
                        <p className="text-[10px] text-muted-foreground">leads assigned</p>
                      </div>
                    </div>
                    {/* Cap bar */}
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${atCap?'bg-red-500':pct>70?'bg-amber-400':'bg-cyan'}`}
                        style={{width:`${pct}%`}}/>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{pct}% capacity</span>
                      {atCap && <span className="text-[10px] text-red-400 font-semibold">AT CAP</span>}
                      {!atCap && <span className="text-[10px] text-emerald-400">{CAP-assigned} slots open</span>}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
