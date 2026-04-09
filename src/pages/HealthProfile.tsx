import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import {
  ArrowLeft, Heart, Activity, Shield, Pill, AlertTriangle,
  Target, TrendingUp, Edit3, ChevronRight, CheckCircle,
  Scale, Dna, Eye, Lock, X, Plus
} from "lucide-react";

type PrivacyLevel = "private" | "provider" | "all";

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
      <div className="max-w-lg mx-auto px-4 pt-10 space-y-5">

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
            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-foreground mb-4">Who can see each section?</p>
              <div className="space-y-4">
                {(["metrics", "goals", "medical", "documents"] as const).map(section => {
                  const current = privacy[section];
                  const meta = PRIVACY_LABELS[current];
                  const Icon = meta.icon;
                  return (
                    <div key={section}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-foreground capitalize">{section}</p>
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                          <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {(["private", "provider", "all"] as PrivacyLevel[]).map(level => (
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

            <GlassCard className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-teal" />
                <p className="text-sm font-semibold text-foreground">POPIA Compliant</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You have the right to access, correct, or delete your health data at any time. Data is never sold to third parties.
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
