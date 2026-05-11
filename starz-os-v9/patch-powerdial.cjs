const fs = require('fs');
const path = require('path');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';

const oldImports = `import { useState, useEffect, useRef } from 'react'`;

const newImports = `import { useState, useEffect, useRef, useCallback } from 'react'`;

// Replace hardcoded leadQueue + steveScripts with Supabase-wired version
const oldMockData = `const leadQueue = [
  { id: 'L-8921', name: 'Mike Rodriguez', company: 'Miami Auto Group', source: 'Web Form', score: 92, status: 'hot', time: '2m ago' },
  { id: 'L-8922', name: 'Jennifer Walsh', company: 'NYC Dental', source: 'Referral', score: 88, status: 'hot', time: '5m ago' },
  { id: 'L-8923', name: 'Carlos Mendez', company: 'Phoenix Roofing', source: 'Cold Outreach', score: 74, status: 'warm', time: '12m ago' },
  { id: 'L-8924', name: 'Lisa Chen', company: 'SF Tech Startup', source: 'Web Form', score: 95, status: 'hot', time: '18m ago' },
  { id: 'L-8925', name: 'David Park', company: 'Chicago Law Firm', source: 'Ad Campaign', score: 67, status: 'warm', time: '34m ago' },
]

const steveScripts = [
  { type: 'insight', text: 'Lead has visited pricing page 4x in last 24h - high intent signal', icon: Target },
  { type: 'objection', text: 'Common objection: "Need to talk to my partner" - Use partner-close script', icon: AlertCircle },
  { type: 'tip', text: 'This company closed $12K deal last month with Elena - reference available', icon: Star },
  { type: 'alert', text: 'Lead score dropped 8pts after visiting cancellation page', icon: AlertCircle },
]`;

const newSupabaseData = `// ─── Supabase client (inline to avoid import path issues) ────────────────────
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
}

// ─── Steve Whisper scripts (dynamic by industry) ──────────────────────────────
function getSteveScripts(lead: any) {
  const industry = (lead?.industry || '').toLowerCase()
  const score = lead?.score || 0
  const attempts = lead?.call_attempts || 0
  const scripts = []

  if (score >= 80) scripts.push({ type: 'insight', text: \`High-intent lead — score \${score}. Open strong with ROI focus.\`, icon: Target })
  else scripts.push({ type: 'insight', text: \`Score \${score} — qualify budget and timeline early.\`, icon: Target })

  if (attempts > 0) scripts.push({ type: 'alert', text: \`\${attempts} prior contact attempt(s). Reference previous outreach to build familiarity.\`, icon: AlertCircle })

  if (industry.includes('roof') || industry.includes('hvac') || industry.includes('plumb'))
    scripts.push({ type: 'tip', text: 'Home services — lead cares about local reviews and speed. Mention 3-day launch timeline.', icon: Star })
  else if (industry.includes('dental') || industry.includes('medical'))
    scripts.push({ type: 'tip', text: 'Healthcare lead — HIPAA-aware pitch. Focus on patient acquisition, not just traffic.', icon: Star })
  else
    scripts.push({ type: 'tip', text: 'Offer a free website/SEO audit as a quick win to open the conversation.', icon: Star })

  scripts.push({ type: 'objection', text: 'If they say "send me info" — respond: "I can, but our best results come from a quick 10-min strategy call. When are you free?"', icon: AlertCircle })

  return scripts
}`;

// Replace the component's state block to load leads from Supabase
const oldComponentOpen = `export default function PowerDial() {
  const [callState, setCallState] = useState<CallState>('idle')
  const [muted, setMuted] = useState(false)
  const [onHold, setOnHold] = useState(false)
  const [callTime, setCallTime] = useState(0)
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0)
  const [callHistory, setCallHistory] = useState<any[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { success, info } = useToast()
  const deviceRef = useRef<any>(null)
  const callRef = useRef<any>(null)
  const [deviceReady, setDeviceReady] = useState(false)
  const [dialNumber, setDialNumber] = useState('')

  const currentLead = leadQueue[currentLeadIndex]`;

const newComponentOpen = `export default function PowerDial() {
  const [callState, setCallState] = useState<CallState>('idle')
  const [muted, setMuted] = useState(false)
  const [onHold, setOnHold] = useState(false)
  const [callTime, setCallTime] = useState(0)
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0)
  const [callHistory, setCallHistory] = useState<any[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { success, info } = useToast()
  const deviceRef = useRef<any>(null)
  const callRef = useRef<any>(null)
  const [deviceReady, setDeviceReady] = useState(false)
  const [dialNumber, setDialNumber] = useState('')

  // ─── Live Supabase leads ────────────────────────────────────────────────────
  const [leadQueue, setLeadQueue] = useState<any[]>([])
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [leadsError, setLeadsError] = useState<string | null>(null)

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true)
    setLeadsError(null)
    try {
      const data = await fetchLeadsFromSupabase()
      // Normalize fields for UI compatibility
      const normalized = (data || []).map((l: any) => ({
        ...l,
        name: l.business_name || l.name || 'Unknown',
        company: l.business_name || 'Unknown',
        source: l.source || l.industry || 'Organic',
        status: l.score >= 70 ? 'hot' : 'warm',
        time: l.created_at ? new Date(l.created_at).toLocaleDateString() : '',
        phone: l.phone,
        score: l.score || 0,
      }))
      setLeadQueue(normalized)
      if (normalized.length > 0) setCurrentLeadIndex(0)
    } catch (e: any) {
      setLeadsError(e.message)
      console.error('Failed to load leads:', e)
    } finally {
      setLeadsLoading(false)
    }
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  const currentLead = leadQueue[currentLeadIndex]
  const steveScripts = currentLead ? getSteveScripts(currentLead) : []`;

// Patch endCall to log to Supabase
const oldEndCall = `  const endCall = (outcome: 'completed' | 'skipped' = 'completed') => {
    if (callRef.current) { try { callRef.current.disconnect() } catch {} callRef.current = null }
    if (timerRef.current) clearInterval(timerRef.current)
    setCallHistory((prev) => [{
      lead: currentLead.name,
      outcome: outcome === 'completed' ? (callTime > 60 ? 'Interested' : 'Short Call') : 'Skipped',
      amount: 0,
      duration: formatTime(callTime),
      time: 'Just now',
      type: 'outbound'
    }, ...prev])
    setCallState('ended')
    setOnHold(false)
    setMuted(false)
    if (outcome === 'completed') success(\`Call ended. Duration: \${formatTime(callTime)}\`)
  }`;

const newEndCall = `  const endCall = (outcome: 'completed' | 'skipped' = 'completed') => {
    if (callRef.current) { try { callRef.current.disconnect() } catch {} callRef.current = null }
    if (timerRef.current) clearInterval(timerRef.current)
    const callOutcome = outcome === 'completed' ? (callTime > 60 ? 'Interested' : 'Short Call') : 'Skipped'
    setCallHistory((prev) => [{
      lead: currentLead?.name || 'Unknown',
      outcome: callOutcome,
      amount: 0,
      duration: formatTime(callTime),
      time: 'Just now',
      type: 'outbound'
    }, ...prev])
    // Log call to Supabase (non-blocking)
    if (currentLead) logCallToSupabase(currentLead, callOutcome, callTime)
    setCallState('ended')
    setOnHold(false)
    setMuted(false)
    if (outcome === 'completed') success(\`Call ended. Duration: \${formatTime(callTime)}\`)
  }`;

// Patch the idle state UI to show loading/error and pre-fill phone from lead
const oldIdlePhone = `                  <div className="flex gap-2 justify-center mb-3 max-w-xs mx-auto">
                    <input value={dialNumber} onChange={e => setDialNumber(e.target.value)} onKeyDown={e => e.key === "Enter" && startCall()} placeholder="Enter phone number to dial..." className="flex-1 bg-card border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan/50" />
                  </div>`;

const newIdlePhone = `                  {leadsLoading && (
                    <div className="flex items-center justify-center gap-2 mb-3 text-xs text-cyan">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading live leads...
                    </div>
                  )}
                  {leadsError && (
                    <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
                      ⚠ Could not load leads: {leadsError}
                      <button onClick={loadLeads} className="ml-2 underline">Retry</button>
                    </div>
                  )}
                  <div className="flex gap-2 justify-center mb-3 max-w-xs mx-auto">
                    <input value={dialNumber} onChange={e => setDialNumber(e.target.value)} onKeyDown={e => e.key === "Enter" && startCall()} placeholder={currentLead?.phone || "Enter phone number to dial..."} className="flex-1 bg-card border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan/50" />
                    {currentLead?.phone && !dialNumber && (
                      <button onClick={() => setDialNumber(currentLead.phone)} className="px-3 py-2 rounded-xl bg-cyan/10 border border-cyan/20 text-xs text-cyan hover:bg-cyan/20 transition-colors whitespace-nowrap">
                        Use Lead #
                      </button>
                    )}
                  </div>`;

// Replace queue badge count to use live data
const oldQueueBadge = `          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 rounded-lg">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1" /> {leadQueue.length} in queue
          </Badge>`;

const newQueueBadge = `          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 rounded-lg">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1" />
            {leadsLoading ? '...' : leadQueue.length} in queue
          </Badge>`;

// Also patch idle state remaining leads count
const oldRemainingCount = `                  <p className="text-sm text-muted-foreground mb-3">{leadQueue.length - currentLeadIndex} leads remaining</p>`;
const newRemainingCount = `                  <p className="text-sm text-muted-foreground mb-3">
                    {leadsLoading ? 'Loading leads...' : \`\${leadQueue.length - currentLeadIndex} leads remaining\`}
                  </p>`;

// Read file
let src = fs.readFileSync(FILE, 'utf8');

// Apply patches
const patches = [
  [oldImports, newImports, 'imports'],
  [oldMockData, newSupabaseData, 'mock data → Supabase'],
  [oldComponentOpen, newComponentOpen, 'component state'],
  [oldEndCall, newEndCall, 'endCall + Supabase log'],
  [oldIdlePhone, newIdlePhone, 'idle phone input'],
  [oldQueueBadge, newQueueBadge, 'queue badge count'],
  [oldRemainingCount, newRemainingCount, 'remaining count'],
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
  // Write with UTF-8 no-BOM
  const { Buffer } = require('buffer');
  fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
  console.log('\n🚀 PowerDial.tsx patched successfully!');
  console.log('Next: cd C:\\Users\\mbecn\\my-app\\starz-os-v9 && npm run build && npx vercel --prod');
} else {
  console.error('\n⚠  One or more patches failed. File NOT written. Check output above.');
}
