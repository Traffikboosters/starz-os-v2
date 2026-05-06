import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Phone, Users, DollarSign, TrendingUp, CheckCircle2, Award,
  Zap, Wifi, Sparkles, ArrowUpRight, ArrowDownRight, Star,
  CloudSun, PhoneIncoming, CheckCircle2 as CheckIcon,
  FolderKanban, Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useToast } from '@/hooks/useToast'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const revData = [
  { name: 'Mon', value: 4200 }, { name: 'Tue', value: 5800 },
  { name: 'Wed', value: 8900 }, { name: 'Thu', value: 7200 },
  { name: 'Fri', value: 12500 }, { name: 'Sat', value: 6800 },
  { name: 'Sun', value: 9100 },
]
const closeData = [
  { name: 'Mon', closed: 12, lost: 3 }, { name: 'Tue', closed: 18, lost: 5 },
  { name: 'Wed', closed: 22, lost: 2 }, { name: 'Thu', closed: 15, lost: 4 },
  { name: 'Fri', closed: 28, lost: 6 }, { name: 'Sat', closed: 10, lost: 1 },
  { name: 'Sun', closed: 14, lost: 3 },
]
const pieData = [
  { name: 'Closed', value: 68, color: '#00F0FF' },
  { name: 'Pending', value: 22, color: '#7C3AED' },
  { name: 'Lost', value: 10, color: '#EF4444' },
]
const liveReps = [
  { name: 'Sarah Chen', status: 'on-call', time: '4:32', deals: 3, avatar: '/avatar-1.jpg' },
  { name: 'Marcus Webb', status: 'available', time: '-', deals: 2, avatar: '/avatar-2.jpg' },
  { name: 'Elena Rossi', status: 'on-call', time: '2:15', deals: 5, avatar: '/avatar-3.jpg' },
  { name: 'James Park', status: 'break', time: '-', deals: 1, avatar: '/avatar-1.jpg' },
  { name: 'Aisha Patel', status: 'available', time: '-', deals: 4, avatar: '/avatar-2.jpg' },
]
const leaderboard = [
  { rank: 1, name: 'Elena Rossi', deals: 24, revenue: 186400, closeRate: 68 },
  { rank: 2, name: 'Sarah Chen', deals: 21, revenue: 162800, closeRate: 62 },
  { rank: 3, name: 'Aisha Patel', deals: 19, revenue: 148200, closeRate: 58 },
  { rank: 4, name: 'Marcus Webb', deals: 16, revenue: 124600, closeRate: 54 },
  { rank: 5, name: 'James Park', deals: 14, revenue: 108400, closeRate: 51 },
]
const recentDeals = [
  { rep: 'Sarah Chen', client: 'Miami Auto Group', amount: 8400, service: 'SEO Premium', time: '12m ago', type: 'close' },
  { rep: 'Elena Rossi', client: 'NYC Dental', amount: 12200, service: 'Full Stack', time: '34m ago', type: 'close' },
  { rep: 'Marcus Webb', client: 'Phoenix Roofing', amount: 5600, service: 'PPC Management', time: '1h ago', type: 'close' },
  { rep: 'System', client: 'Lead #8921', amount: 0, service: 'Auto-assigned to Sarah', time: '2m ago', type: 'assign' },
]

const statusBadge = (status: string) => {
  switch (status) {
    case 'on-call': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'available': return 'bg-cyan/10 text-cyan border-cyan/30'
    case 'break': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    default: return 'bg-muted text-muted-foreground'
  }
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg bg-card border border-border/50 shadow-card">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-foreground" style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString?.() || p.value}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [now, setNow] = useState(new Date())
  const [sortBy, setSortBy] = useState<'deals' | 'revenue'>('revenue')
  const { success } = useToast()

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            {greeting()} DJ
          </h2>
          <p className="text-base text-cyan font-semibold mt-0.5">
            Business Growth Expert <span className="text-foreground">&ldquo;BGE&rdquo;</span>
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <CloudSun className="w-4 h-4 text-amber-400" />
            <span>Miami, FL — <span className="text-amber-400 font-medium">84°F</span> Partly Cloudy</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            5 Active Reps
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan text-xs font-medium">
            <Wifi className="w-3 h-3" /> Call Floor Live
          </div>
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue Today', value: 12500, prefix: '$', change: '+18.4%', up: true, icon: DollarSign, color: 'text-cyan' },
          { label: 'Leads Assigned', value: 47, change: '+12', up: true, icon: Users, color: 'text-emerald-400' },
          { label: 'Close Rate', value: 64, suffix: '%', change: '+3.2%', up: true, icon: CheckCircle2, color: 'text-violet' },
          { label: 'Avg Deal Size', value: 8400, prefix: '$', change: '-2.1%', up: false, icon: TrendingUp, color: 'text-amber-400' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center">
                <m.icon className="w-4 h-4 text-cyan" />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono tracking-tight">
              <AnimatedCounter end={m.value} prefix={m.prefix || ''} suffix={m.suffix || ''} />
            </div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${m.up ? 'text-emerald-400' : 'text-amber-400'}`}>
              {m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {m.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts + Live Floor */}
      <div className="grid lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Revenue This Week</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Daily revenue across all reps</p>
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
              <Area type="monotone" dataKey="value" stroke="#00F0FF" strokeWidth={2} fill="url(#revGrad)" />
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
            <p className="text-[10px] text-muted-foreground mt-0.5">Current deal status breakdown</p>
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

      {/* Leaderboard + Recent Deals */}
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
              <h3 className="font-semibold text-foreground text-sm">Leaderboard</h3>
            </div>
            <div className="flex gap-1">
              {(['revenue', 'deals'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${
                    sortBy === s ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {sortedLeaderboard.map((rep) => (
              <div key={rep.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-space-highlight/30 transition-colors">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  rep.rank === 1 ? 'bg-cyan/20 text-cyan' : rep.rank === 2 ? 'bg-violet/20 text-violet' : rep.rank === 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
                }`}>{rep.rank}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{rep.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{rep.deals} deals</span>
                    <span className="text-[10px] text-muted-foreground">{rep.closeRate}% close</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">${(rep.revenue / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-muted-foreground">revenue</p>
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
              <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-2">
            {recentDeals.map((deal, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-space-highlight/30 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${deal.type === 'close' ? 'bg-emerald-500/10' : 'bg-cyan/10'}`}>
                  {deal.type === 'close' ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <PhoneIncoming className="w-4 h-4 text-cyan" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground"><span className="font-medium">{deal.rep}</span> <span className="text-muted-foreground">{deal.type === 'close' ? 'closed' : 'assigned'}</span> <span className="font-medium">{deal.client}</span></p>
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
