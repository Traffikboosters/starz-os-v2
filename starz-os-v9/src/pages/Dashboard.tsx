import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, Users, CheckCircle2, Briefcase,
  Sparkles, Wifi, Target, ArrowUpRight, Award,
  PhoneIncoming, Activity,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useDashboardKPIs, useDeals, useLeads, useCallQueue } from '@/hooks/useSupabase'
import { formatCurrency, timeAgo } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg bg-card border border-border/50 shadow-card">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-foreground" style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString?.() || p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data: kpis, loading: kpiLoading } = useDashboardKPIs()
  const { deals, loading: dealsLoading } = useDeals(500)
  const { leads, loading: leadsLoading } = useLeads(200)
  const { queue } = useCallQueue()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning, Commander'
    if (h < 18) return 'Good afternoon, Commander'
    return 'Good evening, Commander'
  }

  const revenueChart = useMemo(() => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const buckets: Record<string,number> = {}
    days.forEach(d => { buckets[d] = 0 })
    deals.slice(0,200).forEach(deal => {
      const day = days[new Date(deal.created_at).getDay()]
      buckets[day] += (deal.value || deal.amount || 0)
    })
    return days.map(d => ({ name: d, value: buckets[d] }))
  }, [deals])

  const stageData = useMemo(() => {
    const stageCounts: Record<string,number> = {}
    deals.forEach(d => {
      const stage = d.stage || 'Unknown'
      stageCounts[stage] = (stageCounts[stage] || 0) + 1
    })
    const colors = ['#00F0FF','#7C3AED','#10B981','#F59E0B','#EF4444']
    return Object.entries(stageCounts).slice(0,5).map(([name,value],i) => ({ name, value, color: colors[i%colors.length] }))
  }, [deals])

  const leaderboard = useMemo(() => {
    const repMap: Record<string,{deals:number;value:number}> = {}
    deals.forEach(d => {
      const rep = d.assigned_to || d.owner_name || d.assigned_to || 'Unassigned'
      if (!repMap[rep]) repMap[rep] = { deals:0, value:0 }
      repMap[rep].deals += 1
      repMap[rep].value += (d.estimated_value || d.value || 0)
    })
    return Object.entries(repMap)
      .map(([name,stats]) => ({ name, ...stats }))
      .sort((a,b) => b.deals - a.deals)
      .slice(0,5)
  }, [deals])

  const recentActivity = useMemo(() => leads.slice(0,5).map(l => ({
    label: l.business_name || l.company_name || l.email || 'New Lead',
    sub: l.source || 'Web Form',
    time: timeAgo(l.created_at),
  })), [leads])

  return (
    <div className="space-y-6">
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
        className="rounded-2xl bg-gradient-to-r from-space-highlight/60 to-violet/5 border border-border/30 p-6 flex items-center justify-between card-glow">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {greeting()} <Sparkles className="w-5 h-5 text-cyan" />
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />{queue.length} Active Calls
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan text-xs font-medium">
            <Wifi className="w-3 h-3" /> All Systems Live
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Pipeline Value', value:kpis.pipelineValue, isCurrency:true, change:`${kpis.activeDeals} deals`, icon:DollarSign },
          { label:'Total Leads', value:kpis.totalLeads, isCurrency:false, change:`+${kpis.leadsToday} today`, icon:Target },
          { label:'Closed Won', value:kpis.closedDeals, isCurrency:false, change:'all time', icon:CheckCircle2 },
          { label:'Active Work Orders', value:kpis.workOrders, isCurrency:false, change:'in fulfillment', icon:Briefcase },
        ].map((m,i) => (
          <motion.div key={m.label} initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}}
            transition={{delay:i*0.07,duration:0.4}} className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center">
                <m.icon className="w-4 h-4 text-cyan" />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{m.label}</span>
            </div>
            {kpiLoading ? (
              <div className="h-8 w-24 bg-muted/30 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold text-foreground font-mono tracking-tight">
                {m.isCurrency ? formatCurrency(m.value) : <AnimatedCounter end={m.value} />}
              </div>
            )}
            <div className="flex items-center gap-1 text-xs mt-1 text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />{m.change}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
          className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Pipeline Activity</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Deal value by day of week</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan bg-cyan/5 rounded-lg">Live</Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} dy={8}/>
              <YAxis tick={{fill:"#94A3B8",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={(v) => v>=1000?`$${v/1000}k`:`$${v}`}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Area type="monotone" dataKey="value" name="Pipeline Value" stroke="#00F0FF" strokeWidth={2} fill="url(#revGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground text-sm">Pipeline Stages</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Current deal breakdown</p>
          </div>
          {stageData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={stageData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                    {stageData.map((entry,index) => (<Cell key={index} fill={entry.color}/>))}
                  </Pie>
                  <Tooltip content={<ChartTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {stageData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:d.color}}/>
                    <span className="text-[10px] text-muted-foreground truncate">{d.name}</span>
                    <span className="text-[10px] text-foreground ml-auto font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">
              {dealsLoading ? "Loading pipeline..." : "No deal data"}
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan"/>
              <h3 className="font-semibold text-foreground text-sm">Rep Leaderboard</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">By deal count</span>
          </div>
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((rep,i) => (
                <div key={rep.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-space-highlight/30 transition-colors">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i===0?'bg-cyan/20 text-cyan':i===1?'bg-violet/20 text-violet':i===2?'bg-emerald-500/20 text-emerald-400':'bg-muted text-muted-foreground'}`}>
                    {i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{rep.name}</p>
                    <p className="text-[10px] text-muted-foreground">{rep.deals} deals</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(rep.value)}</p>
                    <p className="text-[10px] text-muted-foreground">pipeline</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">
              {dealsLoading ? "Loading..." : "No rep data yet"}
            </div>
          )}
        </motion.div>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.55}}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan"/>
              <h3 className="font-semibold text-foreground text-sm">Recent Leads</h3>
            </div>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 rounded-lg flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/> Live
            </Badge>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((item,i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-space-highlight/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0">
                    <PhoneIncoming className="w-4 h-4 text-cyan"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">
              {leadsLoading ? "Loading leads..." : "No recent leads"}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
