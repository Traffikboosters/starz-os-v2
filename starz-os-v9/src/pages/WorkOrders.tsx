import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, RefreshCw, CheckCircle2, Clock, AlertCircle, User, Calendar, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { db, SUPABASE_FUNCTIONS_URL } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'

const statusStyle: Record<string, string> = {
  pending:        'bg-amber-500/10 text-amber-400 border-amber-500/30',
  assigned:       'bg-cyan/10 text-cyan border-cyan/30',
  ready_for_rico: 'bg-violet/10 text-violet border-violet/30',
  in_progress:    'bg-blue-500/10 text-blue-400 border-blue-500/30',
  complete:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cancelled:      'bg-red-500/10 text-red-400 border-red-500/30',
}

export default function WorkOrders() {
  const [orders, setOrders]     = useState<any[]>([])
  const [trackers, setTrackers] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [result, setResult]     = useState<{ok:boolean;msg:string}|null>(null)
  const [activeTab, setActiveTab] = useState<'orders'|'tracker'>('orders')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersRes, trackRes] = await Promise.allSettled([
        db.deals.from('work_orders')
          .select('id,client_name,business_name,email,package,service_type,status,payment_status,execution_status,fulfillment_status,assigned_to,priority,created_at,cancellation_deadline,production_released_at,rico_visible')
          .order('created_at', { ascending: false }).limit(50),
        db.rico.from('work_order_tracker')
          .select('id,work_order_id,proposal_id,client_name,business_name,service_type,assigned_to,assigned_at,status,priority,stripe_paid_at,due_date')
          .order('assigned_at', { ascending: false }).limit(30),
      ])
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || [])
      if (trackRes.status === 'fulfilled') setTrackers(trackRes.value.data || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const triggerRicoAssign = async () => {
    setAssigning(true)
    setResult(null)
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/core-automation-engine`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'payment_received' }),
      })
      const data = await res.json()
      setResult({ ok: res.ok, msg: data?.message || (res.ok ? 'Rico assignment triggered' : 'Error') })
      if (res.ok) setTimeout(load, 2000)
    } catch (e: any) { setResult({ ok: false, msg: e.message }) }
    finally { setAssigning(false) }
  }

  const stats = {
    total:    orders.length,
    pending:  orders.filter(o => o.execution_status === 'ready_for_rico' || o.status === 'pending').length,
    assigned: trackers.length,
    complete: orders.filter(o => o.fulfillment_status === 'complete').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan" /> Work Orders — Rico BGE
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">deals.work_orders · rico.work_order_tracker · Payment → Assignment → Fulfillment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button size="sm" className="bg-gradient-primary text-space font-bold text-xs h-8" onClick={triggerRicoAssign} disabled={assigning}>
            <Zap className="w-3.5 h-3.5 mr-1.5" />{assigning ? 'Assigning...' : 'Rico: Assign Work'}
          </Button>
        </div>
      </div>

      {result && (
        <div className={`p-3 rounded-xl border text-xs ${result.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {result.ok ? '✓' : '✗'} {result.msg}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: stats.total,    icon: Briefcase,    color: 'text-cyan' },
          { label: 'Pending',  value: stats.pending,  icon: Clock,        color: 'text-amber-400' },
          { label: 'Assigned', value: stats.assigned, icon: User,         color: 'text-violet' },
          { label: 'Complete', value: stats.complete, icon: CheckCircle2, color: 'text-emerald-400' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${m.color}`}>
              {loading ? <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" /> : <AnimatedCounter end={m.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3-day rule banner */}
      <div className="p-4 rounded-2xl bg-violet/5 border border-violet/20 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-violet flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-violet">3-Day Cancellation Rule Active</p>
          <p className="text-xs text-muted-foreground mt-0.5">Work orders enter fulfillment 3 days after payment. Rico assigns developers only after the probation window closes. Never before payment is confirmed.</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-card border border-border/40 rounded-xl w-fit">
        {[['orders', `Work Orders (${orders.length})`], ['tracker', `Rico Tracker (${trackers.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 border-b border-border/20 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span>Client</span><span>Service</span><span>Payment</span><span>Execution</span><span>Created</span>
          </div>
          {loading ? <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div> :
            <div className="divide-y divide-border/10 max-h-96 overflow-y-auto">
              {orders.map(o => (
                <div key={o.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{o.business_name || o.client_name}</p>
                    <p className="text-[10px] text-muted-foreground">{o.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{o.service_type || o.package || '—'}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${statusStyle[o.payment_status] || 'bg-muted/10 text-muted-foreground border-border'}`}>{o.payment_status}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${statusStyle[o.execution_status] || 'bg-muted/10 text-muted-foreground border-border'}`}>{o.execution_status || '—'}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(o.created_at)}</span>
                </div>
              ))}
            </div>}
        </div>
      )}

      {activeTab === 'tracker' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/20"><h3 className="text-sm font-semibold text-foreground">rico.work_order_tracker</h3></div>
          {trackers.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No assignments yet. Click "Rico: Assign Work" to trigger assignment.</div> :
            <div className="divide-y divide-border/10 max-h-96 overflow-y-auto">
              {trackers.map((t, i) => (
                <div key={t.id || i} className="flex items-center gap-4 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.business_name || t.client_name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.service_type} · Assigned to: {t.assigned_to || 'Unassigned'}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${statusStyle[t.status] || 'bg-muted/10 text-muted-foreground border-border'}`}>{t.status}</span>
                  {t.due_date && <span className="text-[10px] text-amber-400 whitespace-nowrap">Due {timeAgo(t.due_date)}</span>}
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{t.assigned_at ? timeAgo(t.assigned_at) : '—'}</span>
                </div>
              ))}
            </div>}
        </div>
      )}
    </div>
  )
}
