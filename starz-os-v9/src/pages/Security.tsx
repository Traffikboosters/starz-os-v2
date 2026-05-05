import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, RefreshCw,
  ShieldAlert, ShieldCheck, Users, Activity, Eye, Lock,
  AlertCircle, Zap, Terminal, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { db, SUPABASE_FUNCTIONS_URL } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'

interface Violation {
  fingerprint: string
  category: string
  subject: string
  message: string
  severity: string
  occurrence_count: number
  first_seen_at: string
  last_seen_at: string
}

interface AccessEvent {
  id?: string
  type?: string
  payload?: any
  created_at: string
  tenant_id_text?: string
}

interface HighRiskUser {
  id?: string
  user_id?: string
  risk_score?: number
  reason?: string
  status?: string
  created_at?: string
}

const severityStyle = (s: string) => {
  switch ((s || '').toLowerCase()) {
    case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/40'
    case 'high':     return 'bg-red-500/10 text-red-400 border-red-500/30'
    case 'medium':   return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'low':      return 'bg-cyan/10 text-cyan border-cyan/30'
    default:         return 'bg-muted/20 text-muted-foreground border-border/30'
  }
}

const severityIcon = (s: string) => {
  switch ((s || '').toLowerCase()) {
    case 'critical':
    case 'high':   return <AlertTriangle className="w-4 h-4 text-red-400" />
    case 'medium': return <AlertCircle className="w-4 h-4 text-amber-400" />
    default:       return <ShieldAlert className="w-4 h-4 text-cyan" />
  }
}

export default function Security() {
  const [violations, setViolations]       = useState<Violation[]>([])
  const [activeViolations, setActiveViolations] = useState<Violation[]>([])
  const [accessEvents, setAccessEvents]   = useState<AccessEvent[]>([])
  const [highRisk, setHighRisk]           = useState<HighRiskUser[]>([])
  const [loading, setLoading]             = useState(true)
  const [scanRunning, setScanRunning]     = useState(false)
  const [scanResult, setScanResult]       = useState<{ok:boolean;msg:string}|null>(null)
  const [activeTab, setActiveTab]         = useState<'violations'|'access'|'highrisk'>('violations')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [violRes, activeRes, eventsRes, riskRes] = await Promise.allSettled([
        db.security.from('violations')
          .select('fingerprint,category,subject,message,severity,occurrence_count,first_seen_at,last_seen_at')
          .order('last_seen_at', { ascending: false })
          .limit(50),
        db.security.from('v_active_violations')
          .select('fingerprint,category,subject,message,severity,occurrence_count,first_seen_at,last_seen_at')
          .limit(20),
        db.security.from('events')
          .select('id,type,payload,created_at,tenant_id_text')
          .order('created_at', { ascending: false })
          .limit(30),
        db.security.from('high_risk_users')
          .select('*')
          .limit(20),
      ])
      if (violRes.status === 'fulfilled') setViolations(violRes.value.data || [])
      if (activeRes.status === 'fulfilled') setActiveViolations(activeRes.value.data || [])
      if (eventsRes.status === 'fulfilled') setAccessEvents(eventsRes.value.data || [])
      if (riskRes.status === 'fulfilled') setHighRisk(riskRes.value.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const runSentinelScan = async () => {
    setScanRunning(true)
    setScanResult(null)
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/core-automation-engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'sentinel_scan' }),
      })
      const data = await res.json()
      setScanResult({ ok: res.ok, msg: data?.message || data?.detail || (res.ok ? 'Sentinel scan completed' : 'Scan error') })
      if (res.ok) setTimeout(load, 2000)
    } catch (e: any) {
      setScanResult({ ok: false, msg: e.message })
    } finally {
      setScanRunning(false)
    }
  }

  // Stats
  const criticalCount = violations.filter(v => ['critical','high'].includes((v.severity||'').toLowerCase())).length
  const mediumCount   = violations.filter(v => (v.severity||'').toLowerCase() === 'medium').length
  const lowCount      = violations.filter(v => (v.severity||'').toLowerCase() === 'low').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan" /> Sentinel Security
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            RLS enforcement · Access logging · Auto-suspension · Violation tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button size="sm" className="bg-gradient-primary text-space font-bold text-xs h-8" onClick={runSentinelScan} disabled={scanRunning}>
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            {scanRunning ? 'Scanning...' : 'Run Sentinel Scan'}
          </Button>
        </div>
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div className={`p-3 rounded-xl border text-xs ${scanResult.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {scanResult.ok ? '✓' : '✗'} {scanResult.msg}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Violations', value: violations.length,      icon: ShieldAlert,  color: 'text-cyan' },
          { label: 'Active / Open',    value: activeViolations.length, icon: AlertTriangle,color: 'text-red-400' },
          { label: 'High Severity',    value: criticalCount,           icon: XCircle,      color: 'text-red-400' },
          { label: 'High Risk Users',  value: highRisk.length,         icon: Users,        color: 'text-amber-400' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {loading ? <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" /> : <AnimatedCounter end={m.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Severity Breakdown */}
      {violations.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Critical / High', value: criticalCount, color: 'text-red-400',   bar: 'bg-red-500' },
            { label: 'Medium',          value: mediumCount,   color: 'text-amber-400', bar: 'bg-amber-400' },
            { label: 'Low / Info',      value: lowCount,      color: 'text-cyan',       bar: 'bg-cyan' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <span className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${s.bar}`}
                  style={{ width: violations.length > 0 ? `${Math.round((s.value / violations.length) * 100)}%` : '0%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border/40 rounded-xl w-fit">
        {([
          { id: 'violations', label: `Violations (${violations.length})` },
          { id: 'access',     label: `Events (${accessEvents.length})` },
          { id: 'highrisk',   label: `High Risk (${highRisk.length})` },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Violations */}
      {activeTab === 'violations' && (
        <div className="space-y-3">
          {activeViolations.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-red-400">{activeViolations.length} Active Violations — Require Attention</p>
              </div>
              <div className="space-y-2">
                {activeViolations.map((v, i) => (
                  <div key={v.fingerprint || i} className="flex items-start gap-3 p-3 rounded-xl bg-card/60">
                    {severityIcon(v.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{v.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{v.subject} · {v.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border capitalize flex-shrink-0 ${severityStyle(v.severity)}`}>
                      {v.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">security.violations</h3>
              <span className="text-[10px] text-muted-foreground">{violations.length} total</span>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/10">
              <span></span><span>Message / Subject</span><span>Category</span><span>Severity</span><span>Last Seen</span>
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading violations...</div>
            ) : violations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                No violations detected. System is clean.
              </div>
            ) : (
              <div className="divide-y divide-border/10 max-h-96 overflow-y-auto">
                {violations.map((v, i) => (
                  <motion.div key={v.fingerprint || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors items-center">
                    {severityIcon(v.severity)}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{v.message}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{v.subject}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground capitalize">{v.category?.replace(/_/g, ' ')}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${severityStyle(v.severity)}`}>
                      {v.severity}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(v.last_seen_at)}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Access Events */}
      {activeTab === 'access' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">security.events</h3>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live
            </Badge>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading events...</div>
          ) : accessEvents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No security events logged yet</div>
          ) : (
            <div className="divide-y divide-border/10 max-h-96 overflow-y-auto">
              {accessEvents.map((e, i) => (
                <div key={e.id || i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-3.5 h-3.5 text-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{e.type || 'event'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {e.tenant_id_text ? `tenant: ${e.tenant_id_text}` : '—'}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(e.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: High Risk Users */}
      {activeTab === 'highrisk' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/20">
            <h3 className="text-sm font-semibold text-foreground">security.high_risk_users</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : highRisk.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              No high-risk users flagged.
            </div>
          ) : (
            <div className="divide-y divide-border/10 max-h-96 overflow-y-auto">
              {highRisk.map((u, i) => (
                <div key={u.id || i} className="flex items-center gap-4 px-4 py-3 hover:bg-space-highlight/20 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate font-mono">
                      {u.user_id ? u.user_id.slice(0, 12) + '...' : u.id || 'Unknown'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{u.reason || '—'}</p>
                  </div>
                  {u.risk_score !== undefined && (
                    <div className="text-right">
                      <p className={`text-sm font-bold ${u.risk_score > 80 ? 'text-red-400' : u.risk_score > 50 ? 'text-amber-400' : 'text-cyan'}`}>
                        {u.risk_score}
                      </p>
                      <p className="text-[10px] text-muted-foreground">risk score</p>
                    </div>
                  )}
                  {u.status && (
                    <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${u.status === 'suspended' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                      {u.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
