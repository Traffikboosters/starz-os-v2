'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Mail, Phone, Globe, RefreshCw, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock, Play, Pause, BarChart3,
  MessageSquare, Inbox, Settings, Filter, ChevronRight,
  TrendingUp, Users, Send, Eye, RotateCcw
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface OutreachQueueItem {
  id: string;
  lead_id: string | null;
  campaign_id: string | null;
  contact_name: string | null;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  lead_score: number | null;
  priority: string | null;
  recommended_channel: string | null;
  step_number: number | null;
  sequence_name: string | null;
  scheduled_for: string | null;
  status: string | null;
  attempts: number | null;
  max_attempts: number | null;
  last_error: string | null;
  created_at: string;
}

interface OutreachLog {
  id: number;
  lead_id: string | null;
  channel: string | null;
  message: string | null;
  status: string | null;
  provider: string | null;
  error: string | null;
  created_at: string;
  retry_count: number | null;
}

interface Campaign {
  id: string;
  name: string | null;
  status: string | null;
  offer_name: string | null;
  daily_limit: number | null;
  target_industries: string[] | null;
  require_approval: boolean | null;
  created_at: string;
}

interface ReplyInbox {
  id: number;
  lead_email: string | null;
  lead_name: string | null;
  company: string | null;
  reply_text: string | null;
  provider: string | null;
  received_at: string | null;
  processed_at: string | null;
  processing_result: any | null;
}

interface FollowupRule {
  id: number;
  stage: string | null;
  min_no_reply_days: number | null;
  max_no_reply_days: number | null;
  delay_hours: number | null;
  subject_template: string | null;
  priority: number | null;
  active: boolean | null;
}

type Tab = 'queue' | 'campaigns' | 'logs' | 'replies' | 'followups';

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    running:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
    sent:      'bg-green-500/20 text-green-400 border-green-500/30',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed:    'bg-red-500/20 text-red-400 border-red-500/30',
    error:     'bg-red-500/20 text-red-400 border-red-500/30',
    active:    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    paused:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    locked:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    skipped:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  const cls = map[(status || '').toLowerCase()] || 'bg-white/10 text-white/40 border-white/20';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border capitalize ${cls}`}>
      {status || '—'}
    </span>
  );
}

function ChannelIcon({ channel }: { channel: string | null }) {
  if (!channel) return null;
  const c = channel.toLowerCase();
  if (c.includes('email')) return <Mail className="w-3.5 h-3.5 text-blue-400" />;
  if (c.includes('phone') || c.includes('call')) return <Phone className="w-3.5 h-3.5 text-green-400" />;
  if (c.includes('sms') || c.includes('text')) return <MessageSquare className="w-3.5 h-3.5 text-purple-400" />;
  return <Globe className="w-3.5 h-3.5 text-white/40" />;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OutreachEngine() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('queue');
  const [queue, setQueue] = useState<OutreachQueueItem[]>([]);
  const [logs, setLogs] = useState<OutreachLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [replies, setReplies] = useState<ReplyInbox[]>([]);
  const [followups, setFollowups] = useState<FollowupRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<OutreachQueueItem | null>(null);

  // Metrics
  const [metrics, setMetrics] = useState({
    total_queued: 0, pending: 0, sent: 0, failed: 0,
    active_campaigns: 0, replies_today: 0,
  });

  const loadData = useCallback(async (t: Tab) => {
    setLoading(true); setError(null);
    try {
      if (t === 'queue') {
        const { data, error } = await supabase.schema('outreach').from('outreach_queue')
          .select('*').order('scheduled_for', { ascending: true }).limit(200);
        if (error) throw error;
        const q = (data || []) as OutreachQueueItem[];
        setQueue(q);
        setMetrics(prev => ({
          ...prev,
          total_queued: q.length,
          pending: q.filter(x => x.status === 'pending').length,
          sent: q.filter(x => x.status === 'sent').length,
          failed: q.filter(x => x.status === 'failed' || x.status === 'error').length,
        }));
      } else if (t === 'logs') {
        const { data, error } = await supabase.schema('outreach').from('outreach_log')
          .select('*').order('created_at', { ascending: false }).limit(200);
        if (error) throw error;
        setLogs((data || []) as OutreachLog[]);
      } else if (t === 'campaigns') {
        const { data, error } = await supabase.schema('outreach').from('campaigns')
          .select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const c = (data || []) as Campaign[];
        setCampaigns(c);
        setMetrics(prev => ({ ...prev, active_campaigns: c.filter(x => x.status === 'active').length }));
      } else if (t === 'replies') {
        const { data, error } = await supabase.schema('outreach').from('reply_inbox')
          .select('*').order('received_at', { ascending: false }).limit(100);
        if (error) throw error;
        setReplies((data || []) as ReplyInbox[]);
      } else if (t === 'followups') {
        const { data, error } = await supabase.schema('outreach').from('followup_rules')
          .select('*').order('priority', { ascending: true });
        if (error) throw error;
        setFollowups((data || []) as FollowupRule[]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(tab); }, [tab]);

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'queue',     label: 'Outreach Queue',  icon: Send,        count: queue.length },
    { id: 'campaigns', label: 'Campaigns',        icon: BarChart3,   count: campaigns.length },
    { id: 'logs',      label: 'Send Logs',        icon: Clock,       count: logs.length },
    { id: 'replies',   label: 'Reply Inbox',      icon: Inbox,       count: replies.length },
    { id: 'followups', label: 'Follow-up Rules',  icon: Settings,    count: followups.length },
  ];

  const ic = "bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors";

  const filteredQueue = queue.filter(q => {
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchChannel = channelFilter === 'all' || (q.recommended_channel || '').toLowerCase().includes(channelFilter);
    const s = search.toLowerCase();
    const matchSearch = !s || (q.business_name || '').toLowerCase().includes(s) || (q.email || '').toLowerCase().includes(s) || (q.industry || '').toLowerCase().includes(s);
    return matchStatus && matchChannel && matchSearch;
  });

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Outreach Engine</h1>
              <p className="text-sm text-white/40">Steve BGE command center — automated multi-channel outreach</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => loadData(tab)} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Total Queued',      value: metrics.total_queued,      color: 'text-white',       icon: Send },
              { label: 'Pending',           value: metrics.pending,            color: 'text-yellow-400',  icon: Clock },
              { label: 'Sent',              value: metrics.sent,               color: 'text-green-400',   icon: CheckCircle },
              { label: 'Failed',            value: metrics.failed,             color: 'text-red-400',     icon: XCircle },
              { label: 'Active Campaigns',  value: metrics.active_campaigns,   color: 'text-cyan-400',    icon: BarChart3 },
              { label: 'Replies',           value: replies.length,             color: 'text-purple-400',  icon: Inbox },
            ].map(({ label, value, color, icon: Icon }) => (
              <Card key={label} className="bg-gray-900 border-white/10">
                <CardContent className="p-3 flex items-center gap-2">
                  <Icon className={`w-6 h-6 ${color} opacity-60 shrink-0`} />
                  <div>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-white/30 leading-tight">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-white/10 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => { setTab(id); setSearch(''); setStatusFilter('all'); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                  tab === id ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-white/40 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {count !== undefined && count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${tab === id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-white/40'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin" />Loading...
            </div>
          ) : (
            <>
              {/* ── OUTREACH QUEUE ── */}
              {tab === 'queue' && (
                <div className={selectedItem ? 'grid grid-cols-[1fr_380px] gap-5' : ''}>
                  <div>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="relative flex-1 min-w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input className={`${ic} pl-9 w-full`} placeholder="Search business, email, industry..."
                          value={search} onChange={e => setSearch(e.target.value)} />
                      </div>
                      <select className={ic} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}>
                        <option value="all">All Statuses</option>
                        {['pending','sent','failed','error','locked','skipped'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select className={ic} value={channelFilter} onChange={e => setChannelFilter(e.target.value)}
                        style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}>
                        <option value="all">All Channels</option>
                        {['email','phone','sms'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span className="flex items-center text-xs text-white/30 px-2">{filteredQueue.length} items</span>
                    </div>

                    <Card className="bg-gray-900 border-white/10">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Business</th>
                              <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Channel</th>
                              <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Step</th>
                              <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Priority</th>
                              <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Scheduled</th>
                              <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Attempts</th>
                              <th className="px-4 py-3"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredQueue.length === 0 ? (
                              <tr><td colSpan={8} className="py-20 text-center text-white/20 text-sm">No items in queue</td></tr>
                            ) : filteredQueue.map(item => (
                              <tr key={item.id} onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                                className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer ${selectedItem?.id === item.id ? 'bg-white/5' : ''}`}>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-white truncate max-w-[160px]">{item.business_name || '—'}</p>
                                  <p className="text-xs text-white/30 truncate">{item.email || item.phone || '—'}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <ChannelIcon channel={item.recommended_channel} />
                                    <span className="text-xs text-white/50 capitalize">{item.recommended_channel || '—'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-white/50">Step {item.step_number ?? '—'}</span>
                                  {item.sequence_name && <p className="text-xs text-white/20 truncate max-w-[100px]">{item.sequence_name}</p>}
                                </td>
                                <td className="px-4 py-3"><StatusPill status={item.status} /></td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs font-semibold ${item.priority === 'high' ? 'text-red-400' : item.priority === 'medium' ? 'text-yellow-400' : 'text-white/30'}`}>
                                    {item.priority || '—'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-white/40">{fmt(item.scheduled_for)}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs ${(item.attempts || 0) >= (item.max_attempts || 3) ? 'text-red-400' : 'text-white/40'}`}>
                                    {item.attempts ?? 0}/{item.max_attempts ?? 3}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <ChevronRight className={`w-4 h-4 transition-colors ${selectedItem?.id === item.id ? 'text-cyan-400' : 'text-white/20'}`} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>

                  {/* Detail Panel */}
                  {selectedItem && (
                    <Card className="bg-gray-900 border-white/10 overflow-auto max-h-[calc(100vh-220px)]">
                      <div className="p-4 border-b border-white/10 flex items-start justify-between sticky top-0 bg-gray-900 z-10">
                        <div>
                          <h3 className="font-bold text-white">{selectedItem.business_name || '—'}</h3>
                          <p className="text-xs text-white/40">{selectedItem.industry} · {selectedItem.city}, {selectedItem.state}</p>
                        </div>
                        <button onClick={() => setSelectedItem(null)} className="text-white/30 hover:text-white text-xl leading-none">&times;</button>
                      </div>
                      <div className="p-4 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-white/30 mb-0.5">Lead Score</p>
                            <p className={`text-xl font-bold ${(selectedItem.lead_score || 0) >= 70 ? 'text-green-400' : (selectedItem.lead_score || 0) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {selectedItem.lead_score ?? '—'}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-xs text-white/30 mb-0.5">Status</p>
                            <StatusPill status={selectedItem.status} />
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-2">
                          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Contact</p>
                          {selectedItem.email && (
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <Mail className="w-3.5 h-3.5 text-blue-400" />{selectedItem.email}
                            </div>
                          )}
                          {selectedItem.phone && (
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <Phone className="w-3.5 h-3.5 text-green-400" />{selectedItem.phone}
                            </div>
                          )}
                          {selectedItem.website && (
                            <a href={selectedItem.website.startsWith('http') ? selectedItem.website : `https://${selectedItem.website}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                              <Globe className="w-3.5 h-3.5" />{selectedItem.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>

                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Sequence</p>
                          <div className="flex flex-col gap-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-white/40">Name</span><span className="text-white/70">{selectedItem.sequence_name || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-white/40">Step</span><span className="text-white/70">{selectedItem.step_number ?? '—'}</span></div>
                            <div className="flex justify-between"><span className="text-white/40">Channel</span><span className="text-white/70 capitalize">{selectedItem.recommended_channel || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-white/40">Priority</span><span className={`font-semibold ${selectedItem.priority === 'high' ? 'text-red-400' : selectedItem.priority === 'medium' ? 'text-yellow-400' : 'text-white/40'}`}>{selectedItem.priority || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-white/40">Scheduled</span><span className="text-white/70">{fmt(selectedItem.scheduled_for)}</span></div>
                            <div className="flex justify-between"><span className="text-white/40">Attempts</span><span className={`${(selectedItem.attempts || 0) >= (selectedItem.max_attempts || 3) ? 'text-red-400' : 'text-white/70'}`}>{selectedItem.attempts ?? 0}/{selectedItem.max_attempts ?? 3}</span></div>
                          </div>
                        </div>

                        {selectedItem.last_error && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                            <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Last Error</p>
                            <p className="text-xs text-red-300">{selectedItem.last_error}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* ── CAMPAIGNS ── */}
              {tab === 'campaigns' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {campaigns.length === 0 ? (
                    <div className="col-span-3 py-20 text-center text-white/20 text-sm">No campaigns found</div>
                  ) : campaigns.map(camp => (
                    <Card key={camp.id} className="bg-gray-900 border-white/10 hover:border-white/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-white">{camp.name || '—'}</p>
                            {camp.offer_name && <p className="text-xs text-cyan-400 mt-0.5">{camp.offer_name}</p>}
                          </div>
                          <StatusPill status={camp.status} />
                        </div>
                        <div className="flex flex-col gap-1.5 text-xs mb-3">
                          <div className="flex justify-between">
                            <span className="text-white/40">Daily Limit</span>
                            <span className="text-white/70">{camp.daily_limit ?? '—'} emails/day</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Approval Required</span>
                            <span className={camp.require_approval ? 'text-yellow-400' : 'text-green-400'}>
                              {camp.require_approval ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">Created</span>
                            <span className="text-white/40">{fmt(camp.created_at)}</span>
                          </div>
                        </div>
                        {camp.target_industries?.length ? (
                          <div>
                            <p className="text-xs text-white/30 mb-1.5">Target Industries</p>
                            <div className="flex flex-wrap gap-1">
                              {camp.target_industries.slice(0, 4).map(i => (
                                <span key={i} className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded text-xs">{i}</span>
                              ))}
                              {camp.target_industries.length > 4 && (
                                <span className="px-1.5 py-0.5 bg-white/5 text-white/30 rounded text-xs">+{camp.target_industries.length - 4}</span>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* ── SEND LOGS ── */}
              {tab === 'logs' && (
                <Card className="bg-gray-900 border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Channel</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Provider</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Message</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Retries</th>
                          <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.length === 0 ? (
                          <tr><td colSpan={6} className="py-20 text-center text-white/20 text-sm">No logs found</td></tr>
                        ) : logs.map(log => (
                          <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <ChannelIcon channel={log.channel} />
                                <span className="text-xs text-white/60 capitalize">{log.channel || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3"><StatusPill status={log.status} /></td>
                            <td className="px-4 py-3 text-xs text-white/40">{log.provider || '—'}</td>
                            <td className="px-4 py-3 text-xs text-white/50 max-w-[300px] truncate">
                              {log.error ? <span className="text-red-400">{log.error}</span> : (log.message || '—')}
                            </td>
                            <td className="px-4 py-3 text-xs text-white/40">{log.retry_count ?? 0}</td>
                            <td className="px-4 py-3 text-xs text-white/30">{fmt(log.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* ── REPLY INBOX ── */}
              {tab === 'replies' && (
                <div className="flex flex-col gap-3">
                  {replies.length === 0 ? (
                    <div className="py-20 text-center text-white/20 text-sm">No replies yet</div>
                  ) : replies.map(reply => (
                    <Card key={reply.id} className="bg-gray-900 border-white/10 hover:border-white/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-white">{reply.company || reply.lead_name || '—'}</p>
                            <p className="text-xs text-white/40">{reply.lead_email} · via {reply.provider}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {reply.processed_at ? (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle className="w-3 h-3" />Processed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-yellow-400">
                                <Clock className="w-3 h-3" />Pending
                              </span>
                            )}
                            <span className="text-xs text-white/30">{fmt(reply.received_at)}</span>
                          </div>
                        </div>
                        {reply.reply_text && (
                          <div className="bg-white/5 rounded-lg px-3 py-2 text-sm text-white/70 italic border-l-2 border-cyan-500/40">
                            "{reply.reply_text.slice(0, 300)}{reply.reply_text.length > 300 ? '...' : ''}"
                          </div>
                        )}
                        {reply.processing_result && (
                          <div className="mt-2 text-xs text-white/30">
                            AI Result: {JSON.stringify(reply.processing_result).slice(0, 100)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* ── FOLLOW-UP RULES ── */}
              {tab === 'followups' && (
                <div className="flex flex-col gap-3">
                  {followups.length === 0 ? (
                    <div className="py-20 text-center text-white/20 text-sm">No follow-up rules configured</div>
                  ) : followups.map(rule => (
                    <Card key={rule.id} className={`border transition-colors ${rule.active ? 'bg-gray-900 border-white/10' : 'bg-gray-900/50 border-white/5'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${rule.active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/20'}`}>
                              #{rule.priority ?? '—'}
                            </div>
                            <div>
                              <p className="font-semibold text-white capitalize">{rule.stage || '—'} stage</p>
                              {rule.subject_template && (
                                <p className="text-xs text-white/50 mt-0.5">Subject: {rule.subject_template}</p>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${rule.active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-xs text-white/30 mb-0.5">No-Reply Window</p>
                            <p className="text-sm font-semibold text-white">{rule.min_no_reply_days}–{rule.max_no_reply_days} days</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-xs text-white/30 mb-0.5">Delay</p>
                            <p className="text-sm font-semibold text-white">{rule.delay_hours ?? '—'}h</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 text-center">
                            <p className="text-xs text-white/30 mb-0.5">Priority</p>
                            <p className="text-sm font-semibold text-cyan-400">{rule.priority ?? '—'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}