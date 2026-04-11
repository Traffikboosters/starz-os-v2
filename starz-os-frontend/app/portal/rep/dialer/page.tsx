'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

export default function DialerPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [current, setCurrent] = useState<any>(null)
  const [script, setScript] = useState('')
  const [notes, setNotes] = useState('')
  const [callActive, setCallActive] = useState(false)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.schema('crm').from('leads')
        .select('id, name, company_name, email, phone, revenue_tier, status')
        .in('status', ['new','contacted','qualified'])
        .not('phone', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20)
      setLeads(data ?? [])
      if (data && data.length > 0) {
        setCurrent(data[0])
        setScript(data[0].revenue_tier === 'dominance'
          ? `Hi, this is Steve from Traffik Boosters. After analyzing ${data[0].company_name ?? 'your market'}, there is a significant opportunity to dominate your space. We use our Dominance Growth System for businesses at your level — focused on top-3 rankings, competitor intelligence, and full automation. Would you have 15 minutes this week?`
          : `Hi, this is Steve from Traffik Boosters. I took a look at ${data[0].company_name ?? 'your business'} and noticed you are in a strong position to grow. We built the Revenue Ignition System specifically for businesses looking to break past $65K/month consistently. Would you be open to a quick 15-minute call?`)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let interval: any
    if (callActive) interval = setInterval(() => setTimer(t => t+1), 1000)
    else { clearInterval(interval); setTimer(0) }
    return () => clearInterval(interval)
  }, [callActive])

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const tierColor = (t: string) => t === 'dominance' ? '#534AB7' : '#1D9E75'

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', gap:12, height:52 }}>
        <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <span style={{ color:'#666', fontSize:13 }}>PowerDial</span>
        {callActive && <span style={{ background:'#E24B4A', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:4 }}>● LIVE {fmt(timer)}</span>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:0, height:'calc(100vh - 52px)' }}>

        {/* Call queue */}
        <div style={{ borderRight:'1px solid #1a1a2e', overflowY:'auto' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #1a1a2e', fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase' }}>
            Call Queue ({leads.length})
          </div>
          {leads.map((lead, i) => (
            <div key={lead.id} onClick={() => { setCurrent(lead); setNotes('') }}
              style={{ padding:'12px 20px', borderBottom:'1px solid #1a1a2e', cursor:'pointer',
                background: current?.id === lead.id ? '#131320' : 'transparent',
                borderLeft: current?.id === lead.id ? '3px solid #1D9E75' : '3px solid transparent' }}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{lead.company_name || lead.name || '—'}</div>
              <div style={{ fontSize:11, color:'#555' }}>{lead.phone || 'No phone'}</div>
              {lead.revenue_tier && (
                <span style={{ fontSize:9, fontWeight:700, color:tierColor(lead.revenue_tier),
                  background: tierColor(lead.revenue_tier)+'22', borderRadius:3, padding:'1px 6px', marginTop:4, display:'inline-block' }}>
                  {lead.revenue_tier}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Dialer workspace */}
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {current ? (
            <>
              {/* Lead card */}
              <div style={{ padding:'20px 28px', borderBottom:'1px solid #1a1a2e', background:'#131320' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{current.company_name || current.name}</div>
                    <div style={{ fontSize:13, color:'#888' }}>{current.phone} · {current.email}</div>
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={() => setCallActive(!callActive)}
                      style={{ background: callActive ? '#E24B4A' : '#1D9E75', border:'none', borderRadius:8,
                        color:'#fff', padding:'10px 24px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                      {callActive ? '⏹ End Call' : '📞 Call Now'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Script + notes */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, flex:1, overflow:'hidden' }}>
                <div style={{ padding:'20px 28px', borderRight:'1px solid #1a1a2e', overflowY:'auto' }}>
                  <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>Call Script</div>
                  <div style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'16px', fontSize:13, color:'#e8e6e0', lineHeight:1.8 }}>
                    {script}
                  </div>
                  <div style={{ marginTop:16 }}>
                    <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>Disposition</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {['No Answer','Interested','Not Interested','Callback','Booked Appt'].map(d => (
                        <button key={d} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:6,
                          color:'#888', padding:'8px', fontSize:12, cursor:'pointer', textAlign:'center' }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ padding:'20px 28px', overflowY:'auto' }}>
                  <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>Call Notes</div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Type notes during the call..."
                    style={{ width:'100%', height:200, background:'#131320', border:'1px solid #1a1a2e', borderRadius:8,
                      padding:'12px', color:'#e8e6e0', fontSize:13, resize:'vertical', outline:'none', boxSizing:'border-box' }} />
                </div>
              </div>
            </>
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, color:'#555', fontSize:14 }}>
              No leads in queue
            </div>
          )}
        </div>
      </div>
    </div>
  )
}