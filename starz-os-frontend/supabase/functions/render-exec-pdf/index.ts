// deno-lint-ignore-file no-explicit-any
// Minimal PDF renderer Edge Function
// Accepts payload { title, snapshot, storage:{bucket,path}, brand }
// Generates a simple PDF (as a single page) and uploads to Storage next to the JSON
// Dependencies minimized: use a tiny PDF generator inline (no external heavy libs)

import { createClient } from "npm:@supabase/supabase-js@2.43.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  global: { headers: { "X-Client-Info": "render-exec-pdf@1.0.0" } },
});

// Tiny PDF generator (single-page, text only). This creates a basic PDF file.
// Note: For production-quality PDFs, replace with a robust renderer.
function generateSimplePDF(title: string, lines: string[]): Uint8Array {
  // Extremely basic PDF (one page, Courier font), ASCII only.
  // Build a single content stream with text lines.
  const contentLines = [
    "BT",
    "/F1 12 Tf",
    "72 750 Td", // starting position
    "0 -18 Td",
    `(${escapePDFText(title)}) Tj`,
    ...lines.flatMap((l) => ["0 -16 Td", `(${escapePDFText(l)}) Tj`]),
    "ET",
  ];
  const contentStream = contentLines.join("\n");
  const contentBytes = new TextEncoder().encode(contentStream);

  const obj = (id: number, body: string | Uint8Array) => ({ id, body });
  const objects: Array<{ id: number; body: string | Uint8Array }> = [];

  // 1: Catalog
  objects.push(obj(1, "<< /Type /Catalog /Pages 2 0 R >>"));
  // 2: Pages
  objects.push(obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
  // 3: Page
  objects.push(
    obj(
      3,
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    ),
  );
  // 4: Content stream
  const contentStreamObj = `<< /Length ${contentBytes.length} >>\nstream\n${new TextDecoder().decode(contentBytes)}\nendstream`;
  objects.push(obj(4, contentStreamObj));
  // 5: Font
  objects.push(obj(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"));

  // Assemble PDF
  const chunks: string[] = [];
  chunks.push("%PDF-1.4\n");
  const xref: number[] = [];
  let offset = 0;
  const push = (s: string) => {
    xref.push(offset);
    chunks.push(`${s}\n`);
    offset += (new TextEncoder().encode(`${s}\n`)).length;
  };
  for (const o of objects) {
    push(`${o.id} 0 obj`);
    push(typeof o.body === "string" ? o.body : new TextDecoder().decode(o.body));
    push("endobj");
  }
  const xrefStart = offset;
  const xrefHeader = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  chunks.push(xrefHeader);
  offset += new TextEncoder().encode(xrefHeader).length;
  for (const off of xref) {
    const line = `${off.toString().padStart(10, "0")} 00000 n \n`;
    chunks.push(line);
    offset += new TextEncoder().encode(line).length;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  chunks.push(trailer);

  const pdfString = chunks.join("");
  return new TextEncoder().encode(pdfString);
}

function escapePDFText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatLines(snapshot: any): string[] {
  const lines: string[] = [];
  lines.push(`Report Date: ${snapshot.report_date}`);
  lines.push("");
  lines.push(`Reps Monitored: ${snapshot.reps_monitored}`);
  lines.push(`Total At Risk: ${snapshot.total_at_risk}`);
  lines.push(`Non-engaged 3d: ${snapshot.non_engaged_3d}`);
  lines.push(`Nearing 10d: ${snapshot.nearing_10d}`);
  lines.push(`PDR Revenue: ${snapshot.pdr_revenue}`);
  lines.push(`PDR Net: ${snapshot.pdr_net}`);
  return lines;
}

async function uploadPDF(bucket: string, path: string, bytes: Uint8Array) {
  const pdfPath = path.replace(/\.json$/i, ".pdf");
  const { error } = await supabase.storage.from(bucket).upload(pdfPath, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;
  return pdfPath;
}

console.info("render-exec-pdf started");

Deno.serve(async (req) => {
  try {
    const input = await req.json();
    const title = input?.title ?? "Executive Snapshot";
    const snapshot = input?.snapshot ?? {};
    const bucket = input?.storage?.bucket ?? "exec-reports";
    const jsonPath = input?.storage?.path ?? `weekly_snapshot_${snapshot?.report_date ?? "unknown"}.json`;

    const lines = formatLines(snapshot);
    const pdfBytes = generateSimplePDF(title, lines);
    const pdfPath = await uploadPDF(bucket, jsonPath, pdfBytes);

    return new Response(JSON.stringify({ ok: true, bucket, pdfPath }), {
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