'use client';

import { useRicoData } from '@/hooks/useRicoData';
import { RicoChat } from '@/components/rico-chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/Sidebar';
import { ClipboardList, TrendingUp, AlertCircle, CheckCircle, Loader2, Activity } from 'lucide-react';

const RICO_AVATAR = 'https://szguizvpiiuiyugrjeks.supabase.co/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Rico.png';
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  signed: 'bg-blue-500/20 text-blue-400',
  active: 'bg-cyan-500/20 text-cyan-400',
  probation: 'bg-orange-500/20 text-orange-400',
  completed: 'bg-purple-500/20 text-purple-400',
};

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-white/10 text-white/50',
  qualified: 'bg-cyan-500/20 text-cyan-400',
  proposal: 'bg-purple-500/20 text-purple-400',
  negotiation: 'bg-yellow-500/20 text-yellow-400',
  closed: 'bg-green-500/20 text-green-400',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RicoPage() {
  const { workOrders, deals, loading, error } = useRicoData();

  const paidOrders = workOrders.filter((w) => w.status?.toLowerCase() === 'paid').length;
  const pendingOrders = workOrders.filter((w) => w.status?.toLowerCase() === 'pending').length;
  const openDeals = deals.filter((d) => d.stage !== 'closed').length;
  const highInterest = deals.filter((d) => d.interest_level === 'high').length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">

        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-cyan-500/40">
                <img src={RICO_AVATAR} alt="Rico" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Rico Dashboard</h2>
                <p className="text-sm text-white/50 mt-0.5">Technical Supervisor BGE • Fulfillment Operations</p>
              </div>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">Work Orders</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{loading ? '—' : workOrders.length}</div>
              <p className="text-xs text-white/30 mt-1">{pendingOrders} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">Paid Orders</span>
                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{loading ? '—' : paidOrders}</div>
              <p className="text-xs text-white/30 mt-1">Confirmed payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">Open Deals</span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{loading ? '—' : openDeals}</div>
              <p className="text-xs text-white/30 mt-1">In pipeline</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">High Interest</span>
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-orange-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{loading ? '—' : highInterest}</div>
              <p className="text-xs text-white/30 mt-1">Hot leads</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-cyan-400" />
                  Work Orders
                </CardTitle>
                <span className="text-xs text-white/30">{workOrders.length} total</span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : workOrders.length === 0 ? (
                <div className="py-12 text-center text-white/20 text-sm">No work orders found</div>
              ) : (
                <div className="space-y-3">
                  {workOrders.map((wo) => (
                    <div key={wo.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {wo.business_name || wo.client_name || 'Untitled'}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {wo.package || 'No package'} · {formatDate(wo.created_at)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge className={STATUS_COLORS[wo.status?.toLowerCase()] || 'bg-white/10 text-white/50'}>
                          {wo.status}
                        </Badge>
                        {wo.fulfillment_status && (
                          <p className="text-xs text-white/30 mt-1">{wo.fulfillment_status}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Pipeline
                </CardTitle>
                <span className="text-xs text-white/30">{deals.length} total</span>
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
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div key={deal.id} className="p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {deal.company || deal.lead_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5">{deal.source || 'Unknown source'}</p>
                        </div>
                        <Badge className={STAGE_COLORS[deal.stage || ''] || 'bg-white/10 text-white/50'}>
                          {deal.stage || 'unknown'}
                        </Badge>
                      </div>
                      {deal.interest_level && (
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${deal.interest_level === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/40'}`}>
                            {deal.interest_level} interest
                          </span>
                        </div>
                      )}
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