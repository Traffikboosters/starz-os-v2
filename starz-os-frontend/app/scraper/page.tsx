'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ScraperRun {
  id: string;
  tenant_id: string;
  vendor_name: string;
  status: 'running' | 'completed' | 'partial' | 'failed';
  rows_inserted: number | null;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
}

interface LeadSource {
  id: string;
  business_name: string | null;
  phone: string | null;
  website: string | null;
  source: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
}

interface ScraperResponse {
  ok: boolean;
  attempted: number;
  run_id: string | null;
  source_errors: { source: string; error: string }[];
  started_at: string;
  finished_at: string;
  sources_used: string[];
}

type SortField = 'business_name' | 'source' | 'phone' | 'website';
type SortDir = 'asc' | 'desc';

const SOURCES = ['google', 'yelp', 'facebook', 'linkedin', 'yellowpages', 'bbb'];
const SOURCE_COLORS: Record<string, string> = {
  google: '#4285F4', yelp: '#FF1A1A', facebook: '#1877F2',
  linkedin: '#0A66C2', yellowpages: '#FFD700', bbb: '#005B99',
};

function fmt(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function elapsed(start: string, end: string | null) {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const sec = Math.round((e - s) / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function StatusPill({ status }: { status: ScraperRun['status'] }) {
  const map = {
    running:   { bg: 'rgba(251,191,36,0.15)',  color: '#FBBF24', label: 'RUNNING',  dot: true },
    completed: { bg: 'rgba(52,211,153,0.15)',  color: '#34D399', label: 'COMPLETE', dot: false },
    partial:   { bg: 'rgba(251,146,60,0.15)',  color: '#FB923C', label: 'PARTIAL',  dot: false },
    failed:    { bg: 'rgba(248,113,113,0.15)', color: '#F87171', label: 'FAILED',   dot: false },
  };
  const m = map[status] || map.failed;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: m.bg, color: m.color,
      fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
      padding: '3px 8px', borderRadius: 4,
      border: `1px solid ${m.color}30`,
    }}>
      {m.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />}
      {m.label}
    </span>
  );
}

export default function ScraperEngine() {
  const supabase = createClient();
  const [campaignId, setCampaignId] = useState('');
  const [tenantId, setTenantId] = useState('00000000-0000-0000-0000-000000000301');
  const [keyword, setKeyword] = useState('');
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
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from('campaigns').select('id, name').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setCampaigns(data); });
  }, []);

  const loadRuns = useCallback(async (runId?: string) => {
    setRunLoading(true);
    let q = supabase.from('scraper_runs').select('*').eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }).limit(20);
    if (runId) q = q.eq('id', runId);
    const { data } = await q;
    if (data) setRuns(prev => {
      const merged = [...(data as ScraperRun[])];
      prev.forEach(p => { if (!merged.find(m => m.id === p.id)) merged.push(p); });
      return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });
    setRunLoading(false);
  }, [tenantId]);

  useEffect(() => {
    if (activeRunId) {
      pollRef.current = setInterval(() => {
        loadRuns(activeRunId);
        const active = runs.find(r => r.id === activeRunId);
        if (active && ['completed', 'failed', 'partial'].includes(active.status)) {
          clearInterval(pollRef.current!);
          loadLeads();
        }
      }, 2500);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeRunId, runs]);

  const loadLeads = useCallback(async () => {
    if (!campaignId || !tenantId) return;
    setLeadsLoading(true);
    const { data } = await supabase.from('lead_sources').select('*')
      .eq('tenant_id', tenantId).eq('campaign_id', campaignId)
      .order('created_at', { ascending: false }).limit(500);
    if (data) setLeads(data as LeadSource[]);
    setLeadsLoading(false);
  }, [campaignId, tenantId]);

  useEffect(() => { loadLeads(); }, [campaignId, tenantId]);

  async function handleScrape(attempt = 0) {
    if (!keyword || !location || !campaignId || !tenantId) {
      setRunError('Fill in all fields before scraping.'); return;
    }
    setRunning(true); setRunError(null); setLastResponse(null);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/unified-scraper-engine`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ campaign_id: campaignId, tenant_id: tenantId, keyword, location, sources }),
        }
      );
      const payload: ScraperResponse = await res.json();
      if (!res.ok) throw new Error((payload as any)?.error ?? 'Scrape failed');
      setLastResponse(payload);
      if (payload.run_id) { setActiveRunId(payload.run_id); loadRuns(payload.run_id); }
      setRetryCount(0);
    } catch (e: any) {
      if (attempt < 2) {
        setRetryCount(attempt + 1);
        setTimeout(() => handleScrape(attempt + 1), 2000 * (attempt + 1));
      } else {
        setRunError(e.message || 'Unknown error'); setRetryCount(0);
      }
    }
    setRunning(false);
  }

  const displayedLeads = leads
    .filter(l => sourceFilter === 'all' || l.source === sourceFilter)
    .sort((a, b) => {
      const va = (a[sortField] ?? '').toLowerCase();
      const vb = (b[sortField] ?? '').toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  function toggleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
  }

  const uniqueSources = [...new Set(leads.map(l => l.source).filter(Boolean))] as string[];

  return (
    <div style={{ minHeight: '100vh', background: '#080910', color: '#e2e0da', fontFamily: '"DM Mono", "Fira Code", monospace' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .si { width:100%; background:#0e0f1a; border:1px solid #1e2035; border-radius:6px; color:#e2e0da; padding:10px 14px; font-size:13px; font-family:inherit; outline:none; box-sizing:border-box; transition:border-color .2s; }
        .si:focus { border-color:#5DCAA5; }
        .si::placeholder { color:#3a3c55; }
        .sc { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:4px; border:1px solid #1e2035; cursor:pointer; font-size:11px; font-weight:700; letter-spacing:1px; transition:all .15s; user-select:none; }
        .sc.on { background:rgba(93,202,165,0.12); border-color:#5DCAA5; color:#5DCAA5; }
        .sc:not(.on) { background:#0e0f1a; color:#3a3c55; }
        .sth { cursor:pointer; user-select:none; }
        .sth:hover { color:#5DCAA5; }
        .lr:hover td { background:#0e0f1a !important; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#0e0f1a; }
        ::-webkit-scrollbar-thumb { background:#1e2035; border-radius:2px; }
      `}</style>

      <div style={{ background:'#0a0b14', borderBottom:'1px solid #12141f', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#5DCAA5', boxShadow:'0 0 8px #5DCAA5' }} />
            <span style={{ color:'#5DCAA5', fontWeight:700, fontSize:11, letterSpacing:3 }}>STARZ-OS</span>
          </div>
          <span style={{ color:'#1e2035' }}>|</span>
          <span style={{ color:'#555', fontSize:12, letterSpacing:1 }}>UNIFIED SCRAPER ENGINE</span>
          <span style={{ background:'rgba(93,202,165,0.1)', color:'#5DCAA5', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, letterSpacing:2, border:'1px solid rgba(93,202,165,0.2)' }}>v2.0</span>
        </div>
        <span style={{ fontSize:10, color:'#2a2c45', letterSpacing:1 }}>ONE ENGINE TO RULE THEM ALL</span>
      </div>

      <div style={{ padding:'32px', maxWidth:1400, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'380px 1fr', gap:24, alignItems:'start' }}>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'#0a0b14', border:'1px solid #12141f', borderRadius:10, padding:'20px 24px' }}>
              <div style={{ fontSize:10, color:'#3a3c55', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Target Parameters</div>
              <h1 style={{ fontSize:20, fontWeight:700, margin:'0 0 2px', color:'#e2e0da' }}>Scrape Engine</h1>
              <p style={{ fontSize:12, color:'#3a3c55', margin:0 }}>Configure and launch multi-source lead acquisition</p>
            </div>

            <div style={{ background:'#0a0b14', border:'1px solid #12141f', borderRadius:10, padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:10, color:'#3a3c55', letterSpacing:1.5, textTransform:'uppercase', display:'block', marginBottom:6 }}>Campaign</label>
                <select className="si" value={campaignId} onChange={e => setCampaignId(e.target.value)} style={{ appearance:'none' }}>
                  <option value="">Select campaign...</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="manual">Enter manually</option>
                </select>
                {campaignId === 'manual' && (
                  <input className="si" style={{ marginTop:6 }} placeholder="Campaign UUID" onChange={e => setCampaignId(e.target.value)} />
                )}
              </div>

              <div>
                <label style={{ fontSize:10, color:'#3a3c55', letterSpacing:1.5, textTransform:'uppercase', display:'block', marginBottom:6 }}>Tenant ID</label>
                <input className="si" value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="Tenant UUID" />
              </div>

              <div>
                <label style={{ fontSize:10, color:'#3a3c55', letterSpacing:1.5, textTransform:'uppercase', display:'block', marginBottom:6 }}>Keyword</label>
                <input className="si" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. plumbers, dentists, roofing..." />
              </div>

              <div>
                <label style={{ fontSize:10, color:'#3a3c55', letterSpacing:1.5, textTransform:'uppercase', display:'block', marginBottom:6 }}>Location</label>
                <input className="si" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Miami FL, Chicago IL..." />
              </div>

              <div>
                <label style={{ fontSize:10, color:'#3a3c55', letterSpacing:1.5, textTransform:'uppercase', display:'block', marginBottom:8 }}>Sources</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {SOURCES.map(s => (
                    <span key={s} className={`sc ${sources.includes(s) ? 'on' : ''}`}
                      onClick={() => setSources(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background: sources.includes(s) ? SOURCE_COLORS[s] : '#2a2c45', display:'inline-block' }} />
                      {s.toUpperCase()}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize:10, color:'#2a2c45', marginTop:6 }}>{sources.length} source{sources.length !== 1 ? 's' : ''} selected</div>
              </div>

              {runError && (
                <div style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:6, padding:'10px 12px', fontSize:12, color:'#F87171' }}>
                  {runError}
                </div>
              )}

              {retryCount > 0 && (
                <div style={{ fontSize:11, color:'#FBBF24', textAlign:'center' }}>Retrying... attempt {retryCount}/2</div>
              )}

              <button onClick={() => handleScrape(0)} disabled={running} style={{
                background: running ? '#0e0f1a' : 'linear-gradient(135deg, #1D9E75, #5DCAA5)',
                border: running ? '1px solid #1e2035' : 'none', borderRadius:7,
                color: running ? '#3a3c55' : '#051a12', padding:'12px',
                fontWeight:700, fontSize:13, cursor: running ? 'not-allowed' : 'pointer',
                letterSpacing:1, fontFamily:'inherit', transition:'all .2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
                {running ? (
                  <>
                    <span style={{ width:12, height:12, border:'2px solid #3a3c55', borderTopColor:'#5DCAA5', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} />
                    SCRAPING...
                  </>
                ) : 'LAUNCH SCRAPER'}
              </button>
            </div>

            {lastResponse && (
              <div style={{ background:'#0a0b14', border:'1px solid rgba(93,202,165,0.2)', borderRadius:10, padding:'16px 20px', animation:'fadeIn .3s ease' }}>
                <div style={{ fontSize:10, color:'#5DCAA5', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Last Run Summary</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { label:'Attempted', value: lastResponse.attempted },
                    { label:'Sources Used', value: lastResponse.sources_used?.length ?? 0 },
                    { label:'Started', value: fmt(lastResponse.started_at) },
                    { label:'Finished', value: fmt(lastResponse.finished_at) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize:9, color:'#3a3c55', letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#e2e0da' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {lastResponse.source_errors?.length > 0 && (
                  <div style={{ marginTop:10, borderTop:'1px solid #12141f', paddingTop:10 }}>
                    <div style={{ fontSize:9, color:'#F87171', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Source Errors</div>
                    {lastResponse.source_errors.map(e => (
                      <div key={e.source} style={{ fontSize:11, color:'#F87171', marginBottom:3 }}>
                        <span style={{ color:'#555' }}>{e.source.toUpperCase()}</span> - {e.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ background:'#0a0b14', border:'1px solid #12141f', borderRadius:10, padding:'20px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:10, color:'#3a3c55', letterSpacing:2, textTransform:'uppercase', marginBottom:2 }}>Run Telemetry</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#e2e0da' }}>Scrape History</div>
                </div>
                <button onClick={() => loadRuns()} style={{ background:'#0e0f1a', border:'1px solid #1e2035', borderRadius:5, color:'#555', padding:'5px 12px', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                  Refresh
                </button>
              </div>
              {runLoading && runs.length === 0 ? (
                <div style={{ textAlign:'center', color:'#3a3c55', fontSize:12, padding:'24px 0' }}>Loading runs...</div>
              ) : runs.length === 0 ? (
                <div style={{ textAlign:'center', color:'#2a2c45', fontSize:12, padding:'24px 0' }}>No runs yet. Launch a scrape to see telemetry.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:340, overflowY:'auto' }}>
                  {runs.map(run => (
                    <div key={run.id} onClick={() => setActiveRunId(run.id)} style={{
                      background: activeRunId === run.id ? '#0e0f1a' : 'transparent',
                      border:`1px solid ${activeRunId === run.id ? '#1e2035' : 'transparent'}`,
                      borderRadius:7, padding:'12px 14px', cursor:'pointer', transition:'all .15s',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <StatusPill status={run.status} />
                          <span style={{ fontSize:11, color:'#555' }}>{run.vendor_name || 'multi-source'}</span>
                        </div>
                        <span style={{ fontSize:10, color:'#3a3c55' }}>{elapsed(run.created_at, run.finished_at)}</span>
                      </div>
                      <div style={{ display:'flex', gap:16, fontSize:11 }}>
                        <span style={{ color:'#3a3c55' }}>Rows: <span style={{ color: run.rows_inserted ? '#5DCAA5' : '#555' }}>{run.rows_inserted ?? 0}</span></span>
                        <span style={{ color:'#3a3c55' }}>{fmt(run.created_at)}</span>
                      </div>
                      {run.error_message && (
                        <div style={{ marginTop:5, fontSize:10, color:'#F87171', background:'rgba(248,113,113,0.06)', padding:'4px 8px', borderRadius:4, borderLeft:'2px solid #F87171' }}>
                          {run.error_message}
                        </div>
                      )}
                      <div style={{ marginTop:4, fontSize:9, color:'#2a2c45' }}>{run.id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background:'#0a0b14', border:'1px solid #12141f', borderRadius:10, padding:'20px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
                <div>
                  <div style={{ fontSize:10, color:'#3a3c55', letterSpacing:2, textTransform:'uppercase', marginBottom:2 }}>Lead Results</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#e2e0da' }}>
                    {leadsLoading ? 'Loading...' : `${displayedLeads.length} lead${displayedLeads.length !== 1 ? 's' : ''}`}
                    {sourceFilter !== 'all' && <span style={{ fontSize:11, color:'#5DCAA5', marginLeft:8 }}>({sourceFilter})</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['all', ...uniqueSources].map(s => (
                    <span key={s} onClick={() => setSourceFilter(s)} style={{
                      padding:'4px 10px', borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:1, cursor:'pointer', border:'1px solid',
                      background: sourceFilter === s ? 'rgba(93,202,165,0.1)' : '#0e0f1a',
                      borderColor: sourceFilter === s ? '#5DCAA5' : '#1e2035',
                      color: sourceFilter === s ? '#5DCAA5' : '#3a3c55', transition:'all .15s',
                    }}>{s.toUpperCase()}</span>
                  ))}
                  <button onClick={loadLeads} style={{ background:'#0e0f1a', border:'1px solid #1e2035', borderRadius:4, color:'#555', padding:'4px 10px', cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                    Refresh
                  </button>
                </div>
              </div>

              {!campaignId ? (
                <div style={{ textAlign:'center', color:'#2a2c45', fontSize:12, padding:'32px 0' }}>Select a campaign to view leads</div>
              ) : leadsLoading ? (
                <div style={{ textAlign:'center', color:'#3a3c55', fontSize:12, padding:'32px 0' }}>Loading leads...</div>
              ) : displayedLeads.length === 0 ? (
                <div style={{ textAlign:'center', color:'#2a2c45', fontSize:12, padding:'32px 0' }}>No leads found. Run a scrape to populate results.</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid #12141f' }}>
                        {([
                          { label:'Business', field:'business_name' },
                          { label:'Source', field:'source' },
                          { label:'Phone', field:'phone' },
                          { label:'Website', field:'website' },
                        ] as { label: string; field: SortField }[]).map(({ label, field }) => (
                          <th key={field} className="sth" onClick={() => toggleSort(field)}
                            style={{ padding:'8px 12px', textAlign:'left', color: sortField === field ? '#5DCAA5' : '#3a3c55', fontSize:9, letterSpacing:1.5, textTransform:'uppercase', fontWeight:700 }}>
                            {label} {sortField === field ? (sortDir === 'asc' ? 'asc' : 'desc') : ''}
                          </th>
                        ))}
                        <th style={{ padding:'8px 12px', textAlign:'left', color:'#3a3c55', fontSize:9, letterSpacing:1.5, textTransform:'uppercase', fontWeight:700 }}>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedLeads.map(lead => (
                        <tr key={lead.id} className="lr" style={{ borderBottom:'1px solid #0d0e19' }}>
                          <td style={{ padding:'10px 12px', color:'#c8c6c0', fontWeight:600, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.business_name || '-'}</td>
                          <td style={{ padding:'10px 12px' }}>
                            {lead.source ? (
                              <span style={{
                                padding:'2px 7px', borderRadius:3, fontSize:9, fontWeight:700, letterSpacing:1,
                                background:`${SOURCE_COLORS[lead.source] || '#555'}18`,
                                color: SOURCE_COLORS[lead.source] || '#555',
                                border:`1px solid ${SOURCE_COLORS[lead.source] || '#555'}30`,
                              }}>{lead.source.toUpperCase()}</span>
                            ) : '-'}
                          </td>
                          <td style={{ padding:'10px 12px', color:'#555', fontSize:11 }}>{lead.phone || '-'}</td>
                          <td style={{ padding:'10px 12px', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {lead.website ? (
                              <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ color:'#5DCAA5', textDecoration:'none', fontSize:11 }}>
                                {lead.website.replace(/^https?:\/\//, '')}
                              </a>
                            ) : '-'}
                          </td>
                          <td style={{ padding:'10px 12px', color:'#555', fontSize:11 }}>{lead.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}