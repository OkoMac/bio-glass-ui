import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Plus, X, ChevronDown, CheckCircle, Calendar, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getSASTDateKey } from "../../utils/sastDate";

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface TimeBlock {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  blocks: TimeBlock[];
}

type WeekSchedule = Record<Day, DaySchedule>;

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_OPTIONS = [
  "06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00",
];

const initialSchedule: WeekSchedule = {
  Mon: { enabled: true,  blocks: [{ start: "07:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  Tue: { enabled: true,  blocks: [{ start: "07:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  Wed: { enabled: true,  blocks: [{ start: "07:00", end: "12:00" }] },
  Thu: { enabled: true,  blocks: [{ start: "07:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
  Fri: { enabled: true,  blocks: [{ start: "07:00", end: "13:00" }] },
  Sat: { enabled: true,  blocks: [{ start: "08:00", end: "13:00" }] },
  Sun: { enabled: false, blocks: [] },
};

// No hardcoded exceptions — loaded from Supabase

const bufferOptions = ["0 min", "5 min", "10 min", "15 min", "20 min", "30 min"];
const advanceOptions = ["Same day", "1 day", "2 days", "3 days", "7 days", "14 days"];

const AVAIL_STORAGE_KEY = "bion_provider_availability";

export default function ProviderAvailability() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDemo = user?.id?.startsWith("demo_") ?? false;
  const supabaseId = !isDemo && user?.profileId ? user.profileId : null;

  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    try {
      const stored = localStorage.getItem(AVAIL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return initialSchedule;
  });
  const [buffer, setBuffer] = useState("10 min");
  const [advance, setAdvance] = useState("2 days");
  const [expandedDay, setExpandedDay] = useState<Day | null>("Mon");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingException, setAddingException] = useState(false);
  const [newExDate, setNewExDate] = useState("");
  const [newExLabel, setNewExLabel] = useState("");
  const [localExceptions, setLocalExceptions] = useState<{ date: string; label: string }[]>([]);

  // Load from Supabase on mount
  useEffect(() => {
    if (!supabaseId) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from("provider_availability" as any)
          .select("*")
          .eq("provider_id", supabaseId)
          .order("day_of_week", { ascending: true });

        if (data && (data as any[]).length > 0) {
          const loaded: Partial<WeekSchedule> = {};
          (data as any[]).forEach((row: any) => {
            const day = DAYS[row.day_of_week] as Day;
            if (!day) return;
            if (!loaded[day]) loaded[day] = { enabled: row.active ?? true, blocks: [] };
            if (row.start_time && row.end_time) {
              loaded[day]!.blocks.push({ start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5) });
            }
          });
          // Fill in missing days
          DAYS.forEach(d => {
            if (!loaded[d]) loaded[d] = { enabled: false, blocks: [] };
          });
          setSchedule(loaded as WeekSchedule);
          localStorage.setItem(AVAIL_STORAGE_KEY, JSON.stringify(loaded));
        }
      } catch (err) {
        // Real failure — log loud (was dev-only previously, which hid
        // the silent prod schema-mismatch bug fixed in this commit).
        console.error("[availability] Supabase load failed:", err);
      }
    };
    load();

    // Load blocked dates / exceptions
    supabase.from("provider_availability_override" as any)
      .select("date, label")
      .eq("provider_id", supabaseId)
      .gte("date", getSASTDateKey())
      .order("date", { ascending: true })
      .then(({ data: overrides }) => {
        if (overrides && (overrides as any[]).length > 0) {
          setLocalExceptions((overrides as any[]).map((o: any) => ({ date: o.date, label: o.label ?? "Blocked" })));
        }
      });
  }, [supabaseId]);

  const toggleDay = (day: Day) => {
    setSchedule(s => ({
      ...s,
      [day]: { ...s[day], enabled: !s[day].enabled },
    }));
  };

  const addBlock = (day: Day) => {
    setSchedule(s => ({
      ...s,
      [day]: { ...s[day], blocks: [...s[day].blocks, { start: "09:00", end: "17:00" }] },
    }));
  };

  const removeBlock = (day: Day, idx: number) => {
    setSchedule(s => ({
      ...s,
      [day]: { ...s[day], blocks: s[day].blocks.filter((_, i) => i !== idx) },
    }));
  };

  const updateBlock = (day: Day, idx: number, field: "start" | "end", value: string) => {
    setSchedule(s => {
      const blocks = s[day].blocks.map((b, i) => i === idx ? { ...b, [field]: value } : b);
      return { ...s, [day]: { ...s[day], blocks } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    // Save to localStorage
    localStorage.setItem(AVAIL_STORAGE_KEY, JSON.stringify(schedule));

    // Save to Supabase
    if (supabaseId) {
      try {
        // Delete existing rows
        await supabase.from("provider_availability" as any).delete().eq("provider_id", supabaseId);
        // Insert new rows — one per time block per day
        const rows: any[] = [];
        DAYS.forEach((day, dayIdx) => {
          const daySchedule = schedule[day];
          if (daySchedule.blocks.length === 0) {
            rows.push({
              provider_id: supabaseId,
              day_of_week: dayIdx,
              start_time: null,
              end_time: null,
              is_available: daySchedule.enabled,
            });
          } else {
            daySchedule.blocks.forEach(block => {
              rows.push({
                provider_id: supabaseId,
                day_of_week: dayIdx,
                start_time: block.start + ":00",
                end_time: block.end + ":00",
                active: daySchedule.enabled,
              });
            });
          }
        });
        const { error } = await supabase.from("provider_availability" as any).insert(rows);
        if (error) throw error;
      } catch (err: any) {
        // Real failure — toast + loud log so the provider knows their
        // hours didn't actually save. Silent failure (the prior dev-only
        // warn) is what made the table-name typo invisible for so long.
        console.error("[availability] Supabase save failed:", err);
        toast.error(`Couldn't save availability to server: ${err?.message ?? "unknown error"}. Please try again.`);
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addException = () => {
    if (!newExDate) return;
    const label = newExLabel || "Blocked";
    setLocalExceptions(e => [...e, { date: newExDate, label }]);
    // Persist to Supabase. Loud-on-error per BION_WIKI Mistake 10 — a
    // previous version of this code silently failed and left the user
    // believing their blocked dates were saved when they weren't.
    if (supabaseId) {
      supabase.from("provider_availability_override" as any).upsert({
        provider_id: supabaseId,
        date: newExDate,
        label,
        is_available: false,
      }, { onConflict: "provider_id,date" }).then(({ error }) => {
        if (error) console.error("[availability] add-exception failed:", error.message);
      });
    }
    setNewExDate("");
    setNewExLabel("");
    setAddingException(false);
  };

  const removeException = (idx: number) => {
    const ex = localExceptions[idx];
    setLocalExceptions(e => e.filter((_, i) => i !== idx));
    // Remove from Supabase — loud-on-error so a future schema rename
    // doesn't silently leave the user thinking they un-blocked a date
    // that's still blocked server-side.
    if (supabaseId && ex) {
      supabase.from("provider_availability_override" as any)
        .delete()
        .eq("provider_id", supabaseId)
        .eq("date", ex.date)
        .then(({ error }) => {
          if (error) console.error("[availability] remove-exception failed:", error.message);
        });
    }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Availability</h1>
            <p className="text-xs text-muted-foreground">Set your working hours and blocked dates</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className={`px-4 py-2 rounded-pill text-sm font-semibold transition-all flex items-center gap-1.5 ${
              saved ? "bg-teal/20 text-teal" : "gradient-indigo text-primary-foreground"
            }`}
          >
            {saved ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</> : "Save changes"}
          </motion.button>
        </div>

        {/* Booking rules */}
        <GlassCard className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking Rules</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Buffer time */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5">Buffer between sessions</p>
              <div className="flex flex-wrap gap-1.5">
                {bufferOptions.map(b => (
                  <button
                    key={b}
                    onClick={() => setBuffer(b)}
                    className={`text-[10px] px-2 py-1 rounded-pill transition-all ${
                      buffer === b ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            {/* Advance notice */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5">Minimum advance notice</p>
              <div className="flex flex-wrap gap-1.5">
                {advanceOptions.map(a => (
                  <button
                    key={a}
                    onClick={() => setAdvance(a)}
                    className={`text-[10px] px-2 py-1 rounded-pill transition-all ${
                      advance === a ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Weekly schedule */}
        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Weekly Hours</p>
          <div className="space-y-2">
            {DAYS.map(day => (
              <div key={day} className="rounded-xl overflow-hidden glass-1">
                {/* Day header */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                >
                  {/* Toggle */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleDay(day); }}
                    className={`w-9 h-5 rounded-full transition-all flex items-center px-0.5 shrink-0 ${
                      schedule[day].enabled ? "bg-indigo-500" : "bg-white/10"
                    }`}
                  >
                    <motion.div
                      animate={{ x: schedule[day].enabled ? 16 : 0 }}
                      className="w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </button>

                  <span className="text-sm font-medium text-foreground w-8">{day}</span>

                  <div className="flex-1 min-w-0">
                    {schedule[day].enabled ? (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {schedule[day].blocks.length === 0
                          ? "No blocks set"
                          : schedule[day].blocks.map(b => `${b.start}–${b.end}`).join(", ")}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Unavailable</p>
                    )}
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${expandedDay === day ? "rotate-180" : ""}`}
                  />
                </div>

                {/* Expanded time blocks */}
                <AnimatePresence>
                  {expandedDay === day && schedule[day].enabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 px-3 pb-3 space-y-2"
                    >
                      {schedule[day].blocks.map((block, bi) => (
                        <div key={bi} className="flex items-center gap-2 mt-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <select
                            value={block.start}
                            onChange={e => updateBlock(day, bi, "start", e.target.value)}
                            className="flex-1 bg-white/5 text-foreground text-xs rounded-lg px-2 py-1.5 outline-none border border-white/10"
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <span className="text-muted-foreground text-xs">to</span>
                          <select
                            value={block.end}
                            onChange={e => updateBlock(day, bi, "end", e.target.value)}
                            className="flex-1 bg-white/5 text-foreground text-xs rounded-lg px-2 py-1.5 outline-none border border-white/10"
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <button onClick={() => removeBlock(day, bi)} className="p-1 text-muted-foreground hover:text-coral transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addBlock(day)}
                        className="flex items-center gap-1.5 text-[11px] text-indigo mt-2 hover:opacity-70 transition-opacity"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add time block
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Blocked dates / exceptions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber" />
              <h2 className="text-base font-semibold text-foreground">Blocked Dates</h2>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setAddingException(v => !v)}
              className="flex items-center gap-1.5 text-xs text-indigo glass-1 px-3 py-1.5 rounded-pill"
            >
              <Plus className="w-3.5 h-3.5" /> Add date
            </motion.button>
          </div>

          <AnimatePresence>
            {addingException && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <GlassCard className="p-4 mb-3 space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Date</p>
                    <input
                      type="date"
                      value={newExDate}
                      onChange={e => setNewExDate(e.target.value)}
                      className="w-full bg-white/5 text-foreground text-sm rounded-lg px-3 py-2 outline-none border border-white/10"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Reason (optional)</p>
                    <input
                      type="text"
                      value={newExLabel}
                      onChange={e => setNewExLabel(e.target.value)}
                      placeholder="e.g. Public holiday"
                      className="w-full bg-white/5 text-foreground text-sm rounded-lg px-3 py-2 outline-none border border-white/10 placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addException} className="flex-1 gradient-indigo rounded-pill py-2 text-sm font-semibold text-primary-foreground">
                      Block date
                    </button>
                    <button onClick={() => setAddingException(false)} className="flex-1 glass-1 rounded-pill py-2 text-sm text-muted-foreground">
                      Cancel
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {localExceptions.map((ex, i) => (
              <motion.div
                key={ex.date}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl glass-accent-amber flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-amber" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(ex.date + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{ex.label}</p>
                    </div>
                  </div>
                  <button onClick={() => removeException(i)} className="p-1.5 text-muted-foreground hover:text-coral transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </GlassCard>
              </motion.div>
            ))}
            {localExceptions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No blocked dates</p>
            )}
          </div>
        </section>
      </div>

      <BionAssistant />
      <ProviderNav />
    </div>
  );
}
