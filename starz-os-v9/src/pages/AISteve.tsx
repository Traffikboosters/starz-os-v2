import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bot, Sparkles, TrendingUp, Target, Flame, AlertCircle, Zap, BarChart3, Award, Brain, Lightbulb, Send, Loader2} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useToast } from '@/hooks/useToast'

const steveInsights = [
  { type: 'close_pattern', title: 'High-Value Close Pattern Detected', desc: 'Leads who view pricing 3+ times close 4.2x more often. Trigger urgency script.', confidence: 94, time: 'now' },
  { type: 'objection', title: 'Top Objection This Week', desc: '"Need to talk to my partner" — 34% of lost deals. Use partner-close technique.', confidence: 88, time: '2h ago' },
  { type: 'lead_score', title: 'Lead Score Spike', desc: 'L-8924 (Lisa Chen) score jumped from 78 → 95 after blog visit. Prioritize now.', confidence: 97, time: '15m ago' },
  { type: 'market', title: 'Market Signal', desc: 'Dental vertical showing 23% uptick in searches. Recommend NYC Dental upsell.', confidence: 82, time: '4h ago' },
]

const dealHeatmap = [
  { client: 'Miami Auto Group', score: 92, temp: 'hot', stage: 'Proposal Sent', rep: 'Sarah Chen', value: 8400, nextAction: 'Follow up in 24h' },
  { client: 'NYC Dental', score: 88, temp: 'hot', stage: 'Discovery', rep: 'Elena Rossi', value: 12200, nextAction: 'Schedule demo' },
  { client: 'SF Tech Startup', score: 95, temp: 'hot', stage: 'Negotiation', rep: 'Sarah Chen', value: 15000, nextAction: 'Send revised pricing' },
  { client: 'Phoenix Roofing', score: 74, temp: 'warm', stage: 'Qualification', rep: 'Marcus Webb', value: 5600, nextAction: 'Send case study' },
  { client: 'Chicago Law Firm', score: 67, temp: 'warm', stage: 'Qualification', rep: 'Aisha Patel', value: 9200, nextAction: 'LinkedIn outreach' },
  { client: 'Austin Fitness', score: 58, temp: 'cold', stage: 'Cold', rep: 'James Park', value: 4200, nextAction: 'Email sequence' },
]

const coachingTips = [
  { title: 'Urgency Close', desc: 'Use limited-availability language when lead has viewed pricing 2+ times', used: 24, success: 78 },
  { title: 'Partner Technique', desc: 'Get both decision makers on the call simultaneously', used: 18, success: 65 },
  { title: 'Value Anchor', desc: 'Lead with the most expensive package, then offer "value" option', used: 31, success: 71 },
  { title: 'Silent Close', desc: 'After asking for the close, say nothing for 5+ seconds', used: 12, success: 83 },
]

const tempColor = (temp: string) => {
  switch (temp) {
    case 'hot': return 'bg-red-500/10 text-red-400 border-red-500/30'
    case 'warm': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'cold': return 'bg-cyan/10 text-cyan border-cyan/30'
    default: return 'bg-muted text-muted-foreground'
  }
}

const typeIcon = (type: string) => {
  switch (type) {
    case 'close_pattern': return <Zap className="w-4 h-4 text-cyan" />
    case 'objection': return <AlertCircle className="w-4 h-4 text-amber-400" />
    case 'lead_score': return <TrendingUp className="w-4 h-4 text-emerald-400" />
    case 'market': return <BarChart3 className="w-4 h-4 text-violet" />
    default: return <Sparkles className="w-4 h-4 text-cyan" />
  }
}

const steveResponses: Record<string, string> = {
  'lead': 'I recommend prioritizing L-8924 (Lisa Chen) — her engagement score spiked 17 points after viewing the case study page. She\'s ready for a closing call.',
  'close': 'For the NYC Dental deal, use the Partner Technique. Dr. Walsh mentioned needing to consult her partner. Suggest a joint call: "Let\'s get both of you on a brief 15-min call so all questions are answered at once."',
  'pipeline': 'Your pipeline looks strong. 3 hot leads in proposal stage with a combined value of $35,600. Focus on Miami Auto Group first — they\'ve viewed the proposal 12 times.',
  'earnings': 'You\'re on track to exceed last month\'s revenue by 24%. Your close rate is 64%, which is above team average. Keep using the Urgency Close — it has 78% success for you.',
  'tips': 'Based on your recent calls, try the Silent Close more often. Your success rate with it is 83%. After asking for the sale, stay quiet for at least 5 seconds.',
  'hello': 'Good afternoon, Commander. I\'ve analyzed today\'s pipeline. 3 hot leads need immediate attention. How can I assist?',
  'help': 'I can help you with: lead prioritization, closing techniques, pipeline analysis, earnings projections, and market insights. What would you like to know?',
}

function getSteveResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('lead') || lower.includes('priority')) return steveResponses.lead
  if (lower.includes('close') || lower.includes('deal')) return steveResponses.close
  if (lower.includes('pipeline') || lower.includes('deals')) return steveResponses.pipeline
  if (lower.includes('earn') || lower.includes('money') || lower.includes('revenue')) return steveResponses.earnings
  if (lower.includes('tip') || lower.includes('technique') || lower.includes('advice')) return steveResponses.tips
  if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey')) return steveResponses.hello
  if (lower.includes('help')) return steveResponses.help
  return 'I\'ve analyzed that for you. Based on current patterns, I recommend focusing on your hot leads first — they have a 4.2x higher close rate. Would you like specific guidance on any deal?'
}

export default function AISteve() {
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { sender: 'steve', text: 'Good afternoon, Commander. I\'ve analyzed today\'s pipeline. 3 hot leads need immediate attention. How can I assist?' },
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
      setChatMessages((prev) => [...prev, {
        sender: 'steve',
        text: getSteveResponse(userMsg),
      }])
    }, 1200)
  }

  const quickAsk = (question: string) => {
    setChatMessages((prev) => [...prev, { sender: 'user', text: question }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setChatMessages((prev) => [...prev, { sender: 'steve', text: getSteveResponse(question) }])
    }, 1200)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan" />
            AI Steve
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Sales intelligence, deal coaching, and real-time whisper</p>
        </div>
        <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan bg-cyan/5 rounded-lg">
          <Sparkles className="w-3 h-3 mr-1" /> v3.2 Active
        </Badge>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Deals Coached', value: 156, icon: Brain, color: 'text-cyan' },
          { label: 'Close Assist', value: 89, suffix: '%', icon: Target, color: 'text-emerald-400' },
          { label: 'Patterns Learned', value: 1247, icon: Lightbulb, color: 'text-violet' },
          { label: 'Revenue Impact', value: 284000, prefix: '$', icon: TrendingUp, color: 'text-amber-400' },
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
              <AnimatedCounter end={m.value} prefix={m.prefix || ''} suffix={m.suffix || ''} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Chat Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 p-5 rounded-2xl bg-card border border-border/40 card-glow flex flex-col h-[520px]"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Steve Assistant</h3>
              <p className="text-[10px] text-muted-foreground">Ask me anything about your pipeline</p>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {['Prioritize leads', 'Close tips', 'Pipeline status'].map((prompt) => (
              <button key={prompt} onClick={() => quickAsk(prompt)} className="px-2 py-1 rounded-lg bg-space-highlight/40 border border-border/20 text-[10px] text-muted-foreground hover:text-cyan hover:border-cyan/20 transition-all">
                {prompt}
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
              placeholder="Ask Steve..."
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

        {/* Insights + Heatmap */}
        <div className="lg:col-span-2 space-y-5">
          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-cyan" />
              <h3 className="font-semibold text-foreground text-sm">Steve Insights</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {steveInsights.map((insight) => (
                <div key={insight.title} className="p-3 rounded-xl bg-space-highlight/30 border border-border/20 hover:border-cyan/20 transition-all cursor-pointer" onClick={() => info('Insight detail: ' + insight.desc)}>
                  <div className="flex items-start gap-2 mb-2">
                    {typeIcon(insight.type)}
                    <div>
                      <p className="text-sm font-medium text-foreground">{insight.title}</p>
                      <p className="text-[10px] text-muted-foreground">{insight.time} · {insight.confidence}% confidence</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Deal Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-cyan" />
                <h3 className="font-semibold text-foreground text-sm">Deal Heatmap</h3>
              </div>
            </div>
            <div className="space-y-2">
              {dealHeatmap.map((deal) => (
                <div key={deal.client} className="flex items-center gap-3 p-3 rounded-xl hover:bg-space-highlight/30 transition-colors cursor-pointer" onClick={() => quickAsk(`Tell me about ${deal.client}`)}>
                  <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-cyan">{deal.score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{deal.client}</p>
                      <Badge className={`text-[10px] ${tempColor(deal.temp)}`}>{deal.temp}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{deal.stage}</span>
                      <span className="text-[10px] text-muted-foreground">{deal.rep}</span>
                      <span className="text-[10px] text-emerald-400">${deal.value.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-cyan">{deal.nextAction}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Coaching Tips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
          >
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-cyan" />
              <h3 className="font-semibold text-foreground text-sm">Coaching Tips (This Week)</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {coachingTips.map((tip) => (
                <div key={tip.title} className="p-3 rounded-xl bg-space-highlight/30 border border-border/20 hover:border-cyan/20 transition-all cursor-pointer" onClick={() => quickAsk(`Tell me about ${tip.title}`)}>
                  <p className="text-sm font-medium text-foreground mb-1">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">{tip.desc}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>Used {tip.used}x</span>
                    <span className="text-emerald-400">{tip.success}% success</span>
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
