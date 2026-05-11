const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';
let src = fs.readFileSync(FILE, 'utf8');

const oldEnded = `                  {callState === 'ended' && (
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-foreground mb-1">Call Ended</h3>
                      <p className="text-sm text-muted-foreground mb-4">Duration: {formatTime(callTime)}</p>
                      <Button onClick={nextLead} className="bg-gradient-primary text-space font-bold">
                        <Phone className="w-4 h-4 mr-2" /> Next Lead
                      </Button>
                    </div>
                  )}`;

const newEnded = `                  {callState === 'ended' && (
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-foreground mb-1">Call Ended</h3>
                      <p className="text-sm text-muted-foreground mb-4">Duration: {formatTime(callTime)}</p>
                      <div className="flex items-center justify-center gap-3">
                        <Button variant="outline" onClick={() => { setCallState('idle'); setCallTime(0); }} className="border-border/40 text-muted-foreground">
                          <RotateCcw className="w-4 h-4 mr-2" /> Stay on Lead
                        </Button>
                        <Button onClick={nextLead} className="bg-gradient-primary text-space font-bold">
                          <Phone className="w-4 h-4 mr-2" /> Next Lead
                        </Button>
                      </div>
                    </div>
                  )}`;

if (!src.includes(oldEnded)) {
  console.error('❌ PATCH FAILED — could not find call ended block');
} else {
  src = src.replace(oldEnded, newEnded);
  console.log('✅ Patched: call ended screen');
  fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
  console.log('\n🚀 Fix applied!');
  console.log('npm run build');
  console.log('npx vercel --prod');
}
