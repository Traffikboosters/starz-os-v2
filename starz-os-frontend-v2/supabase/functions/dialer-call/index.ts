/**
 * dialer-call
 * Initiates a call: validates membership and writes a new row in dialer.calls.
 * Body: { phone: string }
 */
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

type JwtClaims = { sub?: string };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function getAuthUser(req: Request) {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth?.toLowerCase().startsWith('bearer ')) return null;
  const token = auth.split(' ')[1];
  try {
    const json = JSON.parse(atob(token.split('.')[1])) as JwtClaims;
    return { token, user_id: json.sub as string | undefined };
  } catch {
    return { token, user_id: undefined } as any;
  }
}

async function getUserOrg(user_id: string) {
  const { data } = await admin.from('members').select('org_id').eq('user_id', user_id).limit(1).single();
  return data?.org_id ?? null;
}

console.info('dialer-call function ready');
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const auth = await getAuthUser(req);
  if (!auth?.token || !auth.user_id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await req.json().catch(() => ({}));
  const phone = (body?.phone ?? '').toString().trim();
  if (!phone) return new Response(JSON.stringify({ error: 'phone is required' }), { status: 400 });

  const org_id = await getUserOrg(auth.user_id);
  if (!org_id) return new Response(JSON.stringify({ error: 'No org membership' }), { status: 403 });

  // Insert call with pending status
  const { data, error } = await admin
    .from('calls')
    .insert({ org_id, phone, call_status: 'pending' })
    .select('id, org_id, phone, call_status, created_at')
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true, call: data }), { headers: { 'Content-Type': 'application/json' } });
});