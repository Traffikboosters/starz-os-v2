import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play, SkipForward, Volume2,
  User, FileText, Target, AlertCircle, Star, CheckCircle2,
  PhoneIncoming, PhoneOutgoing, Loader2, Sparkles, BarChart3,
  Timer, RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase/client'

type CallState = 'idle' | 'calling' | 'connected' | 'ended'

// ─── Supabase data helpers ────────────────────────────────────────────────────
async function fetchLeadsFromSupabase() {
  const { data, error } = await supabase
    .from('leads')
    .select('id,business_name,phone,industry,score,call_attempts,disposition,source,status,website,rating,review_count,next_best_action,priority_level,email')
    .eq('status', 'qualified')
    .not('phone', 'is', null)
    .neq('phone', '')
    .order('score', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(70)
  if (error) throw new Error(error.message)
  return data || []
}

async function logCallToSupabase(lead: any, outcome: string, durationSecs: number) {
  try {
    await supabase.from('calls').insert({
      lead_id: lead.id,
      phone_dialed: lead.phone,
      disposition: outcome,
      duration_seconds: durationSecs,
      called_at: new Date().toISOString(),
    })
  } catch (e) {
    console.warn('Call log failed (non-blocking):', e)
  }
}

// ─── Disposition config ───────────────────────────────────────────────────────
function getDispositionConfig(disposition: string) {
  switch (disposition) {
    case 'hot_handoff':
      return { label: '🔥 Critical', color: 'bg-red-500/10 text-red-400 border-red-500/30' }
    case 'handoff_ready':
      return { label: '⚡ Ready', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
    case 'nurture':
      return { label: '🌱 Nurture', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
    default:
      return { label: '📋 New', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
  }
}

// ─── Estimated monthly value by industry ─────────────────────────────────────
function getEstimatedValue(industry: string) {
  const ind = (industry || '').toLowerCase()
  if (ind.match(/roof|solar/)) return '$4,500–$8,000/mo'
  if (ind.match(/hvac|plumb/)) return '$3,500–$6,000/mo'
  if (ind.match(/dental|medspa|plastic/)) return '$5,000–$12,000/mo'
  if (ind.match(/attorney|law/)) return '$4,000–$10,000/mo'
  if (ind.match(/electric|landscap/)) return '$2,500–$4,500/mo'
  return '$1,500–$3,000/mo'
}

// ─── Steve Whisper + Reasoning Panel ─────────────────────────────────────────
function getSteveScripts(lead: any) {
  const industry = (lead?.industry || '').toLowerCase()
  const score    = lead?.score || 0
  const attempts = lead?.call_attempts || 0
  const scripts  = []

  // Score reasoning
  if (score >= 90)
    scripts.push({ type: 'insight', text: `Score ${score} — Critical priority. High-ticket vertical + direct phone detected. Open with revenue impact immediately.`, icon: Target })
  else if (score >= 80)
    scripts.push({ type: 'insight', text: `Score ${score} — Hot lead. Strong commercial intent signals. Lead is ready for a direct pitch.`, icon: Target })
  else
    scripts.push({ type: 'insight', text: `Score ${score} — Qualified. Verify budget and timeline in first 60 seconds.`, icon: Target })

  // Industry-specific pitch
  if (industry.match(/roof/))
    scripts.push({ type: 'tip', text: 'Roofing — Pain point is storm season + local competition. Ask: "How are homeowners finding you right now?" Then pivot to SEO dominance.', icon: Star })
  else if (industry.match(/hvac/))
    scripts.push({ type: 'tip', text: 'HVAC — Seasonal urgency is your hook. "Are you booked out or scrambling for jobs?" Either answer opens the pitch.', icon: Star })
  else if (industry.match(/plumb/))
    scripts.push({ type: 'tip', text: 'Plumbing — Emergency services = high intent. Ask if they show up on Google Maps for emergency searches in their city.', icon: Star })
  else if (industry.match(/dental/))
    scripts.push({ type: 'tip', text: 'Dental — Patient acquisition is the pain. "How many new patients are you getting per month vs your goal?" Then pitch.', icon: Star })
  else if (industry.match(/attorney|law/))
    scripts.push({ type: 'tip', text: 'Legal — High LTV clients. Lead with case volume: "Are you turning away cases due to capacity or struggling to fill the pipeline?"', icon: Star })
  else
    scripts.push({ type: 'tip', text: `Offer a free local SEO audit as the opener. Ask: Are you showing up when people search for your service in your city? Then pivot to the pitch.`, icon: Star })

  // Prior attempts
  if (attempts > 0)
    scripts.push({ type: 'alert', text: `${attempts} prior contact attempt(s). Reference previous outreach: "I reached out before — wanted to make sure I caught you at a better time."`, icon: AlertCircle })

  // Universal objection handler
  scripts.push({ type: 'objection', text: `If they say they want info — respond: Absolutely, and I would rather spend 8 minutes walking you through it live so it is tailored to your market. Are you free for a quick call this week?`, icon: AlertCircle })

  return scripts
}

export default function PowerDial() {
  const [callState, setCallState] = useState<CallState>('idle')
  const [muted, setMuted] = useState(false)
  const [onHold, setOnHold] = useState(false)
  const [callTime, setCallTime] = useState(0)
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0)
  const [callHistory, setCallHistory] = useState<any[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { success, info } = useToast()
  const deviceRef = useRef<any>(null)
  const callRef = useRef<any>(null)
  const [deviceReady, setDeviceReady] = useState(false)
  const [dialNumber, setDialNumber] = useState('')

  // ─── Live Supabase leads ────────────────────────────────────────────────────
  const [leadQueue, setLeadQueue] = useState<any[]>([])
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [leadsError, setLeadsError] = useState<string | null>(null)

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true)
    setLeadsError(null)
    try {
      const data = await fetchLeadsFromSupabase()
      // Normalize fields for UI compatibility
      const normalized = (data || []).map((l: any) => ({
        ...l,
        name: l.business_name || l.name || 'Unknown',
        company: l.business_name || 'Unknown',
        source: l.source || l.industry || 'Organic',
        status: l.score >= 70 ? 'hot' : 'warm',
        time: l.created_at ? new Date(l.created_at).toLocaleDateString() : '',
        phone: l.phone,
        score: l.score || 0,
      }))
      setLeadQueue(normalized)
      if (normalized.length > 0) {
        setCurrentLeadIndex(0)
        if (normalized[0]?.phone) setDialNumber(normalized[0].phone)
      }
    } catch (e: any) {
      setLeadsError(e.message)
      console.error('Failed to load leads:', e)
    } finally {
      setLeadsLoading(false)
    }
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  const currentLead = leadQueue[currentLeadIndex]
  const steveScripts = currentLead ? getSteveScripts(currentLead) : []

  useEffect(() => {
    if (callState === 'connected' && !onHold) {
      timerRef.current = setInterval(() => setCallTime((t) => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [callState, onHold])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        setDeviceReady(false)

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (sessionError || !accessToken) {
          throw new Error('Sign in as an authorized Power Dial user')
        }

        const { data, error } = await supabase.functions.invoke('twilio-token', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (error || !data?.token) {
          throw new Error(data?.error || error?.message || 'Unable to obtain Twilio access token')
        }

        const { Device } = await import('@twilio/voice-sdk')
        const device = new Device(data.token, {
          logLevel: 1,
          codecPreferences: ['opus', 'pcmu'],
        })

        device.on('registered', () => {
          if (!cancelled) setDeviceReady(true)
        })
        device.on('unregistered', () => {
          if (!cancelled) setDeviceReady(false)
        })
        device.on('error', (error: any) => {
          console.error('Twilio error:', error.message)
          if (!cancelled) {
            setDeviceReady(false)
            info(`PowerDial unavailable: ${error.message}`)
          }
        })

        await device.register()
        if (!cancelled) deviceRef.current = device
      } catch (error) {
        console.error('Twilio init failed:', error)
        if (!cancelled) {
          setDeviceReady(false)
          info(`PowerDial unavailable: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }

    init()
    return () => {
      cancelled = true
      setDeviceReady(false)
      deviceRef.current?.destroy?.()
      deviceRef.current = null
    }
  }, [info])

  const startCall = async () => {
    const phone = dialNumber.trim()
    if (!phone) { info("Enter a phone number to dial"); return }
    if (!deviceRef.current) { info("Phone device not ready - please wait..."); return }
    if (!currentLead) { info("No leads loaded yet - please wait..."); return }
    const digits = phone.replace(/\D/g, "")
    const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`
    setCallState("calling")
    setCallTime(0)
    info(`Calling ${currentLead.name} at ${phone}...`)
    try {
      const call = await deviceRef.current.connect({ params: { To: e164 } })
      callRef.current = call
      call.on("accept", () => { setCallState("connected"); success(`Connected to ${currentLead.name}`) })
      call.on("disconnect", () => { callRef.current = null })
      call.on("error", (err: any) => { info(`Call error: ${err.message}`); setCallState("idle") })
    } catch (err) { info(`Failed: ${String(err)}`); setCallState("idle") }
  }

  const endCall = (outcome: 'completed' | 'skipped' = 'completed') => {
    if (callRef.current) { try { callRef.current.disconnect() } catch {} callRef.current = null }
    if (timerRef.current) clearInterval(timerRef.current)
    const callOutcome = outcome === 'completed' ? (callTime > 60 ? 'Interested' : 'Short Call') : 'Skipped'
    setCallHistory((prev) => [{
      lead: currentLead?.name || 'Unknown',
      outcome: callOutcome,
      amount: 0,
      duration: formatTime(callTime),
      time: 'Just now',
      type: 'outbound'
    }, ...prev])
    // Log call to Supabase (non-blocking)
    if (currentLead) logCallToSupabase(currentLead, callOutcome, callTime)
    setCallState('ended')
    setOnHold(false)
    setMuted(false)
    if (outcome === 'completed') success(`Call ended. Duration: ${formatTime(callTime)}`)
  }

  const skipLead = () => { if (!currentLead) return; endCall('skipped') }

  const nextLead = () => {
    setCallState('idle')
    setCallTime(0)
    const nextIndex = Math.min(currentLeadIndex + 1, leadQueue.length - 1)
    setCurrentLeadIndex(nextIndex)
    if (leadQueue[nextIndex]?.phone) setDialNumber(leadQueue[nextIndex].phone)
  }

  const prevLead = () => {
    setCallState('idle')
    setCallTime(0)
    const prevIndex = Math.max(currentLeadIndex - 1, 0)
    setCurrentLeadIndex(prevIndex)
    if (leadQueue[prevIndex]?.phone) setDialNumber(leadQueue[prevIndex].phone)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <img src="/logo-powerdial.png" alt="PowerDial" className="w-24 h-auto" />
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">AI-assisted calling with Steve Whisper</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan bg-cyan/5 rounded-lg">
            <Sparkles className="w-3 h-3 mr-1" /> Steve Active
          </Badge>
          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 rounded-lg">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1" />
            {leadsLoading ? '...' : leadQueue.length} in queue
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={callState}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl bg-card border border-border/40 card-glow p-6"
            >
              {callState === 'idle' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-cyan/10 flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-10 h-10 text-cyan" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Ready to dial</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {leadsLoading ? 'Loading leads...' : leadQueue.length === 0 ? 'No leads found' : `${leadQueue.length - currentLeadIndex} leads remaining`}
                  </p>
                  {leadsLoading && (
                    <div className="flex items-center justify-center gap-2 mb-3 text-xs text-cyan">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading live leads...
                    </div>
                  )}
                  {leadsError && (
                    <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
                      ⚠ Could not load leads: {leadsError}
                      <button onClick={loadLeads} className="ml-2 underline">Retry</button>
                    </div>
                  )}
                  <div className="flex gap-2 justify-center mb-3 max-w-xs mx-auto">
                    <input value={dialNumber} onChange={e => setDialNumber(e.target.value)} onKeyDown={e => e.key === "Enter" && startCall()} placeholder={currentLead?.phone || "Enter phone number to dial..."} className="flex-1 bg-card border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan/50" />
                    {currentLead?.phone && !dialNumber && (
                      <button onClick={() => setDialNumber(currentLead.phone)} className="px-3 py-2 rounded-xl bg-cyan/10 border border-cyan/20 text-xs text-cyan hover:bg-cyan/20 transition-colors whitespace-nowrap">
                        Use Lead #
                      </button>
                    )}
                  </div>
                  <p className={`text-xs mb-3 ${deviceReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {deviceReady ? 'Phone device connected' : 'Phone device unavailable'}
                  </p>
                  <div className="flex items-center gap-3 justify-center mb-4">
                    <Button size="sm" variant="outline" onClick={prevLead} disabled={currentLeadIndex === 0} className="border-border/40">
                      <RotateCcw className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button size="lg" onClick={startCall} disabled={!dialNumber.trim() || !deviceReady} className="bg-gradient-primary text-space font-bold px-8 glow-cyan disabled:opacity-50">
                      <Play className="w-4 h-4 mr-2" /> Start Call
                    </Button>
                    <Button size="sm" variant="outline" onClick={skipLead} className="border-border/40">
                      <SkipForward className="w-4 h-4 mr-1" /> Skip
                    </Button>
                  </div>
                  {currentLead && (
                    <div className="mt-4 p-3 rounded-xl bg-space-highlight/30 border border-border/20 inline-block">
                      <p className="text-sm font-medium text-foreground">{currentLead.name}</p>
                      <p className="text-xs text-muted-foreground">{currentLead.company} · Score: {currentLead.score}</p>
                    </div>
                  )}
                </div>
              )}

              {callState === 'calling' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-cyan/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <PhoneIncoming className="w-10 h-10 text-cyan" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Calling {currentLead?.name ?? '...'}...</h3>
                  <p className="text-sm text-muted-foreground">{currentLead?.company ?? ''}</p>
                  <Loader2 className="w-6 h-6 text-cyan animate-spin mx-auto mt-4" />
                </div>
              )}

              {(callState === 'connected' || callState === 'ended') && (
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 ring-2 ring-cyan/20">
                        <AvatarFallback className="bg-cyan/20 text-cyan text-lg font-bold">
                          {(currentLead?.name ?? '??').split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{currentLead?.name ?? ''}</h3>
                        <p className="text-sm text-muted-foreground">{currentLead?.company ?? ''}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30">HOT</Badge>
                          <span className="text-xs text-muted-foreground">Score: {currentLead?.score ?? 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-mono font-bold ${onHold ? 'text-amber-400' : 'text-foreground'}`}>{formatTime(callTime)}</div>
                      <p className="text-[10px] text-muted-foreground">{onHold ? 'ON HOLD' : 'call duration'}</p>
                    </div>
                  </div>

                  {callState === 'connected' && (
                    <>
                      <div className="rounded-xl bg-space-highlight/50 border border-border/30 p-4 mb-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan" />
                            <span className="text-xs font-semibold text-cyan uppercase tracking-wider">Steve AI Analysis</span>
                          </div>
                          {currentLead && (
                            <Badge className={`text-[10px] ${getDispositionConfig(currentLead.disposition).color}`}>
                              {getDispositionConfig(currentLead.disposition).label}
                            </Badge>
                          )}
                        </div>
                        {currentLead && (
                          <div className="mb-3 p-2.5 rounded-lg bg-cyan/5 border border-cyan/10">
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-muted-foreground">Industry</span>
                                <p className="text-foreground font-medium capitalize">{currentLead.industry || 'Unknown'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Est. Value</span>
                                <p className="text-emerald-400 font-medium">{getEstimatedValue(currentLead.industry)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Source</span>
                                <p className="text-foreground font-medium">{currentLead.source || 'Organic'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Steve Score</span>
                                <p className="text-cyan font-bold">{currentLead.score}/100</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          {steveScripts.map((w, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-2 text-sm">
                              <w.icon className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{w.text}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => setMuted(!muted)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-red-500/20 text-red-400' : 'bg-card border border-border/40 text-foreground hover:bg-space-highlight'}`}>
                          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button onClick={() => setOnHold(!onHold)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${onHold ? 'bg-amber-500/20 text-amber-400' : 'bg-card border border-border/40 text-foreground hover:bg-space-highlight'}`}>
                          {onHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                        </button>
                        <button onClick={() => endCall()} className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-all">
                          <PhoneOff className="w-6 h-6" />
                        </button>
                        <button onClick={skipLead} className="w-12 h-12 rounded-full bg-card border border-border/40 text-foreground hover:bg-space-highlight flex items-center justify-center transition-all">
                          <SkipForward className="w-5 h-5" />
                        </button>
                        <button className="w-12 h-12 rounded-full bg-card border border-border/40 text-foreground hover:bg-space-highlight flex items-center justify-center transition-all">
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-5 flex justify-center gap-3">
                        <Button onClick={() => {
                          success('Proposal generated!'); endCall();
                          import('@/components/SalesVictoryPopup').then(({ broadcastVictory }) => {
                            broadcastVictory({
                              repName: 'DJ Martinez', repRole: 'Business Growth Expert',
                              saleAmount: (currentLead as any).value, clientName: currentLead.company,
                              city: 'Miami', state: 'FL', service: 'full_stack', tier: 'medium',
                            });
                          });
                        }} className="bg-gradient-primary text-space font-bold">
                          <FileText className="w-4 h-4 mr-2" /> Generate Proposal
                        </Button>
                        <Button variant="outline" onClick={() => {
                          success('Deal marked as Closed Won!'); endCall();
                          import('@/components/SalesVictoryPopup').then(({ broadcastVictory }) => {
                            broadcastVictory({
                              repName: 'DJ Martinez', repRole: 'Business Growth Expert',
                              saleAmount: (currentLead as any).value, clientName: currentLead.company,
                              city: 'Miami', state: 'FL', service: 'seo', tier: 'medium',
                            });
                          });
                        }} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Close Deal
                        </Button>
                      </div>
                    </>
                  )}

                  {callState === 'ended' && (
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-foreground mb-1">Call Ended</h3>
                      <p className="text-sm text-muted-foreground mb-4">Duration: {formatTime(callTime)}</p>
                      <div className="flex items-center justify-center gap-3">
                        <Button variant="outline" onClick={() => { setCallState('idle'); setCallTime(0); }} className="border-border/40 text-muted-foreground">
                          <RotateCcw className="w-4 h-4 mr-2" /> Stay on Lead
                        </Button>
                        <Button onClick={nextLead} className="bg-gradient-primary text-space font-bold">
                          <Phone className="w-4 h-4 mr-2" /> Next Lead
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-border/40 card-glow p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">Session History</h3>
            {callHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No calls yet. Start dialing!</p>
            ) : (
              <div className="space-y-1">
                {callHistory.map((call, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-space-highlight/30 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${call.outcome === 'Interested' ? 'bg-emerald-500/10' : 'bg-cyan/10'}`}>
                      <PhoneOutgoing className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{call.lead}</p>
                      <p className="text-[10px] text-muted-foreground">{call.duration} · {call.outcome}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{call.time}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <h3 className="font-semibold text-foreground text-sm mb-4">Lead Queue</h3>
          <div className="space-y-2">
            {leadQueue.map((lead, i) => {
              const disp = getDispositionConfig(lead.disposition)
              return (
                <div key={lead.id} onClick={() => { setCallState('idle'); setCurrentLeadIndex(i); if (lead.phone) setDialNumber(lead.phone); }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    i === currentLeadIndex ? 'border-cyan/30 bg-cyan/5' : 'border-border/30 hover:border-cyan/20 hover:bg-space-highlight/30'
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">#{String(i + 1).padStart(3, '0')}</span>
                    <Badge className={`text-[10px] ${disp.color}`}>{disp.label}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{lead.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{lead.industry || 'General'} · {lead.phone || 'No phone'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-cyan" />
                      <span className="text-xs text-cyan font-semibold">{lead.score}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{lead.call_attempts ? `${lead.call_attempts} attempts` : 'New'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}