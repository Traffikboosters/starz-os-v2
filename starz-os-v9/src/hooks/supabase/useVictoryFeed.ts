import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import type { VictoryEvent } from '@/components/SalesVictoryPopup'
import { broadcastVictory } from '@/components/SalesVictoryPopup'

type VictoryRow = Database['public']['Tables']['sales_victory_feed']['Row']

export function useVictoryFeed() {
  const [events, setEvents] = useState<VictoryEvent[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const addEvent = useCallback((row: VictoryRow) => {
    const ev: VictoryEvent = {
      id: row.id,
      repName: row.rep_name,
      repRole: row.rep_role,
      repAvatar: row.rep_avatar ?? undefined,
      saleAmount: row.sale_amount,
      clientName: row.client_name,
      city: row.city,
      state: row.state,
      service: row.service,
      timestamp: new Date(row.created_at),
      tier: row.tier,
    }
    setEvents(prev => [ev, ...prev].slice(0, 3))
    broadcastVictory({
      repName: row.rep_name,
      repRole: row.rep_role,
      saleAmount: row.sale_amount,
      clientName: row.client_name,
      city: row.city,
      state: row.state,
      service: row.service,
      tier: row.tier,
    })
  }, [])

  useEffect(() => {
    // Subscribe to Supabase Realtime for victory events
    const channel = supabase
      .channel('sales_victory_feed', { config: { broadcast: { self: true } } })
      .on<VictoryRow>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales_victory_feed' },
        (payload) => {
          if (payload.new) addEvent(payload.new)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [addEvent])

  const logVictory = async (data: Omit<VictoryEvent, 'id' | 'timestamp'>) => {
    // Insert into Supabase
    const { error } = await supabase.from('sales_victory_feed').insert({
      rep_name: data.repName,
      rep_role: data.repRole,
      sale_amount: data.saleAmount,
      client_name: data.clientName,
      city: data.city,
      state: data.state,
      service: data.service,
      tier: data.tier,
      org_id: 'default', // Replace with actual org ID
    })
    if (error) console.error('Failed to log victory:', error)
  }

  const fetchRecent = async (limit = 20) => {
    const { data } = await supabase
      .from('sales_victory_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    return data ?? []
  }

  return { events, logVictory, fetchRecent }
}
