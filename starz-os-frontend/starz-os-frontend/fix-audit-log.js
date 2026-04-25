const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\hr\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove the audit log insert that's causing the FK error
content = content.replace(
  `      // Log to HR audit
      await sb.schema('hr').from('audit_logs').insert({
        event_type: 'onboarding_email_sent',
        event_payload: { to: emailTarget.email, name: emailTarget.full_name, subject: generatedEmail.subject, sent_by: 'Zara' }
      });`,
  `      // Audit log skipped - requires actor_user_id FK`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');