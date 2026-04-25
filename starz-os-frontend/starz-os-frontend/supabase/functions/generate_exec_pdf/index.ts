// Generate and broadcast weekly exec/ops HTML report
// Assumptions:
// - Table ops.exec_report_runs(id uuid default gen_random_uuid(), report_date date unique, artifact_path text, signed_url text, created_at timestamptz default now())
// - Bucket `reports` exists
// - Clients subscribe to private channels: report:weekly:exec, report:weekly:ops
// - Access is gated by RLS on realtime.messages using JWT role claim

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

interface Input {
  report_date?: string; // YYYY-MM-DD
}

// Example data loaders: Replace with your actual views/queries for production
async function loadMetrics(reportDate: string) {
  // Placeholder: Replace with selects from your metrics views
  // Example: totals, conversion rate, avg handle time, fatigue index, risk score
  const totals = { calls: 1234, connected: 678, won: 89 };
  const kpis = [
    { label: 'Conversion Rate', value: '13.1%' },
    { label: 'Avg Handle', value: '04:12' },
    { label: 'Fatigue', value: 'Low' },
    { label: 'Risk', value: 'Medium' },
  ];
  const topReps = [
    { name: 'A. Lee', efficiency: '1.34' },
    { name: 'B. Kim', efficiency: '1.29' },
    { name: 'C. Patel', efficiency: '1.21' },
    { name: 'D. Chen', efficiency: '1.18' },
    { name: 'E. Garcia', efficiency: '1.15' },
  ];
  return { totals, kpis, topReps };
}

function buildHtml(reportDate: string, data: Awaited<ReturnType<typeof loadMetrics>>) {
  const { totals, kpis, topReps } = data;
  const css = `
    :root { --brand:#0f766e; --ink:#0b1b2b; --muted:#5b6b7b; --bg:#ffffff; }
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; color: var(--ink); background: var(--bg); }
    header { padding: 20px 28px 16px; border-bottom: 4px solid var(--brand); display:flex; align-items:center; gap:16px; }
    .logo { width: 28px; height: 28px; background: var(--brand); border-radius:6px; }
    h1 { margin: 0; font-size: 20px; }
    .date { color: var(--muted); font-size: 14px; }
    main { padding: 20px 28px 28px; }
    .grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
    .kpi { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
    .value { font-size: 22px; font-weight: 700; }
    .section { margin-top: 18px; }
    .section h2 { font-size: 14px; color: var(--muted); margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #eef2f7; font-size: 13px; }
    th { color: var(--muted); font-weight: 600; }
  `;
  const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>${css}</style><title>Weekly Exec Report ${reportDate}</title></head><body>
    <header><div class="logo"></div><div><h1>Weekly Executive Report</h1><div class="date">${reportDate}</div></div></header>
    <main>
      <div class="grid">
        ${kpis.map(k => `<div class="card"><div class="kpi">${k.label}</div><div class="value">${k.value}</div></div>`).join('')}
      </div>
      <div class="section">
        <h2>Top 5 Reps by Efficiency</h2>
        <table><thead><tr><th>Rep</th><th>Efficiency</th></tr></thead><tbody>
          ${topReps.map(r => `<tr><td>${r.name}</td><td>${r.efficiency}</td></tr>`).join('')}
        </tbody></table>
      </div>
      <div class="section" style="margin-top:14px;color:var(--muted);font-size:12px;">Totals: ${totals.calls} calls, ${totals.connected} connected, ${totals.won} won</div>
    </main>
  </body></html>`;
  return html;
}

async function storeHtml(path: string, html: string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(html);
  const { error } = await supabase.storage.from('reports').upload(path, bytes, {
    cacheControl: '31536000',
    contentType: 'text/html; charset=utf-8',
    upsert: true,
  });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
}

async function signUrl(path: string) {
  const { data, error } = await supabase.storage.from('reports').createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
  if (error) throw new Error(`sign url failed: ${error.message}`);
  return data.signedUrl;
}

async function ensureRun(reportDate: string) {
  const { data, error } = await supabase
    .from('ops.exec_report_runs')
    .insert({ report_date: reportDate }, { count: 'exact' })
    .select('id, report_date, artifact_path, signed_url')
    .single();
  if (!error) return data;
  // On conflict, fetch existing row
  const { data: existing, error: getErr } = await supabase
    .from('ops.exec_report_runs')
    .select('id, report_date, artifact_path, signed_url')
    .eq('report_date', reportDate)
    .maybeSingle();
  if (getErr || !existing) throw new Error(error.message);
  return existing;
}

async function updateRun(id: string, artifactPath: string, signedUrl: string) {
  const { error } = await supabase
    .from('ops.exec_report_runs')
    .update({ artifact_path: artifactPath, signed_url: signedUrl })
    .eq('id', id);
  if (error) throw new Error(`update run failed: ${error.message}`);
}

async function broadcast(topic: string, event: string, payload: Record<string, unknown>) {
  // Using Realtime HTTP send before subscribing; server role authorized
  const { error } = await supabase.realtime.send({
    type: 'broadcast',
    topic,
    event,
    payload,
    private: true,
  } as any);
  if (error) throw new Error(`broadcast failed: ${error.message}`);
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const { report_date }: Input = await req.json().catch(() => ({}));
    const today = new Date().toISOString().slice(0, 10);
    const reportDate = report_date ?? today;

    const run = await ensureRun(reportDate);

    const data = await loadMetrics(reportDate);
    const html = buildHtml(reportDate, data);

    const path = `exec/${reportDate}.html`;
    await storeHtml(path, html);
    const signed = await signUrl(path);

    await updateRun(run.id, path, signed);

    const summary = {
      report_date: reportDate,
      url: signed,
      totals: data.totals,
    };

    // Broadcast to exec and ops channels
    await broadcast('report:weekly:exec', 'weekly_report_ready', summary);
    await broadcast('report:weekly:ops', 'weekly_report_ready', summary);

    return new Response(JSON.stringify({ status: 'ok', report_date: reportDate, artifact_path: path, signed_url: signed }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message ?? 'unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});