const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-windows.js';
let c = fs.readFileSync(p, 'utf8');

// Fix the broken line - the $ sign issue
c = c.replace(
  "Daily Budget</div><div class=\"font-mono font-bold text-white\">$",
  "Daily Budget</div><div class=\"font-mono font-bold text-white\">$"
);

// Remove ALL non-ASCII chars and any stray line breaks inside strings
c = c.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');

fs.writeFileSync(p, c, 'utf8');

// Verify no issues
const lines = c.split('\n');
lines.forEach(function(line, i) {
  if (line.includes('Daily Budget')) console.log('Daily Budget at line', i+1, ':', JSON.stringify(line.slice(0,100)));
});
console.log('done, lines:', lines.length);