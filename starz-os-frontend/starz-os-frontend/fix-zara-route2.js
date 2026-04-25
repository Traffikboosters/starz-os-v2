const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\api\\zara-email\\route.ts';
const content = `import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, role } = await req.json();
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
        system: 'You are Zara, HR Director AI at Traffik Boosters. Return ONLY a raw JSON object — no markdown, no backticks, no explanation. The JSON must have exactly three keys: subject (string), html (string with simple HTML), text (plain text version). Keep html under 800 characters.',
        messages: [{
          role: 'user',
          content: \`Onboarding email for \${name}, role: \${role}. Welcome them, explain their role, first week, STARZ-OS setup. Sign as Zara, HR Director, Traffik Boosters.\`
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const text = data.content?.[0]?.text || '';
    
    // Extract JSON even if there's surrounding text
    const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
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