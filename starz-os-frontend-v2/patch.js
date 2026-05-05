const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');

// Add to appConfigs
c = c.replace(
  "serp:        { name:'SERP Engine Control', icon:'search-code', w:960, h:700 },",
  "serp:        { name:'SERP Engine Control', icon:'search-code', w:960, h:700 },\n  extractor:   { name:'Lead Extractor', icon:'map-pin', w:1080, h:720 },"
);

// Add dock button
c = c.replace(
  "<button onclick=\"openWindow('traffik')\"",
  "<button onclick=\"openWindow('extractor')\" class=\"dock-item w-12 h-12 rounded-xl flex items-center justify-center group relative\" style=\"background:linear-gradient(145deg,#f472b6 0%,#db2777 45%,#831843 100%) !important;box-shadow:0 1px 0 rgba(255,255,255,0.32) inset,0 -3px 0 rgba(0,0,0,0.45) inset,0 8px 28px rgba(219,39,119,0.65)\"><i data-lucide=\"map-pin\" class=\"w-6 h-6 text-white relative z-10\"></i><div class=\"absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700\">Lead Extractor</div></button><button onclick=\"openWindow('traffik')\""
);

// Add loader
const loader = `  extractor: async (el) => {
    let results = [];
    const render = (status, leads) => {
      leads = leads || [];
      el.innerHTML = '<div class="space-y-4"><div class="flex items-center gap-3 mb-2"><div class="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center"><i data-lucide="map-pin" style="width:20px;height:20px;color:#f472b6"></i></div><div><h2 class="font-space font-bold text-lg">Lead Extractor</h2><p class="text-xs text-slate-400">Google Maps to AI Score to CRM Auto-Sync</p></div></div><div class="grid grid-cols-3 gap-3"><div><label class="text-[10px] text-slate-400 mb-1 block">Keyword / Business Type</label><input id="ex-kw" type="text" placeholder="e.g. HVAC company, dentist" value="HVAC company" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"></div><div><label class="text-[10px] text-slate-400 mb-1 block">City / Location</label><input id="ex-loc" type="text" placeholder="e.g. Miami FL" value="Miami FL" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"></div><div><label class="text-[10px] text-slate-400 mb-1 block">Max Results</label><select id="ex-lim" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"><option value="10">10 leads</option><option value="20" selected>20 leads</option><option value="40">40 leads</option></select></div></div><div class="flex gap-3 items-center"><button onclick="window._exRun()" class="py-2 px-6 rounded-xl font-bold text-sm text-white" style="background:linear-gradient(135deg,#f472b6,#db2777)">Extract and Sync to CRM</button>' + (status ? '<div class="text-xs text-slate-300">' + status + '</div>' : '') + '</div>' + (leads.length ? '<div class="stat-card"><div class="flex items-center justify-between mb-3"><h3 class="text-sm font-semibold text-white">Extracted ' + leads.length + ' leads</h3><span class="badge badge-green">Synced to CRM</span></div><table class="data-table"><thead><tr><th>Business</th><th>Phone</th><th>Website</th><th>Rating</th><th>Reviews</th><th>Score</th><th>Priority</th></tr></thead><tbody>' + leads.map(function(l) { return '<tr><td class="font-semibold">' + (l.business_name||'—') + '</td><td class="font-mono text-xs">' + (l.phone||'—') + '</td><td class="text-xs">' + (l.website_url ? '<a href="'+l.website_url+'" target="_blank" class="text-blue-400">Visit</a>' : '<span class="text-red-400">No site</span>') + '</td><td class="text-center">' + (l.google_rating ? '★ '+l.google_rating : '—') + '</td><td class="text-center font-mono">' + (l.google_reviews||0) + '</td><td><span class="font-mono font-bold ' + ((l.ai_score||0)>=75?'text-green-400':(l.ai_score||0)>=50?'text-amber-400':'text-red-400') + '">' + (l.ai_score||0) + '</span></td><td>' + (l.priority_level==='high'?'<span class="badge badge-red">High</span>':l.priority_level==='medium'?'<span class="badge badge-amber">Med</span>':'<span class="badge badge-gray">Low</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '') + '</div>';
      lucide.createIcons();
    };
    window._exRun = async function() {
      var kw = document.getElementById('ex-kw').value.trim();
      var loc = document.getElementById('ex-loc').value.trim();
      var lim = document.getElementById('ex-lim').value || 20;
      if (!kw || !loc) { render('Enter keyword and location'); return; }
      render('Scraping Google Maps and syncing to CRM...');
      try {
        var res = await fetch(SB_URL+'/functions/v1/lead-extractor', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer '+SB_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: kw, location: loc, limit: Number(lim) })
        });
        var data = await res.json();
        if (data.error) { render('Error: '+data.error); return; }
        results = data.leads || [];
        render('Found '+data.found+' businesses. '+data.inserted+' new synced to CRM. '+data.skipped+' already exist.', results);
        showRealtimeToast(data.inserted+' leads extracted and synced to CRM', 'green');
        loadSidebar();
      } catch(e) { render('Error: '+e.message); }
    };
    render();
  },`;

c = c.replace('const loaders = {', 'const loaders = {\n' + loader);
fs.writeFileSync(p, c, 'utf8');
console.log('appConfigs:', c.includes("extractor:   { name:"));
console.log('dock:', c.includes("openWindow('extractor')"));
console.log('loader:', c.includes('extractor: async'));