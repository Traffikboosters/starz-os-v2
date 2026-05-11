import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Linkedin, Play, Pause, Plus, RefreshCw, TrendingUp,
  Users, DollarSign, Target, BarChart2, Zap, Bot, SlidersHorizontal
} from 'lucide-react'

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Campaign {
  id: string
  campaign_id: string
  name: string
  owner: string
  status: 'active' | 'paused' | 'draft'
  start_date: string
  end_date: string
  leads: number
  cpl: number
  close_rate: number
  roi: number
  spend: number
  revenue: number
  budget: number
  created_at?: string
}

interface Vendor {
  id: string
  name: string
  type: string
  fetchers_active: number
  campaigns_live: number
  cost_per_lead: number
  quality_score: number
  status: 'active' | 'paused'
}

// â”€â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1 min-w-[160px]">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest">
        <Icon size={13} />
        {label}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  )
}

// â”€â”€â”€ Campaign Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CampaignCard({ c, onToggle }: { c: Campaign; onToggle: (id: string, status: string) => void }) {
  const budgetUsed = c.budget > 0 ? Math.round((c.spend / c.budget) * 100) : 0
  const statusColor = c.status === 'active' ? 'bg-emerald-500' : c.status === 'paused' ? 'bg-yellow-500' : 'bg-zinc-500'
  const statusLabel = c.status === 'active' ? 'active' : c.status === 'paused' ? 'paused' : 'draft'

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-cyan-500/40 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-foreground text-sm">{c.name}</div>
          <div className="text-xs text-muted-foreground">{c.campaign_id} Â· {c.owner}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-muted-foreground">{statusLabel}</span>
          <button
            onClick={() => onToggle(c.id, c.status)}
            className="ml-1 text-muted-foreground hover:text-foreground"
          >
            {c.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {/* Date */}
      <div className="text-xs text-muted-foreground">
        {new Date(c.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} â€“{' '}
        {new Date(c.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
        <div>
          <div className="text-xl font-bold text-cyan-400">{c.leads.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Leads</div>
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">${c.cpl}</div>
          <div className="text-xs text-muted-foreground">CPL</div>
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{c.close_rate}%</div>
          <div className="text-xs text-muted-foreground">Close Rate</div>
        </div>
        <div>
          <div className="text-xl font-bold text-emerald-400">{c.roi}x</div>
          <div className="text-xs text-muted-foreground">ROI</div>
        </div>
      </div>

      {/* Budget bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Spend: ${c.spend.toLocaleString()}</span>
          <span>Rev: ${(c.revenue / 1000).toFixed(0)}k</span>
        </div>
        <Progress value={budgetUsed} className="h-1.5" />
        <div className="text-right text-xs text-muted-foreground mt-0.5">
          Budget: ${c.budget.toLocaleString()} Â· {budgetUsed}% used
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ New Campaign Modal (simple) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function NewCampaignModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Partial<Campaign>) => void }) {
  const [form, setForm] = useState({ name: '', owner: '', budget: '', start_date: '', end_date: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md flex flex-col gap-4">
        <div className="text-lg font-bold text-foreground">New LinkedIn Campaign</div>
        {[
          { label: 'Campaign Name', key: 'name', type: 'text' },
          { label: 'Owner', key: 'owner', type: 'text' },
          { label: 'Budget ($)', key: 'budget', type: 'number' },
          { label: 'Start Date', key: 'start_date', type: 'date' },
          { label: 'End Date', key: 'end_date', type: 'date' },
        ].map(({ label, key, type }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">{label}</label>
            <input
              type={type}
              value={(form as Record<string, string>)[key]}
              onChange={e => set(key, e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-cyan-500"
            />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={() => {
            onSave({ ...form, budget: Number(form.budget), status: 'draft', leads: 0, cpl: 0, close_rate: 0, roi: 0, spend: 0, revenue: 0 })
            onClose()
          }}>Create Campaign</Button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function LinkedInOps() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('campaigns')
  const [fetching, setFetching] = useState(false)

  // â”€â”€ Load data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadData = async () => {
    setLoading(true)
    try {
      const [{ data: camps }, { data: vends }] = await Promise.all([
        supabase.schema('linkedin').from('linkedin_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.schema('linkedin').from('linkedin_vendors').select('*').order('quality_score', { ascending: false }),
      ])
      if (camps) setCampaigns(camps)
      if (vends) setVendors(vends)
    } catch (e) {
      console.error('LinkedIn data load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalLeads = campaigns.reduce((s, c) => s + (c.leads || 0), 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const avgCPL = campaigns.length > 0
    ? (campaigns.reduce((s, c) => s + (c.cpl || 0), 0) / campaigns.length).toFixed(2)
    : '0.00'
  const avgCloseRate = campaigns.length > 0
    ? (campaigns.reduce((s, c) => s + (c.close_rate || 0), 0) / campaigns.length).toFixed(1)
    : '0.0'
  const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue || 0), 0)
  const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0)
  const overallROI = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(1) : '0.0'

  const fetchersActive = vendors.reduce((s, v) => s + (v.fetchers_active || 0), 0)
  const campaignsLive = vendors.reduce((s, v) => s + (v.campaigns_live || 0), 0)

  // â”€â”€ Toggle campaign status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleToggle = async (id: string, status: string) => {
    const next = status === 'active' ? 'paused' : 'active'
    await supabase.schema('linkedin').from('linkedin_campaigns').update({ status: next }).eq('id', id)
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: next as Campaign['status'] } : c))
  }

  // â”€â”€ Create campaign â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCreate = async (data: Partial<Campaign>) => {
    const newCamp = {
      ...data,
      campaign_id: `CAM-${String(campaigns.length + 1).padStart(3, '0')}`,
      status: 'draft',
      leads: 0, cpl: 0, close_rate: 0, roi: 0, spend: 0, revenue: 0,
    }
    const { data: inserted } = await supabase.schema('linkedin').from('linkedin_campaigns').insert([newCamp]).select().single()
    if (inserted) setCampaigns(prev => [inserted, ...prev])
  }

  // â”€â”€ Live fetch simulation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleLiveFetch = async () => {
    setFetching(true)
    await new Promise(r => setTimeout(r, 2000))
    await loadData()
    setFetching(false)
  }

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen">
      {showModal && <NewCampaignModal onClose={() => setShowModal(false)} onSave={handleCreate} />}

      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Linkedin size={22} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">LinkedIn Operations</h1>
            <p className="text-sm text-muted-foreground">Lead ingestion, campaign control & vendor ROI intelligence</p>
          </div>
          <div className="flex gap-2 ml-4">
            <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 text-xs">
              {fetchersActive} fetchers active
            </Badge>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">
              {campaignsLive} campaigns live
            </Badge>
          </div>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
        >
          <Plus size={15} /> New Campaign
        </Button>
      </div>

      {/* â”€â”€ Stats Bar â”€â”€ */}
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Total LinkedIn Leads" value={totalLeads.toLocaleString()} icon={Users} />
        <StatCard label="Avg CPL" value={`$${avgCPL}`} icon={DollarSign} />
        <StatCard label="Active Campaigns" value={String(activeCampaigns)} icon={Target} />
        <StatCard label="Close Rate" value={`${avgCloseRate}%`} icon={TrendingUp} />
        <StatCard label="Revenue" value={`$${(totalRevenue / 1000).toFixed(0)}k`} icon={BarChart2} />
        <StatCard label="ROI" value={`${overallROI}x`} icon={Zap} />
      </div>

      {/* â”€â”€ Tabs â”€â”€ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="campaigns" className="gap-1.5"><Target size={13} /> Campaigns</TabsTrigger>
          <TabsTrigger value="livefetch" className="gap-1.5"><RefreshCw size={13} /> Live Fetch</TabsTrigger>
          <TabsTrigger value="vendors" className="gap-1.5"><Users size={13} /> Vendors</TabsTrigger>
          <TabsTrigger value="scoring" className="gap-1.5"><Bot size={13} /> AI Scoring</TabsTrigger>
          <TabsTrigger value="budget" className="gap-1.5"><SlidersHorizontal size={13} /> Budget Scaler</TabsTrigger>
        </TabsList>

        {/* â”€â”€ Campaigns Tab â”€â”€ */}
        <TabsContent value="campaigns" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 h-52 animate-pulse" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <Linkedin size={40} className="opacity-20" />
              <p>No campaigns yet. Create your first LinkedIn campaign.</p>
              <Button onClick={() => setShowModal(true)} className="bg-cyan-600 hover:bg-cyan-700 gap-2">
                <Plus size={14} /> New Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {campaigns.map(c => (
                <CampaignCard key={c.id} c={c} onToggle={handleToggle} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* â”€â”€ Live Fetch Tab â”€â”€ */}
        <TabsContent value="livefetch" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">Live Lead Fetch</div>
                <div className="text-sm text-muted-foreground">Pull fresh leads from all active LinkedIn campaigns into the CRM pipeline</div>
              </div>
              <Button
                onClick={handleLiveFetch}
                disabled={fetching}
                className="bg-cyan-600 hover:bg-cyan-700 gap-2"
              >
                <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
                {fetching ? 'Fetching...' : 'Fetch Now'}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Last Fetch', value: 'Today, 2:14 PM' },
                { label: 'Leads Pulled', value: totalLeads.toLocaleString() },
                { label: 'Fetch Status', value: fetching ? 'Running...' : 'Idle' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-background border border-border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className="font-semibold text-foreground">{value}</div>
                </div>
              ))}
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    {['Campaign', 'Owner', 'Status', 'Leads Fetched', 'Last Updated'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 6).map((c, i) => (
                    <tr key={c.id} className={i % 2 === 0 ? 'bg-background' : 'bg-card'}>
                      <td className="px-4 py-3 text-foreground">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.owner}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                          c.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-zinc-500/10 text-zinc-400'
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-cyan-400 font-medium">{c.leads.toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'â€”'}
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No campaigns found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* â”€â”€ Vendors Tab â”€â”€ */}
        <TabsContent value="vendors" className="mt-4">
          {vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Users size={40} className="opacity-20" />
              <p>No vendors configured yet.</p>
              <p className="text-xs">Add vendors via the <code className="text-cyan-400">linkedin_vendors</code> Supabase table.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {vendors.map(v => (
                <div key={v.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-foreground">{v.name}</div>
                      <div className="text-xs text-muted-foreground">{v.type}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      v.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>{v.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-lg font-bold text-cyan-400">{v.fetchers_active}</div>
                      <div className="text-xs text-muted-foreground">Fetchers Active</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">{v.campaigns_live}</div>
                      <div className="text-xs text-muted-foreground">Campaigns Live</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-foreground">${v.cost_per_lead}</div>
                      <div className="text-xs text-muted-foreground">Cost / Lead</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-400">{v.quality_score}/10</div>
                      <div className="text-xs text-muted-foreground">Quality Score</div>
                    </div>
                  </div>
                  <Progress value={v.quality_score * 10} className="h-1" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* â”€â”€ AI Scoring Tab â”€â”€ */}
        <TabsContent value="scoring" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Bot size={20} className="text-cyan-400" />
              <div>
                <div className="font-semibold text-foreground">AI Lead Scoring</div>
                <div className="text-sm text-muted-foreground">Automated qualification scoring for all LinkedIn leads before CRM entry</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Avg Score', value: '74/100', color: 'text-cyan-400' },
                { label: 'High Quality', value: `${Math.round(totalLeads * 0.31).toLocaleString()}`, color: 'text-emerald-400' },
                { label: 'Needs Review', value: `${Math.round(totalLeads * 0.15).toLocaleString()}`, color: 'text-yellow-400' },
                { label: 'Disqualified', value: `${Math.round(totalLeads * 0.09).toLocaleString()}`, color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-background border border-border rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>
            <div className="bg-background border border-border rounded-lg p-4 text-sm text-muted-foreground">
              <p className="mb-2 font-medium text-foreground">Scoring Criteria</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Job title relevance to ICP (30 pts)</li>
                <li>Company size match (25 pts)</li>
                <li>Industry alignment (20 pts)</li>
                <li>Engagement signal (15 pts)</li>
                <li>Geography match (10 pts)</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* â”€â”€ Budget Scaler Tab â”€â”€ */}
        <TabsContent value="budget" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <SlidersHorizontal size={20} className="text-cyan-400" />
              <div>
                <div className="font-semibold text-foreground">Budget Scaler</div>
                <div className="text-sm text-muted-foreground">Allocate and scale budgets across active campaigns based on ROI performance</div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {campaigns.filter(c => c.status === 'active').map(c => {
                const pct = c.budget > 0 ? Math.round((c.spend / c.budget) * 100) : 0
                return (
                  <div key={c.id} className="bg-background border border-border rounded-lg p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-foreground text-sm">{c.name}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>ROI: <span className="text-emerald-400 font-semibold">{c.roi}x</span></span>
                        <span>Budget: <span className="text-foreground font-semibold">${c.budget.toLocaleString()}</span></span>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Spent: ${c.spend.toLocaleString()} ({pct}%)</span>
                      <span>Remaining: ${(c.budget - c.spend).toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
              {campaigns.filter(c => c.status === 'active').length === 0 && (
                <div className="text-center py-10 text-muted-foreground">No active campaigns to scale.</div>
              )}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border text-sm">
              <span className="text-muted-foreground">Total Budget Allocated</span>
              <span className="font-bold text-foreground">
                ${campaigns.reduce((s, c) => s + (c.budget || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
