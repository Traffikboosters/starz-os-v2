const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\hr\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `const { error } = await sb.rpc('enqueue_email', {
        p_tenant: '00000000-0000-0000-0000-000000000301',
        p_recipient: emailTarget.email,
        p_subject: generatedEmail.subject,
        p_html: generatedEmail.html,
        p_text: generatedEmail.text,
      }, { schema: 'ops' });`,
  `const { error } = await sb.rpc('enqueue_email', {
        p_tenant_id: '00000000-0000-0000-0000-000000000301',
        p_to_email: emailTarget.email,
        p_subject: generatedEmail.subject,
        p_body: generatedEmail.html,
        p_provider: 'ipage_smtp',
      }, { schema: 'ops' });`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');