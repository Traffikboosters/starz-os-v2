'use client'
import { useRouter } from 'next/navigation'

export default function EmailPage() {
  const router = useRouter()
  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', gap:12, height:52 }}>
        <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <span style={{ color:'#666', fontSize:13 }}>Email</span>
      </div>
      <div style={{ padding:'32px', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>✉️</div>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>Email workspace coming soon</div>
        <div style={{ fontSize:13, color:'#555' }}>Your @traffikboosters.com inbox, lead threads, and templates will appear here.</div>
      </div>
    </div>
  )
}