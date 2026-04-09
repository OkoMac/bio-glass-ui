import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useRoutinesSync } from "@/hooks/useRoutinesSync";
import { getProviderImage } from "@/lib/providerImages";
import realData from "@/data/bion_pretoria_data.json";
import {
  ArrowLeft, ChevronRight, CheckCircle, Circle, Plus, X,
  Dumbbell, Apple, Stethoscope, Play, Eye, EyeOff, Shield, Pill, Heart,
  Clock, Calendar, Flame, ChevronDown, Trash2, Share2
} from "lucide-react";

/* ── Types ─────────────────────────────────────────── */
interface Exercise {
  name: string;
  sets: string;
  done: boolean;
}

interface Routine {
  id: string;
  title: string;
  type: "workout" | "rehab" | "meal" | "skincare" | "medication" | "wellness" | "beauty" | "custom";
  provider?: string;         // undefined = self-created
  providerId?: string;
  providerImage?: string;
  vertical: "teal" | "indigo" | "coral" | "amber";
  daysCompleted: number;
  totalDays: number;
  exercises: Exercise[];
  createdBy: "self" | "provider";
  sharedWith: string[];      // provider IDs who can see this routine
  schedule?: string;         // e.g. "Mon, Wed, Fri"
}

/* ── Real provider data for assignment & self-creation ──── */
const FITNESS_PROVIDERS = realData.providers
  .filter(p => /gym|fitness|train|yoga|pilates|crossfit/i.test(p.category ?? ""))
  .slice(0, 12)
  .map(p => ({
    id: p.id,
    name: p.name,
    image: getProviderImage(p.id, p.name),
    services: p.servicesOffered ?? [],
    availability: typeof p.availability === "string" ? p.availability : (Array.isArray(p.availability) ? p.availability.join(", ") : "Available"),
    category: p.category ?? "",
  }));

const MEDICAL_PROVIDERS = realData.providers
  .filter(p => /physio|chiro|rehab|doctor|medical|dental/i.test(p.category ?? ""))
  .slice(0, 6)
  .map(p => ({
    id: p.id,
    name: p.name,
    image: getProviderImage(p.id, p.name),
    services: p.servicesOffered ?? [],
    availability: typeof p.availability === "string" ? p.availability : (Array.isArray(p.availability) ? p.availability.join(", ") : "Available"),
    category: p.category ?? "",
  }));

const BEAUTY_PROVIDERS = realData.providers
  .filter(p => /beauty|salon|spa|hair|nail|skin|aesthetic/i.test(p.category ?? ""))
  .slice(0, 6)
  .map(p => ({
    id: p.id,
    name: p.name,
    image: getProviderImage(p.id, p.name),
    services: p.servicesOffered ?? [],
    availability: typeof p.availability === "string" ? p.availability : (Array.isArray(p.availability) ? p.availability.join(", ") : "Available"),
    category: p.category ?? "",
  }));

const ALL_PROVIDERS = [...FITNESS_PROVIDERS, ...MEDICAL_PROVIDERS, ...BEAUTY_PROVIDERS];

/* ── Template exercises by type ──── */
const EXERCISE_TEMPLATES: Record<string, Exercise[]> = {
  workout: [
    { name: "Warm-up (5 min jog)", sets: "1×5min", done: false },
    { name: "Squats", sets: "4×12", done: false },
    { name: "Bench Press", sets: "4×10", done: false },
    { name: "Deadlifts", sets: "3×8", done: false },
    { name: "Pull-ups", sets: "3×max", done: false },
    { name: "Plank", sets: "3×45s", done: false },
    { name: "Cool-down stretch", sets: "5 min", done: false },
  ],
  rehab: [
    { name: "Foam rolling", sets: "5 min", done: false },
    { name: "Resistance band walks", sets: "3×15", done: false },
    { name: "Single leg balance", sets: "3×30s", done: false },
    { name: "Wall slides", sets: "3×12", done: false },
    { name: "Hip flexor stretch", sets: "2×30s", done: false },
  ],
  meal: [
    { name: "Breakfast: Oats + berries + protein", sets: "350 kcal", done: false },
    { name: "Snack: Greek yoghurt + almonds", sets: "200 kcal", done: false },
    { name: "Lunch: Grilled chicken + brown rice + veg", sets: "500 kcal", done: false },
    { name: "Snack: Protein shake + banana", sets: "250 kcal", done: false },
    { name: "Dinner: Salmon + sweet potato + greens", sets: "450 kcal", done: false },
  ],
  skincare: [
    { name: "Cleanse", sets: "AM + PM", done: false },
    { name: "Tone", sets: "AM + PM", done: false },
    { name: "Serum (Vitamin C)", sets: "AM", done: false },
    { name: "Moisturise (SPF)", sets: "AM", done: false },
    { name: "Retinol", sets: "PM only", done: false },
  ],
  medication: [
    { name: "Morning medication (with breakfast)", sets: "AM", done: false },
    { name: "Midday supplement", sets: "12:00", done: false },
    { name: "Evening medication (after dinner)", sets: "PM", done: false },
    { name: "Before bed supplement", sets: "Before sleep", done: false },
  ],
  wellness: [
    { name: "Morning gratitude journaling", sets: "5 min", done: false },
    { name: "Box breathing (4-4-4-4)", sets: "3 rounds", done: false },
    { name: "Body scan meditation", sets: "10 min", done: false },
    { name: "Mindful walking", sets: "15 min", done: false },
    { name: "Progressive muscle relaxation", sets: "10 min", done: false },
    { name: "Evening reflection + mood log", sets: "5 min", done: false },
  ],
  beauty: [
    { name: "Hair treatment / mask", sets: "1× per week", done: false },
    { name: "Nail care (file, buff, cuticles)", sets: "15 min", done: false },
    { name: "Face mask (clay/sheet/peel)", sets: "20 min", done: false },
    { name: "Body exfoliation", sets: "1× per week", done: false },
    { name: "Moisturise full body", sets: "After shower", done: false },
    { name: "Lip scrub + balm", sets: "PM", done: false },
  ],
  custom: [],
};

/* ── Sample assigned routines (simulating provider assignments) ──── */
function buildSampleRoutines(): Routine[] {
  const fp = FITNESS_PROVIDERS[0];
  const mp = MEDICAL_PROVIDERS[0];
  const bp = BEAUTY_PROVIDERS[0];

  const routines: Routine[] = [];

  // Fitness provider: Strength programme
  if (fp) {
    routines.push({
      id: "assigned_1",
      title: "Strength & Conditioning",
      type: "workout",
      provider: fp.name,
      providerId: fp.id,
      providerImage: fp.image,
      vertical: "teal",
      daysCompleted: 8,
      totalDays: 28,
      exercises: [
        { name: "Warm-up (Dynamic stretches)", sets: "5 min", done: false },
        { name: "Barbell Squats", sets: "4×10", done: false },
        { name: "Dumbbell Bench Press", sets: "4×12", done: false },
        { name: "Romanian Deadlifts", sets: "3×10", done: false },
        { name: "Lat Pulldown", sets: "3×12", done: false },
        { name: "Plank hold", sets: "3×60s", done: false },
        { name: "Cool-down stretch", sets: "5 min", done: false },
      ],
      createdBy: "provider",
      sharedWith: [fp.id],
      schedule: "Mon, Wed, Fri",
    });
  }

  // Medical provider: Rehab programme
  if (mp) {
    routines.push({
      id: "assigned_2",
      title: "Post-Session Recovery",
      type: "rehab",
      provider: mp.name,
      providerId: mp.id,
      providerImage: mp.image,
      vertical: "indigo",
      daysCompleted: 3,
      totalDays: 14,
      exercises: [
        { name: "Foam rolling (full body)", sets: "10 min", done: false },
        { name: "Cat-cow stretch", sets: "3×10", done: false },
        { name: "Glute bridges", sets: "3×15", done: false },
        { name: "Scapular retractions", sets: "3×12", done: false },
        { name: "Ice pack on affected area", sets: "15 min", done: false },
        { name: "Deep breathing + meditation", sets: "5 min", done: false },
      ],
      createdBy: "provider",
      sharedWith: [mp.id],
      schedule: "Tue, Thu, Sat",
    });
  }

  // Beauty provider: Skincare routine
  if (bp) {
    routines.push({
      id: "assigned_3",
      title: "Weekly Skincare Routine",
      type: "skincare",
      provider: bp.name,
      providerId: bp.id,
      providerImage: bp.image,
      vertical: "coral",
      daysCompleted: 5,
      totalDays: 30,
      exercises: [
        { name: "Gentle cleanser (double cleanse PM)", sets: "AM + PM", done: false },
        { name: "Exfoliate (gentle scrub)", sets: "2× per week", done: false },
        { name: "Hydrating toner", sets: "AM + PM", done: false },
        { name: "Vitamin C serum", sets: "AM only", done: false },
        { name: "Hyaluronic acid moisturiser", sets: "AM + PM", done: false },
        { name: "SPF 50+ sunscreen", sets: "AM only", done: false },
        { name: "Retinol serum", sets: "PM only, 3×/week", done: false },
        { name: "Sheet mask (hydrating)", sets: "1× per week", done: false },
      ],
      createdBy: "provider",
      sharedWith: [bp.id],
      schedule: "Daily",
    });
  }

  // Self-created: Meal plan
  routines.push({
    id: "self_meal_1",
    title: "Clean Eating Plan",
    type: "meal",
    vertical: "amber",
    daysCompleted: 10,
    totalDays: 28,
    exercises: [
      { name: "Breakfast: Oats + berries + whey protein", sets: "350 kcal", done: false },
      { name: "Mid-morning: Greek yoghurt + mixed nuts", sets: "200 kcal", done: false },
      { name: "Lunch: Grilled chicken + brown rice + steamed veg", sets: "500 kcal", done: false },
      { name: "Afternoon: Protein shake + banana", sets: "250 kcal", done: false },
      { name: "Dinner: Grilled fish + sweet potato + salad", sets: "450 kcal", done: false },
      { name: "Water intake: 2.5 litres minimum", sets: "all day", done: false },
    ],
    createdBy: "self",
    sharedWith: [],
    schedule: "Daily",
  });

  // Wellness: Mindfulness routine (self-created)
  routines.push({
    id: "self_wellness_1",
    title: "Daily Mindfulness",
    type: "wellness",
    vertical: "indigo",
    daysCompleted: 7,
    totalDays: 30,
    exercises: [
      { name: "Morning gratitude journaling", sets: "5 min", done: false },
      { name: "Box breathing (4-4-4-4)", sets: "3 rounds", done: false },
      { name: "Guided meditation", sets: "10 min", done: false },
      { name: "Mindful walk (no phone)", sets: "15 min", done: false },
      { name: "Evening mood log + reflection", sets: "5 min", done: false },
    ],
    createdBy: "self",
    sharedWith: [],
    schedule: "Daily",
  });

  // Beauty: Full beauty routine
  if (bp) {
    routines.push({
      id: "assigned_beauty_2",
      title: "Weekly Beauty Routine",
      type: "beauty",
      provider: bp.name,
      providerId: bp.id,
      providerImage: bp.image,
      vertical: "coral",
      daysCompleted: 2,
      totalDays: 30,
      exercises: [
        { name: "Deep cleansing facial wash", sets: "AM + PM", done: false },
        { name: "Clay mask (detox)", sets: "1× per week", done: false },
        { name: "Hair mask / deep conditioning", sets: "1× per week", done: false },
        { name: "Body scrub (exfoliate)", sets: "2× per week", done: false },
        { name: "Manicure maintenance", sets: "1× per week", done: false },
        { name: "Full body moisturiser", sets: "After shower", done: false },
      ],
      createdBy: "provider",
      sharedWith: [bp.id],
      schedule: "Weekly",
    });
  }

  // Medical: Medication routine
  if (mp) {
    routines.push({
      id: "assigned_4",
      title: "Medication & Supplement Schedule",
      type: "medication",
      provider: mp.name,
      providerId: mp.id,
      providerImage: mp.image,
      vertical: "indigo",
      daysCompleted: 12,
      totalDays: 90,
      exercises: [
        { name: "Multivitamin", sets: "1 tab, AM with food", done: false },
        { name: "Omega-3 fish oil", sets: "1 cap, AM", done: false },
        { name: "Vitamin D3 (1000 IU)", sets: "1 tab, AM", done: false },
        { name: "Magnesium glycinate", sets: "1 tab, PM", done: false },
        { name: "Probiotic", sets: "1 cap, before bed", done: false },
      ],
      createdBy: "provider",
      sharedWith: [mp.id],
      schedule: "Daily",
    });
  }

  return routines;
}

const typeIcon: Record<string, React.ReactNode> = {
  workout:    <Dumbbell className="w-4 h-4" />,
  rehab:      <Stethoscope className="w-4 h-4" />,
  meal:       <Apple className="w-4 h-4" />,
  skincare:   <span className="text-sm">✨</span>,
  medication: <Pill className="w-4 h-4" />,
  wellness:   <Heart className="w-4 h-4" />,
  beauty:     <span className="text-sm">💅</span>,
  custom:     <Flame className="w-4 h-4" />,
};

const typeLabel: Record<string, string> = {
  workout: "Workout", rehab: "Rehab", meal: "Meal Plan", skincare: "Skincare", medication: "Medication", wellness: "Wellness", beauty: "Beauty", custom: "Custom",
};

const STORAGE_KEY = "bion_routines";

/* ── Component ──────────────────────────────────────── */
export default function Routines() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const isDemo = user?.id?.startsWith("demo_") ?? false;

  // Sync routines with Supabase (authenticated users) or localStorage (demo)
  const { routines, setRoutines, addRoutine: syncAddRoutine, deleteRoutine: syncDeleteRoutine, loading: routinesLoading } = useRoutinesSync();

  // Seed demo accounts with sample data if empty
  useEffect(() => {
    if (isDemo && routines.length === 0) {
      setRoutines(buildSampleRoutines());
    }
  }, [isDemo]);

  const [expanded, setExpanded] = useState<string | null>(routines[0]?.id ?? null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "self" | "provider">("all");

  // New routine form
  const [newRoutine, setNewRoutine] = useState({
    title: "",
    type: "workout" as Routine["type"],
    schedule: "",
    totalDays: 28,
  });
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState("");

  const toggle = (routineId: string, idx: number) => {
    const key = `${routineId}-${idx}`;
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const deleteRoutine = (id: string) => {
    syncDeleteRoutine(id);
    if (expanded === id) setExpanded(null);
  };

  const toggleShare = (routineId: string, providerId: string) => {
    setRoutines(prev => prev.map(r => {
      if (r.id !== routineId) return r;
      const shared = r.sharedWith.includes(providerId)
        ? r.sharedWith.filter(id => id !== providerId)
        : [...r.sharedWith, providerId];
      return { ...r, sharedWith: shared };
    }));
  };

  const handleCreateRoutine = () => {
    if (!newRoutine.title.trim()) return;
    const exercises = customExercises.length > 0
      ? customExercises
      : EXERCISE_TEMPLATES[newRoutine.type] ?? [];
    const routine: Routine = {
      id: `self_${Date.now()}`,
      title: newRoutine.title.trim(),
      type: newRoutine.type,
      vertical: newRoutine.type === "workout" ? "teal" : newRoutine.type === "rehab" || newRoutine.type === "medication" ? "indigo" : newRoutine.type === "meal" ? "amber" : newRoutine.type === "wellness" ? "indigo" : "coral",
      daysCompleted: 0,
      totalDays: newRoutine.totalDays,
      exercises,
      createdBy: "self",
      sharedWith: [],
      schedule: newRoutine.schedule || undefined,
    };
    syncAddRoutine(routine);
    setNewRoutine({ title: "", type: "workout", schedule: "", totalDays: 28 });
    setCustomExercises([]);
    setShowCreate(false);
    setExpanded(routine.id);
  };

  const addCustomExercise = () => {
    if (!newExName.trim()) return;
    setCustomExercises(prev => [...prev, { name: newExName.trim(), sets: newExSets.trim() || "—", done: false }]);
    setNewExName("");
    setNewExSets("");
  };

  const filtered = routines.filter(r =>
    filter === "all" ? true : filter === "self" ? r.createdBy === "self" : r.createdBy === "provider"
  );

  const assignedCount = routines.filter(r => r.createdBy === "provider").length;
  const selfCount = routines.filter(r => r.createdBy === "self").length;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{firstName}'s Routines</h1>
            <p className="text-xs text-muted-foreground">
              {routines.length === 0 ? "No active routines" : `${assignedCount} assigned · ${selfCount} personal`}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-emerald-400 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </motion.button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {([
            { key: "all", label: "All" },
            { key: "provider", label: "From Providers" },
            { key: "self", label: "My Routines" },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-all ${
                filter === f.key
                  ? "border-teal/40 bg-teal/10 text-teal"
                  : "border-white/08 text-muted-foreground"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <GlassCard className="p-8 text-center">
            <Dumbbell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              {filter === "provider" ? "No routines from providers yet" : filter === "self" ? "No personal routines yet" : "No routines yet"}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {filter === "provider"
                ? "Routines assigned by your providers will appear here."
                : "Create your own routine or get one assigned by a provider."}
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-pill text-xs font-semibold bg-gradient-to-r from-teal to-emerald-400 text-white">
              <Plus className="w-3 h-3 inline mr-1" /> Create Routine
            </motion.button>
          </GlassCard>
        )}

        {/* Routine cards */}
        {filtered.map((r, ri) => {
          const isOpen = expanded === r.id;
          const completedCount = r.exercises.filter((_, ei) =>
            checked[`${r.id}-${ei}`]
          ).length;
          const pct = r.exercises.length > 0 ? Math.round((completedCount / r.exercises.length) * 100) : 0;

          return (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ri * 0.05 }}>
              <GlassCard className="overflow-hidden">
                {/* Card header */}
                <button onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full p-4 flex items-center gap-3 text-left">
                  {r.providerImage ? (
                    <img src={r.providerImage} alt={r.provider} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10 shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      r.vertical === "teal" ? "bg-teal/20" : r.vertical === "indigo" ? "bg-indigo/20" : r.vertical === "coral" ? "bg-coral/20" : "bg-amber/20"
                    }`}>
                      {typeIcon[r.type]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-${r.vertical}`}>{typeIcon[r.type]}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{typeLabel[r.type]}</span>
                      {r.createdBy === "self" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/20 ml-1">Personal</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.provider && <p className="text-[10px] text-muted-foreground">{r.provider}</p>}
                      {r.schedule && (
                        <span className="flex items-center gap-0.5 text-[10px] text-teal">
                          <Calendar className="w-2.5 h-2.5" /> {r.schedule}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-data text-foreground">{pct}%</p>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform mt-0.5 ${isOpen ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {/* Progress bar */}
                <div className="px-4 pb-3">
                  <div className="w-full h-1 rounded-full bg-white/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        r.vertical === "teal" ? "gradient-teal" : r.vertical === "indigo" ? "gradient-indigo" :
                        r.vertical === "coral" ? "gradient-coral" : "gradient-amber"
                      }`} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-muted-foreground">{completedCount}/{r.exercises.length} done</span>
                    <span className="text-[9px] text-muted-foreground">Day {r.daysCompleted}/{r.totalDays}</span>
                  </div>
                </div>

                {/* Expanded section */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="border-t border-white/5 px-4 py-3 space-y-2">
                        {r.exercises.map((ex, ei) => {
                          const key = `${r.id}-${ei}`;
                          const isDone = !!checked[key];
                          return (
                            <motion.button key={ei} whileTap={{ scale: 0.98 }}
                              onClick={() => toggle(r.id, ei)}
                              className="w-full flex items-center gap-3 py-1.5 text-left">
                              {isDone
                                ? <CheckCircle className={`w-4 h-4 shrink-0 text-${r.vertical}`} />
                                : <Circle className="w-4 h-4 shrink-0 text-muted-foreground" />}
                              <span className={`flex-1 text-xs ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {ex.name}
                              </span>
                              {ex.sets && <span className="text-[10px] font-data text-muted-foreground shrink-0">{ex.sets}</span>}
                            </motion.button>
                          );
                        })}

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-3 pt-2 border-t border-white/5">
                          {r.type === "workout" && (
                            <motion.button whileTap={{ scale: 0.97 }}
                              onClick={() => { setActiveSession(r.id); setTimeout(() => setActiveSession(null), 2000); }}
                              className={`flex-1 rounded-pill py-2 text-xs font-semibold flex items-center justify-center gap-1.5 ${
                                activeSession === r.id ? "glass-accent-teal text-teal" : "gradient-teal text-obsidian"
                              }`}>
                              {activeSession === r.id ? <><CheckCircle className="w-3.5 h-3.5" /> Started!</> : <><Play className="w-3.5 h-3.5" /> Start Session</>}
                            </motion.button>
                          )}
                          <button onClick={() => setShowPrivacy(showPrivacy === r.id ? null : r.id)}
                            className="px-3 py-2 rounded-pill text-xs glass-1 text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors">
                            <Shield className="w-3 h-3" /> Privacy
                          </button>
                          {r.createdBy === "self" && (
                            <button onClick={() => deleteRoutine(r.id)}
                              className="px-3 py-2 rounded-pill text-xs glass-1 text-coral/70 flex items-center gap-1.5 hover:text-coral transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Privacy controls */}
                        <AnimatePresence>
                          {showPrivacy === r.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                                  <Shield className="w-3 h-3 inline mr-1" /> Who can see this routine
                                </p>
                                {ALL_PROVIDERS.slice(0, 6).map(prov => {
                                  const isShared = r.sharedWith.includes(prov.id);
                                  return (
                                    <button key={prov.id} onClick={() => toggleShare(r.id, prov.id)}
                                      className="w-full flex items-center gap-2.5 py-1.5 text-left">
                                      <img src={prov.image} alt={prov.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                                      <span className="flex-1 text-xs text-foreground truncate">{prov.name}</span>
                                      {isShared
                                        ? <Eye className="w-3.5 h-3.5 text-teal shrink-0" />
                                        : <EyeOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                    </button>
                                  );
                                })}
                                <p className="text-[9px] text-muted-foreground mt-1">
                                  Shared providers can view your progress. Tap to toggle.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })}

        {/* B_ nudge */}
        {routines.length > 0 && (
          <GlassCard variant="accent-indigo" className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✦</span>
              <div>
                <p className="text-sm font-medium text-foreground">Coach Tip</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Consistency beats intensity. Complete today's routine and you'll be one step closer to your goals. 💪
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* ── Create Routine Sheet ──────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div key="create-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)} className="fixed inset-0 bg-obsidian/60 z-[60]" />
            <motion.div key="create-sheet"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5 max-h-[85vh] overflow-y-auto"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Create Routine</h3>
                <button onClick={() => setShowCreate(false)}
                  className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Routine Name *</label>
                  <input value={newRoutine.title}
                    onChange={e => setNewRoutine(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Morning Strength, Evening Yoga"
                    className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-teal/40 transition-colors" />
                </div>

                {/* Type */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Type</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["workout", "rehab", "meal", "skincare", "medication", "wellness", "beauty", "custom"] as const).map(t => (
                      <button key={t} onClick={() => setNewRoutine(prev => ({ ...prev, type: t }))}
                        className={`px-3 py-1.5 rounded-pill text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          newRoutine.type === t
                            ? "border-teal/40 bg-teal/10 text-teal"
                            : "border-white/08 text-muted-foreground"
                        }`}>
                        {typeIcon[t]} {typeLabel[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Schedule</label>
                    <input value={newRoutine.schedule}
                      onChange={e => setNewRoutine(prev => ({ ...prev, schedule: e.target.value }))}
                      placeholder="e.g. Mon, Wed, Fri"
                      className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-teal/40 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Duration (days)</label>
                    <div className="flex gap-2">
                      {[14, 28, 42, 56].map(d => (
                        <button key={d} onClick={() => setNewRoutine(prev => ({ ...prev, totalDays: d }))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                            newRoutine.totalDays === d ? "border-teal/40 bg-teal/10 text-teal" : "border-white/08 text-muted-foreground"
                          }`}>
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Template preview or custom exercises */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    {newRoutine.type === "custom" ? "Add Exercises" : `Template (${typeLabel[newRoutine.type]})`}
                  </label>

                  {newRoutine.type !== "custom" && customExercises.length === 0 && (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                      {(EXERCISE_TEMPLATES[newRoutine.type] ?? []).map((ex, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Circle className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-foreground">{ex.name}</span>
                          <span className="text-[10px] text-muted-foreground">{ex.sets}</span>
                        </div>
                      ))}
                      <p className="text-[9px] text-muted-foreground mt-2">You can customise exercises after creating.</p>
                    </div>
                  )}

                  {/* Custom exercise input */}
                  {(newRoutine.type === "custom" || customExercises.length > 0) && (
                    <div className="space-y-2">
                      {customExercises.map((ex, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-white/[0.03]">
                          <CheckCircle className="w-3 h-3 text-teal shrink-0" />
                          <span className="flex-1 text-foreground">{ex.name}</span>
                          <span className="text-[10px] text-muted-foreground">{ex.sets}</span>
                          <button onClick={() => setCustomExercises(prev => prev.filter((_, j) => j !== i))}
                            className="text-coral/60 hover:text-coral"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input value={newExName} onChange={e => setNewExName(e.target.value)}
                          placeholder="Exercise name"
                          onKeyDown={e => e.key === "Enter" && addCustomExercise()}
                          className="flex-1 px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/08" />
                        <input value={newExSets} onChange={e => setNewExSets(e.target.value)}
                          placeholder="Sets"
                          onKeyDown={e => e.key === "Enter" && addCustomExercise()}
                          className="w-20 px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/08" />
                        <button onClick={addCustomExercise}
                          className="w-9 h-9 rounded-xl bg-teal/20 text-teal flex items-center justify-center shrink-0">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {newRoutine.type !== "custom" && customExercises.length === 0 && (
                    <button onClick={() => setCustomExercises(EXERCISE_TEMPLATES[newRoutine.type] ?? [])}
                      className="mt-2 text-[10px] text-teal font-medium">
                      Customise exercises →
                    </button>
                  )}
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateRoutine}
                disabled={!newRoutine.title.trim()}
                className="w-full mt-5 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-teal to-emerald-400 disabled:opacity-40 transition-opacity">
                Create Routine
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BionAssistant />
      <BottomNav />
    </div>
  );
}
