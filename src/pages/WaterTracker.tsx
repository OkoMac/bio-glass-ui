import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { ArrowLeft, Droplets, Plus, Minus, Trophy, Target, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AdBanner from "@/components/AdBanner";
import { useActivityPoints } from "@/hooks/useActivityPoints";
import { useNativeHealth } from "@/hooks/useNativeHealth";
import { haptics } from "@/lib/haptics";
import { usePageView } from "@/hooks/usePageView";
import { useFeatureDiscovery } from "@/hooks/useFeatureDiscovery";
import { trackEvent } from "@/lib/habits";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "bion_water_tracker";
const STREAK_KEY = "bion_water_streak";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getStoredData(dateKey: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const base = all[dateKey] || { glasses: 0, goal: 8, log: [] };
    // Reconcile across the three places water can be incremented:
    //   • this page (writes glasses + log together)
    //   • FoodTracker / BionAssistant / dashboard (write the flat key only)
    //   • the log array itself (length is the audit trail)
    // Source of truth is the highest count, and the log is padded so the
    // totals and "Today's Log" never disagree (reported 2026-04-28 — the
    // 2000ml/100% banner showed while only 5 log lines were visible).
    const flat = parseInt(localStorage.getItem(`bion_water_${dateKey}`) ?? "0") || 0;
    const baseGlasses = base.glasses ?? 0;
    const log: Array<{ time: string; amount: string }> = Array.isArray(base.log) ? base.log : [];
    const glasses = Math.max(flat, baseGlasses, log.length);
    if (glasses > log.length) {
      const fill = Array.from({ length: glasses - log.length }, () => ({ time: "—", amount: "250ml" }));
      return { ...base, glasses, log: [...log, ...fill] };
    }
    return { ...base, glasses, log };
  } catch { return { glasses: 0, goal: 8, log: [] }; }
}

function saveData(dateKey: string, data: any) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[dateKey] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    // Mirror the glass count to the flat per-day key that BionAssistant,
    // BiometricsDashboard, Index, FoodTracker and reminders all read from.
    // Keeping both keys in sync avoids the "I logged water here but the home
    // screen still says 0 glasses" bug.
    localStorage.setItem(`bion_water_${dateKey}`, String(data.glasses ?? 0));
  } catch {}
}

function getStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const { count, lastDate } = JSON.parse(raw);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    if (lastDate === todayKey() || lastDate === yesterdayKey) return count;
    return 0;
  } catch { return 0; }
}

function updateStreak(hitGoal: boolean) {
  try {
    const current = getStreak();
    const raw = localStorage.getItem(STREAK_KEY);
    const prev = raw ? JSON.parse(raw) : { count: 0, lastDate: "" };
    if (hitGoal) {
      if (prev.lastDate === todayKey()) return; // already counted today
      const newCount = current + 1;
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: todayKey() }));
    }
  } catch {}
}

function getMilestoneMessage(pct: number): string | null {
  if (pct >= 100) return "🎉 Goal achieved! You're fully hydrated!";
  if (pct >= 75) return "💪 Almost there! Just a few more glasses!";
  if (pct >= 50) return "🌊 Halfway! Keep the momentum going!";
  if (pct >= 25) return "💧 Great start! You're on your way!";
  return null;
}

// Circular progress ring
function WaterRing({ current, goal }: { current: number; goal: number }) {
  const pct = Math.min(current / goal, 1);
  const r = 80, stroke = 10;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx="100" cy="100" r={r} fill="none"
          stroke="url(#tealGrad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <Droplets className="w-6 h-6 text-teal-400 mb-1" />
        <span className="text-3xl font-bold text-foreground">{current}</span>
        <span className="text-xs text-muted-foreground">of {goal} glasses</span>
      </div>
    </div>
  );
}

const WATER_FAQ_DATA = [
  { q: "How much water should I drink per day?", a: "Most health authorities recommend about 2 litres (8 glasses of 250 ml) per day for adults. However, your needs may be higher if you exercise, live in a hot climate like many parts of South Africa, or are breastfeeding." },
  { q: "Does coffee count as water intake?", a: "Coffee and tea do contribute to your daily fluid intake, but caffeine has a mild diuretic effect. It is best to count them partially and still aim to drink plain water for most of your hydration needs." },
  { q: "Signs of dehydration?", a: "Common signs include dark yellow urine, dry mouth, fatigue, dizziness, and headaches. Severe dehydration can cause rapid heartbeat and confusion. If you experience these symptoms, increase your water intake and seek medical advice if they persist." },
];

export default function WaterTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dateKey] = useState(todayKey);
  const [data, setData] = useState(() => getStoredData(todayKey()));
  const [streak, setStreak] = useState(getStreak);
  const [milestone, setMilestone] = useState<string | null>(null);
  const { awardPoints } = useActivityPoints();
  const native = useNativeHealth();
  usePageView();
  const { showTip } = useFeatureDiscovery();

  useEffect(() => {
    showTip("water-tracker", "Tip: Set a daily goal and log each glass throughout the day.");
  }, [showTip]);

  useEffect(() => { document.title = "Free Daily Water Intake Tracker | BION"; }, []);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: WATER_FAQ_DATA.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  // Persist on change (localStorage + Supabase)
  useEffect(() => {
    saveData(dateKey, data);
    const pct = (data.glasses / data.goal) * 100;
    const msg = getMilestoneMessage(pct);
    if (msg) setMilestone(msg);
    if (pct >= 100) {
      updateStreak(true);
      setStreak(getStreak());
    }
    // Sync to Supabase health_logs so wellness score can see it
    if (user?.profileId && !user.id?.startsWith("demo_") && data.glasses > 0) {
      supabase.from("health_logs").upsert({
        user_id: user.profileId,
        date: dateKey,
        water_glasses: data.glasses,
        notes: `Goal: ${data.goal} glasses`,
      }, { onConflict: "user_id,date" }).then(({ error }) => {
        if (error && import.meta.env.DEV) console.warn("[water] DB sync failed:", error.message);
      });
    }
  }, [data, dateKey]);

  const addGlass = () => {
    if (data.glasses >= data.goal * 2) return; // cap at 2x goal
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setData((prev: any) => ({
      ...prev,
      glasses: prev.glasses + 1,
      log: [...prev.log, { time: timestamp, amount: "250ml" }],
    }));
    // Award 1 point per glass logged, capped at 8 (one daily goal worth) via the
    // hook's idempotency: ref ID = today's date, so DB unique would prevent double-count.
    // We keep it simple here — points awarded per click; the yearly cap protects abuse.
    awardPoints("log_water", `${dateKey}-glass-${data.glasses + 1}`).catch(() => {});
    trackEvent("tool_use", { category: "wellness_tracking", metadata: { tool: "water", amount_ml: 250 } });
    // Native: write 250ml back to Apple Health so other apps see BION as a contributor.
    // No-op on web. Best-effort — never blocks the UI.
    native.writeWater(0.25).catch(() => {});
    // Tactile feedback on native
    haptics.light();
  };

  const removeGlass = () => {
    if (data.glasses <= 0) return;
    setData((prev: any) => ({
      ...prev,
      glasses: prev.glasses - 1,
      log: prev.log.slice(0, -1),
    }));
  };

  const adjustGoal = (delta: number) => {
    setData((prev: any) => ({
      ...prev,
      goal: Math.max(1, Math.min(20, prev.goal + delta)),
    }));
  };

  const pct = Math.round((data.glasses / data.goal) * 100);
  const ml = data.glasses * 250;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Free Daily Water Intake Tracker</h1>
            <p className="text-xs text-muted-foreground">Stay hydrated, stay healthy</p>
          </div>
        </div>

        {!user && (
          <div className="mx-4 mb-3 p-3 rounded-2xl glass-1 border border-indigo/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Sign up free to save your progress and unlock full features</p>
            <a href="/welcome" className="rounded-pill px-3 py-1.5 text-xs font-semibold gradient-indigo text-primary-foreground shrink-0">Sign up free</a>
          </div>
        )}

        <AdBanner slot="utilities-top" format="horizontal" />

        {/* Streak */}
        {streak > 0 && (
          <GlassCard variant="accent-teal" className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{streak}-day streak!</p>
              <p className="text-xs text-muted-foreground">Keep hitting your daily goal</p>
            </div>
          </GlassCard>
        )}

        {/* Progress Ring */}
        <GlassCard variant="glass-2" className="p-6 flex flex-col items-center gap-4">
          <WaterRing current={data.glasses} goal={data.goal} />
          <p className="text-sm text-muted-foreground">{ml}ml / {data.goal * 250}ml · {pct}%</p>

          {/* Add / Remove */}
          <div className="flex items-center gap-4">
            <motion.button whileTap={{ scale: 0.9 }} onClick={removeGlass}
              className="w-12 h-12 glass-1 rounded-full flex items-center justify-center">
              <Minus className="w-5 h-5 text-foreground" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={addGlass}
              className="w-16 h-16 rounded-full gradient-teal flex items-center justify-center shadow-lg"
            >
              <Plus className="w-7 h-7 text-white" />
            </motion.button>
            <div className="w-12" /> {/* spacer for symmetry */}
          </div>
          <p className="text-xs text-muted-foreground">Tap + to add a glass (250ml)</p>
        </GlassCard>

        {/* Milestone */}
        <AnimatePresence>
          {milestone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              <GlassCard variant="accent-amber" className="p-3 text-center">
                <p className="text-sm font-medium text-foreground">{milestone}</p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goal adjuster */}
        <GlassCard variant="glass-1" className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-foreground">Daily Goal</span>
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => adjustGoal(-1)}
                className="w-8 h-8 glass-2 rounded-full flex items-center justify-center">
                <Minus className="w-3.5 h-3.5 text-foreground" />
              </motion.button>
              <span className="text-sm font-semibold text-foreground w-16 text-center">
                {data.goal} glasses
              </span>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => adjustGoal(1)}
                className="w-8 h-8 glass-2 rounded-full flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-foreground" />
              </motion.button>
            </div>
          </div>
        </GlassCard>

        {/* Today's log */}
        <GlassCard variant="glass-1" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-foreground">Today's Log</span>
          </div>
          {data.log.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No glasses logged yet. Start drinking!
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...data.log].reverse().map((entry: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-xs text-foreground">{entry.amount}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{entry.time}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* FAQ Section */}
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 mt-6 space-y-2">
        <h2 className="text-lg font-bold text-foreground mb-3">Frequently Asked Questions</h2>
        {WATER_FAQ_DATA.map((faq, i) => (
          <GlassCard key={i} className="p-4">
            <p className="text-sm font-medium text-foreground mb-1">{faq.q}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4">
        <AdBanner slot="utilities-bottom" format="rectangle" />
      </div>

      <BottomNav />
      <BionAssistant />
    </div>
  );
}
