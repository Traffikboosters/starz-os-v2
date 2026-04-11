'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface MonthlyProgress {
  month_start: string; deal_target: number; deals_closed: number
  revenue_generated: number; leads_contacted: number; leads_qualified: number
  proposals_sent: number; qualification_rate: number; close_rate: number
  progress_pct: number; deals_remaining: number; projected_month_end: number
  outreach_failures: number
}
interface Alert {
  id: string; severity: 'info'|'warning'|'critical'
  title: string; message: string; meta: Record<string,any>; created_at: string
}
interface Lead {
  id: string; name: string; company: string; email: string
  revenue_tier: string; status: string; pitch_sent_at: string|null
}
interface DailyKPI {
  kpi_date: string; deals_closed: number; leads_contacted: number
  proposals_sent: number; outreach_failures: number
}

export default function SteveKPIDashboard() {
  const [monthly, setMonthly]   = useState<MonthlyProgress|null>(null)
  const [daily, setDaily]       = useState<DailyKPI[]>([])
  const [alerts, setAlerts]     = useState<Alert[]>([])
  const [leads, setLeads]       = useState<Lead[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'overview'|'leads'|'alerts'>('overview')
  const [sending, setSending]   = useState<string|null>(null)
  const [refreshed, setRefreshed] = useState(new Date())

  const load = useCallback(async () => {
    const [m, d, a, l] = await Promise.all([
      supabase.schema('analytics').from('v_steve_monthly_progress')
        .select('*').order('month_start',{ascending:false}).limit(1).single(),
      supabase.schema('analytics').from('steve_kpis_daily')
        .select('kpi_date,deals_closed,leads_contacted,proposals_sent,outreach_failures')
        .order('kpi_date',{ascending:false}).limit(14),
      supabase.schema('analytics').from('v_steve_active_alerts').select('*').limit(20),
      supabase.schema('crm').from('leads')
        .select('id,name,company,email,revenue_tier,status,pitch_sent_at')
        .in('revenue_tier',['ignition','dominance'])
        .not('status','in','(won,lost,disqualified)')
        .order('created_at',{ascending:false}).limit(25),
    ])
    if (m.data)  setMonthly(m.data)
    if (d.data)  setDaily(d.data)
    if (a.data)  setAlerts(a.data)
    if (l.data)  setLeads(l.data)
    setRefreshed(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { load(); const t = setInterval(load,60000); return ()=>clearInterval(t) }, [load])

  const sendProposal = async (lead: Lead) => {
    setSending(lead.id)
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/outreach-proxy`,
        { method:'POST', headers:{'Content-Type':'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??'',
          'x-proxy-secret': process.env.NEXT_PUBLIC_PROXY_SECRET??'' },
          body: JSON.stringify({ _route:'proposal', lead_id: lead.id }) }
      )
      const data = await r.json()
      if (data.success) alert(`Proposal sent to ${lead.email}`)
      else alert(`Error: ${data.error}`)
      load()
    } catch(e){ alert(`Error: ${e}`) }
    finally { setSending(null) }
  }

  const fmt    = (n:number) => Math.round(n??0).toLocaleString()
  const fmtPct = (n:number) => `${parseFloat((n??0).toString()).toFixed(1)}%`
  const pace   = monthly ? Math.round((monthly.deals_closed/monthly.deal_target)*100) : 0
  const dayNum = new Date().getDate()
  const expected = monthly ? Math.round((monthly.deal_target/30)*dayNum) : 0
  const crits  = alerts.filter(a=>a.severity==='critical')

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0d0d14',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{color:'#5DCAA5',fontFamily:'monospace',fontSize:14}}>Loading STARZ-OS...</span>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0d0d14',color:'#e8e6e0',fontFamily:'Helvetica,sans-serif'}}>

      {/* Header */}
      <div style={{background:'#0a0a0f',borderBottom:'1px solid #1a1a2e',padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between',height:52}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{color:'#5DCAA5',fontWeight:700,fontSize:12,letterSpacing:2}}>STARZ-OS</span>
          <span style={{color:'#333'}}>·</span>
          <span style={{color:'#666',fontSize:13}}>Steve KPI Dashboard</span>
          {crits.length>0 && <span style={{background:'#2d1515',border:'1px solid #E24B4A',borderRadius:6,padding:'2px 10px',fontSize:11,color:'#E24B4A'}}>{crits.length} critical</span>}
        </div>
        <span style={{fontSize:11,color:'#444',fontFamily:'monospace'}}>{refreshed.toLocaleTimeString()}</span>
      </div>

      <div style={{padding:'24px 32px',maxWidth:1200,margin:'0 auto'}}>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,marginBottom:24,background:'#131320',borderRadius:8,padding:4,width:'fit-content'}}>
          {(['overview','leads','alerts'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'6px 18px',borderRadius:6,border:'none',cursor:'pointer',
              fontSize:13,fontWeight:tab===t?600:400,
              background:tab===t?'#1D9E75':'transparent',
              color:tab===t?'#fff':'#666',transition:'all .15s'}}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
              {t==='alerts'&&alerts.length>0&&<span style={{marginLeft:6,background:crits.length>0?'#E24B4A':'#BA7517',borderRadius:10,padding:'1px 6px',fontSize:10}}>{alerts.length}</span>}
            </button>
          ))}
        </div>

        {tab==='overview' && <>
          {/* KPI cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            {[
              {label:'Deals closed',   value:monthly?.deals_closed??0,  sub:`of ${monthly?.deal_target??20} target`,  accent:'#5DCAA5'},
              {label:'Revenue',        value:`$${fmt(monthly?.revenue_generated??0)}`, sub:'this month', accent:'#7F77DD'},
              {label:'Close rate',     value:fmtPct(monthly?.close_rate??0), sub:'shows → closed', accent:'#EF9F27'},
              {label:'Month end proj', value:monthly?.projected_month_end??'—', sub:'projected deals', accent:'#5DCAA5'},
            ].map(({label,value,sub,accent})=>(
              <div key={label} style={{background:'#131320',border:'1px solid #1a1a2e',borderRadius:10,padding:'18px 20px'}}>
                <div style={{fontSize:10,color:'#555',letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>{label}</div>
                <div style={{fontSize:28,fontWeight:700,color:accent,lineHeight:1}}>{value}</div>
                <div style={{fontSize:11,color:'#444',marginTop:6}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Pace bar */}
          <div style={{background:'#131320',border:'1px solid #1a1a2e',borderRadius:10,padding:'18px 20px',marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <span style={{fontSize:12,color:'#666'}}>Monthly pace — Day {dayNum} of 30</span>
              <span style={{fontSize:12,color:pace>=Math.round(dayNum/30*100)?'#5DCAA5':'#E24B4A'}}>{pace}% to target</span>
            </div>
            <div style={{background:'#0a0a0f',borderRadius:6,height:10,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:6,width:`${Math.min(pace,100)}%`,
                background:pace>=Math.round(dayNum/30*100)?'#1D9E75':'#E24B4A',transition:'width .5s'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'#444'}}>
              <span>0</span>
              <span style={{color:'#BA7517'}}>Expected today: {expected}</span>
              <span>{monthly?.deal_target??20}</span>
            </div>
          </div>

          {/* Funnel + bars */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{background:'#131320',border:'1px solid #1a1a2e',borderRadius:10,padding:'18px 20px'}}>
              <div style={{fontSize:10,color:'#555',letterSpacing:1,marginBottom:14,textTransform:'uppercase'}}>Sales funnel — MTD</div>
              {monthly && [
                {label:'Leads contacted', val:monthly.leads_contacted,                    color:'#534AB7'},
                {label:'Leads qualified', val:monthly.leads_qualified, rate:fmtPct(monthly.qualification_rate), color:'#1D9E75'},
                {label:'Proposals sent',  val:monthly.proposals_sent,                     color:'#EF9F27'},
                {label:'Deals closed',    val:monthly.deals_closed,    rate:fmtPct(monthly.close_rate), color:'#5DCAA5'},
              ].map(({label,val,rate,color})=>{
                const max=Math.max(monthly.leads_contacted,1)
                return (
                  <div key={label} style={{marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:12,color:'#888'}}>{label}</span>
                      <div style={{display:'flex',gap:8}}>
                        {rate&&<span style={{fontSize:11,color}}>{rate}</span>}
                        <span style={{fontSize:12,fontWeight:600,color:'#e8e6e0'}}>{fmt(val)}</span>
                      </div>
                    </div>
                    <div style={{background:'#0a0a0f',borderRadius:4,height:6,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:4,width:`${Math.max(val/max*100,val>0?3:0)}%`,background:color}}/>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{background:'#131320',border:'1px solid #1a1a2e',borderRadius:10,padding:'18px 20px'}}>
              <div style={{fontSize:10,color:'#555',letterSpacing:1,marginBottom:14,textTransform:'uppercase'}}>Daily closes — last 14 days</div>
              <div style={{display:'flex',alignItems:'flex-end',gap:3,height:80}}>
                {[...daily].reverse().map((d,i)=>{
                  const mx=Math.max(...daily.map(x=>x.deals_closed),1)
                  const h=Math.max(d.deals_closed/mx*70,d.deals_closed>0?4:2)
                  return <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                    <div style={{width:'100%',borderRadius:'2px 2px 0 0',height:h,
                      background:d.deals_closed>0?'#1D9E75':'#1a1a2e'}}
                      title={`${d.kpi_date}: ${d.deals_closed}`}/>
                    <span style={{fontSize:9,color:'#333'}}>{new Date(d.kpi_date).getDate()}</span>
                  </div>
                })}
              </div>
              <div style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div style={{background:'#0a0a0f',borderRadius:6,padding:'8px 12px'}}>
                  <div style={{fontSize:10,color:'#555',marginBottom:2}}>Outreach sent</div>
                  <div style={{fontSize:16,fontWeight:600}}>{fmt(monthly?.leads_contacted??0)}</div>
                </div>
                <div style={{background:'#0a0a0f',borderRadius:6,padding:'8px 12px'}}>
                  <div style={{fontSize:10,color:'#555',marginBottom:2}}>Engine failures</div>
                  <div style={{fontSize:16,fontWeight:600,color:(monthly?.outreach_failures??0)>10?'#E24B4A':'#e8e6e0'}}>{fmt(monthly?.outreach_failures??0)}</div>
                </div>
              </div>
            </div>
          </div>
        </>}

        {tab==='leads' && (
          <div style={{background:'#131320',border:'1px solid #1a1a2e',borderRadius:10,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#0a0a0f'}}>
                  {['Business','Tier','Status','Pitched','Action'].map(h=>(
                    <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:10,color:'#555',letterSpacing:1,fontWeight:600,textTransform:'uppercase'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead,i)=>(
                  <tr key={lead.id} style={{borderTop:'1px solid #1a1a2e',background:i%2===0?'transparent':'#0d0d14'}}>
                    <td style={{padding:'11px 16px'}}>
                      <div style={{fontSize:13,fontWeight:500}}>{lead.company||lead.name||'—'}</div>
                      <div style={{fontSize:11,color:'#555',marginTop:1}}>{lead.email}</div>
                    </td>
                    <td style={{padding:'11px 16px'}}>
                      <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,
                        background:lead.revenue_tier==='dominance'?'#26215C':'#085041',
                        color:lead.revenue_tier==='dominance'?'#AFA9EC':'#9FE1CB'}}>
                        {lead.revenue_tier==='dominance'?'Dominance':'Ignition'}
                      </span>
                    </td>
                    <td style={{padding:'11px 16px',fontSize:12,color:'#888'}}>{lead.status}</td>
                    <td style={{padding:'11px 16px',fontSize:12,color:lead.pitch_sent_at?'#5DCAA5':'#555'}}>
                      {lead.pitch_sent_at?new Date(lead.pitch_sent_at).toLocaleDateString():'Not yet'}
                    </td>
                    <td style={{padding:'11px 16px'}}>
                      <button onClick={()=>sendProposal(lead)} disabled={sending===lead.id}
                        style={{padding:'5px 12px',borderRadius:6,border:'1px solid #1D9E75',background:'transparent',
                          color:'#1D9E75',fontSize:12,cursor:'pointer',opacity:sending===lead.id?0.5:1}}>
                        {sending===lead.id?'Sending...':'Send Proposal'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab==='alerts' && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {alerts.length===0&&<div style={{background:'#131320',border:'1px solid #1a1a2e',borderRadius:10,padding:32,textAlign:'center',color:'#5DCAA5',fontSize:14}}>No active alerts — Steve is on track</div>}
            {alerts.map(alert=>(
              <div key={alert.id} style={{background:'#131320',borderRadius:10,padding:'16px 20px',
                borderLeft:`3px solid ${alert.severity==='critical'?'#E24B4A':'#BA7517'}`}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <span style={{fontSize:10,fontWeight:700,color:alert.severity==='critical'?'#E24B4A':'#BA7517',textTransform:'uppercase',letterSpacing:1}}>{alert.severity}</span>
                  <span style={{fontSize:13,fontWeight:600}}>{alert.title}</span>
                </div>
                <p style={{margin:0,fontSize:13,color:'#888',lineHeight:1.6}}>{alert.message}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}