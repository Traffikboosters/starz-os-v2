'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Star, Globe, Phone, Mail, TrendingUp, AlertCircle, Loader2, Search, Flame } from 'lucide-react';

interface Lead {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  status: string | null;
  score: number | null;
  lead_score: number | null;
  industry: string | null;
  source: string | null;
  seo_score: number | null;
  website_quality_score: number | null;
  google_rating: number | null;
  google_reviews: number | null;
  targeting_status: string | null;
  created_at: string;
  last_contacted_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-white/10 text-white/50',
  contacted: 'bg-blue-500/20 text-blue-400',
  qualified: 'bg-cyan-500/20 text-cyan-400',
  converted: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
  nurture: 'bg-yellow-500/20 text-yellow-400',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ScoreBar({ value, max = 100, color = 'bg-cyan-500' }: { value: number | null; max?: number; color?: string }) {
  if (!value) return <span className="text-white/20 text-xs">N/A</span>;
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/50">{value}</span>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .schema('crm')
          .from('leads')
          .select('id, company_name, contact_name, name, email, phone, business_name, status, score, lead_score, industry, source, seo_score, website_quality_score, google_rating, google_reviews, targeting_status, created_at, last_contacted_at')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw new Error(error.message);
        setLeads(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const sub = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'crm', table: 'leads' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const filtered = leads.filter((l) => {
    const matchSearch = !search || [l.company_name, l.business_name, l.contact_name, l.name, l.email]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalLeads = leads.length;
  const highScore = leads.filter((l) => (l.lead_score || l.score || 0) >= 70).length;
  const contacted = leads.filter((l) => l.status === 'contacted').length;
  const converted = leads.filter((l) => l.status === 'converted').length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">

        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Leads Database</h2>
              <p className="text-sm text-white/50 mt-0.5">CRM • Live from Supabase</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400 font-medium">{totalLeads} total leads</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Total Leads</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : totalLeads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">High Score</span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : highScore}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Contacted</span>
                <Phone className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : contacted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Converted</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : converted}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                All Leads
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500/50 w-48"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="nurture">Nurture</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-white/30">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading leads...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-white/20 text-sm">No leads found</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {lead.company_name || lead.business_name || lead.contact_name || lead.name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {lead.email && <span className="text-xs text-white/40 flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                        {lead.phone && <span className="text-xs text-white/40 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        {lead.industry && <span className="text-xs text-white/30">{lead.industry}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden md:block">
                        <p className="text-xs text-white/30 mb-1">Lead Score</p>
                        <ScoreBar value={lead.lead_score || lead.score} color="bg-cyan-500" />
                      </div>
                      <div className="hidden md:block">
                        <p className="text-xs text-white/30 mb-1">SEO</p>
                        <ScoreBar value={lead.seo_score} color="bg-purple-500" />
                      </div>
                      <div className="text-right">
                        <Badge className={STATUS_COLORS[lead.status || ''] || 'bg-white/10 text-white/50'}>
                          {lead.status || 'new'}
                        </Badge>
                        <p className="text-xs text-white/20 mt-1">{formatDate(lead.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}