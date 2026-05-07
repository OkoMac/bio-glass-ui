import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { trackEvent } from "@/lib/habits";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { usePageView } from "@/hooks/usePageView";
import AdBanner from "@/components/AdBanner";
import { supabase } from "@/integrations/supabase/client";
import { useVisibilityRefetch } from "@/hooks/useVisibilityRefetch";
import { useSleepSchedule } from "@/hooks/useSleepSchedule";
import { getSASTDateKey } from "@/utils/sastDate";
import { toast } from "sonner";
import { ArrowLeft, Moon, Sun, Star, Clock, TrendingUp, Lightbulb, Bell, ChevronDown } from "lucide-react";

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
  return getSASTDateKey();
}

/**
 * The date a sleep session belongs to is the night the user GOT INTO BED,
 * not the morning they pressed "Update". A typical overnight pattern
 * (bed 23:00, wake 07:00) crossed midnight, so the bedtime was yesterday
 * — and that's what the chart should show. Without this, logging at
 * 13:00 today put 8h of sleep on today's bar even though the user
 * hadn't slept since this morning.
 *
 * Naps inside the same calendar day (bed 13:00, wake 14:00) keep
 * today's date.
 */
function sleepEntryDate(bedtime: string, wakeTime: string): string {
  const [bH, bM] = bedtime.split(":").map(Number);
  const [wH, wM] = wakeTime.split(":").map(Number);
  const bedMin = bH * 60 + bM;
  const wakeMin = wH * 60 + wM;
  const overnight = wakeMin <= bedMin;
  if (!overnight) return getSASTDateKey();
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return getSASTDateKey(yesterday);
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

const SLEEP_FAQ_DATA = [
  { q: "How many hours of sleep do I need?", a: "Most adults need 7 to 9 hours of quality sleep per night. Teenagers need 8 to 10 hours, and children even more. Consistently getting less than 7 hours is linked to increased risk of obesity, heart disease, and impaired cognitive function." },
  { q: "How to improve sleep quality?", a: "Stick to a consistent sleep schedule, limit screen time before bed, keep your bedroom cool and dark, and avoid caffeine after midday. Regular exercise also promotes deeper sleep, but try to finish workouts at least 3 hours before bedtime." },
  { q: "What is sleep hygiene?", a: "Sleep hygiene refers to the habits and environment that promote consistent, uninterrupted, and restorative sleep. Good sleep hygiene includes a regular bedtime routine, a comfortable mattress, and minimising noise and light in your sleeping area." },
];

export default function SleepTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<SleepEntry[]>(getEntries);
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState(3);
  const [saved, setSaved] = useState(false);
  usePageView();

  useEffect(() => { document.title = "Free Sleep Quality Tracker | BION"; }, []);

  // Hydrate entries from Supabase health_logs on mount for signed-in users.
  // Writes already go server-side (logSleep), but reads only came from
  // localStorage — so users who signed in on a different device saw an
  // empty chart even with data in the cloud. Pull the last 14 days,
  // merge with localStorage (server wins on collision since it's the
  // authoritative store), persist back so the rest of the page works
  // unchanged.
  // Hydrate from server. Extracted so we can call on visibilitychange too.
  const hydrateFromServer = () => {
    if (!user?.profileId || user.id?.startsWith("demo_")) return;
    const since = new Date();
    since.setDate(since.getDate() - 14);
    supabase.from("health_logs")
      .select("log_date, sleep_hours, notes")
      .eq("user_id", user.profileId)
      .gte("log_date", since.toISOString().slice(0, 10))
      .order("log_date", { ascending: true })
      .then(({ data: rows, error }) => {
        if (error || !rows?.length) return;
        const byDate = new Map<string, SleepEntry>();
        for (const e of getEntries()) byDate.set(e.date, e);
        for (const r of rows as any[]) {
          if (!r.sleep_hours) continue;
          const notes = String(r.notes ?? "");
          const q = parseInt(notes.match(/Quality:\s*(\d)/)?.[1] ?? "3", 10);
          const bed = notes.match(/Bed:\s*(\d{1,2}:\d{2})/)?.[1] ?? "23:00";
          const wake = notes.match(/Wake:\s*(\d{1,2}:\d{2})/)?.[1] ?? "07:00";
          byDate.set(r.log_date, { date: r.log_date, bedtime: bed, wakeTime: wake, duration: r.sleep_hours, quality: q });
        }
        const merged = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
        setEntries(merged);
        saveEntries(merged);
      });
  };
  useEffect(() => { hydrateFromServer(); }, [user?.profileId, user?.id]);

  // Refetch when tab returns to visibility — closes the cross-instance desync
  // (Lee bug 2026-05-01: PWA + browser don't update each other).
  useVisibilityRefetch(() => { hydrateFromServer(); }, [user?.profileId]);

  // B2-1: schedule (Lee's redesign — set bedtime + wake once, BION reminds)
  const { schedule, save: saveSchedule } = useSleepSchedule();
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState(schedule);
  useEffect(() => { setScheduleDraft(schedule); }, [schedule]);

  const handleSaveSchedule = async () => {
    try {
      await saveSchedule({ ...scheduleDraft, enabled: true });
      toast.success("Sleep schedule saved — you'll get a bedtime nudge 30 min before lights-out.");
      setScheduleExpanded(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't save schedule");
    }
  };

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: SLEEP_FAQ_DATA.map((f) => ({
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

  const currentEntryDate = sleepEntryDate(bedtime, wakeTime);
  const todayLogged = entries.some((e) => e.date === currentEntryDate);

  // Calendar-aligned last-7-days window. Walk from 6 days ago → today and
  // stitch in the matching entry per day (or null for missed days). Fixes
  // the previous chart bug where `entries.slice(-7)` could pick up old
  // scattered entries and mis-align them with the Mon-Sun day labels.
  const weekDays = (() => {
    const days: Array<{ date: string; entry: SleepEntry | null; dayLabel: string }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = getSASTDateKey(d);
      const dayLabel = d.toLocaleDateString("en", { weekday: "short" }).slice(0, 1);
      days.push({ date, entry: entries.find((e) => e.date === date) ?? null, dayLabel });
    }
    return days;
  })();
  const filledDays = weekDays.filter((d) => d.entry);
  const avgSleep = filledDays.length > 0
    ? Math.round((filledDays.reduce((s, d) => s + d.entry!.duration, 0) / filledDays.length) * 10) / 10
    : 0;
  const avgQuality = filledDays.length > 0
    ? Math.round((filledDays.reduce((s, d) => s + d.entry!.quality, 0) / filledDays.length) * 10) / 10
    : 0;

  const logSleep = () => {
    const duration = calcDuration(bedtime, wakeTime);
    const entryDate = sleepEntryDate(bedtime, wakeTime);
    const entry: SleepEntry = { date: entryDate, bedtime, wakeTime, duration, quality };
    const updated = [...entries.filter((e) => e.date !== entryDate), entry];
    setEntries(updated);
    saveEntries(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    trackEvent("tool_use", { category: "wellness_tracking", metadata: { tool: "sleep", duration_hours: duration, quality } });

    // Persist to Supabase health_logs so wellness score + HealthProfile can see it.
    // Bug fix 2026-04-28: was writing column `date` and conflict-target `user_id,date`,
    // but the schema uses `log_date` with UNIQUE(user_id, log_date). Every sleep
    // upsert silently 4xx'd which is why Progress always read 0h.
    if (user?.profileId && !user.id?.startsWith("demo_")) {
      supabase.from("health_logs").upsert({
        user_id: user.profileId,
        log_date: entryDate,
        sleep_hours: duration,
        notes: `Quality: ${quality}/5, Bed: ${bedtime}, Wake: ${wakeTime}`,
      } as any, { onConflict: "user_id,log_date" }).then(({ error }) => {
        // Loud — silent dev-only logging is what hid the date / log_date
        // column mismatch in prod for weeks. Any future drift surfaces.
        if (error) console.error("[sleep] DB sync failed:", error.message);
      });
    }
  };

  const maxDuration = Math.max(...filledDays.map((d) => d.entry!.duration), 10);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-20 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Free Sleep Quality Tracker</h1>
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

        {/* B2-1: Sleep schedule setup — Lee's redesign (more intuition, less effort) */}
        <GlassCard variant="glass-1" className="p-4 space-y-3">
          <button
            onClick={() => setScheduleExpanded(!scheduleExpanded)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  {schedule.enabled ? "Sleep schedule" : "Set up sleep reminders"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {schedule.enabled
                    ? `Weekday ${schedule.weekday_bedtime} → ${schedule.weekday_wake} · Weekend ${schedule.weekend_bedtime} → ${schedule.weekend_wake}`
                    : "BION will nudge you 30 min before bedtime, then ask how you slept in the morning."}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${scheduleExpanded ? "rotate-180" : ""}`} />
          </button>

          {scheduleExpanded && (
            <div className="pt-2 space-y-3 border-t border-white/[0.06]">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Weekday (Mon–Fri)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Bedtime</label>
                    <input type="time" value={scheduleDraft.weekday_bedtime}
                      onChange={(e) => setScheduleDraft({ ...scheduleDraft, weekday_bedtime: e.target.value })}
                      className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent border-0 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Wake</label>
                    <input type="time" value={scheduleDraft.weekday_wake}
                      onChange={(e) => setScheduleDraft({ ...scheduleDraft, weekday_wake: e.target.value })}
                      className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent border-0 outline-none" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Weekend (Sat–Sun)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Bedtime</label>
                    <input type="time" value={scheduleDraft.weekend_bedtime}
                      onChange={(e) => setScheduleDraft({ ...scheduleDraft, weekend_bedtime: e.target.value })}
                      className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent border-0 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Wake</label>
                    <input type="time" value={scheduleDraft.weekend_wake}
                      onChange={(e) => setScheduleDraft({ ...scheduleDraft, weekend_wake: e.target.value })}
                      className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent border-0 outline-none" />
                  </div>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveSchedule}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500">
                {schedule.enabled ? "Update schedule" : "Enable reminders"}
              </motion.button>
              {schedule.enabled && (
                <button
                  onClick={async () => {
                    await saveSchedule({ enabled: false });
                    toast.success("Reminders paused");
                  }}
                  className="w-full text-[11px] text-muted-foreground/80 hover:text-muted-foreground"
                >
                  Pause reminders
                </button>
              )}
            </div>
          )}
        </GlassCard>

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
            {weekDays.map((d, i) => {
              const entry = d.entry;
              const h = entry ? (entry.duration / maxDuration) * 100 : 6;
              const isToday = d.date === todayKey();
              const qualityColor = entry
                ? entry.quality >= 4 ? "from-teal-500 to-teal-400"
                : entry.quality >= 3 ? "from-indigo-500 to-indigo-400"
                : "from-coral to-orange-400"
                : "from-white/10 to-white/5";
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className={`w-full rounded-t-lg bg-gradient-to-t ${qualityColor} ${isToday ? "ring-2 ring-indigo-400/40" : ""}`}
                  />
                  <span className={`text-[10px] ${isToday ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{d.dayLabel}</span>
                  {entry ? <span className="text-[10px] text-muted-foreground">{entry.duration}h</span> : <span className="text-[10px] text-muted-foreground">—</span>}
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

      {/* FAQ Section */}
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 mt-6 space-y-2">
        <h2 className="text-lg font-bold text-foreground mb-3">Frequently Asked Questions</h2>
        {SLEEP_FAQ_DATA.map((faq, i) => (
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
