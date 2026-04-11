import { useState } from 'react';
import {
  Code2,
  Link2,
  BarChart3,
  Bot,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Briefcase,
  Star,
  TrendingUp,
  Award,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

const TEAMS = [
  {
    id: 'fulfillment',
    name: 'Fulfillment Engineers',
    description: 'Core development team for SEO, websites, and technical implementation',
    icon: Code2,
    color: 'cyan',
    lead: 'Sarah Chen',
    members: 8,
    activeTasks: 24,
    completionRate: 94,
    contractors: [
      { name: 'Sarah Chen', role: 'Team Lead', status: 'active', workload: 85, skills: ['SEO', 'Technical', 'Schema'] },
      { name: 'David Kim', role: 'Senior Dev', status: 'active', workload: 78, skills: ['Speed', 'Core Web Vitals'] },
      { name: 'Maria Lopez', role: 'Developer', status: 'active', workload: 65, skills: ['Content', 'On-page'] },
      { name: 'James Wilson', role: 'Developer', status: 'away', workload: 0, skills: ['Funnels', 'CRO'] },
    ],
  },
  {
    id: 'backlink',
    name: 'Authority & Backlink Specialists',
    description: 'Backlink acquisition, outreach campaigns, and domain authority growth',
    icon: Link2,
    color: 'purple',
    lead: 'Mike Rodriguez',
    members: 5,
    activeTasks: 18,
    completionRate: 88,
    contractors: [
      { name: 'Mike Rodriguez', role: 'Team Lead', status: 'active', workload: 72, skills: ['Outreach', 'DA Growth'] },
      { name: 'Lisa Park', role: 'Specialist', status: 'active', workload: 80, skills: ['Guest Posts', 'PR'] },
      { name: 'Tom Anderson', role: 'Specialist', status: 'active', workload: 60, skills: ['Citation', 'Local'] },
    ],
  },
  {
    id: 'data',
    name: 'Data & Intelligence Engineers',
    description: 'Keyword tracking, competitor intelligence, and market analysis',
    icon: BarChart3,
    color: 'emerald',
    lead: 'Jessica Park',
    members: 4,
    activeTasks: 12,
    completionRate: 96,
    contractors: [
      { name: 'Jessica Park', role: 'Team Lead', status: 'active', workload: 70, skills: ['Analytics', 'AI/ML'] },
      { name: 'Alex Thompson', role: 'Analyst', status: 'active', workload: 75, skills: ['Tracking', 'Reporting'] },
      { name: 'Rachel Green', role: 'Analyst', status: 'active', workload: 55, skills: ['Research', 'KPIs'] },
    ],
  },
  {
    id: 'automation',
    name: 'Automation Engineers',
    description: 'AI workflows, scrapers, enrichment systems, and internal tools',
    icon: Bot,
    color: 'orange',
    lead: 'Kevin Zhang',
    members: 6,
    activeTasks: 15,
    completionRate: 91,
    contractors: [
      { name: 'Kevin Zhang', role: 'Team Lead', status: 'active', workload: 82, skills: ['AI/ML', 'Scrapers'] },
      { name: 'Emma Davis', role: 'Engineer', status: 'active', workload: 68, skills: ['Workflows', 'APIs'] },
      { name: 'Chris Martin', role: 'Engineer', status: 'active', workload: 70, skills: ['Enrichment', 'Data'] },
      { name: 'Nina Patel', role: 'Engineer', status: 'away', workload: 0, skills: ['Tools', 'Integration'] },
    ],
  },
];

const RICO_PROFILE = {
  name: 'Rico',
  title: 'Technical Supervisor BGE',
  role: 'Department Orchestrator',
  avatar: '/rico-avatar.png',
  stats: {
    workOrdersManaged: 156,
    tasksAssigned: 2340,
    completionRate: 94,
    avgResponseTime: '2.3 min',
  },
};

function getColorClasses(color: string) {
  const colors: Record<string, { bg: string; text: string; light: string }> = {
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', light: 'bg-cyan-400' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', light: 'bg-purple-400' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', light: 'bg-emerald-400' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', light: 'bg-orange-400' },
  };
  return colors[color] || colors.cyan;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active': return <div className="w-2 h-2 bg-emerald-400 rounded-full status-pulse" />;
    case 'away': return <Clock className="w-3 h-3 text-yellow-400" />;
    case 'busy': return <AlertCircle className="w-3 h-3 text-orange-400" />;
    default: return <div className="w-2 h-2 bg-white/30 rounded-full" />;
  }
}

export function TeamPanel() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const handleContact = (name: string) => {
    toast.info(`Opening chat with ${name}...`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Development Teams</h2>
            <p className="text-sm text-white/50 mt-1">
              4 specialized teams under Rico's supervision
            </p>
          </div>
          <Button className="gradient-bg-cyan text-white hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Contractor
          </Button>
        </div>
      </header>

      {/* Rico Profile Card */}
      <Card className="glass-card border-white/6 mb-8 overflow-hidden">
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-orange-500/10" />
          
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-cyan-500/30 rico-pulse">
                  <img src={RICO_PROFILE.avatar} alt={RICO_PROFILE.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#080b14] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-bold text-white">{RICO_PROFILE.name}</h3>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    <Star className="w-3 h-3 mr-1" />
                    BGE
                  </Badge>
                </div>
                <p className="text-cyan-400 font-medium">{RICO_PROFILE.title}</p>
                <p className="text-sm text-white/50">{RICO_PROFILE.role}</p>
                
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">
                      <span className="text-white font-semibold">{RICO_PROFILE.stats.workOrdersManaged}</span> Work Orders
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">
                      <span className="text-white font-semibold">{RICO_PROFILE.stats.tasksAssigned}</span> Tasks Assigned
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">
                      <span className="text-emerald-400 font-semibold">{RICO_PROFILE.stats.completionRate}%</span> Completion
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button size="sm" className="gradient-bg-cyan text-white">
                  <Mail className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Award className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {TEAMS.map((team) => {
          const colors = getColorClasses(team.color);
          const Icon = team.icon;
          const isSelected = selectedTeam === team.id;

          return (
            <Card 
              key={team.id}
              className={`glass-card border-white/6 engine-card ${isSelected ? 'border-white/20' : ''}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">{team.name}</CardTitle>
                      <p className="text-xs text-white/50">Lead: {team.lead}</p>
                    </div>
                  </div>
                  <Badge className={`${colors.bg} ${colors.text} border-0`}>
                    {team.members} members
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-white/60 mb-4">{team.description}</p>

                {/* Team Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-xs text-white/50">Active Tasks</p>
                    <p className={`text-xl font-bold ${colors.text}`}>{team.activeTasks}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-xs text-white/50">Completion Rate</p>
                    <p className="text-xl font-bold text-emerald-400">{team.completionRate}%</p>
                  </div>
                </div>

                {/* Contractors */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-white/70">Team Members</h4>
                    <button 
                      onClick={() => setSelectedTeam(isSelected ? null : team.id)}
                      className={`text-xs ${colors.text} hover:underline`}
                    >
                      {isSelected ? 'Show less' : 'View all'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(isSelected ? team.contractors : team.contractors.slice(0, 2)).map((contractor, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={`${colors.bg} ${colors.text} text-xs`}>
                            {contractor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white truncate">{contractor.name}</p>
                            {getStatusIcon(contractor.status)}
                          </div>
                          <p className="text-xs text-white/50">{contractor.role}</p>
                        </div>

                        {contractor.status === 'active' && (
                          <div className="w-16">
                            <div className="flex items-center justify-between text-[10px] mb-0.5">
                              <span className="text-white/40">Load</span>
                              <span className="text-white/70">{contractor.workload}%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${colors.light}`}
                                style={{ width: `${contractor.workload}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={() => handleContact(contractor.name)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Mail className="w-4 h-4 text-white/40" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Communication Rules */}
      <Card className="glass-card border-white/6 mt-8">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            Communication Protocol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <p className="text-sm font-medium text-white">Strictly Prohibited</p>
              </div>
              <ul className="space-y-1 text-sm text-white/60">
                <li>• Developers DO NOT talk to clients directly</li>
                <li>• Developers DO NOT talk to sales reps</li>
                <li>• No external communication without approval</li>
              </ul>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <p className="text-sm font-medium text-white">Approved Channels</p>
              </div>
              <ul className="space-y-1 text-sm text-white/60">
                <li>• ALL communication goes through Rico</li>
                <li>• ALL work must tie to a Work Order</li>
                <li>• ALL deliverables must be tracked</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
