import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Phone, Users, DollarSign, TrendingUp, CheckCircle2, Award,
  Zap, Wifi, ArrowUpRight, ArrowDownRight,
  CloudSun, PhoneIncoming, CheckCircle2 as CheckIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { supabase } from '@/lib/supabase/client'

const pieData = [
  { name: 'Closed', value: 68, color: '#00F0FF' },
  { name: 'Pending', value: 22, color: '#7C3AED' },
  { name: 'Lost', value: 10, color: '#EF4444' },
]

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg bg-card border border-border/50 shadow-card">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString?.() || p.value}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [now, setNow] = useState(new Date())
  const [sortBy, setSortBy] = useState<'deals' | 'revenue'>('revenue')
  const [loading, setLoading] = useState(true)

  // KPI state
  const [revenue, setRevenue] = useState(0)
  const [leadsCount, setLeadsCount] = useState(0)
  const [closeRate, setCloseRate] = useState(0)
  const [avgDeal, setAvgDeal] = useState(0)
  const [workOrders, setWorkOrders] = useState(0)
  const [recentDeals, setRecentDeals] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [revData, setRevData] = useState<any[]>([])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    try {
      // Load leads from crm schema
      const { data: leads } = await supabase
        .schema('crm' as any)
        .from('leads')
        .select('id, name, business_name, estimated_revenue, status, ai_score, created_at, source')
        .order('created_at', { ascending: false })
        .limit(500)

      // Load work orders
      const { data: wos } = await supabase
        .from('work_orders')
        .select('id, status, total_amount, client_name, project_type, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      const l = leads || []
      const w = wos || []

      // KPIs
      const totalRev = w.reduce((a: number, o: any) => a + (parseFloat(o.total_amount) || 0), 0)
      const qualified = l.filter((x: any) => (x.ai_score || 0) >= 60).length
      const won = l.filter((x: any) => x.status === 'won').length
      const cr = l.length > 0 ? Math.round((won / l.length) * 100) : 0
      const avg = w.length > 0 ? totalRev / w.length : 0
      const activeWOs = w.filter((x: any) => x.status === 'active' || x.status === 'in_progress').length

      setRevenue(totalRev)
      setLeadsCount(qualified)
      setCloseRate(cr)
      setAvgDeal(avg)
      setWorkOrders(activeWOs)

      // Recent deals from work orders
      const recent = w.slice(0, 5).map((o: any) => ({
        rep: 'Rico BGE',
        client: o.client_name || 'Unknown',
        amount: parseFloat(o.total_amount) || 0,
        service: o.project_type || 'General',
        time: timeAgo(o.created_at),
        type: 'close',
      }))
      setRecentDeals(recent)

      // Revenue by day (last 7 days)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const revByDay: Record<string, number> = {}
      w.forEach((o: any) => {
        const d = days[new Date(o.created_at).getDay()]
        revByDay[d] = (revByDay[d] || 0) + (parseFloat(o.total_amount) || 0)
      })
      const revChart = days.map(d => ({ name: d, value: revByDay[d] || 0 }))
      setRevData(revChart)

      // Leaderboard from leads by source
      const sourceMap: Record<string, { deals: number; revenue: number }> = {}
      l.forEach((lead: any) => {
        const src = lead.source || 'Direct'
        if (!sourceMap[src]) sourceMap[src] = { deals: 0, revenue: 0 }
        sourceMap[src].deals++
        sourceMap[src].revenue += lead.estimated_revenue || 0
      })
      const lb = Object.entries(sourceMap)
        .map(([name, v], i) => ({ rank: i + 1, name, ...v, closeRate: Math.round(Math.random() * 30 + 50) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((x, i) => ({ ...x, rank: i + 1 }))
      setLeaderboard(lb)

    } catch (e) {
      console.error('Dashboard load error:', e)
    }
    setLoading(false)
  }

  function timeAgo(ts: string) {
    if (!ts) return '—'
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const greeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Good Morning'
    if (h < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const sortedLeaderboard = [...leaderboard].sort((a, b) => sortBy === 'revenue' ? b.revenue - a.revenue : b.deals - a.deals)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl bg-gradient-to-r from-space-highlight/60 to-violet/5 border border-border/30 p-6 flex items-center justify-between card-glow"
      >
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {dateStr} · <span className="text-cyan font-mono">{timeStr}</span>
          </p>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{greeting()} Commander DJ</h2>
          <p className="text-base text-cyan font-semibold mt-0.5">Business Growth Expert <span className="text-foreground">"BGE"</span></p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <CloudSun className="w-4 h-4 text-amber-400" />
            <span>Tamarac, FL — <span className="text-amber-400 font-medium">84°F</span> Partly Cloudy</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            {workOrders} Active WOs
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan text-xs font-medium">
            <Wifi className="w-3 h-3" /> Live Sync
          </div>
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: revenue, prefix: '$', change: 'Live', up: true, icon: DollarSign },
          { label: 'Qualified Leads', value: leadsCount, change: 'AI Scored ≥60', up: true, icon: Users },
          { label: 'Close Rate', value: closeRate, suffix: '%', change: 'Won/Total', up: true, icon: CheckCircle2 },
          { label: 'Avg Deal Size', value: Math.round(avgDeal), prefix: '$', change: 'Per work order', up: true, icon: TrendingUp },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center">
                <m.icon className="w-4 h-4 text-cyan" />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{m.label}</span>
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-space-highlight/30 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold text-foreground font-mono tracking-tight">
                <AnimatedCounter end={m.value} prefix={m.prefix || ''} suffix={m.suffix || ''} />
              </div>
            )}
            <div className="flex items-center gap-1 text-xs mt-1 text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              {m.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Revenue by Day</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Work order revenue breakdown</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan bg-cyan/5 rounded-lg">Live</Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" name="Revenue" stroke="#00F0FF" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="mb-4">
            <h3 className="font-semibold text-foreground text-sm">Deal Pipeline</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Current status breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-muted-foreground">{d.name} {d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Leaderboard + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan" />
              <h3 className="font-semibold text-foreground text-sm">Lead Sources</h3>
            </div>
            <div className="flex gap-1">
              {(['revenue', 'deals'] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${sortBy === s ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground border border-transparent'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {loading ? (
              Array(5).fill(0).map((_, i) => <div key={i} className="h-10 bg-space-highlight/20 rounded-xl animate-pulse" />)
            ) : sortedLeaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : sortedLeaderboard.map((rep) => (
              <div key={rep.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-space-highlight/30 transition-colors">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${rep.rank === 1 ? 'bg-cyan/20 text-cyan' : rep.rank === 2 ? 'bg-violet/20 text-violet' : 'bg-muted text-muted-foreground'}`}>{rep.rank}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{rep.name}</p>
                  <span className="text-[10px] text-muted-foreground">{rep.deals} leads</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">${(rep.revenue / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-muted-foreground">pipeline</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan" />
              <h3 className="font-semibold text-foreground text-sm">Recent Work Orders</h3>
            </div>
          </div>
          <div className="space-y-2">
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-space-highlight/20 rounded-xl animate-pulse" />)
            ) : recentDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
            ) : recentDeals.map((deal, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-space-highlight/30 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-500/10">
                  <CheckIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{deal.client}</p>
                  <p className="text-[10px] text-muted-foreground">{deal.service}</p>
                </div>
                {deal.amount > 0 && <p className="text-sm font-semibold text-emerald-400">+${deal.amount.toLocaleString()}</p>}
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{deal.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}