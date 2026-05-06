import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package, Upload, CheckCircle2, XCircle, RefreshCw, Clock,
  FileText, Image, Video, FileSpreadsheet, FileCode, ExternalLink,
  ChevronRight, Download, MessageSquare, History, ArrowLeft} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/useToast'

const typeIcons: Record<string, any> = {
  pdf: FileText,
  image: Image,
  video: Video,
  spreadsheet: FileSpreadsheet,
  document: FileText,
  code: FileCode,
  link: ExternalLink,
}

const deliverablesData = [
  { id: 1, title: 'SEO Audit Report - Miami Auto Group', type: 'pdf', client: 'Miami Auto Group', workOrder: 'WO-002', size: '2.4 MB', version: 2, clientStatus: 'approved', uploadedAt: 'Jul 24, 2025', uploadedBy: 'Sarah Chen' },
  { id: 2, title: 'Ad Campaign Performance - Phoenix Roofing', type: 'spreadsheet', client: 'Phoenix Roofing', workOrder: 'WO-001', size: '156 KB', version: 1, clientStatus: 'pending_review', uploadedAt: 'Jul 23, 2025', uploadedBy: 'Elena Rossi' },
  { id: 3, title: 'Website Mockups v2 - SF Tech Startup', type: 'image', client: 'SF Tech Startup', workOrder: 'WO-003', size: '8.7 MB', version: 3, clientStatus: 'revision_requested', uploadedAt: 'Jul 22, 2025', uploadedBy: 'Marcus Webb' },
  { id: 4, title: 'Content Strategy Document - NYC Dental', type: 'document', client: 'NYC Dental', workOrder: 'WO-004', size: '1.1 MB', version: 1, clientStatus: 'pending_review', uploadedAt: 'Jul 21, 2025', uploadedBy: 'Aisha Patel' },
  { id: 5, title: 'Backlink Report Q3 - Seattle Coffee', type: 'pdf', client: 'Seattle Coffee Co', workOrder: 'WO-005', size: '890 KB', version: 1, clientStatus: 'approved', uploadedAt: 'Jul 20, 2025', uploadedBy: 'James Park' },
  { id: 6, title: 'GMB Optimization Guide - Chicago Law', type: 'pdf', client: 'Chicago Law Firm', workOrder: 'WO-006', size: '3.2 MB', version: 1, clientStatus: 'approved', uploadedAt: 'Jul 19, 2025', uploadedBy: 'Sarah Chen' },
]

const clientStatusBadge = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/30'
    case 'revision_requested': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    default: return 'bg-cyan/10 text-cyan border-cyan/30'
  }
}

const clientStatusLabel = (status: string) => {
  switch (status) {
    case 'approved': return 'Approved'
    case 'rejected': return 'Rejected'
    case 'revision_requested': return 'Revision Needed'
    default: return 'Pending Review'
  }
}

export default function Deliverables() {
  const [deliverables, setDeliverables] = useState(deliverablesData)
  const [filter, setFilter] = useState('all')
  const { success, info } = useToast()

  const filtered = filter === 'all' ? deliverables : deliverables.filter(d => d.clientStatus === filter)

  const updateStatus = (id: number, status: string) => {
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, clientStatus: status } : d))
    success(`Deliverable status updated to ${clientStatusLabel(status)}`)
  }

  const approved = deliverables.filter(d => d.clientStatus === 'approved').length
  const pending = deliverables.filter(d => d.clientStatus === 'pending_review').length
  const revision = deliverables.filter(d => d.clientStatus === 'revision_requested').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan" />
            Deliverables Center
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Client deliverables, approvals, and version control</p>
        </div>
        <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold" onClick={() => info('Upload deliverable')}>
          <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: deliverables.length, color: 'text-cyan' },
          { label: 'Approved', value: approved, color: 'text-emerald-400' },
          { label: 'Pending', value: pending, color: 'text-amber-400' },
          { label: 'Revision', value: revision, color: 'text-red-400' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-card border border-border/40 card-glow text-center cursor-pointer" onClick={() => setFilter(s.label.toLowerCase() === 'total' ? 'all' : s.label.toLowerCase().replace(' ', '_'))}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1">
        {['all', 'pending_review', 'approved', 'revision_requested'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}>
            {f === 'all' ? 'All' : clientStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Deliverables */}
      <div className="space-y-3">
        {filtered.map((d, i) => {
          const TypeIcon = typeIcons[d.type] || FileText
          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center flex-shrink-0">
                  <TypeIcon className="w-5 h-5 text-cyan" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
                    <Badge className={`text-[10px] ${clientStatusBadge(d.clientStatus)}`}>{clientStatusLabel(d.clientStatus)}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{d.client}</span>
                    <span>{d.workOrder}</span>
                    <span>{d.size}</span>
                    <span>v{d.version}</span>
                    <span>by {d.uploadedBy}</span>
                    <span>{d.uploadedAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {d.clientStatus === 'pending_review' && (
                    <>
                      <button onClick={() => updateStatus(d.id, 'approved')} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Approve">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => updateStatus(d.id, 'revision_requested')} className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors" title="Request Revision">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button onClick={() => updateStatus(d.id, 'rejected')} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Reject">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => info(`Downloading ${d.title}`)} className="p-2 rounded-lg bg-card border border-border/30 text-muted-foreground hover:text-foreground transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
