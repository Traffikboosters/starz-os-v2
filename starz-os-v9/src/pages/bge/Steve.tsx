import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Sparkles, TrendingUp, Target, Send, Loader2, Award, Zap, Flame, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'

const steveResponses: Record<string, string> = {
  'lead': 'Priority lead: Seattle Coffee Co (L-9205) — score 95, viewed proposal twice. Call within 2 hours for best close rate.',
  'close': 'For Seattle Coffee Co, use the Urgency Close: "Robert, I only have 2 slots left for August onboarding. Can we lock this in today?"',
  'pipeline': 'You have 6 open deals worth $41,600. 2 are hot leads in proposal stage. Focus there for fastest commission.',
  'earnings': 'You\'ve earned $20,160 so far this month. 30% commission rate. You need $4,840 more to hit your $25K goal.',
  'tips': 'Your Silent Close has 83% success rate. After asking for the sale, stay quiet for 5+ seconds. It works.',
  'hello': 'Hey DJ! Ready to crush it today? You have 6 leads to work and 2 hot proposals pending. What should we focus on?',
  'help': 'I can help with: lead prioritization, closing scripts, pipeline tracking, earnings projections, and technique tips.',
  'script': 'Here\'s a script: "Hey [name], it\'s DJ from STARZ-OS. We help [business type] get more customers online. I\'ve got a proven system that\'s generating results for similar businesses. Got 2 minutes?"',
}

function getSteveResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('lead') || lower.includes('priority')) return steveResponses.lead
  if (lower.includes('close') || lower.includes('script')) return steveResponses.script
  if (lower.includes('pipeline') || lower.includes('deals')) return steveResponses.pipeline
  if (lower.includes('earn') || lower.includes('money') || lower.includes('commission')) return steveResponses.earnings
  if (lower.includes('tip') || lower.includes('technique') || lower.includes('advice')) return steveResponses.tips
  if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey')) return steveResponses.hello
  if (lower.includes('help')) return steveResponses.help
  return 'Got it. Based on your current pipeline, I\'d recommend calling your hot leads first — they close 4x faster. Want a specific script?'
}

export default function BGESteve() {
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { sender: 'steve', text: 'Hey DJ! Ready to crush it today? You have 6 leads to work and 2 hot proposals pending. What should we focus on?' },
  ])
  const [typing, setTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { info } = useToast()

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, typing])

  const sendMessage = () => {
    if (!chatInput.trim()) return
    setChatMessages((prev) => [...prev, { sender: 'user', text: chatInput }])
    const userMsg = chatInput
    setChatInput('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setChatMessages((prev) => [...prev, { sender: 'steve', text: getSteveResponse(userMsg) }])
    }, 1000)
  }

  const quickAsk = (question: string) => {
    setChatMessages((prev) => [...prev, { sender: 'user', text: question }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setChatMessages((prev) => [...prev, { sender: 'steve', text: getSteveResponse(question) }])
    }, 1000)
  }

  const quickPrompts = [
    { label: 'Best lead?', action: 'Which lead should I call first?' },
    { label: 'Close script', action: 'Give me a closing script' },
    { label: 'My earnings', action: 'How much have I earned?' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan" />
            Ask Steve
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Your BGE sales coach — powered by AI</p>
        </div>
        <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan bg-cyan/5 rounded-lg">
          <Sparkles className="w-3 h-3 mr-1" /> BGE Mode
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Chat Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow flex flex-col h-[560px]"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Steve BGE Coach</h3>
              <p className="text-[10px] text-muted-foreground">Personalized for your leads and commissions</p>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickPrompts.map((p) => (
              <button key={p.label} onClick={() => quickAsk(p.action)} className="px-2.5 py-1.5 rounded-lg bg-space-highlight/40 border border-border/20 text-xs text-muted-foreground hover:text-cyan hover:border-cyan/20 transition-all">
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'steve' && (
                  <div className="w-6 h-6 rounded-full bg-cyan/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-cyan" />
                  </div>
                )}
                <div className={`p-3 rounded-xl max-w-[85%] text-sm ${
                  msg.sender === 'user'
                    ? 'bg-cyan/10 text-foreground border border-cyan/20'
                    : 'bg-space-highlight/50 text-muted-foreground border border-border/20'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-cyan" />
                </div>
                <div className="p-3 rounded-xl bg-space-highlight/50 border border-border/20">
                  <Loader2 className="w-4 h-4 text-cyan animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ask Steve anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="bg-card border-border/40 text-sm h-9 rounded-lg"
            />
            <Button size="sm" onClick={sendMessage} className="h-9 w-9 p-0 bg-gradient-primary text-space">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Sidebar Tips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-cyan" />
              <h3 className="font-semibold text-foreground text-sm">Today&apos;s Focus</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-space-highlight/30 border border-border/20 cursor-pointer hover:border-cyan/20 transition-all" onClick={() => quickAsk('Best lead?')}>
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-3 h-3 text-red-400" />
                  <p className="text-sm font-medium text-foreground">Call Seattle Coffee Co</p>
                </div>
                <p className="text-xs text-muted-foreground">Score 95, ready to close</p>
              </div>
              <div className="p-3 rounded-xl bg-space-highlight/30 border border-border/20 cursor-pointer hover:border-cyan/20 transition-all" onClick={() => quickAsk('Follow up Miami Roofing')}>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <p className="text-sm font-medium text-foreground">Follow up Miami Roofing</p>
                </div>
                <p className="text-xs text-muted-foreground">Proposal sent 2 days ago</p>
              </div>
              <div className="p-3 rounded-xl bg-space-highlight/30 border border-border/20 cursor-pointer hover:border-cyan/20 transition-all" onClick={() => quickAsk('Nurture Chicago Law')}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-cyan" />
                  <p className="text-sm font-medium text-foreground">Nurture Chicago Law</p>
                </div>
                <p className="text-xs text-muted-foreground">Cold lead, long cycle</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-cyan" />
              <h3 className="font-semibold text-foreground text-sm">Commission Tracker</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Closed this month</span>
                <span className="font-semibold text-emerald-400">$20,160</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending (4 deals)</span>
                <span className="font-semibold text-amber-400">$8,400</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">30% rate</span>
                <span className="font-semibold text-cyan">Active</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
