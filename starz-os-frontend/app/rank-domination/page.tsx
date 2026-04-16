'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Map, TrendingUp, Star, MapPin, Search, RefreshCw,
  Loader2, AlertTriangle, BarChart3, Target, Award, Globe
} from 'lucide-react';

interface Ranking {
  id: string;
  org_id: string;
  keyword: string | null;
  position: number | null;
  url: string | null;
  checked_at: string | null;
}

interface LocalProfile {
  id: string;
  org_id: string;
  business_name: string | null;
  location: string | null;
  rating: number | null;
  reviews_count: number | null;
  created_at: string;
}

interface KeywordCluster {
  id: string;
  org_id: string;
  cluster_name: string | null;
  primary_keyword: string | null;
  secondary_keywords: any;
  created_at: string;
}

type Tab = 'rankings' | 'local' | 'clusters';

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PositionBadge({ pos }: { pos: number | null }) {
  const p = pos || 0;
  const cls = p === 0 ? 'text-white/20' :
    p <= 3 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
    p <= 10 ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
    p <= 20 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
    'bg-red-500/20 text-red-400 border-red-500/30';
  return (
    <span className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${cls}`}>
      {p ? `#${p}` : '—'}
    </span>
  );
}

function PositionBar({ pos }: { pos: number | null }) {
  const p = Math.min(pos || 100, 100);
  const pct = Math.round(((100 - p) / 99) * 100);
  const color = p <= 3 ? 'bg-green-400' : p <= 10 ? 'bg-cyan-400' : p <= 20 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-white/10 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/30 w-6 text-right">{pos || '—'}</span>
    </div>
  );
}

export default function RankDomination() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('rankings');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [profiles, setProfiles] = useState<LocalProfile[]>([]);
  const [clusters, setClusters] = useState<KeywordCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async (t: Tab) => {
    setLoading(true); setError(null);
    try {
      if (t === 'rankings') {
        const { data, error } = await supabase.schema('seo').from('rankings')
          .select('*').order('position', { ascending: true }).limit(200);
        if (error) throw error;
        setRankings((data || []) as Ranking[]);
      } else if (t === 'local') {
        const { data, error } = await supabase.schema('seo').from('local_profiles')
          .select('*').order('rating', { ascending: false }).limit(200);
        if (error) throw error;
        setProfiles((data || []) as LocalProfile[]);
      } else if (t === 'clusters') {
        const { data, error } = await supabase.schema('seo').from('keyword_clusters')
          .select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setClusters((data || []) as KeywordCluster[]);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(tab); }, [tab]);

  const top3 = rankings.filter(r => (r.position || 0) <= 3).length;
  const top10 = rankings.filter(r => (r.position || 0) <= 10).length;
  const avgPos = rankings.length ? Math.round(rankings.reduce((a, b) => a + (b.position || 0), 0) / rankings.length) : 0;
  const avgRating = profiles.length ? (profiles.reduce((a, b) => a + Number(b.rating || 0), 0) / profiles.length).toFixed(1) : '—';

  const filteredRankings = rankings.filter(r => {
    const s = search.toLowerCase();
    return !s || (r.keyword || '').toLowerCase().includes(s) || (r.url || '').toLowerCase().includes(s);
  });

  const filteredProfiles = profiles.filter(p => {
    const s = search.toLowerCase();
    return !s || (p.business_name || '').toLowerCase().includes(s) || (p.location || '').toLowerCase().includes(s);
  });

  const filteredClusters = clusters.filter(c => {
    const s = search.toLowerCase();
    return !s || (c.cluster_name || '').toLowerCase().includes(s) || (c.primary_keyword || '').toLowerCase().includes(s);
  });

  const tabs: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: 'rankings', label: 'Keyword Rankings', icon: TrendingUp, count: rankings.length },
    { id: 'local', label: 'Local Profiles', icon: MapPin, count: profiles.length },
    { id: 'clusters', label: 'Keyword Clusters', icon: Target, count: clusters.length },
  ];

  const ic = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 transition-colors";

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Map className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Rank Domination Engine</h1>
              <p className="text-sm text-white/40">Maps + Local SEO - keyword rankings, citations, local competitor analysis</p>
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
              { label: 'Total Keywords', value: rankings.length, color: 'text-white', icon: Search },
              { label: 'Top 3 Rankings', value: top3, color: 'text-green-400', icon: Award },
              { label: 'Top 10 Rankings', value: top10, color: 'text-cyan-400', icon: TrendingUp },
              { label: 'Avg Position', value: avgPos || '—', color: avgPos <= 10 ? 'text-green-400' : avgPos <= 20 ? 'text-yellow-400' : 'text-red-400', icon: BarChart3 },
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
          <div className="flex gap-1 mb-5 border-b border-white/10">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => { setTab(id); setSearch(''); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                  tab === id ? 'border-orange-500 text-orange-400' : 'border-transparent text-white/40 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />{label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${tab === id ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/40'}`}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input className={`${ic} pl-9 w-full max-w-md`} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin" />Loading rank data...
            </div>
          ) : (
            <>
              {/* RANKINGS */}
              {tab === 'rankings' && (
                <Card className="bg-gray-900 border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Keyword</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Position</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Progress</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">URL</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Checked</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRankings.length === 0 ? (
                          <tr><td colSpan={5} className="py-20 text-center text-white/20">
                            <div className="flex flex-col items-center gap-3">
                              <TrendingUp className="w-12 h-12 text-white/10" />
                              <p>No keyword rankings yet</p>
                              <p className="text-xs text-white/10">Rankings update automatically as SEO work is performed</p>
                            </div>
                          </td></tr>
                        ) : filteredRankings.map(r => (
                          <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                            <td className="px-4 py-3 font-medium text-white">{r.keyword || '—'}</td>
                            <td className="px-4 py-3"><PositionBadge pos={r.position} /></td>
                            <td className="px-4 py-3 w-32"><PositionBar pos={r.position} /></td>
                            <td className="px-4 py-3 max-w-[200px]">
                              {r.url ? (
                                <a href={r.url.startsWith('http') ? r.url : `https://${r.url}`} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-cyan-400 hover:text-cyan-300 truncate block transition-colors">
                                  {r.url.replace(/^https?:\/\//, '')}
                                </a>
                              ) : <span className="text-white/20">—</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-white/30">{fmt(r.checked_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* LOCAL PROFILES */}
              {tab === 'local' && (
                <div>
                  {profiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                      {[
                        { label: 'Total Profiles', value: profiles.length, color: 'text-white' },
                        { label: 'Avg Rating', value: avgRating, color: 'text-yellow-400' },
                        { label: 'Total Reviews', value: profiles.reduce((a, b) => a + (b.reviews_count || 0), 0).toLocaleString(), color: 'text-cyan-400' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                          <p className={`text-2xl font-bold ${color}`}>{value}</p>
                          <p className="text-xs text-white/30 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProfiles.length === 0 ? (
                      <div className="col-span-3 py-20 text-center text-white/20">
                        <div className="flex flex-col items-center gap-3">
                          <MapPin className="w-12 h-12 text-white/10" />
                          <p>No local profiles yet</p>
                          <p className="text-xs text-white/10">Local profiles are added when clients are onboarded</p>
                        </div>
                      </div>
                    ) : filteredProfiles.map(profile => (
                      <Card key={profile.id} className="bg-gray-900 border-white/10 hover:border-orange-500/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-bold text-white">{profile.business_name || '—'}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-white/30" />
                                <p className="text-xs text-white/40">{profile.location || '—'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm font-bold text-yellow-400">{Number(profile.rating || 0).toFixed(1)}</span>
                              </div>
                              <p className="text-xs text-white/30">{profile.reviews_count?.toLocaleString() || 0} reviews</p>
                            </div>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${(Number(profile.rating || 0) / 5) * 100}%` }} />
                          </div>
                          <p className="text-xs text-white/20 mt-2">Added {fmt(profile.created_at)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* KEYWORD CLUSTERS */}
              {tab === 'clusters' && (
                <div className="flex flex-col gap-4">
                  {filteredClusters.length === 0 ? (
                    <div className="py-20 text-center text-white/20">
                      <div className="flex flex-col items-center gap-3">
                        <Target className="w-12 h-12 text-white/10" />
                        <p>No keyword clusters yet</p>
                        <p className="text-xs text-white/10">Clusters are created automatically from keyword research</p>
                      </div>
                    </div>
                  ) : filteredClusters.map(cluster => {
                    const secondary = Array.isArray(cluster.secondary_keywords)
                      ? cluster.secondary_keywords
                      : typeof cluster.secondary_keywords === 'object' && cluster.secondary_keywords
                        ? Object.values(cluster.secondary_keywords)
                        : [];
                    return (
                      <Card key={cluster.id} className="bg-gray-900 border-white/10 hover:border-orange-500/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-bold text-white">{cluster.cluster_name || '—'}</p>
                              <p className="text-xs text-orange-400 mt-0.5">Primary: {cluster.primary_keyword || '—'}</p>
                            </div>
                            <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-lg">{secondary.length} secondary</span>
                          </div>
                          {secondary.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(secondary as string[]).slice(0, 8).map((kw, i) => (
                                <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/50 rounded text-xs">{kw}</span>
                              ))}
                              {secondary.length > 8 && <span className="px-2 py-0.5 text-white/20 text-xs">+{secondary.length - 8} more</span>}
                            </div>
                          )}
                          <p className="text-xs text-white/20 mt-3">Created {fmt(cluster.created_at)}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}