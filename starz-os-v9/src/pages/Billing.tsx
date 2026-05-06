import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, AlertCircle, FileText, Download, Send,
  ChevronRight, Zap, Shield, BarChart3, Star, Plus, MoreHorizontal,
  Wallet, Receipt, PiggyBank, Banknote, X, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const revenueData = [
  { name: 'Jan', revenue: 42000, expenses: 28000 },
  { name: 'Feb', revenue: 58000, expenses: 32000 },
  { name: 'Mar', revenue: 49000, expenses: 30000 },
  { name: 'Apr', revenue: 72000, expenses: 38000 },
  { name: 'May', revenue: 68000, expenses: 35000 },
  { name: 'Jun', revenue: 91000, expenses: 42000 },
  { name: 'Jul', revenue: 85000, expenses: 40000 },
]

const initialTransactions = [
  { id: 'PAY-001', client: 'Miami Auto Group', amount: 8400, status: 'completed', method: 'Stripe', date: 'Jul 24, 2025', type: 'incoming' },
  { id: 'PAY-002', client: 'NYC Dental', amount: 12200, status: 'completed', method: 'Stripe', date: 'Jul 23, 2025', type: 'incoming' },
  { id: 'PAY-003', client: 'Phoenix Roofing', amount: 5600, status: 'pending', method: 'Stripe', date: 'Jul 23, 2025', type: 'incoming' },
  { id: 'PAY-004', client: 'SF Tech Startup', amount: 15000, status: 'completed', method: 'Wire', date: 'Jul 22, 2025', type: 'incoming' },
  { id: 'PAY-005', client: 'Chicago Law Firm', amount: 9200, status: 'failed', method: 'Stripe', date: 'Jul 22, 2025', type: 'incoming' },
  { id: 'PAY-006', client: 'Platform Payout', amount: 45000, status: 'completed', method: 'ACH', date: 'Jul 21, 2025', type: 'outgoing' },
]

const statusStyles: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  failed: 'bg-red-500/10 text-red-400 border-red-500/30',
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg bg-card border border-border/50 shadow-card">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: ${p.value?.toLocaleString()}</p>
      ))}
    </div>
  )
}

export default function Billing() {
  const [period, setPeriod] = useState('month')
  const [transactions, setTransactions] = useLocalStorage('starz-transactions', initialTransactions)
  const [showInvoice, setShowInvoice] = useState(false)
  const [newInvoice, setNewInvoice] = useState({ client: '', amount: '', description: '' })
  const [processing, setProcessing] = useState(false)
  const { success, info, warning } = useToast()

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'invoice':
        setShowInvoice(true)
        break
      case 'payout':
        info('Payout form opening...')
        break
      case 'statements':
        info('Generating monthly statement...')
        break
      case 'savings':
        success('Savings goal updated: $500K by Q4')
        break
    }
  }

  const handleCreateInvoice = () => {
    if (!newInvoice.client || !newInvoice.amount) {
      warning('Client and amount are required')
      return
    }
    const id = `PAY-${String(transactions.length + 1).padStart(3, '0')}`
    setTransactions((prev: any[]) => [{
      id,
      client: newInvoice.client,
      amount: Number(newInvoice.amount),
      status: 'pending',
      method: 'Stripe',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'incoming',
    }, ...prev])
    setShowInvoice(false)
    setNewInvoice({ client: '', amount: '', description: '' })
    success(`Invoice ${id} created`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan" />
            Billing & Revenue
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Payment tracking, payouts, and revenue analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={() => info('Exporting data...')}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold" onClick={() => setShowInvoice(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Invoice
          </Button>
        </div>
      </div>

      {/* New Invoice Modal */}
      <AnimatePresence>
        {showInvoice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInvoice(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-md shadow-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Create Invoice</h3>
                <button onClick={() => setShowInvoice(false)} className="p-1 rounded hover:bg-card text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Client name" value={newInvoice.client} onChange={(e) => setNewInvoice({ ...newInvoice, client: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Amount ($)" type="number" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Description" value={newInvoice.description} onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })} className="bg-card border-border/40" />
                <Button className="w-full bg-gradient-primary text-space font-semibold" onClick={handleCreateInvoice}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Invoice'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: 468200, prefix: '$', change: '+24.3%', up: true, icon: DollarSign },
          { label: 'MRR', value: 84200, prefix: '$', change: '+8.7%', up: true, icon: TrendingUp },
          { label: 'Pending', value: 20800, prefix: '$', change: '+3', up: true, icon: Clock },
          { label: 'Payouts', value: 45000, prefix: '$', change: '-5.2%', up: false, icon: Wallet },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow"
          >
            <div className="flex items-center gap-2 mb-2">
              <m.icon className="w-4 h-4 text-cyan" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              <AnimatedCounter end={m.value} prefix={m.prefix} />
            </div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${m.up ? 'text-emerald-400' : 'text-amber-400'}`}>
              {m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {m.change}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Revenue vs Expenses</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Monthly financial overview</p>
            </div>
            <div className="flex gap-1">
              {['week', 'month', 'quarter'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs capitalize transition-all ${
                    period === p ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#00F0FF" strokeWidth={2} fill="url(#revG)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2} fill="url(#expG)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <h3 className="font-semibold text-foreground text-sm mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { icon: FileText, label: 'Create Invoice', desc: 'Generate new client invoice', action: 'invoice' },
              { icon: Send, label: 'Send Payout', desc: 'Process partner payment', action: 'payout' },
              { icon: Receipt, label: 'View Statements', desc: 'Monthly financial reports', action: 'statements' },
              { icon: PiggyBank, label: 'Set Savings Goal', desc: 'Target: $500K by Q4', action: 'savings' },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => handleQuickAction(a.action)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-space-highlight/40 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0">
                  <a.icon className="w-4 h-4 text-cyan" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden"
      >
        <div className="p-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Recent Transactions</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Last 30 days</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-cyan hover:text-cyan hover:bg-cyan/5 h-7" onClick={() => info('Viewing all transactions...')}>
            View all
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border/20">
                {['ID', 'Client', 'Amount', 'Status', 'Method', 'Date', ''].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id} className="border-t border-border/10 hover:bg-space-highlight/20 transition-colors">
                  <td className="px-5 py-3"><span className="text-xs font-mono text-muted-foreground">{t.id}</span></td>
                  <td className="px-5 py-3"><span className="text-sm font-medium text-foreground">{t.client}</span></td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-semibold ${t.type === 'incoming' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {t.type === 'incoming' ? '+' : '-'}${t.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={`text-[10px] ${statusStyles[t.status]}`}>{t.status}</Badge>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{t.method}</span></td>
                  <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{t.date}</span></td>
                  <td className="px-5 py-3">
                    <button className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground transition-colors" onClick={() => info(`Details for ${t.id}`)}>
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
