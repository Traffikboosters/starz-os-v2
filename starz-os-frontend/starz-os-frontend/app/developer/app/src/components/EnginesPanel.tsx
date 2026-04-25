import { useState } from 'react';
import {
  Target,
  Zap,
  Activity,
  BarChart3,
  FileText,
  TrendingUp,
  Settings,
  CheckCircle,
  RefreshCw,
  Cpu,
  Database,
  Globe,
  Mail,
  LineChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ENGINES = [
  {
    id: 'intelligence',
    name: 'STARZ Intelligence Engine',
    subtitle: 'SEO + Market Domination',
    description: 'Real-time keyword tracking, competitor reverse-engineering, and AI-driven opportunity scoring.',
    icon: Target,
    color: 'cyan',
    status: 'running',
    load: 78,
    uptime: '99.9%',
    lastRun: '2 min ago',
    stats: {
      keywords: '12,450',
      competitors: '89',
      opportunities: '234',
    },
    capabilities: [
      'Real-time keyword tracking (Google, Maps, Yelp)',
      'Competitor reverse-engineering',
      'Opportunity scoring (low competition / high ROI)',
      'AI keyword clustering',
      'Search intent detection',
    ],
    metrics: [
      { label: 'API Calls', value: '2.4M', change: '+12%' },
      { label: 'Data Points', value: '45M', change: '+8%' },
    ],
  },
  {
    id: 'authority',
    name: 'Authority Engine',
    subtitle: 'Backlinks + Trust Building',
    description: 'Automated backlink outreach, domain authority tracking, and toxic link detection.',
    icon: Zap,
    color: 'purple',
    status: 'running',
    load: 45,
    uptime: '99.7%',
    lastRun: '5 min ago',
    stats: {
      backlinks: '8,234',
      domains: '1,456',
      authority: '68',
    },
    capabilities: [
      'Automated backlink outreach',
      'Guest post marketplace integration',
      'Domain authority tracking',
      'Toxic backlink detection',
      'Anchor text optimization AI',
    ],
    metrics: [
      { label: 'Outreach Sent', value: '12.5K', change: '+23%' },
      { label: 'Success Rate', value: '18%', change: '+3%' },
    ],
  },
  {
    id: 'optimization',
    name: 'Site Optimization Engine',
    subtitle: 'Technical SEO',
    description: 'Full site audits, schema generation, and Core Web Vitals optimization.',
    icon: Activity,
    color: 'emerald',
    status: 'running',
    load: 62,
    uptime: '99.8%',
    lastRun: '1 min ago',
    stats: {
      audits: '456',
      issues: '1,234',
      fixed: '987',
    },
    capabilities: [
      'Full site audits (Core Web Vitals, indexing)',
      'Schema auto-generation',
      'Internal linking automation',
      'Page speed AI optimization',
      'Mobile-first performance scoring',
    ],
    metrics: [
      { label: 'Sites Audited', value: '456', change: '+15%' },
      { label: 'Avg Score', value: '87', change: '+5' },
    ],
  },
  {
    id: 'rank',
    name: 'Rank Domination Engine',
    subtitle: 'Maps + Local SEO',
    description: 'Google Maps rank tracking, citation distribution, and local competitor analysis.',
    icon: BarChart3,
    color: 'orange',
    status: 'running',
    load: 34,
    uptime: '99.9%',
    lastRun: '3 min ago',
    stats: {
      locations: '234',
      citations: '45K',
      reviews: '12.3K',
    },
    capabilities: [
      'Google Maps rank tracking grid',
      'Citation distribution system',
      'Review generation + AI responses',
      'Local competitor tracking',
      'Geo-targeted keyword domination',
    ],
    metrics: [
      { label: 'Map Rankings', value: '1,890', change: '+34%' },
      { label: 'Avg Position', value: '3.2', change: '+0.8' },
    ],
  },
  {
    id: 'content',
    name: 'Outreach + Content Engine',
    subtitle: 'Content + Campaigns',
    description: 'AI content generation, email outreach campaigns, and conversion copywriting.',
    icon: FileText,
    color: 'pink',
    status: 'running',
    load: 56,
    uptime: '99.6%',
    lastRun: '8 min ago',
    stats: {
      articles: '456',
      emails: '89K',
      campaigns: '34',
    },
    capabilities: [
      'AI blog/content generation (SEO optimized)',
      'Email outreach campaigns',
      'Guest post pitching automation',
      'Conversion copywriting AI',
      'Funnel content alignment',
    ],
    metrics: [
      { label: 'Words Generated', value: '2.3M', change: '+45%' },
      { label: 'Open Rate', value: '34%', change: '+6%' },
    ],
  },
  {
    id: 'reporting',
    name: 'Performance & Reporting Engine',
    subtitle: 'KPIs + Analytics',
    description: 'Real-time dashboards, ROI tracking, and automated white-label reports.',
    icon: TrendingUp,
    color: 'blue',
    status: 'running',
    load: 28,
    uptime: '100%',
    lastRun: 'Just now',
    stats: {
      dashboards: '89',
      reports: '2.3K',
      clients: '156',
    },
    capabilities: [
      'Real-time KPI dashboards',
      'ROI tracking per campaign',
      'Work order → result tracking',
      'White-labeled Partner reports',
      'Automated weekly/monthly reporting',
    ],
    metrics: [
      { label: 'Reports Sent', value: '2.3K', change: '+18%' },
      { label: 'Data Sources', value: '45', change: '+5' },
    ],
  },
];

function getColorClasses(color: string) {
  const colors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    cyan: { 
      bg: 'bg-cyan-500/20', 
      text: 'text-cyan-400', 
      border: 'border-cyan-500/30',
      gradient: 'from-cyan-500 to-blue-500'
    },
    purple: { 
      bg: 'bg-purple-500/20', 
      text: 'text-purple-400', 
      border: 'border-purple-500/30',
      gradient: 'from-purple-500 to-pink-500'
    },
    emerald: { 
      bg: 'bg-emerald-500/20', 
      text: 'text-emerald-400', 
      border: 'border-emerald-500/30',
      gradient: 'from-emerald-500 to-teal-500'
    },
    orange: { 
      bg: 'bg-orange-500/20', 
      text: 'text-orange-400', 
      border: 'border-orange-500/30',
      gradient: 'from-orange-500 to-red-500'
    },
    pink: { 
      bg: 'bg-pink-500/20', 
      text: 'text-pink-400', 
      border: 'border-pink-500/30',
      gradient: 'from-pink-500 to-rose-500'
    },
    blue: { 
      bg: 'bg-blue-500/20', 
      text: 'text-blue-400', 
      border: 'border-blue-500/30',
      gradient: 'from-blue-500 to-indigo-500'
    },
  };
  return colors[color] || colors.cyan;
}

export function EnginesPanel() {
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);

  const handleAction = (action: string, engineName: string) => {
    toast.success(`${action} initiated for ${engineName}`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">STARZ-OS Engines</h2>
            <p className="text-sm text-white/50 mt-1">
              6 proprietary engines powering the fulfillment division
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              All 6 Engines Operational
            </Badge>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </div>
      </header>

      {/* Engines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {ENGINES.map((engine) => {
          const colors = getColorClasses(engine.color);
          const Icon = engine.icon;
          const isSelected = selectedEngine === engine.id;

          return (
            <Card 
              key={engine.id}
              className={`glass-card border-white/6 engine-card cursor-pointer ${
                isSelected ? 'border-white/20' : ''
              }`}
              onClick={() => setSelectedEngine(isSelected ? null : engine.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">{engine.name}</CardTitle>
                      <p className={`text-xs ${colors.text}`}>{engine.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full status-pulse" />
                    <span className="text-xs text-emerald-400">Running</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Description */}
                <p className="text-sm text-white/60 mb-4">{engine.description}</p>

                {/* Load & Uptime */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/50">Load</span>
                      <span className="text-white">{engine.load}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
                        style={{ width: `${engine.load}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/50">Uptime</p>
                    <p className={`text-sm font-semibold ${colors.text}`}>{engine.uptime}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {Object.entries(engine.stats).map(([key, value]) => (
                    <div key={key} className="p-2 bg-white/5 rounded-lg text-center">
                      <p className="text-lg font-bold text-white">{value}</p>
                      <p className="text-[10px] text-white/40 uppercase">{key}</p>
                    </div>
                  ))}
                </div>

                {/* Expanded Content */}
                {isSelected && (
                  <div className="pt-4 border-t border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Capabilities */}
                    <div>
                      <h4 className="text-xs font-medium text-white/70 mb-2">Capabilities</h4>
                      <ul className="space-y-1">
                        {engine.capabilities.map((cap, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-white/60">
                            <CheckCircle className={`w-3 h-3 ${colors.text} mt-0.5 flex-shrink-0`} />
                            {cap}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Metrics */}
                    <div>
                      <h4 className="text-xs font-medium text-white/70 mb-2">Performance Metrics</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {engine.metrics.map((metric, idx) => (
                          <div key={idx} className="p-3 bg-white/5 rounded-lg">
                            <p className="text-xs text-white/50">{metric.label}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-white">{metric.value}</p>
                              <span className="text-xs text-emerald-400">{metric.change}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className={`flex-1 bg-gradient-to-r ${colors.gradient} text-white`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('Restart', engine.name);
                        }}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Restart
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('Configure', engine.name);
                        }}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Config
                      </Button>
                    </div>
                  </div>
                )}

                {/* Last Run */}
                <div className="flex items-center justify-between pt-3 border-t border-white/6 mt-4">
                  <span className="text-xs text-white/40">Last run: {engine.lastRun}</span>
                  <span className={`text-xs ${colors.text}`}>
                    {isSelected ? 'Click to collapse' : 'Click to expand'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Overview */}
      <Card className="glass-card border-white/6 mt-8">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">2.4B</p>
                <p className="text-xs text-white/50">Data Points Processed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">156</p>
                <p className="text-xs text-white/50">Active Clients</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">89K</p>
                <p className="text-xs text-white/50">Outreach Sent Today</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <LineChart className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">99.8%</p>
                <p className="text-xs text-white/50">System Uptime</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
