import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import SubscriptionGate from "@/components/SubscriptionGate";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, AlertTriangle, CheckCircle, AlertCircle, TrendingUp,
  TrendingDown, Heart, Brain, Droplets, Moon, Dumbbell, Apple,
  Pill, Sparkles, Activity, Eye, Shield, Flame, Smartphone,
  Wifi, WifiOff, ChevronRight
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

/* ── Mock biometric connections ────────────────────── */
const BIOMETRIC_SOURCES: BiometricSync[] = [
  { source: "Apple Health", lastSync: "2 min ago", connected: true, metrics: ["Steps", "Heart Rate", "Sleep", "SpO2", "Workouts"] },
  { source: "Google Fit", lastSync: "Never", connected: false, metrics: ["Steps", "Heart Rate", "Calories", "Distance"] },
  { source: "Fitbit", lastSync: "Never", connected: false, metrics: ["Steps", "Heart Rate", "Sleep", "SpO2", "Stress"] },
  { source: "Samsung Health", lastSync: "Never", connected: false, metrics: ["Steps", "Heart Rate", "Blood Pressure", "SpO2"] },
  { source: "Garmin", lastSync: "Never", connected: false, metrics: ["Steps", "Heart Rate", "VO2 Max", "Training Load"] },
  { source: "Whoop", lastSync: "Never", connected: false, metrics: ["Recovery", "Strain", "Sleep", "HRV"] },
];

/* ── Insights engine ──────────────────────────────── */
const INSIGHTS: Insight[] = [
  // Fitness
  { id: "fit1", category: "fitness", title: "Activity Streak", description: "You're on a 14-day activity streak — your longest this quarter.", severity: "good", metric: "14 days", trend: "up", recommendation: "Keep it up! 7 more days unlocks the Consistency badge." },
  { id: "fit2", category: "fitness", title: "Recovery Score Low", description: "Your recovery routine compliance is only 21% (3/14 days). This may lead to overtraining or injury.", severity: "alert", metric: "21%", trend: "down", recommendation: "Complete your physio recovery exercises at least 3× per week. Consider booking a follow-up with The Chiropractors." },
  { id: "fit3", category: "fitness", title: "Lean Mass Increasing", description: "Lean body mass increased by 0.3kg this month while body fat decreased.", severity: "good", metric: "+0.3 kg", trend: "up", recommendation: "Your training programme is working. Maintain current protein intake of 1.6g/kg body weight." },
  // Nutrition
  { id: "nut1", category: "nutrition", title: "Protein Intake Inconsistent", description: "You hit your protein target only 4 of the last 7 days. Average: 95g (target: 120g).", severity: "warning", metric: "95g avg", trend: "down", recommendation: "Add a protein shake post-workout and include eggs or chicken at breakfast to consistently hit 120g." },
  { id: "nut2", category: "nutrition", title: "Calorie Surplus on Weekends", description: "Weekend calories average 2,450 kcal — 22% above your 2,000 kcal goal. This slows weight loss progress.", severity: "warning", metric: "+450 kcal", trend: "up", recommendation: "Plan meals ahead for Saturday/Sunday. Prep healthy snacks to avoid impulse eating." },
  // Sleep
  { id: "slp1", category: "sleep", title: "Sleep Quality Good", description: "Average 7.4 hours over the last 7 nights — above the 7h minimum for recovery.", severity: "good", metric: "7.4h avg", trend: "stable", recommendation: "Maintain your 10:30pm bedtime. Sleep quality drops noticeably when you exercise after 8pm." },
  { id: "slp2", category: "sleep", title: "Wednesday Sleep Dip", description: "You consistently get less than 6.5h on Wednesday nights (avg: 6.1h).", severity: "warning", metric: "6.1h Wed", trend: "down", recommendation: "Consider moving Wednesday evening activities earlier or implementing a wind-down routine by 9:30pm." },
  // Mental
  { id: "men1", category: "mental", title: "Stress Score Improving", description: "Stress score decreased from 5.8 to 4.2 over 2 weeks. Goal: under 4.", severity: "good", metric: "4.2/10", trend: "down", recommendation: "Your meditation habit is helping. Try adding a 5-min breathing exercise before bed for further improvement." },
  { id: "men2", category: "mental", title: "Mindfulness Gaps", description: "You skipped meditation on 3 of the last 7 days, correlating with higher stress scores.", severity: "warning", metric: "4/7 days", trend: "down", recommendation: "Even 5 minutes of focused breathing counts. Try the B_ guided session — it takes just 5 minutes." },
  // Medical
  { id: "med1", category: "medical", title: "Resting Heart Rate Excellent", description: "58 bpm is in the athlete range — indicates strong cardiovascular fitness.", severity: "good", metric: "58 bpm", trend: "down", recommendation: "Continue your cardio mix. Consider adding a 5km run once per week to maintain." },
  { id: "med2", category: "medical", title: "Medication Compliance", description: "Morning supplements taken 12/14 days. Evening supplements only 8/14 days.", severity: "warning", metric: "57% PM", trend: "down", recommendation: "Set an 8pm alarm for evening supplements. Place them next to your toothbrush as a visual cue." },
  // Beauty
  { id: "bty1", category: "beauty", title: "Skincare Routine Adherence", description: "You completed your full skincare routine 5 of the last 7 days.", severity: "good", metric: "5/7 days", trend: "stable", recommendation: "Good consistency! Your skin hydration markers are improving. Don't skip SPF — even on cloudy days." },
  // Hydration
  { id: "hyd1", category: "hydration", title: "Hydration Below Target", description: "Average 5.6 glasses per day (target: 8). Three days below 5 glasses this week.", severity: "alert", metric: "5.6/8", trend: "down", recommendation: "Dehydration impacts energy, skin, and recovery. Set hourly water reminders or carry a marked water bottle." },
];

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
  const [connectedSources, setConnectedSources] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    BIOMETRIC_SOURCES.forEach(s => { map[s.source] = s.connected; });
    return map;
  });

  const filtered = severityFilter === "all" ? INSIGHTS : INSIGHTS.filter(i => i.severity === severityFilter);
  const goodCount = INSIGHTS.filter(i => i.severity === "good").length;
  const warnCount = INSIGHTS.filter(i => i.severity === "warning").length;
  const alertCount = INSIGHTS.filter(i => i.severity === "alert").length;
  const overallScore = Math.round(((goodCount * 3 + warnCount * 1) / (INSIGHTS.length * 3)) * 100);

  const toggleConnection = (source: string) => {
    setConnectedSources(prev => ({ ...prev, [source]: !prev[source] }));
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <SubscriptionGate feature="biometricTracking" featureName="Health Insights" description="Get AI-powered health analysis, connect wearable devices, and pinpoint potential wellness issues across all your activities.">
      <div className="mx-auto max-w-lg px-4 pt-12 space-y-5">

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

        {/* Overall score */}
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
            {/* Severity filter */}
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

            {/* Insights list */}
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
              const isConnected = connectedSources[source.source] ?? source.connected;
              return (
                <GlassCard key={source.source} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? "bg-teal/10" : "bg-white/[0.03]"}`}>
                      {isConnected ? <Wifi className="w-4 h-4 text-teal" /> : <WifiOff className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{source.source}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isConnected ? `Last sync: ${source.lastSync}` : "Not connected"}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {source.metrics.map(m => (
                          <span key={m} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.03] text-muted-foreground border border-white/[0.06]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleConnection(source.source)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        isConnected ? "glass-1 text-coral border border-coral/20" : "bg-gradient-to-r from-teal to-emerald-400 text-white"
                      }`}>
                      {isConnected ? "Disconnect" : "Connect"}
                    </motion.button>
                  </div>
                </GlassCard>
              );
            })}

            {/* Current synced data */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Synced Biometrics</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Heart Rate", value: "58", unit: "bpm", icon: Heart, color: "text-coral" },
                  { label: "Steps Today", value: "6,240", unit: "steps", icon: Activity, color: "text-teal" },
                  { label: "SpO2", value: "98", unit: "%", icon: Droplets, color: "text-blue-400" },
                  { label: "Sleep", value: "7.6", unit: "hours", icon: Moon, color: "text-violet" },
                  { label: "Calories Burned", value: "1,340", unit: "kcal", icon: Flame, color: "text-amber" },
                  { label: "Stress Level", value: "4.2", unit: "/10", icon: Brain, color: "text-indigo" },
                ].map(metric => {
                  const Icon = metric.icon;
                  return (
                    <GlassCard key={metric.label} className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</span>
                        <Icon className={`w-3 h-3 ${metric.color}`} />
                      </div>
                      <p className={`text-xl font-bold ${metric.color}`}>
                        {metric.value}<span className="text-xs font-normal text-muted-foreground ml-1">{metric.unit}</span>
                      </p>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      </SubscriptionGate>
      <BionAssistant />
      <BottomNav />
    </div>
  );
}
