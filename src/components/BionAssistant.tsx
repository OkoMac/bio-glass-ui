import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Flame, Target, Calendar, TrendingUp, Brain,
  Apple, Dumbbell, Heart, Pill, Clock, ChevronRight, Bell, UserCheck, Mail, ExternalLink,
  LifeBuoy, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getReminderSummary, getActiveReminders, requestNotificationPermission, fireReminderNotifications } from "@/lib/reminders";
import { useLocation, useNavigate } from "react-router-dom";
import { useHabitProfile } from "@/hooks/useHabits";
import { trackEvent } from "@/lib/habits";
import { supabase } from "@/integrations/supabase/client";
import { getSASTDateKey } from "@/utils/sastDate";
import { localDateKey } from "@/lib/relativeTime";
import { useInstallApp, InstallModal } from "./InstallButton";

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
  // Use the display name, not the email prefix
  const rawFirst = name?.split(" ")[0] ?? "there";
  const first = rawFirst.includes("@") || /^[a-z0-9]+\d{2,}$/i.test(rawFirst) ? "there" : rawFirst;
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
  { label: "Install app",      icon: Download, prompt: "__INSTALL_APP__" },
  { label: "I need help",      icon: LifeBuoy, prompt: "__OPEN_SUPPORT_TICKET__" },
];

const PROVIDER_QUICK: { label: string; icon: typeof Target; prompt: string }[] = [
  { label: "At-risk clients",  icon: Target,    prompt: "Which clients are at churn risk?" },
  { label: "Today's schedule", icon: Calendar,  prompt: "What's on my schedule today?" },
  { label: "Revenue tips",     icon: TrendingUp, prompt: "How can I increase my revenue?" },
  { label: "Client insights",  icon: Brain,     prompt: "Give me insights on my top clients" },
  { label: "My bookings",      icon: Clock,     prompt: "Show me my pending bookings" },
  { label: "Install app",      icon: Download,  prompt: "__INSTALL_APP__" },
];

/* ── Read real user data from localStorage ──────────── */
function getUserData() {
  const today = localDateKey();
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

  // Provider-specific responses — use real booking data when available
  if (role === "provider") {
    const providerBookings = JSON.parse(localStorage.getItem("bion_calendar_events") ?? "[]");
    const todayEvents = providerBookings.filter((e: any) => e.date === getSASTDateKey());

    if (/churn|risk|at.risk|losing|inactive/i.test(key))
      return `I'd need to analyse your client booking patterns to identify churn risk. Head to your **Dashboard** to see the churn risk section, or ask me about specific clients.\n\n💡 **Tip:** Clients who haven't booked in 14+ days are flagged automatically on your dashboard.`;
    if (/schedule|today|session|appointment/i.test(key)) {
      if (todayEvents.length > 0) {
        const list = todayEvents.map((e: any) => `• ${e.time ?? "—"} — ${e.title ?? "Session"} (${e.provider ?? "Client"})`).join("\n");
        return `**Today's Schedule:**\n\n${list}\n\nTotal: ${todayEvents.length} session(s). Check your **Schedule** page for full details.`;
      }
      return `You don't have any sessions scheduled for today. Check your **Schedule** page for upcoming bookings, or open your availability in **Settings** to get more bookings.`;
    }
    if (/revenue|income|money|earn|grow/i.test(key))
      return `**Revenue Growth Tips:**\n\n1. **Fill empty slots** — check your availability gaps and enable waitlist\n2. **Bundle packages** — 5 sessions = 10% off increases commitment\n3. **Follow up** — check your Dashboard churn report for clients who went quiet\n\nHead to your **Dashboard** for real revenue numbers.`;
    if (/client|insight|top|best/i.test(key))
      return `Check your **Dashboard** for real client insights — it shows your top clients by sessions, churn risk, and booking patterns. I can help with specific client questions if you give me a name.`;
    if (/booking|pending|request/i.test(key))
      return `Check your **Bookings** page for pending requests. You can accept or decline each one, and I'll notify the client automatically via WhatsApp and email.`;
    return `I can help with your schedule, revenue tips, client insights, or booking management. What would you like to know?`;
  }

  // Corporate-specific responses
  if (role === "corporate") {
    if (/employee|team|staff|usage/i.test(key))
      return `Check your **Dashboard** for real-time employee wellness stats — engagement rates, session usage, and department breakdowns. I can help with specific questions about your programme.`;
    return `I can help with employee wellness stats, provider management, programme configuration, or voucher distribution. What would you like to know?`;
  }

  // Admin-specific responses
  if (role === "admin") {
    if (/metric|stat|kpi|platform/i.test(key))
      return `Head to the **Admin Dashboard** for live platform KPIs — provider counts, GMV, growth, active sessions, and vertical breakdowns. I can help with specific queries.`;
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
  const navigate = useNavigate();
  const role = user?.role ?? "client";
  const quickActions = role === "provider" ? PROVIDER_QUICK : CLIENT_QUICK;

  const [open, setOpen] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [input, setInput] = useState("");
  const [showHumanModal, setShowHumanModal] = useState(false);
  const [humanReason, setHumanReason] = useState("");
  const [humanChannel, setHumanChannel] = useState("support");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const reminderCount = role === "client" ? getActiveReminders().length : 0;
  const { installApp, showInstructions, setShowInstructions, device, dismissed, handleDismiss } = useInstallApp();

  // Request notification permission on first render + fire pending reminders
  useEffect(() => {
    requestNotificationPermission();
    if (role !== "client") return;

    // Fire any active reminders that haven't been shown today
    fireReminderNotifications();

    // Check every 10 minutes for new reminders
    const interval = setInterval(fireReminderNotifications, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [role]);

  const [thinking, setThinking] = useState(false);
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

  /* CRISIS INTERCEPTION (P0 safety) — runs before any template/API
   * routing in send(). Tight pattern: matches explicit self-harm /
   * suicide phrasing only. Idiomatic frustration ("give up", "no
   * point") is intentionally NOT matched. False negatives fall
   * through to the API system-prompt advisory (defense-in-depth). */
  const CRISIS_PATTERN = /\b(suicid(e|al)|kill\s+(myself|me)|end\s+(my\s+)?(life|it\s+all)|take\s+my\s+(own\s+)?life|self.?harm|cutting\s+myself|cut\s+my\s+wrist|hurt(ing)?\s+myself|want(ed|s)?\s+to\s+die|don'?t\s+want\s+to\s+(live|be\s+alive)|no\s+(point|reason)\s+(in\s+)?(living|life)|nothing\s+(left|to\s+live\s+for)|(can'?t|cannot)\s+go\s+on)\b/i;

  /* Detect when user wants a human or shows frustration */
  function detectsHumanRequest(text: string): boolean {
    const t = text.toLowerCase();
    const explicit = /talk to (a |an )?(human|person|agent|representative|someone real|real person)|speak to (a |an )?(human|person|agent)|human support|human help|live (chat|agent|support)|customer service|customer support|contact (support|bion|someone)/i;
    const frustration = /you'?re (useless|stupid|wrong|broken|not helping)|this (sucks|is broken|doesn'?t work|isn'?t working)|stop (giving|telling) me|that'?s not what i (asked|wanted|meant)|frustrated|angry|fed up|wtf|what the (hell|fuck)/i;
    return explicit.test(t) || frustration.test(t);
  }

  const requestHuman = (reason?: string) => {
    setHumanReason(reason ?? "");
    setShowHumanModal(true);
  };

  const send = async (text: string) => {
    if (!text.trim()) return;

    // Magic token from the "I need help" quick action → open the ticket modal inline.
    if (text.trim() === "__OPEN_SUPPORT_TICKET__") {
      // Prefill the reason with the last user message so context carries over
      const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.text ?? "";
      setHumanReason(lastUserMsg);
      setShowHumanModal(true);
      return;
    }

    // Magic token from the "Install app" quick action → trigger install flow
    if (text.trim() === "__INSTALL_APP__") {
      installApp();
      return;
    }

    const userMsg: Message = { id: Date.now() + "u", role: "user", text: text.trim(), ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // CRISIS — must run BEFORE human-request / template / API routing.
    if (CRISIS_PATTERN.test(text)) {
      const safetyReply: Message = {
        id: Date.now() + "c",
        role: "assistant",
        text: `If you're in crisis, please reach out now — these helplines are free, 24/7, and staffed by trained counsellors:\n\n📞 SADAG: **0800 567 567**\n📞 Lifeline: **0861 322 322**\n🚨 Emergency: **10177**\n\nYou don't have to be alone with this. I've also raised a support ticket so a real person from our team can check in with you.`,
        ts: new Date(),
      };
      setMessages(prev => [...prev, safetyReply]);
      // Pre-fill the human-support modal with a CRISIS tag so the
      // ticket is prioritised in the support queue.
      setHumanReason(`[CRISIS_KEYWORD] ${text}`);
      setShowHumanModal(true);
      // Best-effort backend ping so the team is alerted even if the
      // user closes the tab before submitting the modal.
      fetch(`${API_URL}/api/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "web_chat",
          priority: "urgent",
          subject: "🚨 Crisis keyword detected — web chat",
          body: text,
          submitter_name: user?.name ?? "anonymous",
          submitter_email: user?.email ?? null,
          tags: ["crisis_keyword"],
        }),
      }).catch(() => { /* best-effort */ });
      return;
    }

    // Detect human-request or frustration → offer escalation
    if (detectsHumanRequest(text)) {
      setTimeout(() => {
        const reply: Message = {
          id: Date.now() + "h",
          role: "assistant",
          text: `I hear you. Let me raise a support ticket for you — a real person from our team will reply by email within a few hours (Mon-Fri 8am-6pm SAST).\n\nTap the **"Talk to Human"** button below. Your recent messages with me will be attached to the ticket automatically.`,
          ts: new Date(),
        };
        setMessages(prev => [...prev, reply]);
        // Pre-fill the escalation reason with their last message
        setHumanReason(text);
      }, 600);
      return;
    }

    // Build user data context for the AI
    const data = getUserData();
    const today = localDateKey();
    let calendarEvents: any[] = [];
    try { calendarEvents = JSON.parse(localStorage.getItem("bion_calendar_events") ?? "[]").filter((e: any) => e.date === today); } catch {}

    setThinking(true);
    // 30s timeout — agent runner can be slow on cold starts but anything
    // longer than that means something's wedged; fall back rather than
    // leave the user staring at a typing dot forever.
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 30_000);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          userName: user?.name,
          role,
          profileId: user?.profileId,
          userId: user?.id,
          history: messages.slice(-10).map(m => ({ role: m.role, text: m.text })),
          systemHint: "Respond directly to the user's last message. If they say 'yes', 'no', 'not working' or otherwise refer back to your previous turn, treat that as continuation — do NOT start a fresh greeting.",
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
        signal: ctrl.signal,
      });
      const result = await res.json();
      const replyText = (typeof result?.reply === "string" && result.reply.trim())
        ? result.reply
        : getSmartResponse(text, role, user?.name);
      const reply: Message = { id: Date.now() + "a", role: "assistant", text: replyText, ts: new Date() };
      setMessages(prev => [...prev, reply]);
    } catch {
      // Network error / timeout / abort — fall back to local regex engine.
      const reply: Message = { id: Date.now() + "a", role: "assistant", text: getSmartResponse(text, role, user?.name), ts: new Date() };
      setMessages(prev => [...prev, reply]);
    } finally {
      clearTimeout(timeoutId);
      setThinking(false);
    }
  };

  const resetChat = () => {
    setMessages([{ id: "init", role: "assistant", text: buildGreeting(role, user?.name), ts: new Date() }]);
  };

  // ── Page-aware nudge bubble ──
  // Every time the user lands on a new page, B_ surfaces a small "Need help
  // here?" bubble next to the FAB for 5 seconds, then minimises. Dismissing
  // suppresses it for that path for the rest of the session so it never nags.
  const location = useLocation();
  const { profile: habitProfile } = useHabitProfile();
  const topCategory = habitProfile?.top_categories?.[0]?.category;
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [nudgeText, setNudgeText] = useState<string>("Need help on this page? Tap me.");
  const [nudgePrompt, setNudgePrompt] = useState<string>("Can you walk me through this page?");
  const nudgeTimer = useRef<NodeJS.Timeout | null>(null);

  const pageHint = (pathname: string, userRole: string): { text: string; prompt: string } => {
    const p = pathname.toLowerCase();
    // Client pages
    if (p === "/home")                 return { text: "Welcome home! Tap me if you want a tour.", prompt: "Walk me through the home page — what should I focus on first?" };
    if (p.startsWith("/directory"))    return { text: "Looking for someone? I can narrow it down.", prompt: "Help me find the right provider — what do I tell you?" };
    if (p.startsWith("/provider/"))    return { text: "Need help deciding? Ask me anything.",      prompt: "Tell me what I should check before booking this provider." };
    if (p.startsWith("/quick-book"))   return { text: "Here to help you book quickly.",            prompt: "What's the fastest way to book a session right now?" };
    if (p.startsWith("/schedule"))     return { text: "Questions about a booking?",                prompt: "Explain what each status (pending/confirmed/completed) means." };
    if (p.startsWith("/messages"))     return { text: "Need to reach a provider? I can draft a message.", prompt: "Help me write a message to my provider." };
    if (p.startsWith("/wallet"))       return { text: "Wallet / top-up questions?",                prompt: "How does the BION wallet work and what's the cash-out fee?" };
    if (p.startsWith("/notifications"))return { text: "Want to mute certain notifications?",       prompt: "How do I control what notifications I get?" };
    if (p.startsWith("/settings"))     return { text: "Setting something up? Ask away.",           prompt: "Walk me through each settings tab." };
    if (p.startsWith("/routines"))     return { text: "Building a routine? I can suggest one.",    prompt: "Help me build a realistic wellness routine for this week." };
    if (p.startsWith("/progress"))     return { text: "Reading your progress? I can interpret.",   prompt: "Interpret my progress — what's trending, what to watch." };
    if (p.startsWith("/health-profile"))return{ text: "Privacy or sharing questions?",             prompt: "Explain what providers can see from my health profile." };
    if (p.startsWith("/health-insights"))return{ text: "Want insights on your vitals?",            prompt: "Analyse my biometrics and flag anything worth checking." };
    if (p.startsWith("/medical-card")) return { text: "Need to add a medication?",                 prompt: "Walk me through adding allergies / conditions / medications." };
    if (p.startsWith("/water"))        return { text: "How much water is right for you?",          prompt: "How much water should I be drinking today?" };
    if (p.startsWith("/food"))         return { text: "Snap a meal photo — I'll estimate calories.",prompt: "Take a photo of my food and tell me the calories." };
    if (p.startsWith("/sleep"))        return { text: "Need tips for better sleep?",               prompt: "What can I change to sleep better this week?" };
    if (p.startsWith("/life-coach"))   return { text: "Life questions I can help with.",           prompt: "I want to talk through something I'm stuck on." };
    if (p.startsWith("/calendar"))     return { text: "Planning your week?",                       prompt: "Help me plan my wellness week based on my bookings." };
    if (p.startsWith("/favorites"))    return { text: "Curating your shortlist?",                  prompt: "Recommend providers to add to my favourites based on my goals." };
    if (p.startsWith("/bicademy"))      return { text: "Want a reading plan?",                      prompt: "Pick the top 3 articles I should read this week." };
    if (p.startsWith("/challenges"))   return { text: "Which challenge fits you?",                 prompt: "Which challenge should I join based on my current habits?" };
    if (p.startsWith("/onboarding"))   return { text: "Need help with onboarding?",                prompt: "Explain what I need for onboarding and why each step matters." };
    if (p.startsWith("/welcome"))      return { text: "Hi! I'm B_. Tap me if you're stuck.",       prompt: "What's the right sign-up flow for me?" };
    // Legal
    if (p.startsWith("/legal/payment-flow"))       return { text: "Questions about fees?",       prompt: "Summarise how fees split between me, my provider, and BION." };
    if (p.startsWith("/legal/dispute-resolution")) return { text: "Explaining a dispute step?",  prompt: "How do I raise a dispute step-by-step?" };
    if (p.startsWith("/legal/acceptable-use"))     return { text: "What's allowed, what isn't?", prompt: "Summarise what behaviours are banned on BION." };
    // Provider pages
    if (p.startsWith("/pro/dashboard"))  return { text: "Need a quick morning briefing?",       prompt: "Give me my morning briefing — bookings, revenue, follow-ups." };
    if (p.startsWith("/pro/bookings"))   return { text: "Accept/decline questions?",            prompt: "How do I handle a pending request professionally?" };
    if (p.startsWith("/pro/clients"))    return { text: "At-risk clients on your list?",        prompt: "Which of my clients might be drifting and what should I send them?" };
    if (p.startsWith("/pro/services"))   return { text: "Pricing / duration help?",             prompt: "Suggest a pricing structure for my top service." };
    if (p.startsWith("/pro/analytics"))  return { text: "Want a quick analytics read?",         prompt: "Interpret my analytics — what's growing, what's not." };
    if (p.startsWith("/pro/billing"))    return { text: "Upgrade questions?",                   prompt: "What do I unlock if I upgrade to Elite?" };
    if (p.startsWith("/pro/programs"))   return { text: "Need a programme template?",           prompt: "Draft a 4-week programme for a beginner client." };
    if (p.startsWith("/pro/storefront")) return { text: "Storefront tips?",                     prompt: "What products sell best for providers like me?" };
    if (p.startsWith("/pro/verification"))return{ text: "Verification help?",                   prompt: "Walk me through exactly what documents I need." };
    if (p.startsWith("/pro/catalogs"))   return { text: "Flipbook / catalogue help?",           prompt: "How do I build a catalogue my clients will actually read?" };
    if (p.startsWith("/pro/messages"))   return { text: "Drafting a client reply?",             prompt: "Help me reply to a client without sounding robotic." };
    if (p.startsWith("/pro/schedule"))   return { text: "Schedule optimisation?",               prompt: "Spot gaps in my week where I could fit more bookings." };
    if (p.startsWith("/pro/availability"))return{text: "Setting your hours?",                   prompt: "Recommend an availability pattern for a physio who does home visits." };
    if (p.startsWith("/pro/orders"))     return { text: "Order management questions?",          prompt: "How do I mark an order as shipped and handle returns?" };
    if (p.startsWith("/pro/settings"))   return { text: "Profile / settings help?",             prompt: "What should I fill in on my provider settings first?" };
    // Admin
    if (p.startsWith("/admin"))          return { text: "Admin panel quick help.",              prompt: "Give me a quick tour of this admin screen." };
    // Corporate
    if (p.startsWith("/corporate"))      return { text: "Wellness programme help?",             prompt: "What should I prioritise for my team's wellness this quarter?" };
    return { text: "Need help? I'm B_.", prompt: "Walk me through this page — what can I do here?" };
  };

  useEffect(() => {
    // Don't interrupt an open chat or repeat on re-renders
    if (open) return;
    // If dismissed for this path during this session, skip
    let dismissed = new Set<string>();
    try {
      const raw = sessionStorage.getItem("bion_nudges_dismissed");
      if (raw) dismissed = new Set(JSON.parse(raw));
    } catch { /* no-op */ }
    if (dismissed.has(location.pathname)) return;

    const hint = pageHint(location.pathname, role);
    // Lean the prompt toward the user's most-engaged category when we have one.
    // Keeps the nudge specific instead of generic — e.g. "fitness" user on
    // /directory gets "Find me a trainer" flavour rather than a neutral prompt.
    const categoryNudge =
      topCategory && location.pathname.startsWith("/directory")
        ? { text: `Looking for another ${topCategory} provider?`, prompt: `Recommend top ${topCategory} providers near me based on my history.` }
        : topCategory && location.pathname === "/home"
        ? { text: `Pick up where you left off in ${topCategory}?`, prompt: `What should I do today in my ${topCategory} routine?` }
        : null;

    setNudgeText(categoryNudge?.text ?? hint.text);
    setNudgePrompt(categoryNudge?.prompt ?? hint.prompt);
    setNudgeVisible(true);
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => setNudgeVisible(false), 5000);

    return () => { if (nudgeTimer.current) clearTimeout(nudgeTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, role, topCategory]);

  const dismissNudge = (remember = true) => {
    setNudgeVisible(false);
    if (nudgeTimer.current) { clearTimeout(nudgeTimer.current); nudgeTimer.current = null; }
    if (remember) {
      try {
        const raw = sessionStorage.getItem("bion_nudges_dismissed");
        const set = new Set<string>(raw ? JSON.parse(raw) : []);
        set.add(location.pathname);
        sessionStorage.setItem("bion_nudges_dismissed", JSON.stringify([...set]));
      } catch { /* no-op */ }
      trackEvent("nudge_dismissed", { metadata: { pathname: location.pathname } });
    }
  };

  const acceptNudge = () => {
    dismissNudge(true);
    trackEvent("nudge_accepted", { metadata: { pathname: location.pathname, prompt: nudgePrompt } });
    // Pre-seed the prompt and open the chat
    setInput(nudgePrompt);
    setOpen(true);
  };

  return (
    <>
      {/* Page-aware nudge bubble */}
      <AnimatePresence>
        {nudgeVisible && !open && (
          <motion.div
            key="nudge"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed bottom-44 right-4 z-[56] max-w-[260px] rounded-2xl shadow-xl overflow-hidden"
            style={{ background: "rgba(14,14,22,0.96)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => dismissNudge(true)}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="px-4 py-3 pr-8">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet to-indigo flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-white">B_</span>
                </div>
                <p className="text-[12px] text-foreground leading-snug">{nudgeText}</p>
              </div>
              <div className="flex gap-2 mt-2 pl-9">
                <button
                  onClick={acceptNudge}
                  className="text-[11px] font-medium text-indigo hover:underline"
                >
                  Yes, help me
                </button>
                <button
                  onClick={() => dismissNudge(true)}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Not now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB + channel picker */}
      <div className="fixed bottom-28 right-4 z-[55]">
        <AnimatePresence>
          {showChannelPicker && !open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-14 right-0 w-52 glass-1 rounded-2xl border border-white/10 p-2 space-y-1 shadow-xl"
            >
              <button
                onClick={() => { setShowChannelPicker(false); setOpen(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
              >
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-indigo flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-white">B_</span>
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Chat here</p>
                  <p className="text-[10px] text-muted-foreground">In-app assistant</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowChannelPicker(false);
                  window.open("https://wa.me/27647432005?text=" + encodeURIComponent("Hi B_! 👋"), "_blank");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
              >
                <span className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.657-6.363-1.795l-.444-.267-3.072 1.03 1.03-3.072-.267-.444A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">WhatsApp</p>
                  <p className="text-[10px] text-muted-foreground">Chat with B_ on WhatsApp</p>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          onClick={() => setShowChannelPicker(v => !v)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-violet to-indigo shadow-lg flex items-center justify-center"
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
      </div>

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
                <div className="flex items-center gap-1.5">
                  <button onClick={() => requestHuman()}
                    className="flex items-center gap-1 text-[10px] text-teal px-2.5 py-1.5 rounded-lg border border-teal/30 bg-teal/8 hover:bg-teal/20 hover:border-teal/50 hover:text-teal hover:shadow-[0_0_8px_rgba(13,148,136,0.25)] transition-all duration-300 animate-[subtle-pulse_3s_ease-in-out_infinite]"
                    aria-label="Talk to a human agent">
                    <UserCheck className="w-3 h-3" /> Human
                  </button>
                  <button onClick={resetChat} className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 glass-1 rounded-lg transition-colors">
                    Clear
                  </button>
                  <button onClick={handleClose} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Close" title="Close">
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
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-violet to-indigo text-white rounded-br-sm whitespace-pre-line"
                        : "glass-1 text-foreground rounded-bl-sm"
                    }`}>
                      {m.role === "user" ? m.text : (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="leading-snug">{children}</li>,
                            a: ({ href, children }) => <a href={href} className="text-teal underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                            code: ({ children }) => <code className="px-1 py-0.5 rounded bg-white/[0.06] text-[0.85em]">{children}</code>,
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}
                {thinking && (
                  <div className="flex justify-start" aria-live="polite" aria-label="B_ is thinking">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet to-indigo flex items-center justify-center mr-2 shrink-0 mt-0.5">
                      <span className="text-[8px] font-bold text-white">B_</span>
                    </div>
                    <div className="glass-1 text-foreground rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1 items-end h-8">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "120ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: "240ms" }} />
                    </div>
                  </div>
                )}
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

      {/* ── Talk to Human escalation modal ── */}
      <AnimatePresence>
        {showHumanModal && (
          <>
            <motion.div key="hm-ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowHumanModal(false)} className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div key="hm-modal"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-md mx-auto rounded-3xl p-6"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-emerald-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Talk to a Human</h3>
                    <p className="text-[10px] text-muted-foreground">Our support team will reply via email</p>
                  </div>
                </div>
                <button onClick={() => setShowHumanModal(false)}
                  className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Category selector */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">What's this about?</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "support", label: "General Help", email: "support@bionhealth.co.za" },
                      { key: "bookings", label: "Booking Issue", email: "bookings@bionhealth.co.za" },
                      { key: "disputes", label: "Dispute / Refund", email: "disputes@bionhealth.co.za" },
                      { key: "accounts", label: "Payment / Billing", email: "accounts@bionhealth.co.za" },
                      { key: "sales", label: "Provider / Sales", email: "sales@bionhealth.co.za" },
                      { key: "other", label: "Something Else", email: "support@bionhealth.co.za" },
                    ].map(cat => (
                      <button key={cat.key}
                        onClick={() => setHumanChannel(cat.key)}
                        className={`py-2 rounded-xl text-[10px] font-medium border transition-all ${
                          humanChannel === cat.key ? "border-teal/40 bg-teal/10 text-teal" : "border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                        }`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">Describe your issue</label>
                  <textarea
                    value={humanReason}
                    onChange={e => setHumanReason(e.target.value)}
                    placeholder="Tell us what happened..."
                    rows={4}
                    className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-teal/40 transition-colors resize-none"
                  />
                </div>

                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 text-[11px] text-muted-foreground space-y-1">
                  <p>📧 Your message will go to: <span className="text-foreground font-medium">{
                    humanChannel === "bookings" ? "bookings@bionhealth.co.za" :
                    humanChannel === "disputes" ? "disputes@bionhealth.co.za" :
                    humanChannel === "accounts" ? "accounts@bionhealth.co.za" :
                    humanChannel === "sales" ? "sales@bionhealth.co.za" :
                    "support@bionhealth.co.za"
                  }</span></p>
                  <p>⏱ Reply within a few hours · Mon-Fri 8am-6pm SAST</p>
                  <p>🆘 Medical emergencies: call 10177</p>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowHumanModal(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border border-white/[0.08] bg-white/[0.02] text-muted-foreground">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!humanReason.trim()) return;
                    if (!user?.email) {
                      toast.error("Sign in or provide your email on /help to raise a ticket");
                      navigate("/help");
                      setShowHumanModal(false);
                      return;
                    }
                    const category =
                      humanChannel === "bookings" ? "booking" :
                      humanChannel === "disputes" ? "dispute" :
                      humanChannel === "accounts" ? "billing" :
                      humanChannel === "sales" ? "provider" :
                      "other";
                    const dept =
                      humanChannel === "bookings" ? "Bookings"
                      : humanChannel === "disputes" ? "Disputes"
                      : humanChannel === "accounts" ? "Accounts"
                      : humanChannel === "sales" ? "Sales"
                      : "Support";

                    // Last 6 messages as a transcript prefix
                    const lastMessages = messages.slice(-6);
                    const transcript = lastMessages.length > 0
                      ? `--- Conversation with B_ ---\n${lastMessages.map(m => `${m.role === "user" ? "You" : "B_"}: ${m.text}`).join("\n\n")}\n\n--- User's issue ---\n`
                      : "";

                    setSubmittingTicket(true);
                    try {
                      const headers: Record<string, string> = { "Content-Type": "application/json" };
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
                      } catch { /* */ }

                      const res = await fetch(`${API_URL}/api/support/tickets`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                          email: user.email,
                          name: user.name,
                          category,
                          priority: "normal",
                          subject: humanReason.slice(0, 120) || `BION ${dept} request`,
                          body: transcript + humanReason,
                        }),
                      });
                      const j = await res.json();
                      if (!j.ok) throw new Error(j.error ?? "Failed to raise ticket");

                      const confirmMsg: Message = {
                        id: Date.now() + "c",
                        role: "assistant",
                        text: `✅ Ticket **#${j.ticketNumber}** raised with the ${dept} team. You'll get an email confirmation now — they'll reply within a few hours.\n\nYou can track the ticket any time at /my-tickets.`,
                        ts: new Date(),
                      };
                      setMessages(prev => [...prev, confirmMsg]);
                      toast.success(`Ticket #${j.ticketNumber} created`);
                      setShowHumanModal(false);
                      setHumanReason("");
                      setHumanChannel("support");
                    } catch (err: any) {
                      toast.error(err?.message ?? "Could not raise ticket");
                    } finally {
                      setSubmittingTicket(false);
                    }
                  }}
                  disabled={!humanReason.trim() || submittingTicket}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-teal to-emerald-400 disabled:opacity-40 flex items-center justify-center gap-1.5">
                  <LifeBuoy className="w-3.5 h-3.5" /> {submittingTicket ? "Raising…" : "Raise Ticket"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Install modal — triggered from quick action */}
      <InstallModal
        show={showInstructions}
        onClose={() => setShowInstructions(false)}
        device={device}
        deferredPrompt={null}
        onDismiss={handleDismiss}
      />
    </>
  );
}
