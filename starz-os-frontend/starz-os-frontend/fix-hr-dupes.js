const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\hr\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove the duplicate second block of states
const duplicate = `  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState<HRUser | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendError, setEmailError] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [generating, setGenerating] = useState(false);`;

content = content.replace(duplicate, '');

// Also fix the setSendError reference that still uses old name
content = content.replace(/setEmailError\(/g, 'setSendError(');

fs.writeFileSync(path, content, 'utf8');
console.log('Done');