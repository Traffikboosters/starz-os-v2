const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\hr\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `const { error } = await sb.schema('ops').rpc('enqueue_email', {
        p_tenant_id: '00000000-0000-0000-0000-000000000301',
        p_to_email: emailTarget.email,
        p_subject: generatedEmail.subject,
        p_body: generatedEmail.html,
        p_provider: 'ipage_smtp',
      });
      if (error) throw error;`,
  `const sendRes = await fetch('/api/zara-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          email: emailTarget.email,
          subject: generatedEmail.subject,
          html: generatedEmail.html,
          text: generatedEmail.text,
        }),
      });
      const sendData = await sendRes.json();
      if (sendData.error) throw new Error(sendData.error);`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');