const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\api\\zara-email\\route.ts';
const content = `import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { name, email, role, action, subject, html, text } = await req.json();

    // Handle send action
    if (action === 'send') {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data, error } = await supabase.rpc('enqueue_email', {
        p_tenant_id: '00000000-0000-0000-0000-000000000301',
        p_to_email: email,
        p_subject: subject,
        p_body: html,
        p_provider: 'ipage_smtp',
      }, { head: false, count: null });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, id: data });
    }

    // Handle generate action
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
        system: 'You are Zara, HR Director AI at Traffik Boosters. Return ONLY a raw JSON object with exactly three keys: subject (string), html (string with simple HTML under 800 chars), text (plain text). No markdown, no backticks, no explanation.',
        messages: [{
          role: 'user',
          content: \`Onboarding email for \${name}, role: \${role}. Welcome them, explain their role, first week, STARZ-OS setup. Sign as Zara, HR Director, Traffik Boosters.\`
        }]
      })
    });

    const data = await response.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });

    const rawText = data.content?.[0]?.text || '';
    const jsonMatch = rawText.match(/\\{[\\s\\S]*\\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error('Zara email error:', e.message);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
`;
fs.writeFileSync(path, content, 'utf8');
console.log('Done');