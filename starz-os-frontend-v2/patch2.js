const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');

// Add to appConfigs
c = c.replace(
  "extractor:   { name:'Lead Extractor', icon:'map-pin', w:1080, h:720 },",
  "extractor:   { name:'Lead Extractor', icon:'map-pin', w:1080, h:720 },\n  pipeline:    { name:'Data Pipeline', icon:'workflow', w:1100, h:740 },"
);

// Add pipeline loader
const loader = `  pipeline: async (el) => {
    const render = (status, jobs, stats) => {
      jobs = jobs || []; stats = stats || {};
      el.innerHTML = '<div class="space-y-4"><div class="flex items-center gap-3 mb-2"><div class="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center"><i data-lucide="workflow" style="width:20px;height:20px;color:#06b6d4"></i></div><div><h2 class="font-space font-bold text-lg">Data Pipeline</h2><p class="text-xs text-slate-400">Batch Scraping · Hybrid Engine · Cost Protection · CRM Routing</p></div></div>'
        + '<div class="grid grid-cols-4 gap-3"><div class="stat-card text-center border border-amber-500/20"><div class="text-xl font-bold text-amber-400 font-mono" id="pp-pending">—</div><div class="text-[10px] text-slate-400 mt-1">Pending</div></div><div class="stat-card text-center border border-blue-500/20"><div class="text-xl font-bold text-blue-400 font-mono" id="pp-running">—</div><div class="text-[10px] text-slate-400 mt-1">Running</div></div><div class="stat-card text-center border border-green-500/20"><div class="text-xl font-bold text-green-400 font-mono" id="pp-completed">—</div><div class="text-[10px] text-slate-400 mt-1">Completed</div></div><div class="stat-card text-center border border-red-500/20"><div class="text-xl font-bold text-red-400 font-mono" id="pp-failed">—</div><div class="text-[10px] text-slate-400 mt-1">Failed</div></div></div>'
        + '<div class="grid grid-cols-2 gap-4"><div class="stat-card border border-cyan-500/20"><h3 class="text-xs font-semibold text-cyan-300 mb-3">Queue Jobs</h3><div class="space-y-2"><textarea id="pp-jobs" rows="5" placeholder="One job per line: keyword | location | priority&#10;e.g.&#10;HVAC company | Miami FL | 9&#10;Dentist | Tampa FL | 8&#10;Roofing | Orlando FL | 7" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono resize-none"></textarea><div class="flex gap-2"><button onclick="window._ppQueue()" class="py-1.5 px-4 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-all">Queue Jobs</button><button onclick="window._ppRun()" class="py-1.5 px-4 rounded-lg text-xs font-bold text-white transition-all" style="background:linear-gradient(135deg,#06b6d4,#0891b2)">Run Queue Now</button><button onclick="window._ppStatus()" class="py-1.5 px-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all">Refresh Status</button></div></div></div><div class="stat-card border border-purple-500/20"><h3 class="text-xs font-semibold text-purple-300 mb-3">Quick Extract</h3><div class="space-y-2"><input id="pp-kw" type="text" placeholder="Keyword (e.g. HVAC company)" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"><input id="pp-loc" type="text" placeholder="Location (e.g. Miami FL)" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"><div class="flex gap-2"><select id="pp-lim" class="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"><option value="10">10 leads</option><option value="20" selected>20 leads</option><option value="40">40 leads</option></select><button onclick="window._ppSingle()" class="py-1.5 px-4 rounded-lg text-xs font-bold text-white transition-all" style="background:linear-gradient(135deg,#a78bfa,#7c3aed)">Extract Now</button></div></div></div></div>'
        + '<div class="stat-card"><div class="flex items-center justify-between mb-2"><h3 class="text-xs font-semibold text-slate-300">Cost Protection</h3><span class="badge badge-green">Hard Cap: 500/day</span></div><div class="flex items-center gap-3"><div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full" id="pp-cap-bar" style="width:0%"></div></div><span class="text-xs font-mono text-slate-300" id="pp-cap-text">Loading...</span></div></div>'
        + (status ? '<div class="p-3 rounded-lg bg-black/30 font-mono text-xs text-slate-300" id="pp-log">' + status + '</div>' : '<div class="p-3 rounded-lg bg-black/30 font-mono text-xs text-slate-600" id="pp-log">Ready — queue jobs or run quick extract</div>')
        + (jobs.length ? '<div class="stat-card"><h3 class="text-xs font-semibold text-slate-300 mb-3">Recent Jobs (' + jobs.length + ')</h3><table class="data-table"><thead><tr><th>Keyword</th><th>Location</th><th>Status</th><th>Priority</th><th>Attempts</th><th>Created</th></tr></thead><tbody>' + jobs.slice(0,15).map(function(j) { return '<tr><td class="font-medium">' + (j.keyword||'—') + '</td><td class="text-slate-400">' + (j.location||'—') + '</td><td>' + (j.status==='completed'?'<span class="badge badge-green">done</span>':j.status==='running'?'<span class="badge badge-blue">running</span>':j.status==='failed'?'<span class="badge badge-red">failed</span>':'<span class="badge badge-amber">pending</span>') + '</td><td class="text-center font-mono text-amber-400">' + (j.priority||5) + '</td><td class="text-center">' + (j.attempts||0) + '</td><td class="text-slate-400">' + ago(j.created_at) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '')
        + '</div>';
      lucide.createIcons();
    };

    window._ppStatus = async function() {
      render('Loading status...');
      try {
        const res = await fetch(SB_URL+'/functions/v1/data-pipeline', { method:'POST', headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'}, body:JSON.stringify({action:'queue_status'}) });
        const d = await res.json();
        const jobs = await sb('scraping','jobs','select=*&order=created_at.desc&limit=20');
        document.getElementById('pp-pending') && (document.getElementById('pp-pending').textContent = d.pending||0);
        document.getElementById('pp-running') && (document.getElementById('pp-running').textContent = d.running||0);
        document.getElementById('pp-completed') && (document.getElementById('pp-completed').textContent = d.completed||0);
        document.getElementById('pp-failed') && (document.getElementById('pp-failed').textContent = d.failed||0);
        const capPct = d.cap ? Math.round((d.cap.used/d.cap.cap)*100) : 0;
        document.getElementById('pp-cap-bar') && (document.getElementById('pp-cap-bar').style.width = capPct+'%');
        document.getElementById('pp-cap-text') && (document.getElementById('pp-cap-text').textContent = (d.cap?d.cap.used:0)+' / '+(d.cap?d.cap.cap:500)+' queries today');
        render('Status loaded', jobs);
      } catch(e) { render('Error: '+e.message); }
    };

    window._ppQueue = async function() {
      const raw = document.getElementById('pp-jobs').value.trim();
      if (!raw) { render('Enter jobs first'); return; }
      const lines = raw.split('\\n').filter(l=>l.trim());
      const jobs = lines.map(function(l) { const parts = l.split('|').map(function(p){return p.trim();}); return {keyword:parts[0],location:parts[1]||'Miami FL',priority:parseInt(parts[2])||5,limit:20}; });
      render('Queuing ' + jobs.length + ' jobs...');
      try {
        const res = await fetch(SB_URL+'/functions/v1/data-pipeline', { method:'POST', headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'}, body:JSON.stringify({action:'queue_jobs',jobs}) });
        const d = await res.json();
        render('Queued ' + d.queued + ' jobs successfully. Click Run Queue Now to execute.');
        showRealtimeToast(d.queued + ' jobs queued in pipeline', 'cyan');
        window._ppStatus();
      } catch(e) { render('Error: '+e.message); }
    };

    window._ppRun = async function() {
      render('Running queue batch (up to 5 jobs)...');
      try {
        const res = await fetch(SB_URL+'/functions/v1/data-pipeline', { method:'POST', headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'}, body:JSON.stringify({action:'run_queue',batch_size:5}) });
        const d = await res.json();
        render('Processed ' + d.processed + ' jobs. ' + (d.totalInserted||0) + ' leads inserted into CRM.');
        showRealtimeToast((d.totalInserted||0) + ' leads synced to CRM via pipeline', 'green');
        loadSidebar();
        window._ppStatus();
      } catch(e) { render('Error: '+e.message); }
    };

    window._ppSingle = async function() {
      const kw = document.getElementById('pp-kw').value.trim();
      const loc = document.getElementById('pp-loc').value.trim();
      const lim = document.getElementById('pp-lim').value || 20;
      if (!kw || !loc) { render('Enter keyword and location'); return; }
      render('Running single extraction: ' + kw + ' in ' + loc + '...');
      try {
        const res = await fetch(SB_URL+'/functions/v1/data-pipeline', { method:'POST', headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'}, body:JSON.stringify({action:'run_single',keyword:kw,location:loc,limit:Number(lim)}) });
        const d = await res.json();
        const r = d.results && d.results[0];
        render(r ? 'Found ' + (r.found||0) + ' businesses. ' + (r.inserted||0) + ' new leads in CRM. ' + (r.skipped||0) + ' duplicates. Source: ' + (r.source||'—') : JSON.stringify(d));
        if (r && r.inserted > 0) { showRealtimeToast(r.inserted + ' leads extracted via ' + r.source, 'green'); loadSidebar(); }
        window._ppStatus();
      } catch(e) { render('Error: '+e.message); }
    };

    window._ppStatus();
  },`;

c = c.replace('const loaders = {', 'const loaders = {\n' + loader);
fs.writeFileSync(p, c, 'utf8');
console.log('pipeline appConfig:', c.includes("pipeline:    { name:"));
console.log('pipeline loader:', c.includes('pipeline: async'));