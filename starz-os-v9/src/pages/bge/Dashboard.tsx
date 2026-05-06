import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Target, Phone, BarChart3, CheckCircle2, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, Flame, Zap, Star, Clock,
  MessageSquare, Mail, UserCheck, Award, ChevronRight, Sparkles,
  Lock, AlertCircle, Wifi, FileText, Bot, CloudSun
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { MagneticButton } from '@/components/MagneticButton'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const myLeadsToday = 7
const activeConversations = 4
const pipelineDeals = 12
const closedDealsMTD = 8
const revenueGenerated = 67200
const closeRate = 64

const commissionEarned = 20160
const pendingCommission = 8400
const paidCommission = 11760

const myLeads = [
  { id: 'L-9201', business: 'Miami Roofing Pros', phone: '(305) 555-0142', score: 92, status: 'hot', lastAction: '2h ago', assigned: 'Today', value: 8400 },
  { id: 'L-9202', business: 'NYC Dental Studio', phone: '(212) 555-0198', score: 88, status: 'hot', lastAction: '4h ago', assigned: 'Today', value: 12200 },
  { id: 'L-9203', business: 'Phoenix Auto Repair', phone: '(602) 555-0112', score: 74, status: 'warm', lastAction: '1d ago', assigned: 'Yesterday', value: 5600 },
  { id: 'L-9204', business: 'Dallas Fitness Club', phone: '(214) 555-0167', score: 67, status: 'warm', lastAction: '6h ago', assigned: 'Today', value: 4200 },
  { id: 'L-9205', business: 'Seattle Coffee Co', phone: '(206) 555-0156', score: 95, status: 'hot', lastAction: '30m ago', assigned: 'Today', value: 10500 },
  { id: 'L-9206', business: 'Chicago Law Partners', phone: '(312) 555-0134', score: 58, status: 'cold', lastAction: '2d ago', assigned: 'Yesterday', value: 9200 },
]

const recentActivity = [
  { type: 'call', text: 'Called Miami Roofing Pros — spoke with Mike, scheduled follow-up', time: '12m ago', icon: Phone, color: 'text-cyan' },
  { type: 'email', text: 'Sent proposal to NYC Dental ($12,200)', time: '34m ago', icon: Mail, color: 'text-violet' },
  { type: 'close', text: 'Closed Phoenix Auto Repair — $5,600 deal won!', time: '1h ago', icon: CheckCircle2, color: 'text-emerald-400' },
  { type: 'lead', text: 'New lead assigned: Seattle Coffee Co (Score: 95)', time: '2h ago', icon: Star, color: 'text-amber-400' },
]

const performanceData = [
  { name: 'W1', revenue: 12400 },
  { name: 'W2', revenue: 18600 },
  { name: 'W3', revenue: 15200 },
  { name: 'W4', revenue: 21000 },
]

const statusStyles: Record<string, string> = {
  hot: 'bg-red-500/10 text-red-400 border-red-500/30',
  warm: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  cold: 'bg-cyan/10 text-cyan border-cyan/30',
}

export default function BGEDashboard() {
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

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

  return (
    <div className="space-y-6">
      {/* Welcome + Status */}
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Wifi className="w-3 h-3" /> Commission Tier: 30%
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan text-xs font-medium">
            <Zap className="w-3 h-3" /> {myLeadsToday} New Leads
          </div>
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Leads Today', value: myLeadsToday, icon: Target, color: 'text-cyan', suffix: '' },
          { label: 'Active Convos', value: activeConversations, icon: MessageSquare, color: 'text-violet', suffix: '' },
          { label: 'In Pipeline', value: pipelineDeals, icon: BarChart3, color: 'text-amber-400', suffix: '' },
          { label: 'Closed MTD', value: closedDealsMTD, icon: CheckCircle2, color: 'text-emerald-400', suffix: '' },
          { label: 'Revenue', value: revenueGenerated, prefix: '$', icon: DollarSign, color: 'text-cyan', suffix: '' },
          { label: 'Close Rate', value: closeRate, suffix: '%', icon: TrendingUp, color: 'text-emerald-400' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow"
          >
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono tracking-tight">
              <AnimatedCounter end={m.value} prefix={m.prefix || ''} suffix={m.suffix} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lead Flow Pipeline + My Leads */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Lead Flow Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-cyan" />
            <h3 className="font-semibold text-foreground text-sm">Lead Flow Pipeline</h3>
          </div>
          <div className="space-y-2">
            {[
              { stage: 'Scraper', desc: '47 leads captured', active: true },
              { stage: 'Steve Score', desc: '32 qualified (≥60)', active: true },
              { stage: 'Assigned', desc: `${myLeadsToday} to you today`, active: true },
              { stage: 'Contacted', desc: '4 active conversations', active: true },
              { stage: 'Proposal Sent', desc: '6 pending signatures', active: true },
              { stage: 'Payment', desc: '8 closed this month', active: true },
              { stage: 'Work Order', desc: '5 in fulfillment', active: false },
            ].map((step, i) => (
              <div key={step.stage} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${step.active ? 'bg-cyan' : 'bg-muted'}`} />
                  {i < 6 && <div className={`w-px h-4 ${step.active ? 'bg-cyan/30' : 'bg-border'}`} />}
                </div>
                <div className={`flex-1 p-2.5 rounded-lg border ${step.active ? 'border-cyan/20 bg-cyan/5' : 'border-border/20 bg-muted/30'}`}>
                  <p className={`text-sm font-medium ${step.active ? 'text-foreground' : 'text-muted-foreground'}`}>{step.stage}</p>
                  <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-amber-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Work Orders: Read-only (fulfillment team)
            </p>
          </div>
        </motion.div>

        {/* My Leads */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan" />
              <h3 className="font-semibold text-foreground text-sm">My Leads</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-cyan hover:text-cyan hover:bg-cyan/5 h-7"
              onClick={() => navigate('/bge/leads')}
            >
              View all <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {myLeads.slice(0, 4).map((lead) => (
              <div
                key={lead.id}
                className="p-4 rounded-xl bg-space-highlight/30 border border-border/20 hover:border-cyan/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">{lead.id}</span>
                  <Badge className={`text-[10px] ${statusStyles[lead.status]}`}>
                    {lead.status}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-foreground">{lead.business}</p>
                <p className="text-xs text-muted-foreground mb-2">{lead.phone}</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-cyan" />
                    <span className="text-xs text-cyan font-semibold">{lead.score}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{lead.assigned}</span>
                </div>
                <div className="flex gap-1.5">
                  <button className="flex-1 py-1.5 rounded-lg bg-cyan/10 text-cyan text-xs font-medium hover:bg-cyan/20 transition-colors flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3" /> Call
                  </button>
                  <button className="flex-1 py-1.5 rounded-lg bg-violet/10 text-violet text-xs font-medium hover:bg-violet/20 transition-colors flex items-center justify-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </button>
                  <button className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Text
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Commission + Activity + Chart */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Commission Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-cyan" />
            <h3 className="font-semibold text-foreground text-sm">My Earnings</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan/10 to-violet/10 border border-cyan/20">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Earned</p>
              <p className="text-3xl font-extrabold text-foreground">
                $<AnimatedCounter end={commissionEarned} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">30% commission rate</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 p-3 rounded-xl bg-space-highlight/30 border border-border/20">
                <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                <p className="text-lg font-bold text-amber-400">${pendingCommission.toLocaleString()}</p>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-space-highlight/30 border border-border/20">
                <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
                <p className="text-lg font-bold text-emerald-400">${paidCommission.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            className="w-full mt-4 bg-gradient-primary text-space text-xs font-semibold"
            onClick={() => navigate('/bge/earnings')}
          >
            View Full Earnings <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </motion.div>

        {/* Weekly Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <h3 className="font-semibold text-foreground text-sm mb-1">Revenue This Month</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Your closed deal revenue</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip contentStyle={{ background: '#12121A', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#F8FAFC' }} />
              <Area type="monotone" dataKey="revenue" stroke="#00F0FF" strokeWidth={2} fill="url(#perfGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-cyan" />
            <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-space-highlight/40 flex items-center justify-center flex-shrink-0">
                  <a.icon className={`w-4 h-4 ${a.color}`} />
                </div>
                <div>
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-[10px] text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Start PowerDial', icon: Phone, path: '/bge/powerdial', gradient: 'bg-gradient-to-r from-cyan to-violet' },
          { label: 'Generate Proposal', icon: FileText, path: '/bge/proposals', gradient: 'bg-gradient-to-r from-violet to-cyan' },
          { label: 'View Pipeline', icon: BarChart3, path: '/bge/pipeline', gradient: 'bg-gradient-to-r from-emerald-400 to-cyan' },
          { label: 'Ask Steve', icon: Bot, path: '/bge/steve', gradient: 'bg-gradient-to-r from-amber-400 to-red-400' },
        ].map((action) => (
          <motion.button
            key={action.label}
            onClick={() => navigate(action.path)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-4 rounded-2xl ${action.gradient} text-space font-bold text-sm hover:shadow-card-hover transition-all`}
          >
            <div className="flex items-center gap-3">
              <action.icon className="w-5 h-5" />
              {action.label}
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
