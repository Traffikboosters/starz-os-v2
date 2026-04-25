'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

export default function KPIsPage() {
  const router = useRouter()
  const [monthly, setMonthly] = useState<any>(null)
  const [daily, setDaily] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const [m, d] = await Promise.all([
        supabase.schema('analytics').from('v_steve_monthly_progress').select('*').order('month_start', { ascending: false }).limit(1).single(),
        supabase.schema('analytics').from('steve_kpis_daily').select('*').order('kpi_date', { ascending: false }).limit(14)
      ])
      if (m.data) setMonthly(m.data)
      if (d.data) setDaily(d.data)
    }
    load()
  }, [])

  const fmt = (n: number) => Math.round(n ?? 0).toLocaleString()
  const fmtPct = (n: number) => `${parseFloat((n ?? 0).toString()).toFixed(1)}%`

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', gap:12, height:52 }}>
        <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <span style={{ color:'#666', fontSize:13 }}>My KPIs</span>
      </div>

      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          {[
            { label:'Deals closed', value: monthly?.deals_closed ?? 0, sub:`of ${monthly?.deal_target ?? 20} target`, color:'#5DCAA5' },
            { label:'Revenue', value:`$${fmt(monthly?.revenue_generated ?? 0)}`, sub:'this month', color:'#7F77DD' },
            { label:'Close rate', value:fmtPct(monthly?.close_rate ?? 0), sub:'shows → closed', color:'#EF9F27' },
            { label:'Proposals sent', value: monthly?.proposals_sent ?? 0, sub:'this month', color:'#5DCAA5' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:10, padding:'18px 20px' }}>
              <div style={{ fontSize:10, color:'#555', letterSpacing:1, marginBottom:8, textTransform:'uppercase' }}>{label}</div>
              <div style={{ fontSize:26, fontWeight:700, color, lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:11, color:'#444', marginTop:6 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:10, padding:'18px 20px' }}>
          <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:14 }}>Daily closes — last 14 days</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:80 }}>
            {[...daily].reverse().map((d, i) => {
              const mx = Math.max(...daily.map((x: any) => x.deals_closed), 1)
              const h = Math.max(d.deals_closed / mx * 70, d.deals_closed > 0 ? 4 : 2)
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:'100%', borderRadius:'2px 2px 0 0', height:h, background: d.deals_closed > 0 ? '#1D9E75' : '#1a1a2e' }} />
                  <span style={{ fontSize:9, color:'#333' }}>{new Date(d.kpi_date).getDate()}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}