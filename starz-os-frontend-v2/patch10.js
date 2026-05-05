const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');
const js = fs.readFileSync('C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-windows.js', 'utf8');

// Replace the external script tag with inline script
c = c.replace('<script src="/starz-windows.js"></script>', '<script>\n' + js + '\n</script>');

fs.writeFileSync(p, c, 'utf8');
console.log('inlined:', c.includes('_registerLoader('));