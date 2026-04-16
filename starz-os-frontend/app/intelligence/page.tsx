'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain, TrendingUp, Globe, Search, RefreshCw, Loader2,
  AlertTriangle, MapPin, BarChart3, Users, Zap, Eye,
  ChevronUp, ChevronDown, Filter, Star
} from 'lucide-react';

interface MarketOpportunity {
  id: number;
  city: string | null;
  state: string | null;
  country: string | null;
  industry: string | null;
  opportunity_score: number | null;
  search_volume: number | null;
  competitor_count: number | null;
  weak_sites: number | null;
  scanned_at: string | null;
  lead_status: string | null;
}

interface WebsiteAudit {
  id: string;
  business_name: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  seo_missing: boolean | null;
  slow_site: boolean | null;
  schema_missing: boolean | null;
  mobile_bad: boolean | null;
  low_reviews: boolean | null;
  weakness_score: number | null;
  analyzed_at: string | null;
}

interface Competitor {
  id: string;
  tenant_id: string | null;
  place_id: string | null;
  name: string | null;
  rating: number | null;
  review_count: number | null;
  market_score: number | null;
  first_seen: string | null;
  last_seen: string | null;
  industry: string | null;
}

type Tab = 'opportunities' | 'audits' | 'competitors';

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ScoreBadge({ score, max = 100 }: { score: number | null; max?: number }) {
  const s = score || 0;
  const pct = (s / max) * 100;
  const color = pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`text-sm font-bold ${color}`}>{s}</span>;
}

function LeadStatusPill({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    new: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    contacted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    qualified: 'bg-green-500/20 text-green-400 border-green-500/30',
    converted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    lost: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const cls = map[(status || '').toLowerCase()] || 'bg-white/10 text-white/40 border-white/20';
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold border capitalize ${cls}`}>{status || '—'}</span>;
}

export default function IntelligenceEngine() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('opportunities');
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [audits, setAudits] = useState<WebsiteAudit[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sortField, setSortField] = useState('opportunity_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadData = useCallback(async (t: Tab) => {
    setLoading(true); setError(null);
    try {
      if (t === 'opportunities') {
        const { data, error } = await supabase.schema('intelligence').from('market_opportunities')
          .select('*').order('opportunity_score', { ascending: false }).limit(200);
        if (error) throw error;
        setOpportunities((data || []) as MarketOpportunity[]);
      } else if (t === 'audits') {
        const { data, error } = await supabase.schema('intelligence').from('website_audits')
          .select('*').order('weakness_score', { ascending: false }).limit(200);
        if (error) throw error;
        setAudits((data || []) as WebsiteAudit[]);
      } else if (t === 'competitors') {
        const { data, error } = await supabase.schema('intelligence').from('competitors')
          .select('*').order('market_score', { ascending: false }).limit(200);
        if (error) throw error;
        setCompetitors((data || []) as Competitor[]);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(tab); }, [tab]);

  const uniqueIndustries = [...new Set([
    ...opportunities.map(o => o.industry),
    ...audits.map(a => a.industry),
    ...competitors.map(c => c.industry),
  ].filter(Boolean))] as string[];

  const filteredOpportunities = opportunities.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = !s || (o.city || '').toLowerCase().includes(s) || (o.industry || '').toLowerCase().includes(s) || (o.state || '').toLowerCase().includes(s);
    const matchIndustry = industryFilter === 'all' || o.industry === industryFilter;
    return matchSearch && matchIndustry;
  });

  const filteredAudits = audits.filter(a => {
    const s = search.toLowerCase();
    const matchSearch = !s || (a.business_name || '').toLowerCase().includes(s) || (a.website || '').toLowerCase().includes(s);
    const matchIndustry = industryFilter === 'all' || a.industry === industryFilter;
    return matchSearch && matchIndustry;
  });

  const filteredCompetitors = competitors.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = !s || (c.name || '').toLowerCase().includes(s);
    const matchIndustry = industryFilter === 'all' || c.industry === industryFilter;
    return matchSearch && matchIndustry;
  });

  const topOpps = opportunities.slice(0, 5);
  const avgScore = opportunities.length ? Math.round(opportunities.reduce((a, b) => a + (b.opportunity_score || 0), 0) / opportunities.length) : 0;
  const highValue = opportunities.filter(o => (o.opportunity_score || 0) >= 70).length;
  const weakSitesTotal = opportunities.reduce((a, b) => a + (b.weak_sites || 0), 0);

  const tabs: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: 'opportunities', label: 'Market Opportunities', icon: TrendingUp, count: opportunities.length },
    { id: 'audits', label: 'Website Audits', icon: Eye, count: audits.length },
    { id: 'competitors', label: 'Competitors', icon: Users, count: competitors.length },
  ];

  const ic = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors";

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">STARZ Intelligence Engine</h1>
              <p className="text-sm text-white/40">SEO + Market Domination - real-time opportunity scanning</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => loadData(tab)} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Opportunities', value: opportunities.length, color: 'text-cyan-400', icon: TrendingUp },
              { label: 'High Value (70+)', value: highValue, color: 'text-green-400', icon: Zap },
              { label: 'Avg Opportunity Score', value: avgScore, color: 'text-yellow-400', icon: BarChart3 },
              { label: 'Weak Sites Found', value: weakSitesTotal, color: 'text-red-400', icon: AlertTriangle },
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

          {/* Top Opportunities Preview */}
          {topOpps.length > 0 && (
            <Card className="bg-gray-900 border-cyan-500/20 mb-5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-cyan-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />Top Market Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {topOpps.map((opp, i) => (
                    <div key={opp.id} className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3">
                      <span className="text-white/20 text-sm font-bold w-4">#{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{opp.industry} — {opp.city}, {opp.state}</p>
                        <p className="text-xs text-white/30">Vol: {opp.search_volume?.toLocaleString()} · {opp.competitor_count} competitors · {opp.weak_sites} weak sites</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <LeadStatusPill status={opp.lead_status} />
                        <div className="text-right">
                          <p className="text-xs text-white/30">Score</p>
                          <ScoreBadge score={opp.opportunity_score} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-white/10">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => { setTab(id); setSearch(''); setIndustryFilter('all'); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                  tab === id ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-white/40 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />{label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${tab === id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-white/40'}`}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input className={`${ic} pl-9 w-full`} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {uniqueIndustries.length > 0 && (
              <select className={ic} value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}
                style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}>
                <option value="all">All Industries</option>
                {uniqueIndustries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin" />Loading intelligence data...
            </div>
          ) : (
            <>
              {/* OPPORTUNITIES */}
              {tab === 'opportunities' && (
                <Card className="bg-gray-900 border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Market</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Industry</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Score</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Search Vol</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Competitors</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Weak Sites</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Scanned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOpportunities.length === 0 ? (
                          <tr><td colSpan={8} className="py-20 text-center text-white/20">
                            <div className="flex flex-col items-center gap-3">
                              <Brain className="w-12 h-12 text-white/10" />
                              <p>No market opportunities scanned yet</p>
                              <p className="text-xs text-white/10">Run the scraper to populate market intelligence data</p>
                            </div>
                          </td></tr>
                        ) : filteredOpportunities.map(opp => (
                          <tr key={opp.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-white font-medium">{opp.city}, {opp.state}</span>
                              </div>
                              {opp.country && <p className="text-xs text-white/30 ml-5">{opp.country}</p>}
                            </td>
                            <td className="px-4 py-3 text-xs text-white/60 capitalize">{opp.industry || '—'}</td>
                            <td className="px-4 py-3"><ScoreBadge score={opp.opportunity_score} /></td>
                            <td className="px-4 py-3 text-xs text-white/60">{opp.search_volume?.toLocaleString() || '—'}</td>
                            <td className="px-4 py-3 text-xs text-white/60">{opp.competitor_count ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold ${(opp.weak_sites || 0) >= 5 ? 'text-red-400' : (opp.weak_sites || 0) >= 2 ? 'text-yellow-400' : 'text-white/40'}`}>
                                {opp.weak_sites ?? '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3"><LeadStatusPill status={opp.lead_status} /></td>
                            <td className="px-4 py-3 text-xs text-white/30">{fmt(opp.scanned_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* WEBSITE AUDITS */}
              {tab === 'audits' && (
                <Card className="bg-gray-900 border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Business</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Location</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Weakness</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Issues</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Analyzed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAudits.length === 0 ? (
                          <tr><td colSpan={5} className="py-20 text-center text-white/20">
                            <div className="flex flex-col items-center gap-3">
                              <Eye className="w-12 h-12 text-white/10" />
                              <p>No website audits yet</p>
                              <p className="text-xs text-white/10">Audits run automatically when leads are scraped</p>
                            </div>
                          </td></tr>
                        ) : filteredAudits.map(audit => {
                          const issues = [
                            audit.seo_missing && 'SEO',
                            audit.slow_site && 'Speed',
                            audit.schema_missing && 'Schema',
                            audit.mobile_bad && 'Mobile',
                            audit.low_reviews && 'Reviews',
                          ].filter(Boolean);
                          return (
                            <tr key={audit.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-medium text-white">{audit.business_name || '—'}</p>
                                {audit.website && <a href={audit.website.startsWith('http') ? audit.website : `https://${audit.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300">{audit.website.replace(/^https?:\/\//, '')}</a>}
                              </td>
                              <td className="px-4 py-3 text-xs text-white/60">{[audit.city, audit.state].filter(Boolean).join(', ') || '—'}</td>
                              <td className="px-4 py-3"><ScoreBadge score={audit.weakness_score} /></td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {issues.map(issue => (
                                    <span key={issue} className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs">{issue}</span>
                                  ))}
                                  {issues.length === 0 && <span className="text-xs text-white/20">Clean</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-white/30">{fmt(audit.analyzed_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* COMPETITORS */}
              {tab === 'competitors' && (
                <Card className="bg-gray-900 border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Business</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Industry</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Rating</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Reviews</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Market Score</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">First Seen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCompetitors.length === 0 ? (
                          <tr><td colSpan={6} className="py-20 text-center text-white/20">
                            <div className="flex flex-col items-center gap-3">
                              <Users className="w-12 h-12 text-white/10" />
                              <p>No competitors tracked yet</p>
                              <p className="text-xs text-white/10">Competitors are detected automatically during market scans</p>
                            </div>
                          </td></tr>
                        ) : filteredCompetitors.map(comp => (
                          <tr key={comp.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                            <td className="px-4 py-3 font-medium text-white">{comp.name || '—'}</td>
                            <td className="px-4 py-3 text-xs text-white/60 capitalize">{comp.industry || '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="text-sm font-semibold text-white">{comp.rating?.toFixed(1) || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-white/60">{comp.review_count?.toLocaleString() || '—'}</td>
                            <td className="px-4 py-3"><ScoreBadge score={comp.market_score} /></td>
                            <td className="px-4 py-3 text-xs text-white/30">{fmt(comp.first_seen)}</td>
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