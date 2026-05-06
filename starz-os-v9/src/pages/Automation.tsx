import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Zap, Settings, Play, Pause, Clock, Mail, Phone, MessageSquare, ChevronRight,
  ArrowRight, Plus, ToggleLeft, ToggleRight, CheckCircle2, AlertCircle, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AnimatedCounter } from '@/components/AnimatedCounter'

const initialTriggers = [
  { id: 'T-001', name: 'Hot Lead Alert', trigger: 'Lead score > 85', action: 'SMS + Email to assigned rep', status: 'active', runs: 47, lastRun: '2m ago' },
  { id: 'T-002', name: 'Proposal Follow-up', trigger: 'Proposal viewed 3+ times', action: 'Auto-send discount offer', status: 'active', runs: 23, lastRun: '1h ago' },
  { id: 'T-003', name: 'No Activity Warning', trigger: 'No touch in 48h', action: 'Alert manager + reassign', status: 'paused', runs: 12, lastRun: '3h ago' },
  { id: 'T-004', name: 'New Lead Auto-assign', trigger: 'New lead created', action: 'Round-robin assign', status: 'active', runs: 89, lastRun: '5m ago' },
  { id: 'T-005', name: 'Payment Failed', trigger: 'Stripe payment fails', action: 'Notify rep + retry in 24h', status: 'active', runs: 8, lastRun: '6h ago' },
  { id: 'T-006', name: 'Contractor Payout', trigger: 'Deal closes', action: 'Auto-calculate 30% + schedule ACH', status: 'active', runs: 34, lastRun: '1d ago' },
]

const distributionRules = [
  { name: 'Round Robin', active: true, desc: 'Fair rotation across all active reps' },
  { name: 'Performance Weighted', active: false, desc: 'Higher close rate = more leads' },
  { name: 'Territory Based', active: false, desc: 'Assign by geo/vertical' },
  { name: 'Revenue Weighted', active: false, desc: 'Higher deal size = more leads' },
]

export default function Automation() {
  const [triggers, setTriggers] = useLocalStorage('starz-automation', initialTriggers)
  const [rules, setRules] = useLocalStorage('starz-dist-rules', distributionRules)
  const { success, info } = useToast()

  const toggleTrigger = (id: string) => {
    setTriggers((prev: any[]) => prev.map((t: any) => {
      if (t.id !== id) return t
      const newStatus = t.status === 'active' ? 'paused' : 'active'
      success(`Trigger ${t.name} ${newStatus}`)
      return { ...t, status: newStatus }
    }))
  }

  const activateRule = (name: string) => {
    setRules((prev: any[]) => prev.map((r: any) => ({ ...r, active: r.name === name })))
    success(`Switched to ${name}`)
  }

  const runTrigger = (id: string) => {
    setTriggers((prev: any[]) => prev.map((t: any) => t.id === id ? { ...t, runs: t.runs + 1, lastRun: 'just now' } : t))
    info(`Trigger ${id} executed`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan" />
            Automation Hub
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Trigger workflows, smart actions, and distribution rules</p>
        </div>
        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 rounded-lg">
          <CheckCircle2 className="w-3 h-3 mr-1" /> {triggers.filter((t: any) => t.status === 'active').length} Active
        </Badge>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Triggers', value: triggers.filter((t: any) => t.status === 'active').length, icon: Zap, color: 'text-cyan' },
          { label: 'Total Runs Today', value: triggers.reduce((a: number, b: any) => a + b.runs, 0), icon: Play, color: 'text-emerald-400' },
          { label: 'Paused', value: triggers.filter((t: any) => t.status === 'paused').length, icon: Pause, color: 'text-amber-400' },
          { label: 'Avg Response', value: 12, suffix: ' min', icon: Clock, color: 'text-violet' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {m.suffix ? `${m.value}${m.suffix}` : <AnimatedCounter end={m.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Triggers List */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <h3 className="font-semibold text-foreground text-sm mb-4">Active Triggers</h3>
          <div className="space-y-2">
            {triggers.map((t: any) => (
              <div key={t.id} className="p-4 rounded-xl bg-space-highlight/30 border border-border/20 hover:border-cyan/20 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${t.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{t.name}</span>
                        <Badge className={`text-[10px] ${t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>{t.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>When: <span className="text-cyan">{t.trigger}</span></span>
                        <ArrowRight className="w-3 h-3" />
                        <span>Then: <span className="text-violet">{t.action}</span></span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                        <span>{t.runs} runs</span>
                        <span>Last: {t.lastRun}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => runTrigger(t.id)} className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-cyan transition-colors" title="Run now">
                      <Play className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleTrigger(t.id)} className={`p-1.5 rounded transition-colors ${t.status === 'active' ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-amber-400 hover:bg-amber-400/10'}`} title="Toggle">
                      {t.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Distribution Rules */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <h3 className="font-semibold text-foreground text-sm mb-4">Distribution Rules</h3>
          <div className="space-y-2">
            {rules.map((rule: any) => (
              <div key={rule.name} onClick={() => activateRule(rule.name)} className={`p-3 rounded-xl border transition-all cursor-pointer ${rule.active ? 'border-cyan/30 bg-cyan/5' : 'border-border/20 hover:border-cyan/20'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{rule.name}</span>
                  {rule.active && <div className="w-2 h-2 rounded-full bg-cyan" />}
                </div>
                <p className="text-[10px] text-muted-foreground">{rule.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border/20">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Channel Actions</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-space-highlight/30 transition-colors cursor-pointer" onClick={() => info('SMS templates editor')}>
                <MessageSquare className="w-4 h-4 text-cyan" />
                <span className="text-sm text-foreground">SMS Templates</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-space-highlight/30 transition-colors cursor-pointer" onClick={() => info('Email sequences editor')}>
                <Mail className="w-4 h-4 text-violet" />
                <span className="text-sm text-foreground">Email Sequences</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-space-highlight/30 transition-colors cursor-pointer" onClick={() => info('Voicemail scripts editor')}>
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-foreground">Voicemail Scripts</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
