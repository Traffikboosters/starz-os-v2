const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';
let lines = fs.readFileSync(FILE, 'utf8').split('\n');

// Find and fix line 98 (index 97)
const badLineIdx = lines.findIndex(l => l.includes("you aren't") || l.includes("you're not") || (l.includes('SEO audit') && l.includes('competitors')));

if (badLineIdx === -1) {
  console.error('❌ Could not find the bad line');
  process.exit(1);
}

console.log(`Found bad line at index ${badLineIdx}: ${lines[badLineIdx].substring(0, 80)}...`);

// Replace with a clean version using template literal backticks — no quote conflicts
lines[badLineIdx] = `    scripts.push({ type: 'tip', text: \`Offer a free local SEO audit as the opener. Ask: Are you showing up when people search for your service in your city? Then pivot to the pitch.\`, icon: Star })`;

fs.writeFileSync(FILE, Buffer.from(lines.join('\n'), 'utf8'));
console.log('✅ Line fixed!');
console.log('npm run build');
console.log('npx vercel --prod');
