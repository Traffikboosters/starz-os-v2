import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Phone, CreditCard, FileText, Target,
  Briefcase, Settings, Shield, Zap, Globe, Bot, BarChart3,
  Send, Code2, Package, Radio, ChevronLeft, ChevronRight} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { StarField } from './StarField'
import { SalesVictoryFeed } from './SalesVictoryPopup'

// ─── SALES DIVISION NAV ────────────────────────────────────────────
const salesNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Target, label: 'Leads' },
  { to: '/powerdial', icon: Phone, label: 'PowerDial' },
  { to: '/outreach', icon: Send, label: 'Outreach' },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/steve', icon: Bot, label: 'AI Steve' },
]

// ─── FULFILLMENT DIVISION NAV ──────────────────────────────────────
const fulfillmentNav = [
  { to: '/work-orders', icon: Briefcase, label: 'Work Orders' },
  { to: '/developer-workspace', icon: Code2, label: 'Dev Workspace' },
  { to: '/seo-operations', icon: Globe, label: 'SEO Ops' },
  { to: '/deliverables', icon: Package, label: 'Deliverables' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

// ─── SYSTEM NAV ────────────────────────────────────────────────────
const systemNav = [
  { to: '/command-center', icon: Radio, label: 'Command Center' },
  { to: '/automation', icon: Zap, label: 'Automation' },
  { to: '/security', icon: Shield, label: 'Security' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname.startsWith(path)

  const renderNavItem = (item: any) => {
    const active = isActive(item.to)
    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
          active
            ? 'bg-cyan/10 text-cyan border border-cyan/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-card border border-transparent'
        }`}
      >
        <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-cyan' : ''}`} />
        {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
      </NavLink>
    )
  }

  return (
    <div className="min-h-screen bg-space text-foreground flex relative overflow-hidden">
      <StarField />

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 220 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 bg-card/80 backdrop-blur-xl border-r border-border/40 flex flex-col overflow-hidden"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative flex-shrink-0 w-8 h-8 rounded overflow-hidden">
              <img src="/logo-starz.png" alt="STARZ-OS" className="w-full h-full object-cover" />
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

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
          {/* Sales Division */}
          {!collapsed && (
            <div className="px-3 pt-2 pb-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Sales Division</span>
            </div>
          )}
          {collapsed && <div className="flex justify-center pt-2"><Phone className="w-3 h-3 text-muted-foreground" /></div>}
          {salesNav.map(renderNavItem)}

          {/* Fulfillment Division */}
          <div className="pt-3 border-t border-border/20">
            {!collapsed && (
              <div className="px-3 pt-2 pb-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Fulfillment</span>
              </div>
            )}
            {collapsed && <div className="flex justify-center pt-2"><Briefcase className="w-3 h-3 text-muted-foreground" /></div>}
            {fulfillmentNav.map(renderNavItem)}
          </div>

          {/* System */}
          <div className="pt-3 border-t border-border/20">
            {!collapsed && (
              <div className="px-3 pt-2 pb-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">System</span>
              </div>
            )}
            {collapsed && <div className="flex justify-center pt-2"><Settings className="w-3 h-3 text-muted-foreground" /></div>}
            {systemNav.map(renderNavItem)}
          </div>
        </div>

        {/* Bottom */}
        <div className="p-2.5 border-t border-border/40">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2`}>
            {!collapsed && <ThemeToggle />}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Victory Feed - appears on all pages */}
      <SalesVictoryFeed />

      {/* Main */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-card/80 backdrop-blur-xl border-b border-border/40 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              {location.pathname === '/dashboard' && 'Sales Dashboard'}
              {location.pathname === '/leads' && 'Lead Management'}
              {location.pathname === '/powerdial' && 'PowerDial'}
              {location.pathname === '/outreach' && 'Outreach Center'}
              {location.pathname === '/proposals' && 'Proposals'}
              {location.pathname === '/billing' && 'Billing & Revenue'}
              {location.pathname === '/steve' && 'AI Steve'}
              {location.pathname === '/work-orders' && 'Work Order Queue'}
              {location.pathname === '/developer-workspace' && 'Developer Workspace'}
              {location.pathname === '/seo-operations' && 'SEO Operations'}
              {location.pathname === '/deliverables' && 'Deliverables Center'}
              {location.pathname === '/reports' && 'Reports Center'}
              {location.pathname === '/command-center' && 'Command Center'}
              {location.pathname === '/automation' && 'Automation Hub'}
              {location.pathname === '/security' && 'Security Sentinel'}
              {location.pathname === '/settings' && 'Settings'}
            </h2>
            <span className="text-[10px] text-muted-foreground bg-card border border-border/30 rounded-lg px-2 py-0.5">v4.0</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border/30 text-[10px] text-muted-foreground">
              <Radio className="w-3 h-3 text-emerald-400" /> System Online
            </div>
            <div className="w-7 h-7 rounded-full bg-cyan/10 flex items-center justify-center text-xs font-bold text-cyan">A</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
