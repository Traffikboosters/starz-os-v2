'use client';
import React from 'react';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SteveChat } from '@/components/steve-chat';
import { TrendingUp, Users, Target, Flame, AlertCircle, Loader2, BarChart3, PieChart, Activity, FileText } from 'lucide-react';
import { getWorkOrders, getStatusColor, getPaymentStatusColor, type WorkOrder } from '@/lib/workOrders';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// WorkOrders state added via patch
const STEVE_AVATAR = 'https://szguizvpiiuiyugrjeks.supabase.co/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Steve.png';

interface PipelineDeal {
  id: string;
  company: string | null;
  lead_name: string | null;
  stage: string | null;
  interest_level: string | null;
  source: string | null;
  value: number | null;
  created_at: string;
  last_contacted_at: string | null;
  email: string | null;
  phone: string | null;
}

interface StageStats {
  stage: string;
  count: number;
  high_interest: number;
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-white/10 text-white/50',
  qualified: 'bg-cyan-500/20 text-cyan-400',
  engaged: 'bg-blue-500/20 text-blue-400',
  nurture: 'bg-yellow-500/20 text-yellow-400',
  closed_lost: 'bg-red-500/20 text-red-400',
  closed_won: 'bg-green-500/20 text-green-400',
};

const STAGE_BAR_COLORS: Record<string, string> = {
  new: 'bg-white/20',
  qualified: 'bg-cyan-500',
  engaged: 'bg-blue-500',
  nurture: 'bg-yellow-500',
  closed_lost: 'bg-red-500',
  closed_won: 'bg-green-500',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function BarChartComponent({ stageStats }: { stageStats: StageStats[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || stageStats.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();
    const colors = stageStats.map((s) => {
      const map: Record<string, string> = {
        qualified: '#06b6d4', engaged: '#3b82f6', new: 'rgba(255,255,255,0.3)',
        nurture: '#eab308', closed_lost: '#ef4444', closed_won: '#22c55e',
      };
      return map[s.stage] || 'rgba(255,255,255,0.2)';
    });
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: stageStats.map((s) => s.stage.replace('_', ' ')),
        datasets: [{ label: 'Deals', data: stageStats.map((s) => s.count), backgroundColor: colors, borderRadius: 8, borderSkipped: false }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', stepSize: 5 } },
          x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)' } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [stageStats]);

  return <canvas ref={canvasRef} />;
}

function DonutChartComponent({ deals }: { deals: PipelineDeal[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || deals.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();
    const high = deals.filter((d) => d.interest_level === 'high').length;
    const low = deals.filter((d) => d.interest_level !== 'high').length;
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['High Interest', 'Other'],
        datasets: [{ data: [high, low], backgroundColor: ['#f97316', 'rgba(255,255,255,0.1)'], borderColor: ['#ea580c', 'rgba(255,255,255,0.05)'], borderWidth: 2 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.5)', padding: 16, font: { size: 11 } } } },
        cutout: '70%',
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [deals]);

  return <canvas ref={canvasRef} />;
}

function LineChartComponent({ deals }: { deals: PipelineDeal[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || deals.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();
    const countsByDay: Record<string, number> = {};
    deals.forEach((d) => {
      const day = new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      countsByDay[day] = (countsByDay[day] || 0) + 1;
    });
    const sortedDays = Object.keys(countsByDay).slice(-14);
    const counts = sortedDays.map((d) => countsByDay[d]);
    const ctx = canvasRef.current.getContext('2d');
    const gradient = ctx!.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(6,182,212,0.3)');
    gradient.addColorStop(1, 'rgba(6,182,212,0)');
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: sortedDays,
        datasets: [{ label: 'Deals Added', data: counts, borderColor: '#06b6d4', backgroundColor: gradient, borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: '#06b6d4', pointRadius: 4, pointHoverRadius: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', stepSize: 1 } },
          x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', maxTicksLimit: 7 } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [deals]);

  return <canvas ref={canvasRef} />;
}


function SteveWorkOrders() {
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getWorkOrders().then((data) => {
      setWorkOrders(data.filter((wo) => wo.status === 'active' || wo.status === 'probation' || wo.status === 'fulfilled'));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="py-8 text-center text-white/30 text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>;
  if (workOrders.length === 0) return <div className="py-8 text-center text-white/20 text-sm">No closed deals converted to work orders yet</div>;

  return (
    <div className="space-y-2">
      {workOrders.map((wo) => (
        <div key={wo.id} className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{wo.business_name || wo.client_name}</p>
            <p className="text-xs text-white/40 mt-0.5">{wo.service || wo.project_type || 'Service'} · {wo.proposal_id || '—'}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(wo.status)}`}>{wo.status}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(wo.payment_status)}`}>{wo.payment_status || '—'}</span>
            <span className="text-sm text-white/60 font-medium">{wo.total_amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(wo.total_amount) : '—'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StevePage() {
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [stageStats, setStageStats] = useState<StageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .schema('deals')
          .from('pipeline')
          .select('id, company, lead_name, stage, interest_level, source, value, created_at, last_contacted_at, email, phone')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw new Error(error.message);
        setDeals(data || []);
        const statsMap: Record<string, StageStats> = {};
        (data || []).forEach((d) => {
          const s = d.stage || 'unknown';
          if (!statsMap[s]) statsMap[s] = { stage: s, count: 0, high_interest: 0 };
          statsMap[s].count++;
          if (d.interest_level === 'high') statsMap[s].high_interest++;
        });
        setStageStats(Object.values(statsMap).sort((a, b) => b.count - a.count));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const sub = supabase
      .channel('pipeline_steve')
      .on('postgres_changes', { event: '*', schema: 'deals', table: 'pipeline' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const totalDeals = deals.length;
  const highInterest = deals.filter((d) => d.interest_level === 'high').length;
  const qualified = deals.filter((d) => d.stage === 'qualified').length;
  const engaged = deals.filter((d) => d.stage === 'engaged').length;
  const hotLeads = deals.filter((d) => d.interest_level === 'high').slice(0, 5);
  const maxCount = Math.max(...stageStats.map((s) => s.count), 1);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">

        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-teal-500/40 shadow-[0_0_20px_rgba(20,184,166,0.4)]">
                <img src={STEVE_AVATAR} alt="Steve" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Steve BGE Dashboard</h2>
                <p className="text-sm text-white/50 mt-0.5">Business Growth Expert • Sales Operations</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs text-teal-400 font-medium">Sales Engine Active</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">Total Pipeline</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{loading ? '—' : totalDeals}</div>
              <p className="text-xs text-white/30 mt-1">Active deals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">High Interest</span>
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{loading ? '—' : highInterest}</div>
              <p className="text-xs text-white/30 mt-1">Hot leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">Qualified</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{loading ? '—' : qualified}</div>
              <p className="text-xs text-white/30 mt-1">Ready to close</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">Engaged</span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{loading ? '—' : engaged}</div>
              <p className="text-xs text-white/30 mt-1">In conversation</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Deals Added Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-white/30">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  <LineChartComponent deals={deals} />
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-orange-400" />
                Interest Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-white/30">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  <DonutChartComponent deals={deals} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Pipeline by Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-white/30">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  <BarChartComponent stageStats={stageStats} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Hot Leads
                </CardTitle>
                <span className="text-xs text-white/30">{highInterest} high interest</span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : hotLeads.length === 0 ? (
                <div className="py-12 text-center text-white/20 text-sm">No hot leads found</div>
              ) : (
                <div className="space-y-3">
                  {hotLeads.map((deal) => (
                    <div key={deal.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <Flame className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{deal.company || deal.lead_name || 'Unknown'}</p>
                        <p className="text-xs text-white/40 mt-0.5">{deal.source || 'outreach'}</p>
                      </div>
                      <Badge className={STAGE_COLORS[deal.stage || ''] || 'bg-white/10 text-white/50'}>
                        {deal.stage || 'unknown'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                Pipeline Stages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <div className="space-y-4">
                  {stageStats.map((s) => (
                    <div key={s.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white/70 capitalize">{s.stage.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          {s.high_interest > 0 && (
                            <span className="text-xs text-orange-400">{s.high_interest} hot</span>
                          )}
                          <span className="text-sm font-semibold text-white">{s.count}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${STAGE_BAR_COLORS[s.stage] || 'bg-white/20'}`}
                          style={{ width: `${(s.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  All Pipeline Deals
                </CardTitle>
                <span className="text-xs text-white/30">{totalDeals} total</span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : deals.length === 0 ? (
                <div className="py-12 text-center text-white/20 text-sm">No deals found</div>
              ) : (
                <div className="space-y-2">
                  {deals.map((deal) => (
                    <div key={deal.id} className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{deal.company || deal.lead_name || 'Unknown'}</p>
                        <p className="text-xs text-white/40 mt-0.5">{deal.email || 'No email'} · {deal.source || 'outreach'}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {deal.interest_level === 'high' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                        <Badge className={STAGE_COLORS[deal.stage || ''] || 'bg-white/10 text-white/50'}>
                          {deal.stage || 'unknown'}
                        </Badge>
                        <span className="text-xs text-white/30 w-24 text-right">{formatDate(deal.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        
          {/* Closed Deals - Work Orders */}
          <Card className="lg:col-span-3 mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  Closed Deals — Work Orders
                </CardTitle>
                <a href="/work-orders" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">View all →</a>
              </div>
            </CardHeader>
            <CardContent>
              <SteveWorkOrders />
            </CardContent>
          </Card>

        <SteveChat />
      </main>
    </div>
  );
}