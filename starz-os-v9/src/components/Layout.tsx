import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star, LayoutDashboard, Phone, Users, CreditCard, FileText,
  Briefcase, Zap, Shield, Bot, PieChart, Settings,
  Key, ChevronLeft, ChevronRight, LogOut, Search, Bell,
  Command, Globe, UserCheck} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const sections = [
  {
    title: 'Command',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Phone, label: 'PowerDial', path: '/powerdial' },
      { icon: Users, label: 'Leads', path: '/leads' },
    ]},
  {
    title: 'Revenue',
    items: [
      { icon: CreditCard, label: 'Billing', path: '/billing' },
      { icon: FileText, label: 'Proposals', path: '/proposals' },
      { icon: Briefcase, label: 'Work Orders', path: '/workorders' },
    ]},
  {
    title: 'Operations',
    items: [
      { icon: Zap, label: 'Automation', path: '/automation' },
      { icon: Globe, label: 'SEO Engine', path: '/seo' },
      { icon: Shield, label: 'Security', path: '/security' },
    ]},
  {
    title: 'Intelligence',
    items: [
      { icon: Bot, label: 'AI Steve', path: '/ai-steve' },
      { icon: PieChart, label: 'Reports', path: '/reports' },
    ]},
  {
    title: 'System',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
      { icon: UserCheck, label: 'HR / Zara', path: '/hr' },
      { icon: Key, label: 'API Keys', path: '/apikeys' },
    ]},
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-space text-foreground flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 bottom-0 z-40 bg-sidebar border-r border-border flex flex-col"
      >
        <div className="h-16 flex items-center px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative flex-shrink-0">
              <Star className="w-6 h-6 text-cyan" />
              <div className="absolute inset-0 bg-cyan/30 blur-lg rounded-full opacity-50" />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-foreground whitespace-nowrap text-lg"
              >
                STARZ<span className="text-cyan">-OS</span>
              </motion.span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {sections.map((section) => (
            <div key={section.title} className="mb-3">
              {!collapsed && (
                <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const active = location.pathname === item.path
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-cyan/10 text-cyan shadow-[inset_0_1px_0_rgba(0,240,255,0.1)]'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                    )}
                    {active && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span className="text-xs font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-space/80 backdrop-blur-xl sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold text-foreground">
              {(() => {
                const all = sections.flatMap((s) => s.items)
                const match = all.find((i) => i.path === location.pathname)
                return match?.label || 'Dashboard'
              })()}
            </h1>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              All systems operational
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`relative transition-all duration-300 ${searchFocused ? 'w-72' : 'w-52'}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search anything..."
                className="pl-9 bg-card/80 border-border/40 text-sm h-9 rounded-lg focus:border-cyan/40 focus:ring-1 focus:ring-cyan/20"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border/40 hidden sm:flex items-center gap-0.5">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </div>

            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan rounded-full ring-2 ring-background" />
            </button>

            <ThemeToggle />

            <Avatar className="w-8 h-8 border border-border cursor-pointer ring-2 ring-cyan/10">
              <AvatarImage src="/avatar-1.jpg" />
              <AvatarFallback className="bg-cyan/20 text-cyan text-[10px]">SC</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  )
}
