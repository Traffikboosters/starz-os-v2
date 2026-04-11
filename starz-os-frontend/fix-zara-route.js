const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\api\\zara-email\\route.ts';
const content = `import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, role } = await req.json();
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('API Key present:', !!apiKey, 'starts with:', apiKey?.slice(0, 10));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are Zara, the HR Director AI at Traffik Boosters. Return ONLY a valid JSON object with keys: subject, html, text. No markdown, no backticks.',
        messages: [{ role: 'user', content: \`Write a warm onboarding email for \${name} joining as \${role}. Include welcome, role overview, first week expectations, STARZ-OS setup steps. Sign as Zara, HR Director.\` }]
      })
    });

    console.log('Anthropic status:', response.status);
    const raw = await response.text();
    console.log('Anthropic raw response:', raw.slice(0, 300));
    
    const data = JSON.parse(raw);
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
    
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error('Zara email error:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
`;
fs.writeFileSync(path, content, 'utf8');
console.log('Done');