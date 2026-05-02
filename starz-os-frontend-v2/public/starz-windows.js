(function(){
window._registerLoader('ads', async function(el) {
  var camps = [];
  var DOLLAR = '\u0024';

  async function load() {
    try {
      var r = await sb('marketing','ads_campaigns','select=*&order=created_at.desc');
      camps = Array.isArray(r) ? r : [];
      draw();
    } catch(e) {
      el.innerHTML = '<div class="p-8 text-red-400">Error: ' + e.message + '</div>';
    }
  }

  function bdg(s) {
    if (s==='active') return '<span class="badge badge-green">Active</span>';
    if (s==='paused') return '<span class="badge badge-amber">Paused</span>';
    return '<span class="badge badge-gray">Draft</span>';
  }

  function bbar(spent, total) {
    var pct = total > 0 ? Math.min(100, Math.round(spent/total*100)) : 0;
    var col = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981';
    return '<div class="flex items-center gap-2"><div class="flex-1 h-1.5 bg-slate-700 rounded-full"><div class="h-full rounded-full" style="width:' + pct + '%;background:' + col + '"></div></div><span class="text-[10px] font-mono text-slate-400">' + pct + '%</span></div>';
  }

  function draw() {
    var tot = camps.reduce(function(s,x){ return s + (x.monthly_budget||0); }, 0);
    var act = camps.filter(function(x){ return x.status === 'active'; }).length;
    var rows = camps.map(function(camp) {
      var kws = Array.isArray(camp.keywords) ? camp.keywords : JSON.parse(camp.keywords || '[]');
      var locs = Array.isArray(camp.target_locations) ? camp.target_locations : JSON.parse(camp.target_locations || '[]');
      return '<div class="stat-card border border-white/5 hover:border-orange-500/20 transition-all mb-3">'
        + '<div class="flex items-start justify-between mb-3">'
        + '<div><div class="font-semibold text-white">' + camp.campaign_name + '</div>'
        + '<div class="text-[10px] text-slate-400">' + camp.service_type + ' - ' + camp.match_type + ' match - Rico BGE</div></div>'
        + '<div class="flex gap-2">' + bdg(camp.status)
        + '<button data-id="' + camp.id + '" data-status="' + camp.status + '" onclick="window._adsToggle(this)" class="px-2 py-1 rounded text-[10px] font-semibold ' + (camp.status==='active' ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300') + '">' + (camp.status==='active' ? 'Pause' : 'Activate') + '</button>'
        + '<button data-id="' + camp.id + '" onclick="window._adsDel(this)" class="px-2 py-1 rounded bg-red-500/20 text-red-300 text-[10px]">Del</button></div></div>'
        + '<div class="grid grid-cols-3 gap-4 mb-3">'
        + '<div><div class="text-[10px] text-slate-400 mb-1">Daily Budget</div><div class="font-mono font-bold text-white">' + DOLLAR + (camp.daily_budget||0) + '/day</div>' + bbar(camp.spent_today||0, camp.daily_budget||1) + '</div>'
        + '<div><div class="text-[10px] text-slate-400 mb-1">Monthly</div><div class="font-mono font-bold text-white">' + DOLLAR + (camp.monthly_budget||0) + '/mo</div>' + bbar(camp.spent_month||0, camp.monthly_budget||1) + '</div>'
        + '<div><div class="text-[10px] text-slate-400 mb-1">Performance</div><div class="text-xs"><span class="text-blue-400">' + (camp.impressions||0) + ' imp</span> - <span class="text-green-400">' + (camp.clicks||0) + ' clicks</span></div><div class="text-[10px] text-slate-500">CTR:' + (camp.ctr||0) + '% CPC:' + DOLLAR + (camp.cpc||0) + '</div></div>'
        + '</div>'
        + '<div class="flex flex-wrap gap-1 mb-1">' + kws.map(function(k){ return '<span class="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-300">' + k + '</span>'; }).join('') + '</div>'
        + '<div class="flex flex-wrap gap-1">' + locs.map(function(l){ return '<span class="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-300">' + l + '</span>'; }).join('') + '</div>'
        + (camp.rico_notes ? '<div class="mt-2 p-2 rounded bg-black/20 text-[10px] text-slate-400"><span class="text-amber-400">Rico:</span> ' + camp.rico_notes + '</div>' : '')
        + '</div>';
    }).join('');

    el.innerHTML = '<div class="space-y-4">'
      + '<div class="flex items-center justify-between">'
      + '<div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center"><i data-lucide="megaphone" style="width:20px;height:20px;color:#fb923c"></i></div>'
      + '<div><h2 class="font-space font-bold text-lg">Google Ads Engine</h2><p class="text-xs text-slate-400">Rico Control - Budget Guard - Performance - SEO Integration</p></div></div>'
      + '<button onclick="window._adsForm()" class="py-2 px-4 rounded-xl text-xs font-bold text-white" style="background:linear-gradient(135deg,#fb923c,#ea580c)">+ New Campaign</button></div>'
      + '<div class="grid grid-cols-4 gap-3">'
      + '<div class="stat-card text-center"><div class="text-2xl font-bold text-orange-400 font-mono">' + camps.length + '</div><div class="text-[10px] text-slate-400 mt-1">Campaigns</div></div>'
      + '<div class="stat-card text-center"><div class="text-2xl font-bold text-green-400 font-mono">' + act + '</div><div class="text-[10px] text-slate-400 mt-1">Active</div></div>'
      + '<div class="stat-card text-center"><div class="text-2xl font-bold text-blue-400 font-mono">' + DOLLAR + tot.toLocaleString() + '</div><div class="text-[10px] text-slate-400 mt-1">Monthly Budget</div></div>'
      + '<div class="stat-card text-center"><div class="text-2xl font-bold text-purple-400 font-mono">0</div><div class="text-[10px] text-slate-400 mt-1">Conversions</div></div></div>'
      + (rows || '<div class="text-center text-slate-500 py-12">No campaigns - click New Campaign</div>')
      + '</div>';
    lucide.createIcons();
  }

  window._adsToggle = async function(btn) {
    var id = btn.dataset.id, st = btn.dataset.status, ns = st === 'active' ? 'paused' : 'active';
    await fetch(SB_URL + '/rest/v1/ads_campaigns?id=eq.' + id, {
      method: 'PATCH',
      headers: {'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Accept-Profile':'marketing','Content-Profile':'marketing','Content-Type':'application/json','Prefer':'return=minimal'},
      body: JSON.stringify({status: ns, updated_at: new Date().toISOString()})
    });
    showRealtimeToast('Campaign ' + ns, ns === 'active' ? 'green' : 'amber');
    load();
  };

  window._adsDel = async function(btn) {
    if (!confirm('Delete this campaign?')) return;
    await fetch(SB_URL + '/rest/v1/ads_campaigns?id=eq.' + btn.dataset.id, {
      method: 'DELETE',
      headers: {'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Accept-Profile':'marketing','Content-Profile':'marketing'}
    });
    load();
  };

  window._adsForm = function() {
    el.innerHTML = '<div class="space-y-4">'
      + '<div class="flex items-center gap-3"><button onclick="window._adsBack()" class="p-2 rounded-lg bg-slate-700/50"><i data-lucide="arrow-left" style="width:16px;height:16px;color:#94a3b8"></i></button><h2 class="font-space font-bold text-lg">New Campaign</h2></div>'
      + '<div class="grid grid-cols-2 gap-4">'
      + '<div class="stat-card space-y-3"><h3 class="text-xs font-semibold text-orange-300 mb-2">Campaign Details</h3>'
      + '<div><label class="text-[10px] text-slate-400 mb-1 block">Campaign Name</label><input id="an" type="text" placeholder="e.g. HVAC Miami" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"></div>'
      + '<div><label class="text-[10px] text-slate-400 mb-1 block">Service Type</label><select id="asv" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"><option>SEO + Ads</option><option>Paid Ads Only</option><option>Lead Gen</option></select></div>'
      + '<div><label class="text-[10px] text-slate-400 mb-1 block">Match Type</label><select id="amt" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"><option value="broad">Broad</option><option value="phrase">Phrase</option><option value="exact">Exact</option></select></div>'
      + '<div><label class="text-[10px] text-slate-400 mb-1 block">Rico Notes</label><textarea id="ano" rows="3" placeholder="Optimization notes..." class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none resize-none"></textarea></div></div>'
      + '<div class="stat-card space-y-3"><h3 class="text-xs font-semibold text-orange-300 mb-2">Budget + Targeting</h3>'
      + '<div><label class="text-[10px] text-slate-400 mb-1 block">Daily Budget</label><input id="adb" type="number" value="50" min="10" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"></div>'
      + '<div><label class="text-[10px] text-slate-400 mb-1 block">Monthly Cap</label><input id="amb" type="number" value="1500" min="300" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"></div>'
      + '<div><label class="text-[10px] text-slate-400 mb-1 block">Keywords (one per line)</label><textarea id="akw" rows="4" placeholder="HVAC company" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono resize-none"></textarea></div>'
      + '<div><label class="text-[10px] text-slate-400 mb-1 block">Locations (one per line)</label><textarea id="alc" rows="3" placeholder="Miami FL" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono resize-none"></textarea></div></div>'
      + '</div><div class="flex gap-3"><button onclick="window._adsSave()" class="py-2 px-6 rounded-xl font-bold text-sm text-white" style="background:linear-gradient(135deg,#fb923c,#ea580c)">Save Campaign</button><button onclick="window._adsBack()" class="py-2 px-4 rounded-xl text-sm bg-slate-700/50 text-slate-300">Cancel</button></div>'
      + '</div>';
    lucide.createIcons();
  };

  window._adsBack = function() { load(); };

  window._adsSave = async function() {
    var name = document.getElementById('an') ? document.getElementById('an').value.trim() : '';
    if (!name) { alert('Enter campaign name'); return; }
    var kws = document.getElementById('akw') ? document.getElementById('akw').value.trim().split('\n').map(function(k){return k.trim();}).filter(Boolean) : [];
    var locs = document.getElementById('alc') ? document.getElementById('alc').value.trim().split('\n').map(function(l){return l.trim();}).filter(Boolean) : [];
    var payload = {
      campaign_name: name,
      service_type: document.getElementById('asv') ? document.getElementById('asv').value : 'SEO + Ads',
      match_type: document.getElementById('amt') ? document.getElementById('amt').value : 'broad',
      rico_notes: document.getElementById('ano') ? document.getElementById('ano').value : '',
      daily_budget: parseFloat(document.getElementById('adb') ? document.getElementById('adb').value : 50),
      monthly_budget: parseFloat(document.getElementById('amb') ? document.getElementById('amb').value : 1500),
      keywords: kws,
      target_locations: locs,
      assigned_to: 'Rico BGE',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await fetch(SB_URL + '/rest/v1/ads_campaigns', {
      method: 'POST',
      headers: {'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Accept-Profile':'marketing','Content-Profile':'marketing','Content-Type':'application/json','Prefer':'return=minimal'},
      body: JSON.stringify(payload)
    });
    showRealtimeToast('Campaign created', 'green');
    load();
  };

  load();
});
})();
