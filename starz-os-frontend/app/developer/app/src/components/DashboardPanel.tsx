import type { ViewType } from '../App';
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Activity,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';


interface DashboardPanelProps {
  onNavigate: (view: ViewType) => void;
}

const STATS = [
  { 
    label: 'Active Work Orders', 
    value: '12', 
    change: '+3', 
    icon: ClipboardListIcon, 
    color: 'cyan',
    subtext: 'This week'
  },
  { 
    label: 'Revenue in Pipeline', 
    value: '$48.2K', 
    change: '+12%', 
    icon: DollarSign, 
    color: 'emerald',
    subtext: 'From proposals'
  },
  { 
    label: 'Deliverables Completed', 
    value: '89%', 
    change: '+5%', 
    icon: CheckCircle, 
    color: 'purple',
    subtext: 'On time'
  },
  { 
    label: 'Avg Completion Time', 
    value: '4.2d', 
    change: '-0.8d', 
    icon: Clock, 
    color: 'orange',
    subtext: 'Improving'
  },
];

const RECENT_WORK_ORDERS = [
  { id: 'WO-2025-0042', client: 'Acme Corp', type: 'SEO Package', status: 'in-progress', progress: 65, team: 'Fulfillment', due: '2 days' },
  { id: 'WO-2025-0041', client: 'TechStart Inc', type: 'Authority Build', status: 'pending', progress: 0, team: 'Backlink', due: '5 days' },
  { id: 'WO-2025-0040', client: 'LocalBiz Pro', type: 'Maps Domination', status: 'in-progress', progress: 40, team: 'Data Intel', due: '3 days' },
  { id: 'WO-2025-0039', client: 'Ecommerce Plus', type: 'Full Stack', status: 'review', progress: 95, team: 'Multiple', due: '1 day' },
];

const ENGINE_STATUS = [
  { name: 'STARZ Intelligence', status: 'running', load: 78, icon: Target, color: 'cyan' },
  { name: 'Authority Engine', status: 'running', load: 45, icon: Zap, color: 'purple' },
  { name: 'Site Optimization', status: 'running', load: 62, icon: Activity, color: 'emerald' },
  { name: 'Rank Domination', status: 'running', load: 34, icon: BarChart3, color: 'orange' },
];

function ClipboardListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <rect x="4" y="7" width="16" height="14" rx="2" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'in-progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'review': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default: return 'bg-white/10 text-white/60';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'in-progress': return 'In Progress';
    case 'pending': return 'Pending';
    case 'review': return 'In Review';
    case 'completed': return 'Completed';
    default: return status;
  }
}

export function DashboardPanel({ onNavigate }: DashboardPanelProps) {
  return (
    <div className="p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Developers Dashboard</h2>
            <p className="text-sm text-white/50 mt-1">
              Fulfillment Division Ã¢â‚¬Â¢ Powered by Rico, Technical Supervisor BGE
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 status-pulse" />
              All Systems Operational
            </Badge>
            <Button 
              onClick={() => onNavigate('workorders')}
              className="gradient-bg-cyan text-white hover:opacity-90"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              New Work Order
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {STATS.map((stat, idx) => (
          <Card key={idx} className="glass-card border-white/6 engine-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/50">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      className={`text-xs ${stat.change.startsWith('+') ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.change}
                    </Badge>
                    <span className="text-xs text-white/40">{stat.subtext}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stat.color === 'cyan' ? 'bg-cyan-500/20' :
                  stat.color === 'emerald' ? 'bg-emerald-500/20' :
                  stat.color === 'purple' ? 'bg-purple-500/20' :
                  'bg-orange-500/20'
                }`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === 'cyan' ? 'text-cyan-400' :
                    stat.color === 'emerald' ? 'text-emerald-400' :
                    stat.color === 'purple' ? 'text-purple-400' :
                    'text-orange-400'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Orders */}
        <Card className="glass-card border-white/6 lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <ClipboardListIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Active Work Orders</CardTitle>
                  <p className="text-xs text-white/50">Recently assigned by Rico</p>
                </div>
              </div>
              <Button 
                onClick={() => onNavigate('workorders')}
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {RECENT_WORK_ORDERS.map((wo) => (
                <div 
                  key={wo.id} 
                  className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-cyan-400">{wo.id}</span>
                      <Badge className={getStatusColor(wo.status)}>
                        {getStatusLabel(wo.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-white mt-1">{wo.client}</p>
                    <p className="text-xs text-white/50">{wo.type} Ã¢â‚¬Â¢ {wo.team} Team</p>
                  </div>
                  <div className="w-32">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/50">Progress</span>
                      <span className="text-white">{wo.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-bg-cyan rounded-full transition-all duration-500"
                        style={{ width: `${wo.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{wo.due}</span>
                    </div>
                    <p className="text-xs text-white/40">Due</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Engine Status */}
        <Card className="glass-card border-white/6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Engine Status</CardTitle>
                  <p className="text-xs text-white/50">All 6 engines operational</p>
                </div>
              </div>
              <Button 
                onClick={() => onNavigate('engines')}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              >
                Details
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ENGINE_STATUS.map((engine) => (
                <div key={engine.name} className="p-4 bg-white/[0.02] rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      engine.color === 'cyan' ? 'bg-cyan-500/20' :
                      engine.color === 'purple' ? 'bg-purple-500/20' :
                      engine.color === 'emerald' ? 'bg-emerald-500/20' :
                      'bg-orange-500/20'
                    }`}>
                      <engine.icon className={`w-4 h-4 ${
                        engine.color === 'cyan' ? 'text-cyan-400' :
                        engine.color === 'purple' ? 'text-purple-400' :
                        engine.color === 'emerald' ? 'text-emerald-400' :
                        'text-orange-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{engine.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full status-pulse" />
                        <span className="text-xs text-emerald-400">Running</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/50">Load</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          engine.load > 70 ? 'bg-orange-400' :
                          engine.load > 50 ? 'bg-yellow-400' :
                          'bg-emerald-400'
                        }`}
                        style={{ width: `${engine.load}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/70 w-8 text-right">{engine.load}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Fulfillment Flow */}
        <Card className="glass-card border-white/6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Fulfillment Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {[
                { label: 'Lead', count: 24, active: false },
                { label: 'Proposal', count: 8, active: false },
                { label: 'Payment', count: 5, active: false },
                { label: 'Work Order', count: 12, active: true },
                { label: 'Delivery', count: 3, active: false },
              ].map((step, idx, arr) => (
                <div key={step.label} className="flex items-center">
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                      step.active ? 'gradient-bg-cyan' : 'bg-white/10'
                    }`}>
                      <span className={`text-lg font-bold ${step.active ? 'text-white' : 'text-white/60'}`}>
                        {step.count}
                      </span>
                    </div>
                    <p className={`text-xs ${step.active ? 'text-cyan-400' : 'text-white/50'}`}>
                      {step.label}
                    </p>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="w-8 h-px bg-white/10 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="glass-card border-white/6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Department Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white">Work Order WO-2025-0039 approaching deadline</p>
                  <p className="text-xs text-white/50 mt-1">Due in 1 day Ã¢â‚¬Â¢ Ecommerce Plus</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white">New proposal approved by Steve</p>
                  <p className="text-xs text-white/50 mt-1">Ready for Rico to create work order</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
