import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Globe, Search, TrendingUp, ArrowUpRight, ArrowDownRight,
  RefreshCw, Play, Loader2, Database, Zap, BarChart3,
  CheckCircle2, AlertCircle, Clock, Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { db, SUPABASE_FUNCTIONS_URL } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SerpResult {
  id: string
  keyword: string
  location?: string
  source?: string
  results?: any
  created_at: string
  job_id?: string
}

interface EngineLog {
  id: number
  created_at: string
  route?: string
  action?: string
  status_code?: number
  duration_ms?: number
  success?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SEODashboard() {
  const [serpData, setSerpData]     = useState<SerpResult[]>([])
  const [serpCache, setSerpCache]   = useState<any[]>([])
  const [engineLogs, setEngineLogs] = useState<EngineLog[]>([])
  const [loading, setLoading]       = useState(true)
  const [scraperMode, setScraperMode] = useState<'starz' | 'serpapi'>('starz')
  const [scraping, setScraping]     = useState(false)
  const [scrapeResult, setScrapeResult] = useState<{ok:boolean;msg:string}|null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [newLocation, setNewLocation] = useState('Miami, FL')
  const [activeTab, setActiveTab]   = useState<'results'|'cache'|'logs'>('results')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [serpRes, cacheRes, logsRes] = await Promise.allSettled([
        db.seo.from('serp_data')
          .select('id, keyword, location, source, created_at, job_id')
          .order('created_at', { ascending: false })
          .limit(50),
        db.seo.from('serp_cache')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
        db.seo.from('unified_engine_logs')
          .select('id, created_at, route, action, status_code, duration_ms, success')
          .order('created_at', { ascending: false })
          .limit(30),
      ])
      if (serpRes.status === 'fulfilled') setSerpData(serpRes.value.data || [])
      if (cacheRes.status === 'fulfilled') setSerpCache(cacheRes.value.data || [])
      if (logsRes.status === 'fulfilled') setEngineLogs(logsRes.value.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Build activity chart from serp_data by day
  const chartData = (() => {
    const days: Record<string, number> = {}
    serpData.forEach(d => {
      const day = new Date(d.created_at).toLocaleDateString('en-US', { weekday: 'short' })
      days[day] = (days[day] || 0) + 1
    })
    return Object.entries(days).map(([name, scans]) => ({ name, scans }))
  })()

  // Stats
  const starzResults = serpData.filter(d => d.source === 'starz' || d.source === 'internal' || !d.source).length
  const serpApiResults = serpData.filter(d => d.source === 'serpapi').length
  const successLogs = engineLogs.filter(l => l.success).length
  const avgDuration = engineLogs.length > 0
    ? Math.round(engineLogs.reduce((s, l) => s + (l.duration_ms || 0), 0) / engineLogs.length)
    : 0

  // Trigger scraper
  const runScraper = async () => {
    if (!newKeyword.trim()) return
    setScraping(true)
    setScrapeResult(null)
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/scraper-worker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          location: newLocation,
          source: scraperMode,
        }),
      })
      const data = await res.json()
      setScrapeResult({
        ok: res.ok,
        msg: data?.message || data?.detail || (res.ok ? `Scraped "${newKeyword}" successfully` : 'Scraper error'),
      })
      if (res.ok) { setNewKeyword(''); setTimeout(load, 1500) }
    } catch (e: any) {
      setScrapeResult({ ok: false, msg: e.message })
    } finally {
      setScraping(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan" /> STARZ-OS SEO Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            SERP scraper · Rank tracking · Keyword intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
      </div>

      {/* Scraper Mode Toggle + Run */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-4 h-4 text-cyan" />
          <h3 className="text-sm font-semibold text-foreground">Run SERP Scraper</h3>
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 ml-auto px-2 py-1 bg-space-highlight/60 rounded-lg border border-border/30">
            <span className="text-[10px] text-muted-foreground mr-1">Engine:</span>
            <button onClick={() => setScraperMode('starz')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${scraperMode === 'starz' ? 'bg-cyan/20 text-cyan' : 'text-muted-foreground hover:text-foreground'}`}>
              STARZ
            </button>
            <button onClick={() => setScraperMode('serpapi')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${scraperMode === 'serpapi' ? 'bg-violet/20 text-violet' : 'text-muted-foreground hover:text-foreground'}`}>
              SerpAPI
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={newKeyword} onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runScraper()}
              placeholder="Enter keyword to scrape..."
              className="pl-9 bg-card border-border/40 h-9 text-sm" />
          </div>
          <Input value={newLocation} onChange={e => setNewLocation(e.target.value)}
            placeholder="Location" className="w-36 bg-card border-border/40 h-9 text-sm" />
          <Button onClick={runScraper} disabled={scraping || !newKeyword.trim()}
            className="bg-gradient-primary text-space font-bold text-xs h-9 px-4">
            {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-3.5 h-3.5 mr-1.5" />Scrape</>}
          </Button>
        </div>

        {scrapeResult && (
          <div className={`mt-3 p-3 rounded-xl border text-xs ${scrapeResult.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {scrapeResult.ok ? '✓' : '✗'} {scrapeResult.msg}
          </div>
        )}

        {/* verify_jwt note */}
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-[10px] text-amber-400">
            Scraper requires <code className="font-mono">verify_jwt = false</code> on the <code className="font-mono">scraper-worker</code> edge function. Set this in Supabase → Edge Functions → scraper-worker → Settings.
          </p>
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'SERP Results',   value: serpData.length,    icon: Database,     color: 'text-cyan' },
          { label: 'STARZ Engine',   value: starzResults,       icon: Globe,        color: 'text-emerald-400' },
          { label: 'SerpAPI',        value: serpApiResults,     icon: Search,       color: 'text-violet' },
          { label: 'Engine Logs',    value: engineLogs.length,  icon: BarChart3,    color: 'text-amber-400' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {loading ? <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" /> : <AnimatedCounter end={m.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Chart */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <h3 className="font-semibold text-foreground text-sm mb-4">SERP Scrape Activity</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="seoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="scans" name="Scans" stroke="#00F0FF" strokeWidth={2} fill="url(#seoGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border/40 rounded-xl w-fit">
        {(['results', 'cache', 'logs'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${activeTab === tab ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'results' ? `SERP Results (${serpData.length})` : tab === 'cache' ? `Cache (${serpCache.length})` : `Engine Logs (${engineLogs.length})`}
          </button>
        ))}
      </div>

      {/* Tab: SERP Results */}
      {activeTab === 'results' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">seo.serp_data</h3>
            <span className="text-[10px] text-muted-foreground">{serpData.length} records</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/10">
            <span>Keyword</span><span>Location</span><span>Source</span><span>Scraped</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading SERP data...</div>
          ) : serpData.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No data in seo.serp_data yet.<br />
              <span className="text-[10px]">Run the scraper above to populate results.</span>
            </div>
          ) : (
            <div className="divide-y divide-border/10 max-h-96 overflow-y-auto">
              {serpData.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors items-center">
                  <p className="text-sm font-medium text-foreground truncate">{d.keyword}</p>
                  <p className="text-xs text-muted-foreground">{d.location || '—'}</p>
                  <Badge variant="outline" className={`text-[10px] ${d.source === 'serpapi' ? 'border-violet/30 text-violet' : 'border-cyan/30 text-cyan'}`}>
                    {d.source || 'starz'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(d.created_at)}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Cache */}
      {activeTab === 'cache' && (
        <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/20">
            <h3 className="text-sm font-semibold text-foreground">seo.serp_cache</h3>
          </div>
          {serpCache.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No cache entries yet</div>
          ) : (
            <div className="divide-y divide-border/10 max-h-96 overflow-y-auto">
              {serpCache.map((c, i) => (
                <div key={c.id || i} className="flex items-center gap-4 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors">
                  <Database className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{c.keyword || c.query || c.id}</p>
                    <p className="text-[10px] text-muted-foreground">{c.source || '—'} · {c.location || '—'}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Engine Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Success Rate', value: engineLogs.length > 0 ? `${Math.round((successLogs/engineLogs.length)*100)}%` : '—', color: 'text-emerald-400' },
              { label: 'Avg Duration', value: avgDuration > 0 ? `${avgDuration}ms` : '—', color: 'text-cyan' },
              { label: 'Total Requests', value: engineLogs.length, color: 'text-violet' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-card border border-border/40 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-card border border-border/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/20">
              <h3 className="text-sm font-semibold text-foreground">seo.unified_engine_logs</h3>
            </div>
            {engineLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No engine logs yet</div>
            ) : (
              <div className="divide-y divide-border/10 max-h-80 overflow-y-auto">
                {engineLogs.map((log, i) => (
                  <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-space-highlight/20 transition-colors">
                    {log.success
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      : <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{log.action || log.route || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{log.route || '—'} · {log.duration_ms ? `${log.duration_ms}ms` : '—'}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${log.status_code && log.status_code < 300 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {log.status_code || '—'}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(log.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
