'use client'
import { useRouter } from 'next/navigation'

export default function DocsPage() {
  const router = useRouter()
  const docs = [
    { title:'Independent Contractor Agreement', desc:'Your signed contractor agreement with Traffik Boosters.', icon:'📋' },
    { title:'W-9 / Tax Form', desc:'Your tax documentation for 1099 reporting.', icon:'📄' },
    { title:'Contractor Policy Handbook', desc:'Brand standards, communication rules, and conduct guidelines.', icon:'📖' },
    { title:'Lead Handling Rules', desc:'How to handle, contact, and manage assigned leads.', icon:'👥' },
    { title:'Commission Structure', desc:'How your payouts are calculated and approved.', icon:'💰' },
  ]
  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', gap:12, height:52 }}>
        <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <span style={{ color:'#666', fontSize:13 }}>My Documents</span>
        <span style={{ background:'#26215C', color:'#AFA9EC', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4 }}>1099</span>
      </div>
      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {docs.map(doc => (
            <div key={doc.title} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'16px 20px', display:'flex', alignItems:'center', gap:16, cursor:'pointer' }}>
              <span style={{ fontSize:24 }}>{doc.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>{doc.title}</div>
                <div style={{ fontSize:11, color:'#555' }}>{doc.desc}</div>
              </div>
              <span style={{ fontSize:11, color:'#333' }}>View →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}