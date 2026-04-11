'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RicoChat } from '@/components/rico-chat';
import {
  TrendingUp, Users, ClipboardList, Flame, AlertCircle,
  Loader2, Activity, CheckCircle, Clock, Target
} from 'lucide-react';

const RICO_AVATAR = 'https://szguizvpiiuiyugrjeks.supabase.co/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Rico.png';
const STEVE_AVATAR = 'https://szguizvpiiuiyugrjeks.supabase.co/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Steve.png';

interface Deal {
  id: string;
  company: string | null;
  lead_name: string | null;
  stage: string | null;
  interest_level: string | null;
  created_at: string;
}

interface WorkOrder {
  id: string;
  business_name: string | null;
  client_name: string | null;
  package: string | null;
  status: string;
  created_at: string;
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-white/10 text-white/50',
  qualified: 'bg-cyan-500/20 text-cyan-400',
  engaged: 'bg-blue-500/20 text-blue-400',
  nurture: 'bg-yellow-500/20 text-yellow-400',
  closed_lost: 'bg-red-500/20 text-red-400',
  closed_won: 'bg-green-500/20 text-green-400',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  signed: 'bg-blue-500/20 text-blue-400',
  active: 'bg-cyan-500/20 text-cyan-400',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [dealRes, woRes] = await Promise.all([
          supabase.schema('deals').from('pipeline')
            .select('id, company, lead_name, stage, interest_level, created_at')
            .order('created_at', { ascending: false }).limit(30),
          supabase.schema('deals').from('work_orders')
            .select('id, business_name, client_name, package, status, created_at')
            .order('created_at', { ascending: false }).limit(10),
        ]);
        if (dealRes.error) throw new Error(dealRes.error.message);
        if (woRes.error) throw new Error(woRes.error.message);
        setDeals(dealRes.data || []);
        setWorkOrders(woRes.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalDeals = deals.length;
  const highInterest = deals.filter((d) => d.interest_level === 'high').length;
  const qualified = deals.filter((d) => d.stage === 'qualified').length;
  const totalOrders = workOrders.length;
  const paidOrders = workOrders.filter((w) => w.status?.toLowerCase() === 'paid').length;
  const recentDeals = deals.slice(0, 6);
  const recentOrders = workOrders.slice(0, 5);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">STARZ-OS Command Center</h2>
              <p className="text-sm text-white/50 mt-0.5">AI-Powered Agency Operating System</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">All Systems Operational</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Agent Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                  <img src={STEVE_AVATAR} alt="Steve" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">Steve BGE</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400">Sales</span>
                  </div>
                  <p className="text-xs text-white/40">Business Growth Expert</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-white/60">{totalDeals} pipeline deals</span>
                    <span className="text-xs text-orange-400">{highInterest} hot leads</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-xs text-teal-400">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <img src={RICO_AVATAR} alt="Rico" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">Rico BGE</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">Operations</span>
                  </div>
                  <p className="text-xs text-white/40">Technical Supervisor</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-white/60">{totalOrders} work orders</span>
                    <span className="text-xs text-green-400">{paidOrders} paid</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs text-cyan-400">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Pipeline</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : totalDeals}</div>
              <p className="text-xs text-white/30 mt-1">Total deals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Hot Leads</span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : highInterest}</div>
              <p className="text-xs text-white/30 mt-1">High interest</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Qualified</span>
                <Target className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : qualified}</div>
              <p className="text-xs text-white/30 mt-1">Ready to close</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Work Orders</span>
                <ClipboardList className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : totalOrders}</div>
              <p className="text-xs text-white/30 mt-1">Total orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Paid</span>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : paidOrders}</div>
              <p className="text-xs text-white/30 mt-1">Confirmed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Pipeline */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  Recent Pipeline
                </CardTitle>
                <a href="/steve" className="text-xs text-white/30 hover:text-cyan-400 transition-colors">View all →</a>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {recentDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{deal.company || deal.lead_name || 'Unknown'}</p>
                        <p className="text-xs text-white/40">{formatDate(deal.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {deal.interest_level === 'high' && <Flame className="w-3 h-3 text-orange-400" />}
                        <Badge className={STAGE_COLORS[deal.stage || ''] || 'bg-white/10 text-white/50'}>
                          {deal.stage || 'new'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Work Orders */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-cyan-400" />
                  Recent Work Orders
                </CardTitle>
                <a href="/rico" className="text-xs text-white/30 hover:text-cyan-400 transition-colors">View all →</a>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((wo) => (
                    <div key={wo.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{wo.business_name || wo.client_name || 'Untitled'}</p>
                        <p className="text-xs text-white/40">{wo.package || 'No package'} · {formatDate(wo.created_at)}</p>
                      </div>
                      <Badge className={STATUS_COLORS[wo.status?.toLowerCase()] || 'bg-white/10 text-white/50'}>
                        {wo.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
      <RicoChat />
    </div>
  );
}