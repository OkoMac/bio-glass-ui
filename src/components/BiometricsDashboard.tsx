import { motion } from "framer-motion";
import {
  Heart, Activity, Droplets, Moon, Flame, Footprints,
  Scale, TrendingUp, TrendingDown, Wind, Brain, Dumbbell, Plus,
  Smartphone,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useHealthLogs } from "@/hooks/useHealth";
import { useNativeHealth } from "@/hooks/useNativeHealth";
import { useNavigate } from "react-router-dom";
import { localDateKey } from "@/lib/relativeTime";

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
  // ── Real data from health_logs + localStorage ──
  // Empty state (new user with no entries) shows a prompt, not fake numbers.
  const navigate = useNavigate();
  const { logs, loading } = useHealthLogs(30);
  const native = useNativeHealth();

  // Local civil date so the daily reset matches the user's clock, not UTC.
  // Pre-fix the home tile said "8 glasses" three minutes after midnight.
  const today = localDateKey();
  const todayLog = logs.find(l => l.log_date === today);
  const latestWithWeight = [...logs].reverse().find(l => l.weight_kg != null);
  const latestWithBodyFat = [...logs].reverse().find(l => l.body_fat_pct != null);
  const latestWithHR = [...logs].reverse().find(l => l.resting_hr != null);
  const latestWithSleep = [...logs].reverse().find(l => l.sleep_hours != null);

  // Water is logged locally by WaterTracker; read today's count.
  let todayWater = 0;
  try { todayWater = parseInt(localStorage.getItem(`bion_water_${today}`) ?? "0") || 0; } catch { /* no-op */ }

  const hasAnyData = logs.length > 0 || todayWater > 0 || native.steps !== null || native.weight !== null;

  // Prefer native device data over manually-logged data when available
  const effectiveSteps = native.steps ?? todayLog?.steps ?? 0;
  const effectiveHR = native.heartRate ?? latestWithHR?.resting_hr ?? 0;
  const effectiveSleep = native.sleep ?? latestWithSleep?.sleep_hours ?? 0;
  const effectiveWeight = native.weight ?? latestWithWeight?.weight_kg ?? 0;

  // Compute trends (only if we have ≥ 2 data points of that metric)
  const diffSince = <K extends keyof typeof logs[number]>(key: K) => {
    const withValues = logs.filter(l => (l as any)[key] != null);
    if (withValues.length < 2) return undefined;
    const first = Number((withValues[0] as any)[key]);
    const last = Number((withValues[withValues.length - 1] as any)[key]);
    const delta = last - first;
    return { delta, first, last };
  };
  const weightDiff = diffSince("weight_kg");
  const bodyFatDiff = diffSince("body_fat_pct");
  const hrDiff = diffSince("resting_hr");
  const sleepDiff = diffSince("sleep_hours");

  const moveData     = { current: effectiveSteps, goal: 10000 };
  const exerciseData = { current: 0, goal: 60 };  // no exercise minutes logged today — empty
  const standData    = { current: 0, goal: 12 };  // stand-hours not yet logged

  const totalActiveScore = moveData.goal > 0
    ? Math.round((moveData.current / moveData.goal) * 100)
    : 0;

  const metrics: Biometric[] = [
    { id: "weight",   label: "Weight",     value: effectiveWeight, unit: "kg", icon: Scale, color: "text-indigo", ringColor: "#6366F1",
      trend: weightDiff ? { direction: weightDiff.delta < 0 ? "down" : weightDiff.delta > 0 ? "up" : "stable", value: `${weightDiff.delta > 0 ? "+" : ""}${weightDiff.delta.toFixed(1)} kg over ${logs.length} entries` } : undefined },
    { id: "bodyfat",  label: "Body Fat",   value: latestWithBodyFat?.body_fat_pct ?? 0, unit: "%", icon: Activity, color: "text-teal", ringColor: "#0D9488",
      trend: bodyFatDiff ? { direction: bodyFatDiff.delta < 0 ? "down" : bodyFatDiff.delta > 0 ? "up" : "stable", value: `${bodyFatDiff.delta > 0 ? "+" : ""}${bodyFatDiff.delta.toFixed(1)}%` } : undefined },
    { id: "hr",       label: "Resting HR", value: effectiveHR, unit: "bpm", icon: Heart, color: "text-coral", ringColor: "#FB7185",
      trend: hrDiff ? { direction: hrDiff.delta < 0 ? "down" : hrDiff.delta > 0 ? "up" : "stable", value: `${hrDiff.delta > 0 ? "+" : ""}${hrDiff.delta} bpm` } : undefined },
    { id: "steps",    label: "Steps",      value: effectiveSteps, goal: 10000, unit: "", icon: Footprints, color: "text-amber", ringColor: "#F59E0B" },
    { id: "sleep",    label: "Sleep",      value: effectiveSleep, goal: 8, unit: "h", icon: Moon, color: "text-violet", ringColor: "#8B5CF6",
      trend: sleepDiff ? { direction: sleepDiff.delta > 0 ? "up" : sleepDiff.delta < 0 ? "down" : "stable", value: `${sleepDiff.delta > 0 ? "+" : ""}${sleepDiff.delta.toFixed(1)}h` } : undefined },
    { id: "water",    label: "Hydration",  value: todayWater, goal: 8, unit: "glasses", icon: Droplets, color: "text-blue-400", ringColor: "#60A5FA" },
  ];

  const visibleMetrics = compact ? metrics.slice(0, 4) : metrics;

  // Sparklines only when we have logged data
  const weightTrend = logs.map(l => l.weight_kg).filter((v): v is number => v != null);
  const stepTrend   = logs.map(l => l.steps).filter((v): v is number => v != null);
  const sleepTrend  = logs.map(l => l.sleep_hours).filter((v): v is number => v != null);

  // ── Empty-state prompt for brand-new users ──
  if (!loading && !hasAnyData) {
    return (
      <div className="space-y-4">
        <div className="glass-1 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo/15 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Start tracking your health</p>
              <p className="text-xs text-muted-foreground">No data yet — your dashboard fills in as you log.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => navigate("/water-tracker")} className="glass-1 rounded-xl p-3 text-left hover:bg-white/5 transition-colors">
              <Droplets className="w-4 h-4 text-blue-400 mb-1.5" />
              <p className="text-xs font-medium text-foreground">Log water</p>
            </button>
            <button onClick={() => navigate("/food-tracker")} className="glass-1 rounded-xl p-3 text-left hover:bg-white/5 transition-colors">
              <Flame className="w-4 h-4 text-coral mb-1.5" />
              <p className="text-xs font-medium text-foreground">Log food</p>
            </button>
            <button onClick={() => navigate("/sleep-tracker")} className="glass-1 rounded-xl p-3 text-left hover:bg-white/5 transition-colors">
              <Moon className="w-4 h-4 text-violet mb-1.5" />
              <p className="text-xs font-medium text-foreground">Log sleep</p>
            </button>
            <button onClick={() => navigate("/health-profile")} className="glass-1 rounded-xl p-3 text-left hover:bg-white/5 transition-colors">
              <Scale className="w-4 h-4 text-indigo mb-1.5" />
              <p className="text-xs font-medium text-foreground">Add weight</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Native health sync prompt — only when there's actually a native
          shell to install. Hidden for now: the Capacitor iOS/Android
          build hasn't shipped to the App Store / Play Store, and PWA
          users (already "installed" via Add-to-Home-Screen) were being
          told to "install the BION app" they already had open, which
          read as "the app you're using doesn't exist". Re-enable when
          native ships. */}
      {false && !native.isNative && !compact && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-indigo/20 bg-indigo/5 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo/15 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-indigo" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Install the BION app for biometric sync</p>
            <p className="text-xs text-muted-foreground">Get automatic step, heart-rate, sleep &amp; weight data from Apple Health or Health Connect.</p>
          </div>
        </motion.div>
      )}

      {native.isNative && !native.authorized && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-teal/20 bg-teal/5 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-teal" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Connect your health data</p>
            <p className="text-xs text-muted-foreground mb-2">Allow BION to read from {Capacitor.getPlatform() === "ios" ? "Apple Health" : "Health Connect"} for automatic tracking.</p>
            <button
              onClick={() => native.requestAuth()}
              disabled={native.loading}
              className="text-xs font-medium text-teal bg-teal/10 hover:bg-teal/20 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {native.loading ? "Connecting..." : "Connect Health Data"}
            </button>
          </div>
        </motion.div>
      )}

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
            {/*
              `current` MUST come from real logs. Pre-fix this block had
              hard-coded demo values (74.2 kg, 9200 steps, 7.4 h) so the
              7-day-trend tile said 74.2 kg even when the user had logged
              nothing — directly contradicting the Vitals tile two rows up
              that correctly read 0 kg from the same data set. Now both
              tiles read from `logs` so they can never disagree.
            */}
            {[
              { label: "Weight", data: weightTrend, color: "#6366F1", current: weightTrend.length ? weightTrend[weightTrend.length - 1] : null, unit: "kg" },
              { label: "Steps",  data: stepTrend,   color: "#F59E0B", current: stepTrend.length   ? stepTrend[stepTrend.length - 1]     : null, unit: "steps" },
              { label: "Sleep",  data: sleepTrend,  color: "#8B5CF6", current: sleepTrend.length  ? sleepTrend[sleepTrend.length - 1]   : null, unit: "h" },
            ].map(chart => (
              <div key={chart.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{chart.label}</span>
                  <span className="text-lg font-bold font-data" style={{ color: chart.current == null ? "#6B7280" : chart.color }}>
                    {chart.current == null ? "—" : chart.current.toLocaleString()}
                    <span className="text-xs text-muted-foreground ml-1">{chart.unit}</span>
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
