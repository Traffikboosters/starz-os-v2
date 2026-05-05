const { spawnSync } = require('child_process');
const fs = require('fs');

const NEW_URL = 'https://spb-t4nl2t9m7hhk921t.supabase.opentrust.net';
const NEW_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5sMnQ5bTdoaGs5MjF0IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzc5MjAyMjEsImV4cCI6MjA5MzQ5NjIyMX0.Mq8q-iquvE1ART8HykA94WUmCdGG-JWT2oACCJZa1AA';

// 1. Restore original bytes directly from git
console.log('Restoring file from git...');
const result = spawnSync('git', ['show', '948e852:starz-os-frontend-v2/public/starz-os.html'], {
  maxBuffer: 50 * 1024 * 1024
});
if (result.status !== 0) { console.error('FAILED:', result.stderr.toString()); process.exit(1); }
fs.writeFileSync('public/starz-os.html', result.stdout);
console.log('Restored:', result.stdout.length, 'bytes');

// 2. Read and validate
let html = fs.readFileSync('public/starz-os.html', 'utf8');
console.log('Lines:', html.split('\n').length, '| Valid HTML:', html.trimStart().startsWith('<'));

// 3. Replace URL
html = html.replaceAll('https://szguizvpiiuiyugrjeks.supabase.co', NEW_URL);
console.log('URL replaced | old URL remains:', html.includes('szguizvpiiuiyugrjeks'));

// 4. Find key line and replace
const lines = html.split('\n');
let replaced = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('eyJ') && lines[i].match(/KEY|key|anon|ANON/)) {
    console.log('Key found on line', i + 1, ':', lines[i].substring(0, 90));
    lines[i] = lines[i].replace(/eyJ[A-Za-z0-9._-]+/, NEW_KEY);
    replaced = true;
    break;
  }
}
if (!replaced) console.log('WARNING: key line not found!');

// 5. Fix Unicode smart quotes throughout the file (causes SyntaxError in JS)
let smartQuoteCount = 0;
for (let i = 0; i < lines.length; i++) {
  const fixed = lines[i].replace(/[\u2018\u2019\u201A\u201B]/g, "'")
                         .replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  if (fixed !== lines[i]) {
    console.log('Fixed smart quotes on line', i + 1);
    smartQuoteCount++;
    lines[i] = fixed;
  }
}
console.log('Total lines with smart quotes fixed:', smartQuoteCount);

html = lines.join('\n');

// 6. Write
fs.writeFileSync('public/starz-os.html', html, 'utf8');
console.log('\n=== RESULT ===');
console.log('Old URL gone:', !html.includes('szguizvpiiuiyugrjeks'));
console.log('New URL present:', html.includes('spb-t4nl2t9m7hhk921t'));
console.log('New key present:', html.includes('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9'));
