import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Phone, PhoneOff, Mic, MicOff, Pause, SkipForward, Volume2,
  Target, Clock, Zap, Bot, User, Building2, Star, ChevronRight,
  FileText, CheckCircle2, DollarSign, BarChart3, Flame, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type CallState = 'idle' | 'calling' | 'connected' | 'ended'

const leads = [
  { id: 'L-9201', business: 'Miami Roofing Pros', contact: 'Mike Rodriguez', phone: '(305) 555-0142', score: 92, status: 'hot', notes: 'Referred by previous client. High intent.' },
  { id: 'L-9202', business: 'NYC Dental Studio', contact: 'Dr. Jennifer Walsh', phone: '(212) 555-0198', score: 88, status: 'hot', notes: 'Interested in full-stack package.' },
  { id: 'L-9203', business: 'Phoenix Auto Repair', contact: 'Carlos Mendez', phone: '(602) 555-0112', score: 74, status: 'warm', notes: 'Needs PPC + local SEO.' },
  { id: 'L-9204', business: 'Dallas Fitness Club', contact: 'Angela Torres', phone: '(214) 555-0167', score: 67, status: 'warm', notes: 'Small budget, start with social.' },
  { id: 'L-9205', business: 'Seattle Coffee Co', contact: 'Robert Kim', phone: '(206) 555-0156', score: 95, status: 'hot', notes: 'Ready to close. Follow up tomorrow.' },
]

const steveWhispers = [
  'Lead has viewed pricing page 3x — use urgency close',
  'Previous call: interested in SEO + PPC bundle',
  'Competitor mention: mentioned "current agency" — differentiate on reporting',
  'Budget signal: clicked $5K+ packages — qualify for premium',
]

export default function BGEPowerDial() {
  const [callState, setCallState] = useState<CallState>('idle')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [muted, setMuted] = useState(false)
  const [onHold, setOnHold] = useState(false)
  const [callTime, setCallTime] = useState(0)
  const [callHistory, setCallHistory] = useLocalStorage<{lead: string; duration: number; time: string; outcome: string}[]>('starz-bge-calls', [])
  const [showProposal, setShowProposal] = useState(false)
  const { success, info } = useToast()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentLead = leads[currentIdx]

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
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const startCall = () => {
    setCallState('calling')
    setCallTime(0)
    setTimeout(() => setCallState('connected'), 2500)
  }

  const endCall = () => {
    setCallState('ended')
    setCallHistory((prev: any[]) => [...prev, { lead: currentLead.business, duration: callTime, time: new Date().toLocaleTimeString(), outcome: onHold ? 'hold' : 'completed' }])
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const nextLead = () => {
    setCurrentIdx((i) => (i + 1) % leads.length)
    setCallState('idle')
    setCallTime(0)
    setMuted(false)
    setOnHold(false)
    setShowProposal(false)
  }

  const prevLead = () => {
    setCurrentIdx((i) => (i - 1 + leads.length) % leads.length)
    setCallState('idle')
    setCallTime(0)
    setMuted(false)
    setOnHold(false)
    setShowProposal(false)
  }

  const handleGenerateProposal = () => {
    success('Proposal generated for ' + currentLead.business)
    setShowProposal(true)
  }

  const handleCloseDeal = () => {
    success(`Deal closed with ${currentLead.business}! +30% commission`)
    endCall()
  }

  const handleVoicemail = () => {
    info('Voicemail script: "Hey [name], this is DJ from STARZ-OS. We help businesses like [business] get more leads online. Give me a call back when you have a moment — (305) 555-0100."')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <img src="/logo-powerdial.png" alt="PowerDial" className="w-24 h-auto" />
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">BGE dialer — your assigned leads only</p>
        </div>
        <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan bg-cyan/5 rounded-lg">
          <Target className="w-3 h-3 mr-1" /> {leads.length} leads queued
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Dialer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/40 card-glow"
        >
          {/* Lead Info */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan/10 flex items-center justify-center">
                <User className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{currentLead.contact}</h3>
                  <Badge className={`text-[10px] ${currentLead.status === 'hot' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                    {currentLead.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{currentLead.business}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-cyan font-medium">{currentLead.phone}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="w-3 h-3 text-cyan" /> {currentLead.score}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-muted-foreground">{currentLead.id}</span>
              <p className="text-xs text-muted-foreground mt-1">Lead {currentIdx + 1} of {leads.length}</p>
            </div>
          </div>

          {/* Call Status */}
          {callState === 'idle' && (
            <div className="flex items-center justify-center py-8">
              <Button size="lg" className="bg-gradient-primary text-space font-bold text-lg h-14 px-8 rounded-2xl" onClick={startCall}>
                <Phone className="w-6 h-6 mr-2" /> Start Call
              </Button>
            </div>
          )}

          {callState === 'calling' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-amber-400/20 flex items-center justify-center mb-4 animate-pulse">
                <Phone className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
              <p className="text-lg font-semibold text-amber-400">Calling...</p>
              <p className="text-sm text-muted-foreground">{currentLead.phone}</p>
            </div>
          )}

          {(callState === 'connected' || callState === 'ended') && (
            <>
              <div className="flex flex-col items-center py-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${callState === 'connected' ? 'bg-emerald-400/20' : 'bg-cyan/10'}`}>
                  {callState === 'connected' ? <Phone className="w-8 h-8 text-emerald-400" /> : <CheckCircle2 className="w-8 h-8 text-cyan" />}
                </div>
                <p className="text-2xl font-mono font-bold text-foreground">{formatTime(callTime)}</p>
                <p className="text-sm text-muted-foreground mt-1">{onHold ? 'On Hold' : callState === 'ended' ? 'Call Ended' : 'Connected'}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 py-4">
                <button onClick={() => setMuted(!muted)} className={`p-3 rounded-xl transition-all ${muted ? 'bg-red-500/10 text-red-400' : 'bg-card border border-border/30 text-muted-foreground hover:text-foreground'}`}>
                  {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button onClick={() => setOnHold(!onHold)} className={`p-3 rounded-xl transition-all ${onHold ? 'bg-amber-400/10 text-amber-400' : 'bg-card border border-border/30 text-muted-foreground hover:text-foreground'}`}>
                  <Pause className="w-5 h-5" />
                </button>
                <button onClick={endCall} disabled={callState === 'ended'} className="p-4 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button onClick={handleVoicemail} className="p-3 rounded-xl bg-card border border-border/30 text-muted-foreground hover:text-foreground transition-all">
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-xl bg-card border border-border/30 text-muted-foreground hover:text-foreground transition-all">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {callState === 'ended' && (
                <div className="flex items-center justify-center gap-3 py-2">
                  <Button variant="outline" className="border-cyan/30 text-cyan" onClick={handleGenerateProposal}>
                    <FileText className="w-4 h-4 mr-1.5" /> Generate Proposal
                  </Button>
                  <Button className="bg-gradient-primary text-space" onClick={handleCloseDeal}>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Close Deal
                  </Button>
                </div>
              )}

              {showProposal && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-cyan/5 border border-cyan/20">
                  <p className="text-sm text-foreground font-medium">Proposal Ready</p>
                  <p className="text-xs text-muted-foreground">SEO Premium Package for {currentLead.business}</p>
                  <p className="text-lg font-bold text-cyan mt-1">$8,400 <span className="text-xs font-normal text-muted-foreground">(your 30% = $2,520)</span></p>
                </motion.div>
              )}
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/20">
            <Button variant="outline" size="sm" className="border-border/40 text-xs" onClick={prevLead}>
              <ChevronRight className="w-3 h-3 mr-1 rotate-180" /> Previous
            </Button>
            <Button variant="outline" size="sm" className="border-border/40 text-xs" onClick={nextLead}>
              <SkipForward className="w-3 h-3 mr-1" /> Next Lead
            </Button>
          </div>
        </motion.div>

        {/* Steve Whisper */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-cyan" />
            <h3 className="font-semibold text-foreground text-sm">Steve Whisper</h3>
          </div>
          <div className="space-y-3">
            {steveWhispers.map((w, i) => (
              <div key={i} className="p-3 rounded-xl bg-space-highlight/30 border border-border/20">
                <p className="text-xs text-muted-foreground">{w}</p>
              </div>
            ))}
          </div>

          {/* Call History */}
          <div className="mt-5 pt-4 border-t border-border/20">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Today&apos;s Calls</h4>
            <div className="space-y-2">
              {callHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">No calls yet today</p>
              ) : (
                callHistory.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{c.lead}</span>
                    <span className="text-muted-foreground">{formatTime(c.duration)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


