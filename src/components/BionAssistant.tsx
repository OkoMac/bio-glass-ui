import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Flame, Target, Calendar, TrendingUp, Brain,
  Apple, Dumbbell, Heart, Pill, Clock, ChevronRight, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getReminderSummary, getActiveReminders, requestNotificationPermission } from "@/lib/reminders";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  ts: Date;
}

/* ── B_ persona — adapts by role ─────────────────────── */
const hour = new Date().getHours();
const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

function buildGreeting(role: string, name?: string): string {
  const first = name?.split(" ")[0] ?? "there";
  if (role === "provider")
    return `Good ${greeting}, ${first}! I'm B_ — your business AI assistant. I can help you manage clients, spot churn risk, grow revenue, and build better programmes. What do you need?`;
  if (role === "corporate")
    return `Welcome back, ${first}. B_ here — ready to report on your team's wellness stats, manage employee programmes, or help configure your wellness benefits.`;
  if (role === "admin")
    return `Good ${greeting}. B_ standing by. I can summarise platform metrics, flag anomalies, manage providers, or help draft comms. How can I assist?`;
  return `Good ${greeting}, ${first}! I'm B_ — your personal health, wellness & beauty AI assistant. I have access to all your activities, routines, meals, medication, biometrics, and appointments. How can I help you today?`;
}

/* ── Quick actions — role-specific ──────────────────── */
const CLIENT_QUICK: { label: string; icon: typeof Target; prompt: string }[] = [
  { label: "Today's plan",     icon: Target,   prompt: "What should I focus on today?" },
  { label: "My calories",      icon: Apple,    prompt: "How are my calories looking today?" },
  { label: "Check routines",   icon: Dumbbell, prompt: "Show me my active routines and progress" },
  { label: "Health check",     icon: Heart,    prompt: "Analyse my overall health and flag any issues" },
  { label: "Medication",       icon: Pill,     prompt: "What medication do I need to take today?" },
  { label: "This week",        icon: Calendar, prompt: "Show me my calendar for this week" },
  { label: "Reminders",        icon: Bell,     prompt: "What do I need to do today?" },
];

const PROVIDER_QUICK: { label: string; icon: typeof Target; prompt: string }[] = [
  { label: "At-risk clients",  icon: Target,    prompt: "Which clients are at churn risk?" },
  { label: "Today's schedule", icon: Calendar,  prompt: "What's on my schedule today?" },
  { label: "Revenue tips",     icon: TrendingUp, prompt: "How can I increase my revenue?" },
  { label: "Client insights",  icon: Brain,     prompt: "Give me insights on my top clients" },
  { label: "My bookings",      icon: Clock,     prompt: "Show me my pending bookings" },
];

/* ── Read real user data from localStorage ──────────── */
function getUserData() {
  const today = new Date().toISOString().split("T")[0];
  let foodEntries: any[] = [];
  let routines: any[] = [];
  let waterCount = 0;
  let calGoal = 2000;

  try { foodEntries = JSON.parse(localStorage.getItem("bion_food_tracker") ?? "[]"); } catch {}
  try { routines = JSON.parse(localStorage.getItem("bion_routines") ?? "[]"); } catch {}
  try { waterCount = parseInt(localStorage.getItem(`bion_water_${today}`) ?? "0"); } catch {}
  try { calGoal = JSON.parse(localStorage.getItem("bion_food_goals") ?? "{}").calories ?? 2000; } catch {}

  const todayFood = foodEntries.filter((e: any) => e.date === today);
  const totalCal = todayFood.reduce((s: number, e: any) => s + (e.calories ?? 0), 0);
  const totalProtein = todayFood.reduce((s: number, e: any) => s + (e.protein ?? 0), 0);
  const activeRoutines = routines.length;
  const providerRoutines = routines.filter((r: any) => r.createdBy === "provider").length;
  const selfRoutines = routines.filter((r: any) => r.createdBy === "self").length;

  return { todayFood, totalCal, totalProtein, calGoal, waterCount, activeRoutines, providerRoutines, selfRoutines, routines };
}

/* ── Smart response engine ──────────────────────────── */
function getSmartResponse(input: string, role: string, userName?: string): string {
  const key = input.toLowerCase().trim();
  const first = userName?.split(" ")[0] ?? "there";
  const data = getUserData();

  // Provider-specific responses
  if (role === "provider") {
    if (/churn|risk|at.risk|losing|inactive/i.test(key))
      return `**Churn Risk Report:**\n\n🔴 **High risk (2):**\n  • Kobus P. — 11 days since last session (usually 2×/week)\n  • Amir K. — went quiet after session 5\n\n🟡 **Medium risk (1):**\n  • Thandi M. — frequency dropped from 3×/week to 1×\n\n💡 **B_ suggestion:** I can draft personalised check-in messages for each. Want that?`;
    if (/schedule|today|session|appointment/i.test(key))
      return `**Today's Schedule:**\n\n• 09:00 — Mpho Sithole (PT session)\n• 11:00 — Thandi Maseko (Fitness assessment)\n• 15:00 — Naledi Dube (Yoga)\n\n📊 Kobus cancelled Saturday — that slot is still open.\nTotal expected revenue today: R1,200.\n\nWant me to fill the gap with a waitlist client?`;
    if (/revenue|income|money|earn|grow/i.test(key))
      return `**Revenue Growth Tips:**\n\nYour occupancy rate is 78%. Three strategies:\n\n1. **Add a 6am slot** — 40% of your clients prefer early sessions\n2. **Bundle package** — 5 sessions = 10% off (increases commitment)\n3. **Follow up with Amir K.** — high value client who went quiet (R800/session)\n\nProjected impact: +R3,200/month if all three are implemented.`;
    if (/client|insight|top|best/i.test(key))
      return `**Client Insights:**\n\n🥇 **Mpho Sithole** — 18 sessions, R8,100 LTV, refers others, never a no-show. Consider a loyalty reward.\n🥈 **Thandi Maseko** — consistent, growing fast. May be ready for a premium programme.\n🥉 **Naledi Dube** — new but engaged (4 sessions in 2 weeks).\n\nOverall: 87% client retention rate (industry avg: 72%). Well done!`;
    if (/booking|pending|request/i.test(key))
      return `**Pending Bookings:**\n\n📩 2 new requests:\n  • Lerato M. — PT session, Thursday 10am\n  • James O. — Fitness assessment, Friday 3pm\n\n✅ 3 confirmed for this week\n❌ 1 cancelled (Kobus, Saturday)\n\nWant me to auto-confirm or shall I hold for your review?`;
    return `I'm analysing your business data. Based on your bookings, clients, and revenue — your practice is performing well. Want me to look at churn risk, revenue opportunities, or client insights?`;
  }

  // Corporate-specific responses
  if (role === "corporate") {
    if (/employee|team|staff|usage/i.test(key))
      return `**Team Wellness Report:**\n\n👥 42 employees enrolled\n✅ 28 active this month (67% engagement)\n📊 Average 2.3 sessions/employee/month\n\nTop departments: Sales (89% active), Engineering (72%), Marketing (58%)\nBottom: Finance (34%) — consider targeted wellness campaigns.\n\nWant me to generate a detailed engagement report?`;
    return `I can help with employee wellness stats, provider management, programme configuration, or voucher distribution. What would you like to know?`;
  }

  // Admin-specific responses
  if (role === "admin") {
    if (/metric|stat|kpi|platform/i.test(key))
      return `**Platform KPIs:**\n\n👥 858 providers, 1,240 clients\n📊 GMV this month: R482,000\n📈 Growth: +18% MoM\n🔥 Active sessions: 3,420\n\nTop vertical: Fitness (42%), Medical (28%), Beauty (22%)\n\nAny anomalies to flag?`;
    return `B_ admin mode. I can pull platform metrics, review provider applications, flag compliance issues, or help draft communications. What do you need?`;
  }

  // Reminders — reads from reminder engine
  if (/remind|need to do|pending|to.?do|what.*today|upcoming|don.?t forget/i.test(key)) {
    return getReminderSummary();
  }

  // Food/calories — reads real data
  if (/calori|food|eat|ate|meal|diet|nutrition/i.test(key)) {
    const pct = Math.round((data.totalCal / data.calGoal) * 100);
    const remaining = data.calGoal - data.totalCal;
    if (data.todayFood.length === 0)
      return `You haven't logged any meals today yet. Head to the Food Tracker to start logging — take a photo of your food and I'll estimate the calories automatically. Your daily goal is ${data.calGoal} kcal.`;
    return `**Today's Nutrition:**\n\nYou've had **${data.totalCal} kcal** so far — that's ${pct}% of your ${data.calGoal} kcal goal.\nProtein: ${data.totalProtein}g\nMeals logged: ${data.todayFood.length}\n${remaining > 0 ? `You have ${remaining} kcal remaining.` : `⚠️ You're ${Math.abs(remaining)} kcal over your goal.`}\n\n💧 Water: ${data.waterCount} glasses today.\n\n${data.totalProtein < 60 ? "Your protein looks low — add chicken, eggs, or a shake." : "Protein looks good!"}`;
  }

  // Routines — reads real data
  if (/routine|workout|exercise|training|gym/i.test(key)) {
    if (data.activeRoutines === 0)
      return `You don't have any routines yet. You can create your own or get one assigned by a provider. Head to Routines to get started!`;
    const summary = data.routines.slice(0, 5).map((r: any) => {
      const icon = r.type === "workout" ? "🏋️" : r.type === "rehab" ? "🩺" : r.type === "skincare" ? "✨" : r.type === "medication" ? "💊" : r.type === "wellness" ? "🧘" : r.type === "beauty" ? "💅" : r.type === "meal" ? "🥗" : "🔥";
      return `${icon} **${r.title}** — Day ${r.daysCompleted}/${r.totalDays}${r.schedule ? ` (${r.schedule})` : ""}`;
    }).join("\n");
    return `You have **${data.activeRoutines} active routines** (${data.providerRoutines} from providers, ${data.selfRoutines} personal):\n\n${summary}\n\nWant me to open a specific routine?`;
  }

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

  // Focus/plan — powered by real reminders
  if (/focus|plan|priority/i.test(key)) {
    const active = getActiveReminders();
    if (active.length > 0) {
      const lines = active.slice(0, 7).map((r, i) => `${i + 1}. ${r.icon} ${r.title} — ${r.body}`);
      return `**${first}'s Plan for Today:**\n\n${lines.join("\n")}\n\n${active.length > 7 ? `...and ${active.length - 7} more.` : ""}\nAsk me to check any of these in detail!`;
    }
    return `**${first}'s Plan for Today:**\n\nNo pending reminders! You're all caught up. Here's what you could do:\n\n1. 🥗 Log your meals in the Food Tracker\n2. 💧 Track your water intake\n3. 📅 Check your calendar for upcoming appointments\n4. 💪 Start a routine session\n\nKeep the momentum going!`;
  }

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
  const role = user?.role ?? "client";
  const quickActions = role === "provider" ? PROVIDER_QUICK : CLIENT_QUICK;

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const reminderCount = role === "client" ? getActiveReminders().length : 0;

  // Request notification permission on first render
  useEffect(() => { requestNotificationPermission(); }, []);

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [{ id: "init", role: "assistant", text: buildGreeting(role, user?.name), ts: new Date() }];
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

  const API_URL = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now() + "u", role: "user", text: text.trim(), ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Build user data context for the AI
    const data = getUserData();
    const today = new Date().toISOString().split("T")[0];
    let calendarEvents: any[] = [];
    try { calendarEvents = JSON.parse(localStorage.getItem("bion_calendar_events") ?? "[]").filter((e: any) => e.date === today); } catch {}

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          userName: user?.name,
          role,
          userId: user?.id,
          userData: {
            calories: data.totalCal,
            calGoal: data.calGoal,
            protein: data.totalProtein,
            water: data.waterCount,
            routines: data.routines.map((r: any) => ({ title: r.title, type: r.type, daysCompleted: r.daysCompleted, totalDays: r.totalDays })),
            reminders: getActiveReminders().map(r => ({ title: r.title, body: r.body })),
            events: calendarEvents.map((e: any) => ({ title: e.title, time: e.time, provider: e.provider })),
          },
        }),
      });
      const result = await res.json();
      const reply: Message = { id: Date.now() + "a", role: "assistant", text: result.reply, ts: new Date() };
      setMessages(prev => [...prev, reply]);
    } catch {
      // Fallback to local regex engine if API unavailable
      const reply: Message = { id: Date.now() + "a", role: "assistant", text: getSmartResponse(text, role, user?.name), ts: new Date() };
      setMessages(prev => [...prev, reply]);
    }
  };

  const resetChat = () => {
    setMessages([{ id: "init", role: "assistant", text: buildGreeting(role, user?.name), ts: new Date() }]);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-28 right-4 z-[55] w-12 h-12 rounded-full bg-gradient-to-br from-violet to-indigo shadow-lg flex items-center justify-center"
        aria-label={`Open B_ Assistant${reminderCount > 0 ? ` (${reminderCount} reminders)` : ""}`}
      >
        <span className="text-sm font-bold text-white">B_</span>
        {reminderCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center border-2 border-obsidian px-1">
            {reminderCount}
          </span>
        ) : (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-teal border-2 border-obsidian" />
        )}
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
                      <span className="text-[10px] text-teal">Online · Commit to yourself</span>
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
                  {quickActions.map(q => {
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
              <div className="px-4 pt-2 shrink-0" style={{ paddingBottom: "max(3rem, env(safe-area-inset-bottom, 3rem))" }}>
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
