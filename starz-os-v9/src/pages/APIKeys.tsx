import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Key, Copy, CheckCircle2, Eye, EyeOff,
  Trash2, Plus, RefreshCw, Clock} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const apiKeys = [
  { id: 'key-1', name: 'Production App', key: 'sk_live_••••••••••••••••••••••••', created: 'Jul 1, 2025', lastUsed: '2m ago', status: 'active', permissions: ['read', 'write', 'billing'] },
  { id: 'key-2', name: 'Staging Test', key: 'sk_test_••••••••••••••••••••••••', created: 'Jun 15, 2025', lastUsed: '1h ago', status: 'active', permissions: ['read', 'write'] },
  { id: 'key-3', name: 'SEO Scraper', key: 'sk_live_••••••••••••••••••••••••', created: 'Jun 20, 2025', lastUsed: '30m ago', status: 'active', permissions: ['read', 'scraper'] },
  { id: 'key-4', name: 'Legacy Integration', key: 'sk_live_••••••••••••••••••••••••', created: 'May 1, 2025', lastUsed: '2d ago', status: 'revoked', permissions: ['read'] },
]

const webhookEndpoints = [
  { id: 'wh-1', url: 'https://api.starz-os.com/v1/webhooks/stripe', events: ['payment.received', 'payment.failed'], status: 'active', lastDelivery: '2m ago' },
  { id: 'wh-2', url: 'https://api.starz-os.com/v1/webhooks/lead', events: ['lead.created', 'lead.assigned'], status: 'active', lastDelivery: '5m ago' },
  { id: 'wh-3', url: 'https://api.starz-os.com/v1/webhooks/sentinel', events: ['security.alert'], status: 'active', lastDelivery: '12m ago' },
]

export default function APIKeys() {
  const [revealed, setRevealed] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan" />
            API Keys & Webhooks
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage API credentials and webhook endpoints</p>
        </div>
        <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New API Key
        </Button>
      </div>

      {/* API Keys */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden"
      >
        <div className="p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">API Keys</h3>
          <div className="space-y-3">
            {apiKeys.map((k) => (
              <div key={k.id} className="p-4 rounded-xl bg-space-highlight/30 border border-border/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{k.name}</span>
                    <Badge className={`text-[10px] ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                      {k.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-foreground transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-xs font-mono text-muted-foreground bg-card px-2 py-1 rounded">
                    {revealed === k.id ? 'sk_live_51Fx9a2B4cD8eF0gH1iJ2kL3mN4oP5qR' : k.key}
                  </code>
                  <button
                    onClick={() => setRevealed(revealed === k.id ? null : k.id)}
                    className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {revealed === k.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Created {k.created}</span>
                  <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Last used {k.lastUsed}</span>
                  <div className="flex items-center gap-1">
                    {k.permissions.map((p) => (
                      <Badge key={p} variant="outline" className="text-[9px] border-border/40 px-1 py-0">{p}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Webhooks */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden"
      >
        <div className="p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">Webhook Endpoints</h3>
          <div className="space-y-3">
            {webhookEndpoints.map((wh) => (
              <div key={wh.id} className="p-4 rounded-xl bg-space-highlight/30 border border-border/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan">{wh.id}</span>
                    <code className="text-xs font-mono text-muted-foreground">{wh.url}</code>
                  </div>
                  <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> {wh.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {wh.events.map((e) => (
                    <Badge key={e} variant="outline" className="text-[9px] border-cyan/30 text-cyan bg-cyan/5">{e}</Badge>
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-auto">Last delivery: {wh.lastDelivery}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
