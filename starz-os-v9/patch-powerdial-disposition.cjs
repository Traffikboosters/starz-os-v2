const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/pages/PowerDial.tsx';
let src = fs.readFileSync(FILE, 'utf8');

// Fix 1: Update leads fetch to sort by score DESC and include disposition/next_best_action
const oldFetch = `  const { data, error } = await supabase
    .from('leads')
    .select('id,business_name,phone,industry,score,call_attempts,disposition,source,status,website,rating,review_count')
    .eq('status', 'qualified')
    .not('phone', 'is', null)
    .neq('phone', '')
    .order('score', { ascending: false })
    .limit(70)`;

const newFetch = `  const { data, error } = await supabase
    .from('leads')
    .select('id,business_name,phone,industry,score,call_attempts,disposition,source,status,website,rating,review_count,next_best_action,priority_level,email')
    .eq('status', 'qualified')
    .not('phone', 'is', null)
    .neq('phone', '')
    .order('score', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(70)`;

// Fix 2: Replace static steveScripts function with richer reasoning
const oldSteveScripts = `// ─── Steve Whisper scripts (dynamic by industry) ──────────────────────────────
function getSteveScripts(lead: any) {
  const industry = (lead?.industry || '').toLowerCase()
  const score = lead?.score || 0
  const attempts = lead?.call_attempts || 0
  const scripts = []

  if (score >= 80) scripts.push({ type: 'insight', text: \`High-intent lead — score \${score}. Open strong with ROI focus.\`, icon: Target })
  else scripts.push({ type: 'insight', text: \`Score \${score} — qualify budget and timeline early.\`, icon: Target })

  if (attempts > 0) scripts.push({ type: 'alert', text: \`\${attempts} prior contact attempt(s). Reference previous outreach to build familiarity.\`, icon: AlertCircle })

  if (industry.includes('roof') || industry.includes('hvac') || industry.includes('plumb'))
    scripts.push({ type: 'tip', text: 'Home services — lead cares about local reviews and speed. Mention 3-day launch timeline.', icon: Star })
  else if (industry.includes('dental') || industry.includes('medical'))
    scripts.push({ type: 'tip', text: 'Healthcare lead — HIPAA-aware pitch. Focus on patient acquisition, not just traffic.', icon: Star })
  else
    scripts.push({ type: 'tip', text: 'Offer a free website/SEO audit as a quick win to open the conversation.', icon: Star })

  scripts.push({ type: 'objection', text: 'If they say "send me info" — respond: "I can, but our best results come from a quick 10-min strategy call. When are you free?"', icon: AlertCircle })

  return scripts
}`;

const newSteveScripts = `// ─── Disposition config ───────────────────────────────────────────────────────
function getDispositionConfig(disposition: string) {
  switch (disposition) {
    case 'hot_handoff':
      return { label: '🔥 Critical', color: 'bg-red-500/10 text-red-400 border-red-500/30' }
    case 'handoff_ready':
      return { label: '⚡ Ready', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
    case 'nurture':
      return { label: '🌱 Nurture', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
    default:
      return { label: '📋 New', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
  }
}

// ─── Estimated monthly value by industry ─────────────────────────────────────
function getEstimatedValue(industry: string) {
  const ind = (industry || '').toLowerCase()
  if (ind.match(/roof|solar/)) return '$4,500–$8,000/mo'
  if (ind.match(/hvac|plumb/)) return '$3,500–$6,000/mo'
  if (ind.match(/dental|medspa|plastic/)) return '$5,000–$12,000/mo'
  if (ind.match(/attorney|law/)) return '$4,000–$10,000/mo'
  if (ind.match(/electric|landscap/)) return '$2,500–$4,500/mo'
  return '$1,500–$3,000/mo'
}

// ─── Steve Whisper + Reasoning Panel ─────────────────────────────────────────
function getSteveScripts(lead: any) {
  const industry = (lead?.industry || '').toLowerCase()
  const score    = lead?.score || 0
  const attempts = lead?.call_attempts || 0
  const scripts  = []

  // Score reasoning
  if (score >= 90)
    scripts.push({ type: 'insight', text: \`Score \${score} — Critical priority. High-ticket vertical + direct phone detected. Open with revenue impact immediately.\`, icon: Target })
  else if (score >= 80)
    scripts.push({ type: 'insight', text: \`Score \${score} — Hot lead. Strong commercial intent signals. Lead is ready for a direct pitch.\`, icon: Target })
  else
    scripts.push({ type: 'insight', text: \`Score \${score} — Qualified. Verify budget and timeline in first 60 seconds.\`, icon: Target })

  // Industry-specific pitch
  if (industry.match(/roof/))
    scripts.push({ type: 'tip', text: 'Roofing — Pain point is storm season + local competition. Ask: "How are homeowners finding you right now?" Then pivot to SEO dominance.', icon: Star })
  else if (industry.match(/hvac/))
    scripts.push({ type: 'tip', text: 'HVAC — Seasonal urgency is your hook. "Are you booked out or scrambling for jobs?" Either answer opens the pitch.', icon: Star })
  else if (industry.match(/plumb/))
    scripts.push({ type: 'tip', text: 'Plumbing — Emergency services = high intent. Ask if they show up on Google Maps for emergency searches in their city.', icon: Star })
  else if (industry.match(/dental/))
    scripts.push({ type: 'tip', text: 'Dental — Patient acquisition is the pain. "How many new patients are you getting per month vs your goal?" Then pitch.', icon: Star })
  else if (industry.match(/attorney|law/))
    scripts.push({ type: 'tip', text: 'Legal — High LTV clients. Lead with case volume: "Are you turning away cases due to capacity or struggling to fill the pipeline?"', icon: Star })
  else
    scripts.push({ type: 'tip', text: 'Offer a free local SEO audit as the opener. "I ran a quick check on your business — want to see what your competitors are doing that you\'re not?"', icon: Star })

  // Prior attempts
  if (attempts > 0)
    scripts.push({ type: 'alert', text: \`\${attempts} prior contact attempt(s). Reference previous outreach: "I reached out before — wanted to make sure I caught you at a better time."\`, icon: AlertCircle })

  // Universal objection handler
  scripts.push({ type: 'objection', text: 'If they say "send me info" → "Absolutely — and I\'d rather spend 8 minutes walking you through it live so it\'s tailored to your market. Are you free for a quick call this week?"', icon: AlertCircle })

  return scripts
}`;

// Fix 3: Replace the lead queue card rendering
const oldQueue = `            {leadQueue.map((lead, i) => (
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

const newQueue = `            {leadQueue.map((lead, i) => {
              const disp = getDispositionConfig(lead.disposition)
              return (
                <div key={lead.id} onClick={() => { setCallState('idle'); setCurrentLeadIndex(i); if (lead.phone) setDialNumber(lead.phone); }}
                  className={\`p-3 rounded-xl border transition-all cursor-pointer \${
                    i === currentLeadIndex ? 'border-cyan/30 bg-cyan/5' : 'border-border/30 hover:border-cyan/20 hover:bg-space-highlight/30'
                  }\`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">#{String(i + 1).padStart(3, '0')}</span>
                    <Badge className={\`text-[10px] \${disp.color}\`}>{disp.label}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{lead.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{lead.industry || 'General'} · {lead.phone || 'No phone'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-cyan" />
                      <span className="text-xs text-cyan font-semibold">{lead.score}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{lead.call_attempts ? \`\${lead.call_attempts} attempts\` : 'New'}</span>
                  </div>
                </div>
              )
            })}`;

// Fix 4: Upgrade the Steve Whisper panel to include reasoning
const oldWhisper = `                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-cyan" />
                          <span className="text-xs font-semibold text-cyan uppercase tracking-wider">Steve Whisper</span>
                        </div>
                        <div className="space-y-2">
                          {steveScripts.map((w, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-2 text-sm">
                              <w.icon className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{w.text}</span>
                            </motion.div>
                          ))}
                        </div>`;

const newWhisper = `                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan" />
                            <span className="text-xs font-semibold text-cyan uppercase tracking-wider">Steve AI Analysis</span>
                          </div>
                          {currentLead && (
                            <Badge className={\`text-[10px] \${getDispositionConfig(currentLead.disposition).color}\`}>
                              {getDispositionConfig(currentLead.disposition).label}
                            </Badge>
                          )}
                        </div>
                        {currentLead && (
                          <div className="mb-3 p-2.5 rounded-lg bg-cyan/5 border border-cyan/10">
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <span className="text-muted-foreground">Industry</span>
                                <p className="text-foreground font-medium capitalize">{currentLead.industry || 'Unknown'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Est. Value</span>
                                <p className="text-emerald-400 font-medium">{getEstimatedValue(currentLead.industry)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Source</span>
                                <p className="text-foreground font-medium">{currentLead.source || 'Organic'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Steve Score</span>
                                <p className="text-cyan font-bold">{currentLead.score}/100</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          {steveScripts.map((w, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-2 text-sm">
                              <w.icon className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{w.text}</span>
                            </motion.div>
                          ))}
                        </div>`;

const patches = [
  [oldFetch, newFetch, 'fetch with score sort + new fields'],
  [oldSteveScripts, newSteveScripts, 'disposition config + estimated value + Steve reasoning'],
  [oldQueue, newQueue, 'lead queue disposition badges'],
  [oldWhisper, newWhisper, 'Steve AI analysis panel'],
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
  console.log('\n🚀 PowerDial upgraded! Now run:');
  console.log('npm run build');
  console.log('npx vercel --prod');
} else {
  console.error('\n⚠  One or more patches failed. File NOT written.');
}
