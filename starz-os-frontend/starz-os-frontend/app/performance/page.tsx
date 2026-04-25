'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3, TrendingUp, DollarSign, Users, Phone,
  RefreshCw, Loader2, AlertTriangle, CheckCircle,
  Target, Zap, Activity, Calendar, Award
} from 'lucide-react';

interface DailyRevenue {
  date: string;
  revenue: number | null;
}

interface AgentKPI {
  id: string;
  tenant_id: string;
  agent_id: string;
  period_start: string;
  period_end: string;
  calls_total: number | null;
  calls_connected: number | null;
  avg_talk_time: number | null;
  conversion_rate: number | null;
  sentiment_score: number | null;
  created_at: string;
}

interface LeadMetrics {
  tenant_id: string;
  date: string;
  leads_created: number | null;
  leads_contacted: number | null;
  chatbot_replies: number | null;
  calls_completed: number | null;
  deals_closed: number | null;
  conversion_rate: number | null;
}

type Tab = 'revenue' | 'agents' | 'leads';

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCurrency(n: number | null) {
  if (!n) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number | null) {
  if (n === null || n === undefined) return '—';
  return `${(Number(n) * 100).toFixed(1)}%`;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-white/10 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/40 w-8 text-right">{value}</span>
    </div>
  );
}

function AlertBadge({ active, label }: { active: boolean | null; label: string }) {
  if (!active) return null;
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs">
      <AlertTriangle className="w-3 h-3" />{label}
    </span>
  );
}

export default function PerformanceReporting() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('revenue');
  const [revenue, setRevenue] = useState<DailyRevenue[]>([]);
  const [agentKPIs, setAgentKPIs] = useState<AgentKPI[]>([]);
  const [leadMetrics, setLeadMetrics] = useState<LeadMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (t: Tab) => {
    setLoading(true); setError(null);
    try {
      if (t === 'revenue') {
        const { data, error } = await supabase.schema('analytics').from('daily_revenue')
          .select('*').order('date', { ascending: false }).limit(90);
        if (error) throw error;
        setRevenue((data || []) as DailyRevenue[]);
      } else if (t === 'agents') {
        const { data, error } = await supabase.schema('analytics').from('agent_kpi_snapshots')
          .select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        setAgentKPIs((data || []) as AgentKPI[]);
      } else if (t === 'leads') {
        const { data, error } = await supabase.schema('analytics').from('lead_metrics_daily')
          .select('*').order('date', { ascending: false }).limit(90);
        if (error) throw error;
        setLeadMetrics((data || []) as LeadMetrics[]);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(tab); }, [tab]);

  const totalRevenue = revenue.reduce((a, b) => a + Number(b.revenue || 0), 0);
  const avgDailyRevenue = revenue.length ? totalRevenue / revenue.length : 0;
  const totalLeads = leadMetrics.reduce((a, b) => a + (b.leads_created || 0), 0);
  const totalDeals = leadMetrics.reduce((a, b) => a + (b.deals_closed || 0), 0);
  const avgConversion = leadMetrics.length
    ? (leadMetrics.reduce((a, b) => a + Number(b.conversion_rate || 0), 0) / leadMetrics.length * 100).toFixed(1)
    : '0';

  const maxRevenue = Math.max(...revenue.map(r => Number(r.revenue || 0)), 1);
  const maxLeads = Math.max(...leadMetrics.map(l => l.leads_created || 0), 1);

  const tabs: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign, count: revenue.length },
    { id: 'agents', label: 'Agent KPIs', icon: Users, count: agentKPIs.length },
    { id: 'leads', label: 'Lead Metrics', icon: Target, count: leadMetrics.length },
  ];

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Performance & Reporting Engine</h1>
              <p className="text-sm text-white/40">KPIs + Analytics - real-time dashboards, ROI tracking, agent performance</p>
            </div>
            <div className="ml-auto">
              <button onClick={() => loadData(tab)} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Top Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Revenue (90d)', value: fmtCurrency(totalRevenue), color: 'text-green-400', icon: DollarSign },
              { label: 'Avg Daily Revenue', value: fmtCurrency(avgDailyRevenue), color: 'text-cyan-400', icon: TrendingUp },
              { label: 'Total Leads (90d)', value: totalLeads.toLocaleString(), color: 'text-purple-400', icon: Users },
              { label: 'Avg Conversion', value: `${avgConversion}%`, color: 'text-orange-400', icon: Target },
            ].map(({ label, value, color, icon: Icon }) => (
              <Card key={label} className="bg-gray-900 border-white/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${color} opacity-60 shrink-0`} />
                  <div>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-white/30">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-white/10">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                  tab === id ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/40 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />{label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${tab === id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'}`}>{count}</span>
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
              <Loader2 className="w-5 h-5 animate-spin" />Loading performance data...
            </div>
          ) : (
            <>
              {/* REVENUE */}
              {tab === 'revenue' && (
                <div className="flex flex-col gap-5">
                  {revenue.length === 0 ? (
                    <div className="py-20 text-center text-white/20">
                      <div className="flex flex-col items-center gap-3">
                        <DollarSign className="w-12 h-12 text-white/10" />
                        <p>No revenue data yet</p>
                        <p className="text-xs text-white/10">Revenue is tracked automatically as deals are closed</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Revenue Chart */}
                      <Card className="bg-gray-900 border-white/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            Daily Revenue — Last {revenue.length} Days
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end gap-1 h-32">
                            {revenue.slice(0, 60).reverse().map((r, i) => {
                              const pct = maxRevenue > 0 ? (Number(r.revenue || 0) / maxRevenue) * 100 : 0;
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                  <div className="absolute bottom-full mb-1 bg-gray-800 border border-white/10 rounded px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {fmt(r.date)}: {fmtCurrency(Number(r.revenue || 0))}
                                  </div>
                                  <div className="w-full bg-green-400/20 rounded-sm hover:bg-green-400/40 transition-colors cursor-pointer"
                                    style={{ height: `${Math.max(pct, 2)}%` }} />
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-xs text-white/20 mt-2">
                            <span>{fmt(revenue[revenue.length - 1]?.date)}</span>
                            <span>{fmt(revenue[0]?.date)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Revenue Table */}
                      <Card className="bg-gray-900 border-white/10">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Revenue</th>
                                <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Bar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {revenue.slice(0, 30).map((r, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                  <td className="px-4 py-2.5 text-sm text-white/70">{fmt(r.date)}</td>
                                  <td className="px-4 py-2.5 font-bold text-green-400">{fmtCurrency(Number(r.revenue || 0))}</td>
                                  <td className="px-4 py-2.5 w-48">
                                    <MiniBar value={Number(r.revenue || 0)} max={maxRevenue} color="bg-green-400" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </>
                  )}
                </div>
              )}

              {/* AGENT KPIs */}
              {tab === 'agents' && (
                <div>
                  {agentKPIs.length === 0 ? (
                    <div className="py-20 text-center text-white/20">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-white/10" />
                        <p>No agent KPI data yet</p>
                        <p className="text-xs text-white/10">Agent performance is tracked automatically from call activity</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {agentKPIs.map(kpi => (
                        <Card key={kpi.id} className="bg-gray-900 border-white/10 hover:border-blue-500/30 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-400" />
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-white/30">{fmt(kpi.period_start)} - {fmt(kpi.period_end)}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {[
                                { label: 'Calls Total', value: kpi.calls_total?.toLocaleString() || '0', color: 'text-white' },
                                { label: 'Connected', value: kpi.calls_connected?.toLocaleString() || '0', color: 'text-cyan-400' },
                                { label: 'Conversion', value: fmtPct(kpi.conversion_rate), color: 'text-green-400' },
                                { label: 'Sentiment', value: kpi.sentiment_score ? `${(Number(kpi.sentiment_score) * 100).toFixed(0)}%` : '—', color: 'text-purple-400' },
                              ].map(({ label, value, color }) => (
                                <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
                                  <p className={`text-base font-bold ${color}`}>{value}</p>
                                  <p className="text-xs text-white/30">{label}</p>
                                </div>
                              ))}
                            </div>
                            {kpi.avg_talk_time && (
                              <p className="text-xs text-white/30">Avg Talk Time: <span className="text-white/60">{Math.round(Number(kpi.avg_talk_time))}s</span></p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* LEAD METRICS */}
              {tab === 'leads' && (
                <div className="flex flex-col gap-5">
                  {leadMetrics.length === 0 ? (
                    <div className="py-20 text-center text-white/20">
                      <div className="flex flex-col items-center gap-3">
                        <Target className="w-12 h-12 text-white/10" />
                        <p>No lead metrics yet</p>
                        <p className="text-xs text-white/10">Lead metrics populate daily as the outreach engine runs</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Total Created', value: totalLeads.toLocaleString(), color: 'text-purple-400' },
                          { label: 'Total Contacted', value: leadMetrics.reduce((a, b) => a + (b.leads_contacted || 0), 0).toLocaleString(), color: 'text-cyan-400' },
                          { label: 'Deals Closed', value: totalDeals.toLocaleString(), color: 'text-green-400' },
                          { label: 'Avg Conversion', value: `${avgConversion}%`, color: 'text-orange-400' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                            <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-white/30 mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>

                      <Card className="bg-gray-900 border-white/10">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Created</th>
                                <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Contacted</th>
                                <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Chatbot</th>
                                <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Calls</th>
                                <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Closed</th>
                                <th className="px-4 py-3 text-left text-xs text-white/30 uppercase tracking-wider">Conv %</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leadMetrics.slice(0, 30).map((m, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                  <td className="px-4 py-2.5 text-sm text-white/70">{fmt(m.date)}</td>
                                  <td className="px-4 py-2.5 text-sm text-purple-400 font-semibold">{m.leads_created ?? 0}</td>
                                  <td className="px-4 py-2.5 text-sm text-cyan-400">{m.leads_contacted ?? 0}</td>
                                  <td className="px-4 py-2.5 text-sm text-blue-400">{m.chatbot_replies ?? 0}</td>
                                  <td className="px-4 py-2.5 text-sm text-white/60">{m.calls_completed ?? 0}</td>
                                  <td className="px-4 py-2.5 text-sm text-green-400 font-semibold">{m.deals_closed ?? 0}</td>
                                  <td className="px-4 py-2.5 text-sm text-orange-400">{fmtPct(m.conversion_rate)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}