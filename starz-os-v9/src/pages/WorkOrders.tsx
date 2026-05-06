import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, CheckCircle2, Clock, AlertCircle, FileText,
  PenLine, Download, Send, ChevronRight, DollarSign,
  Calendar, User, Zap, Shield, BarChart3, Star, Plus,
  ChevronDown, ChevronUp, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const initialWorkOrders = [
  { id: 'WO-001', client: 'Miami Auto Group', service: 'SEO Premium', amount: 8400, status: 'active', progress: 75, startDate: 'Jul 24, 2025', dueDate: 'Aug 24, 2025', rep: 'Sarah Chen', tasks: 12, completed: 9 },
  { id: 'WO-002', client: 'NYC Dental', service: 'Full Stack Marketing', amount: 12200, status: 'active', progress: 45, startDate: 'Jul 23, 2025', dueDate: 'Sep 23, 2025', rep: 'Elena Rossi', tasks: 20, completed: 9 },
  { id: 'WO-003', client: 'Phoenix Roofing', service: 'PPC Management', amount: 5600, status: 'pending', progress: 0, startDate: '-', dueDate: 'Aug 15, 2025', rep: 'Marcus Webb', tasks: 8, completed: 0 },
  { id: 'WO-004', client: 'SF Tech Startup', service: 'Web Design + SEO', amount: 15000, status: 'active', progress: 30, startDate: 'Jul 20, 2025', dueDate: 'Oct 20, 2025', rep: 'Sarah Chen', tasks: 25, completed: 7 },
  { id: 'WO-005', client: 'Chicago Law Firm', service: 'Local SEO', amount: 9200, status: 'completed', progress: 100, startDate: 'Jun 15, 2025', dueDate: 'Jul 15, 2025', rep: 'Aisha Patel', tasks: 10, completed: 10 },
]

const statusStyles: Record<string, string> = {
  active: 'bg-cyan/10 text-cyan border-cyan/30',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
}

const repList = ['Sarah Chen', 'Elena Rossi', 'Marcus Webb', 'Aisha Patel', 'James Park']

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useLocalStorage('starz-workorders', initialWorkOrders)
  const [showNew, setShowNew] = useState(false)
  const [newWO, setNewWO] = useState({ client: '', service: '', amount: '', dueDate: '', rep: repList[0], tasks: '10' })
  const { success, warning, info } = useToast()

  const handleNewWO = () => {
    if (!newWO.client || !newWO.service || !newWO.amount) {
      warning('Client, service, and amount are required')
      return
    }
    const id = `WO-${String(workOrders.length + 1).padStart(3, '0')}`
    setWorkOrders((prev: any[]) => [...prev, {
      id,
      client: newWO.client,
      service: newWO.service,
      amount: Number(newWO.amount),
      status: 'pending',
      progress: 0,
      startDate: '-',
      dueDate: newWO.dueDate || 'Aug 30, 2025',
      rep: newWO.rep,
      tasks: Number(newWO.tasks) || 10,
      completed: 0,
    }])
    setShowNew(false)
    setNewWO({ client: '', service: '', amount: '', dueDate: '', rep: repList[0], tasks: '10' })
    success(`Work order ${id} created`)
  }

  const handleProgressUpdate = (id: string) => {
    setWorkOrders((prev: any[]) => prev.map((wo: any) => {
      if (wo.id !== id) return wo
      const newCompleted = Math.min(wo.completed + 1, wo.tasks)
      const newProgress = Math.round((newCompleted / wo.tasks) * 100)
      return { ...wo, completed: newCompleted, progress: newProgress, status: newProgress === 100 ? 'completed' : wo.status === 'pending' ? 'active' : wo.status }
    }))
    info('Progress updated')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan" />
            Work Orders
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Active projects, delivery tracking, and milestones</p>
        </div>
        <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Work Order
        </Button>
      </div>

      {/* New WO Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-md shadow-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">New Work Order</h3>
                <button onClick={() => setShowNew(false)} className="p-1 rounded hover:bg-card text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Client name" value={newWO.client} onChange={(e) => setNewWO({ ...newWO, client: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Service name" value={newWO.service} onChange={(e) => setNewWO({ ...newWO, service: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Amount ($)" type="number" value={newWO.amount} onChange={(e) => setNewWO({ ...newWO, amount: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Due date (e.g. Aug 30, 2025)" value={newWO.dueDate} onChange={(e) => setNewWO({ ...newWO, dueDate: e.target.value })} className="bg-card border-border/40" />
                <select value={newWO.rep} onChange={(e) => setNewWO({ ...newWO, rep: e.target.value })} className="w-full h-9 rounded-md bg-card border border-border/40 text-sm px-3 text-foreground">
                  {repList.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <Input placeholder="Number of tasks" type="number" value={newWO.tasks} onChange={(e) => setNewWO({ ...newWO, tasks: e.target.value })} className="bg-card border-border/40" />
                <Button className="w-full bg-gradient-primary text-space font-semibold" onClick={handleNewWO}>Create Work Order</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: workOrders.filter((wo: any) => wo.status === 'active').length, icon: Zap, color: 'text-cyan' },
          { label: 'Pending', value: workOrders.filter((wo: any) => wo.status === 'pending').length, icon: Clock, color: 'text-amber-400' },
          { label: 'Completed', value: workOrders.filter((wo: any) => wo.status === 'completed').length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'At Risk', value: workOrders.filter((wo: any) => wo.status === 'active' && wo.progress < 30).length, icon: AlertCircle, color: 'text-red-400' },
        ].map((m, i) => (
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
            <div className="text-xl font-bold text-foreground">{m.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {workOrders.map((wo: any, i: number) => (
          <motion.div
            key={wo.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl bg-card border border-border/40 card-glow p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-mono text-muted-foreground">{wo.id}</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5">{wo.client}</h3>
                <p className="text-xs text-muted-foreground">{wo.service}</p>
              </div>
              <Badge className={`text-[10px] ${statusStyles[wo.status]}`}>{wo.status}</Badge>
            </div>

            <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${wo.amount.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {wo.dueDate}</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {wo.rep}</span>
            </div>

            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-semibold text-foreground">{wo.progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  wo.progress >= 80 ? 'bg-emerald-400' : wo.progress >= 40 ? 'bg-cyan' : 'bg-amber-400'
                }`}
                style={{ width: `${wo.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground">{wo.completed} of {wo.tasks} tasks completed</p>
              {wo.status !== 'completed' && (
                <Button size="sm" variant="outline" className="h-6 text-[10px] border-cyan/30 text-cyan hover:bg-cyan/5 px-2" onClick={() => handleProgressUpdate(wo.id)}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Complete Task
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
