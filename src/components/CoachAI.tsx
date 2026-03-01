import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mic, Sparkles, Flame, Target, Calendar, TrendingUp, Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  role: "coach" | "user";
  text: string;
  ts: Date;
}

/* ── context-aware response engine ──────────────────────────── */
const hour = new Date().getHours();
const greeting =
  hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

const COACH_PERSONAS: Record<string, { name: string; emoji: string; accent: string }> = {
  client:    { name: "Coach",      emoji: "🧠", accent: "indigo" },
  provider:  { name: "BizCoach",   emoji: "📊", accent: "teal"   },
  admin:     { name: "OpsBot",     emoji: "⚙️", accent: "amber"  },
  corporate: { name: "WellnessAI", emoji: "🏢", accent: "indigo" },
};

function buildGreeting(role: string, name?: string): string {
  const first = name?.split(" ")[0] ?? "there";
  if (role === "client")
    return `Good ${greeting}, ${first}! I'm Coach — your personal wellness AI. I'll keep you accountable, celebrate your wins, and help you get the most from every session. What are you working on today?`;
  if (role === "provider")
    return `Hey ${first}! BizCoach here. I can help you grow your client base, spot churn risk early, and build better programmes. What do you need?`;
  if (role === "admin")
    return `Good ${greeting}. OpsBot standing by. I can summarise platform metrics, flag anomalies, or help draft comms. How can I assist?`;
  return `Welcome back, ${first}. WellnessAI here — ready to report on your team's wellness stats or help configure your programme.`;
}

const CLIENT_QUICK: { label: string; icon: typeof Target; prompt: string }[] = [
  { label: "Today's plan",    icon: Target,   prompt: "What should I focus on today?" },
  { label: "Check my streak", icon: Flame,    prompt: "How is my streak going?" },
  { label: "Book a session",  icon: Calendar, prompt: "Help me book a session" },
  { label: "My progress",     icon: TrendingUp, prompt: "Show me my progress this month" },
];

const PROVIDER_QUICK: { label: string; icon: typeof Target; prompt: string }[] = [
  { label: "At-risk clients", icon: Target,    prompt: "Which clients are at churn risk?" },
  { label: "Today's schedule",icon: Calendar,  prompt: "What's on my schedule today?" },
  { label: "Revenue tips",    icon: TrendingUp, prompt: "How can I increase my revenue?" },
  { label: "Client insights", icon: Brain,     prompt: "Give me insights on my top clients" },
];

const MOCK_RESPONSES: Record<string, string[]> = {
  "what should i focus on today":
    ["Your programme from Lisa has 2 exercises left from yesterday's session: Tricep Dips and Bicep Curls. Want me to add a reminder at 5pm? Also — you're 1 session away from unlocking the 🏆 Consistency badge!"],
  "how is my streak going":
    ["You're on a 🔥 14-day streak — incredible! Your personal best is 21 days. If you check in today, you'll earn +50 BIOPoints. Keep it up!"],
  "help me book a session":
    ["Lisa has slots at 3pm and 6pm today. Dr. Kagiso is free tomorrow morning. Want me to book the 3pm with Lisa? Just say 'confirm' and I'll lock it in."],
  "show me my progress this month":
    ["February was great! ✅ 12 sessions completed · ↓ 1.9kg lost · 💪 Lean mass up 0.3kg · 🔥 14-day streak. You're in the top 15% of BIO clients this month!"],
  "which clients are at churn risk":
    ["2 clients need attention: Kobus P. (11 days since last session, usually 2×/week) and Amir K. (went quiet after session 5). I can draft a check-in message for both — want that?"],
  "what's on my schedule today":
    ["You have 3 sessions today: Mpho at 9am, Thandi at 11am, and Naledi at 3pm. Kobus cancelled Saturday — slot is still open. Total revenue today: R1,200."],
  "how can i increase my revenue":
    ["Your occupancy rate is 78%. 3 strategies: (1) Add a 6am slot — 40% of clients prefer early sessions. (2) Offer a bundle package (5 sessions = 10% off). (3) Follow up with Amir K. — high value client who went quiet."],
  "give me insights on my top clients":
    ["Top client: Mpho Sithole — 18 sessions, R8,100 LTV, refers others, never a no-show. Consider offering a loyalty reward. Second: Thandi — consistent, growing fast. She may be ready for a premium programme."],
};

function getResponse(input: string): string {
  const key = input.toLowerCase().trim();
  for (const [pattern, replies] of Object.entries(MOCK_RESPONSES)) {
    if (key.includes(pattern.split(" ")[0]) || pattern.includes(key.split(" ")[0])) {
      return replies[0];
    }
  }
  return "Great question! I'm processing that for you. In the meantime — you're doing amazing. Every step counts on your wellness journey. 💪";
}

/* ── CoachAI component ──────────────────────────────────────── */
export default function CoachAI() {
  const { user } = useAuth();
  const role = user?.role ?? "client";
  const persona = COACH_PERSONAS[role] ?? COACH_PERSONAS.client;
  const quickActions = role === "provider" ? PROVIDER_QUICK : CLIENT_QUICK;

  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "init", role: "coach", text: buildGreeting(role, user?.name), ts: new Date() },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now() + "u", role: "user", text: text.trim(), ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      const reply: Message = { id: Date.now() + "c", role: "coach", text: getResponse(text), ts: new Date() };
      setMessages(prev => [...prev, reply]);
    }, 700);
  };

  const accentCls = {
    indigo: "from-indigo to-violet",
    teal:   "from-teal to-emerald-400",
    amber:  "from-amber to-orange-400",
  }[persona.accent] ?? "from-indigo to-violet";

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br ${accentCls} shadow-lg flex items-center justify-center`}
        aria-label="Open Coach AI"
      >
        <span className="text-xl">{persona.emoji}</span>
        <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-teal border-2 border-obsidian" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-obsidian/50 z-50"
            />
            <motion.div
              key="panel"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] flex flex-col"
              style={{
                height: "82vh",
                background: "rgba(12,12,20,0.97)",
                backdropFilter: "blur(60px)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentCls} flex items-center justify-center text-lg`}>
                    {persona.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{persona.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                      <span className="text-[10px] text-teal">Online · Powered by BIO AI</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "coach" && (
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${accentCls} flex items-center justify-center text-xs mr-2 shrink-0 mt-0.5`}>
                        {persona.emoji}
                      </div>
                    )}
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? `bg-gradient-to-br ${accentCls} text-white rounded-br-sm`
                        : "glass-1 text-foreground rounded-bl-sm"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Quick actions (show if < 3 messages) */}
              {messages.length < 3 && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
                  {quickActions.map(q => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={q.label}
                        onClick={() => send(q.prompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 glass-1 rounded-pill text-xs text-muted-foreground whitespace-nowrap hover:text-foreground transition-colors shrink-0"
                      >
                        <Icon className="w-3 h-3" />
                        {q.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Input */}
              <div className="px-4 pb-8 pt-2 shrink-0">
                <div className="flex items-center gap-2 glass-1 rounded-2xl px-3 py-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send(input)}
                    placeholder={`Ask ${persona.name} anything…`}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <button onClick={() => send(input)} className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo to-violet flex items-center justify-center shrink-0">
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
