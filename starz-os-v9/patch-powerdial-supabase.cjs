const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';
let src = fs.readFileSync(FILE, 'utf8');

// Fix 1: Add supabase client import at top
const oldImport = `import { useToast } from '@/hooks/useToast'`;
const newImport = `import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase/client'`;

// Fix 2: Replace the entire raw fetch function + inline constants with supabase client call
const oldFetchBlock = `// ─── Supabase client (inline to avoid import path issues) ────────────────────
const SUPABASE_URL = 'https://szguizvpiiuiyugrjeks.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

async function fetchLeadsFromSupabase() {
  const res = await fetch(
    \`\${SUPABASE_URL}/rest/v1/leads?select=id,business_name,phone,industry,score,call_attempts,disposition,source,status,website,rating,review_count&phone=not.is.null&phone=neq.&status=not.in.(closed,converted,do_not_call)&order=score.desc&limit=70\`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: \`Bearer \${SUPABASE_ANON_KEY}\`,
        'Content-Type': 'application/json',
      },
    }
  )
  if (!res.ok) throw new Error(\`Leads fetch failed: \${res.status}\`)
  return res.json()
}

async function logCallToSupabase(lead: any, outcome: string, durationSecs: number) {
  try {
    await fetch(
      \`\${SUPABASE_URL}/rest/v1/public.calls_simple\`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: \`Bearer \${SUPABASE_ANON_KEY}\`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          lead_id: lead.id,
          phone_dialed: lead.phone,
          disposition: outcome,
          duration_seconds: durationSecs,
          called_at: new Date().toISOString(),
        }),
      }
    )
  } catch (e) {
    console.warn('Call log failed (non-blocking):', e)
  }
}`;

const newFetchBlock = `// ─── Supabase data helpers ────────────────────────────────────────────────────
async function fetchLeadsFromSupabase() {
  const { data, error } = await supabase
    .from('leads')
    .select('id,business_name,phone,industry,score,call_attempts,disposition,source,status,website,rating,review_count')
    .eq('status', 'qualified')
    .not('phone', 'is', null)
    .neq('phone', '')
    .order('score', { ascending: false })
    .limit(70)
  if (error) throw new Error(error.message)
  return data || []
}

async function logCallToSupabase(lead: any, outcome: string, durationSecs: number) {
  try {
    await supabase.from('calls').insert({
      lead_id: lead.id,
      phone_dialed: lead.phone,
      disposition: outcome,
      duration_seconds: durationSecs,
      called_at: new Date().toISOString(),
    })
  } catch (e) {
    console.warn('Call log failed (non-blocking):', e)
  }
}`;

const patches = [
  [oldImport, newImport, 'add supabase import'],
  [oldFetchBlock, newFetchBlock, 'replace raw fetch with supabase client'],
];

let allGood = true;
for (const [oldStr, newStr, label] of patches) {
  if (!src.includes(oldStr)) {
    console.error(`❌ PATCH FAILED — could not find: "${label}"`);
    allGood = false;
  } else {
    src = src.replace(oldStr, newStr);
    console.log(`✅ Patched: ${label}`);
  }
}

if (allGood) {
  fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
  console.log('\n🚀 Fix applied! Now run:');
  console.log('npm run build');
  console.log('npx vercel --prod');
} else {
  console.error('\n⚠  One or more patches failed. File NOT written.');
  // Show what the current fetch block looks like for debugging
  const idx = src.indexOf('fetchLeadsFromSupabase');
  if (idx > -1) console.log('\nCurrent fetchLeads context:\n' + src.substring(idx - 200, idx + 500));
}
