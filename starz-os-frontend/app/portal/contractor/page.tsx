'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

export default function ContractorPortal() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#534AB7', fontFamily:'monospace', fontSize:14 }}>Loading Contractor Portal...</span>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:56 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ color:'#534AB7', fontWeight:700, fontSize:12, letterSpacing:2 }}>STARZ-OS</span>
          <span style={{ color:'#333' }}>·</span>
          <span style={{ color:'#666', fontSize:13 }}>Sales Contractor Portal</span>
          <span style={{ background:'#26215C', color:'#AFA9EC', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4, letterSpacing:1 }}>1099</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:12, color:'#555' }}>{user?.email}</span>
          <button onClick={() => { supabase.auth.signOut(); router.push('/login') }}
            style={{ background:'transparent', border:'1px solid #1a1a2e', borderRadius:6, color:'#666', padding:'4px 12px', cursor:'pointer', fontSize:12 }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ padding:'32px', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:24, fontWeight:700, margin:'0 0 6px', color:'#e8e6e0' }}>Welcome back</h1>
          <p style={{ fontSize:14, color:'#555', margin:0 }}>Your contractor workspace. Assigned leads, production stats, and payouts.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'My Leads',      icon:'👥', desc:'Assigned leads only',               href:'/portal/contractor/leads',      color:'#534AB7' },
            { label:'PowerDial',     icon:'📞', desc:'Call queue and dialer',              href:'/portal/contractor/dialer',     color:'#1D9E75' },
            { label:'Pipeline',      icon:'📊', desc:'Your active deal stages',            href:'/portal/contractor/pipeline',   color:'#EF9F27' },
            { label:'Tasks',         icon:'✅', desc:'Daily follow-up actions',            href:'/portal/contractor/tasks',      color:'#5DCAA5' },
            { label:'Proposals',     icon:'📄', desc:'Generate and send proposals',        href:'/portal/contractor/proposals',  color:'#534AB7' },
            { label:'My KPIs',       icon:'📈', desc:'Production and performance stats',   href:'/portal/contractor/kpis',       color:'#1D9E75' },
            { label:'Payouts',       icon:'💰', desc:'Earnings and 1099 payout history',   href:'/portal/contractor/payouts',    color:'#EF9F27' },
            { label:'Training',      icon:'🎓', desc:'Scripts and required modules',       href:'/portal/contractor/training',   color:'#5DCAA5' },
            { label:'My Docs',       icon:'📋', desc:'Contractor agreement and tax docs',  href:'/portal/contractor/docs',       color:'#534AB7' },
          ].map(({ label, icon, desc, href, color }) => (
            <div key={label} onClick={() => router.push(href)}
              style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:10, padding:'20px 22px', cursor:'pointer',
                transition:'border-color .15s', borderLeft:`3px solid ${color}` }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1a2e')}>
              <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#e8e6e0', marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:12, color:'#555' }}>{desc}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:10, padding:'20px 24px' }}>
          <div style={{ fontSize:11, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>Production — today</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
            {['Calls made','Connects','Appts set','Proposals','Closed'].map(label => (
              <div key={label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:700, color:'#534AB7' }}>0</div>
                <div style={{ fontSize:11, color:'#555', marginTop:4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}