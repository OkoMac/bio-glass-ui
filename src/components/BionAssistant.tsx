import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Flame, Target, Calendar, TrendingUp, Brain,
  Apple, Dumbbell, Heart, Pill, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  ts: Date;
}

/* ── B_ persona ──────────────────────────────────────── */
const hour = new Date().getHours();
const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

function buildGreeting(name?: string): string {
  const first = name?.split(" ")[0] ?? "there";
  return `Good ${greeting}, ${first}! I'm B_ — your personal health, wellness & beauty AI assistant. I have access to all your activities, routines, meals, medication, biometrics, and appointments. How can I help you today?`;
}

/* ── Quick actions ──────────────────────────────────── */
const QUICK_ACTIONS: { label: string; icon: typeof Target; prompt: string }[] = [
  { label: "Today's plan",     icon: Target,   prompt: "What should I focus on today?" },
  { label: "My calories",      icon: Apple,    prompt: "How are my calories looking today?" },
  { label: "Check routines",   icon: Dumbbell, prompt: "Show me my active routines and progress" },
  { label: "Health check",     icon: Heart,    prompt: "Analyse my overall health and flag any issues" },
  { label: "Medication",       icon: Pill,     prompt: "What medication do I need to take today?" },
  { label: "This week",        icon: Calendar, prompt: "Show me my calendar for this week" },
];

/* ── Smart response engine ──────────────────────────── */
function getSmartResponse(input: string, userName?: string): string {
  const key = input.toLowerCase().trim();
  const first = userName?.split(" ")[0] ?? "there";

  // Food/calories
  if (/calori|food|eat|ate|meal|diet|nutrition/i.test(key))
    return `Let me check your food log... Today you've had approximately 1,450 kcal so far — that's 73% of your 2,000 kcal goal. Your protein is looking good at 85g. I'd suggest a high-protein dinner (grilled chicken or salmon) to hit your macro targets. Would you like me to suggest a meal plan for this evening?`;

  // Routines
  if (/routine|workout|exercise|training|gym/i.test(key))
    return `You have 4 active routines:\n\n🏋️ **Strength & Conditioning** — 29% complete (Day 8/28, Mon/Wed/Fri)\n🩺 **Post-Session Recovery** — 21% complete (Day 3/14, Tue/Thu/Sat)\n✨ **Weekly Skincare** — 17% complete (Day 5/30, Daily)\n💊 **Medication Schedule** — 13% complete (Day 12/90, Daily)\n\nYour next session is Strength training today. Want me to open it?`;

  // Health analysis
  if (/health|issue|problem|flag|analy|check|diagnos/i.test(key))
    return `**B_ Health Analysis for ${first}:**\n\n✅ **Good**: Sleep averaging 7.4h (above 7h target), resting HR 58bpm (excellent), 14-day activity streak\n\n⚠️ **Watch**: Body fat at 17.4% — trending down but protein intake low some days. Hydration dropped below 6 glasses on 3 of the last 7 days.\n\n🔴 **Action needed**: Your recovery routine (physio) shows low compliance — only 3 of 14 days completed. Consider booking a follow-up session.\n\nShall I create a personalised improvement plan?`;

  // Medication
  if (/medic|pill|supplement|vitamin|prescri/i.test(key))
    return `**Today's Medication Schedule:**\n\n☀️ **Morning (with breakfast):**\n  • Multivitamin — 1 tab\n  • Omega-3 fish oil — 1 cap\n  • Vitamin D3 (1000 IU) — 1 tab\n\n🌙 **Evening (before bed):**\n  • Magnesium glycinate — 1 tab\n  • Probiotic — 1 cap\n\n✅ Morning: Taken\n⏳ Evening: Pending\n\nWould you like me to set a reminder for tonight?`;

  // Calendar/schedule
  if (/calendar|schedule|week|today|tomorrow|appointment|book/i.test(key))
    return `**This Week's Schedule:**\n\n📅 **Mon**: Strength training (routine), Lisa — PT at 5pm\n📅 **Tue**: Recovery routine, Skincare PM\n📅 **Wed**: Strength training, Meal prep day\n📅 **Thu**: Recovery routine, Dr. Vicki — Chiro at 3pm\n📅 **Fri**: Strength training\n📅 **Sat**: Recovery routine, Annique — Facial at 10am\n📅 **Sun**: Rest day, Meal prep\n\n3 bookings this week. Want me to add anything?`;

  // Beauty/skincare
  if (/beauty|skin|facial|hair|nail|glow/i.test(key))
    return `Your **skincare routine** from Annique Beauty is 17% complete. Today's steps:\n\n☀️ **AM**: Cleanse → Tone → Vitamin C serum → Moisturise + SPF\n🌙 **PM**: Double cleanse → Tone → Hyaluronic acid → Retinol (tonight is a retinol night)\n\nYou have a facial booked for Saturday at 10am. Your skin hydration tracker shows improvement over the last week. Keep it up!`;

  // Sleep
  if (/sleep|rest|tired|energy/i.test(key))
    return `**Sleep Analysis:**\n\nLast 7 nights average: 7.4 hours (target: 7.5h)\nBest night: Sunday — 8.2h\nWorst night: Wednesday — 6.1h (late screen time detected)\n\n💡 **B_ Tip**: Your sleep quality drops when you exercise after 8pm. Try to complete workouts before 7pm. Consider a magnesium supplement 30 min before bed — it's already in your medication routine.`;

  // Mental health
  if (/mental|stress|anxiety|meditation|mindful|mood/i.test(key))
    return `**Mental Wellness Check:**\n\nYour stress score is 4.2/10 — that's improved from 5.8 two weeks ago! Your goal is under 4.\n\n🧘 **Recommended today:**\n  • 10-min guided meditation (breathing focus)\n  • 15-min nature walk\n  • Evening journaling\n\n📊 Mood patterns show you feel best on days you exercise before noon and get 7+ hours of sleep. Today checks both boxes!`;

  // Focus/plan
  if (/focus|plan|today|priority/i.test(key))
    return `**${first}'s Plan for Today:**\n\n1. 💊 Take morning supplements ✅\n2. 🏋️ Strength & Conditioning (Mon routine) — 7 exercises\n3. 🥗 Track meals (you're at 1,450/2,000 kcal)\n4. 💧 Drink 8 glasses of water (currently 5)\n5. ✨ PM skincare routine\n6. 💊 Evening supplements\n7. 😴 In bed by 10:30pm for 7.5h target\n\nYou're 1 session away from the 🏆 Consistency badge! Let's make it count.`;

  // Biometrics
  if (/biometric|heart|step|weight|bmi|body/i.test(key))
    return `**Your Biometrics (synced):**\n\n⚖️ Weight: 74.2 kg (↓1.9 this month)\n📊 Body Fat: 17.4% (↓0.7)\n💪 Lean Mass: 61.3 kg (↑0.3)\n❤️ Resting HR: 58 bpm (excellent)\n👟 Steps today: 6,240 / 10,000\n😴 Sleep last night: 7.6h\n🩸 SpO2: 98% (normal)\n\nAll vitals looking healthy! Your weight trend is on track for your 72kg goal by April.`;

  // Progress
  if (/progress|streak|badge|achieve|goal/i.test(key))
    return `**Your Progress Summary:**\n\n🔥 14-day streak (personal best: 21 days)\n✅ 12 sessions completed this month\n📊 Top 15% of BION users\n\n**Goals:**\n  • Reach 72kg — 48% there\n  • Body fat under 15% — 35% there\n  • Run 10km — 60% there\n\n**Badges earned:** Consistent Starter, First Session, Hydration Hero\n**Next badge:** 🏆 Consistency (1 more day!)`;

  return `Great question, ${first}! I'm analysing your data across all your health, wellness, and beauty activities. Based on your routines, meals, medication, and biometrics — everything looks on track. Is there something specific you'd like me to drill into? I can check your nutrition, routines, sleep patterns, skin care progress, or flag potential health concerns.`;
}

const STORAGE_KEY = "bion_b_chat";

/* ── B_ Assistant Component ────────────────────────── */
export default function BionAssistant() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [{ id: "init", role: "assistant", text: buildGreeting(user?.name), ts: new Date() }];
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300); }, [open]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); }, [messages]);

  const handleClose = () => {
    setOpen(false);
    setInput("");
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now() + "u", role: "user", text: text.trim(), ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      const reply: Message = { id: Date.now() + "a", role: "assistant", text: getSmartResponse(text, user?.name), ts: new Date() };
      setMessages(prev => [...prev, reply]);
    }, 800);
  };

  const resetChat = () => {
    setMessages([{ id: "init", role: "assistant", text: buildGreeting(user?.name), ts: new Date() }]);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-28 right-4 z-[55] w-12 h-12 rounded-full bg-gradient-to-br from-violet to-indigo shadow-lg flex items-center justify-center"
        aria-label="Open B_ Assistant"
      >
        <span className="text-sm font-bold text-white">B_</span>
        <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-teal border-2 border-obsidian" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleClose} className="fixed inset-0 bg-obsidian/50 z-50" />
            <motion.div key="panel"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] flex flex-col"
              style={{ height: "85vh", background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet to-indigo flex items-center justify-center">
                    <span className="text-sm font-bold text-white">B_</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">B_ Assistant</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                      <span className="text-[10px] text-teal">Online · Full access to your data</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={resetChat} className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 glass-1 rounded-lg transition-colors">
                    Clear
                  </button>
                  <button onClick={handleClose} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet to-indigo flex items-center justify-center mr-2 shrink-0 mt-0.5">
                        <span className="text-[8px] font-bold text-white">B_</span>
                      </div>
                    )}
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-violet to-indigo text-white rounded-br-sm"
                        : "glass-1 text-foreground rounded-bl-sm"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Quick actions */}
              {messages.length < 3 && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
                  {QUICK_ACTIONS.map(q => {
                    const Icon = q.icon;
                    return (
                      <button key={q.label} onClick={() => send(q.prompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 glass-1 rounded-pill text-xs text-muted-foreground whitespace-nowrap hover:text-foreground transition-colors shrink-0">
                        <Icon className="w-3 h-3" /> {q.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Input */}
              <div className="px-4 pb-12 pt-2 shrink-0">
                <div className="flex items-center gap-2 glass-1 rounded-2xl px-3 py-2">
                  <input ref={inputRef} value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send(input)}
                    placeholder="Ask B_ anything..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                  <button onClick={() => send(input)}
                    className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet to-indigo flex items-center justify-center shrink-0">
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
