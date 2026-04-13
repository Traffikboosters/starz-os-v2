'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthProvider';
import {
  LayoutDashboard, Send, Users, Phone, Code2, Settings,
  TrendingUp, ClipboardList, LogOut, PhoneCall, FileText,
  UserCog, Search, LayoutList
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard',   href: '/dashboard',  icon: LayoutDashboard },
  { name: 'CRM',         href: '/crm',         icon: LayoutList },
  { name: 'Leads',       href: '/leads',       icon: Users },
  { name: 'PowerDial',   href: '/powerdial',   icon: Phone },
  { name: 'Call Floor',  href: '/call-floor',  icon: PhoneCall },
  { name: 'Steve BGE',   href: '/steve',       icon: TrendingUp },
  { name: 'Rico BGE',    href: '/rico',        icon: ClipboardList },
  { name: 'Work Orders', href: '/work-orders', icon: FileText },
  { name: 'HR Portal',   href: '/hr',          icon: UserCog },
  { name: 'Outreach', href: '/outreach', icon: Send },
  { name: 'Scraper',     href: '/scraper',     icon: Search },
  { name: 'Developers',  href: '/developer',   icon: Code2 },
  { name: 'Tasks',       href: '/tasks',       icon: ClipboardList },
  { name: 'Settings',    href: '/settings',    icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const displayName = user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isDashboard = pathname === '/dashboard';

  return (
    <div className="flex flex-col w-60 min-h-screen bg-[#07070d] border-r border-white/[0.06] py-6 px-4 shrink-0">
      <Link href="/dashboard">
        <div className="flex items-center gap-3 px-2 mb-4 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-8 h-8 rounded-lg gradient-bg-cyan flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-wide">STARZ-OS</p>
            <p className="text-white/30 text-xs">Operations Platform</p>
          </div>
        </div>
      </Link>

      {!isDashboard && (
        <Link href="/dashboard">
          <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all text-xs">
            <span>â†</span>
            <span>Back to Dashboard</span>
          </div>
        </Link>
      )}

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}>
                <Icon className="w-4 h-4 shrink-0" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full gradient-bg-cyan flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{displayName}</p>
            <p className="text-white/30 text-xs truncate">{user?.email || ''}</p>
          </div>
          <button onClick={signOut} title="Sign out" className="text-white/20 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}