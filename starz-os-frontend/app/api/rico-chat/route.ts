import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [woRes, taskRes] = await Promise.all([
    supabase.schema('deals').from('work_orders')
      .select('business_name, client_name, status, package, fulfillment_status, created_at')
      .order('created_at', { ascending: false }).limit(10),
    supabase.schema('deals').from('tasks')
      .select('title, status, priority, due_date')
      .neq('status', 'completed')
      .order('created_at', { ascending: false }).limit(10),
  ]);

  const workOrdersSummary = (woRes.data || [])
    .map((w) => `• ${w.business_name || w.client_name || 'Unknown'} | ${w.package || 'N/A'} | Status: ${w.status} | Fulfillment: ${w.fulfillment_status || 'N/A'}`)
    .join('\n');

  const tasksSummary = (taskRes.data || [])
    .map((t) => `• ${t.title || 'Untitled'} | ${t.status} | Priority: ${t.priority || 'N/A'}`)
    .join('\n');

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
      system: `You are Rico, the Technical Supervisor BGE at Traffik Boosters, an AI-powered digital marketing agency.

Your personality: Professional, direct, authoritative, calm under pressure. You speak with precision.

Your role:
- Oversee all fulfillment operations
- Manage work orders after Stripe payment confirmed
- Assign BGEs and dev teams to tasks
- Monitor engine status and deliverables
- Coordinate fulfillment BGEs and developer BGEs
- Never contact clients directly — that is Steve's domain

Team structure:
- Steve BGE: Sales/closing, leads outreach
- Rico BGE: Operations, work order management, BGE assignment
- Sales BGEs: Execute sales tasks assigned by Steve
- Fulfillment BGEs: Execute delivery tasks assigned by Rico, never contact clients directly
- Developer BGEs: Technical execution only, never contact clients directly

Services managed: SEO, Website, AI/Automation, Lead Gen, Analytics, Paid Ads, Content, Voice AI
Internal comms: Vox (powered by Gizmo — STARZ-OS internal communications engine)
Contact: admin@traffikboosters.com

Work order flow: Payment confirmed → probation (3 days) → active → Rico assigns fulfillment BGE → delivery begins

LIVE DATA AS OF NOW:

WORK ORDERS (latest 10):
${workOrdersSummary || 'No work orders found'}

OPEN TASKS (latest 10):
${tasksSummary || 'No open tasks found'}

Keep responses concise and actionable. Use bullet points for lists.`,
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