const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');

// Replace the entire pipeline loader with fixed version
const oldLoader = c.match(/pipeline: async \(el\) => \{[\s\S]*?window\._ppStatus\(\);\s*\},/)?.[0];
if (!oldLoader) { console.log('ERROR: could not find pipeline loader'); process.exit(1); }

const newLoader = `pipeline: async (el) => {
    const render = (status, jobs) => {
      jobs = jobs || [];
      el.innerHTML = '<div class="space-y-4"><div class="flex items-center gap-3 mb-2"><div class="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center"><i data-lucide="workflow" style="width:20px;height:20px;color:#06b6d4"></i></div><div><h2 class="font-space font-bold text-lg">Data Pipeline</h2><p class="text-xs text-slate-400">Batch Scraping · Hybrid Engine · Cost Protection · CRM Routing</p></div></div>'
        + '<div class="grid grid-cols-4 gap-3"><div class="stat-card text-center border border-amber-500/20"><div class="text-xl font-bold text-amber-400 font-mono" id="pp-pending">—</div><div class="text-[10px] text-slate-400 mt-1">Pending</div></div><div class="stat-card text-center border border-blue-500/20"><div class="text-xl font-bold text-blue-400 font-mono" id="pp-running">—</div><div class="text-[10px] text-slate-400 mt-1">Running</div></div><div class="stat-card text-center border border-green-500/20"><div class="text-xl font-bold text-green-400 font-mono" id="pp-completed">—</div><div class="text-[10px] text-slate-400 mt-1">Completed</div></div><div class="stat-card text-center border border-red-500/20"><div class="text-xl font-bold text-red-400 font-mono" id="pp-failed">—</div><div class="text-[10px] text-slate-400 mt-1">Failed</div></div></div>'
        + '<div class="grid grid-cols-2 gap-4"><div class="stat-card border border-cyan-500/20"><h3 class="text-xs font-semibold text-cyan-300 mb-3">Queue Jobs</h3><div class="space-y-2"><textarea id="pp-jobs" rows="5" placeholder="One job per line: keyword | location | priority" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono resize-none"></textarea><div class="flex gap-2"><button onclick="window._ppQueue()" class="py-1.5 px-4 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-all">Queue Jobs</button><button onclick="window._ppRun()" class="py-1.5 px-4 rounded-lg text-xs font-bold text-white transition-all" style="background:linear-gradient(135deg,#06b6d4,#0891b2)">Run Queue Now</button><button onclick="window._ppStatus()" class="py-1.5 px-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all">Refresh</button></div></div></div><div class="stat-card border border-purple-500/20"><h3 class="text-xs font-semibold text-purple-300 mb-3">Quick Extract</h3><div class="space-y-2"><input id="pp-kw" type="text" placeholder="Keyword (e.g. HVAC company)" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"><input id="pp-loc" type="text" placeholder="Location (e.g. Miami FL)" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"><div class="flex gap-2"><select id="pp-lim" class="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"><option value="10">10 leads</option><option value="20" selected>20 leads</option><option value="40">40 leads</option></select><button onclick="window._ppSingle()" class="py-1.5 px-4 rounded-lg text-xs font-bold text-white transition-all" style="background:linear-gradient(135deg,#a78bfa,#7c3aed)">Extract Now</button></div></div></div></div>'
        + '<div class="stat-card"><div class="flex items-center justify-between mb-2"><h3 class="text-xs font-semibold text-slate-300">Cost Protection</h3><span class="badge badge-green">Hard Cap: 500/day</span></div><div class="flex items-center gap-3"><div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full" id="pp-cap-bar" style="width:0%"></div></div><span class="text-xs font-mono text-slate-300" id="pp-cap-text">0 / 500 queries today</span></div></div>'
        + '<div class="p-3 rounded-lg bg-black/30 font-mono text-xs text-slate-300" id="pp-log">' + (status || 'Ready — enter keyword + location and click Extract Now') + '</div>'
        + (jobs.length ? '<div class="stat-card"><h3 class="text-xs font-semibold text-slate-300 mb-3">Recent Jobs (' + jobs.length + ')</h3><table class="data-table"><thead><tr><th>Keyword</th><th>Location</th><th>Status</th><th>Priority</th><th>Created</th></tr></thead><tbody>' + jobs.slice(0,15).map(function(j) { return '<tr><td class="font-medium">' + (j.keyword||'—') + '</td><td class="text-slate-400">' + (j.location||'—') + '</td><td>' + (j.status==='completed'?'<span class="badge badge-green">done</span>':j.status==='running'?'<span class="badge badge-blue">running</span>':j.status==='failed'?'<span class="badge badge-red">failed</span>':'<span class="badge badge-amber">pending</span>') + '</td><td class="text-center font-mono text-amber-400">' + (j.priority||5) + '</td><td class="text-slate-400">' + ago(j.created_at) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '')
        + '</div>';
      lucide.createIcons();
    };

    const updateStats = (d) => {
      var pe = document.getElementById('pp-pending');
      var ru = document.getElementById('pp-running');
      var co = document.getElementById('pp-completed');
      var fa = document.getElementById('pp-failed');
      if (pe) pe.textContent = d.pending || 0;
      if (ru) ru.textContent = d.running || 0;
      if (co) co.textContent = d.completed || 0;
      if (fa) fa.textContent = d.failed || 0;
      if (d.cap) {
        var bar = document.getElementById('pp-cap-bar');
        var txt = document.getElementById('pp-cap-text');
        var pct = Math.round((d.cap.used / d.cap.cap) * 100);
        if (bar) bar.style.width = pct + '%';
        if (txt) txt.textContent = d.cap.used + ' / ' + d.cap.cap + ' queries today';
      }
    };

    const setLog = (msg) => { var el2 = document.getElementById('pp-log'); if (el2) el2.textContent = msg; };

    window._ppStatus = async function() {
      try {
        var res = await fetch(SB_URL+'/functions/v1/data-pipeline', { method:'POST', headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'}, body:JSON.stringify({action:'queue_status'}) });
        var d = await res.json();
        updateStats(d);
        var jobs = await sb('scraping','jobs','select=*&order=created_at.desc&limit=20');
        render(null, Array.isArray(jobs) ? jobs : []);
        updateStats(d);
      } catch(e) { setLog('Status error: '+e.message); }
    };

    window._ppQueue = async function() {
      var raw = document.getElementById('pp-jobs') ? document.getElementById('pp-jobs').value.trim() : '';
      if (!raw) { setLog('Enter jobs first'); return; }
      var lines = raw.split('\\n').filter(function(l){return l.trim();});
      var jobs = lines.map(function(l) { var parts = l.split('|').map(function(p){return p.trim();}); return {keyword:parts[0],location:parts[1]||'Miami FL',priority:parseInt(parts[2])||5,limit:20}; });
      setLog('Queuing ' + jobs.length + ' jobs...');
      try {
        var res = await fetch(SB_URL+'/functions/v1/data-pipeline', { method:'POST', headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'}, body:JSON.stringify({action:'queue_jobs',jobs:jobs}) });
        var d = await res.json();
        setLog('Queued ' + d.queued + ' jobs. Click Run Queue Now to execute.');
        showRealtimeToast(d.queued + ' jobs queued', 'cyan');
        window._ppStatus();
      } catch(e) { setLog('Error: '+e.message); }
    };

    window._ppRun = async function() {
      setLog('Running queue batch...');
      try {
        var res = await fetch(SB_URL+'/functions/v1/data-pipeline', { method:'POST', headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'}, body:JSON.stringify({action:'run_queue',batch_size:5}) });
        var d = await res.json();
        setLog('Processed ' + d.processed + ' jobs. ' + (d.totalInserted||0) + ' leads inserted into CRM.');
        if (d.totalInserted > 0) { showRealtimeToast(d.totalInserted + ' leads synced to CRM', 'green'); loadSidebar(); }
        window._ppStatus();
      } catch(e) { setLog('Error: '+e.message); }
    };

    window._ppSingle = async function() {
      var kw = document.getElementById('pp-kw') ? document.getElementById('pp-kw').value.trim() : '';
      var loc = document.getElementById('pp-loc') ? document.getElementById('pp-loc').value.trim() : '';
      var lim = document.getElementById('pp-lim') ? document.getElementById('pp-lim').value : 20;
      if (!kw || !loc) { setLog('Enter keyword and location first'); return; }
      setLog('Extracting: ' + kw + ' in ' + loc + '...');
      try {
        var res = await fetch(SB_URL+'/functions/v1/production-scraper', { method:'POST', headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'}, body:JSON.stringify({action:'scrape',keyword:kw,location:loc,limit:Number(lim),engines:['google_maps','serpapi_maps','serpapi_organic']}) });
        var d = await res.json();
        if (d.error) { setLog('Error: '+d.error); return; }
        var msg = 'Found ' + (d.found||0) + ' businesses. ' + (d.inserted||0) + ' new leads in CRM. ' + (d.skipped||0) + ' duplicates. Source: ' + (d.source||'—') + (d.cached?' [CACHED]':'');
        setLog(msg);
        if (d.inserted > 0) { showRealtimeToast(d.inserted + ' leads extracted via ' + d.source, 'green'); loadSidebar(); }
        window._ppStatus();
      } catch(e) { setLog('Error: '+e.message); }
    };

    render();
    window._ppStatus();
  },`;

c = c.replace(oldLoader, newLoader);
fs.writeFileSync(p, c, 'utf8');
console.log('Fixed pipeline loader:', c.includes('updateStats'));