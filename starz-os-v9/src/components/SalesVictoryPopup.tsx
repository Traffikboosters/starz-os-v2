import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Rocket, Crown, X, TrendingUp, MapPin, Zap, Star } from 'lucide-react'

export interface VictoryEvent {
  id: string
  repName: string
  repRole: string
  repAvatar?: string
  saleAmount: number
  clientName: string
  city: string
  state: string
  service: string
  timestamp: Date
  tier: 'small' | 'medium' | 'enterprise'
}

const tierConfig = {
  small: {
    label: 'DEAL CLOSED',
    icon: Flame,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    amountClass: 'text-amber-400',
    sound: '/victory-chime.mp3',
    maxStack: 3,
    dismissMs: 8000,
  },
  medium: {
    label: 'NEW PARTNER SIGNED',
    icon: Rocket,
    iconColor: 'text-cyan',
    iconBg: 'bg-cyan/15',
    borderColor: 'border-cyan/40',
    glowColor: 'shadow-[0_0_40px_rgba(0,240,255,0.2)]',
    amountClass: 'text-cyan',
    sound: '/victory-chime.mp3',
    maxStack: 3,
    dismissMs: 10000,
  },
  enterprise: {
    label: 'ENTERPRISE DEAL',
    icon: Crown,
    iconColor: 'text-violet',
    iconBg: 'bg-violet/15',
    borderColor: 'border-violet/50',
    glowColor: 'shadow-[0_0_50px_rgba(139,92,246,0.3)]',
    amountClass: 'text-violet',
    sound: '/enterprise-chime.mp3',
    maxStack: 2,
    dismissMs: 12000,
  },
}

const serviceIcons: Record<string, string> = {
  seo: '🔍',
  ppc: '📢',
  'web_design': '🎨',
  social_media: '📱',
  full_stack: '🚀',
  content: '✍️',
  reputation: '⭐',
  local_seo: '📍',
  automation: '⚡',
}

function VictoryCard({ event, onDismiss }: { event: VictoryEvent; onDismiss: () => void }) {
  const config = tierConfig[event.tier]
  const TierIcon = config.icon
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    // Play sound
    const audio = new Audio(config.sound)
    audio.volume = 0.4
    audio.play().catch(() => {})
    audioRef.current = audio

    // Progress bar countdown
    const start = Date.now()
    const duration = config.dismissMs
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onDismiss()
      }
    }, 50)

    const timeout = setTimeout(() => onDismiss(), config.dismissMs)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 120, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 120, scale: 0.85, transition: { duration: 0.3 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`
        relative w-[340px] rounded-2xl overflow-hidden cursor-pointer
        bg-card/95 backdrop-blur-xl
        border ${config.borderColor} ${config.glowColor}
        select-none
      `}
      onClick={onDismiss}
    >
      {/* Animated gradient background */}
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${
        event.tier === 'small' ? 'from-amber-400/20 to-transparent' :
        event.tier === 'medium' ? 'from-cyan/20 to-transparent' :
        'from-violet/20 to-transparent'
      }`} />

      {/* Pulse animation for enterprise */}
      {event.tier === 'enterprise' && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-violet/30"
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${config.iconBg} flex items-center justify-center`}>
              <TierIcon className={`w-4 h-4 ${config.iconColor}`} />
            </div>
            <span className={`text-[10px] font-bold tracking-[0.15em] ${config.iconColor}`}>
              {config.label}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss() }}
            className="p-1 rounded hover:bg-space-highlight/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rep + Amount */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-violet/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-foreground">{event.repName.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{event.repName}</p>
            <p className="text-[10px] text-muted-foreground">{event.repRole}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-xl font-bold ${config.amountClass}`}>
              ${event.saleAmount.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xs">{serviceIcons[event.service] || '📊'}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{event.service.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-space-highlight/40 border border-border/20">
          <div className="w-7 h-7 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-cyan" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{event.clientName}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              {event.city}, {event.state}
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-muted">
        <motion.div
          className={`h-full ${
            event.tier === 'small' ? 'bg-amber-400' :
            event.tier === 'medium' ? 'bg-cyan' : 'bg-violet'
          }`}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>
    </motion.div>
  )
}

export function SalesVictoryFeed() {
  const [events, setEvents] = useState<VictoryEvent[]>([])
  const [enabled, setEnabled] = useState(true)

  const addVictory = (event: VictoryEvent) => {
    setEvents(prev => {
      const next = [event, ...prev]
      // Keep max 3 popups
      return next.slice(0, 3)
    })
  }

  const dismissEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  // Simulated real-time feed (replace with Supabase subscription)
  useEffect(() => {
    if (!enabled) return

    const sampleEvents: Omit<VictoryEvent, 'id' | 'timestamp'>[] = [
      { repName: 'Mike Williams', repRole: 'Sales Contractor', saleAmount: 7500, clientName: 'Williams Plumbing LLC', city: 'Houston', state: 'TX', service: 'seo', tier: 'medium' },
      { repName: 'Sarah Johnson', repRole: 'Senior Closer', saleAmount: 12000, clientName: 'Elite Dental Group', city: 'Miami', state: 'FL', service: 'full_stack', tier: 'enterprise' },
      { repName: 'DJ Martinez', repRole: 'Business Growth Expert', saleAmount: 4200, clientName: 'Austin Fitness Center', city: 'Austin', state: 'TX', service: 'social_media', tier: 'small' },
      { repName: 'Elena Rossi', repRole: 'Sales Manager', saleAmount: 18500, clientName: 'Metro Real Estate Group', city: 'New York', state: 'NY', service: 'seo', tier: 'enterprise' },
      { repName: 'Marcus Webb', repRole: 'Sales Rep', saleAmount: 8900, clientName: 'Sunset Auto Dealership', city: 'Los Angeles', state: 'CA', service: 'ppc', tier: 'medium' },
      { repName: 'Aisha Patel', repRole: 'Closer', saleAmount: 3200, clientName: 'Riverside Cafe', city: 'Chicago', state: 'IL', service: 'web_design', tier: 'small' },
      { repName: 'James Park', repRole: 'Contractor', saleAmount: 15000, clientName: 'Golden State Roofing', city: 'San Francisco', state: 'CA', service: 'reputation', tier: 'enterprise' },
      { repName: 'Tasha Brown', repRole: 'BGE Partner', saleAmount: 6800, clientName: 'Premium Dental Care', city: 'Atlanta', state: 'GA', service: 'local_seo', tier: 'medium' },
    ]

    // Fire initial event after 5 seconds
    const initialTimeout = setTimeout(() => {
      const ev = sampleEvents[Math.floor(Math.random() * sampleEvents.length)]
      addVictory({ ...ev, id: crypto.randomUUID(), timestamp: new Date() })
    }, 5000)

    // Then every 25-40 seconds
    const interval = setInterval(() => {
      const ev = sampleEvents[Math.floor(Math.random() * sampleEvents.length)]
      addVictory({ ...ev, id: crypto.randomUUID(), timestamp: new Date() })
    }, 28000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [enabled])

  // Listen for manual victory triggers from other components
  useEffect(() => {
    const handler = (e: CustomEvent<VictoryEvent>) => {
      addVictory(e.detail)
    }
    window.addEventListener('sales-victory' as any, handler)
    return () => window.removeEventListener('sales-victory' as any, handler)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {events.map((event) => (
          <div key={event.id} className="pointer-events-auto">
            <VictoryCard event={event} onDismiss={() => dismissEvent(event.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Helper to broadcast victory from anywhere
export function broadcastVictory(event: Omit<VictoryEvent, 'id' | 'timestamp'>) {
  const fullEvent: VictoryEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  }
  window.dispatchEvent(new CustomEvent('sales-victory', { detail: fullEvent }))
}
