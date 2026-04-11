'use client'
import { useRouter } from 'next/navigation'

export default function TrainingPage() {
  const router = useRouter()
  const modules = [
    { title:'Opening Scripts', desc:'How to open a cold call and grab attention in the first 10 seconds.', category:'Scripts', complete:false },
    { title:'Objection Handling', desc:'The 10 most common objections and exactly how to overcome them.', category:'Scripts', complete:false },
    { title:'Revenue Ignition System', desc:'Full walkthrough of the offer, positioning, and how to pitch it.', category:'Product', complete:false },
    { title:'Dominance Growth System', desc:'Full walkthrough of the premium offer for $65K+ businesses.', category:'Product', complete:false },
    { title:'Appointment Setting', desc:'How to book demos and discovery calls with warm and cold leads.', category:'Skills', complete:false },
    { title:'Closing Techniques', desc:'Proven closes that work for our offer at Traffik Boosters.', category:'Skills', complete:false },
    { title:'Communication Rules', desc:'Brand standards, lead handling rules, and compliance guidelines.', category:'Compliance', complete:false },
    { title:'STARZ-OS Walkthrough', desc:'How to use your portal, pipeline, PowerDial, and proposals.', category:'Systems', complete:false },
  ]
  const categories = [...new Set(modules.map(m => m.category))]

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', gap:12, height:52 }}>
        <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <span style={{ color:'#666', fontSize:13 }}>Training Center</span>
        <span style={{ background:'#131320', color:'#555', fontSize:11, padding:'2px 8px', borderRadius:4 }}>{modules.length} modules</span>
      </div>
      <div style={{ padding:'24px 32px' }}>
        {categories.map(cat => (
          <div key={cat} style={{ marginBottom:24 }}>
            <div style={{ fontSize:10, color:'#555', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>{cat}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {modules.filter(m => m.category === cat).map(mod => (
                <div key={mod.title} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid #333', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {mod.complete && <div style={{ width:10, height:10, borderRadius:'50%', background:'#1D9E75' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>{mod.title}</div>
                    <div style={{ fontSize:11, color:'#555', lineHeight:1.5 }}>{mod.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}