// /functions/contractor_portal/lock_check/index.ts
// Enforces portal visibility rules via a single endpoint.
// Input: { contractor_id, lead_id }
// Output: { allowed: boolean, reasons: string[] }
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

interface Payload { contractor_id: string; lead_id: string }

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  let body: Payload;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }

  const reasons: string[] = [];
  let allowed = true;

  // Delegate core checks to DB RPCs when possible for consistency
  const [{ data: capCount }, { data: timeWindow }, { data: ageOk }] = await Promise.all([
    supabase.rpc('contractor_lead_count_today', { c_id: body.contractor_id }),
    supabase.rpc('check_lead_access_window', { lead_id: body.lead_id }),
    supabase.rpc('is_lead_accessible', { lead_id: body.lead_id })
  ]);

  if ((capCount ?? 0) >= 60) { allowed = false; reasons.push('daily_cap_reached'); }
  if (!timeWindow) { allowed = false; reasons.push('outside_local_time_window'); }
  if (!ageOk) { allowed = false; reasons.push('lead_age_exceeded'); }

  // TODO: add checks for contractor tier and timezone match based on your schema

  return new Response(JSON.stringify({ allowed, reasons }), { headers: { 'Content-Type': 'application/json' } });
});