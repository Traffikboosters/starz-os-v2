// deno-lint-ignore-file no-explicit-any
// Minimal Storage-first -> PDF Edge Function hook
// 1) Reads ops.v_exec_weekly_snapshot
// 2) Saves JSON to Storage bucket exec-reports
// 3) Calls render-pdf Edge Function (expected to exist) with a basic payload

import { createClient } from "npm:@supabase/supabase-js@2.43.4";

interface SnapshotRow {
  report_date: string;
  reps_monitored: number;
  total_at_risk: number;
  non_engaged_3d: number;
  nearing_10d: number;
  pdr_revenue: number;
  pdr_net: number;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  global: { headers: { "X-Client-Info": "enqueue-exec-pdf@1.0.0" } },
});

async function ensureBucket(bucket: string) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === bucket)) {
    await supabase.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
    });
  }
}

async function readSnapshot(): Promise<SnapshotRow> {
  const { data, error } = await supabase
    .from("ops.v_exec_weekly_snapshot")
    .select("*")
    .limit(1)
    .single();
  if (error) throw error;
  return data as SnapshotRow;
}

function makeReportName(dateStr: string) {
  return `weekly_snapshot_${dateStr}.json`;
}

async function saveSnapshot(bucket: string, path: string, payload: any) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw error;
}

async function callRenderPDF(payload: any) {
  const url = `${SUPABASE_URL}/functions/v1/render-exec-pdf`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`render-exec-pdf failed: ${res.status} ${text}`);
  }
  return await res.json();
}

console.info("enqueue-exec-pdf started");

Deno.serve(async (_req) => {
  try {
    const snapshot = await readSnapshot();
    const bucket = "exec-reports";
    await ensureBucket(bucket);

    const path = makeReportName(snapshot.report_date);
    await saveSnapshot(bucket, path, snapshot);

    // Minimal payload to renderer
    const renderPayload = {
      title: `Weekly Executive Snapshot: ${snapshot.report_date}`,
      snapshot,
      storage: { bucket, path },
      brand: { name: "Executive Report", primary: "#111827" },
    };

    const result = await callRenderPDF(renderPayload);

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});