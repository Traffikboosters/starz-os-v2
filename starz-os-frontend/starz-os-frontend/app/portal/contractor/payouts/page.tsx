'use client'
import { useRouter } from 'next/navigation'

export default function PayoutsPage() {
  const router = useRouter()
  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', gap:12, height:52 }}>
        <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <span style={{ color:'#666', fontSize:13 }}>Payouts</span>
        <span style={{ background:'#26215C', color:'#AFA9EC', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4 }}>1099</span>
      </div>
      <div style={{ padding:'32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Contractor earnings', value:'$0.00', sub:'this period', color:'#534AB7' },
            { label:'Approved payouts', value:'$0.00', sub:'ready to pay', color:'#1D9E75' },
            { label:'Total paid', value:'$0.00', sub:'all time', color:'#5DCAA5' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:10, padding:'20px 22px' }}>
              <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>{label}</div>
              <div style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
              <div style={{ fontSize:11, color:'#444', marginTop:6 }}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:10, padding:'24px', textAlign:'center', color:'#555', fontSize:13 }}>
          Payout history and 1099 records will appear here once deals are closed and approved.
        </div>
      </div>
    </div>
  )
}