import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, PhoneOff, Mic, MicOff, Zap, CheckCircle2,
  PhoneOutgoing, Sparkles, Loader2, RefreshCw, Users,
  TrendingUp, DollarSign, Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { db, SUPABASE_FUNCTIONS_URL } from '@/lib/supabase'
import { useLeads } from '@/hooks/useSupabase'
import { timeAgo, formatCurrency } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CallFloorRep {
  id?: string
  rep_name?: string
  name?: string
  assigned_to?: string
  status?: string
  call_status?: string
  current_lead?: string
  lead_name?: string
  calls_today?: number
  deals_today?: number
  revenue_today?: number
  duration?: number
  phone_number?: string
}

interface ClosePopup {
  id: string
  rep: string
  client: string
  amount: number
  service: string
}

// ─── Close Popup Component ────────────────────────────────────────────────────

function CloseToast({ popup, onDismiss }: { popup: ClosePopup; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="fixed top-6 right-6 z-50 w-80 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl shadow-2xl cursor-pointer"
      onClick={onDismiss}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-emerald-400">🎉 Deal Closed!</p>
          <p className="text-xs text-foreground mt-0.5">
            <span className="font-semibold">{popup.rep}</span> just closed{" "}
            <span className="font-semibold">{popup.client}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{popup.service}</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(popup.amount)}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PowerDial() {
  const { leads, loading: leadsLoading } = useLeads(50)
  const [callFloor, setCallFloor]     = useState<CallFloorRep[]>([])
  const [floorLoading, setFloorLoading] = useState(true)
  const [callState, setCallState]     = useState<'idle'|'calling'|'connected'>('idle')
  const [muted, setMuted]             = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [callError, setCallError]     = useState<string|null>(null)
  const [popups, setPopups]           = useState<ClosePopup[]>([])
  const channelRef                    = useRef<any>(null)

  const dialQueue = leads.filter(l => l.phone).slice(0, 20)
  const currentLead = dialQueue[currentIndex]

  // ─── Load call floor from v_call_floor ──────────────────────────────────────
  const loadCallFloor = useCallback(async () => {
    setFloorLoading(true)
    try {
      const { data, error } = await db.dialer
        .from('v_call_floor')
        .select('*')
        .limit(20)
      if (!error) setCallFloor(data || [])
    } catch (e) {
      console.error('Call floor error:', e)
    } finally {
      setFloorLoading(false)
    }
  }, [])

  useEffect(() => { loadCallFloor() }, [loadCallFloor])

  // ─── Realtime subscription ───────────────────────────────────────────────────
  useEffect(() => {
    // Subscribe to dialer schema realtime changes
    const channel = db.dialer
      .channel('call-floor-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'dialer',
        table: 'call_queue',
      }, () => {
        loadCallFloor()
      })
      // Also listen for deal closes on deals schema
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'deals',
        table: 'pipeline',
      }, (payload: any) => {
        const deal = payload.new
        const old  = payload.old
        // Fire popup when deal moves to closed stage
        if (
          deal &&
          ['closed_won','Closed Won','closed','won'].includes(deal.stage||'') &&
          old?.stage !== deal.stage
        ) {
          const popup: ClosePopup = {
            id: deal.id + Date.now(),
            rep: deal.assigned_to || deal.rep_name || 'Rep',
            client: deal.business_name || deal.client_name || 'Client',
            amount: deal.value || deal.amount || 0,
            service: deal.service_type || 'Digital Marketing',
          }
          setPopups(prev => [popup, ...prev].slice(0, 3))
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => { db.dialer.removeChannel(channel) }
  }, [loadCallFloor])

  // ─── Dial ────────────────────────────────────────────────────────────────────
  const startCall = async () => {
    if (!currentLead?.phone) return
    setCallState('calling')
    setCallError(null)
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/dialpad-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: currentLead.phone, lead_id: currentLead.id }),
      })
      if (!res.ok) throw new Error(await res.text())
      setCallState('connected')
    } catch (err: any) {
      setCallError(err.message)
      setCallState('idle')
    }
  }

  const endCall = () => { setCallState('idle'); setCallError(null) }
  const nextLead = () => { endCall(); setCurrentIndex(i => Math.min(i+1, dialQueue.length-1)) }

  const repStatus = (rep: CallFloorRep) => {
    const s = rep.call_status || rep.status || 'available'
    if (['on-call','on_call','calling','active'].includes(s)) return { label:'On Call', cls:'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
    if (['available','ready'].includes(s))                         return { label:'Available', cls:'bg-cyan/10 text-cyan border-cyan/30' }
    return { label:'Away', cls:'bg-amber-500/10 text-amber-400 border-amber-500/30' }
  }

  const floorStats = {
    onCall:    callFloor.filter(r => ['on-call','on_call','calling','active'].includes(r.call_status||r.status||'')).length,
    available: callFloor.filter(r => ['available','ready'].includes(r.call_status||r.status||'')).length,
    revenue:   callFloor.reduce((s,r) => s+(r.revenue_today||0), 0),
    deals:     callFloor.reduce((s,r) => s+(r.deals_today||0), 0),
  }

  return (
    <>
      {/* Close Popups */}
      <AnimatePresence>
        {popups.map(p => (
          <CloseToast key={p.id} popup={p} onDismiss={() => setPopups(prev => prev.filter(x => x.id !== p.id))}/>
        ))}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Phone className="w-5 h-5 text-cyan"/> PowerDial
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">AI-assisted calling · Live call floor · Realtime deal alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/> {floorStats.onCall} On Call
            </Badge>
            <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan bg-cyan/5 flex items-center gap-1">
              <Users className="w-3 h-3"/> {callFloor.length} Reps
            </Badge>
            <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={loadCallFloor}>
              <RefreshCw className="w-3.5 h-3.5"/>
            </Button>
          </div>
        </div>

        {/* Floor Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'On Call',   value:floorStats.onCall,    icon:Phone,      color:'text-emerald-400' },
            { label:'Available', value:floorStats.available, icon:Users,      color:'text-cyan' },
            { label:'Deals Today',value:floorStats.deals,    icon:CheckCircle2,color:'text-violet' },
            { label:'Revenue',   value:floorStats.revenue,   icon:DollarSign, color:'text-amber-400', currency:true },
          ].map((m,i) => (
            <motion.div key={m.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
              <div className="flex items-center gap-2 mb-2">
                <m.icon className={`w-4 h-4 ${m.color}`}/>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
              </div>
              <div className="text-2xl font-bold text-foreground font-mono">
                {m.currency ? formatCurrency(m.value) : m.value}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Active Dial Panel */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
            className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/40 card-glow">

            {currentLead ? (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-lg font-bold text-foreground">{currentLead.business_name || 'Unknown'}</p>
                    <p className="text-sm text-cyan">{currentLead.phone}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{currentLead.email}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Source: {currentLead.source || '—'} · Status: {currentLead.status || '—'}
                    </p>
                  </div>
                  <Badge className={`text-xs capitalize ${
                    callState==='connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    callState==='calling'   ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-muted text-muted-foreground'}`}>
                    {callState==='connected' ? <>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1.5 inline-block"/>Connected
                    </> : callState==='calling' ? 'Calling...' : 'Ready'}
                  </Badge>
                </div>

                {callError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{callError}</div>
                )}

                <div className="flex items-center justify-center gap-5 py-4">
                  {callState === 'idle' ? (
                    <Button onClick={startCall}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 h-12 rounded-full font-bold">
                      <Phone className="w-4 h-4 mr-2"/> Dial Now
                    </Button>
                  ) : callState === 'calling' ? (
                    <Button disabled className="bg-amber-500/20 text-amber-400 px-10 h-12 rounded-full">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin"/> Connecting...
                    </Button>
                  ) : (
                    <>
                      <button onClick={() => setMuted(!muted)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                          muted ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-card border-border/40 text-muted-foreground hover:text-foreground'}`}>
                        {muted ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
                      </button>
                      <button onClick={endCall}
                        className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-lg">
                        <PhoneOff className="w-6 h-6"/>
                      </button>
                      <button onClick={nextLead}
                        className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all">
                        <CheckCircle2 className="w-5 h-5"/>
                      </button>
                    </>
                  )}
                </div>

                {/* Queue progress */}
                <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Lead {currentIndex+1} of {dialQueue.length}</span>
                  <div className="flex gap-1">
                    {dialQueue.slice(0,8).map((_,i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i===currentIndex?'bg-cyan':i<currentIndex?'bg-emerald-400':'bg-muted'}`}/>
                    ))}
                  </div>
                  <span>{dialQueue.length - currentIndex - 1} remaining</span>
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                {leadsLoading ? 'Loading dial queue from CRM...' : 'No leads with phone numbers in queue'}
              </div>
            )}
          </motion.div>

          {/* Dial Queue */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
            <h3 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan"/> Queue ({dialQueue.length})
            </h3>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {dialQueue.map((lead, i) => (
                <button key={lead.id} onClick={() => { setCurrentIndex(i); endCall() }}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                    i===currentIndex ? 'bg-cyan/10 border border-cyan/20' : 'hover:bg-space-highlight/30'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    i===currentIndex?'bg-cyan/20 text-cyan':'bg-muted text-muted-foreground'}`}>{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{lead.business_name||lead.email||'Unknown'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{lead.phone}</p>
                  </div>
                </button>
              ))}
              {!leadsLoading && dialQueue.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No leads with phone numbers</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Live Call Floor */}
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan"/> Live Call Floor
              <span className="text-[10px] text-muted-foreground font-normal">— dialer.v_call_floor</span>
            </h3>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/> Realtime
            </Badge>
          </div>

          {floorLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading call floor...</div>
          ) : callFloor.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No data in dialer.v_call_floor<br/>
              <span className="text-[10px] mt-1 block text-muted-foreground/60">View will populate as calls are made</span>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 divide-y divide-border/10">
              <div className="contents">
                {['Rep','Current Lead','Status','Calls Today','Deals'].map(h => (
                  <div key={h} className="px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider">{h}</div>
                ))}
              </div>
              {callFloor.map((rep, i) => {
                const status = repStatus(rep)
                return (
                  <motion.div key={rep.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                    className="contents">
                    <div className="px-4 py-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-cyan/20 flex items-center justify-center text-xs font-bold text-cyan flex-shrink-0">
                        {(rep.rep_name||rep.name||rep.assigned_to||'R').charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{rep.rep_name||rep.name||rep.assigned_to||'Unknown'}</p>
                    </div>
                    <div className="px-4 py-3 flex items-center">
                      <p className="text-xs text-muted-foreground truncate">{rep.current_lead||rep.lead_name||'—'}</p>
                    </div>
                    <div className="px-4 py-3 flex items-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${status.cls}`}>{status.label}</span>
                    </div>
                    <div className="px-4 py-3 flex items-center">
                      <p className="text-sm font-medium text-foreground">{rep.calls_today||0}</p>
                    </div>
                    <div className="px-4 py-3 flex items-center">
                      <p className="text-sm font-semibold text-emerald-400">{rep.deals_today||0}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
