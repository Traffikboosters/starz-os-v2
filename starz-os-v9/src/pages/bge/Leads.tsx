import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Target, Phone, Mail, MessageSquare, Eye, Star, ChevronRight,
  Filter, Search, ArrowUpRight, ArrowDownRight, Clock, Zap,
  CheckCircle2, AlertCircle, Flame, TrendingUp, UserCheck,
  MoreHorizontal, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const initialMyLeads = [
  { id: 'L-9201', business: 'Miami Roofing Pros', contact: 'Mike Rodriguez', phone: '(305) 555-0142', email: 'mike@miamiroofing.com', score: 92, status: 'hot', stage: 'Not Contacted', lastAction: '—', assigned: 'Today', value: 8400, notes: 'Referred by previous client. High intent.' },
  { id: 'L-9202', business: 'NYC Dental Studio', contact: 'Dr. Jennifer Walsh', phone: '(212) 555-0198', email: 'jen@nycdental.com', score: 88, status: 'hot', stage: 'Contacted', lastAction: 'Email sent 2h ago', assigned: 'Today', value: 12200, notes: 'Interested in full-stack package.' },
  { id: 'L-9203', business: 'Phoenix Auto Repair', contact: 'Carlos Mendez', phone: '(602) 555-0112', email: 'carlos@phoenixauto.com', score: 74, status: 'warm', stage: 'Interested', lastAction: 'Call 1d ago', assigned: 'Yesterday', value: 5600, notes: 'Needs PPC + local SEO.' },
  { id: 'L-9204', business: 'Dallas Fitness Club', contact: 'Angela Torres', phone: '(214) 555-0167', email: 'angela@dallasfit.com', score: 67, status: 'warm', stage: 'Not Contacted', lastAction: '—', assigned: 'Today', value: 4200, notes: 'Small budget, start with social.' },
  { id: 'L-9205', business: 'Seattle Coffee Co', contact: 'Robert Kim', phone: '(206) 555-0156', email: 'robert@seattlecoffee.com', score: 95, status: 'hot', stage: 'Proposal Sent', lastAction: 'Proposal sent 30m ago', assigned: 'Today', value: 10500, notes: 'Ready to close. Follow up tomorrow.' },
  { id: 'L-9206', business: 'Chicago Law Partners', contact: 'David Park', phone: '(312) 555-0134', email: 'david@chicagolaw.com', score: 58, status: 'cold', stage: 'Not Contacted', lastAction: '—', assigned: 'Yesterday', value: 9200, notes: 'Long sales cycle. Nurture sequence.' },
  { id: 'L-9207', business: 'Austin Food Truck Hub', contact: 'Maria Gonzalez', phone: '(512) 555-0167', email: 'maria@austinfood.com', score: 81, status: 'warm', stage: 'Contacted', lastAction: 'Text 4h ago', assigned: 'Today', value: 3800, notes: 'Wants Instagram + local visibility.' },
  { id: 'L-9208', business: 'Denver Real Estate Group', contact: 'Tom Bradley', phone: '(303) 555-0189', email: 'tom@denverre.com', score: 79, status: 'warm', stage: 'Interested', lastAction: 'Call 6h ago', assigned: 'Today', value: 7500, notes: 'Multiple agents, bulk pricing needed.' },
]

const statusStyles = (status: string) => {
  switch (status) {
    case 'hot': return 'bg-red-500/10 text-red-400 border-red-500/30 animate-flash-red'
    case 'warm': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'cold': return 'bg-cyan/10 text-cyan border-cyan/30'
    default: return 'bg-muted text-muted-foreground'
  }
}

const stageColor: Record<string, string> = {
  'Not Contacted': 'text-muted-foreground',
  'Contacted': 'text-cyan',
  'Interested': 'text-violet',
  'Proposal Sent': 'text-amber-400',
  'Closed Won': 'text-emerald-400',
  'Closed Lost': 'text-red-400',
}

const stageOptions = ['Not Contacted', 'Contacted', 'Interested', 'Proposal Sent', 'Closed Won', 'Closed Lost']

export default function BGELeads() {
  const navigate = useNavigate()
  const [myLeads, setMyLeads] = useLocalStorage('starz-bge-leads', initialMyLeads)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<string | null>(null)
  const [editingStage, setEditingStage] = useState<string | null>(null)
  const { success, info } = useToast()

  const filtered = myLeads.filter((l: any) => {
    if (filter !== 'all' && l.status !== filter) return false
    if (search && !l.business.toLowerCase().includes(search.toLowerCase()) && !l.contact.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleCall = (lead: any) => {
    success(`Calling ${lead.contact} at ${lead.phone}`)
  }

  const handleEmail = (lead: any) => {
    info(`Opening email to ${lead.email}`)
  }

  const handleText = (lead: any) => {
    success(`SMS composer opened for ${lead.phone}`)
  }

  const handleStageChange = (leadId: string, newStage: string) => {
    setMyLeads((prev: any[]) => prev.map((l: any) => l.id === leadId ? { ...l, stage: newStage, lastAction: `Stage updated to ${newStage}` } : l))
    setEditingStage(null)
    success(`Lead stage updated to ${newStage}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan" />
            My Leads
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Your assigned leads — contact, nurture, close</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <UserCheck className="w-3 h-3" /> {myLeads.length} Assigned
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assigned', value: myLeads.length, icon: Target, color: 'text-cyan' },
          { label: 'Hot Leads', value: myLeads.filter((l: any) => l.status === 'hot').length, icon: Flame, color: 'text-red-400' },
          { label: 'Contacted', value: myLeads.filter((l: any) => l.stage !== 'Not Contacted').length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Pipeline Value', value: myLeads.reduce((a: number, b: any) => a + b.value, 0), prefix: '$', icon: TrendingUp, color: 'text-violet' },
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
            <div className="text-xl font-bold text-foreground">
              <AnimatedCounter end={m.value} prefix={m.prefix || ''} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/40 text-sm h-9 rounded-lg"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'hot', 'warm', 'cold'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((lead: any, i: number) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-2xl bg-card border transition-all ${
              selectedLead === lead.id ? 'border-cyan/40 shadow-glow' : 'border-border/40 card-glow hover:border-cyan/20'
            }`}
            onClick={() => setSelectedLead(selectedLead === lead.id ? null : lead.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground">{lead.id}</span>
              <Badge className={`text-[10px] ${statusStyles(lead.status)}`}>
                {lead.status}
              </Badge>
            </div>

            <h3 className="text-sm font-bold text-foreground mb-0.5">{lead.business}</h3>
            <p className="text-xs text-muted-foreground mb-2">{lead.contact}</p>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-cyan" />
                <span className="text-sm font-bold text-cyan">{lead.score}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setEditingStage(editingStage === lead.id ? null : lead.id) }} className={`text-xs ${stageColor[lead.stage]} hover:underline`}>{lead.stage}</button>
              <span className="text-xs text-muted-foreground ml-auto">${lead.value.toLocaleString()}</span>
            </div>

            {/* Stage Selector */}
            <AnimatePresence>
              {editingStage === lead.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-3 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                  {stageOptions.map((s) => (
                    <button key={s} onClick={() => handleStageChange(lead.id, s)} className={`px-2 py-1 rounded text-[10px] ${lead.stage === s ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'bg-space-highlight/30 text-muted-foreground border border-border/20 hover:border-cyan/20'}`}>
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Phone className="w-3 h-3" />
              {lead.phone}
            </div>

            {selectedLead === lead.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-3"
              >
                <p className="text-xs text-muted-foreground mb-2">{lead.notes}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  {lead.email}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {lead.lastAction}
                </p>
              </motion.div>
            )}

            <div className="grid grid-cols-4 gap-1.5">
              <button onClick={(e) => { e.stopPropagation(); handleCall(lead) }} className="py-2 rounded-lg bg-cyan/10 text-cyan hover:bg-cyan/20 transition-colors flex items-center justify-center" title="Call">
                <Phone className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleEmail(lead) }} className="py-2 rounded-lg bg-violet/10 text-violet hover:bg-violet/20 transition-colors flex items-center justify-center" title="Email">
                <Mail className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleText(lead) }} className="py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center justify-center" title="Text">
                <MessageSquare className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedLead(selectedLead === lead.id ? null : lead.id) }} className="py-2 rounded-lg bg-card border border-border/40 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center" title="View">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
