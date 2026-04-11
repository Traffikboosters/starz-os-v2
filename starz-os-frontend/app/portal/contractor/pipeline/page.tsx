'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()
const STAGES = ['new','contacted','qualified','proposal','negotiation','won','lost']

export default function PipelinePage() {
  const router = useRouter()
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .schema('deals').from('pipeline')
        .select('id, name, company, lead_name, stage, value, revenue_tier, email, phone, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(100)
      setDeals(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const byStage = (stage: string) => deals.filter(d => d.stage === stage)
  const tierColor = (t: string) => t === 'dominance' ? '#534AB7' : '#1D9E75'
  const stageLabel = (s: string) => s.charAt(0).toUpperCase()+s.slice(1).replace('_',' ')

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', gap:12, height:52, flexShrink:0 }}>
        <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <span style={{ color:'#666', fontSize:13 }}>Pipeline</span>
        <span style={{ background:'#131320', color:'#555', fontSize:11, padding:'2px 8px', borderRadius:4 }}>{deals.length} deals</span>
      </div>

      <div style={{ overflowX:'auto', padding:'20px 24px' }}>
        <div style={{ display:'flex', gap:12, minWidth:'max-content' }}>
          {STAGES.map(stage => (
            <div key={stage} style={{ width:260, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:1 }}>{stageLabel(stage)}</span>
                <span style={{ fontSize:11, color:'#555' }}>{byStage(stage).length}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {byStage(stage).map(deal => (
                  <div key={deal.id} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'14px 16px',
                    borderTop: `3px solid ${tierColor(deal.revenue_tier)}` }}>
                    <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>{deal.company || deal.name || '—'}</div>
                    <div style={{ fontSize:11, color:'#555', marginBottom:8 }}>{deal.lead_name || deal.email || '—'}</div>
                    {deal.value && (
                      <div style={{ fontSize:13, fontWeight:700, color:'#1D9E75' }}>
                        ${Math.round(deal.value).toLocaleString()}/mo
                      </div>
                    )}
                    {deal.revenue_tier && (
                      <span style={{ fontSize:9, color:tierColor(deal.revenue_tier), background:tierColor(deal.revenue_tier)+'22',
                        borderRadius:3, padding:'2px 6px', marginTop:6, display:'inline-block', fontWeight:700 }}>
                        {deal.revenue_tier}
                      </span>
                    )}
                  </div>
                ))}
                {byStage(stage).length === 0 && (
                  <div style={{ border:'1px dashed #1a1a2e', borderRadius:8, padding:'20px', textAlign:'center', color:'#333', fontSize:12 }}>
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}