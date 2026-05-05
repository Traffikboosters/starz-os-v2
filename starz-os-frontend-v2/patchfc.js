const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');

if (!c.includes("fulfillment: { name:")) {
  c = c.replace(
    "ads:         { name:'Google Ads Engine', icon:'megaphone', w:1160, h:800 },",
    "ads:         { name:'Google Ads Engine', icon:'megaphone', w:1160, h:800 },\n  fulfillment: { name:'Rico Fulfillment Center', icon:'briefcase', w:1200, h:820 },"
  );
}

if (!c.includes("openWindow('fulfillment')")) {
  c = c.replace(
    "<button onclick=\"openWindow('ads')\"",
    "<button onclick=\"openWindow('fulfillment')\" class=\"dock-item w-12 h-12 rounded-xl flex items-center justify-center group relative\" style=\"background:linear-gradient(145deg,#60a5fa 0%,#2563eb 45%,#1e3a8a 100%) !important;box-shadow:0 1px 0 rgba(255,255,255,0.32) inset,0 -3px 0 rgba(0,0,0,0.45) inset,0 8px 28px rgba(37,99,235,0.65)\"><i data-lucide=\"briefcase\" class=\"w-6 h-6 text-white relative z-10\"></i><div class=\"absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700\">Fulfillment</div></button><button onclick=\"openWindow('ads')\""
  );
}

fs.writeFileSync(p, c, 'utf8');
console.log('appConfig:', c.includes("fulfillment: { name:"));
console.log('dock:', c.includes("openWindow('fulfillment')"));