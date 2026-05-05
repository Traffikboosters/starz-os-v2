const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
  '<button onclick="openWindow(\'extractor\')"',
  '<button onclick="openWindow(\'pipeline\')" class="dock-item w-12 h-12 rounded-xl flex items-center justify-center group relative" style="background:linear-gradient(145deg,#67e8f9 0%,#0891b2 45%,#164e63 100%) !important;box-shadow:0 1px 0 rgba(255,255,255,0.32) inset,0 -3px 0 rgba(0,0,0,0.45) inset,0 8px 28px rgba(8,145,178,0.65)"><i data-lucide="workflow" class="w-6 h-6 text-white relative z-10"></i><div class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700">Data Pipeline</div></button><button onclick="openWindow(\'extractor\')"'
);
fs.writeFileSync(p, c, 'utf8');
console.log('dock:', c.includes("openWindow('pipeline')"));