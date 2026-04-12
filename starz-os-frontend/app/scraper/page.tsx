'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Zap, RefreshCw, AlertCircle, Loader2, CheckCircle, XCircle, Clock, Globe, Phone, Mail, ExternalLink, ChevronUp, ChevronDown, LayoutList } from 'lucide-react';

interface ScraperRun { id: string; tenant_id: string; vendor_name: string; status: 'running' | 'completed' | 'partial' | 'failed'; rows_inserted: number | null; error_message: string | null; created_at: string; finished_at: string | null; }
interface LeadSource { id: string; business_name: string | null; phone: string | null; website: string | null; source: string | null; email: string | null; created_at: string; }
interface ScraperResponse { ok: boolean; attempted: number; run_id: string | null; source_errors: { source: string; error: string }[]; started_at: string; finished_at: string; sources_used: string[]; }
type SortField = 'business_name' | 'source' | 'phone' | 'website';
type SortDir = 'asc' | 'desc';
type BulkStatus = 'pending' | 'running' | 'done' | 'error';

const SOURCES = ['google', 'yelp', 'facebook', 'linkedin', 'yellowpages', 'bbb'];
const KEYWORDS = ['Roofing','HVAC','Plumbing','Electrical','Dental','Legal / Law Firm','Chiropractic','Real Estate','Insurance','Auto Repair','Landscaping','Pest Control','Moving Company','Painting','Flooring','Solar','Accounting / CPA','Med Spa','Gym / Fitness','Restaurant','Home Remodeling','Garage Door','Pool Service','Tree Service','Carpet Cleaning'];
const SOURCE_COLORS: Record<string, string> = { google:'bg-blue-500/20 text-blue-400 border-blue-500/30', yelp:'bg-red-500/20 text-red-400 border-red-500/30', facebook:'bg-blue-600/20 text-blue-300 border-blue-600/30', linkedin:'bg-sky-500/20 text-sky-400 border-sky-500/30', yellowpages:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', bbb:'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };

function fmt(d: string | null) { if (!d) return '-'; return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function elapsed(start: string, end: string | null) { const s = new Date(start).getTime(); const e = end ? new Date(end).getTime() : Date.now(); const sec = Math.round((e - s) / 1000); if (sec < 60) return `${sec}s`; return `${Math.floor(sec / 60)}m ${sec % 60}s`; }
function uuidv4() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }); }

function StatusBadge({ status }: { status: ScraperRun['status'] }) {
  const map = { running:{cls:'bg-yellow-500/20 text-yellow-400',icon:<Loader2 className="w-3 h-3 animate-spin"/>,label:'Running'}, completed:{cls:'bg-green-500/20 text-green-400',icon:<CheckCircle className="w-3 h-3"/>,label:'Complete'}, partial:{cls:'bg-orange-500/20 text-orange-400',icon:<AlertCircle className="w-3 h-3"/>,label:'Partial'}, failed:{cls:'bg-red-500/20 text-red-400',icon:<XCircle className="w-3 h-3"/>,label:'Failed'} };
  const m = map[status] || map.failed;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${m.cls}`}>{m.icon}{m.label}</span>;
}

export default function ScraperEngine() {
  const supabase = createClient();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [campaignId] = useState(() => { if (typeof window !== 'undefined') { const s = sessionStorage.getItem('scraper_campaign_id'); if (s) return s; const n = uuidv4(); sessionStorage.setItem('scraper_campaign_id', n); return n; } return uuidv4(); });
  const [campaignName, setCampaignName] = useState('');
  const [tenantId, setTenantId] = useState('00000000-0000-0000-0000-000000000301');
  const [keyword, setKeyword] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [sources, setSources] = useState<string[]>(['google', 'yelp']);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ScraperResponse | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [runLoading, setRunLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [leads, setLeads] = useState<LeadSource[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('business_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [bulkKeywords, setBulkKeywords] = useState<string[]>([]);
  const [bulkLocation, setBulkLocation] = useState('');
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ keyword: string; status: BulkStatus; rows?: number }[]>([]);
  const [bulkDone, setBulkDone] = useState(0);

  const loadRuns = useCallback(async (runId?: string) => {
    setRunLoading(true);
    let q = supabase.from('scraper_runs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(20);
    if (runId) q = (q as any).eq('id', runId);
    const { data } = await q;
    if (data) setRuns(prev => { const merged = [...(data as ScraperRun[])]; prev.forEach(p => { if (!merged.find(m => m.id === p.id)) merged.push(p); }); return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); });
    setRunLoading(false);
  }, [tenantId]);

  const loadLeads = useCallback(async () => {
    if (!tenantId) return;
    setLeadsLoading(true);
    const { data } = await supabase.from('lead_sources').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(500);
    if (data) setLeads(data as LeadSource[]);
    setLeadsLoading(false);
  }, [campaignId, tenantId]);

  useEffect(() => { loadLeads(); }, [campaignId, tenantId]);

  useEffect(() => {
    if (!activeRunId) return;
    if (pollRef.current) clearInterval(pollRef.current);
    const activeRun = runs.find(r => r.id === activeRunId);
    if (activeRun && ['completed', 'failed', 'partial'].includes(activeRun.status)) return;
    pollRef.current = setInterval(async () => {
      await loadRuns(activeRunId);
      setRuns(prev => { const active = prev.find(r => r.id === activeRunId); if (active && ['completed', 'failed', 'partial'].includes(active.status)) { clearInterval(pollRef.current!); pollRef.current = null; loadLeads(); } return prev; });
    }, 2500);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [activeRunId]);

  async function callScraper(kw: string, loc: string, cid: string) {
    const { data: auth } = await supabase.auth.getSession();
    const token = auth.session?.access_token;
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/unified-scraper-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ campaign_id: cid, tenant_id: tenantId, keyword: kw, location: loc, sources }),
    });
    const payload: ScraperResponse = await res.json();
    if (!res.ok) throw new Error((payload as any)?.error ?? 'Scrape failed');
    return payload;
  }

  async function handleScrape(attempt = 0) {
    const effectiveKeyword = keyword === '__custom' ? customKeyword : keyword;
    if (!effectiveKeyword || !location || !tenantId) { setRunError('Fill in keyword and location before scraping.'); return; }
    setRunning(true); setRunError(null); setLastResponse(null);
    try {
      const payload = await callScraper(effectiveKeyword, location, campaignId);
      setLastResponse(payload);
      if (payload.run_id) { setActiveRunId(payload.run_id); loadRuns(payload.run_id); }
      setRetryCount(0);
    } catch (e: any) {
      if (attempt < 2) { setRetryCount(attempt + 1); setTimeout(() => handleScrape(attempt + 1), 2000 * (attempt + 1)); }
      else { setRunError(e.message || 'Unknown error'); setRetryCount(0); }
    }
    setRunning(false);
  }

  async function handleBulkScrape() {
    if (!bulkKeywords.length || !bulkLocation || !tenantId) { setRunError('Select at least one keyword and enter a location.'); return; }
    setBulkRunning(true); setBulkDone(0); setRunError(null);
    const progress = bulkKeywords.map(k => ({ keyword: k, status: 'pending' as BulkStatus }));
    setBulkProgress(progress);
    for (let i = 0; i < bulkKeywords.length; i++) {
      const kw = bulkKeywords[i];
      setBulkProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'running' } : p));
      try {
        const cid = uuidv4();
        const payload = await callScraper(kw, bulkLocation, cid);
        const rows = payload.sources_used.length * 5;
        setBulkProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done', rows } : p));
        if (payload.run_id) loadRuns(payload.run_id);
      } catch {
        setBulkProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error' } : p));
      }
      setBulkDone(i + 1);
      await new Promise(r => setTimeout(r, 1000));
    }
    setBulkRunning(false);
    loadLeads();
    loadRuns();
  }

  const effectiveKeyword = keyword === '__custom' ? customKeyword : keyword;
  const displayedLeads = leads.filter(l => sourceFilter === 'all' || l.source === sourceFilter).sort((a, b) => { const va = (a[sortField] ?? '').toLowerCase(); const vb = (b[sortField] ?? '').toLowerCase(); return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); });
  function toggleSort(f: SortField) { if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(f); setSortDir('asc'); } }
  const uniqueSources = [...new Set(leads.map(l => l.source).filter(Boolean))] as string[];
  const ic = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors";

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Unified Scraper Engine</h1>
              <p className="text-sm text-white/40">One engine to rule them all â€” multi-source lead acquisition</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => { setMode('single'); setRunError(null); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${mode === 'single' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-white/5 text-white/30 border-white/10 hover:border-white/20'}`}>Single</button>
              <button onClick={() => { setMode('bulk'); setRunError(null); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${mode === 'bulk' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-white/5 text-white/30 border-white/10 hover:border-white/20'}`}>Bulk Scrape</button>
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">v2.0</Badge>
            </div>
          </div>

          <div className="grid grid-cols-[360px_1fr] gap-6 items-start">
            <div className="flex flex-col gap-4">

              {mode === 'single' ? (
                <Card className="bg-gray-900 border-white/10">
                  <CardHeader className="pb-3"><CardTitle className="text-xs font-medium text-white/40 uppercase tracking-wider">Target Parameters</CardTitle></CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Campaign Name</label>
                      <input className={ic} value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. Miami Roofers Q2 2025" />
                      <p className="text-xs text-white/20 mt-1">ID: {campaignId.slice(0, 18)}...</p>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Tenant ID</label>
                      <input className={ic} value={tenantId} onChange={e => setTenantId(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Keyword / Niche</label>
                      <select className={ic} value={keyword} onChange={e => setKeyword(e.target.value)} style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}>
                        <option value="">Select niche...</option>
                        {KEYWORDS.map(k => <option key={k} value={k}>{k}</option>)}
                        <option value="__custom">+ Custom keyword</option>
                      </select>
                      {keyword === '__custom' && <input className={`${ic} mt-2`} value={customKeyword} onChange={e => setCustomKeyword(e.target.value)} placeholder="Enter custom keyword..." />}
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Location</label>
                      <input className={ic} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Miami FL, Chicago IL..." />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Sources</label>
                      <div className="flex flex-wrap gap-2">
                        {SOURCES.map(s => (
                          <button key={s} onClick={() => setSources(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${sources.includes(s) ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-white/5 text-white/30 border-white/10 hover:border-white/20'}`}>
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-white/20 mt-1.5">{sources.length} source{sources.length !== 1 ? 's' : ''} selected</p>
                    </div>
                    {runError && <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{runError}</div>}
                    {retryCount > 0 && <p className="text-xs text-yellow-400 text-center">Retrying... attempt {retryCount}/2</p>}
                    <button onClick={() => handleScrape(0)} disabled={running} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${running ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10' : 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-gray-950 hover:from-cyan-400 hover:to-cyan-300 shadow-lg shadow-cyan-500/20'}`}>
                      {running ? <><Loader2 className="w-4 h-4 animate-spin" />Scraping...</> : <><Zap className="w-4 h-4" />Launch Scraper</>}
                    </button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-900 border-white/10">
                  <CardHeader className="pb-3"><CardTitle className="text-xs font-medium text-white/40 uppercase tracking-wider">Bulk Scrape Parameters</CardTitle></CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Select Niches ({bulkKeywords.length} selected)</label>
                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {KEYWORDS.map(k => (
                          <button key={k} onClick={() => setBulkKeywords(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k])}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${bulkKeywords.includes(k) ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-white/5 text-white/30 border-white/10 hover:border-white/20'}`}>
                            {k}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setBulkKeywords(KEYWORDS)} className="text-xs text-cyan-400 hover:text-cyan-300">Select All</button>
                        <span className="text-white/20">Â·</span>
                        <button onClick={() => setBulkKeywords([])} className="text-xs text-white/40 hover:text-white/60">Clear</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Location</label>
                      <input className={ic} value={bulkLocation} onChange={e => setBulkLocation(e.target.value)} placeholder="e.g. Miami FL, Chicago IL..." />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Sources</label>
                      <div className="flex flex-wrap gap-2">
                        {SOURCES.map(s => (
                          <button key={s} onClick={() => setSources(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${sources.includes(s) ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-white/5 text-white/30 border-white/10 hover:border-white/20'}`}>
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    {runError && <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{runError}</div>}

                    {bulkProgress.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-white/40 uppercase tracking-wider">Progress</p>
                          <p className="text-xs text-cyan-400">{bulkDone}/{bulkKeywords.length}</p>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                          <div className="bg-cyan-400 h-1.5 rounded-full transition-all" style={{ width: `${(bulkDone / bulkKeywords.length) * 100}%` }} />
                        </div>
                        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                          {bulkProgress.map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-white/60 truncate">{p.keyword}</span>
                              <span className={p.status === 'done' ? 'text-green-400' : p.status === 'error' ? 'text-red-400' : p.status === 'running' ? 'text-yellow-400' : 'text-white/20'}>
                                {p.status === 'done' ? `+${p.rows || 0} leads` : p.status === 'error' ? 'error' : p.status === 'running' ? 'scraping...' : 'pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button onClick={handleBulkScrape} disabled={bulkRunning || !bulkKeywords.length || !bulkLocation}
                      className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${bulkRunning || !bulkKeywords.length || !bulkLocation ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10' : 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-gray-950 hover:from-cyan-400 hover:to-cyan-300 shadow-lg shadow-cyan-500/20'}`}>
                      {bulkRunning ? <><Loader2 className="w-4 h-4 animate-spin" />Bulk Scraping {bulkDone}/{bulkKeywords.length}...</> : <><Zap className="w-4 h-4" />Launch Bulk Scrape ({bulkKeywords.length} niches)</>}
                    </button>
                  </CardContent>
                </Card>
              )}

              {lastResponse && mode === 'single' && (
                <Card className="bg-gray-900 border-cyan-500/20">
                  <CardHeader className="pb-2"><CardTitle className="text-xs text-cyan-400 uppercase tracking-wider">Last Run Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[{ label:'Attempted', value:lastResponse.attempted },{ label:'Sources Used', value:lastResponse.sources_used?.length ?? 0 },{ label:'Started', value:fmt(lastResponse.started_at) },{ label:'Finished', value:fmt(lastResponse.finished_at) }].map(({ label, value }) => (
                        <div key={label} className="bg-white/5 rounded-lg p-2"><p className="text-xs text-white/30 mb-0.5">{label}</p><p className="text-sm font-bold text-white">{value}</p></div>
                      ))}
                    </div>
                    {lastResponse.source_errors?.length > 0 && (
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-xs text-red-400 uppercase tracking-wider mb-2">Source Errors</p>
                        {lastResponse.source_errors.map(e => <p key={e.source} className="text-xs text-red-400 mb-1"><span className="text-white/40">{e.source.toUpperCase()}</span> - {e.error}</p>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <Card className="bg-gray-900 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs text-white/40 uppercase tracking-wider mb-1">Run Telemetry</p><CardTitle className="text-base font-bold text-white">Scrape History</CardTitle></div>
                    <button onClick={() => loadRuns()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white hover:border-white/20 transition-all">
                      <RefreshCw className={`w-3 h-3 ${runLoading ? 'animate-spin' : ''}`} />Refresh
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {runs.length === 0 ? <div className="text-center text-white/20 text-sm py-10">No runs yet. Launch a scrape to see telemetry.</div> : (
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                      {runs.map(run => (
                        <div key={run.id} onClick={() => setActiveRunId(run.id)} className={`rounded-xl p-3 cursor-pointer border transition-all ${activeRunId === run.id ? 'bg-white/5 border-white/15' : 'bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/10'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2"><StatusBadge status={run.status} /><span className="text-xs text-white/40">{run.vendor_name || 'multi-source'}</span></div>
                            <div className="flex items-center gap-1 text-xs text-white/30"><Clock className="w-3 h-3" />{elapsed(run.created_at, run.finished_at)}</div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-white/30">
                            <span>Rows: <span className={run.rows_inserted ? 'text-cyan-400' : 'text-white/20'}>{run.rows_inserted ?? 0}</span></span>
                            <span>{fmt(run.created_at)}</span>
                          </div>
                          {run.error_message && <div className="mt-2 text-xs text-red-400 bg-red-500/10 border-l-2 border-red-500 rounded px-2 py-1">{run.error_message}</div>}
                          <p className="mt-1 text-[10px] text-white/15 font-mono truncate">{run.id}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Lead Results</p>
                      <CardTitle className="text-base font-bold text-white">
                        {leadsLoading ? 'Loading...' : `${displayedLeads.length} lead${displayedLeads.length !== 1 ? 's' : ''}`}
                        {sourceFilter !== 'all' && <span className="text-sm text-cyan-400 ml-2">({sourceFilter})</span>}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {['all', ...uniqueSources].map(s => (
                        <button key={s} onClick={() => setSourceFilter(s)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${sourceFilter === s ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' : 'bg-white/5 text-white/30 border-white/10 hover:border-white/20'}`}>{s.toUpperCase()}</button>
                      ))}
                      <button onClick={loadLeads} className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                        <RefreshCw className={`w-3.5 h-3.5 ${leadsLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {leadsLoading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-white/40 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading leads...</div>
                  ) : displayedLeads.length === 0 ? (
                    <div className="text-center text-white/20 text-sm py-10 flex flex-col items-center gap-2"><Search className="w-8 h-8 text-white/10" />Run a scrape to populate lead results</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            {([{ label:'Business', field:'business_name' },{ label:'Source', field:'source' },{ label:'Phone', field:'phone' },{ label:'Website', field:'website' }] as { label: string; field: SortField }[]).map(({ label, field }) => (
                              <th key={field} onClick={() => toggleSort(field)} className="px-3 py-2 text-left text-xs text-white/30 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors select-none">
                                <span className="flex items-center gap-1">{label}{sortField === field ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-cyan-400" /> : <ChevronDown className="w-3 h-3 text-cyan-400" />) : null}</span>
                              </th>
                            ))}
                            <th className="px-3 py-2 text-left text-xs text-white/30 uppercase tracking-wider">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedLeads.map(lead => (
                            <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                              <td className="px-3 py-2.5 font-medium text-white max-w-[200px] truncate">{lead.business_name || '-'}</td>
                              <td className="px-3 py-2.5">{lead.source ? <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${SOURCE_COLORS[lead.source] || 'bg-white/10 text-white/40 border-white/20'}`}>{lead.source.toUpperCase()}</span> : '-'}</td>
                              <td className="px-3 py-2.5">{lead.phone ? <span className="flex items-center gap-1 text-white/60 text-xs"><Phone className="w-3 h-3" />{lead.phone}</span> : <span className="text-white/20">-</span>}</td>
                              <td className="px-3 py-2.5 max-w-[180px] truncate">{lead.website ? <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs transition-colors" onClick={e => e.stopPropagation()}><Globe className="w-3 h-3 shrink-0" /><span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span><ExternalLink className="w-3 h-3 shrink-0" /></a> : <span className="text-white/20">-</span>}</td>
                              <td className="px-3 py-2.5">{lead.email ? <span className="flex items-center gap-1 text-white/50 text-xs"><Mail className="w-3 h-3" />{lead.email}</span> : <span className="text-white/20">-</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}