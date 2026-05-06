import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Mail, MessageSquare, TrendingUp, Eye, Reply, Plus,
  Play, Pause, Clock, ChevronRight, Zap, BarChart3, Target,
  Users, CheckCircle2, AlertCircle, X, FileText, Settings} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { AnimatedCounter } from '@/components/AnimatedCounter'

const initialCampaigns = [
  { id: 1, name: 'July Cold Outreach', type: 'cold_outreach', status: 'running', subject: 'Helping your business grow', recipients: 250, sent: 120, opened: 45, replies: 8, positiveReplies: 3, openRate: 37.5, replyRate: 6.7, dailyLimit: 50, lastRun: '2m ago' },
  { id: 2, name: 'Follow-Up Sequence', type: 'follow_up', status: 'running', subject: 'Quick follow-up', recipients: 80, sent: 80, opened: 32, replies: 6, positiveReplies: 2, openRate: 40.0, replyRate: 7.5, dailyLimit: 30, lastRun: '1h ago' },
  { id: 3, name: 'Proposal Push', type: 'proposal_reminder', status: 'scheduled', subject: 'Your proposal is waiting', recipients: 15, sent: 0, opened: 0, replies: 0, positiveReplies: 0, openRate: 0, replyRate: 0, dailyLimit: 10, lastRun: '-' },
  { id: 4, name: 'Nurture Campaign', type: 'nurture', status: 'paused', subject: 'Monthly insights', recipients: 200, sent: 45, opened: 12, replies: 2, positiveReplies: 1, openRate: 26.7, replyRate: 4.4, dailyLimit: 25, lastRun: '3h ago' },
  { id: 5, name: 'Missed Call Recovery', type: 'missed_call', status: 'draft', subject: 'Sorry we missed you', recipients: 0, sent: 0, opened: 0, replies: 0, positiveReplies: 0, openRate: 0, replyRate: 0, dailyLimit: 20, lastRun: '-' },
]

const initialTemplates = [
  { id: 1, name: 'Initial Outreach', type: 'cold_outreach', subject: 'Helping {{business_name}} get more customers', variables: ['business_name', 'contact_name'] },
  { id: 2, name: 'Follow-Up', type: 'follow_up', subject: 'Quick follow-up', variables: ['contact_name'] },
  { id: 3, name: 'Proposal Reminder', type: 'proposal_reminder', subject: 'Your proposal is ready', variables: ['contact_name', 'business_name', 'proposal_link'] },
  { id: 4, name: 'Nurture Email', type: 'nurture', subject: 'Marketing tips for {{business_name}}', variables: ['business_name', 'contact_name'] },
]

const statusStyles: Record<string, string> = {
  running: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  scheduled: 'bg-cyan/10 text-cyan border-cyan/30',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  draft: 'bg-muted text-muted-foreground',
  completed: 'bg-violet/10 text-violet border-violet/30',
}

const typeLabels: Record<string, string> = {
  cold_outreach: 'Cold Outreach',
  follow_up: 'Follow-Up',
  missed_call: 'Missed Call',
  proposal_reminder: 'Proposal Reminder',
  nurture: 'Nurture',
}

export default function Outreach() {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [templates] = useState(initialTemplates)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'analytics'>('campaigns')
  const [showNew, setShowNew] = useState(false)
  const { success, info } = useToast()

  const toggleCampaign = (id: number) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c
      const newStatus = c.status === 'running' ? 'paused' : c.status === 'paused' ? 'running' : 'running'
      success(`Campaign "${c.name}" ${newStatus}`)
      return { ...c, status: newStatus }
    }))
  }

  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0)
  const totalOpened = campaigns.reduce((a, c) => a + c.opened, 0)
  const totalReplies = campaigns.reduce((a, c) => a + c.replies, 0)
  const totalPositive = campaigns.reduce((a, c) => a + c.positiveReplies, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan" />
            Outreach Center
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Email campaigns, templates, and engagement tracking</p>
        </div>
        <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Emails Sent', value: totalSent, icon: Send, color: 'text-cyan' },
          { label: 'Opens', value: totalOpened, icon: Eye, color: 'text-violet' },
          { label: 'Replies', value: totalReplies, icon: Reply, color: 'text-amber-400' },
          { label: 'Positive', value: totalPositive, icon: CheckCircle2, color: 'text-emerald-400' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground"><AnimatedCounter end={m.value} /></div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(['campaigns', 'templates', 'analytics'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all ${activeTab === tab ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'campaigns' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                    <Badge className={`text-[10px] ${statusStyles[c.status]}`}>{c.status}</Badge>
                    <Badge variant="outline" className="text-[10px] border-border/40">{typeLabels[c.type]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{c.subject}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">Recipients: <span className="text-foreground font-medium">{c.recipients}</span></span>
                    <span className="text-muted-foreground">Sent: <span className="text-foreground font-medium">{c.sent}</span></span>
                    <span className="text-muted-foreground">Open rate: <span className="text-emerald-400 font-medium">{c.openRate}%</span></span>
                    <span className="text-muted-foreground">Reply rate: <span className="text-amber-400 font-medium">{c.replyRate}%</span></span>
                    <span className="text-muted-foreground">Daily limit: <span className="text-cyan font-medium">{c.dailyLimit}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleCampaign(c.id)} className={`p-2 rounded-xl transition-all ${c.status === 'running' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {c.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => info(`Settings for ${c.name}`)} className="p-2 rounded-xl bg-card border border-border/30 text-muted-foreground hover:text-foreground transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {c.sent > 0 && (
                <div className="mt-3 pt-3 border-t border-border/20">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {c.opened} opens</span>
                    <span className="flex items-center gap-1"><Reply className="w-3 h-3" /> {c.replies} replies</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {c.positiveReplies} positive</span>
                    <span className="ml-auto"><Clock className="w-3 h-3 inline" /> {c.lastRun}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'templates' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="p-4 rounded-2xl bg-card border border-border/40 card-glow hover:border-cyan/20 transition-all cursor-pointer" onClick={() => info(`Editing template: ${t.name}`)}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-cyan" />
                <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
              </div>
              <Badge variant="outline" className="text-[10px] border-border/40 mb-2">{typeLabels[t.type]}</Badge>
              <p className="text-xs text-muted-foreground mb-2 truncate">{t.subject}</p>
              <div className="flex flex-wrap gap-1">
                {t.variables.map((v) => (
                  <span key={v} className="px-1.5 py-0.5 rounded bg-space-highlight/40 text-[10px] text-muted-foreground">{`{{${v}}}`}</span>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-3 gap-4">
          {[
            { label: 'Avg Open Rate', value: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0, suffix: '%', color: 'text-cyan' },
            { label: 'Avg Reply Rate', value: totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0, suffix: '%', color: 'text-amber-400' },
            { label: 'Positive Reply Rate', value: totalReplies > 0 ? Math.round((totalPositive / totalReplies) * 100) : 0, suffix: '%', color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={s.label} className="p-5 rounded-2xl bg-card border border-border/40 card-glow text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}{s.suffix}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
