'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/context/AuthProvider';
import { Phone, PhoneCall, PhoneOff, Users, Clock, AlertCircle, Loader2, ChevronRight, ChevronLeft, Star, Globe, Mail, Plus, CheckCircle, XCircle, Voicemail } from 'lucide-react';

const STEVE_AVATAR = 'https://szguizvpiiuiyugrjeks.supabase.co/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Steve.png';

interface Lead {
  id: string;
  company_name: string | null;
  business_name: string | null;
  contact_name: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  lead_score: number | null;
  score: number | null;
  google_rating: number | null;
  google_reviews: number | null;
  personalized_opening: string | null;
  inferred_pain_points: string[] | null;
  website_url: string | null;
}

interface QueueEntry {
  id: string;
  name: string | null;
  phone: string | null;
  status: string | null;
  priority: number | null;
  attempts: number | null;
  assigned_bge: string | null;
  created_at: string;
}

interface DialerCall {
  id: string;
  phone: string | null;
  call_status: string | null;
  duration: number | null;
  transcript: string | null;
  dialpad_call_id: string | null;
  recording_url: string | null;
  status: string | null;
  created_at: string;
}

const QUEUE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  calling: 'bg-green-500/20 text-green-400',
  completed: 'bg-blue-500/20 text-blue-400',
  failed: 'bg-red-500/20 text-red-400',
  skipped: 'bg-white/10 text-white/40',
};

const CALL_STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400',
  'no-answer': 'bg-red-500/20 text-red-400',
  voicemail: 'bg-blue-500/20 text-blue-400',
  busy: 'bg-orange-500/20 text-orange-400',
  dialing: 'bg-yellow-500/20 text-yellow-400',
};

function formatDuration(seconds: number | null) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function PowerDialPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [dialerCalls, setDialerCalls] = useState<DialerCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'dialer' | 'queue' | 'calls'>('dialer');
  const [logOutcome, setLogOutcome] = useState<string | null>(null);
  const [logNotes, setLogNotes] = useState('');
  const [logging, setLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);
  const [calling, setCalling] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [leadRes, queueRes, callRes] = await Promise.all([
          supabase.schema('crm').from('leads')
            .select('id, company_name, business_name, contact_name, name, phone, email, industry, lead_score, score, google_rating, google_reviews, personalized_opening, inferred_pain_points, website_url')
            .not('phone', 'is', null)
            .order('lead_score', { ascending: false, nullsFirst: false })
            .limit(100),
          supabase.schema('dialer').from('call_queue')
            .select('id, name, phone, status, priority, attempts, assigned_bge, created_at')
            .order('priority', { ascending: false })
            .limit(50),
          supabase.schema('dialer').from('calls')
            .select('id, phone, call_status, duration, transcript, dialpad_call_id, recording_url, status, created_at')
            .order('created_at', { ascending: false })
            .limit(30),
        ]);
        if (leadRes.error) throw new Error(leadRes.error.message);
        setLeads(leadRes.data || []);
        setQueue(queueRes.data || []);
        setDialerCalls(callRes.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const qSub = supabase.channel('q_rt').on('postgres_changes', { event: '*', schema: 'dialer', table: 'call_queue' }, fetchData).subscribe();
    const cSub = supabase.channel('c_rt').on('postgres_changes', { event: '*', schema: 'dialer', table: 'calls' }, fetchData).subscribe();
    return () => { supabase.removeChannel(qSub); supabase.removeChannel(cSub); };
  }, []);

  const currentLead = leads[currentIndex];
  const pendingQueue = queue.filter((q) => q.status === 'pending').length;
  const completedCalls = dialerCalls.filter((c) => c.call_status === 'completed').length;

  async function addToQueue() {
    if (!currentLead) return;
    const supabase = createClient();
    await supabase.schema('dialer').from('call_queue').insert({
      name: currentLead.company_name || currentLead.business_name || currentLead.name || 'Unknown',
      phone: currentLead.phone,
      priority: currentLead.lead_score || currentLead.score || 50,
      status: 'pending',
      assigned_bge: user?.email || 'unassigned',
      attempts: 0,
    });
  }

  async function initiateCall() {
    if (!currentLead || calling) return;
    setCalling(true);
    setCallError(null);
    addToQueue();
    try {
      const res = await fetch('/api/dialpad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentLead.phone,
          leadName: currentLead.company_name || currentLead.business_name || currentLead.name,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setCallError(data.error || 'Call failed');
      }
    } catch (err: any) {
      setCallError(err.message);
    } finally {
      setCalling(false);
    }
  }

  async function logCall() {
    if (!currentLead || !logOutcome) return;
    setLogging(true);
    const supabase = createClient();
    await supabase.schema('dialer').from('calls').insert({
      phone: currentLead.phone,
      call_status: logOutcome,
      status: logOutcome,
      duration: 0,
    });
    await supabase.schema('crm').from('calls').insert({
      lead_id: currentLead.id,
      status: 'completed',
      outcome: logOutcome,
      notes: logNotes,
      started_at: new Date().toISOString(),
    });
    setLogOutcome(null);
    setLogNotes('');
    setLogging(false);
    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 2000);
  }

  async function updateQueueStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.schema('dialer').from('call_queue').update({ status }).eq('id', id);
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">

        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-teal-500/40">
                <img src={STEVE_AVATAR} alt="Steve" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">PowerDial</h2>
                <p className="text-sm text-white/50 mt-0.5">Steve BGE • Dialpad Integration</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs text-teal-400 font-medium">{leads.length} leads ready</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {callError && (
          <div className="mb-6 flex items-center gap-2 text-orange-400 bg-orange-400/10 border border-orange-400/20 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Call error: {callError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Leads Ready</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : leads.length}</div>
              <p className="text-xs text-white/30 mt-1">With phone numbers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Queue</span>
                <Phone className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : pendingQueue}</div>
              <p className="text-xs text-white/30 mt-1">Pending calls</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Completed</span>
                <PhoneCall className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : completedCalls}</div>
              <p className="text-xs text-white/30 mt-1">Calls logged</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Total Calls</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : dialerCalls.length}</div>
              <p className="text-xs text-white/30 mt-1">In Dialpad log</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-6">
          {(['dialer', 'queue', 'calls'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/10'}`}>
              {tab === 'dialer' ? 'Dialer' : tab === 'queue' ? `Queue (${queue.length})` : `Call Log (${dialerCalls.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'dialer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-teal-400" />
                    Current Target
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30">{currentIndex + 1} / {leads.length}</span>
                    <button onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))} disabled={currentIndex === 0} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={() => setCurrentIndex((i) => Math.min(i + 1, leads.length - 1))} disabled={currentIndex === leads.length - 1} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-white/30">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading leads...
                  </div>
                ) : !currentLead ? (
                  <div className="py-12 text-center text-white/20">No leads found</div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {currentLead.company_name || currentLead.business_name || currentLead.contact_name || currentLead.name || 'Unknown'}
                          </h3>
                          {currentLead.industry && <p className="text-sm text-white/40 mt-0.5">{currentLead.industry}</p>}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-cyan-400">{currentLead.lead_score || currentLead.score || 0}</div>
                          <div className="text-xs text-white/30">Lead Score</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {currentLead.phone && (
                          <div className="flex items-center gap-2 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                            <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                            <span className="text-white font-mono text-sm">{currentLead.phone}</span>
                          </div>
                        )}
                        {currentLead.email && (
                          <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                            <Mail className="w-4 h-4 text-white/40 flex-shrink-0" />
                            <span className="text-white/60 text-sm truncate">{currentLead.email}</span>
                          </div>
                        )}
                        {currentLead.website_url && (
                          <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                            <Globe className="w-4 h-4 text-white/40 flex-shrink-0" />
                            <span className="text-white/60 text-sm truncate">{currentLead.website_url}</span>
                          </div>
                        )}
                        {currentLead.google_rating && (
                          <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                            <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            <span className="text-white/60 text-sm">{currentLead.google_rating} ({currentLead.google_reviews} reviews)</span>
                          </div>
                        )}
                      </div>
                      {currentLead.personalized_opening && (
                        <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <img src={STEVE_AVATAR} alt="Steve" className="w-5 h-5 rounded-full object-cover" />
                            <span className="text-xs text-teal-400 font-medium">Steve's Opening Line</span>
                          </div>
                          <p className="text-sm text-white/70 italic">"{currentLead.personalized_opening}"</p>
                        </div>
                      )}
                      {currentLead.inferred_pain_points && currentLead.inferred_pain_points.length > 0 && (
                        <div>
                          <p className="text-xs text-white/30 mb-2">Pain Points</p>
                          <div className="flex flex-wrap gap-2">
                            {currentLead.inferred_pain_points.map((p, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={initiateCall}
                        disabled={calling}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 transition-colors text-white font-semibold text-sm"
                      >
                        {calling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                        {calling ? 'Connecting...' : 'Call via PowerDial'}
                      </button>
                      <button onClick={addToQueue}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white/70 text-sm">
                        <Plus className="w-4 h-4" />
                        Add to Queue
                      </button>
                    </div>

                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <p className="text-xs text-white/40 mb-3">Log Call Outcome</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          { value: 'interested', label: 'Interested', icon: CheckCircle, color: 'text-green-400 border-green-500/30 bg-green-500/10' },
                          { value: 'callback', label: 'Callback', icon: Clock, color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
                          { value: 'voicemail', label: 'Voicemail', icon: Voicemail, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
                          { value: 'no-answer', label: 'No Answer', icon: PhoneOff, color: 'text-white/40 border-white/10 bg-white/5' },
                          { value: 'not_interested', label: 'Not Interested', icon: XCircle, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
                        ].map((o) => (
                          <button key={o.value} onClick={() => setLogOutcome(o.value)}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${o.color} ${logOutcome === o.value ? 'ring-2 ring-white/20' : ''}`}>
                            <o.icon className="w-3 h-3" />
                            {o.label}
                          </button>
                        ))}
                      </div>
                      <textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)}
                        placeholder="Add call notes..." rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-500/50 resize-none mb-3" />
                      <button onClick={logCall} disabled={!logOutcome || logging}
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : logSuccess ? <CheckCircle className="w-4 h-4 text-green-400" /> : null}
                        {logging ? 'Logging...' : logSuccess ? 'Logged!' : 'Log Call to CRM'}
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-yellow-400" />
                  Call Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {queue.length === 0 ? (
                  <div className="py-8 text-center text-white/20 text-sm">Queue is empty</div>
                ) : (
                  <div className="space-y-2">
                    {queue.slice(0, 10).map((q) => (
                      <div key={q.id} className="p-3 bg-white/[0.02] rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-white truncate">{q.name || 'Unknown'}</p>
                          <Badge className={QUEUE_STATUS_COLORS[q.status || ''] || 'bg-white/10 text-white/40'}>{q.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40 font-mono">{q.phone}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/30">{q.attempts || 0} attempts</span>
                            {q.status === 'pending' && (
                              <button onClick={() => updateQueueStatus(q.id, 'completed')} className="text-xs text-green-400 hover:text-green-300">Done</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'queue' && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-yellow-400" />
                Full Call Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="py-12 text-center text-white/20">Queue is empty</div>
              ) : (
                <div className="space-y-2">
                  {queue.map((q) => (
                    <div key={q.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{q.name || 'Unknown'}</p>
                        <p className="text-xs text-white/40 mt-0.5 font-mono">{q.phone} · BGE: {q.assigned_bge || 'Unassigned'}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-white/30">{q.attempts || 0} attempts</span>
                        <Badge className={QUEUE_STATUS_COLORS[q.status || ''] || 'bg-white/10 text-white/40'}>{q.status}</Badge>
                        {q.status === 'pending' && (
                          <button onClick={() => updateQueueStatus(q.id, 'completed')} className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'calls' && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-cyan-400" />
                Dialpad Call Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dialerCalls.length === 0 ? (
                <div className="py-12 text-center text-white/20">No calls logged yet</div>
              ) : (
                <div className="space-y-3">
                  {dialerCalls.map((call) => (
                    <div key={call.id} className="p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <Badge className={CALL_STATUS_COLORS[call.call_status || call.status || ''] || 'bg-white/10 text-white/40'}>
                              {call.call_status || call.status || 'unknown'}
                            </Badge>
                            <span className="text-xs text-white/40 font-mono">{call.phone}</span>
                            {call.dialpad_call_id && (
                              <span className="text-xs text-white/20">ID: {call.dialpad_call_id}</span>
                            )}
                          </div>
                          {call.transcript && <p className="text-xs text-white/40 line-clamp-2">{call.transcript}</p>}
                          {call.recording_url && (
                            <a href={call.recording_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 inline-block">
                              Play Recording
                            </a>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-white/30">{formatDuration(call.duration)}</p>
                          <p className="text-xs text-white/20 mt-1">{formatTime(call.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}