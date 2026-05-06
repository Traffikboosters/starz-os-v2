import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Prospect = Database['public']['Tables']['prospects']['Row']
type ProspectInsert = Database['public']['Tables']['prospects']['Insert']

export function useProspects() {
  const [isLoading, setIsLoading] = useState(false)

  const list = useCallback(async (filters?: { status?: string; vendorSource?: string; search?: string; assignedRepId?: string }): Promise<Prospect[]> => {
    setIsLoading(true)
    let query = supabase.from('prospects').select('*').order('lead_score', { ascending: false })
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.vendorSource) query = query.eq('vendor_source', filters.vendorSource)
    if (filters?.assignedRepId) query = query.eq('assigned_rep_id', filters.assignedRepId)
    const { data, error } = await query
    setIsLoading(false)
    if (error) { console.error(error); return [] }
    let results = data ?? []
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      results = results.filter(p => p.business_name?.toLowerCase().includes(s) || p.city?.toLowerCase().includes(s) || p.industry?.toLowerCase().includes(s))
    }
    return results
  }, [])

  const create = useCallback(async (data: ProspectInsert) => {
    const { data: result, error } = await supabase.from('prospects').insert(data).select('id').single()
    return { id: result?.id ?? null, error: error?.message ?? null }
  }, [])

  const update = useCallback(async (id: string, updates: Partial<ProspectInsert>) => {
    const { error } = await supabase.from('prospects').update(updates).eq('id', id)
    return !error
  }, [])

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('prospects').delete().eq('id', id)
    return !error
  }, [])

  const stats = useCallback(async () => {
    const { data } = await supabase.from('prospects').select('*')
    const all = data ?? []
    return {
      total: all.length,
      hot: all.filter(p => p.status === 'hot').length,
      warm: all.filter(p => p.status === 'warm').length,
      cold: all.filter(p => p.status === 'cold').length,
      avgScore: all.length > 0 ? Math.round(all.reduce((a, p) => a + p.lead_score, 0) / all.length) : 0,
    }
  }, [])

  const subscribeToChanges = useCallback((callback: (payload: any) => void) => {
    const channel = supabase.channel('prospects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prospects' }, callback)
      .subscribe()
    return () => channel.unsubscribe()
  }, [])

  return { list, create, update, remove, stats, subscribeToChanges, isLoading }
}
