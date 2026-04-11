import { motion } from "framer-motion";
import {
  Heart, Activity, Droplets, Moon, Flame, Footprints,
  Scale, TrendingUp, TrendingDown, Wind, Brain, Dumbbell,
} from "lucide-react";

interface Biometric {
  id: string;
  label: string;
  value: number;
  goal?: number;
  unit: string;
  icon: typeof Heart;
  color: string;
  ringColor: string;
  trend?: { direction: "up" | "down" | "stable"; value: string };
  status?: "good" | "warning" | "alert";
}

/**
 * Activity rings component (Apple Watch style)
 * 3 concentric rings: Move, Exercise, Stand
 */
function ActivityRings({ size = 180, move, exercise, stand }: {
  size?: number;
  move: { current: number; goal: number };
  exercise: { current: number; goal: number };
  stand: { current: number; goal: number };
}) {
  const center = size / 2;
  const ringWidth = size * 0.09;
  const gap = ringWidth * 0.4;

  // Outer ring (Move) - red/coral
  const r1 = center - ringWidth / 2 - 4;
  const c1 = 2 * Math.PI * r1;
  const movePct = Math.min(1, move.current / move.goal);

  // Middle ring (Exercise) - green/teal
  const r2 = r1 - ringWidth - gap;
  const c2 = 2 * Math.PI * r2;
  const exPct = Math.min(1, exercise.current / exercise.goal);

  // Inner ring (Stand) - blue
  const r3 = r2 - ringWidth - gap;
  const c3 = 2 * Math.PI * r3;
  const standPct = Math.min(1, stand.current / stand.goal);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <defs>
        <linearGradient id="moveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#F05A28" />
        </linearGradient>
        <linearGradient id="exGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="standGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* Background rings (faded) */}
      <circle cx={center} cy={center} r={r1} fill="none" stroke="rgba(251, 113, 133, 0.12)" strokeWidth={ringWidth} strokeLinecap="round" />
      <circle cx={center} cy={center} r={r2} fill="none" stroke="rgba(94, 234, 212, 0.12)" strokeWidth={ringWidth} strokeLinecap="round" />
      <circle cx={center} cy={center} r={r3} fill="none" stroke="rgba(96, 165, 250, 0.12)" strokeWidth={ringWidth} strokeLinecap="round" />

      {/* Active rings */}
      <motion.circle
        cx={center} cy={center} r={r1}
        fill="none" stroke="url(#moveGrad)" strokeWidth={ringWidth} strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${c1}` }}
        animate={{ strokeDasharray: `${c1 * movePct} ${c1}` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ filter: "drop-shadow(0 0 8px rgba(251, 113, 133, 0.4))" }}
      />
      <motion.circle
        cx={center} cy={center} r={r2}
        fill="none" stroke="url(#exGrad)" strokeWidth={ringWidth} strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${c2}` }}
        animate={{ strokeDasharray: `${c2 * exPct} ${c2}` }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        style={{ filter: "drop-shadow(0 0 8px rgba(94, 234, 212, 0.4))" }}
      />
      <motion.circle
        cx={center} cy={center} r={r3}
        fill="none" stroke="url(#standGrad)" strokeWidth={ringWidth} strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${c3}` }}
        animate={{ strokeDasharray: `${c3 * standPct} ${c3}` }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        style={{ filter: "drop-shadow(0 0 8px rgba(96, 165, 250, 0.4))" }}
      />
    </svg>
  );
}

/**
 * Single metric card with mini progress ring
 */
function MetricCard({ metric }: { metric: Biometric }) {
  const Icon = metric.icon;
  const pct = metric.goal ? Math.min(1, metric.value / metric.goal) : 0;
  const size = 56;
  const r = 24;
  const c = 2 * Math.PI * r;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-sm"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04]`}>
          <Icon className={`w-4 h-4 ${metric.color}`} style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
        </div>
        {metric.goal && (
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <motion.circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={metric.ringColor}
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${c}` }}
                animate={{ strokeDasharray: `${c * pct} ${c}` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ filter: `drop-shadow(0 0 4px ${metric.ringColor})` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-bold ${metric.color}`}>{Math.round(pct * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{metric.label}</p>
      <p className={`text-2xl font-bold font-data ${metric.color}`}>
        {metric.value.toLocaleString()}
        <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
      </p>
      {metric.goal && (
        <p className="text-[10px] text-muted-foreground mt-0.5">of {metric.goal.toLocaleString()} goal</p>
      )}
      {metric.trend && (
        <div className="flex items-center gap-1 mt-1">
          {metric.trend.direction === "up" && <TrendingUp className="w-3 h-3 text-teal" />}
          {metric.trend.direction === "down" && <TrendingDown className="w-3 h-3 text-coral" />}
          <span className={`text-[10px] ${
            metric.trend.direction === "up" ? "text-teal" :
            metric.trend.direction === "down" ? "text-coral" :
            "text-muted-foreground"
          }`}>{metric.trend.value}</span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Trend chart (sparkline) for a single metric
 */
function TrendChart({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  // Build gradient area
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`area-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#area-${color.replace("#", "")})`} points={areaPoints} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

/**
 * Main Biometrics Dashboard
 */
export default function BiometricsDashboard({ compact = false }: { compact?: boolean }) {
  // Mock data — in production, this comes from health_metrics table
  const moveData = { current: 1847, goal: 2200 };       // active calories
  const exerciseData = { current: 42, goal: 60 };       // exercise minutes
  const standData = { current: 9, goal: 12 };           // stand hours

  const totalActiveScore = Math.round(
    ((moveData.current / moveData.goal) +
     (exerciseData.current / exerciseData.goal) +
     (standData.current / standData.goal)) / 3 * 100
  );

  const metrics: Biometric[] = [
    { id: "weight",   label: "Weight",     value: 74.2,  unit: "kg",    icon: Scale,      color: "text-indigo",     ringColor: "#6366F1",
      trend: { direction: "down", value: "1.9 kg this month" } },
    { id: "bodyfat",  label: "Body Fat",   value: 17.4,  unit: "%",     icon: Activity,   color: "text-teal",       ringColor: "#0D9488",
      trend: { direction: "down", value: "0.7% this month" } },
    { id: "hr",       label: "Resting HR", value: 58,    unit: "bpm",   icon: Heart,      color: "text-coral",      ringColor: "#FB7185",
      trend: { direction: "down", value: "4 bpm — excellent" } },
    { id: "steps",    label: "Steps",      value: 9200,  goal: 10000,   unit: "",        icon: Footprints, color: "text-amber",      ringColor: "#F59E0B" },
    { id: "sleep",    label: "Sleep",      value: 7.4,   goal: 8,       unit: "h",       icon: Moon,       color: "text-violet",     ringColor: "#8B5CF6",
      trend: { direction: "up", value: "0.5h this month" } },
    { id: "water",    label: "Hydration",  value: 5,     goal: 8,       unit: "glasses", icon: Droplets,   color: "text-blue-400",   ringColor: "#60A5FA" },
    { id: "stress",   label: "Stress",     value: 4.2,   unit: "/10",   icon: Brain,      color: "text-violet",     ringColor: "#8B5CF6",
      trend: { direction: "down", value: "1.6 vs last month" } },
    { id: "spo2",     label: "SpO2",       value: 98,    unit: "%",     icon: Wind,       color: "text-teal",       ringColor: "#5EEAD4" },
  ];

  const visibleMetrics = compact ? metrics.slice(0, 4) : metrics;

  // Mock weekly trends for sparklines
  const weightTrend = [76.1, 75.8, 75.5, 75.2, 74.8, 74.5, 74.2];
  const stepTrend = [7800, 8200, 9100, 8900, 9500, 8700, 9200];
  const sleepTrend = [7.1, 6.8, 7.5, 7.2, 7.6, 7.4, 7.4];

  return (
    <div className="space-y-5">
      {/* Activity rings hero card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-coral/5 via-white/[0.02] to-teal/5 p-5 md:p-6 relative overflow-hidden"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>

        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-coral/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-teal/10 blur-3xl" />

        <div className="relative flex items-center gap-5 md:gap-8">
          {/* Rings */}
          <div className="shrink-0">
            <ActivityRings size={180} move={moveData} exercise={exerciseData} stand={standData} />
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Today's Activity</p>
              <p className="text-3xl md:text-4xl font-bold text-foreground">{totalActiveScore}<span className="text-lg text-muted-foreground">%</span></p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-coral" />
                <span className="text-xs text-muted-foreground flex-1">Move</span>
                <span className="text-xs font-data text-foreground">{moveData.current.toLocaleString()}/{moveData.goal.toLocaleString()} kcal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal" />
                <span className="text-xs text-muted-foreground flex-1">Exercise</span>
                <span className="text-xs font-data text-foreground">{exerciseData.current}/{exerciseData.goal} min</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs text-muted-foreground flex-1">Stand</span>
                <span className="text-xs font-data text-foreground">{standData.current}/{standData.goal} hr</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics grid */}
      <div>
        {!compact && (
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Vitals</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {visibleMetrics.map((m, i) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <MetricCard metric={m} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trend charts */}
      {!compact && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">7-Day Trends</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "Weight", data: weightTrend, color: "#6366F1", current: 74.2, unit: "kg" },
              { label: "Steps",  data: stepTrend,   color: "#F59E0B", current: 9200, unit: "steps" },
              { label: "Sleep",  data: sleepTrend,  color: "#8B5CF6", current: 7.4, unit: "h" },
            ].map(chart => (
              <div key={chart.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{chart.label}</span>
                  <span className="text-lg font-bold font-data" style={{ color: chart.color }}>
                    {chart.current.toLocaleString()}<span className="text-xs text-muted-foreground ml-1">{chart.unit}</span>
                  </span>
                </div>
                <div className="h-12">
                  <TrendChart data={chart.data} color={chart.color} height={48} />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
