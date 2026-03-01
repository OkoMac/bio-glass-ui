import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import CoachAI from "@/components/CoachAI";
import {
  ArrowLeft, MessageSquare, Calendar, Star, AlertTriangle,
  CheckCircle, Plus, Send, Award, Flame, ClipboardList,
  TrendingUp, Activity, FileText, Gift, ChevronRight,
  Clock, Target, Edit3, Trash2, X
} from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

/* ── mock CRM data (in prod, fetched by client ID) ─────────── */
const CLIENTS: Record<string, {
  id: string; name: string; image: string; vertical: string;
  email: string; phone: string; goal: string; risk: string;
  sessions: number; totalSpend: number; nextBooking: string;
  joinedAt: string; lastVisit: string; wellnessScore: number;
  streak: number; bioPoints: number; tags: string[];
  sessionHistory: { date: string; service: string; notes: string; rating: number }[];
  activeTasks: { id: string; label: string; due: string; done: boolean; type: string }[];
  providerNotes: { id: string; text: string; date: string; pinned: boolean }[];
  prescriptions: { id: string; title: string; type: string; progress: number }[];
  rewardsGiven: { label: string; points: number; date: string }[];
}> = {
  c1: {
    id: "c1", name: "Mpho Sithole", image: provider1, vertical: "teal",
    email: "mpho@example.com", phone: "082 555 0001",
    goal: "Weight loss + strength", risk: "low",
    sessions: 18, totalSpend: 8100, nextBooking: "Mon 3 Mar 3pm",
    joinedAt: "Jun 2024", lastVisit: "Today", wellnessScore: 72, streak: 14, bioPoints: 2450,
    tags: ["Regular", "Referred 2", "Loves HIIT"],
    sessionHistory: [
      { date: "26 Feb", service: "PT Session — Upper Body",    notes: "PB on bench press. Adjust tricep volume next week.", rating: 5 },
      { date: "24 Feb", service: "PT Session — Lower Body",    notes: "Slight knee discomfort — kept load light.",           rating: 4 },
      { date: "21 Feb", service: "Strength Assessment",         notes: "Improved 1RM by 8% since December.",                rating: 5 },
      { date: "19 Feb", service: "PT Session — Full Body",     notes: "Great energy. Hit all targets.",                     rating: 5 },
      { date: "17 Feb", service: "Free Intro — Nutrition Chat",notes: "Discussed meal timing around sessions.",             rating: 5 },
    ],
    activeTasks: [
      { id: "t1", label: "Complete Week 4 upper body routine",      due: "Tomorrow",  done: false, type: "workout" },
      { id: "t2", label: "Log meals for 3 days (check-in required)",due: "Fri 7 Mar", done: false, type: "nutrition" },
      { id: "t3", label: "20-min walk on rest days",                due: "Ongoing",   done: false, type: "cardio" },
      { id: "t4", label: "Foam roll quads 5 min post-workout",      due: "Ongoing",   done: true,  type: "recovery" },
    ],
    providerNotes: [
      { id: "n1", text: "Lactose intolerant — avoid dairy in meal plan suggestions.", date: "Jan 10", pinned: true },
      { id: "n2", text: "Loves HIIT but needs to control heart rate zones. Cap at Z4.", date: "Feb 5", pinned: false },
      { id: "n3", text: "Referred Thandi and one other — give loyalty reward next session.", date: "Feb 19", pinned: true },
    ],
    prescriptions: [
      { id: "pr1", title: "Week 4 Upper Body Strength", type: "workout",   progress: 60 },
      { id: "pr2", title: "February Meal Plan",         type: "nutrition", progress: 75 },
    ],
    rewardsGiven: [
      { label: "Consistency Star",     points: 200, date: "Feb 1"  },
      { label: "Referral Bonus",       points: 300, date: "Feb 14" },
    ],
  },
  c2: {
    id: "c2", name: "Thandi Khumalo", image: provider2, vertical: "indigo",
    email: "thandi@example.com", phone: "083 555 0002",
    goal: "Post-pregnancy fitness", risk: "low",
    sessions: 12, totalSpend: 5400, nextBooking: "Wed 5 Mar 10am",
    joinedAt: "Nov 2024", lastVisit: "Today", wellnessScore: 58, streak: 6, bioPoints: 780,
    tags: ["Regular", "Doctor cleared"],
    sessionHistory: [
      { date: "25 Feb", service: "PT Session",     notes: "Core work only. No high impact yet.", rating: 4 },
      { date: "22 Feb", service: "PT Session",     notes: "Good progress. Added light HIIT.",    rating: 5 },
    ],
    activeTasks: [
      { id: "t1", label: "Pelvic floor exercises 2×/day", due: "Daily",    done: false, type: "rehab"   },
      { id: "t2", label: "30-min gentle walk",            due: "Daily",    done: true,  type: "cardio"  },
      { id: "t3", label: "Protein target: 120g/day",      due: "Ongoing",  done: false, type: "nutrition"},
    ],
    providerNotes: [
      { id: "n1", text: "Doctor cleared for exercise at 12 weeks postpartum. No jumping until 16 weeks.", date: "Dec 1", pinned: true },
    ],
    prescriptions: [
      { id: "pr1", title: "Postpartum Recovery Plan",  type: "rehab",   progress: 40 },
    ],
    rewardsGiven: [],
  },
  c3: {
    id: "c3", name: "Kobus Pretorius", image: provider3, vertical: "coral",
    email: "kobus@example.com", phone: "071 555 0003",
    goal: "Powerlifting", risk: "high",
    sessions: 7, totalSpend: 2450, nextBooking: "Sat 7 Mar",
    joinedAt: "Jan 2025", lastVisit: "10 Feb", wellnessScore: 44, streak: 0, bioPoints: 330,
    tags: ["At risk", "High no-show"],
    sessionHistory: [
      { date: "10 Feb", service: "PT Session",  notes: "Called 45 min before to cancel. Re-booked.", rating: 3 },
      { date: "3 Feb",  service: "PT Session",  notes: "Solid session. Strong lifter but ego lifts.",  rating: 4 },
    ],
    activeTasks: [
      { id: "t1", label: "Re-confirm Saturday session by Thursday", due: "Thu 6 Mar", done: false, type: "admin" },
    ],
    providerNotes: [
      { id: "n1", text: "High no-show rate. Implement 24h confirmation policy with this client.", date: "Feb 15", pinned: true },
      { id: "n2", text: "Ego lifts. Watch form on squat — lower back risk.", date: "Feb 3", pinned: false },
    ],
    prescriptions: [],
    rewardsGiven: [],
  },
  c4: {
    id: "c4", name: "Naledi Moyo", image: provider4, vertical: "amber",
    email: "naledi@example.com", phone: "079 555 0004",
    goal: "General fitness", risk: "low",
    sessions: 9, totalSpend: 4050, nextBooking: "Fri 6 Mar 9am",
    joinedAt: "Mar 2024", lastVisit: "Today", wellnessScore: 85, streak: 31, bioPoints: 5100,
    tags: ["Regular", "Morning only"],
    sessionHistory: [
      { date: "26 Feb", service: "PT Session", notes: "Outstanding session. 31-day streak maintained.", rating: 5 },
      { date: "24 Feb", service: "PT Session", notes: "Introduced new cardio intervals.",              rating: 5 },
    ],
    activeTasks: [
      { id: "t1", label: "Daily 15-min yoga morning flow", due: "Daily", done: true, type: "flexibility" },
    ],
    providerNotes: [
      { id: "n1", text: "Morning sessions only — non-negotiable. Has work commitments from 9:30am.", date: "Mar 2024", pinned: true },
      { id: "n2", text: "Marathon training starting April. Adjust programme to support running.", date: "Feb 20", pinned: false },
    ],
    prescriptions: [
      { id: "pr1", title: "General Fitness Plan", type: "workout", progress: 85 },
    ],
    rewardsGiven: [
      { label: "Iron Commitment Award", points: 500, date: "Jan 31" },
      { label: "31-Day Streak Bonus",   points: 300, date: "Feb 26" },
    ],
  },
};

const TYPE_ICON: Record<string, string> = {
  workout: "💪", nutrition: "🥗", cardio: "🏃", recovery: "🧊",
  rehab: "🦴", flexibility: "🧘", admin: "📋",
};

const REWARD_OPTIONS = [
  { label: "Consistency Star",    points: 200 },
  { label: "Best Client Award",   points: 300 },
  { label: "Progress Champion",   points: 250 },
  { label: "Streak Warrior",      points: 400 },
  { label: "Referral Bonus",      points: 300 },
  { label: "Session Superstar",   points: 150 },
];

type DetailTab = "overview" | "sessions" | "tasks" | "notes" | "rewards";

export default function ProviderClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = CLIENTS[id ?? "c1"] ?? CLIENTS.c1;

  const [tab, setTab]             = useState<DetailTab>("overview");
  const [newNote, setNewNote]     = useState("");
  const [newTask, setNewTask]     = useState("");
  const [taskDue, setTaskDue]     = useState("");
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedReward, setSelectedReward]   = useState<typeof REWARD_OPTIONS[number] | null>(null);
  const [tasks, setTasks]         = useState(client.activeTasks);
  const [notes, setNotes]         = useState(client.providerNotes);
  const [rewards, setRewards]     = useState(client.rewardsGiven);

  const riskColor = client.risk === "high" ? "text-coral" : client.risk === "medium" ? "text-amber" : "text-teal";

  const toggleTask = (tid: string) =>
    setTasks(prev => prev.map(t => t.id === tid ? { ...t, done: !t.done } : t));

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [{ id: Date.now().toString(), text: newNote.trim(), date: "Today", pinned: false }, ...prev]);
    setNewNote("");
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), label: newTask.trim(), due: taskDue || "Ongoing", done: false, type: "workout" }]);
    setNewTask(""); setTaskDue("");
  };

  const giveReward = () => {
    if (!selectedReward) return;
    setRewards(prev => [{ label: selectedReward.label, points: selectedReward.points, date: "Today" }, ...prev]);
    setShowRewardModal(false); setSelectedReward(null);
  };

  const TABS: { id: DetailTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "sessions", label: "Sessions" },
    { id: "tasks",    label: "Tasks"    },
    { id: "notes",    label: "Notes"    },
    { id: "rewards",  label: "Rewards"  },
  ];

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-28 md:pb-8 space-y-5">

        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/pro/clients")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Clients
          </button>
          <div className="flex gap-2">
            <button onClick={() => navigate("/pro/messages")}
              className="flex items-center gap-1.5 px-3 py-1.5 glass-1 rounded-pill text-xs text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> Message
            </button>
            <button onClick={() => navigate("/pro/bookings")}
              className="flex items-center gap-1.5 px-3 py-1.5 gradient-indigo rounded-pill text-xs text-primary-foreground">
              <Calendar className="w-3.5 h-3.5" /> Book
            </button>
          </div>
        </div>

        {/* Identity card */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-4">
            <img src={client.image} alt={client.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
                {client.risk !== "low" && <AlertTriangle className={`w-4 h-4 shrink-0 ${riskColor}`} />}
              </div>
              <p className="text-xs text-muted-foreground">{client.goal}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{client.email} · {client.phone}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {client.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 glass-1 rounded-pill text-muted-foreground">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: "Sessions",   value: String(client.sessions)       },
              { label: "LTV",        value: `R${client.totalSpend.toLocaleString()}` },
              { label: "Streak",     value: client.streak > 0 ? `${client.streak}d 🔥` : "—" },
              { label: "Wellness",   value: `${client.wellnessScore}/100` },
            ].map(s => (
              <div key={s.label} className="glass-1 rounded-xl p-2.5 text-center">
                <p className="text-sm font-bold font-data text-foreground">{s.value}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Next booking */}
          {client.nextBooking !== "—" && (
            <div className="flex items-center gap-2 mt-3 glass-accent-indigo rounded-xl px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-indigo" />
              <span className="text-xs text-indigo font-medium">Next: {client.nextBooking}</span>
            </div>
          )}
        </GlassCard>

        {/* Tabs */}
        <div className="flex gap-1 glass-1 p-1 rounded-2xl overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all ${
                tab === t.id ? "gradient-indigo text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Active prescriptions */}
            {client.prescriptions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Programmes</p>
                <div className="space-y-2">
                  {client.prescriptions.map(p => (
                    <GlassCard key={p.id} className="p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{p.type === "workout" ? "💪" : p.type === "nutrition" ? "🥗" : "🦴"}</span>
                          <p className="text-sm font-semibold text-foreground">{p.title}</p>
                        </div>
                        <span className="text-xs text-indigo font-semibold">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo to-violet" style={{ width: `${p.progress}%` }} />
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}

            {/* Pending tasks */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Out-of-Session Tasks</p>
              <div className="space-y-1.5">
                {tasks.filter(t => !t.done).slice(0, 3).map(t => (
                  <GlassCard key={t.id} className="p-3 flex items-center gap-3">
                    <span className="text-base">{TYPE_ICON[t.type] ?? "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground">Due: {t.due}</p>
                    </div>
                    <button onClick={() => { setTab("tasks"); }} className="text-[10px] text-indigo">View all</button>
                  </GlassCard>
                ))}
                {tasks.filter(t => !t.done).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">All tasks complete! 🎉</p>
                )}
              </div>
            </div>

            {/* Pinned notes */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pinned Notes</p>
              {notes.filter(n => n.pinned).map(n => (
                <GlassCard key={n.id} className="p-3.5 mb-2">
                  <p className="text-sm text-foreground leading-relaxed">{n.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.date}</p>
                </GlassCard>
              ))}
            </div>

            {/* Give reward shortcut */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowRewardModal(true)}
              className="w-full py-3 glass-1 rounded-2xl text-sm font-semibold text-amber flex items-center justify-center gap-2 border border-amber/20"
            >
              <Gift className="w-4 h-4" /> Give Client a Reward
            </motion.button>
          </div>
        )}

        {/* ── Session History ── */}
        {tab === "sessions" && (
          <div className="space-y-2">
            {client.sessionHistory.map((s, i) => (
              <GlassCard key={i} className="p-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{s.service}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">{s.date}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">"{s.notes}"</p>
                  </div>
                  <div className="flex shrink-0 ml-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`w-3 h-3 ${j < s.rating ? "text-amber fill-amber" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* ── Tasks (out-of-session) ── */}
        {tab === "tasks" && (
          <div className="space-y-4">
            {/* Add task */}
            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-foreground mb-3">Assign New Task</p>
              <input
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="e.g. 20-min walk every morning"
                className="w-full glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none mb-2"
              />
              <div className="flex gap-2">
                <input
                  value={taskDue}
                  onChange={e => setTaskDue(e.target.value)}
                  placeholder="Due (e.g. Fri 7 Mar)"
                  className="flex-1 glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <motion.button whileTap={{ scale: 0.95 }} onClick={addTask}
                  className="px-4 py-2 gradient-indigo rounded-xl text-xs font-semibold text-primary-foreground">
                  Assign
                </motion.button>
              </div>
            </GlassCard>

            <div className="space-y-2">
              {tasks.map(t => (
                <GlassCard key={t.id} className={`p-3.5 flex items-center gap-3 ${t.done ? "opacity-60" : ""}`}>
                  <button onClick={() => toggleTask(t.id)}>
                    {t.done
                      ? <CheckCircle className="w-5 h-5 text-teal" />
                      : <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                    }
                  </button>
                  <span className="text-lg">{TYPE_ICON[t.type] ?? "📌"}</span>
                  <div className="flex-1">
                    <p className={`text-sm text-foreground ${t.done ? "line-through" : ""}`}>{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">Due: {t.due}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {tab === "notes" && (
          <div className="space-y-4">
            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-foreground mb-3">Add Note</p>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="e.g. Mentioned knee pain during warm-up…"
                rows={3}
                className="w-full glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-2"
              />
              <motion.button whileTap={{ scale: 0.95 }} onClick={addNote}
                className="w-full py-2 gradient-indigo rounded-xl text-xs font-semibold text-primary-foreground">
                Save Note
              </motion.button>
            </GlassCard>

            <div className="space-y-2">
              {notes.map(n => (
                <GlassCard key={n.id} className={`p-3.5 ${n.pinned ? "border border-amber/20" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {n.pinned && <span className="text-[10px] text-amber font-semibold">📌 Pinned · </span>}
                      <span className="text-[10px] text-muted-foreground">{n.date}</span>
                      <p className="text-sm text-foreground leading-relaxed mt-1">{n.text}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Rewards ── */}
        {tab === "rewards" && (
          <div className="space-y-4">
            <GlassCard className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Rewards given</p>
                <p className="text-lg font-bold text-amber">{rewards.length} rewards · {rewards.reduce((a, r) => a + r.points, 0)} pts sent</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowRewardModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 gradient-indigo rounded-xl text-xs font-semibold text-primary-foreground">
                <Gift className="w-3.5 h-3.5" /> Give Reward
              </motion.button>
            </GlassCard>

            <div className="space-y-2">
              {rewards.length === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">No rewards given yet. Recognise great clients! 🌟</p>
              )}
              {rewards.map((r, i) => (
                <GlassCard key={i} className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber/10 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-amber" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground">{r.date}</p>
                  </div>
                  <span className="text-sm font-bold text-amber">+{r.points} pts</span>
                </GlassCard>
              ))}
            </div>

            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-foreground mb-1">Why reward clients?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Recognising good clients with BIOPoints boosts retention by up to 40%. Points can be redeemed for free sessions, wallet credits, or premium badges — at no cost to you.
              </p>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Reward modal */}
      <AnimatePresence>
        {showRewardModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRewardModal(false)} className="fixed inset-0 bg-obsidian/70 z-50" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] pb-safe"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)" }}
            >
              <div className="px-5 pt-5 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-foreground">Give {client.name.split(" ")[0]} a Reward</h3>
                  <button onClick={() => setShowRewardModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="space-y-2 mb-4">
                  {REWARD_OPTIONS.map(r => (
                    <button key={r.label} onClick={() => setSelectedReward(r)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm ${
                        selectedReward?.label === r.label
                          ? "border-amber/40 bg-amber/10 text-amber"
                          : "border-white/08 glass-1 text-foreground"
                      }`}>
                      <span>{r.label}</span>
                      <span className="text-xs font-bold">+{r.points} pts</span>
                    </button>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={giveReward} disabled={!selectedReward}
                  className="w-full py-3 gradient-indigo rounded-2xl text-sm font-bold text-primary-foreground disabled:opacity-40">
                  Send Reward 🎁
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CoachAI />
      <ProviderNav />
    </div>
  );
}
