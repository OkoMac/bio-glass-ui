import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NudgePopup from "@/components/NudgePopup";
import GlassCard from "@/components/GlassCard";
import { getSASTDateKey } from "@/utils/sastDate";
import BiometricsDashboard from "@/components/BiometricsDashboard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import AdBanner from "@/components/AdBanner";
import { useHealthLogs } from "@/hooks/useHealth";
import { useHabitProfile } from "@/hooks/useHabits";
import { deriveInsights } from "@/lib/insights";
import {
  ArrowLeft, AlertTriangle, CheckCircle, AlertCircle, TrendingUp,
  TrendingDown, Heart, Brain, Droplets, Moon, Dumbbell, Apple,
  Sparkles, Activity, Smartphone,
  WifiOff, ChevronRight
} from "lucide-react";

/* ── Types ──────────────────────────────────────────── */
type Severity = "good" | "warning" | "alert";
type Category = "fitness" | "nutrition" | "sleep" | "mental" | "medical" | "beauty" | "hydration";

interface Insight {
  id: string;
  category: Category;
  title: string;
  description: string;
  severity: Severity;
  metric?: string;
  trend?: "up" | "down" | "stable";
  recommendation: string;
}

interface BiometricSync {
  source: string;
  lastSync: string;
  connected: boolean;
  metrics: string[];
}

/* ── Device integrations — none live yet, presented honestly ───── */
const BIOMETRIC_SOURCES: BiometricSync[] = [
  { source: "Apple Health",   lastSync: "Coming soon", connected: false, metrics: ["Steps", "Heart Rate", "Sleep", "SpO2", "Workouts"] },
  { source: "Google Fit",     lastSync: "Coming soon", connected: false, metrics: ["Steps", "Heart Rate", "Calories", "Distance"] },
  { source: "Fitbit",         lastSync: "Coming soon", connected: false, metrics: ["Steps", "Heart Rate", "Sleep", "SpO2", "Stress"] },
  { source: "Samsung Health", lastSync: "Coming soon", connected: false, metrics: ["Steps", "Heart Rate", "Blood Pressure", "SpO2"] },
  { source: "Garmin",         lastSync: "Coming soon", connected: false, metrics: ["Steps", "Heart Rate", "VO2 Max", "Training Load"] },
  { source: "Whoop",          lastSync: "Coming soon", connected: false, metrics: ["Recovery", "Strain", "Sleep", "HRV"] },
];

/* ── Insights engine ──────────────────────────────────
   Real insights are derived per-user from health_logs + habit events inside
   the component via deriveInsights(). Module-level const stays empty as a
   documented no-op — see /src/lib/insights.ts for the rules.                 */

const CATEGORY_ICONS: Record<Category, typeof Heart> = {
  fitness: Dumbbell, nutrition: Apple, sleep: Moon, mental: Brain,
  medical: Heart, beauty: Sparkles, hydration: Droplets,
};

const CATEGORY_COLORS: Record<Category, string> = {
  fitness: "text-teal", nutrition: "text-amber", sleep: "text-violet",
  mental: "text-indigo", medical: "text-coral", beauty: "text-pink-400", hydration: "text-blue-400",
};

const SEVERITY_CONFIG: Record<Severity, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  good:    { icon: CheckCircle,   color: "text-teal",   bg: "bg-teal/10",   label: "Good" },
  warning: { icon: AlertCircle,   color: "text-amber",  bg: "bg-amber/10",  label: "Watch" },
  alert:   { icon: AlertTriangle, color: "text-coral",  bg: "bg-coral/10",  label: "Action" },
};

/* ── Component ──────────────────────────────────────── */
export default function HealthInsights() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const [tab, setTab] = useState<"insights" | "biometrics">("insights");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  // Fixed: device sources are all "Coming soon" — no toggle state needed

  const { logs } = useHealthLogs(30);
  const { profile: habitProfile } = useHabitProfile();

  // Read today's water count from the flat localStorage key used across the app
  const waterToday = useMemo(() => {
    try {
      const key = `bion_water_${getSASTDateKey()}`;
      return parseInt(localStorage.getItem(key) ?? "0") || 0;
    } catch {
      return 0;
    }
  }, []);

  const INSIGHTS = useMemo(
    () => deriveInsights({ logs, habitProfile, waterToday, waterGoal: 8 }),
    [logs, habitProfile, waterToday],
  );

  const filtered = severityFilter === "all" ? INSIGHTS : INSIGHTS.filter(i => i.severity === severityFilter);
  const goodCount = INSIGHTS.filter(i => i.severity === "good").length;
  const warnCount = INSIGHTS.filter(i => i.severity === "warning").length;
  const alertCount = INSIGHTS.filter(i => i.severity === "alert").length;
  const hasInsights = INSIGHTS.length > 0;
  const overallScore = hasInsights
    ? Math.round(((goodCount * 3 + warnCount * 1) / (INSIGHTS.length * 3)) * 100)
    : 0;

  // toggleConnection removed — device sync is "Coming soon", not interactive yet

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      {/* Layer 4 nudge — health tools education on first visit */}
      <NudgePopup featureKey="health_tools_first" />
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-20 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Health Insights</h1>
            <p className="text-xs text-muted-foreground">B_ analysis of your health, wellness & beauty</p>
          </div>
        </div>

        {!user && (
          <div className="mx-4 mb-3 p-3 rounded-2xl glass-1 border border-indigo/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Sign up free to save your progress and unlock full features</p>
            <a href="/welcome" className="rounded-pill px-3 py-1.5 text-xs font-semibold gradient-indigo text-primary-foreground shrink-0">Sign up free</a>
          </div>
        )}

        <AdBanner slot="utilities-top" format="horizontal" />

        {/* Biometrics Dashboard with rings + trend charts */}
        <BiometricsDashboard />

        {/* Overall score — only shown once we have real insights to score */}
        {hasInsights && (
          <GlassCard className="p-5">
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#0D9488" strokeWidth="8"
                    strokeDasharray={`${overallScore * 2.64} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{overallScore}</span>
                  <span className="text-[9px] text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground mb-2">{firstName}'s Health Score</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-teal" />
                    <span className="text-xs text-foreground">{goodCount} areas looking good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber" />
                    <span className="text-xs text-foreground">{warnCount} areas to watch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-coral" />
                    <span className="text-xs text-foreground">{alertCount} actions needed</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Tab switch */}
        <div className="flex gap-2">
          <button onClick={() => setTab("insights")}
            className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
              tab === "insights" ? "border-teal/40 bg-teal/10 text-teal" : "border-white/08 text-muted-foreground"
            }`}>
            <Activity className="w-3.5 h-3.5 inline mr-1" /> Insights
          </button>
          <button onClick={() => setTab("biometrics")}
            className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
              tab === "biometrics" ? "border-indigo/40 bg-indigo/10 text-indigo" : "border-white/08 text-muted-foreground"
            }`}>
            <Smartphone className="w-3.5 h-3.5 inline mr-1" /> Device Sync
          </button>
        </div>

        {tab === "insights" && (
          <>
            {/* Severity filter — hidden until we have insights to filter */}
            {hasInsights && (
            <div className="flex gap-2">
              {([
                { key: "all" as const, label: "All" },
                { key: "alert" as const, label: "Action" },
                { key: "warning" as const, label: "Watch" },
                { key: "good" as const, label: "Good" },
              ]).map(f => (
                <button key={f.key} onClick={() => setSeverityFilter(f.key)}
                  className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-all ${
                    severityFilter === f.key
                      ? f.key === "alert" ? "border-coral/40 bg-coral/10 text-coral"
                        : f.key === "warning" ? "border-amber/40 bg-amber/10 text-amber"
                        : f.key === "good" ? "border-teal/40 bg-teal/10 text-teal"
                        : "border-indigo/40 bg-indigo/10 text-indigo"
                      : "border-white/08 text-muted-foreground"
                  }`}>{f.label}</button>
              ))}
            </div>
            )}

            {/* Insights list */}
            {!hasInsights ? (
              <GlassCard className="p-8 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-semibold text-foreground">No insights yet</p>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
                  Log your weight, sleep, steps and meals for a week. B_ will spot patterns and surface personalised recommendations here.
                </p>
                <button
                  onClick={() => navigate("/progress")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-pill px-4 py-2 gradient-indigo text-primary-foreground text-xs font-semibold"
                >
                  Start tracking <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </GlassCard>
            ) : (
            <div className="space-y-3">
              {filtered.map((insight, i) => {
                const sev = SEVERITY_CONFIG[insight.severity];
                const SevIcon = sev.icon;
                const CatIcon = CATEGORY_ICONS[insight.category];
                return (
                  <motion.div key={insight.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}>
                    <GlassCard className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl ${sev.bg} flex items-center justify-center shrink-0`}>
                          <SevIcon className={`w-4 h-4 ${sev.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CatIcon className={`w-3 h-3 ${CATEGORY_COLORS[insight.category]}`} />
                            <span className={`text-[10px] uppercase tracking-wider font-medium ${CATEGORY_COLORS[insight.category]}`}>
                              {insight.category}
                            </span>
                            {insight.metric && (
                              <span className="text-[10px] font-data text-foreground ml-auto flex items-center gap-0.5">
                                {insight.trend === "up" && <TrendingUp className="w-2.5 h-2.5 text-teal" />}
                                {insight.trend === "down" && <TrendingDown className="w-2.5 h-2.5 text-coral" />}
                                {insight.metric}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                          <div className="mt-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <p className="text-[10px] text-teal"><span className="font-medium">B_ recommends:</span> {insight.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
            )}
          </>
        )}

        {tab === "biometrics" && (
          <div className="space-y-3">
            <GlassCard variant="accent-indigo" className="p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-indigo shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Connect Your Devices</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Sync biometrics from your phone or wearable. B_ uses this data to provide personalised health insights, detect anomalies, and track your progress automatically.
                  </p>
                </div>
              </div>
            </GlassCard>

            {BIOMETRIC_SOURCES.map(source => {
              return (
                <GlassCard key={source.source} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.03]">
                      <WifiOff className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{source.source}</p>
                      <p className="text-[10px] text-muted-foreground">{source.lastSync}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {source.metrics.map(m => (
                          <span key={m} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.03] text-muted-foreground border border-white/[0.06]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-semibold bg-white/[0.04] text-muted-foreground border border-white/5">
                      Coming soon
                    </span>
                  </div>
                </GlassCard>
              );
            })}

            {/* Latest manually-logged metrics from Progress / HealthProfile */}
            <ManualMetricsPanel />
            <p className="text-[10px] text-muted-foreground text-center -mt-2">
              Manual entries from your Progress page. Wearable sync coming soon.
            </p>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4">
        <AdBanner slot="utilities-bottom" format="rectangle" />
      </div>

      <BionAssistant />
      <BottomNav />
    </div>
  );
}

/* ── Sub-component: real metrics from health_logs ────────── */
function ManualMetricsPanel() {
  const { logs } = useHealthLogs(7);
  const latest = logs[logs.length - 1];

  const metrics = [
    { label: "Weight",    value: latest?.weight_kg,    unit: "kg",   icon: Activity, color: "text-indigo" },
    { label: "Body Fat",  value: latest?.body_fat_pct, unit: "%",    icon: Heart,    color: "text-coral" },
    { label: "Steps",     value: latest?.steps != null ? Math.round(latest.steps).toLocaleString() : null, unit: "steps", icon: Activity, color: "text-teal" },
    { label: "Sleep",     value: latest?.sleep_hours,  unit: "hours", icon: Moon,     color: "text-violet" },
    { label: "Resting HR", value: latest?.resting_hr,  unit: "bpm",  icon: Heart,    color: "text-coral" },
    { label: "Lean Mass", value: latest?.lean_mass_kg, unit: "kg",   icon: Activity, color: "text-amber" },
  ];

  const hasAny = metrics.some(m => m.value != null && m.value !== "");

  if (!hasAny) {
    return (
      <GlassCard className="p-5 text-center">
        <p className="text-sm text-foreground font-medium">No metrics logged yet</p>
        <p className="text-xs text-muted-foreground mt-1">Open Progress to log your weight, sleep, steps and more.</p>
      </GlassCard>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Latest Metrics</p>
      <div className="grid grid-cols-2 gap-2">
        {metrics.filter(m => m.value != null && m.value !== "").map(m => {
          const Icon = m.icon;
          return (
            <GlassCard key={m.label} className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
                <Icon className={`w-3 h-3 ${m.color}`} />
              </div>
              <p className={`text-xl font-bold ${m.color}`}>
                {m.value}<span className="text-xs font-normal text-muted-foreground ml-1">{m.unit}</span>
              </p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
