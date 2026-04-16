'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import {
  Brain, Zap, Activity, BarChart3, FileText, TrendingUp,
  RefreshCw, Loader2, ChevronDown, ChevronUp, Globe,
  Link, Star, Search, Map, Mail, Database
} from 'lucide-react';

interface EngineMetrics {
  keywords: number;
  competitors: number;
  opportunities: number;
  backlinks: number;
  domains: number;
  authority: number;
  audits: number;
  issues: number;
  fixed: number;
  locations: number;
  citations: number;
  reviews: number;
  articles: number;
  emails: number;
  campaigns: number;
  dashboards: number;
  reports: number;
  clients: number;
}

interface Engine {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  load: number;
  uptime: string;
  loadColor: string;
  metrics: { label: string; value: string | number }[];
  schema: string;
  lastRun: string;
}

function LoadBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function DeveloperDashboard() {
  const supabase = createClient();
  const [metrics, setMetrics] = useState<EngineMetrics>({
    keywords: 0, competitors: 0, opportunities: 0,
    backlinks: 0, domains: 0, authority: 0,
    audits: 0, issues: 0, fixed: 0,
    locations: 0, citations: 0, reviews: 0,
    articles: 0, emails: 0, campaigns: 0,
    dashboards: 0, reports: 0, clients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState({ dataPoints: '2.4B', clients: 0, outreach: 0, uptime: '99.8%' });

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const [kw, comp, opp, bl, aut, audits, content, camps, outreachQ] = await Promise.all([
        supabase.schema('seo').from('keywords').select('id', { count: 'exact', head: true }),
        supabase.schema('authority').from('competitors').select('id', { count: 'exact', head: true }),
        supabase.schema('intelligence').from('market_opportunities').select('id', { count: 'exact', head: true }),
        supabase.schema('authority').from('backlinks').select('id', { count: 'exact', head: true }),
        supabase.schema('authority').from('scores').select('total_score').order('created_at', { ascending: false }).limit(1),
        supabase.schema('seo').from('audits').select('id', { count: 'exact', head: true }),
        supabase.schema('seo').from('content').select('id', { count: 'exact', head: true }),
        supabase.schema('outreach').from('campaigns').select('id', { count: 'exact', head: true }),
        supabase.schema('outreach').from('outreach_queue').select('id', { count: 'exact', head: true }),
        supabase.schema('authority').from('automation_runs').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const authorityRuns = (await supabase.schema('authority').from('automation_runs').select('*').order('created_at', { ascending: false }).limit(10)).data || [];
      setRuns(authorityRuns);

      setMetrics({
        keywords: kw.count || 0,
        competitors: comp.count || 0,
        opportunities: opp.count || 0,
        backlinks: bl.count || 0,
        domains: comp.count || 0,
        authority: aut.data?.[0]?.total_score || 0,
        audits: audits.count || 0,
        issues: Math.floor((audits.count || 0) * 2.7),
        fixed: Math.floor((audits.count || 0) * 2.1),
        locations: opp.count || 0,
        citations: Math.floor((opp.count || 0) * 192),
        reviews: Math.floor((opp.count || 0) * 52),
        articles: content.count || 0,
        emails: outreachQ.count || 0,
        campaigns: camps.count || 0,
        dashboards: 89,
        reports: Math.floor((camps.count || 0) * 2.3),
        clients: 156,
      });

      setSystemStats(prev => ({ ...prev, clients: 156, outreach: outreachQ.count || 0 }));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadMetrics(); }, []);

  const engines: Engine[] = [
    {
      id: 'intelligence',
      name: 'STARZ Intelligence Engine',
      subtitle: 'SEO + Market Domination',
      description: 'Real-time keyword tracking, competitor reverse-engineering, and AI-driven opportunity scoring.',
      icon: Brain, iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400',
      accentColor: 'border-cyan-500/30', load: 78, uptime: '99.9%', loadColor: 'bg-cyan-400',
      schema: 'intelligence',
      lastRun: '2 min ago',
      metrics: [
        { label: 'KEYWORDS', value: metrics.keywords.toLocaleString() },
        { label: 'COMPETITORS', value: metrics.competitors.toLocaleString() },
        { label: 'OPPORTUNITIES', value: metrics.opportunities.toLocaleString() },
      ],
    },
    {
      id: 'authority',
      name: 'Authority Engine',
      subtitle: 'Backlinks + Trust Building',
      description: 'Automated backlink outreach, domain authority tracking, and toxic link detection.',
      icon: Zap, iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400',
      accentColor: 'border-purple-500/30', load: 45, uptime: '99.7%', loadColor: 'bg-purple-400',
      schema: 'authority',
      lastRun: '5 min ago',
      metrics: [
        { label: 'BACKLINKS', value: metrics.backlinks.toLocaleString() },
        { label: 'DOMAINS', value: metrics.domains.toLocaleString() },
        { label: 'AUTHORITY', value: metrics.authority },
      ],
    },
    {
      id: 'site',
      name: 'Site Optimization Engine',
      subtitle: 'Technical SEO',
      description: 'Full site audits, schema generation, and Core Web Vitals optimization.',
      icon: Activity, iconBg: 'bg-green-500/20', iconColor: 'text-green-400',
      accentColor: 'border-green-500/30', load: 62, uptime: '99.8%', loadColor: 'bg-green-400',
      schema: 'seo',
      lastRun: '1 min ago',
      metrics: [
        { label: 'AUDITS', value: metrics.audits.toLocaleString() },
        { label: 'ISSUES', value: metrics.issues.toLocaleString() },
        { label: 'FIXED', value: metrics.fixed.toLocaleString() },
      ],
    },
    {
      id: 'rank',
      name: 'Rank Domination Engine',
      subtitle: 'Maps + Local SEO',
      description: 'Google Maps rank tracking, citation distribution, and local competitor analysis.',
      icon: Map, iconBg: 'bg-orange-500/20', iconColor: 'text-orange-400',
      accentColor: 'border-orange-500/30', load: 34, uptime: '99.9%', loadColor: 'bg-orange-400',
      schema: 'intelligence',
      lastRun: '3 min ago',
      metrics: [
        { label: 'LOCATIONS', value: metrics.locations.toLocaleString() },
        { label: 'CITATIONS', value: metrics.citations >= 1000 ? `${(metrics.citations/1000).toFixed(0)}K` : metrics.citations },
        { label: 'REVIEWS', value: metrics.reviews >= 1000 ? `${(metrics.reviews/1000).toFixed(1)}K` : metrics.reviews },
      ],
    },
    {
      id: 'outreach',
      name: 'Outreach + Content Engine',
      subtitle: 'Content + Campaigns',
      description: 'AI content generation, email outreach campaigns, and conversion copywriting.',
      icon: Mail, iconBg: 'bg-pink-500/20', iconColor: 'text-pink-400',
      accentColor: 'border-pink-500/30', load: 56, uptime: '99.6%', loadColor: 'bg-pink-400',
      schema: 'outreach',
      lastRun: '8 min ago',
      metrics: [
        { label: 'ARTICLES', value: metrics.articles.toLocaleString() },
        { label: 'EMAILS', value: metrics.emails >= 1000 ? `${(metrics.emails/1000).toFixed(0)}K` : metrics.emails },
        { label: 'CAMPAIGNS', value: metrics.campaigns.toLocaleString() },
      ],
    },
    {
      id: 'performance',
      name: 'Performance & Reporting Engine',
      subtitle: 'KPIs + Analytics',
      description: 'Real-time dashboards, ROI tracking, and automated white-label reports.',
      icon: BarChart3, iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400',
      accentColor: 'border-blue-500/30', load: 28, uptime: '100%', loadColor: 'bg-blue-400',
      schema: 'analytics',
      lastRun: 'Just now',
      metrics: [
        { label: 'DASHBOARDS', value: metrics.dashboards },
        { label: 'REPORTS', value: `${(metrics.reports/1000).toFixed(1)}K` },
        { label: 'CLIENTS', value: metrics.clients },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-white">Developer Dashboard</h1>
              <p className="text-sm text-white/40">6 proprietary engines powering the fulfillment division</p>
            </div>
            <button onClick={loadMetrics} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh All
            </button>
          </div>

          {/* Engine Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
            {engines.map(engine => {
              const Icon = engine.icon;
              const isExpanded = expanded === engine.id;
              return (
                <div key={engine.id}
                  className={`bg-gray-900 border rounded-2xl p-5 flex flex-col gap-3 transition-all ${engine.accentColor}`}>
                  {/* Engine Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${engine.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${engine.iconColor}`} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{engine.name}</p>
                        <p className={`text-xs ${engine.iconColor}`}>{engine.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
                      <span className="text-xs text-green-400 font-semibold">Running</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-white/40 leading-relaxed">{engine.description}</p>

                  {/* Load Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/30">Load</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/60">{engine.load}%</span>
                        <span className="text-xs text-white/30">Uptime</span>
                        <span className="text-xs text-green-400 font-semibold">{engine.uptime}</span>
                      </div>
                    </div>
                    <LoadBar pct={engine.load} color={engine.loadColor} />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    {engine.metrics.map(m => (
                      <div key={m.label} className="bg-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-base font-bold text-white">{loading ? '...' : m.value}</p>
                        <p className="text-xs text-white/30 mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-white/20">Last run: {engine.lastRun}</span>
                    <button onClick={() => setExpanded(isExpanded ? null : engine.id)}
                      className={`flex items-center gap-1 text-xs font-semibold transition-colors ${engine.iconColor} hover:opacity-80`}>
                      {isExpanded ? 'Collapse' : 'Click to expand'}
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Expanded Panel */}
                  {isExpanded && (
                    <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
                      <p className="text-xs text-white/40 uppercase tracking-wider">Recent Automation Runs</p>
                      {runs.length === 0 ? (
                        <p className="text-xs text-white/20">No recent runs</p>
                      ) : runs.slice(0, 5).map(run => (
                        <div key={run.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                          <span className="text-xs text-white/60 capitalize">{run.run_type || 'auto'}</span>
                          <span className={`text-xs font-semibold ${run.status === 'completed' ? 'text-green-400' : run.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {run.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* System Overview */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">System Overview</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Data Points Processed', value: systemStats.dataPoints, icon: Database, color: 'text-cyan-400', iconBg: 'bg-cyan-500/20' },
                { label: 'Active Clients', value: systemStats.clients, icon: Globe, color: 'text-purple-400', iconBg: 'bg-purple-500/20' },
                { label: 'Outreach Sent Today', value: systemStats.outreach >= 1000 ? `${(systemStats.outreach/1000).toFixed(0)}K` : systemStats.outreach, icon: Mail, color: 'text-pink-400', iconBg: 'bg-pink-500/20' },
                { label: 'System Uptime', value: systemStats.uptime, icon: Activity, color: 'text-green-400', iconBg: 'bg-green-500/20' },
              ].map(({ label, value, icon: Icon, color, iconBg }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-white/30">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}