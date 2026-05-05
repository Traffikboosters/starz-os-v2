const fs = require("fs");
const path = require("path");
const base = "C:/Users/mbecn/my-app/starz-os-v9";

fs.writeFileSync(path.join(base, "src/pages/AISteve.tsx"), `import { useState } from 'react'
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

  const pipelineTotal = deals.reduce((s,d) => s+(d.value||d.amount||0), 0)

  const sendMessage = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { sender:'user', text:userMsg }])
    setTyping(true)
    try {
      const context = \`Pipeline: \${deals.length} deals totaling \${formatCurrency(pipelineTotal)}. AI patterns loaded: \${patterns.length}. Learning log entries: \${learningLog.length}.\`
      const res = await fetch(\`\${SUPABASE_FUNCTIONS_URL}/steve-bge\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context }),
      })
      if (!res.ok) throw new Error('Steve unavailable')
      const data = await res.json()
      setChatMessages(prev => [...prev, { sender:'steve', text: data.reply || data.message || 'Analyzing your request...' }])
    } catch {
      const fallback = learningLog.length > 0
        ? \`Based on \${learningLog.length} learning log entries: \${learningLog[0]?.insight || learningLog[0]?.pattern || 'Focus on your highest-value open deals.'}\` 
        : \`I see \${deals.length} deals worth \${formatCurrency(pipelineTotal)}. What intelligence do you need?\`
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
              <m.icon className={\`w-4 h-4 \${m.color}\`}/>
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
              <div key={i} className={\`flex \${msg.sender==='user'?'justify-end':''}\`}>
                <div className={\`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed \${
                  msg.sender==='steve' ? 'bg-space-highlight/60 text-foreground' : 'bg-cyan/10 text-cyan'}\`}>
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
                      <p className="text-xs font-medium text-foreground truncate">{deal.business_name||deal.client_name||'Unknown'}</p>
                      <p className="text-[10px] text-muted-foreground">{deal.stage} · {deal.assigned_to||deal.rep_name||'Unassigned'}</p>
                    </div>
                    <span className={\`text-[10px] px-2 py-0.5 rounded border flex-shrink-0 \${tempColor(deal.value||deal.amount||0)}\`}>
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
`, "utf8");
console.log("Written: src/pages/AISteve.tsx (" + fs.readFileSync(path.join(base, "src/pages/AISteve.tsx"), "utf8").split("\n").length + " lines)");

fs.writeFileSync(path.join(base, "src/pages/Reports.tsx"), `import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Download, Calendar,
  ArrowUpRight, ArrowDownRight, RefreshCw, Target, Users, DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useSalesPerformance, useDeals, useLeads } from '@/hooks/useSupabase'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg bg-card border border-border/50">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Reports() {
  const { repPerformance, loading: salesLoading, refetch } = useSalesPerformance()
  const { deals, loading: dealsLoading } = useDeals(500)
  const { leads, loading: leadsLoading } = useLeads(500)

  const totalRevenue = deals.reduce((s,d) => s+(d.value||d.amount||0), 0)
  const closedDeals  = deals.filter(d => ['closed','won','closed_won','Closed Won'].includes(d.stage||'')).length
  const closeRate    = deals.length > 0 ? Math.round((closedDeals/deals.length)*100) : 0
  const avgDeal      = closedDeals > 0 ? Math.round(totalRevenue/closedDeals) : 0

  // Chart data from real rep performance
  const chartData = repPerformance.length > 0
    ? repPerformance.slice(0,7).map(r => ({
        name: (r.rep_name||r.name||r.assigned_to||'Rep').split(' ')[0],
        deals: r.total_deals||r.deals||r.deal_count||0,
        revenue: r.total_revenue||r.revenue||0,
      }))
    : deals.reduce((acc: any[], d) => {
        const rep = (d.assigned_to||d.rep_name||'Unassigned').split(' ')[0]
        const existing = acc.find(a => a.name === rep)
        if (existing) { existing.deals++; existing.revenue += (d.value||d.amount||0) }
        else acc.push({ name:rep, deals:1, revenue:d.value||d.amount||0 })
        return acc
      }, []).sort((a,b) => b.deals-a.deals).slice(0,7)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan"/> Reports & Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Rep performance, pipeline analytics, and KPI summaries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={refetch}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5"/>Refresh
          </Button>
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8">
            <Download className="w-3.5 h-3.5 mr-1.5"/>Export
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Pipeline', value:totalRevenue, icon:DollarSign,  currency:true,  color:'text-cyan' },
          { label:'Closed Deals',   value:closedDeals,  icon:Target,      currency:false, color:'text-emerald-400' },
          { label:'Close Rate',     value:closeRate,    icon:TrendingUp,  currency:false, suffix:'%', color:'text-violet' },
          { label:'Total Leads',    value:leads.length, icon:Users,       currency:false, color:'text-amber-400' },
        ].map((m,i) => (
          <motion.div key={m.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={\`w-4 h-4 \${m.color}\`}/>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {salesLoading||dealsLoading ? <div className="h-8 w-20 bg-muted/30 rounded animate-pulse"/> :
                m.currency ? formatCurrency(m.value) : <AnimatedCounter end={m.value} suffix={m.suffix||''}/> }
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rep Performance Chart */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
        className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Rep Performance</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {repPerformance.length > 0 ? 'From sales.v_rep_performance' : 'Derived from deals.pipeline'}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false}/>
            <XAxis dataKey="name" tick={{fill:'#94A3B8',fontSize:11}} axisLine={false} tickLine={false} dy={8}/>
            <YAxis tick={{fill:'#94A3B8',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Bar dataKey="deals" name="Deals" fill="#00F0FF" radius={[4,4,0,0]} barSize={20}/>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Rep Leaderboard Table */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/20">
          <h3 className="text-sm font-semibold text-foreground">
            {repPerformance.length > 0 ? 'Rep Leaderboard — sales.v_rep_performance' : 'Rep Leaderboard — Derived'}
          </h3>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/10">
          <span>#</span><span>Rep</span><span>Deals</span><span>Revenue</span><span>Close %</span>
        </div>
        {salesLoading||dealsLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading performance data...</div>
        ) : chartData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No rep data available</div>
        ) : (
          <div className="divide-y divide-border/10">
            {chartData.map((rep,i) => (
              <div key={rep.name} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 hover:bg-space-highlight/20 transition-colors items-center">
                <div className={\`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold \${
                  i===0?'bg-cyan/20 text-cyan':i===1?'bg-violet/20 text-violet':i===2?'bg-emerald-500/20 text-emerald-400':'bg-muted text-muted-foreground'}\`}>
                  {i+1}
                </div>
                <p className="text-sm font-medium text-foreground">{rep.name}</p>
                <p className="text-sm font-semibold text-foreground">{rep.deals}</p>
                <p className="text-sm font-semibold text-emerald-400">{formatCurrency(rep.revenue)}</p>
                <p className="text-xs text-muted-foreground">
                  {rep.deals > 0 ? Math.round((rep.deals / Math.max(deals.length,1))*100) : 0}%
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
`, "utf8");
console.log("Written: src/pages/Reports.tsx (" + fs.readFileSync(path.join(base, "src/pages/Reports.tsx"), "utf8").split("\n").length + " lines)");

fs.writeFileSync(path.join(base, "src/hooks/useSupabase.ts"), `import { useEffect, useState, useCallback } from 'react'
import { db } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  business_name: string
  email: string
  phone?: string
  website?: string
  status: string
  score?: number
  source?: string
  assigned_to?: string
  created_at: string
  city?: string
  state?: string
  industry?: string
}

export interface Deal {
  id: string
  business_name?: string
  client_name?: string
  stage: string
  value?: number
  amount?: number
  assigned_to?: string
  rep_name?: string
  created_at: string
  updated_at?: string
  service_type?: string
  probability?: number
}

export interface WorkOrder {
  id: string
  client_name?: string
  service_type?: string
  status: string
  amount?: number
  assigned_to?: string
  created_at: string
  due_date?: string
  progress?: number
}

export interface CallRecord {
  id: string
  lead_id?: string
  phone_number?: string
  status: string
  direction?: string
  duration?: number
  created_at: string
  rep_name?: string
}

// ─── Dashboard KPI Hook ───────────────────────────────────────────────────────

export function useDashboardKPIs() {
  const [data, setData] = useState({
    totalLeads: 0,
    activeDeals: 0,
    pipelineValue: 0,
    workOrders: 0,
    leadsToday: 0,
    closedDeals: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsRes, dealsRes, ordersRes] = await Promise.all([
        db.crm.from('leads').select('id, status, created_at', { count: 'exact' }).limit(1000),
        db.deals.from('pipeline').select('id, stage, value, amount, created_at', { count: 'exact' }).limit(1000),
        db.rico.from('work_orders').select('id, status', { count: 'exact' }).limit(500),
      ])

      const leads = leadsRes.data || []
      const deals = dealsRes.data || []
      const orders = ordersRes.data || []

      const today = new Date().toISOString().split('T')[0]
      const leadsToday = leads.filter(l => l.created_at?.startsWith(today)).length
      const closedDeals = deals.filter(d =>
        ['closed', 'closed_won', 'won', 'Closed Won'].includes(d.stage)
      ).length
      const pipelineValue = deals.reduce((sum, d) => sum + (d.value || d.amount || 0), 0)

      setData({
        totalLeads: leadsRes.count || leads.length,
        activeDeals: dealsRes.count || deals.length,
        pipelineValue,
        workOrders: orders.filter(o => o.status === 'active' || o.status === 'in_progress').length,
        leadsToday,
        closedDeals,
      })
    } catch (err) {
      console.error('KPI fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, refetch: fetch }
}

// ─── Leads Hook ───────────────────────────────────────────────────────────────

export function useLeads(limit = 100) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error, count: total } = await db.crm
        .from('leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      setLeads(data || [])
      setCount(total || 0)
    } catch (err) {
      console.error('Leads fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => { fetch() }, [fetch])
  return { leads, loading, count, refetch: fetch }
}

// ─── Pipeline / Deals Hook ────────────────────────────────────────────────────

export function useDeals(limit = 200) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await db.deals
        .from('pipeline')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      setDeals(data || [])
    } catch (err) {
      console.error('Deals fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => { fetch() }, [fetch])
  return { deals, loading, refetch: fetch }
}

// ─── Work Orders Hook ─────────────────────────────────────────────────────────

export function useWorkOrders() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await db.rico
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Work orders fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { orders, loading, refetch: fetch }
}

// ─── Call Queue Hook ──────────────────────────────────────────────────────────

export function useCallQueue() {
  const [queue, setQueue] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await db.dialer
        .from('call_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setQueue(data || [])
    } catch (err) {
      console.error('Call queue fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { queue, loading, refetch: fetch }
}

// ─── SEO Data Hook ────────────────────────────────────────────────────────────

export function useSEOData() {
  const [keywords, setKeywords] = useState<any[]>([])
  const [serpData, setSerpData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [kwRes, serpRes] = await Promise.all([
        db.seo.from('keywords').select('*').order('created_at', { ascending: false }).limit(50),
        db.seo.from('serp_data').select('*').order('checked_at', { ascending: false }).limit(50),
      ])
      setKeywords(kwRes.data || [])
      setSerpData(serpRes.data || [])
    } catch (err) {
      console.error('SEO data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { keywords, serpData, loading, refetch: fetch }
}

// ─── Proposals Hook ───────────────────────────────────────────────────────────

export function useProposals() {
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await db.deals
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setProposals(data || [])
    } catch (err) {
      console.error('Proposals fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { proposals, loading, refetch: fetch }
}

// ─── Security Log Hook ────────────────────────────────────────────────────────

export function useSecurityLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, alertsRes] = await Promise.allSettled([
        db.security.from('access_log').select('*').order('created_at', { ascending: false }).limit(50),
        db.security.from('alerts').select('*').order('created_at', { ascending: false }).limit(20),
      ])
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data || [])
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data || [])
    } catch (err) {
      console.error('Security fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { logs, alerts, loading, refetch: fetch }
}

// ─── Realtime subscription helper ────────────────────────────────────────────

export function useRealtimeLeads(onInsert: (lead: Lead) => void) {
  useEffect(() => {
    const channel = db.crm
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'crm', table: 'leads' }, (payload) => {
        onInsert(payload.new as Lead)
      })
      .subscribe()

    return () => { db.crm.removeChannel(channel) }
  }, [onInsert])
}

// ─── AI Learning Log Hook ─────────────────────────────────────────────────────

export function useAILearning() {
  const [patterns, setPatterns] = useState<any[]>([])
  const [learningLog, setLearningLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [patternsRes, logRes] = await Promise.allSettled([
        db.ai.from('v_steve_patterns').select('*').limit(20),
        db.ai.from('learning_log').select('*').order('created_at', { ascending: false }).limit(50),
      ])
      if (patternsRes.status === 'fulfilled') setPatterns(patternsRes.value.data || [])
      if (logRes.status === 'fulfilled') setLearningLog(logRes.value.data || [])
    } catch (err) {
      console.error('AI fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { patterns, learningLog, loading, refetch: fetch }
}

// ─── Sales Performance Hook ───────────────────────────────────────────────────

export function useSalesPerformance() {
  const [repPerformance, setRepPerformance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await db.sales
        .from('v_rep_performance')
        .select('*')
        .limit(20)

      if (!error) setRepPerformance(data || [])
    } catch (err) {
      console.error('Sales performance fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { repPerformance, loading, refetch: fetch }
}
`, "utf8");
console.log("Written: src/hooks/useSupabase.ts (" + fs.readFileSync(path.join(base, "src/hooks/useSupabase.ts"), "utf8").split("\n").length + " lines)");

fs.writeFileSync(path.join(base, "src/lib/supabase.ts"), `import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

// Default client (public schema)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Schema-specific clients
// Non-public schemas require both Accept-Profile and Content-Profile headers
export function schemaClient(schema: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema },
    global: {
      headers: {
        'Accept-Profile': schema,
        'Content-Profile': schema,
      },
    },
  })
}

// Pre-built schema clients for all STARZ-OS schemas
export const db = {
  crm: schemaClient('crm'),
  deals: schemaClient('deals'),
  dialer: schemaClient('dialer'),
  analytics: schemaClient('analytics'),
  security: schemaClient('security'),
  outreach: schemaClient('outreach'),
  marketing: schemaClient('marketing'),
  steve: schemaClient('steve'),
  rico: schemaClient('rico'),
  hr: schemaClient('hr'),
  seo: schemaClient('seo'),
  intelligence: schemaClient('intelligence'),
  authority: schemaClient('authority'),
  ai: schemaClient('ai'),
  sales: schemaClient('sales'),
}

export const SUPABASE_PROJECT_ID = 'szguizvpiiuiyugrjeks'
export const SUPABASE_FUNCTIONS_URL = \`https://\${SUPABASE_PROJECT_ID}.supabase.co/functions/v1\`
`, "utf8");
console.log("Written: src/lib/supabase.ts (" + fs.readFileSync(path.join(base, "src/lib/supabase.ts"), "utf8").split("\n").length + " lines)");

