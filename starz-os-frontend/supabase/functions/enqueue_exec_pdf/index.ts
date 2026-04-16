// Idempotent weekly exec PDF enqueue
// Assumptions:
// - Table ops.exec_report_runs(report_date date unique)
// - Storage bucket `reports` exists and is public or shared internally
// - Slack delivery handled by a downstream worker or separate function
// - This function only enqueues once per report_date and returns the run id

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

interface EnqueueInput {
  report_date?: string; // ISO date, defaults to today (UTC)
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { report_date }: EnqueueInput = await req.json().catch(() => ({}));
    // Use UTC today by default
    const todayUtc = new Date().toISOString().slice(0, 10);
    const targetDate = (report_date ?? todayUtc);

    // Attempt idempotent insert
    const { data: upserted, error: insertErr } = await supabase
      .from('ops.exec_report_runs')
      .insert({ report_date: targetDate }, { count: 'exact' })
      .select('id, report_date, created_at')
      .single();

    if (insertErr) {
      // If conflict on unique(report_date), fetch existing row and return it (idempotent behavior)
      // PostgREST returns 409 on conflict. Supabase-js v2 surfaces as error with details.
      const { data: existing, error: getErr } = await supabase
        .from('ops.exec_report_runs')
        .select('id, report_date, created_at')
        .eq('report_date', targetDate)
        .maybeSingle();

      if (getErr || !existing) {
        return new Response(JSON.stringify({ error: insertErr.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ id: existing.id, report_date: existing.report_date, created_at: existing.created_at, status: 'already_enqueued' }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Success path – return newly created run id
    return new Response(JSON.stringify({ id: upserted.id, report_date: upserted.report_date, created_at: upserted.created_at, status: 'enqueued' }), { headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message ?? 'unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});