import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Search, TrendingUp, BarChart3, AlertCircle, Clock, Target, Star,
  Plus, ChevronRight, ArrowUpRight, ArrowDownRight, X, RefreshCw} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const keywordData = [
  { name: 'Mon', rank: 4, change: 0 },
  { name: 'Tue', rank: 3, change: 1 },
  { name: 'Wed', rank: 5, change: -2 },
  { name: 'Thu', rank: 2, change: 3 },
  { name: 'Fri', rank: 3, change: -1 },
  { name: 'Sat', rank: 2, change: 1 },
  { name: 'Sun', rank: 1, change: 1 },
]

const initialKeywords = [
  { term: 'seo services miami', rank: 1, volume: 2400, difficulty: 45, change: 2, url: 'starz-os.com/seo-miami', lastChecked: '2h ago' },
  { term: 'digital marketing agency', rank: 3, volume: 8100, difficulty: 62, change: -1, url: 'starz-os.com/agency', lastChecked: '2h ago' },
  { term: 'ppc management', rank: 5, volume: 1900, difficulty: 38, change: 0, url: 'starz-os.com/ppc', lastChecked: '4h ago' },
  { term: 'web design nyc', rank: 2, volume: 3600, difficulty: 51, change: 3, url: 'starz-os.com/web-design', lastChecked: '4h ago' },
  { term: 'local seo chicago', rank: 4, volume: 1200, difficulty: 33, change: -2, url: 'starz-os.com/local-seo', lastChecked: '6h ago' },
  { term: 'social media marketing', rank: 8, volume: 5400, difficulty: 71, change: 1, url: 'starz-os.com/social', lastChecked: '6h ago' },
  { term: 'content marketing strategy', rank: 6, volume: 2800, difficulty: 55, change: 0, url: 'starz-os.com/content', lastChecked: '12h ago' },
]

const serpCache = [
  { keyword: 'seo services miami', position: 1, page: 'Homepage', competitors: 3, updated: '2h ago' },
  { keyword: 'digital marketing agency', position: 3, page: 'Agency', competitors: 8, updated: '2h ago' },
  { keyword: 'web design nyc', position: 2, page: 'Web Design', competitors: 5, updated: '4h ago' },
  { keyword: 'ppc management', position: 5, page: 'PPC', competitors: 4, updated: '4h ago' },
]

export default function SEODashboard() {
  const [scraperMode, setScraperMode] = useLocalStorage('starz-scraper-mode', 'starz')
  const [keywords, setKeywords] = useLocalStorage('starz-keywords', initialKeywords)
  const [showAdd, setShowAdd] = useState(false)
  const [newKeyword, setNewKeyword] = useState({ term: '', volume: '', difficulty: '50', url: '' })
  const [refreshing, setRefreshing] = useState(false)
  const { success, info, warning } = useToast()

  const handleAddKeyword = () => {
    if (!newKeyword.term) {
      warning('Keyword term is required')
      return
    }
    setKeywords((prev: any[]) => [...prev, {
      term: newKeyword.term,
      rank: 10,
      volume: Number(newKeyword.volume) || 1000,
      difficulty: Number(newKeyword.difficulty) || 50,
      change: 0,
      url: newKeyword.url || `starz-os.com/${newKeyword.term.replace(/\s+/g, '-')}`,
      lastChecked: 'just now',
    }])
    setShowAdd(false)
    setNewKeyword({ term: '', volume: '', difficulty: '50', url: '' })
    success(`Keyword "${newKeyword.term}" added to tracking`)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      success('Keyword rankings refreshed')
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan" />
            SEO Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">SERP tracking, keyword monitoring, and rank analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/40 text-xs">
            <span className="text-muted-foreground">Scraper:</span>
            <button
              onClick={() => { setScraperMode('starz'); success('Switched to STARZ scraper') }}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${scraperMode === 'starz' ? 'bg-cyan/10 text-cyan' : 'text-muted-foreground'}`}
            >
              STARZ
            </button>
            <button
              onClick={() => { setScraperMode('serpapi'); info('Switched to SerpAPI') }}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${scraperMode === 'serpapi' ? 'bg-cyan/10 text-cyan' : 'text-muted-foreground'}`}
            >
              SerpAPI
            </button>
          </div>
          <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Keyword
          </Button>
        </div>
      </div>

      {/* Add Keyword Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-md shadow-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Add Keyword</h3>
                <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-card text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Keyword term" value={newKeyword.term} onChange={(e) => setNewKeyword({ ...newKeyword, term: e.target.value })} className="bg-card border-border/40" />
                <Input placeholder="Search volume" type="number" value={newKeyword.volume} onChange={(e) => setNewKeyword({ ...newKeyword, volume: e.target.value })} className="bg-card border-border/40" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Difficulty:</span>
                  <input type="range" min="0" max="100" value={newKeyword.difficulty} onChange={(e) => setNewKeyword({ ...newKeyword, difficulty: e.target.value })} className="flex-1" />
                  <span className="text-xs text-foreground w-8">{newKeyword.difficulty}</span>
                </div>
                <Input placeholder="Target URL (optional)" value={newKeyword.url} onChange={(e) => setNewKeyword({ ...newKeyword, url: e.target.value })} className="bg-card border-border/40" />
                <Button className="w-full bg-gradient-primary text-space font-semibold" onClick={handleAddKeyword}>Add Keyword</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Position', value: keywords.reduce((a: number, b: any) => a + b.rank, 0) / keywords.length, decimals: 1, icon: Target, color: 'text-cyan' },
          { label: 'Keywords Tracked', value: keywords.length, icon: Search, color: 'text-violet' },
          { label: 'Top 3 Rankings', value: keywords.filter((k: any) => k.rank <= 3).length, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Est. Traffic', value: keywords.reduce((a: number, b: any) => a + b.volume, 0), suffix: '/mo', icon: BarChart3, color: 'text-amber-400' },
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
              <AnimatedCounter end={m.value} suffix={m.suffix || ''} decimals={m.decimals || 0} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Rank Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Rank Movement</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Avg position over last 7 days</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan bg-cyan/5 rounded-lg">Live</Badge>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={keywordData}>
              <defs>
                <linearGradient id="seoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis reversed tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#12121A', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#F8FAFC' }} />
              <Area type="monotone" dataKey="rank" stroke="#00F0FF" strokeWidth={2} fill="url(#seoGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* SERP Cache */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <h3 className="font-semibold text-foreground text-sm mb-4">SERP Cache</h3>
          <div className="space-y-3">
            {serpCache.map((s) => (
              <div key={s.keyword} className="p-3 rounded-xl bg-space-highlight/30 border border-border/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{s.keyword}</span>
                  <span className={`text-sm font-bold ${s.position <= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>#{s.position}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{s.page}</span>
                  <span>{s.competitors} competitors</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Updated {s.updated}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Keywords Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden"
      >
        <div className="p-5 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Tracked Keywords</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{keywords.length} keywords monitored</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-cyan hover:text-cyan hover:bg-cyan/5 h-7" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh All'}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border/20">
                {['Keyword', 'Rank', 'Volume', 'Difficulty', 'Change', 'URL', ''].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keywords.map((k: any) => (
                <tr key={k.term} className="border-t border-border/10 hover:bg-space-highlight/20 transition-colors">
                  <td className="px-5 py-3"><span className="text-sm font-medium text-foreground">{k.term}</span></td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-bold ${k.rank <= 3 ? 'text-emerald-400' : k.rank <= 5 ? 'text-amber-400' : 'text-muted-foreground'}`}>#{k.rank}</span>
                  </td>
                  <td className="px-5 py-3"><span className="text-sm text-muted-foreground">{k.volume.toLocaleString()}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400 to-red-400" style={{ width: `${k.difficulty}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{k.difficulty}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`flex items-center gap-1 text-sm ${k.change > 0 ? 'text-emerald-400' : k.change < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {k.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : k.change < 0 ? <ArrowDownRight className="w-3 h-3" /> : <span className="w-3 h-3">-</span>}
                      {Math.abs(k.change)}
                    </span>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs text-muted-foreground font-mono">{k.url}</span></td>
                  <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{k.lastChecked}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
