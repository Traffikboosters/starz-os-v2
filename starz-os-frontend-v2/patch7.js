const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');

// 1. Add appConfig
if (!c.includes("scraper:     { name:")) {
  c = c.replace(
    "pipeline:    { name:'Data Pipeline', icon:'workflow', w:1100, h:740 },",
    "pipeline:    { name:'Data Pipeline', icon:'workflow', w:1100, h:740 },\n  scraper:     { name:'Scraper Control', icon:'cpu', w:1140, h:780 },"
  );
}

// 2. Add dock button
if (!c.includes("openWindow('scraper')")) {
  c = c.replace(
    '<button onclick="openWindow(\'pipeline\')"',
    '<button onclick="openWindow(\'scraper\')" class="dock-item w-12 h-12 rounded-xl flex items-center justify-center group relative" style="background:linear-gradient(145deg,#34d399 0%,#059669 45%,#064e3b 100%) !important;box-shadow:0 1px 0 rgba(255,255,255,0.32) inset,0 -3px 0 rgba(0,0,0,0.45) inset,0 8px 28px rgba(5,150,105,0.65)"><i data-lucide="cpu" class="w-6 h-6 text-white relative z-10"></i><div class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700">Scraper Control</div></button><button onclick="openWindow(\'pipeline\')"'
  );
}

// 3. Add loader - using function to avoid template literal issues
if (!c.includes("scraper: async (el)")) {
  const loaderStr = [
    "  scraper: async (el) => {",
    "    var eng = 'serpapi_organic', qty = 10, running = false;",
    "    var CITIES = ['Miami FL','Orlando FL','Tampa FL','Jacksonville FL','Fort Lauderdale FL','St Petersburg FL','Tallahassee FL','Cape Coral FL'];",
    "    var PRESETS = [",
    "      {label:'HVAC',queries:['HVAC company','air conditioning repair','furnace repair','AC installation']},",
    "      {label:'Roofing',queries:['roofing contractor','roof repair','roof replacement','storm damage roofing']},",
    "      {label:'Plumbing',queries:['plumber','plumbing company','drain cleaning','water heater repair']},",
    "      {label:'Dental',queries:['dentist','dental office','cosmetic dentist','family dentist']},",
    "      {label:'Legal',queries:['personal injury lawyer','divorce attorney','criminal defense lawyer']},",
    "      {label:'Medical',queries:['urgent care','medical clinic','physical therapy','chiropractor']}",
    "    ];",
    "    var selCities = ['Miami FL','Orlando FL','Tampa FL'];",
    "",
    "    function setLog(msg, color) {",
    "      var el2 = document.getElementById('sc-log');",
    "      if (el2) el2.innerHTML = '<span style=\"color:' + (color||'#94a3b8') + '\">' + msg + '</span>';",
    "    }",
    "",
    "    function updateCap(used, cap) {",
    "      var pct = cap > 0 ? Math.round((used/cap)*100) : 0;",
    "      var bar = document.getElementById('sc-cap-bar');",
    "      var txt = document.getElementById('sc-cap-txt');",
    "      if (bar) { bar.style.width = pct + '%'; bar.style.background = pct>80?'#ef4444':pct>50?'#f59e0b':'#10b981'; }",
    "      if (txt) txt.textContent = used + ' / ' + cap + ' queries today';",
    "    }",
    "",
    "    async function loadCap() {",
    "      try {",
    "        var r = await fetch(SB_URL+'/functions/v1/production-scraper', {method:'POST',headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'cache_stats'})});",
    "        var d = await r.json();",
    "        if (d.usage) updateCap(d.usage.queries||0, d.usage.daily_cap||500);",
    "      } catch(e) {}",
    "    }",
    "",
    "    function buildUI() {",
    "      var cityBtns = CITIES.map(function(city) {",
    "        var active = selCities.indexOf(city) >= 0;",
    "        return '<button onclick=\"window._scCity(this,\\'' + city + '\\')\" data-city=\"' + city + '\" class=\"px-2 py-0.5 rounded text-[10px] border ' + (active ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-black/20 border-white/10 text-slate-500') + '\">' + city.replace(' FL','') + '</button>';",
    "      }).join('');",
    "      var presetBtns = PRESETS.map(function(pr) {",
    "        return '<button onclick=\"window._scPreset(' + JSON.stringify(pr.queries) + ')\" class=\"py-2 px-3 rounded-lg bg-black/30 border border-white/10 hover:border-emerald-500/40 text-xs text-slate-300 transition-all text-left\"><span class=\"font-semibold text-emerald-300\">' + pr.label + '</span><br><span class=\"text-[9px] text-slate-500\">' + pr.queries.length + ' queries</span></button>';",
    "      }).join('');",
    "      var engBtns = [",
    "        {id:'google_maps',label:'Google Maps',sub:'Free (billing req)',color:'blue'},",
    "        {id:'serpapi_maps',label:'SerpApi Maps',sub:'250/mo included',color:'purple'},",
    "        {id:'serpapi_organic',label:'SerpApi Organic',sub:'Best results',color:'emerald'}",
    "      ].map(function(e) {",
    "        var active = eng === e.id;",
    "        return '<button onclick=\"window._scEng(\\'' + e.id + '\\')\" class=\"py-2 px-3 rounded-lg text-xs font-semibold border transition-all ' + (active ? 'bg-' + e.color + '-500/30 border-' + e.color + '-400 text-' + e.color + '-200' : 'bg-black/20 border-white/10 text-slate-400') + '\">' + e.label + '<br><span class=\"text-[9px] opacity-60\">' + e.sub + '</span></button>';",
    "      }).join('');",
    "      el.innerHTML = '<div class=\"space-y-4\">'",
    "        + '<div class=\"flex items-center gap-3\"><div class=\"w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center\"><i data-lucide=\"cpu\" style=\"width:20px;height:20px;color:#34d399\"></i></div><div><h2 class=\"font-space font-bold text-lg\">Scraper Control System</h2><p class=\"text-xs text-slate-400\">Internal SERP Intelligence · Lead Pipeline · SEO Infrastructure · Cost-Controlled</p></div></div>'",
    "        + '<div class=\"stat-card border border-emerald-500/20\"><h3 class=\"text-xs font-semibold text-emerald-300 mb-3\">Engine Selection</h3><div class=\"grid grid-cols-3 gap-2\">' + engBtns + '</div></div>'",
    "        + '<div class=\"grid grid-cols-2 gap-4\">'",
    "        + '<div class=\"stat-card border border-slate-700\"><h3 class=\"text-xs font-semibold text-slate-300 mb-3\">Query Settings</h3>'",
    "        + '<label class=\"text-[10px] text-slate-400 mb-1 block\">Leads per query: <span id=\"sc-qty-lbl\" class=\"text-white font-bold font-mono\">' + qty + '</span></label>'",
    "        + '<input id=\"sc-qty\" type=\"range\" min=\"5\" max=\"50\" value=\"' + qty + '\" oninput=\"qty=parseInt(this.value);var l=document.getElementById(\\' sc-qty-lbl\\');if(l)l.textContent=this.value\" class=\"w-full accent-emerald-500 mb-3\">'",
    "        + '<label class=\"text-[10px] text-slate-400 mb-1 block\">Target Cities</label>'",
    "        + '<div class=\"flex flex-wrap gap-1\" id=\"sc-cities\">' + cityBtns + '</div></div>'",
    "        + '<div class=\"stat-card border border-slate-700\"><h3 class=\"text-xs font-semibold text-slate-300 mb-3\">Industry Presets</h3><div class=\"grid grid-cols-2 gap-2\">' + presetBtns + '</div></div>'",
    "        + '</div>'",
    "        + '<div class=\"stat-card border border-amber-500/20\"><div class=\"flex items-center justify-between mb-2\"><h3 class=\"text-xs font-semibold text-amber-300\">Cost Protection</h3><span class=\"badge badge-green\" id=\"sc-cap-txt\">0 / 500 queries today</span></div><div class=\"h-2 bg-slate-700 rounded-full overflow-hidden\"><div id=\"sc-cap-bar\" class=\"h-full rounded-full transition-all\" style=\"width:0%;background:#10b981\"></div></div></div>'",
    "        + '<div class=\"grid grid-cols-3 gap-3\"><input id=\"sc-kw\" type=\"text\" placeholder=\"Custom keyword\" class=\"bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none\"><input id=\"sc-loc\" type=\"text\" placeholder=\"Location (e.g. Miami FL)\" class=\"bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none\"><button onclick=\"window._scCustom()\" class=\"py-2 px-4 rounded-xl font-bold text-sm text-white\" style=\"background:linear-gradient(135deg,#34d399,#059669)\">Run Custom Query</button></div>'",
    "        + '<div class=\"p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs min-h-10\" id=\"sc-log\"><span class=\"text-slate-500\">Select engine, choose cities, run preset or custom query</span></div>'",
    "        + '</div>';",
    "      lucide.createIcons();",
    "    }",
    "",
    "    window._scEng = function(e) { eng = e; buildUI(); loadCap(); };",
    "    window._scCity = function(btn, city) {",
    "      var idx = selCities.indexOf(city);",
    "      if (idx >= 0) { selCities.splice(idx,1); btn.className = 'px-2 py-0.5 rounded text-[10px] border bg-black/20 border-white/10 text-slate-500'; }",
    "      else { selCities.push(city); btn.className = 'px-2 py-0.5 rounded text-[10px] border bg-emerald-500/20 border-emerald-500/40 text-emerald-300'; }",
    "    };",
    "    window._scPreset = async function(queries) {",
    "      if (running) { setLog('Already running...', '#f59e0b'); return; }",
    "      var cities = selCities.length ? selCities : ['Miami FL'];",
    "      var qtyVal = parseInt(document.getElementById('sc-qty') ? document.getElementById('sc-qty').value : qty);",
    "      var batch = [];",
    "      queries.forEach(function(kw) { cities.forEach(function(city) { batch.push({keyword:kw,location:city,limit:qtyVal}); }); });",
    "      setLog('Running ' + batch.length + ' queries via ' + eng + '...', '#34d399');",
    "      running = true;",
    "      try {",
    "        var r = await fetch(SB_URL+'/functions/v1/production-scraper', {method:'POST',headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'batch',engines:[eng],queries:batch})});",
    "        var d = await r.json();",
    "        setLog('Done: ' + d.processed + ' queries, ' + (d.totalInserted||0) + ' new leads in CRM', '#10b981');",
    "        if (d.totalInserted > 0) { showRealtimeToast(d.totalInserted+' leads extracted','green'); loadSidebar(); }",
    "        loadCap();",
    "      } catch(e) { setLog('Error: '+e.message,'#ef4444'); }",
    "      running = false;",
    "    };",
    "    window._scCustom = async function() {",
    "      var kw = document.getElementById('sc-kw') ? document.getElementById('sc-kw').value.trim() : '';",
    "      var loc = document.getElementById('sc-loc') ? document.getElementById('sc-loc').value.trim() : '';",
    "      var qtyVal = parseInt(document.getElementById('sc-qty') ? document.getElementById('sc-qty').value : qty);",
    "      if (!kw||!loc) { setLog('Enter keyword and location','#f59e0b'); return; }",
    "      setLog('Running: '+kw+' in '+loc+'...','#34d399');",
    "      try {",
    "        var r = await fetch(SB_URL+'/functions/v1/production-scraper', {method:'POST',headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'scrape',keyword:kw,location:loc,limit:qtyVal,engines:[eng]})});",
    "        var d = await r.json();",
    "        setLog(d.error?'Error: '+d.error:'Found '+(d.found||0)+' · '+(d.inserted||0)+' new CRM · '+(d.skipped||0)+' dupes · '+d.source+(d.cached?' [CACHED]':''), d.error?'#ef4444':'#10b981');",
    "        if (d.inserted>0) { showRealtimeToast(d.inserted+' leads via '+d.source,'green'); loadSidebar(); }",
    "        loadCap();",
    "      } catch(e) { setLog('Error: '+e.message,'#ef4444'); }",
    "    };",
    "",
    "    buildUI();",
    "    loadCap();",
    "  },"
  ].join('\n');

  c = c.replace('const loaders = {', 'const loaders = {\n' + loaderStr);
}

fs.writeFileSync(p, c, 'utf8');
console.log('appConfig:', c.includes("scraper:     { name:"));
console.log('dock:', c.includes("openWindow('scraper')"));
console.log('loader:', c.includes('scraper: async (el)'));