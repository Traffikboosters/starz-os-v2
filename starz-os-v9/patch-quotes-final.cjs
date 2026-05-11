const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';
let lines = fs.readFileSync(FILE, 'utf8').split('\n');

// Fix every line in getSteveScripts that has mixed quote issues
// Strategy: find all scripts.push lines and rewrite them clean with backticks

const fixes = [
  {
    match: "I'd rather spend",
    replacement: `  scripts.push({ type: 'objection', text: \`If they say they want info — respond: Absolutely, and I would rather spend 8 minutes walking you through it live so it is tailored to your market. Are you free for a quick call this week?\`, icon: AlertCircle })`
  },
  {
    match: "send me info",
    replacement: `  scripts.push({ type: 'objection', text: \`If they say they want info — respond: Absolutely, and I would rather spend 8 minutes walking you through it live so it is tailored to your market. Are you free for a quick call this week?\`, icon: AlertCircle })`
  }
];

let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  for (const fix of fixes) {
    if (lines[i].includes(fix.match)) {
      console.log(`Fixing line ${i + 1}: ${lines[i].substring(0, 80)}...`);
      lines[i] = fix.replacement;
      fixed++;
      break;
    }
  }
}

if (fixed === 0) {
  console.error('❌ No lines found to fix');
} else {
  fs.writeFileSync(FILE, Buffer.from(lines.join('\n'), 'utf8'));
  console.log(`✅ Fixed ${fixed} line(s)`);
  console.log('npm run build');
  console.log('npx vercel --prod');
}
