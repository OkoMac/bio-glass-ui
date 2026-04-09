import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";

// Simple SVG sparkline
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100, h = 32;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-8">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={color} />
    </svg>
  );
}

const metrics = [
  { label: "Weight",      unit: "kg",  current: 74.2, prev: 75.8, data: [76.1,75.8,75.4,75.0,74.8,74.5,74.2], color: "#6366F1", trend: "down" },
  { label: "Body Fat",    unit: "%",   current: 17.4, prev: 18.1, data: [18.5,18.3,18.1,17.9,17.7,17.5,17.4], color: "#2DD4BF", trend: "down" },
  { label: "Lean Mass",   unit: "kg",  current: 61.3, prev: 61.0, data: [60.5,60.7,61.0,61.0,61.2,61.2,61.3], color: "#A78BFA", trend: "up" },
  { label: "Resting HR",  unit: "bpm", current: 58,   prev: 62,   data: [64,63,62,61,60,59,58],              color: "#FB7185", trend: "down" },
  { label: "Steps/day",   unit: "k",   current: 9.2,  prev: 7.8,  data: [7.1,7.8,8.2,8.5,8.8,9.0,9.2],      color: "#FBBF24", trend: "up" },
  { label: "Sleep",       unit: "h",   current: 7.4,  prev: 6.9,  data: [6.5,6.9,7.0,7.1,7.2,7.3,7.4],      color: "#2DD4BF", trend: "up" },
];

const milestones = [
  { emoji: "🎯", label: "First session completed",     date: "Jan 10", earned: true },
  { emoji: "🔥", label: "7-day workout streak",        date: "Feb 3",  earned: true },
  { emoji: "⚡", label: "Lost first 2kg",              date: "Feb 12", earned: true },
  { emoji: "💪", label: "50 sessions milestone",       date: "—",       earned: false },
  { emoji: "🏆", label: "Body fat under 15%",          date: "—",       earned: false },
];

const logLabels = ["Jan 17", "Jan 24", "Jan 31", "Feb 7", "Feb 14", "Feb 21", "Today"];

export default function Progress() {
  const navigate = useNavigate();
  const [liveMetrics, setLiveMetrics] = useState(metrics);
  const [logInput, setLogInput] = useState<Record<string, string>>({});
  const [logOpen, setLogOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-5xl px-4 pt-12 space-y-5">
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
                onClick={() => {
                  setLiveMetrics(prev => prev.map(m => {
                    const fieldKey = m.label === "Weight"    ? "Weight (kg)"  :
                                     m.label === "Body Fat"  ? "Body Fat (%)" :
                                     m.label === "Steps/day" ? "Steps (k)"    :
                                     m.label === "Sleep"     ? "Sleep (h)"    : null;
                    if (!fieldKey || !logInput[fieldKey]) return m;
                    const newVal = parseFloat(logInput[fieldKey]);
                    if (isNaN(newVal)) return m;
                    return { ...m, prev: m.current, current: newVal, data: [...m.data.slice(1), newVal] };
                  }));
                  setSaved(true);
                  setLogInput({});
                  setTimeout(() => { setSaved(false); setLogOpen(false); }, 1200);
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
