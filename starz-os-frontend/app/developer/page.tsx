'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getWorkOrders, getStatusColor, getPaymentStatusColor, type WorkOrder } from '@/lib/workOrders';
import { ClipboardList, Search, Link2, BarChart3, FileText, Loader2, ExternalLink, AlertCircle, TrendingUp } from 'lucide-react';

type Tab = 'workorders' | 'seo' | 'backlinks' | 'googleads' | 'reports';

interface Keyword { id: string; keyword: string; search_volume: number | null; difficulty: number | null; trend_score: number | null; intent: string | null; source: string | null; last_checked: string | null; }
interface Backlink { id: string; url: string; anchor_text: string | null; price: number | null; placed_at: string | null; }
interface Prospect { id: string; domain: string; url: string | null; spam_score: number | null; score: number | null; }
interface GoogleAds { id: number; keyword: string; location: string | null; avg_monthly_searches: number | null; competition: string | null; cpc: number | null; pulled_at: string | null; }
interface MarketReport { id: string; business_name: string | null; industry: string | null; city: string | null; state: string | null; status: string | null; created_at: string | null; }

function fmt(d: string | null) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function DiffBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-white/30 text-xs">—</span>;
  const c = value >= 70 ? 'bg-red-500' : value >= 40 ? 'bg-yellow-500' : 'bg-green-500';
  return <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className={`h-full rounded-full ${c}`} style={{ width: `${Math.min(value,100)}%` }} /></div><span className="text-xs text-white/50">{value}</span></div>;
}
function CompBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-white/30 text-xs">—</span>;
  const c: Record<string,string> = { HIGH: 'text-red-400 bg-red-400/10', MEDIUM: 'text-yellow-400 bg-yellow-400/10', LOW: 'text-green-400 bg-green-400/10' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c[value.toUpperCase()] || 'text-white/40 bg-white/5'}`}>{value}</span>;
}

export default function DeveloperPortal() {
  const [tab, setTab] = useState<Tab>('workorders');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [googleAds, setGoogleAds] = useState<GoogleAds[]>([]);
  const [reports, setReports] = useState<MarketReport[]>([]);

  useEffect(() => { load(tab); }, [tab]);

  async function load(t: Tab) {
    setLoading(true); setError(null);
    const sb = createClient();
    try {
      if (t === 'workorders') { setWorkOrders(await getWorkOrders()); }
      else if (t === 'seo') { const { data, error } = await sb.schema('seo').from('keywords').select('*').order('search_volume', { ascending: false }).limit(200); if (error) throw error; setKeywords(data || []); }
      else if (t === 'backlinks') { const [bl, bp] = await Promise.all([sb.schema('seo').from('backlinks').select('*').order('placed_at', { ascending: false }).limit(200), sb.schema('seo').from('backlink_prospects').select('*').order('score', { ascending: false }).limit(200)]); if (bl.error) throw bl.error; if (bp.error) throw bp.error; setBacklinks(bl.data || []); setProspects(bp.data || []); }
      else if (t === 'googleads') { const { data, error } = await sb.schema('analytics').from('google_ads_keyword_data').select('*').order('avg_monthly_searches', { ascending: false }).limit(200); if (error) throw error; setGoogleAds(data || []); }
      else if (t === 'reports') { const { data, error } = await sb.schema('intelligence').from('market_reports').select('id, business_name, industry, city, state, status, created_at').order('created_at', { ascending: false }).limit(200); if (error) throw error; setReports(data || []); }
    } catch (e: any) { setError(e.message || 'Failed to load'); }
    setLoading(false);
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'workorders', label: 'Work Orders', icon: ClipboardList },
    { id: 'seo', label: 'SEO Keywords', icon: Search },
    { id: 'backlinks', label: 'Backlinks', icon: Link2 },
    { id: 'googleads', label: 'Google Ads', icon: BarChart3 },
    { id: 'reports', label: 'Market Reports', icon: FileText },
  ];

  const q = search.toLowerCase();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="mb-6"><h1 className="text-2xl font-bold">Developer Portal</h1><p className="text-gray-400 text-sm mt-1">Work orders, SEO tools, backlinks, ads & market reports</p></div>

      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); setSearch(''); }} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${tab === id ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
      </div>

      {error && <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm mb-4"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 gap-2"><Loader2 className="w-5 h-5 animate-spin" />Loading...</div>
      ) : (
        <>
          {tab === 'workorders' && (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              {workOrders.length === 0 ? <div className="py-20 text-center text-gray-500 text-sm">No work orders found</div> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400 text-xs uppercase"><tr><th className="px-4 py-3 text-left">Client</th><th className="px-4 py-3 text-left">Service</th><th className="px-4 py-3 text-left">Proposal</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Payment</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Due</th></tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {workOrders.filter(w => !q || w.client_name?.toLowerCase().includes(q) || w.business_name?.toLowerCase().includes(q) || w.service?.toLowerCase().includes(q)).map(wo => (
                      <tr key={wo.id} className="hover:bg-gray-900/50 transition-colors">
                        <td className="px-4 py-3"><div className="font-medium text-white">{wo.business_name || wo.client_name}</div><div className="text-gray-500 text-xs">{wo.customer_email}</div></td>
                        <td className="px-4 py-3 text-gray-300">{wo.service || wo.project_type || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{wo.proposal_id || '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(wo.status)}`}>{wo.status || 'unknown'}</span></td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(wo.payment_status)}`}>{wo.payment_status || '—'}</span></td>
                        <td className="px-4 py-3 text-gray-300">{wo.total_amount ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(wo.total_amount) : '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmt(wo.due_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'seo' && (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              {keywords.length === 0 ? <div className="py-20 text-center text-gray-500 text-sm">No keywords found</div> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400 text-xs uppercase"><tr><th className="px-4 py-3 text-left">Keyword</th><th className="px-4 py-3 text-left">Volume</th><th className="px-4 py-3 text-left">Difficulty</th><th className="px-4 py-3 text-left">Trend</th><th className="px-4 py-3 text-left">Intent</th><th className="px-4 py-3 text-left">Source</th><th className="px-4 py-3 text-left">Last Checked</th></tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {keywords.filter(k => !q || k.keyword?.toLowerCase().includes(q)).map(k => (
                      <tr key={k.id} className="hover:bg-gray-900/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{k.keyword}</td>
                        <td className="px-4 py-3 text-gray-300">{k.search_volume?.toLocaleString() || '—'}</td>
                        <td className="px-4 py-3"><DiffBar value={k.difficulty} /></td>
                        <td className="px-4 py-3 text-gray-300">{k.trend_score ?? '—'}</td>
                        <td className="px-4 py-3">{k.intent ? <span className="px-2 py-0.5 rounded-full text-xs bg-blue-400/10 text-blue-400 capitalize">{k.intent}</span> : '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{k.source || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmt(k.last_checked)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'backlinks' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-cyan-400" />Placed Backlinks ({backlinks.length})</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-800">
                  {backlinks.length === 0 ? <div className="py-12 text-center text-gray-500 text-sm">No backlinks placed yet</div> : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-900 text-gray-400 text-xs uppercase"><tr><th className="px-4 py-3 text-left">URL</th><th className="px-4 py-3 text-left">Anchor Text</th><th className="px-4 py-3 text-left">Price</th><th className="px-4 py-3 text-left">Placed</th></tr></thead>
                      <tbody className="divide-y divide-gray-800">
                        {backlinks.filter(b => !q || b.url?.toLowerCase().includes(q) || b.anchor_text?.toLowerCase().includes(q)).map(b => (
                          <tr key={b.id} className="hover:bg-gray-900/50 transition-colors">
                            <td className="px-4 py-3"><a href={b.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs">{b.url?.replace('https://','').slice(0,50)}<ExternalLink className="w-3 h-3" /></a></td>
                            <td className="px-4 py-3 text-gray-300 text-xs">{b.anchor_text || '—'}</td>
                            <td className="px-4 py-3 text-gray-300">{b.price ? `$${b.price}` : '—'}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{fmt(b.placed_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-400" />Backlink Prospects ({prospects.length})</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-800">
                  {prospects.length === 0 ? <div className="py-12 text-center text-gray-500 text-sm">No prospects found</div> : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-900 text-gray-400 text-xs uppercase"><tr><th className="px-4 py-3 text-left">Domain</th><th className="px-4 py-3 text-left">Score</th><th className="px-4 py-3 text-left">Spam Score</th><th className="px-4 py-3 text-left">URL</th></tr></thead>
                      <tbody className="divide-y divide-gray-800">
                        {prospects.filter(p => !q || p.domain?.toLowerCase().includes(q)).map(p => (
                          <tr key={p.id} className="hover:bg-gray-900/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-white">{p.domain}</td>
                            <td className="px-4 py-3"><DiffBar value={p.score} /></td>
                            <td className="px-4 py-3">{p.spam_score != null ? <span className={`text-xs ${Number(p.spam_score) > 30 ? 'text-red-400' : 'text-green-400'}`}>{p.spam_score}</span> : '—'}</td>
                            <td className="px-4 py-3">{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1">{p.url.slice(0,40)}<ExternalLink className="w-3 h-3" /></a> : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'googleads' && (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              {googleAds.length === 0 ? <div className="py-20 text-center text-gray-500 text-sm">No Google Ads data found</div> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400 text-xs uppercase"><tr><th className="px-4 py-3 text-left">Keyword</th><th className="px-4 py-3 text-left">Location</th><th className="px-4 py-3 text-left">Avg Monthly Searches</th><th className="px-4 py-3 text-left">Competition</th><th className="px-4 py-3 text-left">CPC</th><th className="px-4 py-3 text-left">Pulled</th></tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {googleAds.filter(g => !q || g.keyword?.toLowerCase().includes(q) || g.location?.toLowerCase().includes(q)).map(g => (
                      <tr key={g.id} className="hover:bg-gray-900/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{g.keyword}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{g.location || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{g.avg_monthly_searches?.toLocaleString() || '—'}</td>
                        <td className="px-4 py-3"><CompBadge value={g.competition} /></td>
                        <td className="px-4 py-3 text-gray-300">{g.cpc ? `$${Number(g.cpc).toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmt(g.pulled_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'reports' && (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              {reports.length === 0 ? <div className="py-20 text-center text-gray-500 text-sm">No market reports found</div> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400 text-xs uppercase"><tr><th className="px-4 py-3 text-left">Business</th><th className="px-4 py-3 text-left">Industry</th><th className="px-4 py-3 text-left">Location</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Created</th></tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {reports.filter(r => !q || r.business_name?.toLowerCase().includes(q) || r.industry?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q)).map(r => (
                      <tr key={r.id} className="hover:bg-gray-900/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{r.business_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{r.industry || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</td>
                        <td className="px-4 py-3">{r.status ? <span className="px-2 py-0.5 rounded-full text-xs bg-blue-400/10 text-blue-400 capitalize">{r.status}</span> : '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmt(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
