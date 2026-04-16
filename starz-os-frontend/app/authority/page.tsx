'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Zap, Link, Shield, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Loader2, TrendingUp, Globe, ChevronRight,
  BarChart3, Activity, Clock, Search, Filter
} from 'lucide-react';

interface Project {
  id: string;
  org_id: string;
  client_name: string | null;
  domain: string | null;
  industry: string | null;
  created_at: string;
}

interface Score {
  id: string;
  project_id: string;
  backlink_score: number | null;
  brand_score: number | null;
  review_score: number | null;
  content_score: number | null;
  technical_score: number | null;
  total_score: number | null;
  created_at: string;
}

interface Backlink {
  id: string;
  project_id: string;
  source_url: string | null;
  target_url: string | null;
  domain_authority: number | null;
  anchor_text: string | null;
  type: string | null;
  status: string | null;
  discovered_at: string | null;
  created_at: string;
}

interface Competitor {
  id: string;
  project_id: string;
  competitor_domain: string | null;
  label: string | null;
  created_at: string;
}

interface AutomationRun {
  id: string;
  project_id: string;
  run_type: string | null;
  status: string | null;
  details: any;
  created_at: string;
  retry_count: number | null;
  last_error: string | null;
}

type Tab = 'overview' | 'backlinks' | 'competitors' | 'automation';

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const pct = Math.min(score, 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{score}</span>
      </div>
      <p className="text-xs text-white/40 text-center">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    live: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    toxic: 'bg-red-500/20 text-red-400 border-red-500/30',
    lost: 'bg-red-500/20 text-red-400 border-red-500/30',
    new: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  const cls = map[(status || '').toLowerCase()] || 'bg-white/10 text-white/40 border-white/20';
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold border capitalize ${cls}`}>{status || 'â€”'}</span>;
}

function fmt(d: string | null) {
  if (!d) return 'â€”';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AuthorityEngine() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadProjects = useCallback(async () => {
    const { data, error: projError } = await supabase.schema('authority').from('projects')
      .select('*').order('created_at', { ascending: false }).limit(50);
    console.log('projects:', data, projError);
    if (data?.length) {
      setProjects(data as Project[]);
      setSelectedProject(data[0] as Project);
    } else {
      setLoading(false);
    }
  }, []);

  const loadProjectData = useCallback(async (projectId: string) => {
    setLoading(true); setError(null);
    try {
      const [sc, bl, comp, ar] = await Promise.all([
        supabase.schema('authority').from('scores').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1),
        supabase.schema('authority').from('backlinks').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(100),
        supabase.schema('authority').from('competitors').select('*').eq('project_id', projectId),
        supabase.schema('authority').from('automation_runs').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(50),
      ]);
      setScores((sc.data || []) as Score[]);
      setBacklinks((bl.data || []) as Backlink[]);
      setCompetitors((comp.data || []) as Competitor[]);
      setRuns((ar.data || []) as AutomationRun[]);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (selectedProject) loadProjectData(selectedProject.id); }, [selectedProject]);

  const latestScore = scores[0];
  const filteredBacklinks = backlinks.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const s = search.toLowerCase();
    const matchSearch = !s || (b.source_url || '').toLowerCase().includes(s) || (b.anchor_text || '').toLowerCase().includes(s);
    return matchStatus && matchSearch;
  });

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Authority Overview', icon: BarChart3 },
    { id: 'backlinks', label: 'Backlinks', icon: Link, count: backlinks.length },
    { id: 'competitors', label: 'Competitors', icon: Shield, count: competitors.length },
    { id: 'automation', label: 'Automation Runs', icon: Activity, count: runs.length },
  ];

  const ic = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors";

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Authority Engine</h1>
              <p className="text-sm text-white/40">Backlinks + Trust Building â€” automated domain authority system</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {projects.length > 0 && (
                <select value={selectedProject?.id || ''} onChange={e => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}
                  className={ic} style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.client_name} â€” {p.domain}</option>)}
                </select>
              )}
              <button onClick={() => selectedProject && loadProjectData(selectedProject.id)}
                className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Score Cards */}
          {latestScore && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
              {[
                { label: 'Total Score', value: Math.round(latestScore.total_score || 0), color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                { label: 'Backlinks', value: Math.round(latestScore.backlink_score || 0), color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                { label: 'Brand', value: Math.round(latestScore.brand_score || 0), color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                { label: 'Reviews', value: Math.round(latestScore.review_score || 0), color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                { label: 'Content', value: Math.round(latestScore.content_score || 0), color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                { label: 'Technical', value: Math.round(latestScore.technical_score || 0), color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
              ].map(({ label, value, color, bg }) => (
                <Card key={label} className={`border ${bg}`}>
                  <CardContent className="p-3 text-center">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-white/30 mt-0.5">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Project Info */}
          {selectedProject && (
            <div className="bg-gray-900 border border-white/10 rounded-xl p-4 mb-5 flex items-center gap-6">
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Client</p>
                <p className="font-bold text-white">{selectedProject.client_name}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Domain</p>
                <p className="text-cyan-400 font-medium">{selectedProject.domain}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Industry</p>
                <p className="text-white/60 capitalize">{selectedProject.industry}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Created</p>
                <p className="text-white/60">{fmt(selectedProject.created_at)}</p>
              </div>
              <div className="ml-auto flex items-center gap-4 text-sm text-white/40">
                <span><span className="text-white font-semibold">{backlinks.length}</span> backlinks</span>
                <span><span className="text-white font-semibold">{competitors.length}</span> competitors</span>
                <span><span className="text-white font-semibold">{runs.length}</span> runs</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-white/10">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                  tab === id ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/40 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {count !== undefined && count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${tab === id ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/40'}`}>
                    {count}
                  </span>
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
              <Loader2 className="w-5 h-5 animate-spin" />Loading authority data...
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card className="bg-gray-900 border-white/10">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-white/70">Authority Score Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      {latestScore ? (
                        <div className="flex items-center justify-around py-4">
                          <ScoreRing score={Math.round(latestScore.backlink_score || 0)} label="Backlinks" color="#22d3ee" />
                          <ScoreRing score={Math.round(latestScore.brand_score || 0)} label="Brand" color="#60a5fa" />
                          <ScoreRing score={Math.round(latestScore.review_score || 0)} label="Reviews" color="#4ade80" />
                          <ScoreRing score={Math.round(latestScore.content_score || 0)} label="Content" color="#facc15" />
                          <ScoreRing score={Math.round(latestScore.technical_score || 0)} label="Technical" color="#f472b6" />
                        </div>
                      ) : (
                        <p className="text-center text-white/20 py-8">No score data yet</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-white/10">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-white/70">Recent Automation Runs</CardTitle></CardHeader>
                    <CardContent>
                      {runs.length === 0 ? (
                        <p className="text-center text-white/20 py-8">No automation runs yet</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {runs.slice(0, 6).map(run => (
                            <div key={run.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                              <div>
                                <p className="text-sm text-white capitalize">{run.run_type || 'auto'}</p>
                                <p className="text-xs text-white/30">{fmt(run.created_at)}</p>
                              </div>
                              <StatusPill status={run.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-white/10">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-white/70">Backlink Summary</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Total', value: backlinks.length, color: 'text-white' },
                          { label: 'Active', value: backlinks.filter(b => b.status === 'active' || b.status === 'live').length, color: 'text-green-400' },
                          { label: 'Lost/Toxic', value: backlinks.filter(b => b.status === 'lost' || b.status === 'toxic').length, color: 'text-red-400' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-white/30 mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-white/30 mb-2">By Type</p>
                        {['dofollow', 'nofollow', 'sponsored'].map(type => {
                          const count = backlinks.filter(b => b.type === type).length;
                          const pct = backlinks.length ? Math.round((count / backlinks.length) * 100) : 0;
                          return (
                            <div key={type} className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs text-white/40 w-20 capitalize">{type}</span>
                              <div className="flex-1 bg-white/10 rounded-full h-1.5">
                                <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-white/40 w-8 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900 border-white/10">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-white/70">Competitors</CardTitle></CardHeader>
                    <CardContent>
                      {competitors.length === 0 ? (
                        <p className="text-center text-white/20 py-8">No competitors tracked</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {competitors.map(comp => (
                            <div key={comp.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-sm text-white">{comp.competitor_domain}</span>
                              </div>
                              {comp.label && <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">{comp.label}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* BACKLINKS */}
              {tab === 'backlinks' && (
                <div>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="relative flex-1 min-w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input className={`${ic} pl-9 w-full`} placeholder="Search URL or anchor text..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className={ic} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                      style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}>
                      <option value="all">All Statuses</option>
                      {['active', 'live', 'lost', 'toxic', 'pending', 'new'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className="flex items-center text-xs text-white/30 px-2">{filteredBacklinks.length} links</span>
                  </div>
                  <Card className="bg-gray-900 border-white/10">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Source URL</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Anchor</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">DA</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Discovered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBacklinks.length === 0 ? (
                            <tr><td colSpan={6} className="py-20 text-center text-white/20">No backlinks found</td></tr>
                          ) : filteredBacklinks.map(bl => (
                            <tr key={bl.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                              <td className="px-4 py-3 max-w-[200px] truncate">
                                <a href={bl.source_url?.startsWith('http') ? bl.source_url : `https://${bl.source_url}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 text-xs transition-colors">
                                  {bl.source_url?.replace(/^https?:\/\//, '') || 'â€”'}
                                </a>
                              </td>
                              <td className="px-4 py-3 text-xs text-white/60 max-w-[150px] truncate">{bl.anchor_text || 'â€”'}</td>
                              <td className="px-4 py-3">
                                <span className={`text-sm font-bold ${(bl.domain_authority || 0) >= 50 ? 'text-green-400' : (bl.domain_authority || 0) >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {bl.domain_authority ?? 'â€”'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-white/40 capitalize">{bl.type || 'â€”'}</td>
                              <td className="px-4 py-3"><StatusPill status={bl.status} /></td>
                              <td className="px-4 py-3 text-xs text-white/30">{fmt(bl.discovered_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* COMPETITORS */}
              {tab === 'competitors' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {competitors.length === 0 ? (
                    <div className="col-span-3 py-20 text-center text-white/20">No competitors tracked for this project</div>
                  ) : competitors.map(comp => (
                    <Card key={comp.id} className="bg-gray-900 border-white/10 hover:border-purple-500/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                              <Globe className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{comp.competitor_domain}</p>
                              {comp.label && <p className="text-xs text-white/40">{comp.label}</p>}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/30">Added {fmt(comp.created_at)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* AUTOMATION RUNS */}
              {tab === 'automation' && (
                <Card className="bg-gray-900 border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Run Type</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Retries</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Error</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runs.length === 0 ? (
                          <tr><td colSpan={5} className="py-20 text-center text-white/20">No automation runs yet</td></tr>
                        ) : runs.map(run => (
                          <tr key={run.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                            <td className="px-4 py-3 text-sm text-white capitalize">{run.run_type || 'â€”'}</td>
                            <td className="px-4 py-3"><StatusPill status={run.status} /></td>
                            <td className="px-4 py-3 text-xs text-white/40">{run.retry_count ?? 0}</td>
                            <td className="px-4 py-3 text-xs text-red-400 max-w-[300px] truncate">{run.last_error || 'â€”'}</td>
                            <td className="px-4 py-3 text-xs text-white/30">{fmt(run.created_at)}</td>
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