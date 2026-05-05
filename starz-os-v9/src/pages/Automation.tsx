import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Zap, RefreshCw, CheckCircle2, XCircle, Clock, Activity, Brain, GitBranch, Shield, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUPABASE_FUNCTIONS_URL } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'

const ENGINES = [
  { id: 'lead_distribution',  label: 'Lead Distribution',    engine: 'core-automation-engine', trigger: 'lead_distribution',  icon: GitBranch, color: 'text-cyan',        desc: 'Smart assignment · Daily caps · Fairness scoring' },
  { id: 'lead_rotation',      label: 'Lead Rotation',        engine: 'core-automation-engine', trigger: 'lead_rotation',      icon: RefreshCw, color: 'text-blue-400',    desc: 'Rotate stale leads · Re-qualify · Re-assign' },
  { id: 'payment_received',   label: 'Payment → Work Order', engine: 'core-automation-engine', trigger: 'payment_received',   icon: CheckCircle2, color: 'text-emerald-400', desc: 'Stripe paid → Rico assigns → 3-day probation' },
  { id: 'sentinel_scan',      label: 'Sentinel Security Scan', engine: 'core-automation-engine', trigger: 'sentinel_scan',    icon: Shield,    color: 'text-red-400',     desc: 'RLS audit · Access logging · Auto-suspension' },
  { id: 'vox_message',        label: 'Vox Broadcast',        engine: 'gizmo-vox-router',        trigger: null,               icon: Brain,     color: 'text-violet',      desc: 'Route to Steve or Vox · AI response' },
  { id: 'outreach',           label: 'Outreach Engine',      engine: 'outreach-engine',         trigger: null,               icon: Globe,     color: 'text-amber-400',   desc: 'Revenue Engine · 7-touch sequences · Reply tracking' },
]

interface RunLog { id: string; engine: string; trigger: string; ok: boolean; msg: string; ts: string }

export default function Automation() {
  const [logs, setLogs]     = useState<RunLog[]>([])
  const [running, setRunning] = useState<string | null>(null)

  const fire = useCallback(async (eng: typeof ENGINES[0]) => {
    setRunning(eng.id)
    const start = Date.now()
    try {
      const body = eng.trigger ? JSON.stringify({ trigger: eng.trigger }) : JSON.stringify({ action: 'ping' })
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/${eng.engine}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      })
      const data = await res.json()
      const entry: RunLog = {
        id: Math.random().toString(36).slice(2),
        engine: eng.label, trigger: eng.trigger || 'ping',
        ok: res.ok,
        msg: data?.message || data?.detail || (res.ok ? `Completed in ${Date.now() - start}ms` : `Error ${res.status}`),
        ts: new Date().toISOString(),
      }
      setLogs(l => [entry, ...l.slice(0, 19)])
    } catch (e: any) {
      setLogs(l => [{ id: Math.random().toString(36).slice(2), engine: eng.label, trigger: eng.trigger || 'ping', ok: false, msg: e.message, ts: new Date().toISOString() }, ...l.slice(0, 19)])
    } finally { setRunning(null) }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan" /> Automation — Orchestration Engine
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">master-router → core-automation-engine · outreach-engine · rico-engine · authority-engine · intelligence-engine</p>
      </div>

      {/* Engine grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENGINES.map((eng, i) => (
          <motion.div key={eng.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="p-5 rounded-2xl bg-card border border-border/40 card-glow flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-space-highlight flex items-center justify-center`}>
                  <eng.icon className={`w-5 h-5 ${eng.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{eng.label}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{eng.engine}</p>
                </div>
              </div>
              {running === eng.id && <div className="w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />}
            </div>
            <p className="text-[11px] text-muted-foreground">{eng.desc}</p>
            <Button size="sm" className={`w-full h-8 text-xs font-bold bg-gradient-primary text-space mt-auto`}
              onClick={() => fire(eng)} disabled={!!running}>
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              {running === eng.id ? 'Running...' : `Fire ${eng.trigger || 'ping'}`}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Live run log */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan" />
          <h3 className="text-sm font-semibold text-foreground">Live Run Log</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">Session only · {logs.length} runs</span>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No runs yet. Fire an engine above.</div>
        ) : (
          <div className="divide-y divide-border/10 max-h-64 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
                {log.ok
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  : <XCircle    className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{log.engine} · <span className="font-mono text-cyan">{log.trigger}</span></p>
                  <p className="text-[10px] text-muted-foreground truncate">{log.msg}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(log.ts)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Engine map */}
      <div className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
        <h3 className="text-sm font-semibold text-foreground mb-4">STARZ-OS Engine Map</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'master-router',          role: 'Gateway',              color: 'border-cyan/30 text-cyan' },
            { name: 'core-automation-engine', role: 'Orchestration Engine', color: 'border-violet/30 text-violet' },
            { name: 'outreach-engine',        role: 'Revenue Engine',       color: 'border-emerald-400/30 text-emerald-400' },
            { name: 'rico-engine',            role: 'Delivery Engine',      color: 'border-amber-400/30 text-amber-400' },
            { name: 'authority-engine',       role: 'Authority Engine',     color: 'border-blue-400/30 text-blue-400' },
            { name: 'intelligence-engine',    role: 'Intelligence Engine',  color: 'border-red-400/30 text-red-400' },
          ].map(e => (
            <div key={e.name} className={`p-3 rounded-xl border ${e.color} bg-space-highlight/30`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${e.color.split(' ')[1]}`}>{e.role}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{e.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
