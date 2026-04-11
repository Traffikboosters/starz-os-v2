'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

interface WorkOrder {
  work_order_id:     string
  sale_date:         string
  client_name:       string
  business_name:     string
  package:           string
  service_type:      string
  status:            string
  fulfillment_status: string
  priority:          number
  total_amount:      number
  clearance_ends_at: string | null
  due_date:          string | null
  assigned_to:       string | null
  total_tasks:       number
  completed_tasks:   number
  pct_complete:      number
  sla_status:        string
  created_at:        string
}

interface Task {
  id:           string
  sequence:     number
  title:        string
  assigned_role: string
  status:       string
  due_date:     string | null
  deliverable:  string
}

export default function RicoQueuePage() {
  const [orders, setOrders]       = useState<WorkOrder[]>([])
  const [selected, setSelected]   = useState<WorkOrder | null>(null)
  const [tasks, setTasks]         = useState<Task[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'all' | 'probation' | 'active' | 'urgent'>('all')
  const [refreshed, setRefreshed] = useState(new Date())

  const load = useCallback(async () => {
    const { data } = await supabase
      .schema('fulfillment')
      .from('rico_queue')
      .select('*')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true })
    if (data) setOrders(data)
    setRefreshed(new Date())
    setLoading(false)
  }, [])

  const loadTasks = useCallback(async (wo: WorkOrder) => {
    setSelected(wo)
    const { data } = await supabase
      .schema('core')
      .from('tasks')
      .select('id, sequence, title, assigned_role, status, due_date, deliverable')
      .eq('deals_work_order_id',
        // look up the deals work order uuid from fulfillment
        wo.work_order_id
      )
      .order('sequence', { ascending: true })
    setTasks(data ?? [])
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const filtered = orders.filter(o => {
    if (filter === 'probation') return o.status === 'probation'
    if (filter === 'active')    return o.status === 'active' || o.status === 'in_progress'
    if (filter === 'urgent')    return o.priority === 1 || o.sla_status === 'overdue'
    return true
  })

  const probCount  = orders.filter(o => o.status === 'probation').length
  const activeCount = orders.filter(o => ['active','in_progress'].includes(o.status)).length
  const urgentCount = orders.filter(o => o.priority === 1 || o.sla_status === 'overdue').length

  const slaColor = (s: string) =>
    s === 'overdue' ? '#E24B4A' : s === 'due_soon' ? '#EF9F27' : '#1D9E75'

  const priorityLabel = (p: number) =>
    p === 1 ? 'Urgent' : p === 2 ? 'Normal' : 'Standard'

  const priorityColor = (p: number) =>
    p === 1 ? '#E24B4A' : p === 2 ? '#EF9F27' : '#5DCAA5'

  const statusColor = (s: string) => {
    if (s === 'probation')   return { bg: '#2d1f0a', color: '#EF9F27', border: '#EF9F2744' }
    if (s === 'active')      return { bg: '#0a1f14', color: '#1D9E75', border: '#1D9E7544' }
    if (s === 'in_progress') return { bg: '#0a1420', color: '#5DCAA5', border: '#5DCAA544' }
    return { bg: '#131320', color: '#888', border: '#1a1a2e' }
  }

  const taskStatusColor = (s: string) => {
    if (s === 'completed')   return '#1D9E75'
    if (s === 'in_progress') return '#5DCAA5'
    if (s === 'blocked')     return '#E24B4A'
    return '#555'
  }

  const probationHours = (ends: string | null) => {
    if (!ends) return null
    const h = Math.max(0, Math.round((new Date(ends).getTime() - Date.now()) / 3600000))
    return h > 0 ? `${h}h remaining` : 'Clearing soon'
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#5DCAA5', fontFamily:'monospace', fontSize:14 }}>Loading Rico Queue...</span>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d14', color:'#e8e6e0', fontFamily:'Helvetica,sans-serif', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ background:'#0a0a0f', borderBottom:'1px solid #1a1a2e', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ color:'#5DCAA5', fontWeight:700, fontSize:12, letterSpacing:2 }}>STARZ-OS</span>
          <span style={{ color:'#333' }}>·</span>
          <span style={{ color:'#666', fontSize:13 }}>Rico Fulfillment Queue</span>
          {urgentCount > 0 && <span style={{ background:'#2d1515', border:'1px solid #E24B4A', borderRadius:6, padding:'2px 10px', fontSize:11, color:'#E24B4A' }}>{urgentCount} urgent</span>}
        </div>
        <span style={{ fontSize:11, color:'#444', fontFamily:'monospace' }}>{refreshed.toLocaleTimeString()} · auto-refresh 30s</span>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Left — queue list */}
        <div style={{ width: selected ? 420 : '100%', borderRight: selected ? '1px solid #1a1a2e' : 'none', display:'flex', flexDirection:'column', overflow:'hidden', transition:'width .2s' }}>

          {/* Stats + filters */}
          <div style={{ padding:'16px 24px', borderBottom:'1px solid #1a1a2e', flexShrink:0 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
              {[
                { label:'Total', val:orders.length, color:'#e8e6e0' },
                { label:'Probation', val:probCount, color:'#EF9F27' },
                { label:'Active', val:activeCount, color:'#1D9E75' },
                { label:'Urgent', val:urgentCount, color:'#E24B4A' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'10px 14px', textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:700, color }}>{val}</div>
                  <div style={{ fontSize:10, color:'#555', marginTop:2, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:4 }}>
              {(['all','probation','active','urgent'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:'5px 14px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12,
                    background: filter === f ? '#1D9E75' : '#131320',
                    color: filter === f ? '#fff' : '#666',
                    fontWeight: filter === f ? 600 : 400 }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Work order list */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding:32, textAlign:'center', color:'#555', fontSize:13 }}>No work orders in this filter</div>
            )}
            {filtered.map(wo => {
              const sc = statusColor(wo.status)
              const isSelected = selected?.work_order_id === wo.work_order_id
              return (
                <div key={wo.work_order_id} onClick={() => loadTasks(wo)}
                  style={{ padding:'14px 24px', borderBottom:'1px solid #1a1a2e', cursor:'pointer',
                    background: isSelected ? '#131320' : 'transparent',
                    borderLeft: isSelected ? '3px solid #1D9E75' : '3px solid transparent',
                    transition:'all .1s' }}>

                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#e8e6e0', marginBottom:2 }}>
                        {wo.business_name || wo.client_name}
                      </div>
                      <div style={{ fontSize:11, color:'#555', fontFamily:'monospace' }}>{wo.work_order_id}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:priorityColor(wo.priority),
                        background: priorityColor(wo.priority) + '22', borderRadius:4, padding:'2px 8px' }}>
                        {priorityLabel(wo.priority)}
                      </span>
                      <span style={{ fontSize:10, color:sc.color, background:sc.bg,
                        border:`1px solid ${sc.border}`, borderRadius:4, padding:'2px 8px' }}>
                        {wo.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:11, color:'#888' }}>{wo.package || wo.service_type}</span>
                    <span style={{ color:'#333' }}>·</span>
                    <span style={{ fontSize:11, color:'#1D9E75', fontWeight:600 }}>
                      ${Math.round(wo.total_amount || 0).toLocaleString()}
                    </span>
                    {wo.assigned_to && (
                      <>
                        <span style={{ color:'#333' }}>·</span>
                        <span style={{ fontSize:11, color:'#888' }}>{wo.assigned_to}</span>
                      </>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, background:'#0a0a0f', borderRadius:3, height:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:3,
                        width:`${wo.pct_complete || 0}%`,
                        background: wo.pct_complete >= 100 ? '#1D9E75' : '#534AB7' }} />
                    </div>
                    <span style={{ fontSize:10, color:'#555', minWidth:28, textAlign:'right' }}>{wo.pct_complete || 0}%</span>
                    <span style={{ fontSize:10, color:slaColor(wo.sla_status), minWidth:50 }}>
                      {wo.sla_status === 'overdue' ? 'OVERDUE' : wo.sla_status === 'due_soon' ? 'Due soon' : ''}
                    </span>
                  </div>

                  {wo.status === 'probation' && wo.clearance_ends_at && (
                    <div style={{ marginTop:6, fontSize:11, color:'#EF9F27' }}>
                      Probation: {probationHours(wo.clearance_ends_at)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right — task detail panel */}
        {selected && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Panel header */}
            <div style={{ padding:'16px 24px', borderBottom:'1px solid #1a1a2e', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, marginBottom:2 }}>
                    {selected.business_name || selected.client_name}
                  </div>
                  <div style={{ fontSize:11, color:'#555', fontFamily:'monospace' }}>{selected.work_order_id}</div>
                </div>
                <button onClick={() => { setSelected(null); setTasks([]) }}
                  style={{ background:'transparent', border:'1px solid #1a1a2e', borderRadius:6, color:'#666', padding:'4px 12px', cursor:'pointer', fontSize:12 }}>
                  Close
                </button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:14 }}>
                {[
                  { label:'Package',  val: selected.package || selected.service_type },
                  { label:'Value',    val: `$${Math.round(selected.total_amount||0).toLocaleString()}` },
                  { label:'Due',      val: selected.due_date ? new Date(selected.due_date).toLocaleDateString() : '—' },
                  { label:'Progress', val: `${selected.completed_tasks||0} / ${selected.total_tasks||0} tasks` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:13, fontWeight:500, color:'#e8e6e0' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
              <div style={{ fontSize:10, color:'#555', textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Tasks</div>
              {tasks.length === 0 && (
                <div style={{ color:'#555', fontSize:13 }}>No tasks found for this work order.</div>
              )}
              {tasks.map(task => (
                <div key={task.id} style={{ background:'#131320', border:'1px solid #1a1a2e', borderRadius:8, padding:'14px 16px', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:12, color:'#444', fontWeight:700, minWidth:20 }}>#{task.sequence}</span>
                      <span style={{ fontSize:13, fontWeight:500, color:'#e8e6e0' }}>{task.title}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, color:taskStatusColor(task.status),
                        background: taskStatusColor(task.status) + '22',
                        borderRadius:4, padding:'2px 8px' }}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:16, fontSize:11, color:'#666' }}>
                    <span>Role: {task.assigned_role}</span>
                    {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                  </div>
                  {task.deliverable && (
                    <div style={{ marginTop:6, fontSize:11, color:'#555', fontStyle:'italic' }}>
                      Deliverable: {task.deliverable}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}