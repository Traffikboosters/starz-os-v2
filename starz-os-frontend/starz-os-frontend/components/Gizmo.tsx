'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type AgentSlug = 'steve' | 'rico' | 'zara' | 'gizmo';

interface Agent {
  slug: AgentSlug;
  name: string;
  title: string;
  color: string;
  avatar: string;
  initials: string;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  agent?: Agent;
  timestamp: Date;
}

const AGENTS: Record<AgentSlug, Agent> = {
  steve: {
    slug: 'steve',
    name: 'Steve BGE',
    title: 'Sales & Revenue',
    color: '#ff6b35',
    avatar: 'https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Steve.png',
    initials: 'S',
  },
  rico: {
    slug: 'rico',
    name: 'Rico BGE',
    title: 'Operations',
    color: '#3b82f6',
    avatar: 'https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Rico.png',
    initials: 'R',
  },
  zara: {
    slug: 'zara',
    name: 'Zara BGE',
    title: 'HR Director',
    color: '#8b5cf6',
    avatar: 'https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Zara.png',
    initials: 'Z',
  },
  gizmo: {
    slug: 'gizmo',
    name: 'Gizmo',
    title: 'Auto-Route',
    color: '#10b981',
    avatar: 'https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Vox.png',
    initials: 'G',
  },
};

const QUICK_PROMPTS = [
  { label: '🔥 Hot leads',   msg: 'Show me my hottest leads right now' },
  { label: '📋 Work orders', msg: 'What work orders are pending?' },
  { label: '👥 Onboard rep', msg: 'I need to onboard a new sales rep' },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

function AgentAvatar({ agent, size = 26, border = true }: { agent: Agent; size?: number; border?: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: border ? `1.5px solid ${agent.color}` : 'none',
      overflow: 'hidden', flexShrink: 0,
      background: agent.color + '33',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {!imgErr ? (
        <img src={agent.avatar} alt={agent.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgErr(true)} />
      ) : (
        <span style={{ color: agent.color, fontSize: size * 0.38, fontWeight: 700 }}>{agent.initials}</span>
      )}
    </div>
  );
}

export function Gizmo() {
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent>(AGENTS.gizmo);
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [unread, setUnread]           = useState(0);
  const [agentTyping, setAgentTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentTyping]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
      setUnread(0);
      if (messages.length === 0) {
        setMessages([{
          id: 'welcome', role: 'agent',
          content: "Hey! I'm Gizmo — pick an agent above or just type and I'll route you to the right one automatically.",
          agent: AGENTS.gizmo, timestamp: new Date(),
        }]);
      }
    }
  }, [open]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput(''); setLoading(true); setAgentTyping(true);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: msg, timestamp: new Date() }]);
    try {
      const history = messages.filter(m => m.id !== 'welcome').slice(-8).map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/gizmo-vox-router`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg, session_id: sessionId,
          page_context: typeof window !== 'undefined' ? window.location.pathname : '/',
          requested_agent: activeAgent.slug !== 'gizmo' ? activeAgent.slug : undefined,
          history,
        }),
      });
      const data = await resp.json();
      if (data.session_id && !sessionId) setSessionId(data.session_id);
      const respondingAgent = AGENTS[data.agent_slug as AgentSlug] ?? AGENTS.gizmo;
      setActiveAgent(respondingAgent); setAgentTyping(false);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'agent', content: data.response ?? 'Something went wrong.', agent: respondingAgent, timestamp: new Date() }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setAgentTyping(false);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'agent', content: 'Connection issue — please try again.', agent: AGENTS.gizmo, timestamp: new Date() }]);
    } finally { setLoading(false); }
  }, [input, loading, messages, sessionId, activeAgent, open]);

  const switchAgent = (agent: Agent) => {
    setActiveAgent(agent);
    if (agent.slug !== activeAgent.slug) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'agent', content: `Switched to ${agent.name} — ${agent.title}. What do you need?`, agent, timestamp: new Date() }]);
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', top: '10px', right: '16px', zIndex: 9999 }}>
        <button onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#131929', border: `1px solid ${open ? '#ff6b35' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '8px', padding: '5px 12px 5px 8px', cursor: 'pointer', transition: 'all 0.18s', position: 'relative',
        }}>
          <div style={{ display: 'flex' }}>
            {(['steve','rico','zara'] as AgentSlug[]).map((slug, i) => {
              const a = AGENTS[slug];
              return (
                <div key={slug} style={{ width:'22px',height:'22px',borderRadius:'50%',border:'1.5px solid #131929',overflow:'hidden',marginLeft:i===0?0:'-7px',background:a.color+'33',zIndex:3-i,position:'relative' }}>
                  <AgentAvatar agent={a} size={22} border={false} />
                </div>
              );
            })}
          </div>
          <div>
            <div style={{ fontSize:'11px',fontWeight:700,letterSpacing:'0.07em',lineHeight:1.2,color:open?'#ff6b35':'#fff' }}>VOX</div>
            <div style={{ fontSize:'9px',color:'#444',letterSpacing:'0.04em' }}>GIZMO AI</div>
          </div>
          <div style={{ position:'relative',width:'7px',height:'7px' }}>
            <div style={{ width:'7px',height:'7px',borderRadius:'50%',background:'#10b981' }}/>
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',background:'#10b981',animation:'vox-ring 2s ease-out infinite' }}/>
          </div>
          {unread>0 && !open && (
            <div style={{ position:'absolute',top:'-6px',right:'-6px',background:'#ef4444',color:'#fff',borderRadius:'50%',width:'16px',height:'16px',fontSize:'9px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',border:'1.5px solid #0d1117' }}>{unread}</div>
          )}
        </button>
      </div>

      <div style={{
        position:'fixed',top:'52px',right:'16px',width:'360px',maxHeight:'calc(100vh - 72px)',
        background:'#0d1117',borderRadius:'12px',
        boxShadow:'0 20px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.06)',
        display:'flex',flexDirection:'column',overflow:'hidden',zIndex:9998,
        transition:'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',transformOrigin:'top right',
        transform:open?'scale(1) translateY(0)':'scale(0.92) translateY(-10px)',
        opacity:open?1:0,pointerEvents:open?'all':'none',
      }}>
        <div style={{ background:'#131929',padding:'12px 14px',display:'flex',alignItems:'center',gap:'10px',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0 }}>
          <AgentAvatar agent={activeAgent} size={34} />
          <div style={{ flex:1 }}>
            <div style={{ color:'#fff',fontWeight:600,fontSize:'13px',lineHeight:1.2 }}>{activeAgent.name}</div>
            <div style={{ color:activeAgent.color,fontSize:'11px' }}>{activeAgent.title}</div>
          </div>
          <span style={{ background:'linear-gradient(135deg,#ff6b3520,#8b5cf620)',border:'1px solid rgba(255,107,53,0.2)',borderRadius:'6px',padding:'3px 8px',fontSize:'9px',fontWeight:700,color:'#ff6b35',letterSpacing:'0.08em' }}>VOX</span>
          <button onClick={()=>setOpen(false)} style={{ background:'transparent',border:'none',color:'#444',cursor:'pointer',fontSize:'20px',padding:'0 4px',lineHeight:1 }}>x</button>
        </div>

        <div style={{ display:'flex',gap:'5px',padding:'8px 10px',background:'#0d1117',borderBottom:'1px solid rgba(255,255,255,0.04)',flexShrink:0 }}>
          {Object.values(AGENTS).map(agent=>(
            <button key={agent.slug} onClick={()=>switchAgent(agent)} title={`${agent.name} - ${agent.title}`}
              style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',background:activeAgent.slug===agent.slug?agent.color+'18':'transparent',border:activeAgent.slug===agent.slug?`1px solid ${agent.color}44`:'1px solid transparent',borderRadius:'8px',padding:'5px 2px',cursor:'pointer',transition:'all 0.15s' }}>
              <AgentAvatar agent={agent} size={26} />
              <span style={{ fontSize:'8px',fontWeight:700,letterSpacing:'0.04em',color:activeAgent.slug===agent.slug?agent.color:'#3a4055' }}>
                {agent.slug==='gizmo'?'AUTO':agent.name.split(' ')[0].toUpperCase()}
              </span>
            </button>
          ))}
        </div>

        <div style={{ flex:1,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:'8px',minHeight:'180px',maxHeight:'360px' }}>
          {messages.map(msg=>(
            <div key={msg.id} style={{ display:'flex',flexDirection:msg.role==='user'?'row-reverse':'row',alignItems:'flex-end',gap:'7px' }}>
              {msg.role==='agent' && msg.agent && <AgentAvatar agent={msg.agent} size={24} />}
              <div style={{ maxWidth:'80%',background:msg.role==='user'?'linear-gradient(135deg,#ff6b35,#e8501e)':'#131929',color:'#e2e4ec',borderRadius:msg.role==='user'?'12px 12px 3px 12px':'12px 12px 12px 3px',padding:'9px 12px',fontSize:'13px',lineHeight:1.55,border:msg.role==='agent'?'1px solid rgba(255,255,255,0.06)':'none' }}>
                {msg.role==='agent' && msg.agent && <div style={{ fontSize:'9px',fontWeight:700,color:msg.agent.color,marginBottom:'4px',letterSpacing:'0.07em' }}>{msg.agent.name.toUpperCase()}</div>}
                <div style={{ whiteSpace:'pre-wrap' }}>{msg.content}</div>
              </div>
            </div>
          ))}
          {agentTyping && (
            <div style={{ display:'flex',alignItems:'flex-end',gap:'7px' }}>
              <AgentAvatar agent={activeAgent} size={24} />
              <div style={{ background:'#131929',borderRadius:'12px 12px 12px 3px',padding:'10px 13px',border:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:'4px',alignItems:'center' }}>
                {[0,1,2].map(i=><span key={i} style={{ width:'5px',height:'5px',borderRadius:'50%',background:activeAgent.color,display:'inline-block',animation:`vox-pulse 1.2s ease-in-out ${i*0.18}s infinite` }}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {messages.length<=1 && (
          <div style={{ padding:'0 10px 8px',display:'flex',gap:'5px',flexWrap:'wrap',flexShrink:0 }}>
            {QUICK_PROMPTS.map(p=>(
              <button key={p.label} onClick={()=>sendMessage(p.msg)}
                style={{ background:'#131929',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'4px 10px',fontSize:'11px',color:'#667',cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color='#ff6b35';(e.currentTarget as HTMLButtonElement).style.borderColor='#ff6b3544';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color='#667';(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(255,255,255,0.07)';}}
              >{p.label}</button>
            ))}
          </div>
        )}

        <div style={{ padding:'10px',background:'#090d14',borderTop:'1px solid rgba(255,255,255,0.05)',flexShrink:0 }}>
          <div style={{ display:'flex',gap:'8px',alignItems:'center',background:'#131929',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.07)',padding:'7px 10px' }}>
            <input ref={inputRef} type="text" value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();sendMessage();}}}
              placeholder={`Ask ${activeAgent.name}...`}
              style={{ flex:1,background:'transparent',border:'none',outline:'none',color:'#e2e4ec',fontSize:'13px',fontFamily:'inherit' }}
            />
            <button onClick={()=>sendMessage()} disabled={!input.trim()||loading}
              style={{ background:input.trim()&&!loading?activeAgent.color:'#1e2535',border:'none',borderRadius:'7px',width:'30px',height:'30px',cursor:input.trim()&&!loading?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s',color:'#fff',fontSize:'14px' }}>
              {loading?'o':'^'}
            </button>
          </div>
          <p style={{ textAlign:'center',margin:'5px 0 0',fontSize:'9px',color:'#1e2535',letterSpacing:'0.06em' }}>VOX - GIZMO AI - TRAFFIK BOOSTERS</p>
        </div>
      </div>

      <style>{`
        @keyframes vox-pulse{0%,80%,100%{transform:scale(0.75);opacity:0.4;}40%{transform:scale(1.15);opacity:1;}}
        @keyframes vox-ring{0%{transform:scale(1);opacity:0.5;}100%{transform:scale(2.4);opacity:0;}}
      `}</style>
    </>
  );
}