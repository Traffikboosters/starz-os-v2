'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, TrendingUp, Phone, Target, Flame } from 'lucide-react';

const STEVE_AVATAR = 'https://szguizvpiiuiyugrjeks.supabase.co/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Steve.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { icon: Flame, text: 'Show me hot leads' },
  { icon: TrendingUp, text: 'Pipeline status' },
  { icon: Phone, text: 'Who should I call next?' },
  { icon: Target, text: 'Close rate this week' },
];

const DEFAULT_RESPONSE = `Hey! I'm Steve, your Sales BGE at Traffik Boosters.

I run the full sales operation:
- Lead scraping & enrichment
- Outreach via email & phone
- Pipeline management & closing
- Deal handoff to Rico after payment

What do you need?`;

export function SteveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: DEFAULT_RESPONSE, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/steve-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Sorry, could not process that.',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Connection error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-50 w-16 h-16 rounded-full overflow-hidden hover:scale-110 transition-all ring-2 ring-teal-400 ring-offset-2 ring-offset-[#0a0a0f] shadow-[0_0_20px_rgba(20,184,166,0.5)] ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <img src={STEVE_AVATAR} alt="Steve" className="w-full h-full object-cover" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-96 rounded-2xl shadow-2xl border border-white/10 bg-gray-900">
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-teal-500/40">
              <img src={STEVE_AVATAR} alt="Steve" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Steve</h3>
              <p className="text-xs text-teal-400">Business Growth Expert BGE</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          <div className="h-72 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                  {msg.role === 'assistant' ? (
                    <img src={STEVE_AVATAR} alt="Steve" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white">DJ</div>
                  )}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'assistant' ? 'bg-white/5 text-white/90' : 'bg-teal-600 text-white'}`}>
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                  <img src={STEVE_AVATAR} alt="Steve" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10">
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => handleSend(s.text)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10"
                >
                  <s.icon className="w-3 h-3" />
                  {s.text}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder="Ask Steve anything..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-teal-500/50"
              />
              <button
                onClick={() => handleSend()}
                disabled={isTyping}
                className="p-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded-xl text-white transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}