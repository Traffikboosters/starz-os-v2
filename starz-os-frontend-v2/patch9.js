const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');

// 1. Add script tag before </body>
if (!c.includes('starz-windows.js')) {
  c = c.replace('</body>', '<script src="/starz-windows.js"></script>\n</body>');
}

// 2. Add _registerLoader function after const loaders = {
if (!c.includes('window._registerLoader')) {
  c = c.replace(
    'const loaders = {',
    'window._registerLoader = function(id, fn) { loaders[id] = fn; };\nconst loaders = {'
  );
}

// 3. Add appConfig
if (!c.includes("ads:         { name:")) {
  c = c.replace(
    "scraper:     { name:'Scraper Control', icon:'cpu', w:1140, h:780 },",
    "scraper:     { name:'Scraper Control', icon:'cpu', w:1140, h:780 },\n  ads:         { name:'Google Ads Engine', icon:'megaphone', w:1160, h:800 },"
  );
}

// 4. Add dock button
if (!c.includes("openWindow('ads')")) {
  c = c.replace(
    "<button onclick=\"openWindow('scraper')\"",
    "<button onclick=\"openWindow('ads')\" class=\"dock-item w-12 h-12 rounded-xl flex items-center justify-center group relative\" style=\"background:linear-gradient(145deg,#fb923c 0%,#ea580c 45%,#7c2d12 100%) !important;box-shadow:0 1px 0 rgba(255,255,255,0.32) inset,0 -3px 0 rgba(0,0,0,0.45) inset,0 8px 28px rgba(234,88,12,0.65)\"><i data-lucide=\"megaphone\" class=\"w-6 h-6 text-white relative z-10\"></i><div class=\"absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700\">Ads Engine</div></button><button onclick=\"openWindow('scraper')\""
  );
}

fs.writeFileSync(p, c, 'utf8');
console.log('script tag:', c.includes('starz-windows.js'));
console.log('registerLoader:', c.includes('_registerLoader'));
console.log('appConfig:', c.includes("ads:         { name:"));
console.log('dock:', c.includes("openWindow('ads')"));