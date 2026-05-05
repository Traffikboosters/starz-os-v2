import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, CreditCard, RefreshCw, CheckCircle2, Clock, AlertCircle, Zap, TrendingUp, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { db, SUPABASE_FUNCTIONS_URL } from '@/lib/supabase'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const statusStyle: Record<string, string> = {
  paid:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/30',
  in_fulfillment: 'bg-cyan/10 text-cyan border-cyan/30',
  failed:   'bg-red-500/10 text-red-400 border-red-500/30',
  refunded: 'bg-violet/10 text-violet border-violet/30',
}

export default function Billing() {
  const [orders, setOrders] = useState<any[]>([])
  const [stripeEvents, setStripeEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState<{ok:boolean;msg:string}|null>(null)
  const [activeTab, setActiveTab] = useState<'orders'|'stripe'>('orders')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersRes, stripeRes] = await Promise.allSettled([
        db.deals.from('work_orders')
          .select('id,client_name,business_name,email,package,total_amount,deposit_amount,monthly_amount,status,payment_status,paid_at,signed_at,fulfillment_status,execution_status,proposal_id,service_type,created_at,cancellation_deadline,probation_ends_at')
          .order('created_at', { ascending: false }).limit(50),
        db.deals.from('stripe_webhook_events')
          .select('id,event_type,amount,currency,status,customer_email,created_at')
          .order('created_at', { ascending: false }).limit(30),
      ])
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data || [])
      if (stripeRes.status === 'fulfilled') setStripeEvents(stripeRes.value.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const triggerStripeTest = async () => {
    setTriggering(true)
    setTriggerResult(null)
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/stripe-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { amount: 75000, currency: 'usd' } } }),
      })
      const data = await res.json()
      setTriggerResult({ ok: res.ok, msg: data?.message || (res.ok ? 'Stripe test event fired' : 'Error') })
      if (res.ok) setTimeout(load, 1500)
    } catch (e: any) { setTriggerResult({ ok: false, msg: e.message }) }
    finally { setTriggering(false) }
  }

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.payment_status === 'paid').length,
    pending: orders.filter(o => o.payment_status === 'pending').length,
    mrr: orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + parseFloat(o.monthly_amount || o.total_amount || 0), 0),
  }

  const chartData = (() => {
    const byDay: Record<string, number> = {}
    orders.filter(o => o.paid_at).forEach(o => {
      const d = new Date(o.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      byDay[d] = (byDay[d] || 0) + parseFloat(o.monthly_amount || o.total_amount || 0)
    })
    return Object.entries(byDay).slice(-7).map(([name, revenue]) => ({ name, revenue }))
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan" /> Billing & Payments
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">deals.work_orders · Stripe webhook events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button size="sm" className="bg-gradient-primary text-space font-bold text-xs h-8" onClick={triggerStripeTest} disabled={triggering}>
            <Zap className="w-3.5 h-3.5 mr-1.5" />{triggering ? 'Firing...' : 'Test Stripe Event'}
          </Button>
        </div>
      </div>

      {triggerResult && (
        <div className={`p-3 rounded-xl border text-xs ${triggerResult.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {triggerResult.ok ? '✓' : '✗'} {triggerResult.msg}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Work Orders', value: stats.total,   icon: FileText,    color: 'text-cyan' },
          { label: 'Paid',        value: stats.paid,    icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Pending',     value: stats.pending, icon: Clock,       color: 'text-amber-400' },
          { label: 'Est. MRR',    value: stats.mrr,     icon: TrendingUp,  color: 'text-violet', isCurrency: true },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${m.color}`}>
              {loading ? <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" /> :
                m.isCurrency ? `$${(m.value/1000).toFixed(1)}K` : <AnimatedCounter end={m.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <h3 className="font-semibold text-foreground text-sm mb-4">Revenue Activity</h3>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData}>
              <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
              </linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}K`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#00F0FF" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-card border border-border/40 rounded-xl w-fit">
        {[['orders', 'Work Orders'], ['stripe', 'Stripe Events']] .map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 border-b border-border/20 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span>Client</span><span>Package</span><span>Amount</span><span>Status</span><span>Date</span>
          </div>
          {loading ? <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div> :
            <div className="divide-y divide-border/10 max-h-96 overflow-y-auto">
              {orders.map((o, i) => (
                <div key={o.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{o.business_name || o.client_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{o.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{o.package || o.service_type || '—'}</p>
                  <p className="text-sm font-mono font-bold text-foreground">{formatCurrency(parseFloat(o.monthly_amount || o.total_amount || 0))}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${statusStyle[o.payment_status] || statusStyle.pending}`}>
                    {o.payment_status}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(o.created_at)}</span>
                </div>
              ))}
            </div>}
        </div>
      )}

      {activeTab === 'stripe' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/20"><h3 className="text-sm font-semibold text-foreground">deals.stripe_webhook_events</h3></div>
          {stripeEvents.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No Stripe events yet. Fire a test event above.</div> :
            <div className="divide-y divide-border/10 max-h-96 overflow-y-auto">
              {stripeEvents.map((e, i) => (
                <div key={e.id || i} className="flex items-center gap-4 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors">
                  <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{e.event_type}</p>
                    <p className="text-[10px] text-muted-foreground">{e.customer_email || '—'}</p>
                  </div>
                  {e.amount && <p className="text-sm font-mono text-cyan">{formatCurrency(e.amount / 100)}</p>}
                  <span className="text-[10px] text-muted-foreground">{timeAgo(e.created_at)}</span>
                </div>
              ))}
            </div>}
        </div>
      )}
    </div>
  )
}
