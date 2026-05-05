const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-windows.js';
let c = fs.readFileSync(p, 'utf8');
// Remove non-ASCII characters
c = c.replace(/[\u2014\u2500\u2013]/g, '-');
c = c.replace(/[^\x00-\x7F]/g, '');
fs.writeFileSync(p, c, 'utf8');
console.log('cleaned, length:', c.length);