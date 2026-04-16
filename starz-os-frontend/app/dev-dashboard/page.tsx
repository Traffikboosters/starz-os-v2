'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Brain, Zap, Activity, Map, Mail, BarChart3, Database, Globe, RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function DevDashboard() {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const engines = [
    { id: 'intelligence', name: 'STARZ Intelligence Engine', subtitle: 'SEO + Market Domination', description: 'Real-time keyword tracking, competitor reverse-engineering, and AI-driven opportunity scoring.', icon: Brain, iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400', accentColor: 'border-cyan-500/30', load: 78, uptime: '99.9%', loadColor: 'bg-cyan-400', metrics: [{ label: 'KEYWORDS', value: '12,450' }, { label: 'COMPETITORS', value: '89' }, { label: 'OPPORTUNITIES', value: '234' }] },
    { id: 'authority', name: 'Authority Engine', subtitle: 'Backlinks + Trust Building', description: 'Automated backlink outreach, domain authority tracking, and toxic link detection.', icon: Zap, iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', accentColor: 'border-purple-500/30', load: 45, uptime: '99.7%', loadColor: 'bg-purple-400', metrics: [{ label: 'BACKLINKS', value: '8,234' }, { label: 'DOMAINS', value: '1,456' }, { label: 'AUTHORITY', value: '68' }] },
    { id: 'site', name: 'Site Optimization Engine', subtitle: 'Technical SEO', description: 'Full site audits, schema generation, and Core Web Vitals optimization.', icon: Activity, iconBg: 'bg-green-500/20', iconColor: 'text-green-400', accentColor: 'border-green-500/30', load: 62, uptime: '99.8%', loadColor: 'bg-green-400', metrics: [{ label: 'AUDITS', value: '456' }, { label: 'ISSUES', value: '1,234' }, { label: 'FIXED', value: '987' }] },
    { id: 'rank', name: 'Rank Domination Engine', subtitle: 'Maps + Local SEO', description: 'Google Maps rank tracking, citation distribution, and local competitor analysis.', icon: Map, iconBg: 'bg-orange-500/20', iconColor: 'text-orange-400', accentColor: 'border-orange-500/30', load: 34, uptime: '99.9%', loadColor: 'bg-orange-400', metrics: [{ label: 'LOCATIONS', value: '234' }, { label: 'CITATIONS', value: '45K' }, { label: 'REVIEWS', value: '12.3K' }] },
    { id: 'outreach', name: 'Outreach + Content Engine', subtitle: 'Content + Campaigns', description: 'AI content generation, email outreach campaigns, and conversion copywriting.', icon: Mail, iconBg: 'bg-pink-500/20', iconColor: 'text-pink-400', accentColor: 'border-pink-500/30', load: 56, uptime: '99.6%', loadColor: 'bg-pink-400', metrics: [{ label: 'ARTICLES', value: '456' }, { label: 'EMAILS', value: '89K' }, { label: 'CAMPAIGNS', value: '34' }] },
    { id: 'performance', name: 'Performance & Reporting Engine', subtitle: 'KPIs + Analytics', description: 'Real-time dashboards, ROI tracking, and automated white-label reports.', icon: BarChart3, iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', accentColor: 'border-blue-500/30', load: 28, uptime: '100%', loadColor: 'bg-blue-400', metrics: [{ label: 'DASHBOARDS', value: '89' }, { label: 'REPORTS', value: '2.3K' }, { label: 'CLIENTS', value: '156' }] },
  ];

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Developer Dashboard</h1>
            <p className="text-sm text-white/40">6 proprietary engines powering the fulfillment division</p>
          </div>
          <button onClick={() => setLoading(l => !l)} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-white transition-all">
            <RefreshCw className="w-3.5 h-3.5" />Refresh All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {engines.map(engine => {
            const Icon = engine.icon;
            const isExpanded = expanded === engine.id;
            return (
              <div key={engine.id} className={`bg-gray-900 border rounded-2xl p-5 flex flex-col gap-3 ${engine.accentColor}`}>
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
                <p className="text-xs text-white/40 leading-relaxed">{engine.description}</p>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/30">Load</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/60">{engine.load}%</span>
                      <span className="text-xs text-white/30">Uptime</span>
                      <span className="text-xs text-green-400 font-semibold">{engine.uptime}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${engine.loadColor}`} style={{ width: engine.load + '%' }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {engine.metrics.map(m => (
                    <div key={m.label} className="bg-white/5 rounded-xl p-2.5 text-center">
                      <p className="text-base font-bold text-white">{m.value}</p>
                      <p className="text-xs text-white/30 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-white/20">Last run: 2 min ago</span>
                  <button onClick={() => setExpanded(isExpanded ? null : engine.id)} className={`flex items-center gap-1 text-xs font-semibold ${engine.iconColor}`}>
                    {isExpanded ? 'Collapse' : 'Click to expand'}
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">System Overview</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Data Points Processed', value: '2.4B', icon: Database, color: 'text-cyan-400', iconBg: 'bg-cyan-500/20' },
              { label: 'Active Clients', value: '156', icon: Globe, color: 'text-purple-400', iconBg: 'bg-purple-500/20' },
              { label: 'Outreach Sent Today', value: '89K', icon: Mail, color: 'text-pink-400', iconBg: 'bg-pink-500/20' },
              { label: 'System Uptime', value: '99.8%', icon: Activity, color: 'text-green-400', iconBg: 'bg-green-500/20' },
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
  );
}