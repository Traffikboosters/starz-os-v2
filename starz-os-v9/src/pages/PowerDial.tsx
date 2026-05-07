import { useState, useEffect, useRef } from 'react'
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

type CallState = 'idle' | 'calling' | 'connected' | 'ended'

const leadQueue = [
  { id: 'L-8921', name: 'Mike Rodriguez', company: 'Miami Auto Group', source: 'Web Form', score: 92, status: 'hot', time: '2m ago' },
  { id: 'L-8922', name: 'Jennifer Walsh', company: 'NYC Dental', source: 'Referral', score: 88, status: 'hot', time: '5m ago' },
  { id: 'L-8923', name: 'Carlos Mendez', company: 'Phoenix Roofing', source: 'Cold Outreach', score: 74, status: 'warm', time: '12m ago' },
  { id: 'L-8924', name: 'Lisa Chen', company: 'SF Tech Startup', source: 'Web Form', score: 95, status: 'hot', time: '18m ago' },
  { id: 'L-8925', name: 'David Park', company: 'Chicago Law Firm', source: 'Ad Campaign', score: 67, status: 'warm', time: '34m ago' },
]

const steveScripts = [
  { type: 'insight', text: 'Lead has visited pricing page 4x in last 24h — high intent signal', icon: Target },
  { type: 'objection', text: 'Common objection: "Need to talk to my partner" — Use partner-close script', icon: AlertCircle },
  { type: 'tip', text: 'This company closed $12K deal last month with Elena — reference available', icon: Star },
  { type: 'alert', text: 'Lead score dropped 8pts after visiting cancellation page', icon: AlertCircle },
]

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

  const currentLead = leadQueue[currentLeadIndex]

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
    const SB_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://eeiqgmpqkwrqzqrdamxg.supabase.co"
    const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ""
    const script = document.createElement("script")
    script.src = "https://media.twiliocdn.com/sdk/js/voice/releases/2.11.0/twilio.min.js"
    script.async = true
    script.onload = async () => {
      try {
        const resp = await fetch(`${SB_URL}/functions/v1/twilio-token`, { headers: { Authorization: `Bearer ${SB_KEY}` } })
        const { token } = await resp.json()
        const TwilioSDK = (window as any).Twilio
        if (!TwilioSDK?.Device) return
        const device = new TwilioSDK.Device(token, { logLevel: 1, codecPreferences: ["opus", "pcmu"] })
        device.on("registered", () => { setDeviceReady(true); console.log("Twilio ready") })
        device.on("error", (e: any) => console.error("Twilio error:", e.message))
        device.register()
        deviceRef.current = device
      } catch (err) { console.error("Twilio init failed:", err) }
    }
    document.head.appendChild(script)
    return () => { try { document.head.removeChild(script) } catch {} }
  }, [])

  const startCall = async () => {
    const phone = dialNumber.trim()
    if (!phone) { info("Enter a phone number to dial"); return }
    if (!deviceRef.current) { info("Phone device not ready - please wait..."); return }
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
    setCallHistory((prev) => [{
      lead: currentLead.name,
      outcome: outcome === 'completed' ? (callTime > 60 ? 'Interested' : 'Short Call') : 'Skipped',
      amount: 0,
      duration: formatTime(callTime),
      time: 'Just now',
      type: 'outbound'
    }, ...prev])
    setCallState('ended')
    setOnHold(false)
    setMuted(false)
    if (outcome === 'completed') success(`Call ended. Duration: ${formatTime(callTime)}`)
  }

  const skipLead = () => {
    endCall('skipped')
  }

  const nextLead = () => {
    setCallState('idle')
    setCallTime(0)
    setCurrentLeadIndex((i) => Math.min(i + 1, leadQueue.length - 1))
  }

  const prevLead = () => {
    setCallState('idle')
    setCallTime(0)
    setCurrentLeadIndex((i) => Math.max(i - 1, 0))
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
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1" /> {leadQueue.length} in queue
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main Dialer */}
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
                  <p className="text-sm text-muted-foreground mb-3">{leadQueue.length - currentLeadIndex} leads remaining</p>
                  <div className="flex gap-2 justify-center mb-3 max-w-xs mx-auto">
                    <input value={dialNumber} onChange={e => setDialNumber(e.target.value)} onKeyDown={e => e.key === "Enter" && startCall()} placeholder="Enter phone number to dial..." className="flex-1 bg-card border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan/50" />
                  </div>
                  <p className={`text-xs mb-3 ${deviceReady ? "text-emerald-400" : "text-amber-400 animate-pulse"}`}>{deviceReady ? "Phone device connected" : "Connecting phone device..."}</p>
                  <div className="flex items-center gap-3 justify-center mb-4">
                    <Button size="sm" variant="outline" onClick={prevLead} disabled={currentLeadIndex === 0} className="border-border/40">
                      <RotateCcw className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button size="lg" onClick={startCall} disabled={!deviceReady || !dialNumber.trim()} className="bg-gradient-primary text-space font-bold px-8 glow-cyan disabled:opacity-50">
                      <Play className="w-4 h-4 mr-2" /> Start Call
                    </Button>
                    <Button size="sm" variant="outline" onClick={skipLead} className="border-border/40">
                      <SkipForward className="w-4 h-4 mr-1" /> Skip
                    </Button>
                  </div>
                  <div className="mt-4 p-3 rounded-xl bg-space-highlight/30 border border-border/20 inline-block">
                    <p className="text-sm font-medium text-foreground">{currentLead.name}</p>
                    <p className="text-xs text-muted-foreground">{currentLead.company} · Score: {currentLead.score}</p>
                  </div>
                </div>
              )}

              {callState === 'calling' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-cyan/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <PhoneIncoming className="w-10 h-10 text-cyan" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Calling {currentLead.name}...</h3>
                  <p className="text-sm text-muted-foreground">{currentLead.company}</p>
                  <Loader2 className="w-6 h-6 text-cyan animate-spin mx-auto mt-4" />
                </div>
              )}

              {(callState === 'connected' || callState === 'ended') && (
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 ring-2 ring-cyan/20">
                        <AvatarFallback className="bg-cyan/20 text-cyan text-lg font-bold">
                          {currentLead.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{currentLead.name}</h3>
                        <p className="text-sm text-muted-foreground">{currentLead.company}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/30">HOT</Badge>
                          <span className="text-xs text-muted-foreground">Score: {currentLead.score}</span>
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
                      {/* Steve Whisper */}
                      <div className="rounded-xl bg-space-highlight/50 border border-border/30 p-4 mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-cyan" />
                          <span className="text-xs font-semibold text-cyan uppercase tracking-wider">Steve Whisper</span>
                        </div>
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

                      {/* Controls */}
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
                              saleAmount: currentLead.value, clientName: currentLead.company,
                              city: 'Miami', state: 'FL', service: 'full_stack', tier: 'medium',
                            });
                          });
                        }} className="bg-gradient-primary text-space font-bold">
                          <FileText className="w-4 h-4 mr-2" /> Generate Proposal
                        </Button>
                        <Button variant="outline" onClick={() => {
                          success('Deal marked as Closed Won!');
                          endCall();
                          const tier = currentLead.value >= 10000 ? 'enterprise' : currentLead.value >= 2500 ? 'medium' : 'small';
                          import('@/components/SalesVictoryPopup').then(({ broadcastVictory }) => {
                            broadcastVictory({
                              repName: 'DJ Martinez', repRole: 'Business Growth Expert',
                              saleAmount: currentLead.value, clientName: currentLead.company,
                              city: 'Miami', state: 'FL', service: 'seo', tier: tier as any,
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
                      <Button onClick={nextLead} className="bg-gradient-primary text-space font-bold">
                        <Phone className="w-4 h-4 mr-2" /> Next Lead
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Call History */}
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

        {/* Lead Queue */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <h3 className="font-semibold text-foreground text-sm mb-4">Lead Queue</h3>
          <div className="space-y-2">
            {leadQueue.map((lead, i) => (
              <div key={lead.id} onClick={() => { setCallState('idle'); setCurrentLeadIndex(i); }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  i === currentLeadIndex ? 'border-cyan/30 bg-cyan/5' : 'border-border/30 hover:border-cyan/20 hover:bg-space-highlight/30'
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{lead.id}</span>
                  <Badge className={`text-[10px] ${lead.status === 'hot' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>{lead.status}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{lead.name}</p>
                <p className="text-[10px] text-muted-foreground">{lead.company} · {lead.source}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-cyan" />
                    <span className="text-xs text-cyan font-semibold">{lead.score}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{lead.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
