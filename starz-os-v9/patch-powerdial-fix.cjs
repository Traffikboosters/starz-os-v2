const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';
let src = fs.readFileSync(FILE, 'utf8');

// Fix 1: Guard currentLead in startCall
const oldStartCall = `  const startCall = async () => {
    const phone = dialNumber.trim()
    if (!phone) { info("Enter a phone number to dial"); return }
    if (!deviceRef.current) { info("Phone device not ready - please wait..."); return }`;

const newStartCall = `  const startCall = async () => {
    const phone = dialNumber.trim()
    if (!phone) { info("Enter a phone number to dial"); return }
    if (!deviceRef.current) { info("Phone device not ready - please wait..."); return }
    if (!currentLead) { info("No leads loaded yet - please wait..."); return }`;

// Fix 2: Guard currentLead in skipLead
const oldSkipLead = `  const skipLead = () => { endCall('skipped') }`;
const newSkipLead = `  const skipLead = () => { if (!currentLead) return; endCall('skipped') }`;

// Fix 3: Guard the idle state lead display block
const oldLeadDisplay = `                  <div className="mt-4 p-3 rounded-xl bg-space-highlight/30 border border-border/20 inline-block">
                    <p className="text-sm font-medium text-foreground">{currentLead.name}</p>
                    <p className="text-xs text-muted-foreground">{currentLead.company} · Score: {currentLead.score}</p>
                  </div>`;

const newLeadDisplay = `                  {currentLead && (
                    <div className="mt-4 p-3 rounded-xl bg-space-highlight/30 border border-border/20 inline-block">
                      <p className="text-sm font-medium text-foreground">{currentLead.name}</p>
                      <p className="text-xs text-muted-foreground">{currentLead.company} · Score: {currentLead.score}</p>
                    </div>
                  )}`;

// Fix 4: Guard calling state lead display
const oldCallingDisplay = `                  <h3 className="text-lg font-semibold text-foreground mb-1">Calling {currentLead.name}...</h3>
                  <p className="text-sm text-muted-foreground">{currentLead.company}</p>`;

const newCallingDisplay = `                  <h3 className="text-lg font-semibold text-foreground mb-1">Calling {currentLead?.name ?? '...'}...</h3>
                  <p className="text-sm text-muted-foreground">{currentLead?.company ?? ''}</p>`;

// Fix 5: Guard connected state avatar initials
const oldAvatarInitials = `                          {currentLead.name.split(' ').map(n => n[0]).join('')}`;
const newAvatarInitials = `                          {(currentLead?.name ?? '??').split(' ').map((n: string) => n[0]).join('')}`;

// Fix 6: Guard connected state lead info
const oldConnectedInfo = `                        <h3 className="text-lg font-bold text-foreground">{currentLead.name}</h3>
                        <p className="text-sm text-muted-foreground">{currentLead.company}</p>`;

const newConnectedInfo = `                        <h3 className="text-lg font-bold text-foreground">{currentLead?.name ?? ''}</h3>
                        <p className="text-sm text-muted-foreground">{currentLead?.company ?? ''}</p>`;

// Fix 7: Guard score display in connected state
const oldScoreDisplay = `                          <span className="text-xs text-muted-foreground">Score: {currentLead.score}</span>`;
const newScoreDisplay = `                          <span className="text-xs text-muted-foreground">Score: {currentLead?.score ?? 0}</span>`;

// Fix 8: Guard lead queue sidebar - remaining count
const oldRemainingCount = `                    {leadsLoading ? 'Loading leads...' : \`\${leadQueue.length - currentLeadIndex} leads remaining\`}`;
const newRemainingCount = `                    {leadsLoading ? 'Loading leads...' : leadQueue.length === 0 ? 'No leads found' : \`\${leadQueue.length - currentLeadIndex} leads remaining\`}`;

const patches = [
  [oldStartCall, newStartCall, 'startCall guard'],
  [oldSkipLead, newSkipLead, 'skipLead guard'],
  [oldLeadDisplay, newLeadDisplay, 'idle lead display guard'],
  [oldCallingDisplay, newCallingDisplay, 'calling state guard'],
  [oldAvatarInitials, newAvatarInitials, 'avatar initials guard'],
  [oldConnectedInfo, newConnectedInfo, 'connected info guard'],
  [oldScoreDisplay, newScoreDisplay, 'score display guard'],
  [oldRemainingCount, newRemainingCount, 'remaining count guard'],
];

let allGood = true;
for (const [oldStr, newStr, label] of patches) {
  if (!src.includes(oldStr)) {
    console.error(`❌ PATCH FAILED — could not find: "${label}"`);
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
  console.error('\n⚠  One or more patches failed. File NOT written.');
}
