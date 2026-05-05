import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, RefreshCw, CheckCircle2, Clock, Mail, Phone, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { db } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'

const ONBOARDING_PHASES = [
  'Apply', 'Pre-qualified', 'Contract', 'Account', 'Training',
  'Active', 'Leads', 'PowerDial', 'AI Monitor', 'Payout'
]

export default function HRZara() {
  const [users, setUsers]     = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [onboarding, setOnboarding] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ok:boolean;msg:string}|null>(null)
  const [form, setForm] = useState({ email: '', full_name: '', phone: '', role_key: 'contractor' })
  const [activeTab, setActiveTab] = useState<'team'|'invites'|'onboarding'>('team')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, invitesRes, onboardRes] = await Promise.allSettled([
        db.hr.from('users').select('id,email,role_key,created_at').order('created_at', { ascending: false }).limit(30),
        db.hr.from('user_invites').select('id,email,role_key,status,invited_at,accepted_at').order('invited_at', { ascending: false }).limit(20),
        db.hr.from('onboarding_log').select('*').order('created_at', { ascending: false }).limit(20),
      ])
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data || [])
      if (invitesRes.status === 'fulfilled') setInvites(invitesRes.value.data || [])
      if (onboardRes.status === 'fulfilled') setOnboarding(onboardRes.value.data || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const sendInvite = async () => {
    if (!form.email) return
    setInviting(true)
    setInviteResult(null)
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/zara-onboarding`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite_contractor', ...form }),
      })
      const data = await res.json()
      setInviteResult({ ok: res.ok, msg: data?.message || (res.ok ? `Invite sent to ${form.email}` : data?.error || 'Error') })
      if (res.ok) { setForm({ email: '', full_name: '', phone: '', role_key: 'contractor' }); setTimeout(load, 1500) }
    } catch (e: any) { setInviteResult({ ok: false, msg: e.message }) }
    finally { setInviting(false) }
  }

  const stats = {
    users:    users.length,
    invites:  invites.filter(i => i.status === 'pending').length,
    accepted: invites.filter(i => i.status === 'accepted').length,
    active:   users.filter(u => u.role_key === 'contractor').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan" /> HR & Onboarding — Zara BGE
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">hr schema · 10-phase contractor onboarding · $650/mo · 30% commission</p>
        </div>
        <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Team Members', value: stats.users,    icon: Users,        color: 'text-cyan' },
          { label: 'Pending Invites', value: stats.invites, icon: Clock,      color: 'text-amber-400' },
          { label: 'Accepted',     value: stats.accepted, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'BGEs Active',  value: stats.active,   icon: Shield,       color: 'text-violet' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${m.color}`}>
              {loading ? <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" /> : <AnimatedCounter end={m.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Invite form */}
      <div className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-cyan" />
          <h3 className="text-sm font-semibold text-foreground">Invite New BGE — Zara Onboarding</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {[
            { key: 'full_name', placeholder: 'Full Name', icon: Users },
            { key: 'email',     placeholder: 'Email Address', icon: Mail },
            { key: 'phone',     placeholder: 'Phone Number', icon: Phone },
          ].map(f => (
            <div key={f.key} className="relative">
              <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder} className="pl-9 bg-card border-border/40 h-9 text-sm" />
            </div>
          ))}
          <select value={form.role_key} onChange={e => setForm(p => ({ ...p, role_key: e.target.value }))}
            className="h-9 px-3 rounded-lg bg-card border border-border/40 text-foreground text-sm focus:outline-none focus:border-cyan">
            <option value="contractor">BGE — Contractor</option>
            <option value="developer">Developer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={sendInvite} disabled={inviting || !form.email} className="bg-gradient-primary text-space font-bold text-xs h-9">
            <Zap className="w-3.5 h-3.5 mr-1.5" />{inviting ? 'Sending via Zara...' : 'Send Invite via Zara'}
          </Button>
          {inviteResult && (
            <p className={`text-xs ${inviteResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {inviteResult.ok ? '✓' : '✗'} {inviteResult.msg}
            </p>
          )}
        </div>
      </div>

      {/* 10-phase onboarding visual */}
      <div className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
        <h3 className="text-sm font-semibold text-foreground mb-4">10-Phase BGE Onboarding Flow</h3>
        <div className="flex items-center gap-1 flex-wrap">
          {ONBOARDING_PHASES.map((phase, i) => (
            <div key={phase} className="flex items-center gap-1">
              <div className="px-3 py-1.5 rounded-lg bg-space-highlight border border-border/30 text-[10px] font-medium text-muted-foreground">
                <span className="text-cyan mr-1">{i + 1}.</span>{phase}
              </div>
              {i < ONBOARDING_PHASES.length - 1 && <span className="text-muted-foreground text-[10px]">→</span>}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-[10px] text-muted-foreground">
          <p>• 24h contact rule after lead assigned</p>
          <p>• 3-day inactivity = lead reassigned</p>
          <p>• 10-day close window per lead</p>
          <p>• 70 leads max per BGE at once</p>
          <p>• $650/mo platform fee</p>
          <p>• 30% commission + residuals</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-card border border-border/40 rounded-xl w-fit">
        {[['team', `Team (${users.length})`], ['invites', `Invites (${invites.length})`], ['onboarding', `Onboarding Log`]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'team' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          {users.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No team members yet. Send invites above.</div> :
            <div className="divide-y divide-border/10 max-h-80 overflow-y-auto">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-cyan/10 flex items-center justify-center text-xs font-bold text-cyan flex-shrink-0">
                    {u.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.email}</p>
                    <p className="text-[10px] text-muted-foreground">{u.role_key}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(u.created_at)}</span>
                </div>
              ))}
            </div>}
        </div>
      )}

      {activeTab === 'invites' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          {invites.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No invites yet.</div> :
            <div className="divide-y divide-border/10 max-h-80 overflow-y-auto">
              {invites.map(inv => (
                <div key={inv.id} className="flex items-center gap-4 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                    <p className="text-[10px] text-muted-foreground">{inv.role_key}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${inv.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                    {inv.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(inv.invited_at)}</span>
                </div>
              ))}
            </div>}
        </div>
      )}

      {activeTab === 'onboarding' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/20"><h3 className="text-sm font-semibold text-foreground">hr.onboarding_log</h3></div>
          {onboarding.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No onboarding entries yet.</div> :
            <div className="divide-y divide-border/10 max-h-80 overflow-y-auto">
              {onboarding.map((o, i) => (
                <div key={o.id || i} className="flex items-center gap-4 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{o.email || o.full_name || 'BGE'}</p>
                    <p className="text-[10px] text-muted-foreground">Phase {o.phase} · {o.status}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(o.sent_at || o.created_at)}</span>
                </div>
              ))}
            </div>}
        </div>
      )}
    </div>
  )
}
