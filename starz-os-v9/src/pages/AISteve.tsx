import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bot, Sparkles, Flame, Send, Loader2, RefreshCw,
  TrendingUp, Brain, Zap, AlertCircle, BarChart3, Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useDeals, useLeads, useAILearning } from '@/hooks/useSupabase'
import { formatCurrency, timeAgo } from '@/lib/utils'
import { SUPABASE_FUNCTIONS_URL } from '@/lib/supabase'

export default function AISteve() {
  const { deals, loading: dealsLoading } = useDeals(100)
  const { leads } = useLeads(50)
  const { patterns, learningLog, loading: aiLoading, refetch } = useAILearning()

  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { sender: 'steve', text: 'Good day, Commander. I have analyzed your pipeline and learning logs. How can I assist?' },
  ])
  const [typing, setTyping] = useState(false)

  const hotDeals = deals
    .filter(d => !['closed','won','closed_won','lost'].includes((d.stage||'').toLowerCase()))
    .sort((a,b) => (b.value||b.amount||0) - (a.value||a.amount||0))
    .slice(0,6)

  const pipelineTotal = deals.reduce((s,d) => s+(d.estimated_value||d.value||0), 0)

  const sendMessage = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { sender:'user', text:userMsg }])
    setTyping(true)
    try {
      const context = `Pipeline: ${deals.length} deals totaling ${formatCurrency(pipelineTotal)}. AI patterns loaded: ${patterns.length}. Learning log entries: ${learningLog.length}.`
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/steve-bge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context }),
      })
      if (!res.ok) throw new Error('Steve unavailable')
      const data = await res.json()
      setChatMessages(prev => [...prev, { sender:'steve', text: data.reply || data.message || 'Analyzing your request...' }])
    } catch {
      const fallback = learningLog.length > 0
        ? `Based on ${learningLog.length} learning log entries: ${learningLog[0]?.insight || learningLog[0]?.pattern || 'Focus on your highest-value open deals.'}` 
        : `I see ${deals.length} deals worth ${formatCurrency(pipelineTotal)}. What intelligence do you need?`
      setChatMessages(prev => [...prev, { sender:'steve', text: fallback }])
    } finally {
      setTyping(false)
    }
  }

  const tempColor = (value: number) => {
    if (value > 10000) return 'bg-red-500/10 text-red-400 border-red-500/30'
    if (value > 5000)  return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    return 'bg-cyan/10 text-cyan border-cyan/30'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan"/> Steve BGE — Sales Intelligence
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">AI patterns, deal coaching, and rep performance intel</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={refetch}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5"/>Refresh
          </Button>
          <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan bg-cyan/5 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-cyan rounded-full animate-pulse"/> Active
          </Badge>
        </div>
      </div>

      {/* AI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Patterns Learned', value:patterns.length,    icon:Brain,    color:'text-cyan' },
          { label:'Learning Log',     value:learningLog.length, icon:Zap,      color:'text-violet' },
          { label:'Open Deals',       value:hotDeals.length,    icon:Flame,    color:'text-red-400' },
          { label:'Pipeline Value',   value:pipelineTotal,      icon:BarChart3,color:'text-emerald-400', currency:true },
        ].map((m,i) => (
          <motion.div key={m.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`}/>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {aiLoading||dealsLoading ? <div className="h-8 w-16 bg-muted/30 rounded animate-pulse"/> :
                (m.currency ? formatCurrency(m.value) : m.value)}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Steve Chat */}
        <div className="rounded-2xl bg-card border border-border/40 card-glow flex flex-col" style={{height:520}}>
          <div className="p-4 border-b border-border/20 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan"/>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Steve BGE</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/> Online · {patterns.length} patterns loaded
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg,i) => (
              <div key={i} className={`flex ${msg.sender==='user'?'justify-end':''}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.sender==='steve' ? 'bg-space-highlight/60 text-foreground' : 'bg-cyan/10 text-cyan'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex">
                <div className="px-3 py-2 rounded-xl bg-space-highlight/60 text-muted-foreground text-xs flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"/>
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay:'0.15s'}}/>
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay:'0.3s'}}/>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border/20 flex gap-2">
            <Input value={chatInput} onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&sendMessage()}
              placeholder="Ask Steve..." className="flex-1 bg-card border-border/40 h-8 text-xs"/>
            <Button onClick={sendMessage} disabled={typing||!chatInput.trim()} size="sm"
              className="bg-cyan/10 text-cyan hover:bg-cyan/20 border border-cyan/30 h-8 w-8 p-0">
              {typing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>}
            </Button>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Patterns from v_steve_patterns */}
          <div className="rounded-2xl bg-card border border-border/40 card-glow p-5">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-violet"/> AI Close Patterns
              <span className="text-[10px] text-muted-foreground ml-auto">ai.v_steve_patterns</span>
            </h3>
            {aiLoading ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">Loading patterns...</div>
            ) : patterns.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-xs">No patterns in ai.v_steve_patterns yet</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {patterns.map((p,i) => (
                  <div key={p.id||i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-space-highlight/30 transition-colors">
                    <div className="w-6 h-6 rounded-lg bg-violet/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-violet"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{p.pattern_name||p.name||p.title||'Pattern'}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{p.description||p.insight||p.detail||''}</p>
                    </div>
                    {(p.confidence||p.success_rate) && (
                      <span className="text-[10px] text-cyan font-mono flex-shrink-0">{p.confidence||p.success_rate}%</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deal Heat Map */}
          <div className="rounded-2xl bg-card border border-border/40 card-glow p-5">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-red-400"/> Deal Heat Map
              <span className="text-[10px] text-muted-foreground ml-auto">Top {hotDeals.length} open</span>
            </h3>
            {dealsLoading ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">Loading pipeline...</div>
            ) : hotDeals.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">No open deals</div>
            ) : (
              <div className="space-y-2">
                {hotDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-space-highlight/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{deal.company||deal.lead_name||'Unknown'}</p>
                      <p className="text-[10px] text-muted-foreground">{deal.stage} · {deal.assigned_to||deal.rep_name||'Unassigned'}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border flex-shrink-0 ${tempColor(deal.value||deal.amount||0)}`}>
                      {formatCurrency(deal.value||deal.amount||0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(deal.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Learning Log */}
          {learningLog.length > 0 && (
            <div className="rounded-2xl bg-card border border-border/40 card-glow p-5">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-cyan"/> Learning Log
                <span className="text-[10px] text-muted-foreground ml-auto">ai.learning_log</span>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {learningLog.slice(0,8).map((entry,i) => (
                  <div key={entry.id||i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-space-highlight/20 transition-colors">
                    <div className="w-1.5 h-1.5 bg-cyan rounded-full flex-shrink-0"/>
                    <p className="text-xs text-foreground flex-1 truncate">{entry.insight||entry.pattern||entry.message||entry.content||JSON.stringify(entry).slice(0,80)}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(entry.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
