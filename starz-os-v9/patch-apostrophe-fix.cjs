const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';
let src = fs.readFileSync(FILE, 'utf8');

const oldLine = `    scripts.push({ type: 'tip', text: 'Offer a free local SEO audit as the opener. "I ran a quick check on your business — want to see what your competitors are doing that you're not?"', icon: Star })`;

const newLine = `    scripts.push({ type: 'tip', text: "Offer a free local SEO audit as the opener. \"I ran a quick check on your business — want to see what your competitors are doing that you aren't?\"", icon: Star })`;

const oldObjection = `  scripts.push({ type: 'objection', text: 'If they say "send me info" → "Absolutely — and I\\'d rather spend 8 minutes walking you through it live so it\\'s tailored to your market. Are you free for a quick call this week?"', icon: AlertCircle })`;

const newObjection = `  scripts.push({ type: 'objection', text: "If they say 'send me info' — respond: 'Absolutely, and I would rather spend 8 minutes walking you through it live so it is tailored to your market. Are you free for a quick call this week?'", icon: AlertCircle })`;

let allGood = true;

if (!src.includes(oldLine)) {
  // Try to find and fix any apostrophe issue around that line
  const idx = src.indexOf("you're not");
  if (idx > -1) {
    const start = src.lastIndexOf("scripts.push", idx);
    const end = src.indexOf('\n', idx) + 1;
    const badLine = src.substring(start, end);
    console.log('Found bad line:', badLine.substring(0, 100));
    src = src.substring(0, start) + newLine + '\n' + src.substring(end);
    console.log('✅ Fixed apostrophe in SEO audit line');
  } else {
    console.error('❌ Could not find SEO audit line');
    allGood = false;
  }
} else {
  src = src.replace(oldLine, newLine);
  console.log('✅ Fixed: SEO audit apostrophe');
}

if (!src.includes(oldObjection)) {
  const idx2 = src.indexOf("I\\'d rather");
  if (idx2 > -1) {
    const start2 = src.lastIndexOf("scripts.push", idx2);
    const end2 = src.indexOf('\n', idx2) + 1;
    src = src.substring(0, start2) + newObjection + '\n' + src.substring(end2);
    console.log('✅ Fixed objection handler apostrophe');
  } else {
    console.log('ℹ️  Objection line not found — may already be clean');
  }
} else {
  src = src.replace(oldObjection, newObjection);
  console.log('✅ Fixed: objection apostrophe');
}

fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
console.log('\n🚀 Fix applied! Now run:');
console.log('npm run build');
console.log('npx vercel --prod');
