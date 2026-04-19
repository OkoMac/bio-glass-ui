import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { trackEvent } from "@/lib/habits";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import AdBanner from "@/components/AdBanner";
import { ArrowLeft, Moon, Sun, Star, Clock, TrendingUp, Lightbulb } from "lucide-react";

const STORAGE_KEY = "bion_sleep_tracker";

interface SleepEntry {
  date: string;
  bedtime: string;
  wakeTime: string;
  duration: number; // hours
  quality: number;  // 1-5
}

function getEntries(): SleepEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEntries(entries: SleepEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function calcDuration(bed: string, wake: string): number {
  const [bH, bM] = bed.split(":").map(Number);
  const [wH, wM] = wake.split(":").map(Number);
  let bedMin = bH * 60 + bM;
  let wakeMin = wH * 60 + wM;
  if (wakeMin <= bedMin) wakeMin += 24 * 60; // overnight
  return Math.round(((wakeMin - bedMin) / 60) * 10) / 10;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const SLEEP_TIPS = [
  { icon: Moon, title: "Consistent Schedule", text: "Go to bed and wake up at the same time every day, even on weekends." },
  { icon: Sun, title: "Morning Light", text: "Get 10-15 minutes of sunlight within an hour of waking to regulate your circadian rhythm." },
  { icon: Clock, title: "No Screens Before Bed", text: "Avoid phones and screens for at least 30 minutes before sleep for better melatonin production." },
  { icon: Lightbulb, title: "Cool & Dark Room", text: "Keep your bedroom at 18-20°C and block out all light for optimal sleep quality." },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <motion.button key={s} whileTap={{ scale: 0.85 }} onClick={() => onChange(s)}>
          <Star className={`w-6 h-6 ${s <= value ? "text-amber-400 fill-amber-400" : "text-white/20"}`} />
        </motion.button>
      ))}
    </div>
  );
}

export default function SleepTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<SleepEntry[]>(getEntries);
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState(3);
  const [saved, setSaved] = useState(false);

  const todayLogged = entries.some((e) => e.date === todayKey());

  // Last 7 entries for chart
  const weekData = entries.slice(-7);
  const avgSleep = weekData.length > 0
    ? Math.round((weekData.reduce((s, e) => s + e.duration, 0) / weekData.length) * 10) / 10
    : 0;
  const avgQuality = weekData.length > 0
    ? Math.round((weekData.reduce((s, e) => s + e.quality, 0) / weekData.length) * 10) / 10
    : 0;

  const logSleep = () => {
    const duration = calcDuration(bedtime, wakeTime);
    const entry: SleepEntry = { date: todayKey(), bedtime, wakeTime, duration, quality };
    const updated = [...entries.filter((e) => e.date !== todayKey()), entry];
    setEntries(updated);
    saveEntries(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    trackEvent("tool_use", { category: "wellness_tracking", metadata: { tool: "sleep", duration_hours: duration, quality } });
  };

  const maxDuration = Math.max(...weekData.map((e) => e.duration), 10);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
            <h1 className="text-2xl font-bold text-foreground">Sleep Tracker</h1>
            <p className="text-xs text-muted-foreground">Track your rest, improve your health</p>
          </div>
        </div>

        {!user && (
          <div className="mx-4 mb-3 p-3 rounded-2xl glass-1 border border-indigo/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Sign up free to save your progress and unlock full features</p>
            <a href="/welcome" className="rounded-pill px-3 py-1.5 text-xs font-semibold gradient-indigo text-primary-foreground shrink-0">Sign up free</a>
          </div>
        )}

        <AdBanner slot="utilities-top" format="horizontal" />

        {/* Log sleep */}
        <GlassCard variant="glass-2" className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-foreground">Log Last Night's Sleep</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bedtime</label>
              <input
                type="time" value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="w-full glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground bg-transparent border-0 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Wake Time</label>
              <input
                type="time" value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground bg-transparent border-0 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Sleep Quality</label>
            <StarRating value={quality} onChange={setQuality} />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Duration: <span className="text-foreground font-semibold">{calcDuration(bedtime, wakeTime)}h</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={logSleep}
              className="rounded-pill px-5 py-2.5 gradient-indigo text-primary-foreground text-sm font-semibold"
            >
              {todayLogged ? "Update" : "Log Sleep"}
            </motion.button>
          </div>

          {saved && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-teal-400 text-center">
              Sleep logged successfully!
            </motion.p>
          )}
        </GlassCard>

        {/* Weekly summary */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard variant="accent-indigo" className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{avgSleep}h</p>
            <p className="text-xs text-muted-foreground">Avg Sleep</p>
          </GlassCard>
          <GlassCard variant="accent-amber" className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <p className="text-2xl font-bold text-foreground">{avgQuality}</p>
            </div>
            <p className="text-xs text-muted-foreground">Avg Quality</p>
          </GlassCard>
        </div>

        {/* Weekly chart */}
        <GlassCard variant="glass-1" className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-foreground">This Week</span>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-32">
            {Array.from({ length: 7 }).map((_, i) => {
              const entry = weekData[i];
              const h = entry ? (entry.duration / maxDuration) * 100 : 0;
              const qualityColor = entry
                ? entry.quality >= 4 ? "from-teal-500 to-teal-400"
                : entry.quality >= 3 ? "from-indigo-500 to-indigo-400"
                : "from-coral to-orange-400"
                : "from-white/10 to-white/5";
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className={`w-full rounded-t-lg bg-gradient-to-t ${qualityColor}`}
                  />
                  <span className="text-[10px] text-muted-foreground">{dayLabels[i]}</span>
                  {entry && <span className="text-[10px] text-muted-foreground">{entry.duration}h</span>}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Sleep tips */}
        <GlassCard variant="glass-1" className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-foreground">Sleep Tips</span>
          </div>
          <div className="space-y-3">
            {SLEEP_TIPS.map((tip, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 glass-2 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <tip.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4">
        <AdBanner slot="utilities-bottom" format="rectangle" />
      </div>

      <BottomNav />
      <BionAssistant />
    </div>
  );
}
