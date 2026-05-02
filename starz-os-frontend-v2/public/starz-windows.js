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
// RICO FULFILLMENT CENTER
window._registerLoader('fulfillment', async function(el) {
  var activeTab = 'overview';

  function tab(id, label, color) {
    return '<button onclick="window._fcTab(\'' + id + '\')" id="fct-' + id + '" class="px-4 py-2 rounded-lg text-xs font-semibold transition-all ' + (activeTab === id ? 'bg-' + color + '-500/30 border border-' + color + '-500/40 text-' + color + '-200' : 'bg-black/20 border border-white/5 text-slate-400 hover:text-white') + '">' + label + '</button>';
  }

  function tabs() {
    return '<div class="flex gap-2 mb-4">' + tab('overview','Overview','blue') + tab('ads','Paid Ads','orange') + tab('seo','SEO','green') + tab('authority','Authority','purple') + tab('rico','Rico Queue','amber') + '</div>';
  }

  async function loadOverview() {
    try {
      var [wos, delivs, tasks] = await Promise.all([
        sb('deals','work_orders','select=*&order=created_at.desc&limit=20'),
        sb('deals','deliverables','select=*&order=created_at.desc&limit=20'),
        sb('deals','tasks','select=*&order=created_at.desc&limit=20')
      ]);
      wos = Array.isArray(wos) ? wos : [];
      delivs = Array.isArray(delivs) ? delivs : [];
      tasks = Array.isArray(tasks) ? tasks : [];
      var active = wos.filter(function(w){return w.fulfillment_status==='active'||w.status==='active';}).length;
      var pending = wos.filter(function(w){return w.status==='pending'||w.fulfillment_status==='pending';}).length;
      var done = delivs.filter(function(d){return d.status==='completed';}).length;
      return '<div class="grid grid-cols-4 gap-3 mb-4">'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-blue-400">' + wos.length + '</div><div class="text-[10px] text-slate-400 mt-1">Work Orders</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-green-400">' + active + '</div><div class="text-[10px] text-slate-400 mt-1">Active</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-amber-400">' + pending + '</div><div class="text-[10px] text-slate-400 mt-1">Pending</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-purple-400">' + done + '</div><div class="text-[10px] text-slate-400 mt-1">Delivered</div></div></div>'
        + '<table class="data-table"><thead><tr><th>Client</th><th>Package</th><th>Status</th><th>Fulfillment</th><th>Payment</th><th>Created</th></tr></thead><tbody>'
        + wos.map(function(w){ return '<tr>'
          + '<td class="font-semibold">' + (w.business_name||w.client_name||'—') + '</td>'
          + '<td class="text-slate-400 text-[10px]">' + (w.package||w.service_type||'—') + '</td>'
          + '<td>' + (w.status==='active'?'<span class="badge badge-green">Active</span>':w.status==='pending'?'<span class="badge badge-amber">Pending</span>':'<span class="badge badge-gray">'+(w.status||'Draft')+'</span>') + '</td>'
          + '<td>' + (w.fulfillment_status==='completed'?'<span class="badge badge-green">Done</span>':w.fulfillment_status==='in_progress'?'<span class="badge badge-blue">In Progress</span>':'<span class="badge badge-gray">'+(w.fulfillment_status||'Queued')+'</span>') + '</td>'
          + '<td>' + (w.payment_status==='paid'?'<span class="badge badge-green">Paid</span>':'<span class="badge badge-amber">'+(w.payment_status||'Pending')+'</span>') + '</td>'
          + '<td class="text-slate-400">' + ago(w.created_at) + '</td>'
          + '</tr>'; }).join('') + '</tbody></table>';
    } catch(e) { return '<div class="text-red-400 p-4">Error: ' + e.message + '</div>'; }
  }

  async function loadAds() {
    try {
      var camps = await sb('marketing','ads_campaigns','select=*&order=created_at.desc');
      camps = Array.isArray(camps) ? camps : [];
      var D = String.fromCharCode(36);
      var tot = camps.reduce(function(s,x){return s+(x.monthly_budget||0);},0);
      var act = camps.filter(function(x){return x.status==='active';}).length;
      var totalSpent = camps.reduce(function(s,x){return s+(x.spent_month||0);},0);
      return '<div class="grid grid-cols-4 gap-3 mb-4">'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-orange-400">' + camps.length + '</div><div class="text-[10px] text-slate-400 mt-1">Campaigns</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-green-400">' + act + '</div><div class="text-[10px] text-slate-400 mt-1">Active</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-blue-400">' + D + tot.toLocaleString() + '</div><div class="text-[10px] text-slate-400 mt-1">Monthly Budget</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-red-400">' + D + totalSpent.toLocaleString() + '</div><div class="text-[10px] text-slate-400 mt-1">Spent</div></div></div>'
        + '<div class="stat-card border border-amber-500/20 mb-4"><div class="flex items-center justify-between mb-2"><h3 class="text-xs font-semibold text-amber-300">Cost Protection</h3><span class="badge badge-green">Auto Shutoff Enabled</span></div>'
        + camps.map(function(c){ var pct=c.daily_budget>0?Math.min(100,Math.round((c.spent_today||0)/c.daily_budget*100)):0; var col=pct>90?'#ef4444':pct>70?'#f59e0b':'#10b981'; return '<div class="flex items-center gap-3 mb-2"><span class="text-xs text-slate-300 w-48 truncate">' + c.campaign_name + '</span><div class="flex-1 h-1.5 bg-slate-700 rounded-full"><div class="h-full rounded-full" style="width:' + pct + '%;background:' + col + '"></div></div><span class="text-[10px] font-mono text-slate-400 w-20">' + D + (c.spent_today||0) + ' / ' + D + c.daily_budget + '</span><span class="badge ' + (c.status==='active'?'badge-green':'badge-amber') + '">' + (c.status||'draft') + '</span></div>'; }).join('')
        + '</div>'
        + '<table class="data-table"><thead><tr><th>Campaign</th><th>Service</th><th>Match</th><th>Daily Budget</th><th>Monthly</th><th>Status</th></tr></thead><tbody>'
        + camps.map(function(c){ return '<tr><td class="font-semibold">' + c.campaign_name + '</td><td class="text-slate-400">' + (c.service_type||'—') + '</td><td class="text-slate-400">' + (c.match_type||'broad') + '</td><td class="font-mono">' + D + (c.daily_budget||0) + '</td><td class="font-mono">' + D + (c.monthly_budget||0) + '</td><td>' + (c.status==='active'?'<span class="badge badge-green">Active</span>':c.status==='paused'?'<span class="badge badge-amber">Paused</span>':'<span class="badge badge-gray">Draft</span>') + '</td></tr>'; }).join('')
        + '</tbody></table>';
    } catch(e) { return '<div class="text-red-400 p-4">Error: ' + e.message + '</div>'; }
  }

  async function loadSEO() {
    try {
      var [kws, rankings, backlinks] = await Promise.all([
        sb('seo','keywords','select=*&order=created_at.desc&limit=30'),
        sb('seo','rank_tracking','select=*&order=checked_at.desc&limit=30'),
        sb('seo','backlink_prospects','select=*&order=created_at.desc&limit=20')
      ]);
      kws = Array.isArray(kws) ? kws : [];
      rankings = Array.isArray(rankings) ? rankings : [];
      backlinks = Array.isArray(backlinks) ? backlinks : [];
      var top10 = rankings.filter(function(r){return (r.position||99)<=10;}).length;
      var top3 = rankings.filter(function(r){return (r.position||99)<=3;}).length;
      return '<div class="grid grid-cols-4 gap-3 mb-4">'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-green-400">' + kws.length + '</div><div class="text-[10px] text-slate-400 mt-1">Keywords</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-blue-400">' + rankings.length + '</div><div class="text-[10px] text-slate-400 mt-1">Tracked</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-amber-400">' + top10 + '</div><div class="text-[10px] text-slate-400 mt-1">Top 10</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-purple-400">' + top3 + '</div><div class="text-[10px] text-slate-400 mt-1">Top 3</div></div></div>'
        + '<h3 class="text-xs font-semibold text-slate-300 mb-2">Keyword Rankings</h3>'
        + '<table class="data-table mb-4"><thead><tr><th>Keyword</th><th>Position</th><th>Volume</th><th>Difficulty</th><th>Last Checked</th></tr></thead><tbody>'
        + rankings.slice(0,15).map(function(r){ return '<tr><td class="font-medium">' + (r.keyword||'—') + '</td><td class="text-center font-mono font-bold ' + ((r.position||99)<=3?'text-green-400':(r.position||99)<=10?'text-amber-400':'text-red-400') + '">' + (r.position||'—') + '</td><td class="text-center font-mono">' + (r.search_volume||'—') + '</td><td class="text-center">' + (r.difficulty||'—') + '</td><td class="text-slate-400">' + ago(r.checked_at) + '</td></tr>'; }).join('')
        + '</tbody></table>'
        + '<h3 class="text-xs font-semibold text-slate-300 mb-2">Backlink Prospects (' + backlinks.length + ')</h3>'
        + '<table class="data-table"><thead><tr><th>Domain</th><th>DA</th><th>Status</th><th>Type</th></tr></thead><tbody>'
        + backlinks.map(function(b){ return '<tr><td class="font-medium">' + (b.domain||b.url||'—') + '</td><td class="text-center font-mono text-amber-400">' + (b.domain_authority||b.da||'—') + '</td><td>' + (b.status==='acquired'?'<span class="badge badge-green">Acquired</span>':b.status==='outreached'?'<span class="badge badge-blue">Outreached</span>':'<span class="badge badge-gray">'+(b.status||'Prospect')+'</span>') + '</td><td class="text-slate-400">' + (b.link_type||b.type||'—') + '</td></tr>'; }).join('')
        + '</tbody></table>';
    } catch(e) { return '<div class="text-red-400 p-4">Error: ' + e.message + '</div>'; }
  }

  async function loadAuthority() {
    try {
      var [scores, pr, signals] = await Promise.all([
        sb('authority','scores','select=*&order=created_at.desc&limit=20'),
        sb('authority','pr_campaigns','select=*&order=created_at.desc&limit=10'),
        sb('authority','brand_signals','select=*&order=created_at.desc&limit=10')
      ]);
      scores = Array.isArray(scores) ? scores : [];
      pr = Array.isArray(pr) ? pr : [];
      signals = Array.isArray(signals) ? signals : [];
      var avgScore = scores.length ? Math.round(scores.reduce(function(s,x){return s+(x.score||x.authority_score||0);},0)/scores.length) : 0;
      return '<div class="grid grid-cols-4 gap-3 mb-4">'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-purple-400">' + avgScore + '</div><div class="text-[10px] text-slate-400 mt-1">Avg Authority</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-blue-400">' + scores.length + '</div><div class="text-[10px] text-slate-400 mt-1">Scored</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-green-400">' + pr.length + '</div><div class="text-[10px] text-slate-400 mt-1">PR Campaigns</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-amber-400">' + signals.length + '</div><div class="text-[10px] text-slate-400 mt-1">Brand Signals</div></div></div>'
        + '<h3 class="text-xs font-semibold text-slate-300 mb-2">PR Campaigns</h3>'
        + '<table class="data-table mb-4"><thead><tr><th>Campaign</th><th>Status</th><th>Type</th><th>Created</th></tr></thead><tbody>'
        + pr.map(function(p){ return '<tr><td class="font-medium">' + (p.campaign_name||p.name||'—') + '</td><td>' + (p.status==='active'?'<span class="badge badge-green">Active</span>':'<span class="badge badge-gray">'+(p.status||'Draft')+'</span>') + '</td><td class="text-slate-400">' + (p.campaign_type||p.type||'—') + '</td><td class="text-slate-400">' + ago(p.created_at) + '</td></tr>'; }).join('')
        + '</tbody></table>'
        + '<h3 class="text-xs font-semibold text-slate-300 mb-2">Brand Signals</h3>'
        + '<table class="data-table"><thead><tr><th>Signal</th><th>Source</th><th>Score</th><th>Date</th></tr></thead><tbody>'
        + signals.map(function(s){ return '<tr><td class="font-medium">' + (s.signal_type||s.type||'—') + '</td><td class="text-slate-400">' + (s.source||'—') + '</td><td class="font-mono text-purple-400">' + (s.score||'—') + '</td><td class="text-slate-400">' + ago(s.created_at) + '</td></tr>'; }).join('')
        + '</tbody></table>';
    } catch(e) { return '<div class="text-red-400 p-4">Error: ' + e.message + '</div>'; }
  }

  async function loadRico() {
    try {
      var [log, sla, queue] = await Promise.all([
        sb('rico','responsibility_log','select=*&order=created_at.desc&limit=20'),
        sb('rico','sla_rules','select=*&order=priority.desc&limit=20'),
        sb('rico','action_queue','select=*&order=created_at.desc&limit=20')
      ]);
      log = Array.isArray(log) ? log : [];
      sla = Array.isArray(sla) ? sla : [];
      queue = Array.isArray(queue) ? queue : [];
      return '<div class="grid grid-cols-4 gap-3 mb-4">'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-amber-400">' + log.length + '</div><div class="text-[10px] text-slate-400 mt-1">Actions Logged</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-blue-400">' + sla.length + '</div><div class="text-[10px] text-slate-400 mt-1">SLA Rules</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-green-400">' + queue.length + '</div><div class="text-[10px] text-slate-400 mt-1">Queued</div></div>'
        + '<div class="stat-card text-center"><div class="text-2xl font-bold text-purple-400">0</div><div class="text-[10px] text-slate-400 mt-1">Overdue</div></div></div>'
        + '<h3 class="text-xs font-semibold text-slate-300 mb-2">SLA Rules</h3>'
        + '<table class="data-table mb-4"><thead><tr><th>Rule</th><th>Priority</th><th>SLA Hours</th><th>Escalation</th></tr></thead><tbody>'
        + sla.map(function(r){ return '<tr><td class="font-medium">' + (r.rule_name||r.name||'—') + '</td><td class="text-center font-mono text-amber-400">' + (r.priority||'—') + '</td><td class="text-center font-mono">' + (r.sla_hours||r.hours||'—') + 'h</td><td class="text-slate-400">' + (r.escalation_action||'—') + '</td></tr>'; }).join('')
        + '</tbody></table>'
        + '<h3 class="text-xs font-semibold text-slate-300 mb-2">Responsibility Log</h3>'
        + '<table class="data-table"><thead><tr><th>Action</th><th>Entity</th><th>Result</th><th>Time</th></tr></thead><tbody>'
        + log.map(function(l){ return '<tr><td class="font-medium">' + (l.action||l.action_type||'—') + '</td><td class="text-slate-400">' + (l.entity_type||'—') + '</td><td>' + (l.result==='success'?'<span class="badge badge-green">OK</span>':l.result==='failed'?'<span class="badge badge-red">Failed</span>':'<span class="badge badge-gray">'+(l.result||'—')+'</span>') + '</td><td class="text-slate-400">' + ago(l.created_at) + '</td></tr>'; }).join('')
        + '</tbody></table>';
    } catch(e) { return '<div class="text-red-400 p-4">Error: ' + e.message + '</div>'; }
  }

  async function render() {
    el.innerHTML = '<div class="space-y-4">'
      + '<div class="flex items-center gap-3 mb-2"><div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center"><i data-lucide="briefcase" style="width:20px;height:20px;color:#60a5fa"></i></div><div><h2 class="font-space font-bold text-lg">Rico Fulfillment Center</h2><p class="text-xs text-slate-400">Work Orders - Paid Ads - SEO - Authority - SLA Control</p></div></div>'
      + tabs()
      + '<div id="fc-body"><div class="flex justify-center py-8"><div class="spinner"></div></div></div>'
      + '</div>';
    lucide.createIcons();

    var body = document.getElementById('fc-body');
    if (!body) return;

    var content = '';
    if (activeTab === 'overview') content = await loadOverview();
    else if (activeTab === 'ads') content = await loadAds();
    else if (activeTab === 'seo') content = await loadSEO();
    else if (activeTab === 'authority') content = await loadAuthority();
    else if (activeTab === 'rico') content = await loadRico();

    body.innerHTML = content;
  }

  window._fcTab = async function(id) {
    activeTab = id;
    await render();
  };

  render();
});
