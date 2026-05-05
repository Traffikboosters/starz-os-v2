const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-windows.js';
let c = fs.readFileSync(p, 'utf8');

// Join any string that was split across lines inside single quotes
// Find the broken pattern and join it
c = c.replace(/font-mono font-bold text-white">\r?\n/g, 'font-mono font-bold text-white">');
c = c.replace(/font-mono font-bold text-white">\n/g, 'font-mono font-bold text-white">');

fs.writeFileSync(p, c, 'utf8');

const lines = c.split('\n');
lines.forEach(function(line, i) {
  if (line.includes('Daily Budget') || line.includes('font-mono font-bold text-white')) {
    console.log('line', i+1, ':', JSON.stringify(line.slice(0,120)));
  }
});
console.log('total lines:', lines.length);