'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity, Search, FileText, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Loader2, Globe,
  BarChart3, Zap, Eye, Filter, ChevronUp, ChevronDown
} from 'lucide-react';

interface Audit {
  id: string;
  org_id: string;
  website: string | null;
  score: number | null;
  issues: any;
  created_at: string;
}

interface SitePage {
  id: string;
  url: string | null;
  title: string | null;
  h1: string | null;
  meta_description: string | null;
  primary_keyword: string | null;
  keyword_cluster: string | null;
  page_type: string | null;
  word_count: number | null;
  status: string | null;
  last_crawled_at: string | null;
}

interface Keyword {
  id: string;
  keyword: string | null;
  search_volume: number | null;
  difficulty: number | null;
  trend_score: number | null;
  intent: string | null;
  source: string | null;
  last_checked: string | null;
}

interface RankTracking {
  id: string;
  keyword_id: string;
  position: number | null;
  checked_at: string | null;
  device: string | null;
  location: string | null;
}

type Tab = 'audits' | 'pages' | 'keywords' | 'rankings';

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ScoreBadge({ score }: { score: number | null }) {
  const s = score || 0;
  const color = s >= 80 ? 'text-green-400 bg-green-500/20 border-green-500/30' : s >= 60 ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' : 'text-red-400 bg-red-500/20 border-red-500/30';
  return <span className={`px-2 py-0.5 rounded text-xs font-bold border ${color}`}>{s}</span>;
}

function PositionBadge({ pos }: { pos: number | null }) {
  const p = pos || 0;
  const color = p <= 3 ? 'text-green-400' : p <= 10 ? 'text-yellow-400' : p <= 20 ? 'text-orange-400' : 'text-red-400';
  return <span className={`text-sm font-bold ${color}`}>#{p || '—'}</span>;
}

function DifficultyBar({ diff }: { diff: number | null }) {
  const d = Math.round(diff || 0);
  const color = d >= 70 ? 'bg-red-400' : d >= 40 ? 'bg-yellow-400' : 'bg-green-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-white/10 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${d}%` }} />
      </div>
      <span className="text-xs text-white/40">{d}</span>
    </div>
  );
}

export default function SiteOptimization() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('audits');
  const [audits, setAudits] = useState<Audit[]>([]);
  const [pages, setPages] = useState<SitePage[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [rankings, setRankings] = useState<RankTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  const loadData = useCallback(async (t: Tab) => {
    setLoading(true); setError(null);
    try {
      if (t === 'audits') {
        const { data, error } = await supabase.schema('seo').from('audits')
          .select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        const a = (data || []) as Audit[];
        setAudits(a);
        if (a.length) setSelectedAudit(a[0]);
      } else if (t === 'pages') {
        const { data, error } = await supabase.schema('seo').from('site_pages')
          .select('*').order('created_at', { ascending: false }).limit(200);
        if (error) throw error;
        setPages((data || []) as SitePage[]);
      } else if (t === 'keywords') {
        const { data, error } = await supabase.schema('seo').from('keywords')
          .select('*').order('search_volume', { ascending: false }).limit(200);
        if (error) throw error;
        setKeywords((data || []) as Keyword[]);
      } else if (t === 'rankings') {
        const { data, error } = await supabase.schema('seo').from('rank_tracking')
          .select('*').order('checked_at', { ascending: false }).limit(200);
        if (error) throw error;
        setRankings((data || []) as RankTracking[]);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(tab); }, [tab]);

  const avgScore = audits.length ? Math.round(audits.reduce((a, b) => a + (b.score || 0), 0) / audits.length) : 0;
  const goodSites = audits.filter(a => (a.score || 0) >= 80).length;
  const badSites = audits.filter(a => (a.score || 0) < 60).length;
  const top10Keywords = keywords.filter(k => (k.search_volume || 0) > 0).slice(0, 5);

  const filteredPages = pages.filter(p => {
    const s = search.toLowerCase();
    return !s || (p.url || '').toLowerCase().includes(s) || (p.primary_keyword || '').toLowerCase().includes(s) || (p.title || '').toLowerCase().includes(s);
  });

  const filteredKeywords = keywords.filter(k => {
    const s = search.toLowerCase();
    return !s || (k.keyword || '').toLowerCase().includes(s) || (k.intent || '').toLowerCase().includes(s);
  });

  const tabs: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: 'audits', label: 'Site Audits', icon: Activity, count: audits.length },
    { id: 'pages', label: 'Site Pages', icon: FileText, count: pages.length },
    { id: 'keywords', label: 'Keywords', icon: Search, count: keywords.length },
    { id: 'rankings', label: 'Rank Tracking', icon: TrendingUp, count: rankings.length },
  ];

  const ic = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 transition-colors";

  const auditIssues = selectedAudit?.issues;
  const issueList = auditIssues && typeof auditIssues === 'object'
    ? Object.entries(auditIssues).filter(([, v]) => v)
    : [];

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Site Optimization Engine</h1>
              <p className="text-sm text-white/40">Technical SEO - full site audits, schema generation, Core Web Vitals</p>
            </div>
            <div className="ml-auto">
              <button onClick={() => loadData(tab)} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Audits', value: audits.length, color: 'text-white', icon: Activity },
              { label: 'Avg SEO Score', value: avgScore, color: avgScore >= 80 ? 'text-green-400' : avgScore >= 60 ? 'text-yellow-400' : 'text-red-400', icon: BarChart3 },
              { label: 'Good Sites (80+)', value: goodSites, color: 'text-green-400', icon: CheckCircle },
              { label: 'Needs Work (<60)', value: badSites, color: 'text-red-400', icon: AlertTriangle },
            ].map(({ label, value, color, icon: Icon }) => (
              <Card key={label} className="bg-gray-900 border-white/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${color} opacity-60 shrink-0`} />
                  <div>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-white/30">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-white/10 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => { setTab(id); setSearch(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                  tab === id ? 'border-green-500 text-green-400' : 'border-transparent text-white/40 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />{label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${tab === id ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin" />Loading SEO data...
            </div>
          ) : (
            <>
              {/* AUDITS */}
              {tab === 'audits' && (
                <div className={selectedAudit && issueList.length > 0 ? 'grid grid-cols-[1fr_320px] gap-5' : ''}>
                  <Card className="bg-gray-900 border-white/10">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Website</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Score</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Issues</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Audited</th>
                          </tr>
                        </thead>
                        <tbody>
                          {audits.length === 0 ? (
                            <tr><td colSpan={4} className="py-20 text-center text-white/20">
                              <div className="flex flex-col items-center gap-3">
                                <Activity className="w-12 h-12 text-white/10" />
                                <p>No site audits yet</p>
                                <p className="text-xs text-white/10">Audits run automatically when clients are onboarded</p>
                              </div>
                            </td></tr>
                          ) : audits.map(audit => {
                            const issues = audit.issues && typeof audit.issues === 'object'
                              ? Object.values(audit.issues).filter(Boolean).length
                              : 0;
                            return (
                              <tr key={audit.id} onClick={() => setSelectedAudit(selectedAudit?.id === audit.id ? null : audit)}
                                className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer ${selectedAudit?.id === audit.id ? 'bg-white/5' : ''}`}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-white/30" />
                                    <span className="text-white font-medium">{audit.website || '—'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3"><ScoreBadge score={audit.score} /></td>
                                <td className="px-4 py-3">
                                  <span className={`text-sm font-semibold ${issues > 5 ? 'text-red-400' : issues > 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {issues} issue{issues !== 1 ? 's' : ''}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-white/30">{fmt(audit.created_at)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {selectedAudit && issueList.length > 0 && (
                    <Card className="bg-gray-900 border-white/10">
                      <div className="p-4 border-b border-white/10 flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-white text-sm">{selectedAudit.website}</h3>
                          <p className="text-xs text-white/40 mt-0.5">Audit Issues</p>
                        </div>
                        <ScoreBadge score={selectedAudit.score} />
                      </div>
                      <div className="p-4 flex flex-col gap-2">
                        {issueList.map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2 bg-white/5 rounded-lg px-3 py-2">
                            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-white capitalize">{key.replace(/_/g, ' ')}</p>
                              {typeof value === 'string' && <p className="text-xs text-white/40 mt-0.5">{value}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* PAGES */}
              {tab === 'pages' && (
                <div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input className={`${ic} pl-9 w-full max-w-md`} placeholder="Search URL, keyword, title..."
                      value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <Card className="bg-gray-900 border-white/10">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">URL</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Title</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Keyword</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Words</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Crawled</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPages.length === 0 ? (
                            <tr><td colSpan={7} className="py-20 text-center text-white/20">
                              <div className="flex flex-col items-center gap-3">
                                <FileText className="w-12 h-12 text-white/10" />
                                <p>No pages crawled yet</p>
                              </div>
                            </td></tr>
                          ) : filteredPages.map(page => (
                            <tr key={page.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                              <td className="px-4 py-3 max-w-[180px]">
                                <p className="text-xs text-cyan-400 truncate">{page.url?.replace(/^https?:\/\//, '') || '—'}</p>
                              </td>
                              <td className="px-4 py-3 max-w-[180px]">
                                <p className="text-xs text-white/70 truncate">{page.title || '—'}</p>
                                {page.h1 && <p className="text-xs text-white/30 truncate">H1: {page.h1}</p>}
                              </td>
                              <td className="px-4 py-3 text-xs text-white/50 max-w-[120px] truncate">{page.primary_keyword || '—'}</td>
                              <td className="px-4 py-3 text-xs text-white/40 capitalize">{page.page_type || '—'}</td>
                              <td className="px-4 py-3 text-xs text-white/40">{page.word_count?.toLocaleString() || '—'}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold border capitalize ${
                                  page.status === 'optimized' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                  page.status === 'needs_work' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                  'bg-white/10 text-white/40 border-white/20'
                                }`}>{page.status || '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-white/30">{fmt(page.last_crawled_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* KEYWORDS */}
              {tab === 'keywords' && (
                <div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input className={`${ic} pl-9 w-full max-w-md`} placeholder="Search keywords..."
                      value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <Card className="bg-gray-900 border-white/10">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Keyword</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Volume</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Difficulty</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Trend</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Intent</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Source</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Checked</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredKeywords.length === 0 ? (
                            <tr><td colSpan={7} className="py-20 text-center text-white/20">
                              <div className="flex flex-col items-center gap-3">
                                <Search className="w-12 h-12 text-white/10" />
                                <p>No keywords tracked yet</p>
                              </div>
                            </td></tr>
                          ) : filteredKeywords.map(kw => (
                            <tr key={kw.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                              <td className="px-4 py-3 font-medium text-white">{kw.keyword || '—'}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-cyan-400">{kw.search_volume?.toLocaleString() || '—'}</td>
                              <td className="px-4 py-3"><DifficultyBar diff={kw.difficulty} /></td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-semibold ${(kw.trend_score || 0) >= 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                                  {kw.trend_score ? `${(Number(kw.trend_score) * 100).toFixed(0)}%` : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold border capitalize ${
                                  kw.intent === 'commercial' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                  kw.intent === 'transactional' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                  kw.intent === 'informational' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                  'bg-white/10 text-white/40 border-white/20'
                                }`}>{kw.intent || '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-white/40">{kw.source || '—'}</td>
                              <td className="px-4 py-3 text-xs text-white/30">{fmt(kw.last_checked)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* RANKINGS */}
              {tab === 'rankings' && (
                <Card className="bg-gray-900 border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Position</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Device</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Location</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Checked</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankings.length === 0 ? (
                          <tr><td colSpan={4} className="py-20 text-center text-white/20">
                            <div className="flex flex-col items-center gap-3">
                              <TrendingUp className="w-12 h-12 text-white/10" />
                              <p>No rank tracking data yet</p>
                            </div>
                          </td></tr>
                        ) : rankings.map(r => (
                          <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                            <td className="px-4 py-3"><PositionBadge pos={r.position} /></td>
                            <td className="px-4 py-3 text-xs text-white/60 capitalize">{r.device || '—'}</td>
                            <td className="px-4 py-3 text-xs text-white/60">{r.location || '—'}</td>
                            <td className="px-4 py-3 text-xs text-white/30">{fmt(r.checked_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}