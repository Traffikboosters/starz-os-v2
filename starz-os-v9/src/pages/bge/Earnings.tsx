import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, TrendingUp, Clock, ArrowUpRight, ArrowDownRight,
  Download, CreditCard, PiggyBank, Target, CheckCircle2, Calendar, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const earningsData = [
  { name: 'W1', commission: 3200, deals: 2 },
  { name: 'W2', commission: 5600, deals: 3 },
  { name: 'W3', commission: 4100, deals: 2 },
  { name: 'W4', commission: 7260, deals: 4 },
]

const initialPayouts = [
  { id: 'PO-001', date: 'Jul 15, 2025', amount: 12500, status: 'paid', method: 'ACH' },
  { id: 'PO-002', date: 'Jul 1, 2025', amount: 9800, status: 'paid', method: 'ACH' },
  { id: 'PO-003', date: 'Jun 15, 2025', amount: 14200, status: 'paid', method: 'ACH' },
  { id: 'PO-004', date: 'Jun 1, 2025', amount: 8900, status: 'paid', method: 'ACH' },
]

const commissionBreakdown = [
  { client: 'Miami Roofing Pros', amount: 8400, myCut: 2520, status: 'closed', date: 'Jul 24' },
  { client: 'Phoenix Auto Repair', amount: 5600, myCut: 1680, status: 'closed', date: 'Jul 20' },
  { client: 'Seattle Coffee Co', amount: 10500, myCut: 3150, status: 'pending', date: 'Jul 22' },
  { client: 'NYC Dental Studio', amount: 12200, myCut: 3660, status: 'draft', date: '-' },
  { client: 'Dallas Fitness Club', amount: 4200, myCut: 1260, status: 'closed', date: 'Jul 18' },
]

const statusBadge = (status: string) => {
  switch (status) {
    case 'closed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'draft': return 'bg-cyan/10 text-cyan border-cyan/30'
    default: return 'bg-muted text-muted-foreground'
  }
}

export default function BGEEarnings() {
  const [payouts] = useLocalStorage('starz-bge-payouts', initialPayouts)
  const [period, setPeriod] = useState('This Month')
  const { success, info } = useToast()

  const totalCommission = commissionBreakdown.reduce((a, b) => a + b.myCut, 0)
  const closedCommission = commissionBreakdown.filter((c) => c.status === 'closed').reduce((a, b) => a + b.myCut, 0)
  const pendingCommission = commissionBreakdown.filter((c) => c.status === 'pending').reduce((a, b) => a + b.myCut, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan" />
            Earnings & Payouts
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Commission tracking and payout history</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => { setPeriod(e.target.value); success(`Switched to ${e.target.value}`) }} className="h-8 rounded-lg bg-card border border-border/40 text-xs px-3 text-foreground">
            <option>This Week</option>
            <option>This Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={() => info('Exporting CSV...')}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Earned', value: closedCommission, prefix: '$', icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Pending', value: pendingCommission, prefix: '$', icon: Clock, color: 'text-amber-400' },
          { label: 'Deals Closed', value: commissionBreakdown.filter((c) => c.status === 'closed').length, icon: Target, color: 'text-cyan' },
          { label: 'Next Payout', value: 15400, prefix: '$', icon: CreditCard, color: 'text-violet' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              <AnimatedCounter end={m.value} prefix={m.prefix || ''} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Earnings Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Commission Trend</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Weekly breakdown</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 rounded-lg">
              <TrendingUp className="w-3 h-3 mr-1" /> +24% this month
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip contentStyle={{ background: '#12121A', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#F8FAFC' }} />
              <Area type="monotone" dataKey="commission" name="Commission" stroke="#00F0FF" strokeWidth={2} fill="url(#earnGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payout Schedule */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <h3 className="font-semibold text-foreground text-sm mb-4">Payout History</h3>
          <div className="space-y-3">
            {payouts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-space-highlight/30 border border-border/20">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{p.id}</p>
                  <p className="text-xs text-muted-foreground">{p.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">${p.amount.toLocaleString()}</p>
                  <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-cyan/5 border border-cyan/20">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-cyan" />
              <p className="text-xs text-cyan">30% commission on every deal</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Payouts processed 1st & 15th of each month</p>
          </div>
        </motion.div>
      </div>

      {/* Commission Breakdown */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden">
        <div className="p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">Commission Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border/20">
                {['Client', 'Deal Amount', 'My 30%', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissionBreakdown.map((c) => (
                <tr key={c.client} className="border-t border-border/10 hover:bg-space-highlight/20 transition-colors">
                  <td className="px-5 py-3"><span className="text-sm font-medium text-foreground">{c.client}</span></td>
                  <td className="px-5 py-3"><span className="text-sm text-muted-foreground">${c.amount.toLocaleString()}</span></td>
                  <td className="px-5 py-3"><span className="text-sm font-bold text-emerald-400">${c.myCut.toLocaleString()}</span></td>
                  <td className="px-5 py-3"><Badge className={`text-[10px] ${statusBadge(c.status)}`}>{c.status}</Badge></td>
                  <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{c.date}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
