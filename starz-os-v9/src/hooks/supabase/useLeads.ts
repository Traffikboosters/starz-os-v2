import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'

type Lead = Database['public']['Tables']['leads']['Row']
type LeadInsert = Database['public']['Tables']['leads']['Insert']

interface LeadFilters {
  status?: 'hot' | 'warm' | 'cold' | 'dead'
  stage?: string
  assignedRepId?: string
  search?: string
  vendorSource?: string
}

export function useLeads() {
  const [isLoading, setIsLoading] = useState(false)

  const list = useCallback(async (filters?: LeadFilters, limit = 50): Promise<Lead[]> => {
    setIsLoading(true)
    let query = supabase.from('leads').select('*').order('lead_score', { ascending: false }).limit(limit)

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.stage) query = query.eq('stage', filters.stage)
    if (filters?.assignedRepId) query = query.eq('assigned_rep_id', filters.assignedRepId)
    if (filters?.vendorSource) query = query.eq('vendor_source', filters.vendorSource)

    const { data, error } = await query
    setIsLoading(false)

    if (error) { console.error('leads.list error:', error); return [] }

    let results = data ?? []
    if (filters?.search) {
      const s = filters.search.toLowerCase()
      results = results.filter(l =>
        l.business_name?.toLowerCase().includes(s) ||
        l.contact_name?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.city?.toLowerCase().includes(s)
      )
    }
    return results
  }, [])

  const getById = useCallback(async (id: string): Promise<Lead | null> => {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
    if (error) { console.error('leads.getById error:', error); return null }
    return data
  }, [])

  const create = useCallback(async (lead: LeadInsert): Promise<{ id: string | null; error: string | null }> => {
    const { data, error } = await supabase.from('leads').insert(lead).select('id').single()
    if (error) return { id: null, error: error.message }
    return { id: data?.id ?? null, error: null }
  }, [])

  const update = useCallback(async (id: string, updates: Partial<LeadInsert>): Promise<boolean> => {
    const { error } = await supabase.from('leads').update(updates).eq('id', id)
    if (error) { console.error('leads.update error:', error); return false }
    return true
  }, [])

  const updateStage = useCallback(async (id: string, stage: string): Promise<boolean> => {
    return update(id, { stage: stage as any, updated_at: new Date().toISOString() })
  }, [])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) { console.error('leads.delete error:', error); return false }
    return true
  }, [])

  const stats = useCallback(async () => {
    const { data } = await supabase.from('leads').select('*')
    const all = data ?? []
    const pipelineValue = all.reduce((a, l) => a + (l.estimated_value ?? 0), 0)
    return {
      total: all.length,
      hot: all.filter(l => l.status === 'hot').length,
      warm: all.filter(l => l.status === 'warm').length,
      cold: all.filter(l => l.status === 'cold').length,
      pipelineValue,
      byStage: {
        new: all.filter(l => l.stage === 'new').length,
        contacted: all.filter(l => l.stage === 'contacted').length,
        interested: all.filter(l => l.stage === 'interested').length,
        proposalSent: all.filter(l => l.stage === 'proposal_sent').length,
        closedWon: all.filter(l => l.stage === 'closed_won').length,
        closedLost: all.filter(l => l.stage === 'closed_lost').length,
      },
    }
  }, [])

  const subscribeToChanges = useCallback((callback: (payload: any) => void) => {
    const channel = supabase
      .channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, callback)
      .subscribe()
    return () => channel.unsubscribe()
  }, [])

  return { list, getById, create, update, updateStage, remove, stats, subscribeToChanges, isLoading }
}
