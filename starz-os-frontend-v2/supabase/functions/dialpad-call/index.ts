const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const DIALPAD_API_KEY = Deno.env.get('DIALPAD_API_KEY') || '';
const DIALPAD_BASE = 'https://dialpad.com/api/v2';
const COMPANY_ID = '6461005901602816';
const DEFAULT_USER_ID = '4566842998267904';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
function resp(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } }); }
async function dbInsert(table, schema, data) { await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Accept-Profile': schema, 'Content-Profile': schema, Prefer: 'return=minimal' }, body: JSON.stringify(data) }).catch(e => console.error('DB error:', e)); }
async function dbPatch(table, schema, filter, data) { await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, { method: 'PATCH', headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, apikey: SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Accept-Profile': schema, 'Content-Profile': schema, Prefer: 'return=minimal' }, body: JSON.stringify(data) }).catch(e => console.error('DB error:', e)); }
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json();
    const { action, phone, phone_number, lead_id, queue_id, call_id } = body;
    if (!DIALPAD_API_KEY) return resp({ error: 'DIALPAD_API_KEY not configured' }, 500);
    const dH = { 'Authorization': `Bearer ${DIALPAD_API_KEY}`, 'Content-Type': 'application/json' };
    if (action === 'call' || !action) {
      const raw = phone || phone_number;
      if (!raw) return resp({ error: 'phone required' }, 400);
      const digits = raw.replace(/\D/g, '');
      const e164 = digits.length === 10 ? '+1' + digits : '+' + digits;
      const dialRes = await fetch(`${DIALPAD_BASE}/calls`, { method: 'POST', headers: dH, body: JSON.stringify({ phone_number: e164, user_id: DEFAULT_USER_ID, company_id: COMPANY_ID }) });
      const txt = await dialRes.text();
      const dialData = txt ? JSON.parse(txt) : {};
      if (!dialRes.ok) { console.error('Dialpad error:', txt); return resp({ error: dialData?.error?.message || 'Failed to initiate call', details: dialData }, 502); }
      await dbInsert('calls', 'dialer', { dialpad_call_id: String(dialData.id || ''), phone: e164, phone_number: e164, lead_id: lead_id || null, direction: 'outbound', status: 'ringing', call_status: 'ringing', org_id: '00000000-0000-0000-0000-000000000301', started_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      if (queue_id) await dbPatch('call_queue', 'dialer', `id=eq.${queue_id}`, { status: 'calling', last_call_at: new Date().toISOString() });
      return resp({ ok: true, call_id: dialData.id, status: 'ringing', phone: e164 });
    }
    if (action === 'hangup') {
      if (!call_id) return resp({ error: 'call_id required' }, 400);
      await fetch(`${DIALPAD_BASE}/calls/${call_id}/hangup`, { method: 'POST', headers: dH });
      await dbPatch('calls', 'dialer', `dialpad_call_id=eq.${call_id}`, { status: 'completed', call_status: 'completed', ended_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      return resp({ ok: true, action: 'hangup' });
    }
    if (action === 'live_calls') {
      const r = await fetch(`${DIALPAD_BASE}/calls?company_id=${COMPANY_ID}&state=active&limit=20`, { headers: dH });
      const d = await r.json();
      return resp({ ok: true, calls: d.items || [] });
    }
    if (action === 'disposition') {
      const { disposition, queue_id: qid } = body;
      if (qid) await dbPatch('call_queue', 'dialer', `id=eq.${qid}`, { status: disposition === 'interested' ? 'qualified' : disposition === 'callback' ? 'callback' : 'done', last_call_at: new Date().toISOString() });
      return resp({ ok: true, disposition });
    }
    return resp({ error: 'Unknown action' }, 400);
  } catch (err) { console.error('dialpad-call error:', err); return resp({ error: String(err) }, 500); }
});