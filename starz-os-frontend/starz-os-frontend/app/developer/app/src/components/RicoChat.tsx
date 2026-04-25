import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Code, Book, ClipboardList, Users, Cpu, Package } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { icon: ClipboardList, text: 'Show me active work orders' },
  { icon: Cpu, text: 'Check engine status' },
  { icon: Users, text: 'Who is available for assignment?' },
  { icon: Package, text: 'Track deliverable DEL-2025-0156' },
  { icon: Code, text: 'How do I assign a task?' },
  { icon: Book, text: 'Explain the fulfillment flow' },
];

const RICO_RESPONSES: Record<string, string> = {
  'show me active work orders': `Here are the current active work orders:

**WO-2025-0042** - Acme Corp
• SEO Package - Premium ($8,500)
• Progress: 65% | Due: 2 days
• Assigned to: Sarah Chen (Fulfillment)

**WO-2025-0040** - LocalBiz Pro  
• Maps Domination ($3,200)
• Progress: 40% | Due: 3 days
• Assigned to: Jessica Park (Data Intel)

**WO-2025-0039** - Ecommerce Plus
• Full Stack Growth ($15,000)
• Progress: 95% | Due: 1 day ⚠️
• Status: In Review

Would you like me to assign additional resources to any of these?`,

  'check engine status': `All 6 STARZ-OS engines are currently **operational**:

🟢 **STARZ Intelligence** - 78% load
🟢 **Authority Engine** - 45% load  
🟢 **Site Optimization** - 62% load
🟢 **Rank Domination** - 34% load
🟢 **Outreach + Content** - 56% load
🟢 **Performance Reporting** - 28% load

System uptime: **99.8%**

All engines are running within normal parameters. No action required.`,

  'who is available for assignment?': `Here are team members with available capacity:

**Fulfillment Engineers:**
• Maria Lopez - 35% available
• James Wilson - 100% available (currently away)

**Backlink Specialists:**
• Tom Anderson - 40% available

**Data & Intelligence:**
• Rachel Green - 45% available

**Automation Engineers:**
• Chris Martin - 30% available
• Nina Patel - 100% available (currently away)

Would you like me to assign a new task to any of these contractors?`,

  'track deliverable del-2025-0156': `**Deliverable: DEL-2025-0156**

📋 **Service Page Optimization - 15 Pages**
Client: Acme Corporation
Work Order: WO-2025-0042

**Progress: 65%**
Assigned to: Sarah Chen
Due: April 10, 2025 (2 days)

**Checklist:**
✅ Keyword research completed
✅ Meta tags optimized  
✅ Content rewritten
⏳ Internal linking structure
⏳ Schema markup added
⏳ Final QA review

The deliverable is on track. Sarah has completed the content work and is now working on technical implementation.`,

  'how do i assign a task?': `To assign a task through me (Rico), follow this protocol:

**Step 1:** Create a Work Order
• Must be tied to an approved proposal
• Include: client, deliverables, timeline, budget

**Step 2:** I break it into micro-tasks
• Task breakdown by deliverable type
• Estimated hours per task
• Skill requirements

**Step 3:** Assignment
• I match tasks to available contractors
• Consider: workload, skills, availability
• Contractors receive notification

**Step 4:** Tracking
• All progress tracked in Deliverables panel
• Automatic status updates
• Deadline alerts

**Remember:** ALL assignments go through me. Contractors do not accept direct requests.`,

  'explain the fulfillment flow': `**STARZ-OS Fulfillment Flow:**

👤 **Steve (Sales BGE)**
   ↓ Qualifies lead, generates proposal
   
📋 **Proposal Approved + Payment**
   ↓ Client signs contract
   
⚡ **Rico Activates Work Order**
   ↓ I create structured execution plan
   
🔧 **Task Breakdown Engine**
   ↓ Deliverables → micro-tasks
   
👥 **Assignment to Dev Teams**
   ↓ Matched by skills & availability
   
🚀 **Execution + Tracking**
   ↓ Real-time progress monitoring
   
✅ **Delivery + Reporting**
   ↓ Client receives results

**Key Rule:** Developers NEVER talk to clients or sales. ALL communication flows through me as the Technical Supervisor.`,
};

const DEFAULT_RESPONSE = `Greetings! I'm **Rico**, your Technical Supervisor BGE for the STARZ-OS Developers Department.

I oversee all fulfillment operations:
• Work Order creation & management
• Task assignment to 4 dev teams
• Engine monitoring & coordination  
• Deliverable tracking & QA
• Team workload balancing

**How can I help you today?**

Select a quick suggestion below or type your question.`;

export function RicoChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: DEFAULT_RESPONSE,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate Rico thinking and responding
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let response = '';

      for (const [key, value] of Object.entries(RICO_RESPONSES)) {
        if (lowerText.includes(key) || key.includes(lowerText)) {
          response = value;
          break;
        }
      }

      // If no match found, provide a contextual response
      if (!response) {
        if (lowerText.includes('hello') || lowerText.includes('hi')) {
          response = `Hello! I'm Rico, your Technical Supervisor. How can I assist with the fulfillment operations today?`;
        } else if (lowerText.includes('help')) {
          response = `I can help you with:

• Work order management
• Team assignments
• Engine monitoring
• Deliverable tracking
• Task prioritization
• Deadline management

What would you like to know?`;
        } else if (lowerText.includes('thank')) {
          response = `You're welcome! I'm here to ensure smooth fulfillment operations. Let me know if you need anything else.`;
        } else {
          response = `I understand you're asking about "${text}". As your Technical Supervisor, I'll need to review this request in the context of our current work orders and team capacity.

Could you provide more specific details? For example:
• A work order ID
• A deliverable reference
• A specific team or contractor

This will help me give you the most accurate information.`;
        }
      }

      const ricoMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, ricoMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Rico Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full overflow-hidden transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        } rico-pulse hover:scale-110`}
        aria-label="Chat with Rico"
      >
        <img
          src="/rico-avatar.png"
          alt="Rico AI"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] glass-card rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 border border-white/10">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-orange-500/10">
            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-cyan-500/50">
              <img
                src="/rico-avatar.png"
                alt="Rico"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0b0f1a]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Rico</h3>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-xs text-cyan-400">Technical Supervisor BGE</p>
              <p className="text-[10px] text-white/40">Developers Department</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ${
                    message.role === 'assistant'
                      ? 'ring-2 ring-cyan-500/50'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <img
                      src="/rico-avatar.png"
                      alt="Rico"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">You</span>
                    </div>
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === 'assistant'
                      ? 'bg-white/5 text-white/90 rounded-tl-sm'
                      : 'gradient-bg-cyan text-white rounded-tr-sm'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                    {message.content}
                  </pre>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-cyan-500/50">
                  <img
                    src="/rico-avatar.png"
                    alt="Rico"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 bg-white/50 rounded-full typing-dot" />
                  <span className="w-2 h-2 bg-white/50 rounded-full typing-dot" />
                  <span className="w-2 h-2 bg-white/50 rounded-full typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length < 3 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-white/40 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(suggestion.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                  >
                    <suggestion.icon className="w-3 h-3" />
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Rico anything..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="p-2.5 gradient-bg-cyan rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                aria-label="Send message"
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
