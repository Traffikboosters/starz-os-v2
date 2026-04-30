const fs = require('fs');
const path = require('path');

const htmlPath = path.join('C:\\Users\\mbecn\\my-app\\starz-os-frontend-v2\\public\\starz-os.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Find the section to replace
const startMarker = 'loadContractorContent(el)';
const endMarker = 'const loaders';

const startIdx = html.indexOf('async function ' + startMarker);
if (startIdx === -1) { console.error('ERROR: Could not find loadContractorContent'); process.exit(1); }

// Find end - search from startIdx onwards
let endIdx = -1;
let searchFrom = startIdx + 100;
while (searchFrom < html.length) {
  const found = html.indexOf(endMarker, searchFrom);
  if (found !== -1) { endIdx = found; break; }
  break;
}

if (endIdx === -1) { console.error('ERROR: Could not find end marker'); process.exit(1); }

console.log('Start:', startIdx, 'End:', endIdx, 'Length:', endIdx - startIdx);

const newFunction = `async function loadContractorContent(el) {
  el.innerHTML = '<div class="flex items-center justify-center h-40"><div class="spinner"></div></div>';
  try {
    const [contractors, commProfiles, bgeProfiles, leadQueue, commissions] = await Promise.all([
      sb('public', 'contractor_profiles', 'select=id,auth_user_id,full_name,email,phone_number,onboarding_stage,active,w9_signed,compliance_score,tier,created_at&order=created_at.desc&limit=100').catch(()=>[]),
      sb('public', 'user_communication_profiles', 'select=user_id,dialpad_user_id,dialpad_phone,email_address,video_room_url&limit=200').catch(()=>[]),
      sb('public', 'bge_profiles', 'select=user_id,deals_closed,revenue_generated,close_rate,performance_score,leads_access,assignment_paused,contact_speed_score,engagement_score,followup_score&limit=200').catch(()=>[]),
      sb('dialer', 'call_queue', 'select=id,lead_id,name,phone,status,priority,call_attempts,last_call_at,last_called_at,assigned_bge&order=priority.desc&limit=500').catch(()=>[]),
      sb('public', 'commissions', 'select=id,agent_id,commission_amount,status,paid_date,created_at&order=created_at.desc&limit=500').catch(()=>[]),
    ]);

    const getComms = (uid) => commProfiles.find(p => p.user_id === uid);
    const getBGE = (uid) => bgeProfiles.find(p => p.user_id === uid);
    const getLeads = (email) => leadQueue.filter(q => q.assigned_bge === email);
    const getCommissions = (uid) => commissions.filter(c => c.agent_id === uid);
    const earnedAmt = (uid) => getCommissions(uid).filter(x=>x.status==='paid').reduce((s,x)=>s+Number(x.commission_amount||0),0);
    const pendingAmt = (uid) => getCommissions(uid).filter(x=>x.status==='pending').reduce((s,x)=>s+Number(x.commission_amount||0),0);

    const activeCount = contractors.filter(c=>c.active).length;
    const totalDeals = contractors.reduce((s,c)=>s+Number(getBGE(c.auth_user_id)?.deals_closed||0),0);
    const totalMRR = activeCount * 650;

    let activeTab = 'overview';
    let selectedContractor = contractors[0] || null;

    const phaseBg = (s) => {
      const m = {apply:'bg-slate-500/15 border-slate-500/30',pre_qualified:'bg-blue-500/15 border-blue-500/30',contract:'bg-purple-500/15 border-purple-500/30',account:'bg-indigo-500/15 border-indigo-500/30',training:'bg-amber-500/15 border-amber-500/30',active:'bg-green-500/15 border-green-500/30',leads:'bg-cyan-500/15 border-cyan-500/30',powerdial:'bg-orange-500/15 border-orange-500/30',monitored:'bg-pink-500/15 border-pink-500/30',earning:'bg-emerald-500/15 border-emerald-500/30'};
      return m[s] || 'bg-slate-700/15 border-slate-700/30';
    };

    const renderCard = (c) => {
      const comm = getComms(c.auth_user_id);
      const bge = getBGE(c.auth_user_id);
      const myLeads = getLeads(c.email);
      const e = earnedAmt(c.auth_user_id);
      const stage = c.onboarding_stage || 'apply';
      const initial = (c.full_name||'?').charAt(0).toUpperCase();
      return '<div class="p-4 rounded-xl border ' + phaseBg(stage) + ' cursor-pointer hover:opacity-90 transition-all" onclick="window._cpSelect(\\'' + c.id + '\\')">' +
        '<div class="flex items-start gap-3 mb-3">' +
          '<div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">' + initial + '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="font-semibold text-sm text-white truncate">' + (c.full_name||'—') + '</div>' +
            '<div class="text-[10px] text-slate-400 truncate">' + (c.email||'—') + '</div>' +
            '<div class="text-[10px] text-slate-500">' + (comm && comm.email_address ? comm.email_address : 'No corp email') + '</div>' +
          '</div>' +
          '<div>' + (c.active ? '<span class="text-[8px] text-green-400 bg-green-500/10 rounded px-1 border border-green-500/20">ACTIVE</span>' : '<span class="text-[8px] text-slate-500 bg-slate-700/30 rounded px-1">INACTIVE</span>') + '</div>' +
        '</div>' +
        '<div class="grid grid-cols-4 gap-1 mb-3">' +
          '<div class="bg-black/20 rounded-lg p-1.5 text-center"><div class="text-xs font-bold font-mono text-cyan-400">' + myLeads.length + '</div><div class="text-[8px] text-slate-600">Leads</div></div>' +
          '<div class="bg-black/20 rounded-lg p-1.5 text-center"><div class="text-xs font-bold font-mono text-green-400">' + (bge ? bge.deals_closed||0 : 0) + '</div><div class="text-[8px] text-slate-600">Deals</div></div>' +
          '<div class="bg-black/20 rounded-lg p-1.5 text-center"><div class="text-xs font-bold font-mono text-amber-400">' + (bge && bge.close_rate ? (Number(bge.close_rate)*100).toFixed(0)+'%' : '—') + '</div><div class="text-[8px] text-slate-600">Close%</div></div>' +
          '<div class="bg-black/20 rounded-lg p-1.5 text-center"><div class="text-xs font-bold font-mono text-emerald-400">$' + (e/1000).toFixed(1) + 'k</div><div class="text-[8px] text-slate-600">Earned</div></div>' +
        '</div>' +
        '<div class="flex gap-1">' +
          '<button onclick="event.stopPropagation();window._cpSelect(\\'' + c.id + '\\')" class="py-1 px-2 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[9px] hover:bg-indigo-500/30">👤 View</button>' +
          '<button onclick="event.stopPropagation();window._cpQuickAI(\\'' + c.id + '\\',\\'steve\\')" class="py-1 px-2 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[9px] hover:bg-purple-500/30">🧠 Steve</button>' +
          '<button onclick="event.stopPropagation();window._cpQuickAI(\\'' + c.id + '\\',\\'zara\\')" class="py-1 px-2 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[9px] hover:bg-rose-500/30">💼 Zara</button>' +
          '<button onclick="event.stopPropagation();window._cpQuickAI(\\'' + c.id + '\\',\\'rico\\')" class="py-1 px-2 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[9px] hover:bg-cyan-500/30">⚙️ Rico</button>' +
        '</div>' +
      '</div>';
    };

    const renderOverview = () => {
      return '<div class="space-y-4">' +
        '<div class="grid grid-cols-4 gap-3">' +
          '<div class="stat-card text-center"><div class="text-2xl mb-1">👥</div><div class="text-xl font-bold font-mono text-white">' + contractors.length + '</div><div class="text-[10px] text-slate-500 mt-1">Total</div></div>' +
          '<div class="stat-card text-center"><div class="text-2xl mb-1">⚡</div><div class="text-xl font-bold font-mono text-green-400">' + activeCount + '</div><div class="text-[10px] text-slate-500 mt-1">Active</div></div>' +
          '<div class="stat-card text-center"><div class="text-2xl mb-1">🏆</div><div class="text-xl font-bold font-mono text-purple-400">' + totalDeals + '</div><div class="text-[10px] text-slate-500 mt-1">Deals</div></div>' +
          '<div class="stat-card text-center"><div class="text-2xl mb-1">💰</div><div class="text-xl font-bold font-mono text-emerald-400">$' + totalMRR.toLocaleString() + '</div><div class="text-[10px] text-slate-500 mt-1">MRR</div></div>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-3">' + contractors.map(c => renderCard(c)).join('') + '</div>' +
      '</div>';
    };

    const renderPortal = () => {
      if (!selectedContractor) return '<div class="text-center text-slate-500 py-8">Select a contractor from Overview</div>';
      const c = selectedContractor;
      const comm = getComms(c.auth_user_id);
      const bge = getBGE(c.auth_user_id);
      const myLeads = getLeads(c.email);
      const myComms = getCommissions(c.auth_user_id);
      const e = earnedAmt(c.auth_user_id);
      const p = pendingAmt(c.auth_user_id);
      const initial = (c.full_name||'?').charAt(0).toUpperCase();
      const dialpadUID = comm && comm.dialpad_user_id ? comm.dialpad_user_id : '4566842998267904';

      const leadRows = myLeads.length === 0
        ? '<div class="text-center text-slate-600 py-4 text-xs">No leads assigned</div>'
        : myLeads.slice(0,25).map(l => {
            const sc = l.status==='ready' ? 'bg-green-500/15 border-green-500/25 text-green-400' : l.status==='calling' ? 'bg-orange-500/15 border-orange-500/25 text-orange-400' : 'bg-slate-700/30 border-slate-700/40 text-slate-500';
            return '<div class="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">' +
              '<div class="flex-1 min-w-0"><div class="text-xs font-semibold truncate">' + (l.name||'Unknown') + '</div><div class="text-[10px] text-slate-500 font-mono">' + (l.phone||'—') + '</div></div>' +
              '<span class="text-[8px] px-1.5 py-0.5 rounded border ' + sc + '">' + (l.status||'ready').toUpperCase() + '</span>' +
              '<button onclick="window._cpDialLead(\\'' + l.phone + '\\',\\'' + dialpadUID + '\\',\\'' + l.id + '\\')" class="p-1 rounded bg-green-500/20 text-green-300 text-[9px]">📞</button>' +
              '<button onclick="window._cpDispose(\\'' + l.id + '\\',\\'interested\\')" class="p-1 rounded bg-cyan-500/20 text-cyan-300 text-[9px]">🔥</button>' +
              '<button onclick="window._cpDispose(\\'' + l.id + '\\',\\'callback\\')" class="p-1 rounded bg-amber-500/20 text-amber-300 text-[9px]">📅</button>' +
              '<button onclick="window._cpDispose(\\'' + l.id + '\\',\\'dnc\\')" class="p-1 rounded bg-red-500/20 text-red-300 text-[9px]">✗</button>' +
            '</div>';
          }).join('');

      const commRows = myComms.slice(0,4).map(cm =>
        '<div class="flex justify-between text-[10px] py-1 border-b border-white/[0.04]">' +
          '<span class="text-slate-500">' + new Date(cm.created_at).toLocaleDateString() + '</span>' +
          '<span class="font-mono text-white">$' + Number(cm.commission_amount||0).toLocaleString() + '</span>' +
          '<span class="' + (cm.status==='paid'?'text-green-400':'text-amber-400') + '">' + cm.status + '</span>' +
        '</div>'
      ).join('');

      return '<div class="space-y-4">' +
        '<div class="p-4 rounded-2xl border border-indigo-500/30" style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05))">' +
          '<div class="flex items-center gap-4">' +
            '<div class="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">' + initial + '</div>' +
            '<div class="flex-1">' +
              '<div class="text-xl font-black text-white">' + (c.full_name||'—') + '</div>' +
              '<div class="flex gap-2 mt-1 flex-wrap">' +
                (comm && comm.email_address ? '<span class="text-[10px] text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5">📧 ' + comm.email_address + '</span>' : '') +
                (comm && comm.dialpad_phone ? '<span class="text-[10px] text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded px-2 py-0.5">📞 ' + comm.dialpad_phone + '</span>' : '') +
                (c.active ? '<span class="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 rounded px-2 py-0.5">⚡ ACTIVE</span>' : '') +
              '</div>' +
            '</div>' +
            '<div class="grid grid-cols-3 gap-2">' +
              '<div class="text-center bg-black/20 rounded-lg p-2"><div class="text-base font-black font-mono text-cyan-400">' + myLeads.length + '</div><div class="text-[8px] text-slate-600">Leads</div></div>' +
              '<div class="text-center bg-black/20 rounded-lg p-2"><div class="text-base font-black font-mono text-green-400">' + (bge ? bge.deals_closed||0 : 0) + '</div><div class="text-[8px] text-slate-600">Deals</div></div>' +
              '<div class="text-center bg-black/20 rounded-lg p-2"><div class="text-base font-black font-mono text-emerald-400">$' + (e/1000).toFixed(1) + 'k</div><div class="text-[8px] text-slate-600">Earned</div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-4">' +
          '<div class="space-y-3">' +
            '<div class="flex items-center justify-between"><div class="text-xs font-semibold text-slate-300">📞 Lead Queue (' + myLeads.length + ')</div>' +
            '<button onclick="window._cpAutoDial(\\'' + c.email + '\\',\\'' + dialpadUID + '\\')" class="py-1 px-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-[10px] font-semibold">▶ Auto-Dial</button></div>' +
            '<div class="flex gap-2">' +
              '<input id="cp-manual-' + c.id + '" type="text" placeholder="Manual dial…" class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none" />' +
              '<button onclick="window._cpManualDial(\\'' + c.id + '\\',\\'' + dialpadUID + '\\')" class="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-semibold">📞</button>' +
            '</div>' +
            '<div class="space-y-1 max-h-64 overflow-y-auto">' + leadRows + '</div>' +
          '</div>' +
          '<div class="space-y-3">' +
            '<div class="text-xs font-semibold text-slate-300">🤖 AI Agents</div>' +
            '<div class="grid grid-cols-3 gap-2">' +
              ['steve','zara','rico'].map(a => {
                const colors = {steve:'139,92,246',zara:'244,63,94',rico:'14,165,233'};
                const names = {steve:'Steve BGE',zara:'Zara HR',rico:'Rico BGE'};
                const roles = {steve:'Sales Coach',zara:'HR Director',rico:'Ops Director'};
                const imgs = {steve:'Steve.png',zara:'Zara.png',rico:'Rico.png'};
                return '<button onclick="window._cpOpenChat(\\'' + a + '\\',\\'' + c.id + '\\')" class="p-3 rounded-xl border text-left" style="background:rgba(' + colors[a] + ',0.08);border-color:rgba(' + colors[a] + ',0.25)">' +
                  '<img src="https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/' + imgs[a] + '" class="w-10 h-10 rounded-full object-cover mb-2" onerror="this.style.display=\\'none\\'" />' +
                  '<div class="text-xs font-bold text-white">' + names[a] + '</div>' +
                  '<div class="text-[8px] text-slate-500">' + roles[a] + '</div>' +
                '</button>';
              }).join('') +
            '</div>' +
            '<div id="cp-chat-' + c.id + '" class="hidden space-y-2">' +
              '<div class="flex items-center gap-2"><span id="cp-agent-label-' + c.id + '" class="text-xs font-bold text-white"></span>' +
              '<button onclick="document.getElementById(\\'cp-chat-' + c.id + '\\').classList.add(\\'hidden\\')" class="ml-auto text-slate-500 text-xs">✕</button></div>' +
              '<div id="cp-msgs-' + c.id + '" class="bg-black/20 rounded-xl p-3 h-28 overflow-y-auto space-y-1 text-xs"><div class="text-slate-600 italic text-[10px]">Ask your AI agent…</div></div>' +
              '<div class="flex gap-2">' +
                '<input id="cp-input-' + c.id + '" type="text" placeholder="Message…" class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none" />' +
                '<button onclick="window._cpSendChat(\\'' + c.id + '\\')" class="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">Send</button>' +
              '</div>' +
            '</div>' +
            '<div class="grid grid-cols-2 gap-2">' +
              '<button onclick="' + (comm && comm.video_room_url ? 'window.open(\\'' + comm.video_room_url + '\\',\\'_blank\\')' : 'showRealtimeToast(\\'No video room\\',\\'amber\\')') + '" class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left"><div class="text-lg mb-1">🎥</div><div class="text-xs font-semibold text-blue-300">Video</div></button>' +
              '<button onclick="window.open(\\'https://mail.google.com\\',\\'_blank\\')" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-left"><div class="text-lg mb-1">📧</div><div class="text-xs font-semibold text-rose-300">Email</div><div class="text-[9px] text-slate-500 truncate">' + (comm && comm.email_address ? comm.email_address : 'Not assigned') + '</div></button>' +
            '</div>' +
            '<div class="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">' +
              '<div class="text-xs font-semibold text-emerald-300 mb-2">💰 Commissions</div>' +
              '<div class="grid grid-cols-2 gap-2 mb-2">' +
                '<div class="text-center bg-black/20 rounded-lg p-2"><div class="text-sm font-black text-emerald-400 font-mono">$' + e.toLocaleString() + '</div><div class="text-[9px] text-slate-600">Earned</div></div>' +
                '<div class="text-center bg-black/20 rounded-lg p-2"><div class="text-sm font-black text-amber-400 font-mono">$' + p.toLocaleString() + '</div><div class="text-[9px] text-slate-600">Pending</div></div>' +
              '</div>' + commRows +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    };

    const renderLeaderboard = () => {
      const ranked = [...contractors].sort((a,b) => Number((getBGE(b.auth_user_id)||{}).revenue_generated||0) - Number((getBGE(a.auth_user_id)||{}).revenue_generated||0));
      const medals = ['🥇','🥈','🥉'];
      const rows = ranked.map((c,i) => {
        const bge = getBGE(c.auth_user_id);
        const comm = getComms(c.auth_user_id);
        return '<tr>' +
          '<td class="font-mono font-bold ' + (i===0?'text-amber-400':i===1?'text-slate-300':i===2?'text-amber-700':'text-slate-500') + '">' + (medals[i]||i+1) + '</td>' +
          '<td class="font-semibold">' + (c.full_name||'—') + '</td>' +
          '<td class="text-xs text-blue-300">' + (comm && comm.email_address ? comm.email_address : '—') + '</td>' +
          '<td class="font-mono text-xs text-orange-300">' + (comm && comm.dialpad_phone ? comm.dialpad_phone : '—') + '</td>' +
          '<td class="font-mono text-cyan-400">' + getLeads(c.email).length + '</td>' +
          '<td class="font-mono text-green-400 font-bold">' + (bge ? bge.deals_closed||0 : 0) + '</td>' +
          '<td class="font-mono text-amber-400">' + (bge && bge.close_rate ? (Number(bge.close_rate)*100).toFixed(1)+'%' : '—') + '</td>' +
          '<td class="font-mono text-emerald-400 font-bold">$' + Number((bge||{}).revenue_generated||0).toLocaleString() + '</td>' +
          '<td class="font-mono text-purple-400">$' + earnedAmt(c.auth_user_id).toLocaleString() + '</td>' +
          '<td>' + (c.active ? '<span class="text-[9px] text-green-400 bg-green-500/10 border border-green-500/20 rounded px-1.5">ACTIVE</span>' : '<span class="text-[9px] text-slate-500 bg-slate-700/20 rounded px-1.5">INACTIVE</span>') + '</td>' +
        '</tr>';
      }).join('');
      return '<div class="space-y-3"><div class="text-xs font-semibold text-slate-300">🏆 Leaderboard</div><table class="data-table"><thead><tr><th>#</th><th>Name</th><th>Corp Email</th><th>Dialpad</th><th>Leads</th><th>Deals</th><th>Close%</th><th>Revenue</th><th>Earned</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    };

    const renderKPI = () => {
      const cards = contractors.map(c => {
        const bge = getBGE(c.auth_user_id);
        const score = Number((bge||{}).performance_score||0);
        const sc = score>=80?'#4ade80':score>=50?'#fbbf24':'#f87171';
        const bars = [
          {l:'Contact',v:Number((bge||{}).contact_speed_score||0).toFixed(0)},
          {l:'Engage',v:Number((bge||{}).engagement_score||0).toFixed(0)},
          {l:'Follow-up',v:Number((bge||{}).followup_score||0).toFixed(0)},
        ].map(m => '<div class="flex items-center gap-2"><span class="text-[9px] text-slate-500 w-14 shrink-0">' + m.l + '</span><div class="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-indigo-400 rounded-full" style="width:' + m.v + '%"></div></div><span class="text-[9px] text-slate-400 w-5 text-right">' + m.v + '</span></div>').join('');
        return '<div class="p-4 rounded-xl border border-white/10 bg-white/[0.02]">' +
          '<div class="flex items-center gap-2 mb-3"><div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">' + (c.full_name||'?').charAt(0) + '</div>' +
          '<div><div class="text-xs font-semibold text-white">' + (c.full_name||'—') + '</div><div class="text-[9px] text-slate-500">' + (c.onboarding_stage||'—') + '</div></div></div>' +
          '<div class="mb-3"><div class="flex justify-between text-[10px] mb-1"><span class="text-slate-500">Score</span><span class="font-bold" style="color:' + sc + '">' + score.toFixed(0) + '/100</span></div>' +
          '<div class="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div class="h-full rounded-full" style="width:' + score + '%;background:' + sc + '"></div></div></div>' +
          '<div class="space-y-1">' + bars + '</div>' +
          '<div class="grid grid-cols-2 gap-1 mt-3">' +
            '<div class="bg-black/20 rounded p-1.5 text-center"><div class="text-xs font-bold text-cyan-400">' + getLeads(c.email).length + '</div><div class="text-[8px] text-slate-600">Leads</div></div>' +
            '<div class="bg-black/20 rounded p-1.5 text-center"><div class="text-xs font-bold text-green-400">' + ((bge||{}).deals_closed||0) + '</div><div class="text-[8px] text-slate-600">Deals</div></div>' +
          '</div>' +
        '</div>';
      }).join('');
      return '<div class="space-y-3"><div class="text-xs font-semibold text-slate-300">📊 KPIs</div><div class="grid grid-cols-3 gap-3">' + cards + '</div></div>';
    };

    const getContent = () => {
      if (activeTab === 'overview') return renderOverview();
      if (activeTab === 'portal') return renderPortal();
      if (activeTab === 'leaderboard') return renderLeaderboard();
      return renderKPI();
    };

    const renderCP = () => {
      const tabs = [
        {id:'overview',label:'👥 Overview (' + contractors.length + ')'},
        {id:'portal',label:'🖥 Portal'},
        {id:'leaderboard',label:'🏆 Leaderboard'},
        {id:'kpi',label:'📊 KPIs'},
      ];
      const tabHTML = tabs.map(t =>
        '<button onclick="window._cpTab(\\'' + t.id + '\\')" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' +
        (activeTab===t.id ? 'bg-indigo-500/30 text-white border border-indigo-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5') +
        '">' + t.label + '</button>'
      ).join('');

      el.innerHTML =
        '<div class="flex flex-col h-full">' +
          '<div class="flex items-center gap-3 p-4 rounded-2xl border border-indigo-500/20 mb-4 shrink-0" style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.04))">' +
            '<div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">🏢</div>' +
            '<div><div class="font-black text-base text-white">Contractor Portal</div><div class="text-[10px] text-slate-500">PowerDial · Steve · Zara · Rico · KPIs · Commissions</div></div>' +
            '<div class="ml-auto flex items-center gap-3 text-[10px]">' +
              '<span class="text-slate-400">Active: <strong class="text-green-400">' + activeCount + '</strong></span>' +
              '<span class="text-slate-400">MRR: <strong class="text-emerald-400">$' + totalMRR.toLocaleString() + '</strong></span>' +
              '<button onclick="loadContractorContent(el)" class="py-1 px-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold transition-all">↻</button>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-1 mb-3 shrink-0 flex-wrap">' + tabHTML + '</div>' +
          '<div class="flex-1 overflow-y-auto">' + getContent() + '</div>' +
        '</div>';
      lucide.createIcons();
    };

    window._cpTab = (tab) => { activeTab=tab; renderCP(); };
    window._cpSelect = (id) => { selectedContractor=contractors.find(c=>c.id===id)||null; activeTab='portal'; renderCP(); };
    window._cpQuickAI = (id, agent) => { selectedContractor=contractors.find(c=>c.id===id)||null; activeTab='portal'; renderCP(); setTimeout(()=>window._cpOpenChat(agent,id),150); };

    window._cpDialLead = async (phone, dialpadUserId, queueId) => {
      if (!phone) { showRealtimeToast('No phone','amber'); return; }
      const d = phone.replace(/\\D/g,'');
      const e164 = d.length===10 ? '+1'+d : '+'+d;
      showRealtimeToast('Dialing '+e164+'...','green');
      try {
        const res = await fetch(SB_URL+'/functions/v1/dialpad-call',{method:'POST',headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'initiate_call',user_id:dialpadUserId||'4566842998267904',phone_number:e164})});
        const data = await res.json();
        if (data && data.error) { showRealtimeToast(data.error,'red'); return; }
        showRealtimeToast('Call placed: '+e164,'green');
        if (queueId) await fetch(SB_URL+'/rest/v1/call_queue?id=eq.'+queueId,{method:'PATCH',headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Accept-Profile':'dialer','Content-Profile':'dialer','Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({status:'calling',last_call_at:new Date().toISOString()})}).catch(()=>{});
      } catch(err) { showRealtimeToast(err.message,'red'); }
    };

    window._cpManualDial = async (contractorId, dialpadUserId) => {
      const input = document.getElementById('cp-manual-'+contractorId);
      const phone = input ? input.value.trim() : '';
      if (!phone) { showRealtimeToast('Enter number','amber'); return; }
      if (input) input.value = '';
      window._cpDialLead(phone, dialpadUserId, null);
    };

    window._cpAutoDial = async (email, dialpadUserId) => {
      const ready = leadQueue.filter(q=>q.assigned_bge===email&&q.status==='ready');
      if (!ready.length) { showRealtimeToast('No ready leads','amber'); return; }
      showRealtimeToast('Auto-dialing '+ready.length+' leads...','green');
      window._cpDialLead(ready[0].phone, dialpadUserId, ready[0].id);
    };

    window._cpDispose = async (queueId, disposition) => {
      await fetch(SB_URL+'/rest/v1/call_queue?id=eq.'+queueId,{method:'PATCH',headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Accept-Profile':'dialer','Content-Profile':'dialer','Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({status:disposition})}).catch(()=>{});
      showRealtimeToast(disposition,'green');
      setTimeout(()=>loadContractorContent(el),800);
    };

    window._cpOpenChat = (agentId, contractorId) => {
      const panel = document.getElementById('cp-chat-'+contractorId);
      const label = document.getElementById('cp-agent-label-'+contractorId);
      if (!panel) return;
      panel.classList.remove('hidden');
      const names = {steve:'🧠 Steve BGE',zara:'💼 Zara HR',rico:'⚙️ Rico BGE'};
      if (label) label.textContent = names[agentId]||agentId;
      panel.dataset.agent = agentId;
    };

    window._cpSendChat = async (contractorId) => {
      const input = document.getElementById('cp-input-'+contractorId);
      const msg = input ? input.value.trim() : '';
      if (!msg) return;
      if (input) input.value = '';
      const panel = document.getElementById('cp-chat-'+contractorId);
      const agentId = panel && panel.dataset.agent ? panel.dataset.agent : 'steve';
      const msgsEl = document.getElementById('cp-msgs-'+contractorId);
      if (msgsEl) {
        msgsEl.innerHTML += '<div class="text-right text-white bg-indigo-500/20 rounded px-2 py-1 text-[10px]">'+msg+'</div><div id="cp-typing-'+contractorId+'" class="text-slate-400 text-[10px] italic">thinking...</div>';
        msgsEl.scrollTop = msgsEl.scrollHeight;
      }
      const systems = {
        steve:'You are Steve BGE, elite sales coach at Traffik Boosters. Help with objection handling, closing, and scripts for digital marketing services. Be sharp and tactical.',
        zara:'You are Zara, HR Director at Traffik Boosters. Help with HR questions, policies, lead rules, and Florida employment law.',
        rico:'You are Rico, Ops Director at Traffik Boosters. Help with post-sale process, fulfillment timelines, and service delivery.'
      };
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,system:systems[agentId]||systems.steve,messages:[{role:'user',content:msg}]})});
        const data = await res.json();
        const reply = data.content && data.content[0] ? data.content[0].text : 'Unable to respond';
        const t = document.getElementById('cp-typing-'+contractorId);
        if (t) t.outerHTML = '<div class="text-slate-200 bg-white/5 rounded px-2 py-1.5 text-[10px]">'+reply+'</div>';
        if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
      } catch(err) {
        const t = document.getElementById('cp-typing-'+contractorId);
        if (t) t.textContent = 'Error: '+err.message;
      }
    };

    renderCP();
  } catch(e) { el.innerHTML = '<div class="p-8 text-center text-red-400">Portal Error: '+e.message+'</div>'; }
}

`;

const oldSection = html.substring(startIdx, endIdx);
const newHtml = html.substring(0, startIdx) + newFunction + html.substring(endIdx);

// Verify no corruption
if (!newHtml.includes('const windows = {}') && !newHtml.includes('windows = {}')) {
  console.log('WARNING: windows declaration not found - checking...');
}

if (newHtml.includes('_cpTab') && newHtml.includes('loadContractorContent')) {
  fs.writeFileSync(htmlPath, newHtml, 'utf8');
  console.log('SUCCESS: Contractor portal injected. File size:', newHtml.length);
} else {
  console.error('ERROR: Injection verification failed');
  process.exit(1);
}
