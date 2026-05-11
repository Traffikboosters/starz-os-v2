const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';
let src = fs.readFileSync(FILE, 'utf8');

const oldQueue = `            {leadQueue.map((lead, i) => (
              <div key={lead.id} onClick={() => { setCallState('idle'); setCurrentLeadIndex(i); }}
                className={\`p-3 rounded-xl border transition-all cursor-pointer \${
                  i === currentLeadIndex ? 'border-cyan/30 bg-cyan/5' : 'border-border/30 hover:border-cyan/20 hover:bg-space-highlight/30'
                }\`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{lead.id}</span>
                  <Badge className={\`text-[10px] \${lead.status === 'hot' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}\`}>{lead.status}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{lead.name}</p>
                <p className="text-[10px] text-muted-foreground">{lead.company} · {lead.source}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-cyan" />
                    <span className="text-xs text-cyan font-semibold">{lead.score}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{lead.time}</span>
                </div>
              </div>
            ))}`;

const newQueue = `            {leadQueue.map((lead, i) => (
              <div key={lead.id} onClick={() => { setCallState('idle'); setCurrentLeadIndex(i); if (lead.phone) setDialNumber(lead.phone); }}
                className={\`p-3 rounded-xl border transition-all cursor-pointer \${
                  i === currentLeadIndex ? 'border-cyan/30 bg-cyan/5' : 'border-border/30 hover:border-cyan/20 hover:bg-space-highlight/30'
                }\`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-muted-foreground">#{String(i + 1).padStart(3, '0')}</span>
                  <Badge className={\`text-[10px] \${lead.status === 'hot' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}\`}>{lead.status}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{lead.name}</p>
                <p className="text-[10px] text-muted-foreground">{lead.industry || lead.source || 'General'} · {lead.phone || 'No phone'}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-cyan" />
                    <span className="text-xs text-cyan font-semibold">{lead.score}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{lead.call_attempts ? \`\${lead.call_attempts} attempts\` : 'New'}</span>
                </div>
              </div>
            ))}`;

if (!src.includes(oldQueue)) {
  console.error('❌ PATCH FAILED — could not find lead queue block');
} else {
  src = src.replace(oldQueue, newQueue);
  console.log('✅ Patched: lead queue display');
  fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
  console.log('\n🚀 Fix applied!');
  console.log('npm run build');
  console.log('npx vercel --prod');
}
