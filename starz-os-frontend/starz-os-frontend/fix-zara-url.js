const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\hr\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace ALL instances of the anthropic direct call with our proxy
while (content.includes("https://api.anthropic.com/v1/messages")) {
  const start = content.indexOf("const response = await fetch('https://api.anthropic.com/v1/messages'");
  const end = content.indexOf("setGeneratedEmail(parsed);", start) + "setGeneratedEmail(parsed);".length;
  const replacement = `const response = await fetch('/api/zara-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.full_name || 'Team Member', email: user.email, role: userRoleNames }),
      });
      const parsed = await response.json();
      if (parsed.error) throw new Error(parsed.error);
      setGeneratedEmail(parsed);`;
  content = content.slice(0, start) + replacement + content.slice(end);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done');