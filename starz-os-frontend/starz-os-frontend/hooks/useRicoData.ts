'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface WorkOrder {
  id: string;
  business_name: string | null;
  client_name: string | null;
  package: string | null;
  status: string;
  fulfillment_status: string | null;
  clearance_ends_at: string | null;
  created_at: string;
  email: string | null;
}

export interface Deal {
  id: string;
  company: string | null;
  stage: string | null;
  lead_name: string | null;
  source: string | null;
  created_at: string;
  conversation_stage: string | null;
  interest_level: string | null;
}

export function useRicoData() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [woResult, dealResult] = await Promise.all([
          supabase
            .schema('deals')
            .from('work_orders')
            .select('id, business_name, client_name, package, status, fulfillment_status, clearance_ends_at, created_at, email')
            .order('created_at', { ascending: false })
            .limit(20),
          supabase
            .schema('deals')
            .from('pipeline')
            .select('id, company, stage, lead_name, source, created_at, conversation_stage, interest_level')
            .order('created_at', { ascending: false })
            .limit(20),
        ]);

        if (woResult.error) throw new Error(woResult.error.message);
        if (dealResult.error) throw new Error(dealResult.error.message);

        setWorkOrders(woResult.data || []);
        setDeals(dealResult.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    const woSub = supabase
      .channel('work_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'deals', table: 'work_orders' }, fetchData)
      .subscribe();

    const dealSub = supabase
      .channel('pipeline_changes')
      .on('postgres_changes', { event: '*', schema: 'deals', table: 'pipeline' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(woSub);
      supabase.removeChannel(dealSub);
    };
  }, []);

  return { workOrders, deals, loading, error };
}