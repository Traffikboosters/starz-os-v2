const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
const jsPath = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-windows.js';

let c = fs.readFileSync(p, 'utf8');
let js = fs.readFileSync(jsPath, 'utf8');

// Find block 5 - the last <script> block
const start = c.lastIndexOf('<script>');
const end = c.indexOf('</script>', start) + '</script>'.length;

console.log('Replacing block at', start, 'to', end, 'size:', end-start);
console.log('New JS size:', js.length);
console.log('JS has fulfillment:', js.includes('fulfillment'));

const newBlock = '<script>\n' + js + '\n</script>';
c = c.slice(0, start) + newBlock + c.slice(end);

fs.writeFileSync(p, c, 'utf8');
console.log('Done, file size:', c.length);
console.log('Has fulfillment:', c.includes("_registerLoader('fulfillment'"));