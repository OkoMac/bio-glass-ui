import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { getProviderImage } from "@/lib/providerImages";
import realData from "@/data/bion_pretoria_data.json";
import {
  ArrowLeft, Heart, Activity, Shield, Pill, AlertTriangle,
  Target, TrendingUp, Edit3, ChevronRight, CheckCircle,
  Scale, Dna, Eye, Lock, X, Plus, EyeOff, AlertCircle
} from "lucide-react";

// Connected providers for privacy selection
const CONNECTED_PROVIDERS = realData.providers.slice(0, 8).map(p => ({
  id: p.id,
  name: p.name,
  image: getProviderImage(p.id, p.name),
  category: p.category ?? "",
}));

type PrivacyLevel = "private" | "provider" | "all";

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

const METRICS: HealthMetric[] = [
  { label: "Weight",          value: "74.2", unit: "kg",  trend: "↓ 1.9 this month", color: "text-indigo",  icon: Scale    },
  { label: "Body Fat",        value: "17.4", unit: "%",   trend: "↓ 0.7 this month", color: "text-teal",    icon: Activity },
  { label: "Lean Mass",       value: "61.3", unit: "kg",  trend: "↑ 0.3 this month", color: "text-violet",  icon: Dna      },
  { label: "Resting HR",      value: "58",   unit: "bpm", trend: "↓ 4 this month",   color: "text-coral",   icon: Heart    },
  { label: "Daily Steps",     value: "9,200", unit: "steps",trend: "↑ 1.4k avg",    color: "text-amber",   icon: TrendingUp },
  { label: "Sleep Avg",       value: "7.4",  unit: "h",   trend: "↑ 0.5 this month", color: "text-teal",   icon: Eye      },
];

const INITIAL_GOALS: HealthGoal[] = [
  { id: "g1", label: "Reach 72kg",           target: "72 kg",   progress: 48, deadline: "Apr 2026", vertical: "fitness"     },
  { id: "g2", label: "Body fat under 15%",   target: "15%",     progress: 35, deadline: "Jun 2026", vertical: "fitness"     },
  { id: "g3", label: "Run 10km",             target: "10 km",   progress: 60, deadline: "May 2026", vertical: "fitness"     },
  { id: "g4", label: "Reduce stress score",  target: "< 4/10",  progress: 40, deadline: "Mar 2026", vertical: "mindfulness" },
];

const VERTICAL_OPTIONS = [
  { value: "fitness",     label: "Fitness",     color: "text-teal"   },
  { value: "mindfulness", label: "Mindfulness", color: "text-violet" },
  { value: "nutrition",   label: "Nutrition",   color: "text-amber"  },
  { value: "medical",     label: "Medical",     color: "text-indigo" },
];

const CONDITIONS: { label: string; note: string; severity: "none" | "mild" | "managed" }[] = [
  { label: "Lactose intolerance", note: "Avoid dairy. Whey protein OK.",       severity: "managed" },
  { label: "Left knee strain",    note: "Old sports injury — avoid deep squats.", severity: "managed" },
];

const ALLERGIES = ["Dairy", "Penicillin"];

const MEDICATIONS: { name: string; dose: string; frequency: string }[] = [
  { name: "Vitamin D3",   dose: "2000 IU", frequency: "Daily" },
  { name: "Omega-3",      dose: "1000mg",  frequency: "Daily" },
  { name: "Magnesium",    dose: "400mg",   frequency: "Nightly" },
];

const PRIVACY_LABELS: Record<PrivacyLevel, { label: string; icon: typeof Lock; color: string }> = {
  private:  { label: "Only me",         icon: Lock,   color: "text-coral"  },
  provider: { label: "My providers",    icon: Shield, color: "text-indigo" },
  all:      { label: "Anyone on BION",  icon: Eye,    color: "text-teal"   },
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
  const [tab, setTab]   = useState<Tab>("metrics");
  const [privacy, setPrivacy] = useState<Record<string, PrivacyLevel>>({
    metrics: "provider", goals: "provider", medical: "private", documents: "private",
  });
  const [medicalAccess, setMedicalAccess] = useState<ProviderAccess>({});
  const [documentAccess, setDocumentAccess] = useState<ProviderAccess>({});
  const [showProviderPicker, setShowProviderPicker] = useState<"medical" | "documents" | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ section: "medical" | "documents"; providerId: string; providerName: string; granting: boolean } | null>(null);
  const [goals, setGoals] = useState<HealthGoal[]>(INITIAL_GOALS);
  const [showLogMetrics, setShowLogMetrics] = useState(false);
  const [metricInputs, setMetricInputs] = useState<Record<string, string>>({});
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ label: "", target: "", deadline: "", vertical: "fitness" });

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
      <div className="max-w-lg md:max-w-3xl xl:max-w-5xl mx-auto px-4 pt-10 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-foreground">Health Profile</h1>
            <p className="text-xs text-muted-foreground">Your secure health data · POPIA protected</p>
          </div>
        </div>

        {/* Wellness score card */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Wellness Score</p>
              <p className="text-4xl font-bold text-foreground mt-1">72<span className="text-lg text-muted-foreground">/100</span></p>
              <p className="text-xs text-teal mt-1">↑ 8 points this month · Top 25%</p>
            </div>
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="rotate-[-90deg]" width="80" height="80">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6366F1" strokeWidth="3"
                  strokeDasharray={`${72} ${100}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo">72%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: "Fitness",     val: "82%", color: "bg-teal"  },
              { label: "Nutrition",   val: "68%", color: "bg-amber" },
              { label: "Mindfulness", val: "55%", color: "bg-indigo"},
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
                      <button onClick={() => setShowLogMetrics(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                      {METRICS.map(m => (
                        <div key={m.label} className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">{m.label} ({m.unit})</label>
                            <input
                              type="number"
                              placeholder={m.value}
                              value={metricInputs[m.label] ?? ""}
                              onChange={e => setMetricInputs(prev => ({ ...prev, [m.label]: e.target.value }))}
                              className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => { setMetricInputs({}); setShowLogMetrics(false); }}
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
                      <button onClick={() => setShowAddGoal(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
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
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Conditions</p>
              {CONDITIONS.map(c => (
                <GlassCard key={c.label} className="p-3.5 mb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{c.label}</p>
                    <span className={`text-[10px] font-semibold capitalize ${SEV_COLOR[c.severity]}`}>{c.severity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.note}</p>
                </GlassCard>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Allergies</p>
              <div className="flex gap-2 flex-wrap">
                {ALLERGIES.map(a => (
                  <span key={a} className="px-3 py-1.5 glass-accent-coral rounded-pill text-xs text-coral">{a}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Supplements & Medications</p>
              {MEDICATIONS.map(m => (
                <GlassCard key={m.name} className="p-3 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-3.5 h-3.5 text-indigo" />
                    <p className="text-sm text-foreground">{m.name}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{m.dose} · {m.frequency}</span>
                </GlassCard>
              ))}
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
              const grantedProviders = CONNECTED_PROVIDERS.filter(p => access[p.id]);
              return (
                <GlassCard key={section} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {section === "medical" ? <Heart className="w-4 h-4 text-coral" /> : <Shield className="w-4 h-4 text-indigo" />}
                      <p className="text-sm font-semibold text-foreground capitalize">{section} Data</p>
                    </div>
                    <button onClick={() => setShowProviderPicker(section)}
                      className="text-xs text-teal font-medium">
                      Manage Access
                    </button>
                  </div>
                  {grantedProviders.length === 0 ? (
                    <div className="py-3 text-center">
                      <Lock className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">Only you can see your {section} data</p>
                      <button onClick={() => setShowProviderPicker(section)}
                        className="text-[10px] text-teal mt-1">Grant access to a provider →</button>
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
                        className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {CONNECTED_PROVIDERS.map(prov => {
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
                          className="flex-1 py-2.5 rounded-2xl text-sm font-medium border border-white/[0.08] bg-white/[0.02] text-muted-foreground">
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
