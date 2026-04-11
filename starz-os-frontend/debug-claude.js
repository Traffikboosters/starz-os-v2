const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\api\\zara-email\\route.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const rawText = data.content?.[0]?.text || '';",
  "const rawText = data.content?.[0]?.text || '';\n    console.log('Claude raw:', rawText.slice(0, 500));"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');