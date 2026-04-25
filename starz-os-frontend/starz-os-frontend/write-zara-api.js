const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\api\\zara-email\\route.ts';
const content = `import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, role } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are Zara, the HR Director AI at Traffik Boosters. Write professional, warm, and motivating onboarding emails. Always sign off as Zara, HR Director at Traffik Boosters. Return ONLY a valid JSON object with keys: subject, html, text. No markdown, no backticks, no explanation.',
        messages: [{
          role: 'user',
          content: \`Write an onboarding email for a new hire named \${name} joining as \${role} at Traffik Boosters. Their email is \${email}. Include: warm welcome, their role and responsibilities, what to expect in the first week, next steps to get set up in STARZ-OS. Make the HTML version visually formatted with sections and line breaks.\`
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to generate email' }, { status: 500 });
  }
}
`;
fs.writeFileSync(path, content, 'utf8');
console.log('Done');