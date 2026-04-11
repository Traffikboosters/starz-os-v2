const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\api\\zara-email\\route.ts';
const content = `import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, email, role, subject, html } = body;

    if (action === 'send') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      const res = await fetch(supabaseUrl + '/rest/v1/rpc/enqueue_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey || '',
          'Authorization': 'Bearer ' + serviceKey,
          'Accept-Profile': 'ops',
          'Content-Profile': 'ops',
        },
        body: JSON.stringify({
          p_tenant_id: '00000000-0000-0000-0000-000000000301',
          p_to_email: email,
          p_subject: subject,
          p_body: html,
          p_provider: 'ipage_smtp',
        }),
      });

      const data = await res.json();
      console.log('enqueue status:', res.status, JSON.stringify(data).slice(0,200));
      if (!res.ok) return NextResponse.json({ error: JSON.stringify(data) }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'You are Zara, HR Director AI at Traffik Boosters. Return ONLY a raw JSON object with exactly three keys: subject (string), html (string with simple HTML under 800 chars), text (plain text). No markdown, no backticks.',
        messages: [{ role: 'user', content: 'Onboarding email for ' + name + ', role: ' + role + '. Welcome them, explain their role, first week, STARZ-OS setup. Sign as Zara, HR Director, Traffik Boosters.' }]
      })
    });

    const data = await response.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
    const rawText = data.content?.[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error('Zara error:', e.message);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
`;
fs.writeFileSync(path, content, 'utf8');
console.log('Done');