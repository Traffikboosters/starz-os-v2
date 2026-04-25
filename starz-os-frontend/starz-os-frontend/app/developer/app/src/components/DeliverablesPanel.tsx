import { useState } from 'react';
import {
  Package,
  CheckCircle,
  Clock,
  FileText,
  Link2,
  Globe,
  BarChart3,
  TrendingUp,
  Download,
  Eye,
  ChevronDown,
  Search,
  Calendar,
  User,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';

const DELIVERABLES = [
  {
    id: 'DEL-2025-0156',
    workOrderId: 'WO-2025-0042',
    client: 'Acme Corporation',
    type: 'SEO Pages',
    name: 'Service Page Optimization - 15 Pages',
    status: 'in-progress',
    progress: 65,
    assignedTo: 'Sarah Chen',
    dueDate: '2025-04-10',
    completedDate: null,
    value: 2500,
    description: 'Optimize 15 service pages with keyword targeting, meta tags, and content improvements.',
    checklist: [
      { item: 'Keyword research completed', done: true },
      { item: 'Meta tags optimized', done: true },
      { item: 'Content rewritten', done: true },
      { item: 'Internal linking structure', done: false },
      { item: 'Schema markup added', done: false },
      { item: 'Final QA review', done: false },
    ],
  },
  {
    id: 'DEL-2025-0155',
    workOrderId: 'WO-2025-0042',
    client: 'Acme Corporation',
    type: 'Backlinks',
    name: 'Authority Backlink Package - 50 Links',
    status: 'pending',
    progress: 0,
    assignedTo: 'Mike Rodriguez',
    dueDate: '2025-04-15',
    completedDate: null,
    value: 3500,
    description: 'Acquire 50 high-quality backlinks from DA 40+ domains.',
    checklist: [
      { item: 'Prospect list created', done: false },
      { item: 'Outreach campaign launched', done: false },
      { item: 'First batch of links acquired', done: false },
      { item: 'Quality verification', done: false },
      { item: 'Final report generated', done: false },
    ],
  },
  {
    id: 'DEL-2025-0154',
    workOrderId: 'WO-2025-0040',
    client: 'LocalBiz Pro',
    type: 'Maps SEO',
    name: 'Google Maps Optimization - 3 Locations',
    status: 'in-progress',
    progress: 40,
    assignedTo: 'Jessica Park',
    dueDate: '2025-04-12',
    completedDate: null,
    value: 1800,
    description: 'Optimize Google Business Profiles and improve local rankings for 3 locations.',
    checklist: [
      { item: 'GBP audit completed', done: true },
      { item: 'Profile optimization', done: true },
      { item: 'Citation building started', done: false },
      { item: 'Review generation campaign', done: false },
      { item: 'Rank tracking setup', done: false },
    ],
  },
  {
    id: 'DEL-2025-0153',
    workOrderId: 'WO-2025-0039',
    client: 'Ecommerce Plus',
    type: 'Technical SEO',
    name: 'Site Speed Optimization',
    status: 'review',
    progress: 95,
    assignedTo: 'David Kim',
    dueDate: '2025-04-09',
    completedDate: null,
    value: 4200,
    description: 'Improve Core Web Vitals scores and overall site performance.',
    checklist: [
      { item: 'Performance audit', done: true },
      { item: 'Image optimization', done: true },
      { item: 'Code minification', done: true },
      { item: 'CDN configuration', done: true },
      { item: 'Lazy loading implemented', done: true },
      { item: 'Final performance test', done: false },
    ],
  },
  {
    id: 'DEL-2025-0152',
    workOrderId: 'WO-2025-0039',
    client: 'Ecommerce Plus',
    type: 'Content',
    name: 'Product Description Rewrite - 200 Products',
    status: 'completed',
    progress: 100,
    assignedTo: 'Maria Lopez',
    dueDate: '2025-04-08',
    completedDate: '2025-04-07',
    value: 3800,
    description: 'Rewrite 200 product descriptions with SEO optimization and conversion focus.',
    checklist: [
      { item: 'Keyword mapping', done: true },
      { item: 'First 50 products', done: true },
      { item: 'Next 75 products', done: true },
      { item: 'Final 75 products', done: true },
      { item: 'QA and approval', done: true },
    ],
  },
  {
    id: 'DEL-2025-0151',
    workOrderId: 'WO-2025-0037',
    client: 'RealtyMax Pro',
    type: 'Automation',
    name: 'Email Outreach Sequence - 5 Steps',
    status: 'in-progress',
    progress: 72,
    assignedTo: 'Kevin Zhang',
    dueDate: '2025-04-14',
    completedDate: null,
    value: 2200,
    description: 'Create and deploy 5-step automated email sequence for lead nurturing.',
    checklist: [
      { item: 'Sequence strategy defined', done: true },
      { item: 'Email copy written', done: true },
      { item: 'Templates designed', done: true },
      { item: 'Automation rules configured', done: true },
      { item: 'A/B test setup', done: false },
      { item: 'Launch and monitor', done: false },
    ],
  },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Deliverables', count: 156 },
  { value: 'in-progress', label: 'In Progress', count: 68 },
  { value: 'pending', label: 'Pending', count: 23 },
  { value: 'review', label: 'In Review', count: 15 },
  { value: 'completed', label: 'Completed', count: 45 },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  'SEO Pages': FileText,
  'Backlinks': Link2,
  'Maps SEO': Globe,
  'Technical SEO': BarChart3,
  'Content': FileText,
  'Automation': TrendingUp,
};

function getStatusConfig(status: string) {
  switch (status) {
    case 'in-progress':
      return { 
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
        icon: Clock,
        label: 'In Progress',
        color: 'blue'
      };
    case 'pending':
      return { 
        badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
        icon: Clock,
        label: 'Pending',
        color: 'yellow'
      };
    case 'review':
      return { 
        badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
        icon: Eye,
        label: 'In Review',
        color: 'purple'
      };
    case 'completed':
      return { 
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
        icon: CheckCircle,
        label: 'Completed',
        color: 'emerald'
      };
    default:
      return { badge: 'bg-white/10 text-white/60', icon: Clock, label: status, color: 'gray' };
  }
}

export function DeliverablesPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDeliverables = DELIVERABLES.filter(del => {
    const matchesSearch = 
      del.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || del.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: DELIVERABLES.length,
    completed: DELIVERABLES.filter(d => d.status === 'completed').length,
    inProgress: DELIVERABLES.filter(d => d.status === 'in-progress').length,
    totalValue: DELIVERABLES.reduce((acc, d) => acc + d.value, 0),
  };

  const handleDownload = (deliverable: typeof DELIVERABLES[0]) => {
    try {
      // Create report content
      const report = {
        reportType: 'STARZ-OS Deliverable Report',
        generatedAt: new Date().toISOString(),
        deliverable: {
          id: deliverable.id,
          workOrderId: deliverable.workOrderId,
          client: deliverable.client,
          type: deliverable.type,
          name: deliverable.name,
          status: deliverable.status,
          progress: deliverable.progress,
          assignedTo: deliverable.assignedTo,
          dueDate: deliverable.dueDate,
          completedDate: deliverable.completedDate,
          value: deliverable.value,
          description: deliverable.description,
          checklist: deliverable.checklist,
        }
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      // Use setTimeout to ensure the download triggers
      setTimeout(() => {
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = `${deliverable.id}-report.json`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      }, 0);

      toast.success(`Downloaded ${deliverable.id} report`);
    } catch (error) {
      toast.error('Download failed. Please try again.');
      console.error('Download error:', error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Deliverables Tracking</h2>
            <p className="text-sm text-white/50 mt-1">
              Track all work order deliverables from assignment to completion
            </p>
          </div>
          <Button className="gradient-bg-cyan text-white hover:opacity-90">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card border-white/6">
          <CardContent className="p-4">
            <p className="text-xs text-white/50">Total Deliverables</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/6">
          <CardContent className="p-4">
            <p className="text-xs text-white/50">Completed</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/6">
          <CardContent className="p-4">
            <p className="text-xs text-white/50">In Progress</p>
            <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/6">
          <CardContent className="p-4">
            <p className="text-xs text-white/50">Total Value</p>
            <p className="text-2xl font-bold text-cyan-400">${stats.totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search deliverables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                statusFilter === filter.value
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {filter.label}
              <span className="ml-2 text-xs text-white/40">({filter.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Deliverables List */}
      <div className="space-y-4">
        {filteredDeliverables.map((deliverable) => {
          const statusConfig = getStatusConfig(deliverable.status);
          const StatusIcon = statusConfig.icon;
          const TypeIcon = TYPE_ICONS[deliverable.type] || Package;
          const isExpanded = expandedId === deliverable.id;

          return (
            <Card 
              key={deliverable.id}
              className={`glass-card border-white/6 transition-all ${isExpanded ? 'border-white/20' : ''}`}
            >
              <CardContent className="p-5">
                {/* Main Row */}
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <TypeIcon className="w-5 h-5 text-cyan-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-cyan-400">{deliverable.id}</span>
                          <Badge className={statusConfig.badge}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <h3 className="text-base font-semibold text-white mt-1">{deliverable.name}</h3>
                        <p className="text-sm text-white/60">{deliverable.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-400">${deliverable.value.toLocaleString()}</p>
                        <p className="text-xs text-white/40">Value</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/50">Progress</span>
                        <span className="text-white">{deliverable.progress}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            deliverable.progress === 100 ? 'bg-emerald-400' : 'gradient-bg-cyan'
                          }`}
                          style={{ width: `${deliverable.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {deliverable.assignedTo}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due {new Date(deliverable.dueDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {deliverable.type}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleDownload(deliverable)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Download Report"
                    >
                      <Download className="w-4 h-4 text-white/50" />
                    </button>
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : deliverable.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="View details"
                    >
                      <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Description */}
                      <div>
                        <h4 className="text-sm font-medium text-white/70 mb-2">Description</h4>
                        <p className="text-sm text-white/60">{deliverable.description}</p>
                      </div>

                      {/* Checklist */}
                      <div>
                        <h4 className="text-sm font-medium text-white/70 mb-2">Checklist</h4>
                        <div className="space-y-2">
                          {deliverable.checklist.map((item, idx) => (
                            <div 
                              key={idx}
                              className={`flex items-center gap-2 p-2 rounded-lg ${
                                item.done ? 'bg-emerald-500/10' : 'bg-white/5'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                item.done ? 'bg-emerald-500' : 'border border-white/30'
                              }`}>
                                {item.done && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-sm ${item.done ? 'text-white/70 line-through' : 'text-white/90'}`}>
                                {item.item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                      <Button size="sm" className="gradient-bg-cyan text-white">
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => handleDownload(deliverable)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredDeliverables.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <Search className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-white/50">No deliverables found</p>
          <p className="text-sm text-white/30 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
