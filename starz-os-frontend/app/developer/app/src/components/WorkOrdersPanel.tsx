import { useState } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  ArrowUpRight,
  User,
  Calendar,
  Tag,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const WORK_ORDERS = [
  {
    id: 'WO-2025-0042',
    client: 'Acme Corporation',
    proposalId: 'PROP-2025-0089',
    type: 'SEO Package - Premium',
    status: 'in-progress',
    priority: 'high',
    team: 'Fulfillment Engineers',
    assignee: 'Sarah Chen',
    progress: 65,
    dueDate: '2025-04-10',
    value: 8500,
    tasks: { total: 12, completed: 8 },
    description: 'Complete SEO overhaul including technical fixes, content optimization, and backlink strategy.',
  },
  {
    id: 'WO-2025-0041',
    client: 'TechStart Inc',
    proposalId: 'PROP-2025-0087',
    type: 'Authority Build - Standard',
    status: 'pending',
    priority: 'medium',
    team: 'Backlink Specialists',
    assignee: 'Unassigned',
    progress: 0,
    dueDate: '2025-04-15',
    value: 4200,
    tasks: { total: 8, completed: 0 },
    description: 'Domain authority improvement through quality backlink acquisition.',
  },
  {
    id: 'WO-2025-0040',
    client: 'LocalBiz Pro',
    proposalId: 'PROP-2025-0085',
    type: 'Maps Domination',
    status: 'in-progress',
    priority: 'high',
    team: 'Data & Intelligence',
    assignee: 'Mike Rodriguez',
    progress: 40,
    dueDate: '2025-04-12',
    value: 3200,
    tasks: { total: 6, completed: 2 },
    description: 'Google Maps ranking optimization for 3 locations.',
  },
  {
    id: 'WO-2025-0039',
    client: 'Ecommerce Plus',
    proposalId: 'PROP-2025-0082',
    type: 'Full Stack Growth',
    status: 'review',
    priority: 'urgent',
    team: 'Multiple Teams',
    assignee: 'Team Lead: Jessica Park',
    progress: 95,
    dueDate: '2025-04-09',
    value: 15000,
    tasks: { total: 24, completed: 23 },
    description: 'Complete digital transformation including SEO, ads, and automation.',
  },
  {
    id: 'WO-2025-0038',
    client: 'HealthFirst Clinic',
    proposalId: 'PROP-2025-0080',
    type: 'Local SEO Package',
    status: 'completed',
    priority: 'medium',
    team: 'Fulfillment Engineers',
    assignee: 'David Kim',
    progress: 100,
    dueDate: '2025-04-05',
    value: 5600,
    tasks: { total: 10, completed: 10 },
    description: 'Healthcare-focused local SEO with HIPAA-compliant content.',
  },
  {
    id: 'WO-2025-0037',
    client: 'RealtyMax Pro',
    proposalId: 'PROP-2025-0078',
    type: 'Content + Outreach',
    status: 'in-progress',
    priority: 'medium',
    team: 'Automation Engineers',
    assignee: 'Alex Thompson',
    progress: 72,
    dueDate: '2025-04-14',
    value: 6800,
    tasks: { total: 15, completed: 11 },
    description: 'Real estate content engine with automated outreach campaigns.',
  },
  {
    id: 'WO-2025-0036',
    client: 'Foodie Delivery',
    proposalId: 'PROP-2025-0075',
    type: 'Technical SEO Fix',
    status: 'on-hold',
    priority: 'low',
    team: 'Fulfillment Engineers',
    assignee: 'Pending',
    progress: 30,
    dueDate: '2025-04-20',
    value: 2400,
    tasks: { total: 5, completed: 1 },
    description: 'Core Web Vitals optimization and site speed improvements.',
  },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Orders', count: 12 },
  { value: 'in-progress', label: 'In Progress', count: 4 },
  { value: 'pending', label: 'Pending', count: 2 },
  { value: 'review', label: 'In Review', count: 1 },
  { value: 'completed', label: 'Completed', count: 3 },
  { value: 'on-hold', label: 'On Hold', count: 1 },
];

function getStatusConfig(status: string) {
  switch (status) {
    case 'in-progress':
      return { 
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
        icon: Clock,
        label: 'In Progress'
      };
    case 'pending':
      return { 
        badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
        icon: PauseCircle,
        label: 'Pending'
      };
    case 'review':
      return { 
        badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
        icon: CheckCircle,
        label: 'In Review'
      };
    case 'completed':
      return { 
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
        icon: CheckCircle,
        label: 'Completed'
      };
    case 'on-hold':
      return { 
        badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30', 
        icon: AlertCircle,
        label: 'On Hold'
      };
    default:
      return { badge: 'bg-white/10 text-white/60', icon: Clock, label: status };
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'low': return 'bg-white/10 text-white/50';
    default: return 'bg-white/10 text-white/50';
  }
}

export function WorkOrdersPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = WORK_ORDERS.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateWorkOrder = () => {
    toast.info('Rico will create a new work order from approved proposals');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Work Orders</h2>
            <p className="text-sm text-white/50 mt-1">
              Manage all fulfillment tasks assigned by Rico
            </p>
          </div>
          <Button 
            onClick={handleCreateWorkOrder}
            className="gradient-bg-cyan text-white hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Work Order
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search by ID, client, or type..."
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

      {/* Work Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map((order) => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;
          
          return (
            <Dialog key={order.id}>
              <DialogTrigger asChild>
                <Card 
                  className="glass-card border-white/6 cursor-pointer hover:border-white/15 transition-all engine-card"
                >
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-cyan-400">{order.id}</span>
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                        </div>
                        <p className="text-lg font-semibold text-white mt-1">{order.client}</p>
                      </div>
                      <Badge className={statusConfig.badge}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Type & Team */}
                    <div className="mb-4">
                      <p className="text-sm text-white/80">{order.type}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-white/40" />
                        <span className="text-xs text-white/50">{order.team}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/50">Progress</span>
                        <span className="text-white">{order.progress}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            order.progress === 100 ? 'bg-emerald-400' : 'gradient-bg-cyan'
                          }`}
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/40 mt-1">
                        {order.tasks.completed} of {order.tasks.total} tasks completed
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-white/40" />
                        <span className={`text-xs ${
                          new Date(order.dueDate) < new Date('2025-04-10') && order.status !== 'completed'
                            ? 'text-orange-400'
                            : 'text-white/50'
                        }`}>
                          Due {new Date(order.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-white/40" />
                        <span className="text-sm font-semibold text-emerald-400">
                          ${order.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              
              <DialogContent className="glass-card border-white/10 max-w-2xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="text-cyan-400">{order.id}</span>
                    <span>•</span>
                    <span>{order.client}</span>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 mt-4">
                  {/* Status Row */}
                  <div className="flex items-center gap-4">
                    <Badge className={statusConfig.badge}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority} priority
                    </Badge>
                    <Badge variant="outline" className="border-white/10 text-white/60">
                      {order.team}
                    </Badge>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-white/70 mb-2">Description</h4>
                    <p className="text-sm text-white/80">{order.description}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-xs text-white/50 mb-1">Assignee</p>
                      <p className="text-sm text-white">{order.assignee}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-xs text-white/50 mb-1">Due Date</p>
                      <p className="text-sm text-white">{new Date(order.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-xs text-white/50 mb-1">Proposal ID</p>
                      <p className="text-sm text-cyan-400">{order.proposalId}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-xs text-white/50 mb-1">Order Value</p>
                      <p className="text-sm text-emerald-400">${order.value.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white/70">Task Progress</h4>
                      <span className="text-sm text-white">{order.tasks.completed} / {order.tasks.total}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${order.progress === 100 ? 'bg-emerald-400' : 'gradient-bg-cyan'}`}
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <Button className="flex-1 gradient-bg-cyan text-white">
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <Search className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-white/50">No work orders found</p>
          <p className="text-sm text-white/30 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
