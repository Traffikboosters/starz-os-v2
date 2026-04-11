const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\hr\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are Zara, the HR Director AI at Traffik Boosters. Write professional, warm, and motivating onboarding emails. Always sign off as Zara, HR Director at Traffik Boosters. Return ONLY a JSON object with keys: subject, html, text. No markdown, no backticks.',
          messages: [{
            role: 'user',
            content: \\\`Write an onboarding email for a new hire named \\\${user.full_name || 'Team Member'} joining as \\\${userRoleNames} at Traffik Boosters. Their email is \\\${user.email}. Include: warm welcome, their role, what to expect in the first week, and next steps to get set up in STARZ-OS. Make the HTML version visually formatted with sections.\\\`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/\\\`\\\`\\\`json|\\\`\\\`\\\`/g, '').trim();
      const parsed = JSON.parse(clean);
      setGeneratedEmail(parsed);`,
  `      const response = await fetch('/api/zara-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.full_name || 'Team Member', email: user.email, role: userRoleNames }),
      });
      const parsed = await response.json();
      if (parsed.error) throw new Error(parsed.error);
      setGeneratedEmail(parsed);`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');