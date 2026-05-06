import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle2, Clock, Send, Download, Eye, Plus, X,
  DollarSign, User, Zap, Shield, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AnimatedCounter } from '@/components/AnimatedCounter'

const initialProposals = [
  { id: 'PROP-B001', client: 'Miami Roofing Pros', service: 'SEO Premium', amount: 8400, status: 'sent', date: 'Jul 24, 2025', viewed: 3, myCommission: 2520 },
  { id: 'PROP-B002', client: 'NYC Dental Studio', service: 'Full Stack', amount: 12200, status: 'draft', date: 'Jul 23, 2025', viewed: 0, myCommission: 3660 },
  { id: 'PROP-B003', client: 'Phoenix Auto Repair', service: 'PPC Management', amount: 5600, status: 'signed', date: 'Jul 20, 2025', viewed: 8, myCommission: 1680 },
  { id: 'PROP-B004', client: 'Seattle Coffee Co', service: 'Web Design + SEO', amount: 10500, status: 'sent', date: 'Jul 22, 2025', viewed: 2, myCommission: 3150 },
]

const statusStyles: Record<string, string> = {
  sent: 'bg-cyan/10 text-cyan border-cyan/30',
  viewed: 'bg-violet/10 text-violet border-violet/30',
  signed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  draft: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
}

export default function BGEProposals() {
  const [proposals, setProposals] = useLocalStorage('starz-bge-proposals', initialProposals)
  const [showNew, setShowNew] = useState(false)
  const [newProposal, setNewProposal] = useState({ client: '', service: '', amount: '' })
  const { success, info, warning } = useToast()

  const handleSend = (id: string) => {
    setProposals((prev: any[]) => prev.map((p: any) => p.id === id ? { ...p, status: 'sent' } : p))
    success(`Proposal ${id} sent`)
  }

  const handleDelete = (id: string) => {
    setProposals((prev: any[]) => prev.filter((p: any) => p.id !== id))
    info('Proposal deleted')
  }

  const handleNewProposal = () => {
    if (!newProposal.client || !newProposal.service || !newProposal.amount) {
      warning('All fields are required')
      return
    }
    const id = `PROP-B${String(proposals.length + 1).padStart(3, '0')}`
    const commission = Math.round(Number(newProposal.amount) * 0.3)
    setProposals((prev: any[]) => [...prev, {
      id, client: newProposal.client, service: newProposal.service,
      amount: Number(newProposal.amount), status: 'draft',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      viewed: 0, myCommission: commission,
    }])
    setShowNew(false)
    setNewProposal({ client: '', service: '', amount: '' })
    success(`Proposal ${id} created`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan" />
            My Proposals
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Generate and track your client proposals</p>
        </div>
        <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Proposal
        </Button>
      </div>

      {/* New Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-md shadow-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">New Proposal</h3>
                <button onClick={() => setShowNew(false)} className="p-1 rounded hover:bg-card text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Client name" value={newProposal.client} onChange={(e) => setNewProposal({ ...newProposal, client: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Service" value={newProposal.service} onChange={(e) => setNewProposal({ ...newProposal, service: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Amount ($)" type="number" value={newProposal.amount} onChange={(e) => setNewProposal({ ...newProposal, amount: e.target.value })} className="bg-card border-border/40" />
                <Button className="w-full bg-gradient-primary text-space font-semibold" onClick={handleNewProposal}>Create Proposal</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: proposals.length, icon: FileText, color: 'text-cyan' },
          { label: 'Sent', value: proposals.filter((p: any) => p.status === 'sent' || p.status === 'viewed').length, icon: Send, color: 'text-violet' },
          { label: 'Signed', value: proposals.filter((p: any) => p.status === 'signed').length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'My Commission', value: proposals.filter((p: any) => p.status === 'signed').reduce((a: number, b: any) => a + b.myCommission, 0), prefix: '$', icon: DollarSign, color: 'text-amber-400' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {m.prefix ? <AnimatedCounter end={m.value} prefix={m.prefix} /> : <AnimatedCounter end={m.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/20">
                {['ID', 'Client', 'Service', 'Amount', 'My 30%', 'Status', 'Views', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proposals.map((p: any) => (
                <tr key={p.id} className="border-b border-border/10 hover:bg-space-highlight/20 transition-colors">
                  <td className="px-5 py-3"><span className="text-xs font-mono text-muted-foreground">{p.id}</span></td>
                  <td className="px-5 py-3"><span className="text-sm font-medium text-foreground">{p.client}</span></td>
                  <td className="px-5 py-3"><span className="text-sm text-muted-foreground">{p.service}</span></td>
                  <td className="px-5 py-3"><span className="text-sm font-semibold text-foreground">${p.amount.toLocaleString()}</span></td>
                  <td className="px-5 py-3"><span className="text-sm font-semibold text-emerald-400">${p.myCommission.toLocaleString()}</span></td>
                  <td className="px-5 py-3"><Badge className={`text-[10px] ${statusStyles[p.status]}`}>{p.status}</Badge></td>
                  <td className="px-5 py-3"><span className="text-sm text-muted-foreground">{p.viewed}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => info(`Previewing ${p.id}`)} className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-cyan transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => info(`Downloading ${p.id}`)} className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-violet transition-colors"><Download className="w-4 h-4" /></button>
                      {p.status === 'draft' && <button onClick={() => handleSend(p.id)} className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-emerald-400 transition-colors"><Send className="w-4 h-4" /></button>}
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
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
