const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';
let src = fs.readFileSync(FILE, 'utf8');

// Auto-set dialNumber when leads load
const oldSetLeads = `      setLeadQueue(normalized)
      if (normalized.length > 0) setCurrentLeadIndex(0)`;

const newSetLeads = `      setLeadQueue(normalized)
      if (normalized.length > 0) {
        setCurrentLeadIndex(0)
        if (normalized[0]?.phone) setDialNumber(normalized[0].phone)
      }`;

// Also auto-fill when currentLeadIndex changes
const oldNextLead = `  const nextLead = () => {
    setCallState('idle')
    setCallTime(0)
    setCurrentLeadIndex((i) => Math.min(i + 1, leadQueue.length - 1))
  }`;

const newNextLead = `  const nextLead = () => {
    setCallState('idle')
    setCallTime(0)
    const nextIndex = Math.min(currentLeadIndex + 1, leadQueue.length - 1)
    setCurrentLeadIndex(nextIndex)
    if (leadQueue[nextIndex]?.phone) setDialNumber(leadQueue[nextIndex].phone)
  }`;

const oldPrevLead = `  const prevLead = () => {
    setCallState('idle')
    setCallTime(0)
    setCurrentLeadIndex((i) => Math.max(i - 1, 0))
  }`;

const newPrevLead = `  const prevLead = () => {
    setCallState('idle')
    setCallTime(0)
    const prevIndex = Math.max(currentLeadIndex - 1, 0)
    setCurrentLeadIndex(prevIndex)
    if (leadQueue[prevIndex]?.phone) setDialNumber(leadQueue[prevIndex].phone)
  }`;

const patches = [
  [oldSetLeads, newSetLeads, 'auto-fill on load'],
  [oldNextLead, newNextLead, 'auto-fill on next'],
  [oldPrevLead, newPrevLead, 'auto-fill on prev'],
];

let allGood = true;
for (const [oldStr, newStr, label] of patches) {
  if (!src.includes(oldStr)) {
    console.error(`❌ PATCH FAILED: "${label}"`);
    allGood = false;
  } else {
    src = src.replace(oldStr, newStr);
    console.log(`✅ Patched: ${label}`);
  }
}

if (allGood) {
  fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
  console.log('\n🚀 Fix applied!');
  console.log('npm run build');
  console.log('npx vercel --prod');
} else {
  console.error('\n⚠  Patch failed. File NOT written.');
}
