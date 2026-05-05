import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, RefreshCw, TrendingUp, Users, DollarSign, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { db } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Reports() {
  const [repPerf, setRepPerf]   = useState<any[]>([])
  const [pipeline, setPipeline] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [repRes, pipeRes] = await Promise.allSettled([
        db.sales?.from('v_rep_performance').select('*').limit(20).catch(() => ({ data: [] })),
        db.deals.from('pipeline')
          .select('owner_name,estimated_value,stage,ai_score')
          .order('estimated_value', { ascending: false }).limit(50),
      ])
      if (repRes.status === 'fulfilled') setRepPerf((repRes.value as any)?.data || [])
      if (pipeRes.status === 'fulfilled') {
        const data = (pipeRes.value as any)?.data || []
        // Aggregate by rep
        const byRep: Record<string, any> = {}
        data.forEach((d: any) => {
          const rep = d.owner_name || 'Unassigned'
          if (!byRep[rep]) byRep[rep] = { rep_name: rep, deal_count: 0, total_value: 0 }
          byRep[rep].deal_count++
          byRep[rep].total_value += parseFloat(d.estimated_value || 0)
        })
        setPipeline(Object.values(byRep).sort((a: any, b: any) => b.total_value - a.total_value))
      }
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const displayData = repPerf.length > 0 ? repPerf : pipeline
  const totalPipeline = pipeline.reduce((s, r) => s + r.total_value, 0)
  const totalDeals    = pipeline.reduce((s, r) => s + r.deal_count, 0)
  const COLORS = ['#00F0FF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan" /> Reports & Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {repPerf.length > 0 ? 'sales.v_rep_performance' : 'deals.pipeline aggregated by rep'}
          </p>
        </div>
        <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Pipeline',  value: totalPipeline, icon: DollarSign, color: 'text-cyan',         isCurrency: true },
          { label: 'Total Deals',     value: totalDeals,    icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Active Reps',     value: pipeline.length, icon: Users,   color: 'text-violet' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${m.color}`}>
              {loading ? <div className="h-8 w-20 bg-muted/30 rounded animate-pulse" /> :
                m.isCurrency ? `$${(m.value/1000).toFixed(0)}K` : <AnimatedCounter end={m.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bar Chart */}
      {displayData.length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <h3 className="text-sm font-semibold text-foreground mb-4">Pipeline by Rep</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={displayData.slice(0, 8)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="rep_name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}K`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Bar dataKey="total_value" name="Pipeline Value" radius={[4, 4, 0, 0]}>
                {displayData.slice(0, 8).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Leaderboard */}
      <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Rep Leaderboard</h3>
          <span className="text-[10px] text-muted-foreground">By pipeline value</span>
        </div>
        {loading ? <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div> :
          displayData.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">No rep data found</div> :
          <div className="divide-y divide-border/10">
            {displayData.slice(0, 10).map((r: any, i: number) => (
              <div key={r.rep_name || i} className="flex items-center gap-4 px-4 py-3 hover:bg-space-highlight/20 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-400/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-400' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-muted/20 text-muted-foreground'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.rep_name || r.owner_name || 'Unknown'}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (r.total_value / (displayData[0]?.total_value || 1)) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-foreground">{formatCurrency(r.total_value || r.revenue_total || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">{r.deal_count || r.closes_count || 0} deals</p>
                </div>
              </div>
            ))}
          </div>}
      </div>
    </div>
  )
}
