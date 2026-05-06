import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Radio, Phone, CheckCircle2, CreditCard, Briefcase, CheckSquare,
  TrendingUp, Users, Zap, Activity, DollarSign, Target, Clock,
  Flame, BarChart3, Star, ArrowUpRight, ArrowDownRight, Radio as RadioIcon} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { AnimatedCounter } from '@/components/AnimatedCounter'

const initialFeed = [
  { id: 1, type: 'call', description: 'Sarah Chen closed deal with Miami Auto Group — $8,400', time: '2m ago', icon: Phone, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 2, type: 'payment', description: 'Payment received from Phoenix Roofing — $5,600', time: '5m ago', icon: CreditCard, color: 'text-cyan', bg: 'bg-cyan/10' },
  { id: 3, type: 'work_order', description: 'Work order WO-007 created for Seattle Coffee Co', time: '8m ago', icon: Briefcase, color: 'text-violet', bg: 'bg-violet/10' },
  { id: 4, type: 'deal_closed', description: 'Elena Rossi signed NYC Dental — $12,200', time: '12m ago', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 5, type: 'task_completed', description: 'Keyword research completed for Phoenix Roofing', time: '15m ago', icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 6, type: 'seo_growth', description: 'SF Tech Startup moved to #1 for "web design nyc"', time: '18m ago', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 7, type: 'call', description: 'Marcus Webb on call with Dallas Realty — 4m 32s', time: '20m ago', icon: Phone, color: 'text-cyan', bg: 'bg-cyan/10' },
  { id: 8, type: 'payment', description: 'Stripe payout processed for DJ — $2,520 commission', time: '25m ago', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 9, type: 'work_order', description: 'Work order WO-003 escalated — overdue by 2 days', time: '30m ago', icon: Briefcase, color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 10, type: 'deal_closed', description: 'Aisha Patel closed Chicago Law — $9,200', time: '34m ago', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 11, type: 'call', description: 'James Park left voicemail for Austin Fitness', time: '40m ago', icon: Phone, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 12, type: 'seo_growth', description: 'Seattle Coffee Co jumped 7 positions for target keyword', time: '45m ago', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
]

const leaderboard = [
  { name: 'Elena Rossi', deals: 23, revenue: 218000, closeRate: 68, status: 'online' },
  { name: 'Sarah Chen', deals: 19, revenue: 185400, closeRate: 61, status: 'on_call' },
  { name: 'Marcus Webb', deals: 16, revenue: 134800, closeRate: 54, status: 'online' },
  { name: 'Aisha Patel', deals: 14, revenue: 128000, closeRate: 58, status: 'online' },
  { name: 'James Park', deals: 11, revenue: 96700, closeRate: 52, status: 'away' },
]

const liveStats = [
  { label: 'Calls Active', value: 3, icon: Phone, color: 'text-cyan' },
  { label: 'Deals Today', value: 4, icon: CheckCircle2, color: 'text-emerald-400' },
  { label: 'Revenue Today', value: 47800, prefix: '$', icon: DollarSign, color: 'text-amber-400' },
  { label: 'WOs In Progress', value: 7, icon: Briefcase, color: 'text-violet' },
]

export default function CommandCenter() {
  const [feed, setFeed] = useState(initialFeed)
  const [now, setNow] = useState(new Date())
  const { info } = useToast()

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const newEvents = [
        { type: 'call', description: `New call started — ${['Miami Auto', 'NYC Dental', 'Phoenix Roofing'][Math.floor(Math.random()*3)]}`, icon: Phone, color: 'text-cyan', bg: 'bg-cyan/10' },
        { type: 'payment', description: `Payment processed — $${[2400, 5600, 8400][Math.floor(Math.random()*3)]}`, icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { type: 'deal_closed', description: `Deal closed by ${['Sarah', 'Elena', 'Marcus'][Math.floor(Math.random()*3)]}`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { type: 'task_completed', description: 'Task completed — keyword optimization', icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
      ]
      const randomEvent = newEvents[Math.floor(Math.random() * newEvents.length)]
      setFeed(prev => [{ id: Date.now(), ...randomEvent, time: 'just now' }, ...prev].slice(0, 20))
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-400 animate-pulse" />
            Command Center
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time operational intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-pulse">
            <RadioIcon className="w-3 h-3" /> LIVE
          </div>
          <span className="text-xs font-mono text-muted-foreground">{now.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {liveStats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {s.prefix ? `${s.prefix}` : ''}<AnimatedCounter end={s.value} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Live Feed */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan" /> Live Feed
            </h3>
            <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/5 rounded-lg animate-pulse">
              <RadioIcon className="w-3 h-3 mr-1" /> Real-time
            </Badge>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {feed.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i < 5 ? i * 0.03 : 0 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-space-highlight/30 transition-all cursor-pointer"
                  onClick={() => info(item.description)}
                >
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan" /> Rep Leaderboard
          </h3>
          <div className="space-y-3">
            {leaderboard.map((rep, i) => (
              <div key={rep.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-space-highlight/30 transition-all cursor-pointer" onClick={() => info(`${rep.name}: ${rep.deals} deals, $${rep.revenue.toLocaleString()}`)}>
                <span className={`text-sm font-bold w-5 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-muted-foreground' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>#{i + 1}</span>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                  backgroundColor: rep.status === 'online' ? '#34D399' : rep.status === 'on_call' ? '#00F0FF' : '#F59E0B'
                }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{rep.name}</p>
                  <p className="text-[10px] text-muted-foreground">{rep.deals} deals · {rep.closeRate}% close</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400">${(rep.revenue / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
