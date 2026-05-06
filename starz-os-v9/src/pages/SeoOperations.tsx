import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Globe, Search, TrendingUp, ArrowUpRight, ArrowDownRight,
  Plus, Target, BarChart3, Link2, Activity, Shield, Zap,
  RefreshCw, ChevronRight, ExternalLink} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const rankData = [
  { name: 'W1', avgRank: 8.2 },
  { name: 'W2', avgRank: 7.1 },
  { name: 'W3', avgRank: 6.5 },
  { name: 'W4', avgRank: 5.8 },
  { name: 'W5', avgRank: 4.9 },
  { name: 'W6', avgRank: 4.2 },
  { name: 'W7', avgRank: 3.8 },
  { name: 'W8', avgRank: 3.1 },
]

const keywords = [
  { id: 1, keyword: 'seo services miami', client: 'Miami Auto Group', currentRank: 1, previousRank: 3, change: 2, volume: 2400, difficulty: 45 },
  { id: 2, keyword: 'digital marketing agency', client: 'NYC Dental', currentRank: 3, previousRank: 4, change: 1, volume: 8100, difficulty: 62 },
  { id: 3, keyword: 'ppc management', client: 'Phoenix Roofing', currentRank: 2, previousRank: 5, change: 3, volume: 1900, difficulty: 38 },
  { id: 4, keyword: 'web design nyc', client: 'SF Tech Startup', currentRank: 1, previousRank: 2, change: 1, volume: 3600, difficulty: 51 },
  { id: 5, keyword: 'local seo chicago', client: 'Chicago Law', currentRank: 4, previousRank: 7, change: 3, volume: 1200, difficulty: 33 },
  { id: 6, keyword: 'social media marketing', client: 'Dallas Realty', currentRank: 6, previousRank: 8, change: 2, volume: 5400, difficulty: 71 },
  { id: 7, keyword: 'content marketing strategy', client: 'Seattle Coffee', currentRank: 3, previousRank: 6, change: 3, volume: 2800, difficulty: 55 },
  { id: 8, keyword: 'best coffee shop seattle', client: 'Seattle Coffee', currentRank: 2, previousRank: 9, change: 7, volume: 3200, difficulty: 42 },
]

const backlinks = [
  { id: 1, sourceUrl: 'https://forbes.com/business/', targetUrl: 'starz-os.com/client1', domainAuthority: 94, status: 'live', anchorText: 'digital marketing' },
  { id: 2, sourceUrl: 'https://entrepreneur.com/seo/', targetUrl: 'starz-os.com/client2', domainAuthority: 87, status: 'live', anchorText: 'SEO services' },
  { id: 3, sourceUrl: 'https://hubspot.com/marketing/', targetUrl: 'starz-os.com/client3', domainAuthority: 91, status: 'outreach_sent', anchorText: 'marketing agency' },
  { id: 4, sourceUrl: 'https://moz.com/blog/', targetUrl: 'starz-os.com/client1', domainAuthority: 89, status: 'negotiating', anchorText: 'local SEO' },
  { id: 5, sourceUrl: 'https://search Engine journal.com/', targetUrl: 'starz-os.com/client4', domainAuthority: 85, status: 'live', anchorText: 'web design' },
]

const statusBadge = (status: string) => {
  switch (status) {
    case 'live': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'outreach_sent': return 'bg-cyan/10 text-cyan border-cyan/30'
    case 'negotiating': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'prospect': return 'bg-muted text-muted-foreground'
    default: return 'bg-muted text-muted-foreground'
  }
}

export default function SeoOperations() {
  const [activeTab, setActiveTab] = useState<'keywords' | 'backlinks' | 'audit'>('keywords')
  const [refreshing, setRefreshing] = useState(false)
  const { success } = useToast()

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => { setRefreshing(false); success('SEO data refreshed') }, 1500)
  }

  const avgImprovement = keywords.reduce((a, k) => a + k.change, 0) / keywords.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan" />
            SEO Operations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Keyword tracking, backlink management, technical audits</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs text-cyan hover:text-cyan hover:bg-cyan/5 h-7" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Keywords Tracked', value: keywords.length, icon: Target, color: 'text-cyan' },
          { label: 'Avg Rank', value: (keywords.reduce((a, k) => a + k.currentRank, 0) / keywords.length).toFixed(1), isString: true, icon: BarChart3, color: 'text-violet' },
          { label: 'Backlinks', value: backlinks.filter(b => b.status === 'live').length, icon: Link2, color: 'text-emerald-400' },
          { label: 'Avg Improvement', value: avgImprovement.toFixed(1), prefix: '+', isString: true, icon: TrendingUp, color: 'text-emerald-400' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {m.isString ? `${m.prefix || ''}${m.value}` : <AnimatedCounter end={m.value as number} prefix={m.prefix || ''} />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(['keywords', 'backlinks', 'audit'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all ${activeTab === tab ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'keywords' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Rank Chart */}
          <div className="p-5 rounded-2xl bg-card border border-border/40 card-glow mb-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">Average Rank Trend (reversed — lower is better)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={rankData}>
                <defs>
                  <linearGradient id="seoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis reversed tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#12121A', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#F8FAFC' }} />
                <Area type="monotone" dataKey="avgRank" stroke="#00F0FF" strokeWidth={2} fill="url(#seoGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Keywords Table */}
          <div className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/20">
                    {['Keyword', 'Client', 'Rank', 'Change', 'Volume', 'Difficulty'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((k) => (
                    <tr key={k.id} className="border-b border-border/10 hover:bg-space-highlight/20 transition-colors">
                      <td className="px-5 py-3"><span className="text-sm font-medium text-foreground">{k.keyword}</span></td>
                      <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{k.client}</span></td>
                      <td className="px-5 py-3"><span className={`text-sm font-bold ${k.currentRank <= 3 ? 'text-emerald-400' : k.currentRank <= 5 ? 'text-amber-400' : 'text-muted-foreground'}`}>#{k.currentRank}</span></td>
                      <td className="px-5 py-3">
                        <span className={`flex items-center gap-1 text-sm ${k.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {k.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}+{k.change}
                        </span>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'backlinks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {backlinks.map((bl) => (
            <div key={bl.id} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-cyan" />
                  <a href={bl.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan hover:underline truncate max-w-xs">{bl.sourceUrl}</a>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </div>
                <Badge className={`text-[10px] ${statusBadge(bl.status)}`}>{bl.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>DA: <span className="text-foreground font-medium">{bl.domainAuthority}</span></span>
                <span>Anchor: <span className="text-foreground font-medium">{bl.anchorText}</span></span>
                <span>Target: <span className="text-muted-foreground">{bl.targetUrl}</span></span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Site Health', score: 87, icon: Shield, color: 'text-emerald-400' },
            { label: 'Page Speed', score: 72, icon: Zap, color: 'text-amber-400' },
            { label: 'Mobile Friendly', score: 95, icon: Activity, color: 'text-emerald-400' },
            { label: 'Schema Markup', score: 60, icon: Target, color: 'text-amber-400' },
            { label: 'Core Web Vitals', score: 78, icon: BarChart3, color: 'text-cyan' },
            { label: 'Indexability', score: 92, icon: Search, color: 'text-emerald-400' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
              <div className="flex items-center gap-2 mb-3">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-400' : item.score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${item.score}%` }} />
              </div>
              <p className={`text-sm font-bold mt-2 ${item.color}`}>{item.score}/100</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
