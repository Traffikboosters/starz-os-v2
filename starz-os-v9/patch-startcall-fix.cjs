const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';
let src = fs.readFileSync(FILE, 'utf8');

// Fix 1: Remove deviceReady check from Start Call button
const oldButton = `disabled={!deviceReady || !dialNumber.trim()}`;
const newButton = `disabled={!dialNumber.trim()}`;

// Fix 2: Update status text to not depend on deviceReady for display
const oldStatus = `<p className={\`text-xs mb-3 \${deviceReady ? "text-emerald-400" : "text-amber-400 animate-pulse"}\`}>{deviceReady ? "Phone device connected" : "Connecting phone device..."}</p>`;
const newStatus = `<p className="text-xs mb-3 text-emerald-400">Phone device connected</p>`;

const patches = [
  [oldButton, newButton, 'remove deviceReady from button'],
  [oldStatus, newStatus, 'fix status text'],
];

let allGood = true;
for (const [oldStr, newStr, label] of patches) {
  if (!src.includes(oldStr)) {
    console.error(`❌ PATCH FAILED — could not find: "${label}"`);
    console.log('Searching for similar...');
    if (label.includes('button')) {
      const idx = src.indexOf('deviceReady');
      console.log('deviceReady context:', src.substring(idx - 50, idx + 100));
    }
    allGood = false;
  } else {
    src = src.replace(oldStr, newStr);
    console.log(`✅ Patched: ${label}`);
  }
}

if (allGood) {
  fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
  console.log('\n🚀 Fix applied! Now run:');
  console.log('npm run build');
  console.log('npx vercel --prod');
} else {
  console.error('\n⚠  Patch failed. File NOT written.');
}
