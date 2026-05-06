import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type WorkOrder = Database['public']['Tables']['work_orders']['Row']
type WorkOrderInsert = Database['public']['Tables']['work_orders']['Insert']

export function useWorkOrders() {
  const [isLoading, setIsLoading] = useState(false)

  const list = useCallback(async (filters?: { status?: string; serviceType?: string; assignedTeam?: string; assignedDevId?: string }) => {
    setIsLoading(true)
    let query = supabase.from('work_orders').select('*').order('created_at', { ascending: false })
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.serviceType) query = query.eq('service_type', filters.serviceType)
    if (filters?.assignedTeam) query = query.eq('assigned_team', filters.assignedTeam)
    if (filters?.assignedDevId) query = query.eq('assigned_dev_id', filters.assignedDevId)
    const { data, error } = await query
    setIsLoading(false)
    if (error) { console.error(error); return [] }
    return data ?? []
  }, [])

  const getById = useCallback(async (id: string) => {
    const { data } = await supabase.from('work_orders').select('*').eq('id', id).single()
    return data
  }, [])

  const create = useCallback(async (wo: WorkOrderInsert) => {
    const { data, error } = await supabase.from('work_orders').insert(wo).select('id').single()
    return { id: data?.id ?? null, error: error?.message ?? null }
  }, [])

  const update = useCallback(async (id: string, updates: Partial<WorkOrderInsert>) => {
    const { error } = await supabase.from('work_orders').update(updates).eq('id', id)
    return !error
  }, [])

  const updateProgress = useCallback(async (id: string, progress: number) => {
    const updates: any = { progress }
    if (progress >= 100) { updates.status = 'completed'; updates.completed_at = new Date().toISOString() }
    else if (progress > 0) { updates.status = 'in_progress'; updates.started_at = new Date().toISOString() }
    const { error } = await supabase.from('work_orders').update(updates).eq('id', id)
    return !error
  }, [])

  const stats = useCallback(async () => {
    const { data } = await supabase.from('work_orders').select('*')
    const all = data ?? []
    return {
      total: all.length,
      pendingValidation: all.filter(w => w.status === 'pending_validation').length,
      hold3Day: all.filter(w => w.status === 'hold_3day').length,
      ready: all.filter(w => w.status === 'ready').length,
      inProgress: all.filter(w => w.status === 'in_progress').length,
      completed: all.filter(w => w.status === 'completed').length,
      escalated: all.filter(w => w.status === 'escalated').length,
      totalValue: all.reduce((a, w) => a + w.amount, 0),
    }
  }, [])

  return { list, getById, create, update, updateProgress, stats, isLoading }
}
