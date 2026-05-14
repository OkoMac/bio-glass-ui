import { useState, useEffect, useCallback } from "react";
import { useHealthLogs, useHealthProfile } from "@/hooks/useHealth";
import { useNativeHealth } from "@/hooks/useNativeHealth";

// One-line explainers shown below each metric input. Helps users
// understand what each measurement contributes (Lee feedback 2026-05-01:
// "more intuition, less effort").
const METRIC_HELP: Record<string, string> = {
  "Weight":      "Body mass. Combined with height (from your profile) to compute BMI live below.",
  "Body Fat":    "% body fat — sharper signal than BMI. Athletes can be heavy yet lean; this captures that.",
  "Lean Mass":   "Muscle + bone + organs. Helps distinguish 'gained 2kg of muscle' from 'gained 2kg of fat'.",
  "Resting HR":  "Resting heart rate, measured first thing in the morning. Lower = better cardio fitness.",
  "Daily Steps": "Activity level. ~8,000 steps/day is a strong floor for general health.",
  "Sleep Avg":   "Hours of sleep last night. 7-9h is the healthy adult range.",
};

function computeBMI(weightKg: number, heightCm: number | null | undefined): { value: number; band: string; color: string } | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  // WHO bands (adult). South African public-health guidance follows the same.
  if (bmi < 18.5) return { value: bmi, band: "Underweight", color: "text-amber-400" };
  if (bmi < 25)   return { value: bmi, band: "Healthy",     color: "text-teal-400" };
  if (bmi < 30)   return { value: bmi, band: "Overweight",  color: "text-amber-400" };
  return { value: bmi, band: "Obese", color: "text-coral" };
}
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureDiscovery } from "@/hooks/useFeatureDiscovery";
import { getSASTDateKey } from "@/utils/sastDate";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { getProviderImage } from "@/lib/providerImages";
// Connected providers loaded dynamically from user's bookings
import {
  ArrowLeft, Heart, Activity, Shield, Pill, AlertTriangle,
  TrendingUp, ChevronRight, CheckCircle,
  Scale, Dna, Eye, Lock, X, Plus, EyeOff, AlertCircle
} from "lucide-react";

// Connected providers populated from actual bookings (see useEffect below)

type PrivacyLevel = "private" | "provider";

interface ProviderAccess {
  [providerId: string]: boolean;
}

interface HealthMetric {
  label: string;
  value: string;
  unit: string;
  trend?: string;
  color: string;
  icon: typeof Heart;
}

interface HealthGoal {
  id: string;
  label: string;
  target: string;
  progress: number;
  deadline: string;
  vertical: string;
}

// Goals start empty — users create their own via "Add Goal" in the UI.
const INITIAL_GOALS: HealthGoal[] = [];

const VERTICAL_OPTIONS = [
  { value: "fitness",     label: "Fitness",     color: "text-teal"   },
  { value: "mindfulness", label: "Mindfulness", color: "text-violet" },
  { value: "nutrition",   label: "Nutrition",   color: "text-amber"  },
  { value: "medical",     label: "Medical",     color: "text-indigo" },
];

// Types for medical entries (persisted to localStorage per user)
interface MedCondition { id: string; label: string; note: string; severity: "none" | "mild" | "managed" }
interface MedMedication { id: string; name: string; dose: string; frequency: string }

const PRIVACY_LABELS: Record<PrivacyLevel, { label: string; icon: typeof Lock; color: string }> = {
  private:  { label: "Only me",         icon: Lock,   color: "text-coral"  },
  provider: { label: "My providers",    icon: Shield, color: "text-indigo" },
};

type Tab = "metrics" | "goals" | "medical" | "privacy";

const SEV_COLOR = { none: "text-teal", mild: "text-amber", managed: "text-indigo" };
const VERT_COLOR: Record<string, string> = {
  fitness: "from-teal to-emerald-400",
  mindfulness: "from-indigo to-violet",
  nutrition: "from-amber to-orange-400",
  medical: "from-indigo to-blue-400",
};

export default function HealthProfile() {
  const navigate = useNavigate();
  const { logs, logToday } = useHealthLogs(30);
  const { profile: healthProfile } = useHealthProfile();
  const heightCm = healthProfile?.height_cm ?? null;

  // B2-2: passive step + sleep + weight auto-sync from HealthKit /
  // Health Connect. Lee feedback 2026-05-01: "logging steps is a pain
  // in the ass." When running inside the Capacitor wrapper and the user
  // has granted health-data permissions, BION pulls today's steps and
  // writes them to health_logs.steps automatically — no manual entry.
  // Same path picks up most-recent weight + last night's sleep.
  // Web (non-native) is a no-op; the manual modal still works.
  const native = useNativeHealth();
  useEffect(() => {
    if (!native.isNative || !native.authorized) return;
    const todayStr = getSASTDateKey();
    const todayLog = logs.find((l: any) => l.log_date === todayStr) ?? {};
    const patch: Record<string, number> = {};
    if (typeof native.steps === "number" && native.steps > ((todayLog as any).steps ?? 0)) {
      patch.steps = Math.round(native.steps);
    }
    if (typeof native.weight === "number" && !(todayLog as any).weight_kg) {
      patch.weight_kg = Math.round(native.weight * 10) / 10;
    }
    if (typeof native.sleep === "number" && !(todayLog as any).sleep_hours) {
      patch.sleep_hours = Math.round(native.sleep * 10) / 10;
    }
    if (Object.keys(patch).length > 0) {
      logToday(patch).catch(() => { /* network blip — next refresh tick will retry */ });
    }
    // Re-run when native counters change. logs is stable enough — using
    // the timestamp of the latest log keeps the deps lean.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native.isNative, native.authorized, native.steps, native.weight, native.sleep]);
  const { showTip } = useFeatureDiscovery();
  const [tab, setTab]   = useState<Tab>("metrics");

  useEffect(() => {
    showTip("health-profile", "Tip: Fill in your medical info so providers can give you better care.");
  }, [showTip]);

  // Derive current metric values from the user's actual health_logs.
  // New users (no logs) see em-dashes and a call-to-action to log their first reading.
  const METRICS: HealthMetric[] = (() => {
    const latest = <K extends keyof typeof logs[number]>(key: K) => {
      const rev = [...logs].reverse().find(l => (l as any)[key] != null);
      return rev ? Number((rev as any)[key]) : null;
    };
    const diff = <K extends keyof typeof logs[number]>(key: K) => {
      const withVals = logs.filter(l => (l as any)[key] != null);
      if (withVals.length < 2) return null;
      const d = Number((withVals[withVals.length - 1] as any)[key]) - Number((withVals[0] as any)[key]);
      return d;
    };
    const fmt = (n: number | null, digits = 1) => (n == null ? "—" : n.toFixed(digits));
    const w = latest("weight_kg"), bf = latest("body_fat_pct"), lm = latest("lean_mass_kg");
    const hr = latest("resting_hr"), steps = latest("steps"), sleep = latest("sleep_hours");
    const wD = diff("weight_kg"), bfD = diff("body_fat_pct"), hrD = diff("resting_hr"), sleepD = diff("sleep_hours");
    return [
      { label: "Weight",      value: fmt(w),  unit: "kg",    color: "text-indigo", icon: Scale,
        trend: wD != null ? `${wD < 0 ? "↓" : wD > 0 ? "↑" : "="} ${Math.abs(wD).toFixed(1)} this month` : "" },
      { label: "Body Fat",    value: fmt(bf), unit: "%",     color: "text-teal",   icon: Activity,
        trend: bfD != null ? `${bfD < 0 ? "↓" : "↑"} ${Math.abs(bfD).toFixed(1)}` : "" },
      { label: "Lean Mass",   value: fmt(lm), unit: "kg",    color: "text-violet", icon: Dna, trend: "" },
      { label: "Resting HR",  value: hr == null ? "—" : String(hr), unit: "bpm", color: "text-coral", icon: Heart,
        trend: hrD != null ? `${hrD < 0 ? "↓" : "↑"} ${Math.abs(hrD)} this month` : "" },
      { label: "Daily Steps", value: steps == null ? "—" : steps.toLocaleString("en-ZA"), unit: "steps", color: "text-amber", icon: TrendingUp, trend: "" },
      { label: "Sleep Avg",   value: fmt(sleep), unit: "h", color: "text-teal", icon: Eye,
        trend: sleepD != null ? `${sleepD > 0 ? "↑" : "↓"} ${Math.abs(sleepD).toFixed(1)}` : "" },
    ];
  })();
  const [privacy, setPrivacy] = useState<Record<string, PrivacyLevel>>({
    metrics: "provider", goals: "provider", medical: "private", documents: "private",
  });
  const [medicalAccess, setMedicalAccess] = useState<ProviderAccess>({});
  const [documentAccess, setDocumentAccess] = useState<ProviderAccess>({});
  const [showProviderPicker, setShowProviderPicker] = useState<"medical" | "documents" | null>(null);

  // Connected providers from actual bookings (not hardcoded)
  const [connectedProviders, setConnectedProviders] = useState<{ id: string; name: string; image: string; category: string }[]>([]);
  const [confirmToggle, setConfirmToggle] = useState<{ section: "medical" | "documents"; providerId: string; providerName: string; granting: boolean } | null>(null);
  const [goals, setGoals] = useState<HealthGoal[]>(INITIAL_GOALS);
  const [showLogMetrics, setShowLogMetrics] = useState(false);
  const [metricInputs, setMetricInputs] = useState<Record<string, string>>({});
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ label: "", target: "", deadline: "", vertical: "fitness" });

  // ── Load connected providers from actual bookings ──
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.profileId || user.id?.startsWith("demo_")) return;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("bookings")
        .select("provider_id, providers:provider_id(id, full_name, avatar_url, category)")
        .eq("client_id", user.profileId!)
        .eq("status", "completed")
        .limit(20)
        .then(({ data }: any) => {
          if (!data) return;
          const seen = new Set<string>();
          const providers = (data as any[]).filter(b => {
            const pid = b.provider_id;
            if (!pid || seen.has(pid)) return false;
            seen.add(pid);
            return true;
          }).map(b => ({
            id: b.provider_id,
            name: (b.providers as any)?.full_name ?? "Provider",
            image: getProviderImage(b.provider_id, (b.providers as any)?.full_name ?? ""),
            category: (b.providers as any)?.category ?? "",
          }));
          setConnectedProviders(providers);
        });
    });
  }, [user?.profileId]);

  // ── Medical data (localStorage + Supabase health_profiles) ──
  const uid = user?.id ?? "guest";
  const profileId = user?.profileId;
  const isReal = !!profileId && !uid.startsWith("demo_");
  const lsKey = useCallback((k: string) => `bion_medical_${uid}_${k}`, [uid]);

  const loadLS = <T,>(key: string, fallback: T): T => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  };

  const [conditions, setConditions]   = useState<MedCondition[]>(() => loadLS(lsKey("conditions"), []));
  const [allergies, setAllergies]     = useState<string[]>(() => loadLS(lsKey("allergies"), []));
  const [medications, setMedications] = useState<MedMedication[]>(() => loadLS(lsKey("medications"), []));

  // Load from Supabase on mount
  useEffect(() => {
    if (!isReal || !profileId) return;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("health_profiles").select("conditions, allergies, medications, goals")
        .eq("user_id", profileId).maybeSingle().then(({ data }: any) => {
          if (!data) return;
          if (data.conditions && Array.isArray(data.conditions) && data.conditions.length > 0) setConditions(data.conditions);
          if (data.allergies && Array.isArray(data.allergies) && data.allergies.length > 0) setAllergies(data.allergies);
          if (data.medications && Array.isArray(data.medications) && data.medications.length > 0) setMedications(data.medications);
          if (data.goals && Array.isArray(data.goals) && data.goals.length > 0) setGoals(data.goals);
        });
    });
  }, [isReal, profileId]);

  // Persist to localStorage + Supabase
  const syncToDb = useCallback((field: string, value: unknown) => {
    if (!isReal || !profileId) return;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("health_profiles").upsert(
        { user_id: profileId, [field]: value, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      ).then(() => {});
    });
  }, [isReal, profileId]);

  useEffect(() => { localStorage.setItem(lsKey("conditions"), JSON.stringify(conditions)); syncToDb("conditions", conditions); },  [conditions, lsKey, syncToDb]);
  useEffect(() => { localStorage.setItem(lsKey("allergies"), JSON.stringify(allergies)); syncToDb("allergies", allergies); },    [allergies, lsKey, syncToDb]);
  useEffect(() => { localStorage.setItem(lsKey("medications"), JSON.stringify(medications)); syncToDb("medications", medications); }, [medications, lsKey, syncToDb]);
  useEffect(() => { if (goals.length > 0) syncToDb("goals", goals); }, [goals, syncToDb]);

  // Inline form visibility
  const [showAddCondition, setShowAddCondition]   = useState(false);
  const [showAddAllergy, setShowAddAllergy]       = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);

  // Edit targets (null = not editing)
  const [editCondition, setEditCondition]     = useState<string | null>(null);
  const [editMedication, setEditMedication]   = useState<string | null>(null);

  // New-entry drafts
  const [newCondition, setNewCondition]   = useState({ label: "", note: "", severity: "none" as MedCondition["severity"] });
  const [newAllergy, setNewAllergy]       = useState("");
  const [newMedication, setNewMedication] = useState({ name: "", dose: "", frequency: "" });

  const handleAddCondition = () => {
    if (!newCondition.label.trim()) return;
    setConditions(prev => [...prev, { id: `c${Date.now()}`, ...newCondition }]);
    setNewCondition({ label: "", note: "", severity: "none" });
    setShowAddCondition(false);
  };
  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    setAllergies(prev => [...prev, newAllergy.trim()]);
    setNewAllergy("");
    setShowAddAllergy(false);
  };
  const handleAddMedication = () => {
    if (!newMedication.name.trim()) return;
    setMedications(prev => [...prev, { id: `m${Date.now()}`, ...newMedication }]);
    setNewMedication({ name: "", dose: "", frequency: "" });
    setShowAddMedication(false);
  };

  const handleAddGoal = () => {
    if (!newGoal.label.trim()) return;
    const goal: HealthGoal = {
      id: `g${Date.now()}`,
      label: newGoal.label.trim(),
      target: newGoal.target.trim() || "—",
      progress: 0,
      deadline: newGoal.deadline.trim() || "No deadline",
      vertical: newGoal.vertical,
    };
    setGoals(prev => [...prev, goal]);
    setNewGoal({ label: "", target: "", deadline: "", vertical: "fitness" });
    setShowAddGoal(false);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "metrics", label: "Metrics" },
    { id: "goals",   label: "Goals"   },
    { id: "medical", label: "Medical" },
    { id: "privacy", label: "Privacy" },
  ];

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="max-w-lg md:max-w-3xl xl:max-w-7xl mx-auto px-4 pt-10 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Go back" aria-label="Go back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-foreground">Health Profile</h1>
            <p className="text-xs text-muted-foreground">Your secure health data · POPIA protected</p>
          </div>
        </div>

        {/* Wellness score card — only shown once we have enough data to score.
            Previously hardcoded 72/100, Fitness 82% etc for brand-new users. */}
        {logs.length >= 5 ? (
          (() => {
            // Simple composite: proportion of last 7 days with meaningful logs.
            const recent = logs.slice(-7);
            const hasMetric = (l: any, k: string) => l?.[k] != null && Number(l[k]) > 0;
            const metricScore = (key: string) => {
              const filled = recent.filter(l => hasMetric(l, key)).length;
              return Math.round((filled / Math.max(recent.length, 1)) * 100);
            };
            const fitness = metricScore("steps");
            const nutrition = metricScore("weight_kg");
            const sleep = metricScore("sleep_hours");
            const score = Math.round((fitness + nutrition + sleep) / 3);
            return (
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Wellness Score</p>
                    <p className="text-4xl font-bold text-foreground mt-1">{score}<span className="text-lg text-muted-foreground">/100</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Based on your last 7 days of tracking</p>
                  </div>
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 36 36" className="rotate-[-90deg]" width="80" height="80">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6366F1" strokeWidth="3"
                        strokeDasharray={`${score} ${100}`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo">{score}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { label: "Fitness",   val: `${fitness}%`,   color: "bg-teal"  },
                    { label: "Nutrition", val: `${nutrition}%`, color: "bg-amber" },
                    { label: "Sleep",     val: `${sleep}%`,     color: "bg-indigo"},
                  ].map(s => (
                    <div key={s.label} className="glass-1 rounded-xl p-2 text-center">
                      <div className="h-1 rounded-full bg-white/05 mb-1.5">
                        <div className={`h-full rounded-full ${s.color} opacity-70`} style={{ width: s.val }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      <p className="text-xs font-bold text-foreground">{s.val}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            );
          })()
        ) : (
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-indigo" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Wellness Score</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Log metrics on Progress for 5+ days to unlock your score.
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Tabs */}
        <div className="flex gap-1 glass-1 p-1 rounded-2xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-medium transition-all ${
                tab === t.id ? "gradient-indigo text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Metrics ── */}
        {tab === "metrics" && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map(m => {
                const Icon = m.icon;
                return (
                  <motion.div key={m.label} whileTap={{ scale: 0.97 }}>
                    <GlassCard className="p-3.5">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                        <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                      </div>
                      <p className={`text-2xl font-bold ${m.color}`}>
                        {m.value}<span className="text-sm font-normal text-muted-foreground ml-1">{m.unit}</span>
                      </p>
                      {m.trend && <p className="text-[10px] text-teal mt-1">{m.trend}</p>}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
            {/* B2-2: native-app users get a one-tap Connect Health flow.
                Once authorised, today's steps + weight + sleep auto-fill
                from HealthKit / Health Connect — no manual entry. */}
            {native.isNative && !native.authorized && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => native.requestAuth().catch(() => {})}
                className="w-full mt-3"
              >
                <GlassCard className="p-3.5 flex items-center justify-between cursor-pointer border border-teal/30 hover:border-teal/60 transition-colors bg-teal/5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal" />
                    <div className="text-left">
                      <p className="text-sm text-foreground font-medium">Connect Apple Health</p>
                      <p className="text-[10px] text-muted-foreground">Steps, weight, sleep auto-sync — no manual entry</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-teal" />
                </GlassCard>
              </motion.button>
            )}
            {native.isNative && native.authorized && typeof native.steps === "number" && (
              <p className="text-[10px] text-teal/80 mt-2 text-center">
                ✓ Apple Health connected — today: {native.steps.toLocaleString()} steps
                {typeof native.weight === "number" ? ` · ${native.weight.toFixed(1)}kg` : ""}
                {typeof native.sleep === "number" ? ` · ${native.sleep.toFixed(1)}h sleep` : ""}
              </p>
            )}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowLogMetrics(true)}
              className="w-full mt-3">
              <GlassCard className="p-3.5 flex items-center justify-between cursor-pointer hover:border-white/16 transition-colors">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo" />
                  <span className="text-sm text-foreground">Log today's metrics</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </GlassCard>
            </motion.button>

            {/* Log Metrics Modal */}
            <AnimatePresence>
              {showLogMetrics && (
                <>
                  <motion.div key="log-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowLogMetrics(false)} className="fixed inset-0 bg-obsidian/60 z-[60]" />
                  <motion.div key="log-sheet"
                    initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 280 }}
                    className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5 space-y-4"
                    style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">Log Today's Metrics</h3>
                      <button onClick={() => setShowLogMetrics(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" title="Close" aria-label="Close">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                      {METRICS.map(m => {
                        const isWeight = m.label === "Weight";
                        const wtParsed = isWeight ? parseFloat(metricInputs["Weight"] ?? "") : NaN;
                        const liveBmi = isWeight && !isNaN(wtParsed) ? computeBMI(wtParsed, heightCm) : null;
                        return (
                          <div key={m.label} className="flex flex-col gap-1">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block">{m.label} ({m.unit})</label>
                            <input
                              type="number"
                              placeholder={m.value}
                              value={metricInputs[m.label] ?? ""}
                              onChange={e => setMetricInputs(prev => ({ ...prev, [m.label]: e.target.value }))}
                              className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors"
                            />
                            {METRIC_HELP[m.label] && (
                              <p className="text-[10px] text-muted-foreground/80 leading-snug">{METRIC_HELP[m.label]}</p>
                            )}
                            {isWeight && liveBmi && (
                              <p className={`text-[11px] font-medium ${liveBmi.color}`}>
                                BMI: {liveBmi.value.toFixed(1)} · {liveBmi.band}
                                <span className="text-muted-foreground font-normal"> (height {heightCm}cm from profile)</span>
                              </p>
                            )}
                            {isWeight && !liveBmi && !heightCm && (
                              <p className="text-[10px] text-amber-400/80">
                                Add your height in your health profile to see BMI live.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        const patch: Record<string, number> = {};
                        const wt = parseFloat(metricInputs["Weight"]);
                        const bf = parseFloat(metricInputs["Body Fat"]);
                        const lm = parseFloat(metricInputs["Lean Mass"]);
                        const hr = parseFloat(metricInputs["Resting HR"]);
                        const st = parseFloat(metricInputs["Daily Steps"]);
                        const sl = parseFloat(metricInputs["Sleep Avg"]);
                        if (!isNaN(wt)) patch.weight_kg     = wt;
                        if (!isNaN(bf)) patch.body_fat_pct  = bf;
                        if (!isNaN(lm)) patch.lean_mass_kg  = lm;
                        if (!isNaN(hr)) patch.resting_hr    = Math.round(hr);
                        if (!isNaN(st)) patch.steps         = Math.round(st);
                        if (!isNaN(sl)) patch.sleep_hours   = sl;
                        if (Object.keys(patch).length === 0) {
                          toast.error("Enter at least one metric");
                          return;
                        }
                        try {
                          await logToday(patch);
                          toast.success("Saved");
                          setMetricInputs({});
                          setShowLogMetrics(false);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Save failed");
                        }
                      }}
                      className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-teal to-emerald-400">
                      Save Today's Log
                    </motion.button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Goals ── */}
        {tab === "goals" && (
          <div className="space-y-3">
            {goals.map(g => (
              <GlassCard key={g.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{g.label}</p>
                    <p className="text-[10px] text-muted-foreground">Target: {g.target} · By {g.deadline}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo">{g.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/05">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${g.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${VERT_COLOR[g.vertical] ?? "from-indigo to-violet"}`}
                  />
                </div>
              </GlassCard>
            ))}
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddGoal(true)}
              className="w-full py-3 glass-1 rounded-2xl text-sm text-muted-foreground flex items-center justify-center gap-2 border border-white/08 hover:border-white/16 transition-colors">
              <Plus className="w-4 h-4" /> Add a Goal
            </motion.button>

            {/* Add Goal Modal */}
            <AnimatePresence>
              {showAddGoal && (
                <>
                  <motion.div
                    key="goal-overlay"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowAddGoal(false)}
                    className="fixed inset-0 bg-obsidian/60 z-[60]"
                  />
                  <motion.div
                    key="goal-sheet"
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 280 }}
                    className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5 space-y-4"
                    style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">New Goal</h3>
                      <button onClick={() => setShowAddGoal(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" title="Close" aria-label="Close">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Goal name *</label>
                        <input
                          value={newGoal.label}
                          onChange={e => setNewGoal(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g. Run a half marathon"
                          className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Target</label>
                          <input
                            value={newGoal.target}
                            onChange={e => setNewGoal(prev => ({ ...prev, target: e.target.value }))}
                            placeholder="e.g. 21 km"
                            className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Deadline</label>
                          <input
                            value={newGoal.deadline}
                            onChange={e => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                            placeholder="e.g. Dec 2026"
                            className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
                        <div className="flex gap-2 flex-wrap">
                          {VERTICAL_OPTIONS.map(v => (
                            <button
                              key={v.value}
                              onClick={() => setNewGoal(prev => ({ ...prev, vertical: v.value }))}
                              className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-all ${
                                newGoal.vertical === v.value
                                  ? `${v.color} border-current bg-white/05`
                                  : "border-white/08 text-muted-foreground"
                              }`}
                            >
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAddGoal}
                      disabled={!newGoal.label.trim()}
                      className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo to-violet disabled:opacity-40 transition-opacity"
                    >
                      Add Goal
                    </motion.button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Medical ── */}
        {tab === "medical" && (
          <div className="space-y-4">

            {/* ── Conditions ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conditions</p>
                <button onClick={() => setShowAddCondition(true)}
                  className="flex items-center gap-1 text-[10px] text-teal font-medium hover:text-teal/80 transition-colors">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                {conditions.length === 0 && !showAddCondition && (
                  <motion.div key="cond-empty" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <GlassCard className="p-4 text-center">
                      <AlertCircle className="w-5 h-5 text-muted-foreground/30 mx-auto mb-1.5" />
                      <p className="text-xs text-muted-foreground">No conditions recorded</p>
                      <button onClick={() => setShowAddCondition(true)} className="text-[10px] text-teal mt-1.5 inline-block" title="Add your first condition" aria-label="Add your first condition">Add your first condition</button>
                    </GlassCard>
                  </motion.div>
                )}

                {conditions.map(c => {
                  const isEditing = editCondition === c.id;
                  return (
                    <motion.div key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60 }} className="mb-2">
                      <GlassCard className="p-3.5">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input value={c.label}
                              onChange={e => setConditions(prev => prev.map(x => x.id === c.id ? { ...x, label: e.target.value } : x))}
                              className="w-full px-3 py-2 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                            <input value={c.note}
                              onChange={e => setConditions(prev => prev.map(x => x.id === c.id ? { ...x, note: e.target.value } : x))}
                              placeholder="Note"
                              className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                            <div className="flex gap-1.5">
                              {(["none", "mild", "managed"] as const).map(s => (
                                <button key={s} onClick={() => setConditions(prev => prev.map(x => x.id === c.id ? { ...x, severity: s } : x))}
                                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border capitalize transition-all ${
                                    c.severity === s ? `${SEV_COLOR[s]} border-current bg-white/05` : "border-white/08 text-muted-foreground"
                                  }`}>{s}</button>
                              ))}
                            </div>
                            <button onClick={() => setEditCondition(null)}
                              className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal to-emerald-400" title="Done" aria-label="Done">Done</button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <button onClick={() => setEditCondition(c.id)} className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">{c.label}</p>
                                <span className={`text-[10px] font-semibold capitalize ${SEV_COLOR[c.severity]}`}>{c.severity}</span>
                              </div>
                              {c.note && <p className="text-xs text-muted-foreground mt-0.5">{c.note}</p>}
                            </button>
                            <button onClick={() => setConditions(prev => prev.filter(x => x.id !== c.id))}
                              className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-coral hover:bg-coral/10 transition-colors shrink-0 ml-2" title="Close" aria-label="Close">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Add Condition inline form */}
              <AnimatePresence>
                {showAddCondition && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <GlassCard className="p-3.5 space-y-2 mt-2">
                      <input value={newCondition.label}
                        onChange={e => setNewCondition(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Condition name *"
                        className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                      <input value={newCondition.note}
                        onChange={e => setNewCondition(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="Notes (optional)"
                        className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                      <div className="flex gap-1.5">
                        {(["none", "mild", "managed"] as const).map(s => (
                          <button key={s} onClick={() => setNewCondition(prev => ({ ...prev, severity: s }))}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border capitalize transition-all ${
                              newCondition.severity === s ? `${SEV_COLOR[s]} border-current bg-white/05` : "border-white/08 text-muted-foreground"
                            }`}>{s}</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowAddCondition(false); setNewCondition({ label: "", note: "", severity: "none" }); }}
                          className="flex-1 py-2 rounded-xl text-xs font-medium border border-white/08 text-muted-foreground" title="Cancel" aria-label="Cancel">Cancel</button>
                        <button onClick={handleAddCondition} disabled={!newCondition.label.trim()}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal to-emerald-400 disabled:opacity-40 transition-opacity" title="Save" aria-label="Save">Save</button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Allergies ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allergies</p>
                <button onClick={() => setShowAddAllergy(true)}
                  className="flex items-center gap-1 text-[10px] text-teal font-medium hover:text-teal/80 transition-colors">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {allergies.length === 0 && !showAddAllergy && (
                <GlassCard className="p-4 text-center">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground/30 mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">No allergies recorded</p>
                  <button onClick={() => setShowAddAllergy(true)} className="text-[10px] text-teal mt-1.5 inline-block" title="Add your first allergy" aria-label="Add your first allergy">Add your first allergy</button>
                </GlassCard>
              )}

              <div className="flex gap-2 flex-wrap">
                <AnimatePresence>
                  {allergies.map((a, i) => (
                    <motion.span key={a + i} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
                      className="px-3 py-1.5 glass-accent-coral rounded-pill text-xs text-coral inline-flex items-center gap-1.5 group">
                      {a}
                      <button onClick={() => setAllergies(prev => prev.filter((_, idx) => idx !== i))}
                        className="w-3.5 h-3.5 flex items-center justify-center rounded-full opacity-40 group-hover:opacity-100 hover:bg-coral/20 transition-all" title="Close" aria-label="Close">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              {/* Add Allergy inline form */}
              <AnimatePresence>
                {showAddAllergy && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <GlassCard className="p-3.5 mt-2">
                      <div className="flex gap-2">
                        <input value={newAllergy}
                          onChange={e => setNewAllergy(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleAddAllergy()}
                          placeholder="Allergy name *"
                          className="flex-1 px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                        <button onClick={() => { setShowAddAllergy(false); setNewAllergy(""); }}
                          className="px-3 py-2 rounded-xl text-xs font-medium border border-white/08 text-muted-foreground" title="Cancel" aria-label="Cancel">Cancel</button>
                        <button onClick={handleAddAllergy} disabled={!newAllergy.trim()}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal to-emerald-400 disabled:opacity-40 transition-opacity" title="Add" aria-label="Add">Add</button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Supplements & Medications ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplements & Medications</p>
                <button onClick={() => setShowAddMedication(true)}
                  className="flex items-center gap-1 text-[10px] text-teal font-medium hover:text-teal/80 transition-colors">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                {medications.length === 0 && !showAddMedication && (
                  <motion.div key="med-empty" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <GlassCard className="p-4 text-center">
                      <Pill className="w-5 h-5 text-muted-foreground/30 mx-auto mb-1.5" />
                      <p className="text-xs text-muted-foreground">No medications recorded</p>
                      <button onClick={() => setShowAddMedication(true)} className="text-[10px] text-teal mt-1.5 inline-block" title="Add your first medication" aria-label="Add your first medication">Add your first medication</button>
                    </GlassCard>
                  </motion.div>
                )}

                {medications.map(m => {
                  const isEditing = editMedication === m.id;
                  return (
                    <motion.div key={m.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60 }} className="mb-2">
                      <GlassCard className="p-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input value={m.name}
                              onChange={e => setMedications(prev => prev.map(x => x.id === m.id ? { ...x, name: e.target.value } : x))}
                              className="w-full px-3 py-2 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                            <div className="grid grid-cols-2 gap-2">
                              <input value={m.dose}
                                onChange={e => setMedications(prev => prev.map(x => x.id === m.id ? { ...x, dose: e.target.value } : x))}
                                placeholder="Dose"
                                className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                              <input value={m.frequency}
                                onChange={e => setMedications(prev => prev.map(x => x.id === m.id ? { ...x, frequency: e.target.value } : x))}
                                placeholder="Frequency"
                                className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                            </div>
                            <button onClick={() => setEditMedication(null)}
                              className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal to-emerald-400" title="Done" aria-label="Done">Done</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <button onClick={() => setEditMedication(m.id)} className="flex items-center gap-2 flex-1 text-left">
                              <Pill className="w-3.5 h-3.5 text-indigo shrink-0" />
                              <p className="text-sm text-foreground">{m.name}</p>
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground">{m.dose}{m.dose && m.frequency ? " · " : ""}{m.frequency}</span>
                              <button onClick={() => setMedications(prev => prev.filter(x => x.id !== m.id))}
                                className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground/40 hover:text-coral hover:bg-coral/10 transition-colors shrink-0" title="Close" aria-label="Close">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Add Medication inline form */}
              <AnimatePresence>
                {showAddMedication && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <GlassCard className="p-3.5 space-y-2 mt-2">
                      <input value={newMedication.name}
                        onChange={e => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Medication / supplement name *"
                        className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={newMedication.dose}
                          onChange={e => setNewMedication(prev => ({ ...prev, dose: e.target.value }))}
                          placeholder="Dose (e.g. 500mg)"
                          className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                        <input value={newMedication.frequency}
                          onChange={e => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                          placeholder="Frequency (e.g. Daily)"
                          className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowAddMedication(false); setNewMedication({ name: "", dose: "", frequency: "" }); }}
                          className="flex-1 py-2 rounded-xl text-xs font-medium border border-white/08 text-muted-foreground" title="Cancel" aria-label="Cancel">Cancel</button>
                        <button onClick={handleAddMedication} disabled={!newMedication.name.trim()}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal to-emerald-400 disabled:opacity-40 transition-opacity" title="Save" aria-label="Save">Save</button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <GlassCard className="p-3.5">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-indigo shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Medical data is encrypted and stored under POPIA. Only verified providers you've explicitly connected with can see this section.
                </p>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── Privacy ── */}
        {tab === "privacy" && (
          <div className="space-y-4">
            {/* Metrics & Goals — simple toggle (no sensitive data) */}
            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-foreground mb-4">General Data</p>
              <div className="space-y-4">
                {(["metrics", "goals"] as const).map(section => {
                  const current = privacy[section];
                  return (
                    <div key={section}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-foreground capitalize">{section}</p>
                        <span className={`text-xs font-medium ${PRIVACY_LABELS[current].color}`}>{PRIVACY_LABELS[current].label}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {(["private", "provider"] as PrivacyLevel[]).map(level => (
                          <button key={level} onClick={() => setPrivacy(prev => ({ ...prev, [section]: level }))}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                              current === level
                                ? `${PRIVACY_LABELS[level].color} border-current bg-white/05`
                                : "border-white/08 text-muted-foreground"
                            }`}>
                            {PRIVACY_LABELS[level].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Medical & Documents — provider-specific access */}
            {(["medical", "documents"] as const).map(section => {
              const access = section === "medical" ? medicalAccess : documentAccess;
              const grantedProviders = connectedProviders.filter(p => access[p.id]);
              return (
                <GlassCard key={section} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {section === "medical" ? <Heart className="w-4 h-4 text-coral" /> : <Shield className="w-4 h-4 text-indigo" />}
                      <p className="text-sm font-semibold text-foreground capitalize">{section} Data</p>
                    </div>
                    <button onClick={() => setShowProviderPicker(section)}
                      className="text-xs text-teal font-medium" title="Manage Access" aria-label="Manage Access">
                      Manage Access
                    </button>
                  </div>
                  {grantedProviders.length === 0 ? (
                    <div className="py-3 text-center">
                      <Lock className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Only you can see your {section} data</p>
                      <button onClick={() => setShowProviderPicker(section)}
                        className="text-[10px] text-teal mt-1" title="Grant access to a provider →" aria-label="Grant access to a provider →">Grant access to a provider →</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {grantedProviders.map(prov => (
                        <div key={prov.id} className="flex items-center gap-2.5 py-1">
                          <img src={prov.image} alt={prov.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                          <span className="flex-1 text-xs text-foreground truncate">{prov.name}</span>
                          <Eye className="w-3.5 h-3.5 text-teal shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              );
            })}

            {/* Provider picker modal */}
            <AnimatePresence>
              {showProviderPicker && (
                <>
                  <motion.div key="pp-ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowProviderPicker(null)} className="fixed inset-0 bg-obsidian/60 z-[60]" />
                  <motion.div key="pp-sheet"
                    initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 280 }}
                    className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5 max-h-[70vh] overflow-y-auto"
                    style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground capitalize">{showProviderPicker} Data Access</h3>
                        <p className="text-xs text-muted-foreground">Select which providers can view your {showProviderPicker} data</p>
                      </div>
                      <button onClick={() => setShowProviderPicker(null)}
                        className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" title="Close" aria-label="Close">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {connectedProviders.map(prov => {
                        const access = showProviderPicker === "medical" ? medicalAccess : documentAccess;
                        const hasAccess = !!access[prov.id];
                        return (
                          <button key={prov.id}
                            onClick={() => setConfirmToggle({
                              section: showProviderPicker,
                              providerId: prov.id,
                              providerName: prov.name,
                              granting: !hasAccess,
                            })}
                            className="w-full flex items-center gap-3 py-3 px-3 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                            <img src={prov.image} alt={prov.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm text-foreground truncate">{prov.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{prov.category}</p>
                            </div>
                            <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${
                              hasAccess ? "bg-teal/30" : "bg-white/[0.08]"
                            }`}>
                              <div className={`w-5 h-5 rounded-full transition-all ${
                                hasAccess ? "bg-teal translate-x-4" : "bg-muted-foreground/40 translate-x-0"
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-4 text-center">
                      Only selected providers can view your {showProviderPicker} data. You can change this at any time.
                    </p>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Confirmation modal */}
            <AnimatePresence>
              {confirmToggle && (
                <>
                  <motion.div key="ct-ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setConfirmToggle(null)} className="fixed inset-0 bg-obsidian/70 z-[80]" />
                  <motion.div key="ct-modal"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-sm mx-auto rounded-3xl p-6"
                    style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                        confirmToggle.granting ? "bg-teal/10" : "bg-coral/10"
                      }`}>
                        {confirmToggle.granting
                          ? <Eye className="w-6 h-6 text-teal" />
                          : <EyeOff className="w-6 h-6 text-coral" />}
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-2">
                        {confirmToggle.granting ? "Grant Access?" : "Revoke Access?"}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {confirmToggle.granting
                          ? `Allow **${confirmToggle.providerName}** to view your ${confirmToggle.section} data? They will be able to see your ${confirmToggle.section === "medical" ? "conditions, allergies, medications, and health history" : "uploaded documents and certificates"}.`
                          : `Remove **${confirmToggle.providerName}**'s access to your ${confirmToggle.section} data? They will no longer be able to view this information.`}
                      </p>
                      <div className="flex gap-3 mt-5 w-full">
                        <button onClick={() => setConfirmToggle(null)}
                          className="flex-1 py-2.5 rounded-2xl text-sm font-medium border border-white/[0.08] bg-white/[0.02] text-muted-foreground" title="Cancel" aria-label="Cancel">
                          Cancel
                        </button>
                        <button onClick={() => {
                          const { section, providerId, granting } = confirmToggle;
                          const setter = section === "medical" ? setMedicalAccess : setDocumentAccess;
                          setter(prev => ({ ...prev, [providerId]: granting }));
                          setConfirmToggle(null);
                        }}
                          className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white ${
                            confirmToggle.granting ? "bg-gradient-to-r from-teal to-emerald-400" : "bg-gradient-to-r from-coral to-red-500"
                          }`}>
                          {confirmToggle.granting ? "Grant Access" : "Revoke Access"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <GlassCard className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-teal" />
                <p className="text-sm font-semibold text-foreground">POPIA Compliant</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your health data is stored securely in South Africa and classified as special personal information under POPIA Section 26. You have the right to access, correct, or delete your data at any time. Data is never sold to third parties. Food images for calorie estimation are processed by AI and immediately discarded.
              </p>
            </GlassCard>
          </div>
        )}
      </div>

      <BionAssistant />
      <BottomNav />
    </div>
  );
}
