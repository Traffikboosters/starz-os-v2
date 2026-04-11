'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .schema('crm').from('leads')
        .select('id, name, company_name, email, phone, revenue_tier, status, created_at, pitch_sent_at')
        .order('created_at', { ascending: false })
        .limit(50)
      setLeads(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = leads.filter(l => {
    const matchSearch = !search ||
      (l.company_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || l.status === filter ||
      (filter === 'hot' && l.revenue_tier === 'dominance')
    return matchSearch && matchFilter
  })

  const tierColor = (t: string) => t === 'dominance' ? { bg:'#26215C', color:'#AFA9EC' } : { bg:'#085041', color:'#9FE1CB' }
  const statusColor = (s: string) => {
    if (s === 'won')      return '#1D9E75'
    if (s === 'qualified') return '#5DCAA5'
    if (s === 'contacted') return '#EF9F27'
    if (s === 'lost')     return '#E24B4A'
    return '#555'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
          <span style={{ color:'#666', fontSize:13 }}>My Leads</span>
          <span style={{ background:'#131320', color:'#555', fontSize:11, padding:'2px 8px', borderRadius:4 }}>{leads.length}</span>
        </div>
      </div>

      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company, email..."
            style={{ flex:1, background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'10px 14px',
              color:'#e8e6e0', fontSize:13, outline:'none' }} />
          <div style={{ display:'flex', gap:4 }}>
            {['all','new','contacted','qualified','hot'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'8px 14px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12,
                  background: filter === f ? '#1D9E75' : '#131320',
                  color: filter === f ? '#fff' : '#666' }}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div style={{ color:'#555', fontSize:13 }}>Loading leads...</div> : (
          <div style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:10, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#0a0a0f' }}>
                  {['Business','Contact','Email','Phone','Tier','Status','Last Contact','Actions'].map(h => (
                    <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => {
                  const tc = tierColor(lead.revenue_tier)
                  return (
                    <tr key={lead.id} style={{ borderTop:'1px solid #1a1a2e', background: i%2===0?'transparent':'#0d0d14' }}>
                      <td style={{ padding:'11px 16px' }}>
                        <div style={{ fontSize:13, fontWeight:500 }}>{lead.company_name || '—'}</div>
                      </td>
                      <td style={{ padding:'11px 16px', fontSize:12, color:'#888' }}>{lead.name || '—'}</td>
                      <td style={{ padding:'11px 16px', fontSize:12, color:'#888' }}>{lead.email || '—'}</td>
                      <td style={{ padding:'11px 16px', fontSize:12, color:'#888' }}>{lead.phone || '—'}</td>
                      <td style={{ padding:'11px 16px' }}>
                        {lead.revenue_tier && (
                          <span style={{ ...tc, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4 }}>
                            {lead.revenue_tier === 'dominance' ? 'Dominance' : 'Ignition'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding:'11px 16px' }}>
                        <span style={{ fontSize:12, color:statusColor(lead.status) }}>{lead.status || '—'}</span>
                      </td>
                      <td style={{ padding:'11px 16px', fontSize:11, color:'#555' }}>
                        {lead.pitch_sent_at ? new Date(lead.pitch_sent_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding:'11px 16px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          {lead.phone && (
                            <button onClick={() => router.push(`tel:${lead.phone}`)}
                              style={{ background:'#085041', border:'none', borderRadius:5, color:'#9FE1CB', padding:'4px 10px', fontSize:11, cursor:'pointer' }}>
                              Call
                            </button>
                          )}
                          <button style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:5, color:'#888', padding:'4px 10px', fontSize:11, cursor:'pointer' }}>
                            Note
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ padding:32, textAlign:'center', color:'#555', fontSize:13 }}>No leads found</div>}
          </div>
        )}
      </div>
    </div>
  )
}