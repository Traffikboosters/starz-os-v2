'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const supabase = createClient()

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .schema('core').from('tasks')
        .select('id, sequence, title, assigned_role, status, due_date, deliverable')
        .in('status', ['pending','in_progress','blocked'])
        .order('due_date', { ascending: true })
        .limit(50)
      setTasks(data ?? [])
    }
    load()
  }, [])

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter)
  const statusColor = (s: string) => s === 'in_progress' ? '#1D9E75' : s === 'blocked' ? '#E24B4A' : '#555'

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif' }}>
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', gap:12, height:52 }}>
        <button onClick={() => router.back()} style={{ background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:20, padding:0 }}>←</button>
        <span style={{ color:'#666', fontSize:13 }}>Tasks</span>
        <span style={{ background:'#131320', color:'#555', fontSize:11, padding:'2px 8px', borderRadius:4 }}>{tasks.length}</span>
      </div>

      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'flex', gap:4, marginBottom:20 }}>
          {['all','pending','in_progress','blocked'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12,
                background: filter===f ? '#1D9E75' : '#131320', color: filter===f ? '#fff' : '#666' }}>
              {f.replace('_',' ').charAt(0).toUpperCase()+f.replace('_',' ').slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(task => (
            <div key={task.id} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'14px 18px',
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:12, color:'#444', fontWeight:700, minWidth:24 }}>#{task.sequence}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{task.title}</div>
                  {task.deliverable && <div style={{ fontSize:11, color:'#555', marginTop:2 }}>{task.deliverable}</div>}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {task.due_date && <span style={{ fontSize:11, color:'#555' }}>{new Date(task.due_date).toLocaleDateString()}</span>}
                <span style={{ fontSize:11, color:statusColor(task.status), background:statusColor(task.status)+'22',
                  borderRadius:4, padding:'2px 8px' }}>{task.status}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding:32, textAlign:'center', color:'#555', fontSize:13 }}>No tasks found</div>
          )}
        </div>
      </div>
    </div>
  )
}