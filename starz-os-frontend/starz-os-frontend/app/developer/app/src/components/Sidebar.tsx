import type { ViewType } from '../App';
import {
  LayoutDashboard,
  ClipboardList,
  Cpu,
  Users,
  Package,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard' as ViewType, icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { id: 'workorders' as ViewType, icon: ClipboardList, label: 'Work Orders', badge: '12 Active' },
  { id: 'engines' as ViewType, icon: Cpu, label: 'Engines', badge: '6 Running' },
  { id: 'team' as ViewType, icon: Users, label: 'Team', badge: null },
  { id: 'deliverables' as ViewType, icon: Package, label: 'Deliverables', badge: '89%' },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-72 border-r border-white/6 bg-[#080b14]/90 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">STARZ-OS</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Developers Dept</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${
              currentView === item.id
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-cyan-400' : ''}`} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge 
                variant="outline" 
                className={`text-[10px] ${
                  currentView === item.id 
                    ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' 
                    : 'border-white/10 text-white/40'
                }`}
              >
                {item.badge}
              </Badge>
            )}
            {currentView === item.id && (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        ))}
      </nav>

      {/* Rico Card */}
      <div className="p-4 mx-4 mb-4">
        <div className="glass-card rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-cyan-500/50 rico-pulse">
                <img src="/rico-avatar.png" alt="Rico" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#080b14]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Rico</p>
              <p className="text-xs text-cyan-400">Technical Supervisor</p>
              <p className="text-[10px] text-white/40 mt-0.5">Click to chat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/6">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
          <Settings className="w-4 h-4" />
          <span className="flex-1 text-left">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors mt-1">
          <LogOut className="w-4 h-4" />
          <span className="flex-1 text-left">Sign Out</span>
        </button>
        
        <div className="mt-4 flex items-center gap-3 px-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">JD</span>
          </div>
          <div>
            <p className="text-sm text-white">John Doe</p>
            <p className="text-xs text-white/40">Dept Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
