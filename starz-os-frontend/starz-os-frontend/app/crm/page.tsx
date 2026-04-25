'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Phone, Mail, Globe, Star, Flame, Target, RefreshCw, Loader2, AlertCircle, CheckCircle, Clock, Zap, BarChart3, Search, MessageSquare, Activity, DollarSign, Eye } from 'lucide-react';

type LeadStatus = 'new' | 'qualified' | 'contacted' | 'nurturing' | 'won' | 'lost' | 'proposal_sent';
interface Lead { id: string; business_name: string | null; name: string | null; company_name: string | null; email: string | null; phone: string | null; website_url: string | null; status: LeadStatus | null; lead_score: number | null; ai_score: number | null; industry: string | null; source: string | null; revenue_estimate: number | null; monthly_revenue_estimate: number | null; enrichment_status: string | null; target_tier: string | null; revenue_tier: string | null; google_reviews: number | null; google_rating: number | null; has_ads: boolean | null; seo_score: number | null; inferred_pain_points: string[] | null; personalized_opening: string | null; recommended_offer: string | null; ai_notes: string | null; next_best_action: string | null; priority_level: string | null; last_contacted_at: string | null; created_at: string; }
interface CRMActivity { id: string; type: string | null; subject: string | null; note: string | null; occurred_at: string | null; created_at: string; }

const STATUSES: { key: LeadStatus; label: string; color: string; bg: string }[] = [
  { key: 'new',           label: 'New',           color: 'text-white/60',   bg: 'bg-white/5' },
  { key: 'qualified',     label: 'Qualified',     color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  { key: 'contacted',     label: 'Contacted',     color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  { key: 'nurturing',     label: 'Nurturing',     color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'won',           label: 'Won',           color: 'text-green-400',  bg: 'bg-green-500/10' },
  { key: 'lost',          label: 'Lost',          color: 'text-red-400',    bg: 'bg-red-500/10' },
];

const SOURCE_COLORS: Record<string, string> = {
  google: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  yelp: 'bg-red-500/20 text-red-400 border-red-500/30',
  facebook: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  linkedin: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  scraper: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  manual: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function fmt(d: string | null) { if (!d) return '-'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtTime(d: string | null) { if (!d) return '-'; return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function scoreColor(s: number | null) { if (!s) return 'text-white/20'; if (s >= 70) return 'text-green-400'; if (s >= 40) return 'text-yellow-400'; return 'text-red-400'; }

function StatusBadge({ status }: { status: LeadStatus | null }) {
  const s = STATUSES.find(x => x.key === status);
  if (!s) return <span className="text-white/20 text-xs">-</span>;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.color}`}>{s.label}</span>;
}

export default function CRMDashboard() {
  const supabase = createClient();
  const [view, setView] = useState<'board' | 'list'>('list');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [actLoading, setActLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error } = await supabase.schema('crm').from('leads').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) setError(error.message);
    else setLeads((data || []) as Lead[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadLeads(); }, []);

  async function loadActivities(leadId: string) {
    setActLoading(true);
    const { data } = await supabase.schema('crm').from('activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(20);
    setActivities((data || []) as CRMActivity[]);
    setActLoading(false);
  }

  async function updateStatus(leadId: string, status: LeadStatus) {
    setUpdatingStatus(leadId);
    const { error } = await supabase.schema('crm').from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', leadId);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
      if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, status } : null);
    }
    setUpdatingStatus(null);
  }

  async function saveNote() {
    if (!selectedLead || !noteText.trim()) return;
    setSavingNote(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.schema('crm').from('activities').insert({ lead_id: selectedLead.id, type: 'note', subject: 'Manual Note', note: noteText.trim(), occurred_at: new Date().toISOString(), user_id: user?.id });
    setNoteText('');
    await loadActivities(selectedLead.id);
    setSavingNote(false);
  }

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || (l.business_name || l.name || '').toLowerCase().includes(q) || (l.industry || '').toLowerCase().includes(q) || (l.phone || '').includes(q);
    return matchSearch && (statusFilter === 'all' || l.status === statusFilter) && (sourceFilter === 'all' || l.source === sourceFilter) && (industryFilter === 'all' || l.industry === industryFilter);
  });

  const uniqueSources = [...new Set(leads.map(l => l.source).filter(Boolean))] as string[];
  const uniqueIndustries = [...new Set(leads.map(l => l.industry).filter(Boolean))] as string[];
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => (l.ai_score || l.lead_score || 0) >= 70).length;
  const wonLeads = leads.filter(l => l.status === 'won').length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const ic = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors";

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CRM Dashboard</h1>
              <p className="text-sm text-white/40">Live lead pipeline powered by STARZ-OS</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setView(view === 'list' ? 'board' : 'list')} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white transition-all">
                {view === 'list' ? 'Board View' : 'List View'}
              </button>
              <button onClick={loadLeads} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-white' },
              { label: 'New', value: newLeads, icon: Zap, color: 'text-cyan-400' },
              { label: 'Hot Leads', value: hotLeads, icon: Flame, color: 'text-orange-400' },
              { label: 'Won', value: wonLeads, icon: CheckCircle, color: 'text-green-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="bg-gray-900 border-white/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${color} opacity-60`} />
                  <div><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-xs text-white/40">{label}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input className={`${ic} pl-9 w-full`} placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className={ic} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}>
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select className={ic} value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}>
              <option value="all">All Sources</option>
              {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className={ic} value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}>
              <option value="all">All Industries</option>
              {uniqueIndustries.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="flex items-center text-xs text-white/30 px-2">{filtered.length} leads</span>
          </div>

          {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-white/40"><Loader2 className="w-5 h-5 animate-spin" />Loading CRM...</div>
          ) : (
            <div className={selectedLead ? 'grid grid-cols-[1fr_400px] gap-5' : ''}>
              {view === 'list' && (
                <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Business</th>
                        <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Score</th>
                        <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Source</th>
                        <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Industry</th>
                        <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Created</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={8} className="py-20 text-center text-white/20 text-sm">No leads found</td></tr>
                      ) : filtered.map(lead => (
                        <tr key={lead.id} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer ${selectedLead?.id === lead.id ? 'bg-white/5' : ''}`}
                          onClick={() => { setSelectedLead(lead); loadActivities(lead.id); }}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-white truncate max-w-[180px]">{lead.business_name || lead.name || '-'}</p>
                            {lead.email && <p className="text-xs text-white/30 truncate">{lead.email}</p>}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                          <td className="px-4 py-3"><span className={`font-bold ${scoreColor(lead.ai_score || lead.lead_score)}`}>{lead.ai_score || lead.lead_score || '-'}</span></td>
                          <td className="px-4 py-3">
                            {lead.source ? <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${SOURCE_COLORS[lead.source] || 'bg-white/10 text-white/40 border-white/20'}`}>{lead.source.toUpperCase()}</span> : '-'}
                          </td>
                          <td className="px-4 py-3 text-white/50 text-xs">{lead.industry || '-'}</td>
                          <td className="px-4 py-3">
                            {lead.phone ? <span className="flex items-center gap-1 text-white/60 text-xs"><Phone className="w-3 h-3" />{lead.phone}</span> : <span className="text-white/20">-</span>}
                          </td>
                          <td className="px-4 py-3 text-white/30 text-xs">{fmt(lead.created_at)}</td>
                          <td className="px-4 py-3">
                            <button className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {view === 'board' && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {STATUSES.map(status => {
                    const cols = filtered.filter(l => l.status === status.key);
                    return (
                      <div key={status.key} className="flex-shrink-0 w-64">
                        <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl ${status.bg} border border-white/10 border-b-0`}>
                          <span className={`text-xs font-bold uppercase tracking-wider ${status.color}`}>{status.label}</span>
                          <span className="text-xs text-white/30">{cols.length}</span>
                        </div>
                        <div className="bg-gray-900/50 border border-white/10 rounded-b-xl p-2 flex flex-col gap-2 min-h-24 max-h-[55vh] overflow-y-auto">
                          {cols.map(lead => (
                            <div key={lead.id} className={`bg-gray-900 border rounded-xl p-3 cursor-pointer transition-all ${selectedLead?.id === lead.id ? 'border-cyan-500/40' : 'border-white/10 hover:border-white/20'}`}
                              onClick={() => { setSelectedLead(lead); loadActivities(lead.id); }}>
                              <p className="font-medium text-white text-sm truncate">{lead.business_name || lead.name || '-'}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {lead.source && <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${SOURCE_COLORS[lead.source] || 'bg-white/10 text-white/40 border-white/20'}`}>{lead.source}</span>}
                                {lead.industry && <span className="text-xs text-white/30">{lead.industry}</span>}
                              </div>
                              {lead.phone && <p className="text-xs text-white/40 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</p>}
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs font-bold ${scoreColor(lead.ai_score || lead.lead_score)}`}>Score: {lead.ai_score || lead.lead_score || '-'}</span>
                                <span className="text-xs text-white/20">{fmt(lead.created_at)}</span>
                              </div>
                            </div>
                          ))}
                          {cols.length === 0 && <div className="text-center text-white/20 text-xs py-6">Empty</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedLead && (
                <div className="bg-gray-900 border border-white/10 rounded-xl overflow-auto max-h-[calc(100vh-200px)]">
                  <div className="p-4 border-b border-white/10 flex items-start justify-between sticky top-0 bg-gray-900 z-10">
                    <div>
                      <h2 className="font-bold text-white text-base">{selectedLead.business_name || selectedLead.name || '-'}</h2>
                      <p className="text-xs text-white/40">{selectedLead.industry} · {selectedLead.source}</p>
                    </div>
                    <button onClick={() => setSelectedLead(null)} className="text-white/30 hover:text-white text-xl leading-none">&times;</button>
                  </div>
                  <div className="p-4 flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { score: selectedLead.lead_score, label: 'Lead Score' },
                        { score: selectedLead.ai_score, label: 'AI Score' },
                        { score: selectedLead.seo_score, label: 'SEO Score' },
                      ].map(({ score, label }) => (
                        <div key={label} className="bg-white/5 rounded-lg p-3 text-center">
                          <span className={`text-lg font-bold ${scoreColor(score)}`}>{score ?? '-'}</span>
                          <p className="text-xs text-white/30 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map(s => (
                          <button key={s.key} onClick={() => updateStatus(selectedLead.id, s.key)} disabled={updatingStatus === selectedLead.id}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${selectedLead.status === s.key ? `${s.bg} ${s.color} border-current` : 'bg-white/5 text-white/30 border-white/10 hover:border-white/20'}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-2">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Contact</p>
                      {selectedLead.phone && <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-cyan-400 transition-colors"><Phone className="w-3.5 h-3.5 text-cyan-400" />{selectedLead.phone}</a>}
                      {selectedLead.email && <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-cyan-400 transition-colors"><Mail className="w-3.5 h-3.5 text-cyan-400" />{selectedLead.email}</a>}
                      {selectedLead.website_url && <a href={selectedLead.website_url.startsWith('http') ? selectedLead.website_url : `https://${selectedLead.website_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/70 hover:text-cyan-400 transition-colors"><Globe className="w-3.5 h-3.5 text-cyan-400" />{selectedLead.website_url.replace(/^https?:\/\//, '')}</a>}
                    </div>

                    {(selectedLead.google_rating || selectedLead.has_ads !== null || selectedLead.revenue_tier || selectedLead.enrichment_status) && (
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Business Intel</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {selectedLead.google_rating && <div className="flex items-center gap-1 text-white/60"><Star className="w-3 h-3 text-yellow-400" />{selectedLead.google_rating} ({selectedLead.google_reviews} reviews)</div>}
                          {selectedLead.has_ads !== null && <div className={`flex items-center gap-1 ${selectedLead.has_ads ? 'text-green-400' : 'text-white/30'}`}><Target className="w-3 h-3" />{selectedLead.has_ads ? 'Running Ads' : 'No Ads'}</div>}
                          {selectedLead.revenue_tier && <div className="flex items-center gap-1 text-white/60"><DollarSign className="w-3 h-3 text-green-400" />{selectedLead.revenue_tier}</div>}
                          {selectedLead.enrichment_status && <div className="col-span-2 flex items-center gap-1 text-white/40"><Activity className="w-3 h-3" />Enrichment: {selectedLead.enrichment_status}</div>}
                        </div>
                      </div>
                    )}

                    {(selectedLead.ai_notes || selectedLead.personalized_opening || selectedLead.next_best_action || selectedLead.recommended_offer) && (
                      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
                        <p className="text-xs text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Zap className="w-3 h-3" />AI Insights</p>
                        {selectedLead.next_best_action && <div className="mb-2"><p className="text-xs text-white/30 mb-0.5">Next Action</p><p className="text-xs text-white/70">{selectedLead.next_best_action}</p></div>}
                        {selectedLead.personalized_opening && <div className="mb-2"><p className="text-xs text-white/30 mb-0.5">Opening Line</p><p className="text-xs text-white/70 italic">"{selectedLead.personalized_opening}"</p></div>}
                        {selectedLead.recommended_offer && <div className="mt-2 pt-2 border-t border-cyan-500/20"><p className="text-xs text-white/30 mb-0.5">Recommended Offer</p><p className="text-xs text-cyan-400 font-semibold">{selectedLead.recommended_offer}</p></div>}
                      </div>
                    )}

                    {selectedLead.inferred_pain_points?.length ? (
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Pain Points</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedLead.inferred_pain_points.map(p => <span key={p} className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded text-xs">{p}</span>)}
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Add Note</p>
                      <textarea className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none" rows={2} placeholder="Write a note..." value={noteText} onChange={e => setNoteText(e.target.value)} />
                      <button onClick={saveNote} disabled={savingNote || !noteText.trim()} className="mt-2 w-full py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-semibold hover:bg-cyan-500/30 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                        {savingNote ? <><Loader2 className="w-3 h-3 animate-spin" />Saving...</> : <><MessageSquare className="w-3 h-3" />Save Note</>}
                      </button>
                    </div>

                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Activity</p>
                      {actLoading ? <div className="text-center text-white/20 text-xs py-4">Loading...</div> : activities.length === 0 ? <div className="text-center text-white/20 text-xs py-4">No activity yet</div> : (
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                          {activities.map(a => (
                            <div key={a.id} className="bg-white/5 rounded-lg p-2.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-white/60 capitalize">{a.type || 'activity'}</span>
                                <span className="text-xs text-white/20">{fmtTime(a.occurred_at || a.created_at)}</span>
                              </div>
                              {a.subject && <p className="text-xs text-white/50">{a.subject}</p>}
                              {a.note && <p className="text-xs text-white/70 mt-0.5">{a.note}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}