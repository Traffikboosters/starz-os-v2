import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Download, ChevronDown, TrendingUp, DollarSign, Users, Target, Calendar, Clock, Star, Zap, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { AnimatedCounter } from '@/components/AnimatedCounter'

const repLeaderboard = [
  { name: 'Elena Rossi', deals: 23, revenue: 218000, closeRate: 68, avgDeal: 9500 },
  { name: 'Sarah Chen', deals: 19, revenue: 185400, closeRate: 61, avgDeal: 9800 },
  { name: 'Marcus Webb', deals: 16, revenue: 134800, closeRate: 54, avgDeal: 8400 },
  { name: 'Aisha Patel', deals: 14, revenue: 128000, closeRate: 58, avgDeal: 9100 },
  { name: 'James Park', deals: 11, revenue: 96700, closeRate: 52, avgDeal: 8800 },
]

const metricCards = [
  { label: 'Total Revenue', value: 762900, change: '+24.3%', prefix: '$', icon: DollarSign, color: 'text-emerald-400' },
  { label: 'Deals Closed', value: 83, change: '+18.6%', icon: Target, color: 'text-cyan' },
  { label: 'Avg Close Rate', value: 59, change: '+3.2%', suffix: '%', icon: TrendingUp, color: 'text-violet' },
  { label: 'New Leads', value: 156, change: '+31.1%', icon: Users, color: 'text-amber-400' },
]

export default function Reports() {
  const [period, setPeriod] = useState('This Month')
  const [sortBy, setSortBy] = useState<'revenue' | 'deals' | 'closeRate'>('revenue')
  const { success, info } = useToast()

  const sorted = [...repLeaderboard].sort((a, b) => (b as any)[sortBy] - (a as any)[sortBy])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan" />
            Reports
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Performance analytics and team insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => { setPeriod(e.target.value); success(`Switched to ${e.target.value}`) }} className="h-8 rounded-lg bg-card border border-border/40 text-xs px-3 text-foreground">
            <option>This Week</option>
            <option>This Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={() => info('Exporting report...')}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow"
          >
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {m.prefix ? `${m.prefix}` : ''}<AnimatedCounter end={m.value} suffix={m.suffix || ''} />
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
              <TrendingUp className="w-3 h-3" /> {m.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden"
      >
        <div className="p-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Rep Leaderboard</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Ranked by {sortBy}</p>
          </div>
          <div className="flex gap-1">
            {(['revenue', 'deals', 'closeRate'] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)} className={`px-2.5 py-1 rounded-lg text-[10px] capitalize transition-all ${sortBy === s ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}>
                {s === 'closeRate' ? 'Close Rate' : s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border/20">
                {['Rank', 'Name', 'Deals', 'Revenue', 'Close Rate', 'Avg Deal'].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((rep, i) => (
                <tr key={rep.name} className="border-t border-border/10 hover:bg-space-highlight/20 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`text-sm font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-muted-foreground' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>#{i + 1}</span>
                  </td>
                  <td className="px-5 py-3"><span className="text-sm font-medium text-foreground">{rep.name}</span></td>
                  <td className="px-5 py-3"><span className="text-sm text-cyan">{rep.deals}</span></td>
                  <td className="px-5 py-3"><span className="text-sm font-semibold text-foreground">${rep.revenue.toLocaleString()}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan to-violet" style={{ width: `${rep.closeRate}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground">{rep.closeRate}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="text-sm text-muted-foreground">${rep.avgDeal.toLocaleString()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Time-based Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid sm:grid-cols-3 gap-4"
      >
        <div className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-cyan" />
            <span className="text-xs font-semibold text-foreground">Avg Response Time</span>
          </div>
          <p className="text-2xl font-bold text-foreground">12 min</p>
          <p className="text-xs text-emerald-400 mt-1"><TrendingUp className="w-3 h-3 inline mr-1" />-3 min vs last month</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-cyan" />
            <span className="text-xs font-semibold text-foreground">Touch to Close</span>
          </div>
          <p className="text-2xl font-bold text-foreground">4.2 touches</p>
          <p className="text-xs text-emerald-400 mt-1"><TrendingUp className="w-3 h-3 inline mr-1" />-0.8 vs last month</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-cyan" />
            <span className="text-xs font-semibold text-foreground">Top Source</span>
          </div>
          <p className="text-2xl font-bold text-foreground">Web Forms</p>
          <p className="text-xs text-muted-foreground mt-1">42% of all closed deals</p>
        </div>
      </motion.div>
    </div>
  )
}
