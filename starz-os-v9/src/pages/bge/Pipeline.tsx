import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, ArrowRight, DollarSign, Clock, User, CheckCircle2,
  XCircle, FileText, Phone, ChevronRight, Flame, TrendingUp,
  ChevronLeft, ChevronUp, ChevronDownIcon
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const stages = [
  { id: 'new', label: 'New', color: 'border-cyan/30 bg-cyan/5' },
  { id: 'contacted', label: 'Contacted', color: 'border-violet/30 bg-violet/5' },
  { id: 'interested', label: 'Interested', color: 'border-amber-500/30 bg-amber-500/5' },
  { id: 'proposal', label: 'Proposal Sent', color: 'border-emerald-500/30 bg-emerald-500/5' },
  { id: 'won', label: 'Closed Won', color: 'border-emerald-500/30 bg-emerald-500/10' },
  { id: 'lost', label: 'Closed Lost', color: 'border-red-500/30 bg-red-500/5' },
]

const stageOrder = ['new', 'contacted', 'interested', 'proposal', 'won', 'lost']

const initialDeals = [
  { id: 'D-001', business: 'Miami Roofing Pros', contact: 'Mike Rodriguez', value: 8400, stage: 'new', score: 92, lastAction: 'Assigned today' },
  { id: 'D-002', business: 'NYC Dental Studio', contact: 'Dr. Jennifer Walsh', value: 12200, stage: 'contacted', score: 88, lastAction: 'Email sent 2h ago' },
  { id: 'D-003', business: 'Seattle Coffee Co', contact: 'Robert Kim', value: 10500, stage: 'interested', score: 95, lastAction: 'Call scheduled tomorrow' },
  { id: 'D-004', business: 'Phoenix Auto Repair', contact: 'Carlos Mendez', value: 5600, stage: 'won', score: 74, lastAction: 'Closed 3h ago' },
  { id: 'D-005', business: 'Dallas Fitness Club', contact: 'Angela Torres', value: 4200, stage: 'proposal', score: 67, lastAction: 'Proposal sent 1d ago' },
  { id: 'D-006', business: 'Chicago Law Partners', contact: 'David Park', value: 9200, stage: 'lost', score: 58, lastAction: 'Lost 2d ago — budget' },
  { id: 'D-007', business: 'Denver Real Estate', contact: 'Tom Bradley', value: 7500, stage: 'new', score: 79, lastAction: 'Assigned today' },
  { id: 'D-008', business: 'Austin Food Truck', contact: 'Maria Gonzalez', value: 3800, stage: 'contacted', score: 81, lastAction: 'Text 4h ago' },
]

export default function BGEPipeline() {
  const [deals, setDeals] = useLocalStorage('starz-bge-pipeline', initialDeals)
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const { success, info } = useToast()

  const stageDeals = (stageId: string) => deals.filter((d: any) => d.stage === stageId)

  const moveDeal = (dealId: string, direction: 'forward' | 'backward') => {
    setDeals((prev: any[]) => prev.map((d: any) => {
      if (d.id !== dealId) return d
      const currentIdx = stageOrder.indexOf(d.stage)
      if (direction === 'forward' && currentIdx < stageOrder.length - 1) {
        const newStage = stageOrder[currentIdx + 1]
        return { ...d, stage: newStage, lastAction: `Moved to ${stages.find(s => s.id === newStage)?.label}` }
      }
      if (direction === 'backward' && currentIdx > 0) {
        const newStage = stageOrder[currentIdx - 1]
        return { ...d, stage: newStage, lastAction: `Moved back to ${stages.find(s => s.id === newStage)?.label}` }
      }
      return d
    }))
    info('Deal stage updated')
  }

  const pipelineTotals: Record<string, number> = {
    new: stageDeals('new').length,
    contacted: stageDeals('contacted').length,
    interested: stageDeals('interested').length,
    proposal: stageDeals('proposal').length,
    won: stageDeals('won').length,
    lost: stageDeals('lost').length,
  }

  const pipelineValue: Record<string, number> = {
    new: stageDeals('new').reduce((a: number, b: any) => a + b.value, 0),
    contacted: stageDeals('contacted').reduce((a: number, b: any) => a + b.value, 0),
    interested: stageDeals('interested').reduce((a: number, b: any) => a + b.value, 0),
    proposal: stageDeals('proposal').reduce((a: number, b: any) => a + b.value, 0),
    won: stageDeals('won').reduce((a: number, b: any) => a + b.value, 0),
    lost: stageDeals('lost').reduce((a: number, b: any) => a + b.value, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan" />
            Deal Pipeline
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Click arrows on deal cards to move between stages</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle2 className="w-3 h-3" /> {pipelineTotals.won} Won (${pipelineValue.won.toLocaleString()})
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <XCircle className="w-3 h-3" /> {pipelineTotals.lost} Lost (${pipelineValue.lost.toLocaleString()})
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stages.map((stage) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border ${stage.color} p-3 min-h-[200px]`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{stage.label}</h3>
                <span className="text-[10px] text-muted-foreground">({pipelineTotals[stage.id] || 0})</span>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">${(pipelineValue[stage.id] || 0).toLocaleString()}</span>
            </div>

            <div className="space-y-2">
              {stageDeals(stage.id).map((deal: any) => (
                <div
                  key={deal.id}
                  className="p-3 rounded-xl bg-card border border-border/30 hover:border-cyan/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{deal.id}</span>
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-cyan" />
                      <span className="text-[10px] text-cyan font-semibold">{deal.score}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">{deal.business}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">{deal.contact}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">${deal.value.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{deal.lastAction}</p>

                  {/* Stage Movement Controls */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
                    <button
                      onClick={() => moveDeal(deal.id, 'backward')}
                      disabled={deal.stage === 'new'}
                      className="p-1 rounded hover:bg-card text-muted-foreground hover:text-cyan transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move back"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[9px] text-muted-foreground uppercase">Move</span>
                    <button
                      onClick={() => moveDeal(deal.id, 'forward')}
                      disabled={deal.stage === 'lost'}
                      className="p-1 rounded hover:bg-card text-muted-foreground hover:text-cyan transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move forward"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-card border border-border/40 card-glow p-5"
      >
        <h3 className="font-semibold text-foreground text-sm mb-4">Pipeline Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-space-highlight/30 border border-border/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Open Deals</p>
            <p className="text-2xl font-bold text-foreground mt-1">{deals.filter((d: any) => d.stage !== 'won' && d.stage !== 'lost').length}</p>
            <p className="text-xs text-muted-foreground">${deals.filter((d: any) => d.stage !== 'won' && d.stage !== 'lost').reduce((a: number, b: any) => a + b.value, 0).toLocaleString()} value</p>
          </div>
          <div className="p-3 rounded-xl bg-space-highlight/30 border border-border/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Closed Won</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">${pipelineValue.won.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{pipelineTotals.won} deal{pipelineTotals.won !== 1 ? 's' : ''} this month</p>
          </div>
          <div className="p-3 rounded-xl bg-space-highlight/30 border border-border/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Deal Size</p>
            <p className="text-2xl font-bold text-foreground mt-1">${Math.round(deals.reduce((a: number, b: any) => a + b.value, 0) / deals.length).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Across {deals.length} deals</p>
          </div>
          <div className="p-3 rounded-xl bg-space-highlight/30 border border-border/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</p>
            <p className="text-2xl font-bold text-cyan mt-1">{deals.length > 0 ? Math.round((pipelineTotals.won / (pipelineTotals.won + pipelineTotals.lost || 1)) * 100) : 0}%</p>
            <p className="text-xs text-muted-foreground">{pipelineTotals.won} won / {pipelineTotals.won + pipelineTotals.lost} decided</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
