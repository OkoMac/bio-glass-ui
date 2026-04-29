import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { useHealthLogs } from "@/hooks/useHealth";
import { toast } from "sonner";

// Simple SVG sparkline. Handles empty/short series gracefully — new users
// (no health_logs yet) reach this with data=[] and must not crash.
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 100, h = 32;
  if (!data || data.length === 0) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-8">
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 3" />
      </svg>
    );
  }
  if (data.length === 1) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-8">
        <circle cx={w / 2} cy={h / 2} r="2.5" fill={color} />
      </svg>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-8">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
    </svg>
  );
}

// Metric shells — visual config only. All numeric values come from the user's
// own health_logs at render time. No seed data that fakes a history.
const metrics = [
  { label: "Weight",      unit: "kg",  current: 0, prev: 0, data: [] as number[], color: "#6366F1", trend: "stable" },
  { label: "Body Fat",    unit: "%",   current: 0, prev: 0, data: [] as number[], color: "#2DD4BF", trend: "stable" },
  { label: "Lean Mass",   unit: "kg",  current: 0, prev: 0, data: [] as number[], color: "#A78BFA", trend: "stable" },
  { label: "Resting HR",  unit: "bpm", current: 0, prev: 0, data: [] as number[], color: "#FB7185", trend: "stable" },
  { label: "Steps/day",   unit: "k",   current: 0, prev: 0, data: [] as number[], color: "#FBBF24", trend: "stable" },
  { label: "Sleep",       unit: "h",   current: 0, prev: 0, data: [] as number[], color: "#2DD4BF", trend: "stable" },
];

// Milestones are earned — users start with none. Populated as they unlock.
const milestones: Array<{ emoji: string; label: string; date: string; earned: boolean }> = [];

const logLabels = ["Jan 17", "Jan 24", "Jan 31", "Feb 7", "Feb 14", "Feb 21", "Today"];

export default function Progress() {
  const navigate = useNavigate();
  const { logs, logToday } = useHealthLogs(56);
  const [logInput, setLogInput] = useState<Record<string, string>>({});
  const [logOpen, setLogOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  // Derive live metrics from real logs, falling back to seed defaults so the
  // page doesn't look empty for new users
  const liveMetrics = useMemo(() => {
    if (logs.length === 0) return metrics;
    const recent = logs.slice(-7);   // last 7 entries
    const seriesFor = (key: keyof typeof logs[number]) =>
      recent.map(l => Number(l[key] ?? 0)).filter(v => v > 0);

    const buildMetric = (
      label: string, unit: string, key: keyof typeof logs[number],
      fallback: typeof metrics[number],
    ) => {
      const series = seriesFor(key);
      // 2026-04-29: was `series.length < 2 → fallback (zeros)`, which
      // meant after a single sleep / weight log the card stayed at 0.
      // Now: empty → fallback, single entry → show it (current=prev),
      // multi → show last two for trend math.
      if (series.length === 0) return fallback;
      const current = series[series.length - 1];
      const prev = series.length >= 2 ? series[series.length - 2] : current;
      return {
        ...fallback,
        current,
        prev,
        data: series.length >= 7 ? series : [...fallback.data.slice(0, 7 - series.length), ...series],
      };
    };

    return [
      buildMetric("Weight",     "kg",  "weight_kg",   metrics[0]),
      buildMetric("Body Fat",   "%",   "body_fat_pct", metrics[1]),
      buildMetric("Lean Mass",  "kg",  "lean_mass_kg", metrics[2]),
      buildMetric("Resting HR", "bpm", "resting_hr",   metrics[3]),
      // steps stored as raw int; convert to k for display
      (() => {
        const series = seriesFor("steps").map(v => v / 1000);
        if (series.length === 0) return metrics[4];
        const current = series[series.length - 1];
        const prev = series.length >= 2 ? series[series.length - 2] : current;
        return { ...metrics[4], current, prev,
          data: series.length >= 7 ? series : [...metrics[4].data.slice(0, 7 - series.length), ...series] };
      })(),
      buildMetric("Sleep",      "h",   "sleep_hours",  metrics[5]),
    ];
  }, [logs]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
              className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Progress</h1>
              <p className="text-xs text-muted-foreground">7-week tracking · Feb 2026</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLogOpen(!logOpen)}
            className="flex items-center gap-1.5 rounded-pill px-3 py-2 gradient-indigo text-primary-foreground text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Log
          </motion.button>
        </div>

        {/* Log input panel */}
        {logOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Log Today's Metrics</p>
              <div className="grid grid-cols-2 gap-2">
                {["Weight (kg)", "Body Fat (%)", "Steps (k)", "Sleep (h)"].map(field => (
                  <div key={field}>
                    <label className="text-[10px] text-muted-foreground">{field}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={logInput[field] ?? ""}
                      onChange={e => setLogInput(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full mt-1 h-9 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none"
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  const w  = parseFloat(logInput["Weight (kg)"]);
                  const bf = parseFloat(logInput["Body Fat (%)"]);
                  const st = parseFloat(logInput["Steps (k)"]);
                  const sl = parseFloat(logInput["Sleep (h)"]);
                  const patch: Record<string, number> = {};
                  if (!isNaN(w))  patch.weight_kg   = w;
                  if (!isNaN(bf)) patch.body_fat_pct = bf;
                  if (!isNaN(st)) patch.steps       = Math.round(st * 1000);
                  if (!isNaN(sl)) patch.sleep_hours = sl;
                  if (Object.keys(patch).length === 0) {
                    toast.error("Enter at least one metric");
                    return;
                  }
                  try {
                    await logToday(patch);
                    setSaved(true);
                    setLogInput({});
                    setTimeout(() => { setSaved(false); setLogOpen(false); }, 1200);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Save failed");
                  }
                }}
                className="w-full rounded-pill py-2.5 gradient-indigo text-primary-foreground text-xs font-semibold"
              >
                {saved ? "✓ Saved!" : "Save Entry"}
              </motion.button>
            </GlassCard>
          </motion.div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {liveMetrics.map((m, i) => {
            const delta = (m.current - m.prev).toFixed(1);
            const isGood = (m.trend === "down" && m.current < m.prev) || (m.trend === "up" && m.current > m.prev);
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className="p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] text-muted-foreground">{m.label}</p>
                    <div className={`flex items-center gap-0.5 text-[9px] font-medium ${isGood ? "text-teal" : "text-coral"}`}>
                      {m.trend === "down" && m.current < m.prev
                        ? <TrendingDown className="w-3 h-3" />
                        : m.current > m.prev
                        ? <TrendingUp className="w-3 h-3" />
                        : <Minus className="w-3 h-3 text-muted-foreground" />
                      }
                      {Math.abs(Number(delta))}
                    </div>
                  </div>
                  <p className="text-xl font-bold font-data text-foreground">
                    {m.current}<span className="text-xs font-normal text-muted-foreground ml-0.5">{m.unit}</span>
                  </p>
                  <div className="mt-2">
                    <Sparkline data={m.data} color={m.color} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-muted-foreground">{logLabels[0]}</span>
                    <span className="text-[9px] text-muted-foreground">Today</span>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Before/After photos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Progress Photos</h2>
            <span className="rounded-pill px-3 py-1.5 glass-1 text-xs text-muted-foreground/50 cursor-default">
              Coming soon
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["Jan 10", "Jan 24", "Feb 14"].map((date, i) => (
              <div key={date} className="aspect-square rounded-xl overflow-hidden relative glass-1 flex items-center justify-center cursor-default">
                <div className="text-center">
                  <p className="text-[10px] font-medium text-muted-foreground">{date}</p>
                  <p className="text-[9px] text-muted-foreground/50 mt-0.5">Week {[1,3,5][i]}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/60 text-center mt-2">Photo tracking coming in next update</p>
        </section>

        {/* Milestones */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3">Milestones</h2>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className={`p-3 flex items-center gap-3 ${!m.earned ? "opacity-40" : ""}`}>
                  <span className="text-xl">{m.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{m.label}</p>
                    {m.earned && <p className="text-[10px] text-muted-foreground">{m.date}</p>}
                  </div>
                  {m.earned && <div className="w-2 h-2 rounded-full bg-teal animate-pulse-glow" />}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <BionAssistant />
      <BottomNav />
    </div>
  );
}
