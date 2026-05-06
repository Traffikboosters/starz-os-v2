import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Filter, ArrowUpDown, CheckCircle2, AlertCircle, Clock,
  Phone, Mail, MessageSquare, ChevronRight, Zap, Target, Star,
  UserPlus, UserCheck, ArrowRight, Shield, BarChart3, Search,
  Download, MoreHorizontal, PhoneCall, MailOpen, Send, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const initialLeads = [
  { id: 'L-8921', name: 'Mike Rodriguez', company: 'Miami Auto Group', email: 'mike@miamiauto.com', phone: '+1 (305) 555-0121', source: 'Web Form', score: 92, status: 'hot', assigned: 'Sarah Chen', lastTouch: '2h ago', value: 8400, tags: ['SEO', 'Premium'] },
  { id: 'L-8922', name: 'Jennifer Walsh', company: 'NYC Dental', email: 'jen@nycdental.com', phone: '+1 (212) 555-0198', source: 'Referral', score: 88, status: 'hot', assigned: 'Elena Rossi', lastTouch: '1h ago', value: 12200, tags: ['Full Stack'] },
  { id: 'L-8923', name: 'Carlos Mendez', company: 'Phoenix Roofing', email: 'carlos@phoenixroof.com', phone: '+1 (602) 555-0145', source: 'Cold Outreach', score: 74, status: 'warm', assigned: 'Marcus Webb', lastTouch: '4h ago', value: 5600, tags: ['PPC'] },
  { id: 'L-8924', name: 'Lisa Chen', company: 'SF Tech Startup', email: 'lisa@sftech.io', phone: '+1 (415) 555-0176', source: 'Web Form', score: 95, status: 'hot', assigned: 'Sarah Chen', lastTouch: '30m ago', value: 15000, tags: ['SEO', 'Web Design'] },
  { id: 'L-8925', name: 'David Park', company: 'Chicago Law Firm', email: 'david@chicagolaw.com', phone: '+1 (312) 555-0134', source: 'Ad Campaign', score: 67, status: 'warm', assigned: 'Aisha Patel', lastTouch: '6h ago', value: 9200, tags: ['SEO'] },
  { id: 'L-8926', name: 'Angela Torres', company: 'Dallas Realty', email: 'angela@dallasrealty.com', phone: '+1 (214) 555-0189', source: 'Web Form', score: 81, status: 'warm', assigned: 'James Park', lastTouch: '3h ago', value: 6800, tags: ['PPC', 'Social'] },
  { id: 'L-8927', name: 'Robert Kim', company: 'Seattle Coffee Co', email: 'robert@seattlecoffee.com', phone: '+1 (206) 555-0156', source: 'Referral', score: 90, status: 'hot', assigned: 'Elena Rossi', lastTouch: '1h ago', value: 10500, tags: ['Full Stack'] },
  { id: 'L-8928', name: 'Maria Gonzalez', company: 'Austin Fitness', email: 'maria@austinfit.com', phone: '+1 (512) 555-0167', source: 'Cold Outreach', score: 58, status: 'cold', assigned: null, lastTouch: '1d ago', value: 4200, tags: ['SEO'] },
]

const statusStyles: Record<string, string> = {
  hot: 'bg-red-500/10 text-red-400 border-red-500/30',
  warm: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  cold: 'bg-cyan/10 text-cyan border-cyan/30',
}

const repList = ['Sarah Chen', 'Elena Rossi', 'Marcus Webb', 'Aisha Patel', 'James Park']

export default function Leads() {
  const [leadsData, setLeadsData] = useLocalStorage('starz-leads', initialLeads)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [activeRule, setActiveRule] = useLocalStorage('starz-lead-rule', 'Round Robin')
  const { success, info, warning } = useToast()

  const [newLead, setNewLead] = useState({ name: '', company: '', email: '', phone: '', source: 'Web Form', score: 70, status: 'warm', value: 0, tags: '' })

  const filtered = leadsData.filter((l: any) => {
    if (filter !== 'all' && l.status !== filter) return false
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.company.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleCall = (lead: any) => {
    success(`Calling ${lead.name} at ${lead.phone}`)
  }

  const handleEmail = (lead: any) => {
    info(`Opening email composer for ${lead.email}`)
  }

  const handleText = (lead: any) => {
    success(`SMS composer opened for ${lead.phone}`)
  }

  const handleAutoAssign = (leadId: string) => {
    const rep = repList[Math.floor(Math.random() * repList.length)]
    setLeadsData((prev: any[]) => prev.map((l: any) => l.id === leadId ? { ...l, assigned: rep, lastTouch: 'just now' } : l))
    success(`Lead ${leadId} auto-assigned to ${rep}`)
  }

  const handleAddLead = () => {
    if (!newLead.name || !newLead.company) {
      warning('Name and company are required')
      return
    }
    const id = `L-${8900 + leadsData.length + 1}`
    const lead = { ...newLead, id, assigned: null, lastTouch: 'just now', tags: newLead.tags ? newLead.tags.split(',').map((t: string) => t.trim()) : [] }
    setLeadsData((prev: any[]) => [...prev, lead])
    setShowAdd(false)
    setNewLead({ name: '', company: '', email: '', phone: '', source: 'Web Form', score: 70, status: 'warm', value: 0, tags: '' })
    success(`Lead ${id} added successfully`)
  }

  const distributionRules = [
    { name: 'Round Robin', active: activeRule === 'Round Robin', desc: 'Fair rotation across all active reps' },
    { name: 'Performance Weighted', active: activeRule === 'Performance Weighted', desc: 'Higher close rate = more leads' },
    { name: 'Territory Based', active: activeRule === 'Territory Based', desc: 'Assign by geo/vertical' },
    { name: 'Revenue Weighted', active: activeRule === 'Revenue Weighted', desc: 'Higher deal size = more leads' },
  ]

  const repCaps = [
    { name: 'Sarah Chen', current: leadsData.filter((l: any) => l.assigned === 'Sarah Chen').length, cap: 15, performance: 94 },
    { name: 'Elena Rossi', current: leadsData.filter((l: any) => l.assigned === 'Elena Rossi').length, cap: 15, performance: 97 },
    { name: 'Marcus Webb', current: leadsData.filter((l: any) => l.assigned === 'Marcus Webb').length, cap: 12, performance: 78 },
    { name: 'Aisha Patel', current: leadsData.filter((l: any) => l.assigned === 'Aisha Patel').length, cap: 12, performance: 85 },
    { name: 'James Park', current: leadsData.filter((l: any) => l.assigned === 'James Park').length, cap: 10, performance: 72 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan" />
            Lead Distribution
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Smart assignment, tracking, and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={() => info('Export started...')}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold" onClick={() => setShowAdd(true)}>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-md shadow-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Add New Lead</h3>
                <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-card text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Full name" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Company" value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Email" type="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Phone" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} className="bg-card border-border/40" />
                <div className="flex gap-2">
                  <select value={newLead.status} onChange={(e) => setNewLead({ ...newLead, status: e.target.value })} className="flex-1 h-9 rounded-md bg-card border border-border/40 text-sm px-3 text-foreground">
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                  <Input placeholder="Score (0-100)" type="number" value={newLead.score} onChange={(e) => setNewLead({ ...newLead, score: parseInt(e.target.value) || 0 })} className="w-28 bg-card border-border/40" />
                </div>
                <Input placeholder="Estimated value ($)" type="number" value={newLead.value || ''} onChange={(e) => setNewLead({ ...newLead, value: parseInt(e.target.value) || 0 })} className="bg-card border-border/40" />
                <Input placeholder="Tags (comma separated)" value={newLead.tags} onChange={(e) => setNewLead({ ...newLead, tags: e.target.value })} className="bg-card border-border/40" />
                <Button className="w-full bg-gradient-primary text-space font-semibold" onClick={handleAddLead}>Add Lead</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: leadsData.length, icon: Users, color: 'text-cyan' },
          { label: 'Hot Leads', value: leadsData.filter((l: any) => l.status === 'hot').length, icon: Target, color: 'text-red-400' },
          { label: 'Assigned', value: leadsData.filter((l: any) => l.assigned).length, icon: UserCheck, color: 'text-emerald-400' },
          { label: 'Avg Lead Score', value: Math.round(leadsData.reduce((a: number, b: any) => a + b.score, 0) / leadsData.length), suffix: '', icon: Star, color: 'text-violet' },
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
              <AnimatedCounter end={m.value} suffix={m.suffix || ''} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Lead Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
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
                    filter === f ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground hover:text-foreground hover:bg-card border border-transparent'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/20">
                    {['Lead', 'Score', 'Status', 'Assigned', 'Value', 'Last Touch', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead: any) => (
                    <tr key={lead.id} className="border-b border-border/10 hover:bg-space-highlight/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-cyan/10 text-cyan text-xs">
                              {lead.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{lead.name}</p>
                            <p className="text-[10px] text-muted-foreground">{lead.company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="w-3 h-3 text-cyan" />
                          <span className="text-sm font-semibold text-cyan">{lead.score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] ${statusStyles[lead.status] || ''}`}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {lead.assigned ? (
                          <span className="text-sm text-foreground">{lead.assigned}</span>
                        ) : (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] border-cyan/30 text-cyan hover:bg-cyan/5 px-2" onClick={() => handleAutoAssign(lead.id)}>
                            <Zap className="w-3 h-3 mr-1" /> Auto-assign
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-foreground">${lead.value.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{lead.lastTouch}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleCall(lead)} className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-cyan transition-colors" title="Call">
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEmail(lead)} className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-violet transition-colors" title="Email">
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleText(lead)} className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-emerald-400 transition-colors" title="Text">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Distribution Panel */}
        <div className="space-y-5">
          {/* Rules */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-border/40 card-glow p-5"
          >
            <h3 className="font-semibold text-foreground text-sm mb-4">Distribution Rules</h3>
            <div className="space-y-2">
              {distributionRules.map((rule) => (
                <div
                  key={rule.name}
                  onClick={() => { setActiveRule(rule.name); success(`Switched to ${rule.name}`) }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    rule.active ? 'border-cyan/30 bg-cyan/5' : 'border-border/20 hover:border-cyan/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{rule.name}</span>
                    {rule.active && <div className="w-2 h-2 rounded-full bg-cyan" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{rule.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Rep Caps */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-card border border-border/40 card-glow p-5"
          >
            <h3 className="font-semibold text-foreground text-sm mb-4">Rep Load ({repCaps.reduce((a, r) => a + r.current, 0)} leads)</h3>
            <div className="space-y-3">
              {repCaps.map((rep) => (
                <div key={rep.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{rep.name}</span>
                    <span className="text-xs text-muted-foreground">{rep.current}/{rep.cap}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan to-violet"
                      style={{ width: `${Math.min((rep.current / rep.cap) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">Performance: {rep.performance}%</span>
                    {rep.current >= rep.cap && (
                      <span className="text-[10px] text-amber-400">Cap reached</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
