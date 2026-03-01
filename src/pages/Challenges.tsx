import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import CoachAI from "@/components/CoachAI";
import {
  Flame, Trophy, Users, Target, Clock, CheckCircle,
  Lock, ChevronRight, Medal, Star, Zap, Plus
} from "lucide-react";

/* ── types ───────────────────────────────────────────────────── */
type ChallengeStatus = "active" | "completed" | "locked" | "available";
type ChallengeCategory = "fitness" | "mindfulness" | "nutrition" | "consistency" | "social";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  status: ChallengeStatus;
  participants: number;
  daysLeft?: number;
  daysTotal: number;
  progress: number; // 0–100
  reward: string;
  rewardPoints: number;
  createdBy: string; // "BIO" or provider name
  badge: string;
  difficulty: "easy" | "medium" | "hard";
  tasks: { label: string; done: boolean }[];
}

/* ── mock data ──────────────────────────────────────────────── */
const CHALLENGES: Challenge[] = [
  {
    id: "ch1",
    title: "7-Day Morning Movement",
    description: "Start every morning with at least 10 minutes of movement — walk, stretch, or workout.",
    category: "consistency",
    status: "active",
    participants: 247,
    daysLeft: 3,
    daysTotal: 7,
    progress: 57,
    reward: "R50 Wallet Credit",
    rewardPoints: 500,
    createdBy: "BION",
    badge: "🌅",
    difficulty: "easy",
    tasks: [
      { label: "Day 1 — 10 min walk",         done: true  },
      { label: "Day 2 — Morning stretch",      done: true  },
      { label: "Day 3 — 15 min jog",          done: true  },
      { label: "Day 4 — Yoga flow",           done: true  },
      { label: "Day 5 — Strength circuit",    done: false },
      { label: "Day 6 — Active recovery",     done: false },
      { label: "Day 7 — Celebration workout", done: false },
    ],
  },
  {
    id: "ch2",
    title: "Hydration Hero",
    description: "Drink 2.5L of water daily for 14 days. Log each day using the check-in.",
    category: "nutrition",
    status: "active",
    participants: 512,
    daysLeft: 10,
    daysTotal: 14,
    progress: 28,
    reward: "Hydration Badge + 300 pts",
    rewardPoints: 300,
    createdBy: "BION",
    badge: "💧",
    difficulty: "easy",
    tasks: [
      { label: "Day 1 ✓", done: true  },
      { label: "Day 2 ✓", done: true  },
      { label: "Day 3 ✓", done: true  },
      { label: "Day 4 ✓", done: true  },
      { label: "Day 5",   done: false },
      { label: "Day 6",   done: false },
      { label: "Day 7",   done: false },
    ],
  },
  {
    id: "ch3",
    title: "Lisa's February Shred",
    description: "Complete all 4 scheduled PT sessions this month AND hit daily step goals.",
    category: "fitness",
    status: "active",
    participants: 18,
    daysLeft: 1,
    daysTotal: 28,
    progress: 75,
    reward: "1 Free Session with Lisa",
    rewardPoints: 1000,
    createdBy: "Lisa Dlamini",
    badge: "💪",
    difficulty: "hard",
    tasks: [
      { label: "Session 1 complete",   done: true  },
      { label: "Session 2 complete",   done: true  },
      { label: "Session 3 complete",   done: true  },
      { label: "Session 4 complete",   done: false },
      { label: "10k steps — 20 days",  done: false },
    ],
  },
  {
    id: "ch4",
    title: "Mindfulness March",
    description: "5 minutes of meditation or breathing exercises every day for 21 days.",
    category: "mindfulness",
    status: "available",
    participants: 89,
    daysLeft: undefined,
    daysTotal: 21,
    progress: 0,
    reward: "Mindfulness Badge + 400 pts",
    rewardPoints: 400,
    createdBy: "BION",
    badge: "🧘",
    difficulty: "easy",
    tasks: [],
  },
  {
    id: "ch5",
    title: "Bring a Buddy",
    description: "Refer 2 friends to BION and complete a joint session together.",
    category: "social",
    status: "available",
    participants: 34,
    daysLeft: undefined,
    daysTotal: 30,
    progress: 0,
    reward: "Social Badge + R100 credit",
    rewardPoints: 700,
    createdBy: "BION",
    badge: "🤝",
    difficulty: "medium",
    tasks: [],
  },
  {
    id: "ch6",
    title: "30-Day Body Reset",
    description: "Advanced challenge: 4 workouts/week, clean eating, weekly check-in with provider.",
    category: "fitness",
    status: "locked",
    participants: 7,
    daysLeft: undefined,
    daysTotal: 30,
    progress: 0,
    reward: "Elite Badge + R250 credit",
    rewardPoints: 2000,
    createdBy: "Lisa Dlamini",
    badge: "🏆",
    difficulty: "hard",
    tasks: [],
  },
  {
    id: "ch7",
    title: "Posture Perfect Week",
    description: "Complete the 7-day rehab mobility programme prescribed by Dr. Kagiso.",
    category: "fitness",
    status: "completed",
    participants: 29,
    daysLeft: 0,
    daysTotal: 7,
    progress: 100,
    reward: "Earned: 500 pts + Rehab Badge",
    rewardPoints: 500,
    createdBy: "Dr. Kagiso Sithole",
    badge: "🦴",
    difficulty: "medium",
    tasks: [],
  },
];

const LEADERBOARD = [
  { rank: 1, name: "Naledi Moyo",    points: 5100, badge: "🏆", streak: 31 },
  { rank: 2, name: "You",            points: 2450, badge: "💪", streak: 14, isMe: true },
  { rank: 3, name: "Thandi Khumalo", points: 780,  badge: "🔥", streak: 6  },
  { rank: 4, name: "Amir K.",        points: 520,  badge: "⚡", streak: 3  },
  { rank: 5, name: "Busisiwe M.",    points: 310,  badge: "🌱", streak: 2  },
];

const CAT_COLORS: Record<ChallengeCategory, string> = {
  fitness:     "text-teal   bg-teal/10   border-teal/20",
  mindfulness: "text-indigo bg-indigo/10 border-indigo/20",
  nutrition:   "text-amber  bg-amber/10  border-amber/20",
  consistency: "text-violet bg-violet/10 border-violet/20",
  social:      "text-coral  bg-coral/10  border-coral/20",
};

const DIFF_CLS = { easy: "text-teal", medium: "text-amber", hard: "text-coral" };

type Tab = "active" | "available" | "completed" | "leaderboard";

export default function ChallengesPage() {
  const [tab, setTab]     = useState<Tab>("active");
  const [detail, setDetail] = useState<Challenge | null>(null);
  const [joined, setJoined] = useState<Set<string>>(new Set());

  const active    = CHALLENGES.filter(c => c.status === "active");
  const available = CHALLENGES.filter(c => c.status === "available");
  const completed = CHALLENGES.filter(c => c.status === "completed");
  const locked    = CHALLENGES.filter(c => c.status === "locked");

  const displayed =
    tab === "active"      ? active :
    tab === "available"   ? [...available, ...locked] :
    tab === "completed"   ? completed : [];

  const join = (id: string) => setJoined(prev => { const s = new Set(prev); s.add(id); return s; });

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="max-w-lg mx-auto px-4 pt-12 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-[26px] font-bold text-foreground">Challenges</h1>
          <p className="text-xs text-muted-foreground">
            {active.length} active · {available.length} to join · {completed.length} completed
          </p>
        </div>

        {/* BIONPoints mini card */}
        <GlassCard className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-indigo flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your BIONPoints</p>
              <p className="text-lg font-bold font-data text-foreground">2,450</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Rank</p>
            <p className="text-sm font-bold text-amber">#2 this month</p>
          </div>
        </GlassCard>

        {/* Tabs */}
        <div className="flex gap-1 glass-1 p-1 rounded-2xl">
          {([["active","Active"], ["available","Join"], ["completed","Done"], ["leaderboard","🏆 Board"]] as [Tab,string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-medium transition-all ${
                tab === id ? "gradient-indigo text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {tab === "leaderboard" && (
          <div className="space-y-2">
            {LEADERBOARD.map((entry) => (
              <motion.div key={entry.rank} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: entry.rank * 0.05 }}>
                <GlassCard className={`p-3.5 ${entry.isMe ? "border border-indigo/30" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-5 text-center ${entry.rank === 1 ? "text-amber" : entry.rank === 2 ? "text-foreground/60" : "text-muted-foreground"}`}>
                      {entry.rank}
                    </span>
                    <span className="text-2xl">{entry.badge}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${entry.isMe ? "text-indigo" : "text-foreground"}`}>
                        {entry.name}{entry.isMe && " (You)"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Flame className="w-3 h-3 text-amber" />
                        <span className="text-[10px] text-muted-foreground">{entry.streak}-day streak</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold font-data text-foreground">{entry.points.toLocaleString()} pts</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Challenge cards */}
        {tab !== "leaderboard" && (
          <div className="space-y-3">
            {displayed.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard
                  hover={c.status !== "locked"}
                  className={`p-4 cursor-pointer ${c.status === "locked" ? "opacity-60" : ""}`}
                  onClick={() => c.status !== "locked" && setDetail(c)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl shrink-0">{c.badge}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-foreground">{c.title}</p>
                        {c.status === "locked" && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                        {c.status === "completed" && <CheckCircle className="w-3.5 h-3.5 text-teal shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{c.description}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-pill border capitalize ${CAT_COLORS[c.category]}`}>{c.category}</span>
                        <span className={`text-[10px] font-semibold capitalize ${DIFF_CLS[c.difficulty]}`}>{c.difficulty}</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Users className="w-2.5 h-2.5" />{c.participants}
                        </span>
                        {c.daysLeft !== undefined && c.daysLeft > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-amber">
                            <Clock className="w-2.5 h-2.5" />{c.daysLeft}d left
                          </span>
                        )}
                      </div>

                      {/* Progress bar (active only) */}
                      {c.status === "active" && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">{c.progress}% complete</span>
                            <span className="text-[10px] text-amber font-semibold">+{c.rewardPoints} pts</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${c.progress}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-indigo to-violet"
                            />
                          </div>
                        </div>
                      )}

                      {/* Reward line */}
                      <p className="text-[10px] text-teal mt-2">🏅 {c.reward}</p>
                      {c.createdBy !== "BION" && (
                        <p className="text-[9px] text-muted-foreground">by {c.createdBy}</p>
                      )}
                    </div>
                    {c.status !== "locked" && c.status !== "completed" && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}

            {displayed.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">Nothing here yet.</div>
            )}
          </div>
        )}
      </div>

      {/* Challenge detail drawer */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetail(null)}
              className="fixed inset-0 bg-obsidian/70 z-50"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden pb-safe"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", maxHeight: "90vh" }}
            >
              <div className="overflow-y-auto" style={{ maxHeight: "90vh" }}>
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>
                <div className="px-5 pb-10 space-y-4">
                  {/* Hero */}
                  <div className="flex items-start gap-4 pt-2">
                    <span className="text-5xl">{detail.badge}</span>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-foreground">{detail.title}</h2>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{detail.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-pill border capitalize ${CAT_COLORS[detail.category]}`}>{detail.category}</span>
                        <span className={`text-[10px] font-semibold capitalize ${DIFF_CLS[detail.difficulty]}`}>{detail.difficulty}</span>
                        {detail.createdBy !== "BION" && (
                          <span className="text-[10px] glass-1 px-2 py-0.5 rounded-pill text-muted-foreground">by {detail.createdBy}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Participants", value: String(detail.participants) },
                      { label: "Duration",     value: `${detail.daysTotal} days`   },
                      { label: "Reward",       value: `${detail.rewardPoints} pts` },
                    ].map(s => (
                      <GlassCard key={s.label} className="p-3 text-center">
                        <p className="text-sm font-bold text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                      </GlassCard>
                    ))}
                  </div>

                  {/* Progress */}
                  {detail.status === "active" && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <p className="text-xs font-semibold text-foreground">Your Progress</p>
                        <span className="text-xs text-indigo">{detail.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 mb-3">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo to-violet transition-all" style={{ width: `${detail.progress}%` }} />
                      </div>
                      <div className="space-y-2">
                        {detail.tasks.map((t, i) => (
                          <div key={i} className="flex items-center gap-3 py-1.5">
                            {t.done
                              ? <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                              : <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                            }
                            <p className={`text-sm ${t.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reward */}
                  <GlassCard className="p-3.5 flex items-center gap-3">
                    <Medal className="w-5 h-5 text-amber shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Prize</p>
                      <p className="text-sm font-bold text-foreground">{detail.reward}</p>
                    </div>
                  </GlassCard>

                  {/* CTA */}
                  {detail.status === "available" && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { join(detail.id); setDetail(null); }}
                      className="w-full py-3.5 gradient-indigo rounded-2xl text-sm font-bold text-primary-foreground flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      {joined.has(detail.id) ? "Joined! ✓" : "Join Challenge"}
                    </motion.button>
                  )}
                  {detail.status === "active" && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3.5 glass-accent-teal rounded-2xl text-sm font-bold text-teal"
                    >
                      Log Today's Activity ✓
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CoachAI />
      <BottomNav />
    </div>
  );
}
