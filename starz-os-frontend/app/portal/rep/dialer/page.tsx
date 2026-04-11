'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

export default function DialerPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [current, setCurrent] = useState<any>(null)
  const [scriptData, setScriptData] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [callActive, setCallActive] = useState(false)
  const [timer, setTimer] = useState(0)
  const [disposition, setDisposition] = useState<string|null>(null)
  const [loadingScript, setLoadingScript] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.schema('crm').from('leads')
        .select('id, name, company_name, email, phone, revenue_tier, status')
        .in('status', ['new','contacted','qualified'])
        .not('phone', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20)
      setLeads(data ?? [])
      if (data && data.length > 0) selectLead(data[0])
    }
    load()
  }, [])

  const selectLead = async (lead: any) => {
    setCurrent(lead)
    setNotes('')
    setDisposition(null)
    setLoadingScript(true)
    try {
      const { data, error } = await supabase.rpc('get_call_script', { p_lead_id: lead.id })
      if (data && !error) {
        setScriptData(data)
      } else {
        // Fallback script if RPC fails
        setScriptData({
          script_opener: lead.revenue_tier === 'dominance'
            ? 'Dominance Growth System — own your market'
            : 'Revenue Ignition System — break past $65K/month',
          script: lead.revenue_tier === 'dominance'
            ? `Hi, this is Steve from Traffik Boosters. After analyzing ${lead.company_name ?? 'your market'}, there is a significant opportunity to dominate your space. We use our Dominance Growth System for businesses at your level — focused on top-3 rankings, competitor intelligence, and full automation. Would you have 15 minutes this week?`
            : `Hi, this is Steve from Traffik Boosters. I took a look at ${lead.company_name ?? 'your business'} and noticed you are in a strong position to grow. We built the Revenue Ignition System specifically for businesses looking to break past $65K/month consistently. Would you be open to a quick 15-minute call?`,
          revenue_tier: lead.revenue_tier,
          offer_system: lead.revenue_tier === 'dominance' ? 'Dominance Growth System' : 'Revenue Ignition System',
          phone: lead.phone,
          business_name: lead.company_name,
        })
      }
    } catch {
      setScriptData(null)
    }
    setLoadingScript(false)
  }

  useEffect(() => {
    let interval: any
    if (callActive) interval = setInterval(() => setTimer(t => t + 1), 1000)
    else { clearInterval(interval); setTimer(0) }
    return () => clearInterval(interval)
  }, [callActive])

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const tierColor = (t: string) => t === 'dominance' ? '#534AB7' : '#1D9E75'
  const tierBg    = (t: string) => t === 'dominance' ? '#26215C' : '#085041'

  const dispositions = [
    { label:'No Answer',    color:'#555' },
    { label:'Interested',   color:'#1D9E75' },
    { label:'Not Interested', color:'#E24B4A' },
    { label:'Callback',     color:'#EF9F27' },
    { label:'Booked Appt',  color:'#5DCAA5' },
    { label:'Left VM',      color:'#7F77DD' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px',
        display:'flex', alignItems:'center', justifyContent:'space-between', height:52, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
          <span style={{ color:'#666', fontSize:13 }}>PowerDial</span>
          <span style={{ background:'#131320', color:'#555', fontSize:11, padding:'2px 8px', borderRadius:4 }}>{leads.length} in queue</span>
          {callActive && (
            <span style={{ background:'#E24B4A', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:4 }}>
              ● LIVE {fmt(timer)}
            </span>
          )}
        </div>
        {current && (
          <div style={{ fontSize:12, color:'#555' }}>
            {scriptData?.offer_system && (
              <span style={{ background: tierBg(scriptData.revenue_tier ?? ''), color: tierColor(scriptData.revenue_tier ?? ''),
                fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:4 }}>
                {scriptData.offer_system}
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Queue */}
        <div style={{ width:300, borderRight:'1px solid #1a1a2e', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'12px 18px', borderBottom:'1px solid #1a1a2e', fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase' }}>
            Call Queue
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {leads.map(lead => (
              <div key={lead.id} onClick={() => selectLead(lead)}
                style={{ padding:'12px 18px', borderBottom:'1px solid #1a1a2e', cursor:'pointer',
                  background: current?.id === lead.id ? '#131320' : 'transparent',
                  borderLeft: current?.id === lead.id ? `3px solid ${tierColor(lead.revenue_tier)}` : '3px solid transparent' }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{lead.company_name || lead.name || '—'}</div>
                <div style={{ fontSize:11, color:'#555', marginBottom:4 }}>{lead.phone}</div>
                {lead.revenue_tier && (
                  <span style={{ fontSize:9, fontWeight:700, color:tierColor(lead.revenue_tier),
                    background:tierColor(lead.revenue_tier)+'22', borderRadius:3, padding:'1px 6px' }}>
                    {lead.revenue_tier}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main workspace */}
        {current ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Lead card + call button */}
            <div style={{ padding:'18px 28px', borderBottom:'1px solid #1a1a2e', background:'#131320', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{current.company_name || current.name}</div>
                  <div style={{ fontSize:13, color:'#888' }}>
                    {current.phone}
                    {current.email && <span style={{ marginLeft:12 }}>{current.email}</span>}
                  </div>
                  {scriptData?.price_range && (
                    <div style={{ fontSize:12, color:'#555', marginTop:4 }}>
                      Est. revenue: {scriptData.estimated_revenue ? `$${scriptData.estimated_revenue.toLocaleString()}/mo` : '—'}
                      {' · '}Price range: {scriptData.price_range}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  {current.phone && (
                    <a href={`tel:${current.phone}`}
                      style={{ background:'transparent', border:'1px solid #1D9E75', borderRadius:8,
                        color:'#1D9E75', padding:'8px 18px', fontSize:13, textDecoration:'none' }}>
                      📞 {current.phone}
                    </a>
                  )}
                  <button onClick={() => setCallActive(!callActive)}
                    style={{ background: callActive ? '#E24B4A' : '#1D9E75', border:'none', borderRadius:8,
                      color:'#fff', padding:'10px 24px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                    {callActive ? '⏹ End Call' : '▶ Start Call'}
                  </button>
                </div>
              </div>
            </div>

            {/* Script + notes + disposition */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, flex:1, overflow:'hidden' }}>

              {/* Script panel */}
              <div style={{ padding:'20px 28px', borderRight:'1px solid #1a1a2e', overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }}>

                {loadingScript ? (
                  <div style={{ color:'#555', fontSize:13 }}>Loading script...</div>
                ) : scriptData ? (
                  <>
                    {/* Opener */}
                    <div>
                      <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Opener</div>
                      <div style={{ background: tierBg(scriptData.revenue_tier ?? ''),
                        border:`1px solid ${tierColor(scriptData.revenue_tier ?? '')}44`,
                        borderRadius:8, padding:'10px 14px', fontSize:12,
                        color: tierColor(scriptData.revenue_tier ?? ''), fontWeight:600 }}>
                        {scriptData.script_opener}
                      </div>
                    </div>

                    {/* Full script */}
                    <div>
                      <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Full Script</div>
                      <div style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'14px 16px',
                        fontSize:13, color:'#e8e6e0', lineHeight:1.8, whiteSpace:'pre-wrap' }}>
                        {scriptData.script}
                      </div>
                    </div>

                    {/* Pitch outcome */}
                    {scriptData.pitch_outcome && (
                      <div>
                        <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Goal of this call</div>
                        <div style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'10px 14px',
                          fontSize:12, color:'#EF9F27' }}>
                          {scriptData.pitch_outcome}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color:'#555', fontSize:13 }}>No script available for this lead.</div>
                )}

                {/* Disposition */}
                <div>
                  <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>Disposition</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {dispositions.map(d => (
                      <button key={d.label} onClick={() => setDisposition(d.label)}
                        style={{ background: disposition === d.label ? d.color+'33' : '#131320',
                          border: `1px solid ${disposition === d.label ? d.color : '#1a1a2e'}`,
                          borderRadius:6, color: disposition === d.label ? d.color : '#666',
                          padding:'8px', fontSize:12, cursor:'pointer', fontWeight: disposition === d.label ? 700 : 400 }}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes panel */}
              <div style={{ padding:'20px 28px', display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase' }}>Call Notes</div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Type notes during the call..."
                  style={{ flex:1, minHeight:200, background:'#131320', border:'1px solid #1a1a2e', borderRadius:8,
                    padding:'12px', color:'#e8e6e0', fontSize:13, resize:'none', outline:'none', lineHeight:1.7 }} />
                <button
                  style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8,
                    color:'#888', padding:'10px', fontSize:13, cursor:'pointer' }}>
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#555', fontSize:14 }}>
            No leads in queue
          </div>
        )}
      </div>
    </div>
  )
}