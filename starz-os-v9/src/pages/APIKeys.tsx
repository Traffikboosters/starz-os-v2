import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key, Copy, CheckCircle2, Eye, EyeOff,
  Trash2, Plus, RefreshCw, Clock, X, Check} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const initialApiKeys = [
  { id: 'key-1', name: 'Production App', key: 'sk_live_••••••••••••••••••••••••', fullKey: 'sk_live_51Fx9a2B4cD8eF0gH1iJ2kL3mN4oP5qR', created: 'Jul 1, 2025', lastUsed: '2m ago', status: 'active', permissions: ['read', 'write', 'billing'] },
  { id: 'key-2', name: 'Staging Test', key: 'sk_test_••••••••••••••••••••••••', fullKey: 'sk_test_9Xy8Z7w6V5u4T3s2R1q0P9o8N7m6L5k', created: 'Jun 15, 2025', lastUsed: '1h ago', status: 'active', permissions: ['read', 'write'] },
  { id: 'key-3', name: 'SEO Scraper', key: 'sk_live_••••••••••••••••••••••••', fullKey: 'sk_live_aB3cD4eF5gH6iJ7kL8mN9oP0qR1s2T3', created: 'Jun 20, 2025', lastUsed: '30m ago', status: 'active', permissions: ['read', 'scraper'] },
  { id: 'key-4', name: 'Legacy Integration', key: 'sk_live_••••••••••••••••••••••••', fullKey: 'sk_live_0Z9y8X7w6V5u4T3s2R1q0P9o', created: 'May 1, 2025', lastUsed: '2d ago', status: 'revoked', permissions: ['read'] },
]

const webhookEndpoints = [
  { id: 'wh-1', url: 'https://api.starz-os.com/v1/webhooks/stripe', events: ['payment.received', 'payment.failed'], status: 'active', lastDelivery: '2m ago' },
  { id: 'wh-2', url: 'https://api.starz-os.com/v1/webhooks/lead', events: ['lead.created', 'lead.assigned'], status: 'active', lastDelivery: '5m ago' },
  { id: 'wh-3', url: 'https://api.starz-os.com/v1/webhooks/sentinel', events: ['security.alert'], status: 'active', lastDelivery: '12m ago' },
]

export default function APIKeys() {
  const [apiKeys, setApiKeys] = useLocalStorage('starz-apikeys', initialApiKeys)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newKey, setNewKey] = useState({ name: '', permissions: [] as string[] })
  const { success, info, warning } = useToast()

  const handleCopy = async (keyId: string, fullKey: string) => {
    try {
      await navigator.clipboard.writeText(fullKey)
      setCopied(keyId)
      success('API key copied to clipboard')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      warning('Failed to copy to clipboard')
    }
  }

  const handleDelete = (id: string) => {
    setApiKeys((prev: any[]) => prev.filter((k: any) => k.id !== id))
    info(`API key ${id} deleted`)
  }

  const handleCreateKey = () => {
    if (!newKey.name) {
      warning('Key name is required')
      return
    }
    const id = `key-${apiKeys.length + 1}`
    const fullKey = `sk_live_${Math.random().toString(36).substring(2, 30)}`
    setApiKeys((prev: any[]) => [...prev, {
      id,
      name: newKey.name,
      key: 'sk_live_••••••••••••••••••••••••',
      fullKey,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'never',
      status: 'active',
      permissions: newKey.permissions.length ? newKey.permissions : ['read'],
    }])
    setShowNew(false)
    setNewKey({ name: '', permissions: [] })
    success(`API key ${id} created`)
  }

  const togglePermission = (perm: string) => {
    setNewKey((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }))
  }

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
        <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New API Key
        </Button>
      </div>

      {/* New Key Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNew(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-md shadow-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">New API Key</h3>
                <button onClick={() => setShowNew(false)} className="p-1 rounded hover:bg-card text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Key name" value={newKey.name} onChange={(e) => setNewKey({ ...newKey, name: e.target.value })} className="bg-card border-border/40" />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Permissions</p>
                  <div className="flex gap-2">
                    {['read', 'write', 'billing', 'scraper'].map((perm) => (
                      <button key={perm} onClick={() => togglePermission(perm)} className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${newKey.permissions.includes(perm) ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted-foreground border border-border/20'}`}>
                        {perm}
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="w-full bg-gradient-primary text-space font-semibold" onClick={handleCreateKey}>Create Key</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border/40 card-glow overflow-hidden"
      >
        <div className="p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">API Keys</h3>
          <div className="space-y-3">
            {apiKeys.map((k: any) => (
              <div key={k.id} className="p-4 rounded-xl bg-space-highlight/30 border border-border/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{k.name}</span>
                    <Badge className={`text-[10px] ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                      {k.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleCopy(k.id, k.fullKey)} className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-cyan transition-colors" title="Copy">
                      {copied === k.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(k.id)} className="p-1.5 rounded hover:bg-card text-muted-foreground hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-xs font-mono text-muted-foreground bg-card px-2 py-1 rounded">
                    {revealed === k.id ? k.fullKey : k.key}
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
                    {k.permissions.map((p: string) => (
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
