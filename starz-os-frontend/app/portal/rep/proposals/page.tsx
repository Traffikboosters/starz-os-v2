'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

export default function ProposalsPage() {
  const router = useRouter()
  const [proposals, setProposals] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [sending, setSending] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [pRes, lRes] = await Promise.all([
        supabase.schema('deals').from('proposals').select('*').order('sent_at', { ascending: false }).limit(20),
        supabase.schema('crm').from('leads').select('id, name, company_name, email, revenue_tier')
          .in('status', ['qualified','contacted']).limit(20)
      ])
      setProposals(pRes.data ?? [])
      setLeads(lRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const sendProposal = async (lead: any) => {
    setSending(lead.id)
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/proposal-send`,
        { method: 'POST',
          headers: { 'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
          body: JSON.stringify({ lead_id: lead.id }) }
      )
      const d = await r.json()
      if (d.success) alert(`Proposal sent to ${lead.email} — ${d.proposal_id}`)
      else alert(`Error: ${d.error}`)
    } catch(e) { alert(`Error: ${e}`) }
    finally { setSending(null) }
  }

  const statusColor = (s: string) => s === 'sent' ? '#EF9F27' : s === 'signed' ? '#1D9E75' : '#555'

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', gap:12, height:52 }}>
        <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <span style={{ color:'#666', fontSize:13 }}>Proposals</span>
      </div>

      <div style={{ padding:'24px 32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        <div>
          <div style={{ fontSize:11, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:14 }}>Send a Proposal</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {leads.map(lead => (
              <div key={lead.id} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{lead.company_name || lead.name}</div>
                  <div style={{ fontSize:11, color:'#555', marginTop:2 }}>{lead.email}</div>
                </div>
                <button onClick={() => sendProposal(lead)} disabled={sending === lead.id}
                  style={{ background:'#1D9E75', border:'none', borderRadius:6, color:'#fff', padding:'6px 14px', fontSize:12, cursor:'pointer', opacity: sending === lead.id ? 0.5 : 1 }}>
                  {sending === lead.id ? 'Sending...' : 'Send'}
                </button>
              </div>
            ))}
            {leads.length === 0 && <div style={{ color:'#555', fontSize:13 }}>No qualified leads ready for proposals</div>}
          </div>
        </div>

        <div>
          <div style={{ fontSize:11, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:14 }}>Sent Proposals</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {proposals.map(p => (
              <div key={p.id} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontFamily:'monospace', color:'#888' }}>{p.proposal_id}</span>
                  <span style={{ fontSize:11, color:statusColor(p.status), background:statusColor(p.status)+'22', borderRadius:4, padding:'2px 8px' }}>{p.status}</span>
                </div>
                <div style={{ fontSize:11, color:'#555' }}>{p.sent_at ? new Date(p.sent_at).toLocaleDateString() : '—'}</div>
              </div>
            ))}
            {proposals.length === 0 && <div style={{ color:'#555', fontSize:13 }}>No proposals sent yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}