import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [woRes, taskRes, pipelineRes, leadsRes, callsRes] = await Promise.all([
    supabase.schema('deals').from('work_orders')
      .select('business_name, client_name, status, package, fulfillment_status, created_at')
      .order('created_at', { ascending: false }).limit(10),
    supabase.schema('deals').from('tasks')
      .select('title, status, priority, due_date')
      .neq('status', 'completed')
      .order('created_at', { ascending: false }).limit(10),
    supabase.schema('deals').from('pipeline')
      .select('company, lead_name, stage, interest_level, source, last_contacted_at')
      .order('created_at', { ascending: false }).limit(10),
    supabase.schema('crm').from('leads')
      .select('company_name, business_name, status, lead_score, phone, email')
      .order('lead_score', { ascending: false, nullsFirst: false }).limit(5),
    supabase.schema('crm').from('calls')
      .select('status, outcome, duration_seconds, ai_summary, created_at')
      .order('created_at', { ascending: false }).limit(5),
  ]);

  const context = `
=== RICO BGE — FULFILLMENT STATUS ===
WORK ORDERS (latest 10):
${(woRes.data || []).map(w => `• ${w.business_name || w.client_name || 'Unknown'} | ${w.package || 'N/A'} | Status: ${w.status} | Fulfillment: ${w.fulfillment_status || 'N/A'}`).join('\n') || 'No work orders'}

OPEN TASKS:
${(taskRes.data || []).map(t => `• ${t.title || 'Untitled'} | ${t.status} | Priority: ${t.priority || 'N/A'} | Due: ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date'}`).join('\n') || 'No open tasks'}

=== STEVE BGE — SALES STATUS ===
PIPELINE (latest 10):
${(pipelineRes.data || []).map(p => `• ${p.company || p.lead_name || 'Unknown'} | Stage: ${p.stage || 'N/A'} | Interest: ${p.interest_level || 'N/A'} | Source: ${p.source || 'N/A'}`).join('\n') || 'No pipeline deals'}

TOP LEADS BY SCORE:
${(leadsRes.data || []).map(l => `• ${l.company_name || l.business_name || 'Unknown'} | Score: ${l.lead_score || 'N/A'} | Status: ${l.status || 'N/A'} | Phone: ${l.phone || 'N/A'}`).join('\n') || 'No leads'}

RECENT CALLS:
${(callsRes.data || []).map(c => `• ${c.outcome || c.status || 'Unknown'} | Duration: ${c.duration_seconds ? Math.round(c.duration_seconds / 60) + 'm' : 'N/A'} | ${c.ai_summary || 'No summary'}`).join('\n') || 'No recent calls'}
`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are Vox, the STARZ-OS internal communications agent at Traffik Boosters, powered by the Gizmo engine. You are the central hub connecting the entire internal team.

TEAM STRUCTURE:
- Dj: Owner (traffikboosters@gmail.com)
- Steve BGE: AI Sales agent — leads, outreach, pipeline, closing
- Rico BGE: AI Operations agent — work orders, tasks, BGE assignment, fulfillment
- Sales BGEs: Execute sales tasks assigned by Steve
- Fulfillment BGEs: Execute delivery tasks assigned by Rico, never contact clients directly
- Developer BGEs: Technical execution only, never contact clients directly

IMPORTANT: Everyone on the team is a BGE (Business Growth Expert). There are no contractors.

YOUR ROLE:
- You are the communications bridge between all BGEs via the Gizmo engine
- When asked about Rico's domain (work orders, tasks, fulfillment) — relay Rico's perspective using live data
- When asked about Steve's domain (leads, pipeline, calls, outreach) — relay Steve's perspective using live data
- Speak as Vox relaying FROM the relevant agent: "Rico reports..." or "Steve's pipeline shows..."
- Keep responses concise, data-driven, and actionable
- You communicate through Vox/Gizmo only — not Slack or any external tool
- When referring to yourself: you are Vox. The underlying engine is Gizmo.

LIVE SYSTEM DATA:
${context}`,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || 'Sorry, I could not process that.';
  return NextResponse.json({ response: text });
}