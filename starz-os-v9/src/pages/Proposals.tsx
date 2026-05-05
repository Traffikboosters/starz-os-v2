import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle2, Clock, AlertCircle, XCircle,
  RefreshCw, Eye, PenTool, DollarSign, Download, Send,
  Building2, Phone, Mail, Globe, Calendar, ChevronRight,
  Shield, Zap, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { db, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase'
import { formatCurrency, timeAgo } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Proposal {
  id: string
  proposal_id: string
  lead_name: string
  business_name: string
  lead_email: string
  phone?: string
  website?: string
  industry?: string
  services?: string[]
  prices?: Record<string, number>
  total_monthly?: number
  deposit_amount?: number
  term?: string
  status: string
  proposal_type?: string
  conversation_summary?: string
  deliverables?: any[]
  viewed_at?: string
  signed_at?: string
  paid_at?: string
  signer_name?: string
  stripe_payment_status?: string
  work_order_id?: string
  created_at: string
  updated_at?: string
  close_probability?: number
}

// ─── Status config ─────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  sent:     { label: 'Sent',      color: 'text-cyan border-cyan/30 bg-cyan/10',           icon: Send },
  viewed:   { label: 'Viewed',    color: 'text-blue-400 border-blue-400/30 bg-blue-400/10', icon: Eye },
  signed:   { label: 'Signed',    color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10', icon: PenTool },
  paid:     { label: 'Paid',      color: 'text-green-400 border-green-400/30 bg-green-400/10', icon: CheckCircle2 },
  expired:  { label: 'Expired',   color: 'text-red-400 border-red-400/30 bg-red-400/10',   icon: XCircle },
  draft:    { label: 'Draft',     color: 'text-muted-foreground border-border bg-muted/10', icon: FileText },
  cancelled:{ label: 'Cancelled', color: 'text-red-400 border-red-400/30 bg-red-400/10',   icon: XCircle },
}

// ─── Signature Pad ────────────────────────────────────────────────────────────
function SignaturePad({ onSign, onCancel }: { onSign: (sig: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [agreed, setAgreed] = useState(false)

  const handleSign = () => {
    if (!name.trim() || !agreed) return
    // Generate signature data string
    const sigData = btoa(JSON.stringify({ name, timestamp: new Date().toISOString(), ip: 'client' }))
    onSign(sigData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg p-6 rounded-2xl bg-card border border-border/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">E-Signature</h3>
              <p className="text-xs text-muted-foreground">Legally binding digital signature</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Full Legal Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Type your full name to sign"
              className="w-full h-12 px-4 rounded-xl bg-space-highlight border border-border/40 text-foreground focus:outline-none focus:border-cyan transition-colors" />
          </div>

          {/* Signature preview */}
          {name && (
            <div className="p-4 rounded-xl bg-space-highlight border border-cyan/20">
              <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Signature Preview</p>
              <p className="text-2xl font-bold text-cyan" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {name}
              </p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2 font-semibold text-amber-400 mb-2">
              <Shield className="w-4 h-4" /> Legal Agreement
            </div>
            <p>• This proposal becomes a binding work order upon signature</p>
            <p>• 35% deposit ({''}) is due within 24 hours</p>
            <p>• 3-day cancellation window applies after signing</p>
            <p>• Services begin after deposit is confirmed</p>
          </div>

          <div className="flex items-start gap-3">
            <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-cyan" />
            <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer">
              I agree to the terms above and confirm this is a legal electronic signature
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 border-border/40" onClick={onCancel}>Cancel</Button>
            <Button disabled={!name.trim() || !agreed} onClick={handleSign}
              className="flex-1 bg-gradient-primary text-space font-bold">
              <PenTool className="w-4 h-4 mr-2" /> Sign Proposal
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Proposal Detail Modal ────────────────────────────────────────────────────
function ProposalDetail({ proposal, onClose, onRefresh }: { proposal: Proposal; onClose: () => void; onRefresh: () => void }) {
  const [signing, setSigning] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSign = async (sigData: string) => {
    setLoading(true)
    setSigning(false)
    try {
      await db.deals.from('proposals').update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signer_name: atob(sigData) ? JSON.parse(atob(sigData)).name : 'Signed',
        signature_data: sigData,
        signer_ip: 'collected-client-side',
      }).eq('id', proposal.id)
      onRefresh()
      onClose()
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const cfg = statusConfig[proposal.status] || statusConfig.draft
  const StatusIcon = cfg.icon

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-start justify-center p-4 pt-12 overflow-y-auto"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl rounded-2xl bg-card border border-border/40 mb-8"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="p-6 border-b border-border/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono text-cyan">{proposal.proposal_id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">{proposal.business_name || proposal.lead_name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{proposal.industry} · {proposal.term}</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Client info */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Building2, label: 'Business', value: proposal.business_name },
                { icon: Mail,      label: 'Email',    value: proposal.lead_email },
                { icon: Phone,     label: 'Phone',    value: proposal.phone || '—' },
                { icon: Globe,     label: 'Website',  value: proposal.website || '—' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl bg-space-highlight">
                  <f.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                    <p className="text-sm text-foreground truncate">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Conversation summary */}
            {proposal.conversation_summary && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Client Situation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed p-4 rounded-xl bg-space-highlight border border-border/20">
                  {proposal.conversation_summary}
                </p>
              </div>
            )}

            {/* Services + Pricing */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Services & Pricing</h3>
              <div className="space-y-2">
                {proposal.services?.map(svc => (
                  <div key={svc} className="flex items-center justify-between p-3 rounded-xl bg-space-highlight border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan" />
                      <span className="text-sm font-medium text-foreground">{svc}</span>
                    </div>
                    <span className="text-sm font-mono text-cyan">
                      {formatCurrency(proposal.prices?.[svc] || 0)}/mo
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-xl bg-cyan/5 border border-cyan/20">
                  <span className="text-sm font-bold text-foreground">Total Monthly</span>
                  <span className="text-lg font-bold text-cyan font-mono">{formatCurrency(proposal.total_monthly || 0)}/mo</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="text-sm font-bold text-foreground">35% Deposit Due</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">{formatCurrency(proposal.deposit_amount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Deliverables */}
            {proposal.deliverables && proposal.deliverables.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Deliverables</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {proposal.deliverables.map((d: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-space-highlight border border-border/20">
                      <p className="text-xs font-bold text-cyan uppercase tracking-wider mb-2">{d.service}</p>
                      <ul className="space-y-1">
                        {d.items?.map((item: string, j: number) => (
                          <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3-Day Cancellation Notice */}
            <div className="p-4 rounded-xl bg-violet/5 border border-violet/20">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-violet" />
                <p className="text-sm font-semibold text-violet">3-Day Cancellation Policy</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Client has 3 business days after signing to cancel with a full refund of the deposit. 
                Work orders enter fulfillment after the 3-day window closes.
              </p>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Sent',   value: proposal.created_at, active: !!proposal.created_at },
                { label: 'Signed', value: proposal.signed_at,  active: !!proposal.signed_at },
                { label: 'Paid',   value: proposal.paid_at,    active: !!proposal.paid_at },
              ].map(t => (
                <div key={t.label} className={`p-3 rounded-xl border ${t.active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-space-highlight border-border/20'}`}>
                  <p className={`text-xs font-bold ${t.active ? 'text-emerald-400' : 'text-muted-foreground'}`}>{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t.value ? timeAgo(t.value) : 'Pending'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-6 border-t border-border/20 flex items-center gap-3">
            {proposal.status === 'sent' || proposal.status === 'viewed' ? (
              <Button className="flex-1 bg-gradient-primary text-space font-bold" onClick={() => setSigning(true)}>
                <PenTool className="w-4 h-4 mr-2" /> Sign Proposal
              </Button>
            ) : proposal.status === 'signed' ? (
              <Button className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30">
                <DollarSign className="w-4 h-4 mr-2" /> Process Deposit — {formatCurrency(proposal.deposit_amount || 0)}
              </Button>
            ) : null}
            <Button variant="outline" className="border-border/40" onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-1.5" /> PDF
            </Button>
          </div>
        </motion.div>
      </div>

      {signing && <SignaturePad onSign={handleSign} onCancel={() => setSigning(false)} />}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Proposals() {
  const [proposals, setProposals]     = useState<Proposal[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Proposal | null>(null)
  const [filter, setFilter]           = useState('all')
  const [count, setCount]             = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count: c } = await db.deals
        .from('proposals')
        .select('id,proposal_id,lead_name,business_name,lead_email,phone,website,industry,services,prices,total_monthly,deposit_amount,term,status,proposal_type,conversation_summary,deliverables,viewed_at,signed_at,paid_at,signer_name,stripe_payment_status,work_order_id,created_at,updated_at,close_probability', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(100)
      setProposals(data || [])
      setCount(c || 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? proposals : proposals.filter(p => p.status === filter)

  const stats = {
    total:   proposals.length,
    sent:    proposals.filter(p => p.status === 'sent').length,
    signed:  proposals.filter(p => p.status === 'signed').length,
    paid:    proposals.filter(p => p.status === 'paid').length,
    value:   proposals.reduce((s, p) => s + (p.total_monthly || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan" /> Proposals & Work Orders
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? 'Loading...' : `${count} proposals · Proposal = Unpaid Work Order`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total',    value: stats.total,  icon: FileText,     color: 'text-cyan' },
          { label: 'Sent',     value: stats.sent,   icon: Send,         color: 'text-blue-400' },
          { label: 'Signed',   value: stats.signed, icon: PenTool,      color: 'text-violet' },
          { label: 'Paid',     value: stats.paid,   icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Pipeline', value: stats.value,  icon: DollarSign,   color: 'text-amber-400', isCurrency: true },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${m.color}`}>
              {loading ? <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" /> :
                m.isCurrency ? `$${(m.value / 1000).toFixed(0)}K` : <AnimatedCounter end={m.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border/40 rounded-xl w-fit">
        {['all', 'sent', 'viewed', 'signed', 'paid', 'expired'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === s ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-muted-foreground hover:text-foreground'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Proposals table */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border/20 text-[10px] text-muted-foreground uppercase tracking-wider">
          <span>ID</span><span>Client</span><span>Services</span><span>Value</span><span>Status</span><span>Sent</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading proposals from deals.proposals...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No proposals matching filter</div>
        ) : (
          <div className="divide-y divide-border/10 max-h-[520px] overflow-y-auto">
            {filtered.map((p, i) => {
              const cfg = statusConfig[p.status] || statusConfig.draft
              const StatusIcon = cfg.icon
              return (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  onClick={() => setSelected(p)}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 hover:bg-space-highlight/30 transition-colors items-center cursor-pointer">
                  <span className="text-[10px] font-mono text-cyan whitespace-nowrap">{p.proposal_id}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.business_name || p.lead_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.lead_email}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {p.services?.slice(0, 2).map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/20">{s}</span>
                    ))}
                  </div>
                  <span className="text-sm font-mono font-bold text-foreground whitespace-nowrap">
                    {formatCurrency(p.total_monthly || 0)}/mo
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 whitespace-nowrap ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />{cfg.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(p.created_at)}</span>
                </motion.div>
              )
            })}
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-border/10 text-[10px] text-muted-foreground">
            Showing {filtered.length} of {count} · Click any row to view, sign, or process payment
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <ProposalDetail proposal={selected} onClose={() => setSelected(null)} onRefresh={load} />
        )}
      </AnimatePresence>
    </div>
  )
}
