const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\hr\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Rename emailError to sendError in the new states and all references
content = content.replace(
  '  const [emailError, setEmailError] = useState<string | null>(null);',
  '  const [sendError, setSendError] = useState<string | null>(null);'
);

// Fix all references to emailError -> sendError in the modal and functions
content = content.replace(/setEmailError\(/g, 'setSendError(');
content = content.replace(/emailError\b/g, 'sendError');

fs.writeFileSync(path, content, 'utf8');
console.log('Done');