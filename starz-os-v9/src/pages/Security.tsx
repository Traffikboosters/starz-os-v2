import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Lock, AlertTriangle, CheckCircle2, XCircle, UserX, Activity, BarChart3, Users, Globe, Zap, Terminal,
  ChevronRight, ShieldAlert, ShieldCheck, Ban, Eye} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const securityStats = [
  { label: 'Threats Blocked', value: 1247, change: '+23', icon: ShieldAlert, color: 'text-cyan' },
  { label: 'Active Users', value: 84, icon: Users, color: 'text-emerald-400' },
  { label: 'Violations', value: 3, icon: AlertTriangle, color: 'text-amber-400' },
  { label: 'Suspensions', value: 1, icon: Ban, color: 'text-red-400' },
]

const accessLogData = [
  { user: 'sarah@starz-os.com', action: 'login', ip: '192.168.1.45', time: '2m ago', status: 'success', method: 'SSO' },
  { user: 'marcus@starz-os.com', action: 'api_call', ip: '192.168.1.47', time: '5m ago', status: 'success', method: 'API Key' },
  { user: 'unknown', action: 'login_attempt', ip: '45.23.11.89', time: '12m ago', status: 'blocked', method: 'Password' },
  { user: 'elena@starz-os.com', action: 'data_export', ip: '192.168.1.52', time: '18m ago', status: 'success', method: 'SSO' },
  { user: 'guest_4421', action: 'login_attempt', ip: '103.44.12.6', time: '34m ago', status: 'blocked', method: 'Password' },
  { user: 'james@starz-os.com', action: 'permission_change', ip: '192.168.1.60', time: '1h ago', status: 'success', method: 'SSO' },
]

const initialAlerts = [
  { id: 'ALT-001', severity: 'medium', message: 'Unusual login pattern from IP 45.23.11.x', time: '12m ago', resolved: false },
  { id: 'ALT-002', severity: 'low', message: 'API rate limit approaching for key sk_live_...', time: '1h ago', resolved: true },
  { id: 'ALT-003', severity: 'high', message: 'Failed login burst (15 attempts in 60s)', time: '2h ago', resolved: true },
  { id: 'ALT-004', severity: 'low', message: 'SSL cert expires in 14 days', time: '3h ago', resolved: false },
]

const userStatuses = [
  { name: 'Sarah Chen', role: 'Admin', status: 'active', lastActive: 'Now', mfa: true },
  { name: 'Elena Rossi', role: 'Manager', status: 'active', lastActive: '2m ago', mfa: true },
  { name: 'Marcus Webb', role: 'Rep', status: 'active', lastActive: '5m ago', mfa: false },
  { name: 'Aisha Patel', role: 'Rep', status: 'suspended', lastActive: '2d ago', mfa: true },
  { name: 'James Park', role: 'Viewer', status: 'active', lastActive: '1h ago', mfa: false },
]

const severityBadge = (severity: string) => {
  switch (severity) {
    case 'high': return 'bg-red-500/10 text-red-400 border-red-500/30'
    case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'low': return 'bg-cyan/10 text-cyan border-cyan/30'
    default: return 'bg-muted text-muted-foreground'
  }
}

export default function Security() {
  const [showResolved, setShowResolved] = useState(false)
  const [alerts, setAlerts] = useLocalStorage('starz-alerts', initialAlerts)
  const [logFilter, setLogFilter] = useState('all')
  const { success, info } = useToast()

  const handleResolve = (id: string) => {
    setAlerts((prev: any[]) => prev.map((a: any) => a.id === id ? { ...a, resolved: true } : a))
    success(`Alert ${id} resolved`)
  }

  const filteredLog = accessLogData.filter((e) => {
    if (logFilter === 'all') return true
    return e.status === logFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan" />
            Sentinel Security
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Access control, anomaly detection, and audit logging</p>
        </div>
        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 rounded-lg">
          <ShieldCheck className="w-3 h-3 mr-1" /> Protected
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {securityStats.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border/40 card-glow"
          >
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              <AnimatedCounter end={m.value} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Sentinel Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan" />
              <h3 className="font-semibold text-foreground text-sm">Sentinel Alerts</h3>
            </div>
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="text-xs text-cyan hover:text-cyan/80 transition-colors"
            >
              {showResolved ? 'Hide resolved' : 'Show resolved'}
            </button>
          </div>
          <div className="space-y-2">
            {alerts.filter((a: any) => showResolved || !a.resolved).map((alert: any) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  alert.resolved ? 'border-border/20 opacity-50' : 'border-border/30 hover:border-cyan/20'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  alert.severity === 'high' ? 'bg-red-400' : alert.severity === 'medium' ? 'bg-amber-400' : 'bg-cyan'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-muted-foreground">{alert.id}</span>
                    <Badge className={`text-[10px] ${severityBadge(alert.severity)}`}>{alert.severity}</Badge>
                    {alert.resolved && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Resolved</Badge>}
                  </div>
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{alert.time}</p>
                </div>
                {!alert.resolved && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] border-cyan/30 text-cyan hover:bg-cyan/5 px-2" onClick={() => handleResolve(alert.id)}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Resolve
                  </Button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* User Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <h3 className="font-semibold text-foreground text-sm mb-4">User Status</h3>
          <div className="space-y-2">
            {userStatuses.map((u) => (
              <div key={u.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-space-highlight/30 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground">{u.role} · {u.lastActive}</p>
                </div>
                {u.mfa ? (
                  <Lock className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Unlock className="w-3 h-3 text-amber-400" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Access Log */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden"
      >
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan" />
            <h3 className="font-semibold text-foreground text-sm">Access Log</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {['all', 'success', 'blocked'].map((f) => (
                <button key={f} onClick={() => setLogFilter(f)} className={`px-2 py-1 rounded-lg text-[10px] capitalize transition-all ${logFilter === f ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}>{f}</button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-cyan hover:text-cyan hover:bg-cyan/5 h-7" onClick={() => info('Exporting CSV...')}>
              Export CSV
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border/20">
                {['User', 'Action', 'Method', 'IP Address', 'Time', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLog.map((entry, i) => (
                <tr key={i} className="border-t border-border/10 hover:bg-space-highlight/20 transition-colors">
                  <td className="px-5 py-3"><span className="text-sm text-foreground font-mono">{entry.user}</span></td>
                  <td className="px-5 py-3"><span className="text-sm text-muted-foreground">{entry.action}</span></td>
                  <td className="px-5 py-3"><Badge variant="outline" className="text-[10px] border-border/40">{entry.method}</Badge></td>
                  <td className="px-5 py-3"><span className="text-xs font-mono text-muted-foreground">{entry.ip}</span></td>
                  <td className="px-5 py-3"><span className="text-xs text-muted-foreground">{entry.time}</span></td>
                  <td className="px-5 py-3">
                    <Badge className={`text-[10px] ${entry.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                      {entry.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

function Unlock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  )
}
