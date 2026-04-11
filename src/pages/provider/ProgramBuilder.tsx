import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import SubscriptionGate from "@/components/SubscriptionGate";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Check, X,
  Dumbbell, Salad, Heart, ArrowLeft, Copy, Send,
  GripVertical, Users, Lock, CreditCard,
} from "lucide-react";

// Import real Pretoria data
import realData from "@/data/bion_pretoria_data.json";

// ── Types ───────────────────────────────────────────────────────────

type ProgramType = "workout" | "meal" | "care";

interface Exercise {
  id:   string;
  name: string;
  sets: number;
  reps: string;   // "12" | "30s" | "failure"
  rest: number;   // seconds
  note: string;
}

interface WorkoutDay {
  id:        string;
  name:      string;
  exercises: Exercise[];
}

interface MealItem {
  id:   string;
  name: string;
  qty:  string;
  kcal: number;
}

interface MealPlan {
  id:    string;
  label: string;  // "Breakfast" | "Lunch" | "Dinner" | "Snack"
  items: MealItem[];
}

interface CareStep {
  id:       string;
  name:     string;
  detail:   string;
  durationMins: number;
}

interface Program {
  id:          string;
  type:        ProgramType;
  title:       string;
  description: string;
  durationWeeks: number;
  days:        WorkoutDay[];
  meals:       MealPlan[];
  careSteps:   CareStep[];
  assignedTo:  string[];
}

// Exercise library - using only real exercise names that would be offered by Pretoria providers
// Based on actual services offered by Pretoria providers in our data
const EXERCISE_LIBRARY: { name: string; category: string }[] = [
  // Exercises derived from actual service types in Pretoria data
  { name: "Physiotherapy Session", category: "Physiotherapy" },
  { name: "Sports Rehabilitation", category: "Physiotherapy" },
  { name: "Fitness Assessment", category: "Assessment" },
  { name: "Strength Training", category: "Training" },
  { name: "Senior Fitness Session", category: "Senior Care" },
  { name: "Yoga Instruction", category: "Wellness" },
  { name: "Personal Training", category: "Training" },
  { name: "Massage Therapy", category: "Therapy" },
  { name: "Nutrition Consultation", category: "Nutrition" },
  { name: "Health Screening", category: "Assessment" },
];

// Real clients from Pretoria data - limited to actual clients
const REAL_CLIENTS = [...new Set((realData.bookings ?? []).map((b: any) => b.clientName))].slice(0, 5);

// Standard meal labels
const MEAL_LABELS = ["Breakfast", "Lunch", "Dinner"];

function newId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

// ── Sub-components ────────────────────────────────────────────────────

function TypeBadge({ type }: { type: ProgramType }) {
  const cfg = {
    workout: { label: "Workout",  icon: Dumbbell, color: "text-indigo", bg: "glass-accent-indigo" },
    meal:    { label: "Meal Plan", icon: Salad,   color: "text-teal",   bg: "glass-accent-teal"   },
    care:    { label: "Care Plan", icon: Heart,   color: "text-coral",  bg: "glass-accent-coral"  },
  }[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ── Exercise Row ───────────────────────────────────────────────────────
function ExerciseRow({
  ex,
  onChange,
  onDelete,
}: {
  ex: Exercise;
  onChange: (updated: Exercise) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-1 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <p className="flex-1 text-xs font-medium text-foreground truncate">{ex.name}</p>
        <span className="text-[10px] text-muted-foreground">{ex.sets}×{ex.reps}</span>
        <button onClick={() => setOpen(o => !o)} className="text-muted-foreground">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onDelete} className="text-muted-foreground/50 hover:text-coral transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          {[
            { label: "Sets",  value: String(ex.sets), key: "sets" as const, type: "number" },
            { label: "Reps",  value: ex.reps,          key: "reps" as const, type: "text"   },
            { label: "Rest (s)", value: String(ex.rest), key: "rest" as const, type: "number" },
          ].map(field => (
            <div key={field.key}>
              <label className="text-[9px] text-muted-foreground">{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => onChange({ ...ex, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })}
                className="w-full mt-0.5 h-8 glass-1 rounded-lg px-2 text-xs text-foreground bg-transparent outline-none"
              />
            </div>
          ))}
          <div className="col-span-3">
            <label className="text-[9px] text-muted-foreground">Coach note</label>
            <input
              type="text"
              value={ex.note}
              onChange={e => onChange({ ...ex, note: e.target.value })}
              placeholder="Optional cue or note..."
              className="w-full mt-0.5 h-8 glass-1 rounded-lg px-2 text-xs text-foreground bg-transparent outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Builder form ────────────────────────────────────────────────────────
function BuilderForm({
  program,
  onChange,
  onSave,
  onCancel,
}: {
  program: Program;
  onChange: (p: Program) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [libQuery, setLibQuery] = useState("");
  const [activeDayId, setActiveDayId] = useState<string>(program.days[0]?.id ?? "");
  const [showLib, setShowLib] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const filteredLib = EXERCISE_LIBRARY.filter(e =>
    e.name.toLowerCase().includes(libQuery.toLowerCase()),
  );

  const updateDay = (dayId: string, updated: WorkoutDay) => {
    onChange({ ...program, days: program.days.map(d => d.id === dayId ? updated : d) });
  };

  const addDay = () => {
    const newDay: WorkoutDay = { id: newId(), name: `Day ${program.days.length + 1}`, exercises: [] };
    onChange({ ...program, days: [...program.days, newDay] });
    setActiveDayId(newDay.id);
  };

  const addExercise = (name: string) => {
    const day = program.days.find(d => d.id === activeDayId);
    if (!day) return;
    const ex: Exercise = { id: newId(), name, sets: 3, reps: "12", rest: 60, note: "" };
    updateDay(activeDayId, { ...day, exercises: [...day.exercises, ex] });
    setShowLib(false);
  };

  const updateMeal = (mealId: string, updated: MealPlan) => {
    onChange({ ...program, meals: program.meals.map(m => m.id === mealId ? updated : m) });
  };

  const updateCareStep = (stepId: string, updated: CareStep) => {
    onChange({ ...program, careSteps: program.careSteps.map(s => s.id === stepId ? updated : s) });
  };

  const activeDay = program.days.find(d => d.id === activeDayId);

  return (
    <div className="space-y-5">
      {/* Meta */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TypeBadge type={program.type} />
          <span className="text-xs text-muted-foreground">· {program.durationWeeks}w program</span>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Program Title</label>
          <input
            value={program.title}
            onChange={e => onChange({ ...program, title: e.target.value })}
            placeholder="e.g. 8-Week Strength Block"
            className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground/50"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Description / Goal</label>
          <textarea
            value={program.description}
            onChange={e => onChange({ ...program, description: e.target.value })}
            placeholder="Briefly describe the goal and method..."
            rows={2}
            className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground/50 resize-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Duration (weeks)</label>
          <div className="flex gap-2 mt-1">
            {[4, 6, 8, 12].map(w => (
              <button
                key={w}
                onClick={() => onChange({ ...program, durationWeeks: w })}
                className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${
                  program.durationWeeks === w ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                }`}
              >
                {w}w
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Workout builder */}
      {program.type === "workout" && (
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Training Days</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={addDay}
              className="flex items-center gap-1 text-xs text-indigo font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Day
            </motion.button>
          </div>

          {/* Day tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
            {program.days.map(day => (
              <button
                key={day.id}
                onClick={() => setActiveDayId(day.id)}
                className={`shrink-0 rounded-pill px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-all ${
                  activeDayId === day.id ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                }`}
              >
                {day.name}
              </button>
            ))}
          </div>

          {activeDay && (
            <div className="space-y-2">
              {/* Day name */}
              <input
                value={activeDay.name}
                onChange={e => updateDay(activeDay.id, { ...activeDay, name: e.target.value })}
                className="w-full glass-1 rounded-xl px-3 py-2 text-xs text-foreground bg-transparent outline-none"
                placeholder="Day name (e.g. Push, Legs...)"
              />

              {/* Exercise list */}
              {activeDay.exercises.map(ex => (
                <ExerciseRow
                  key={ex.id}
                  ex={ex}
                  onChange={updated => updateDay(activeDay.id, {
                    ...activeDay,
                    exercises: activeDay.exercises.map(e => e.id === ex.id ? updated : e),
                  })}
                  onDelete={() => updateDay(activeDay.id, {
                    ...activeDay,
                    exercises: activeDay.exercises.filter(e => e.id !== ex.id),
                  })}
                />
              ))}

              {activeDay.exercises.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-3">No exercises yet — add from library</p>
              )}

              {/* Add from library */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowLib(o => !o)}
                className="w-full glass-1 rounded-xl py-2.5 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                {showLib ? "Close Library" : "Add Exercise from Library"}
              </motion.button>

              <AnimatePresence>
                {showLib && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-1 rounded-xl p-3 space-y-2">
                      <input
                        value={libQuery}
                        onChange={e => setLibQuery(e.target.value)}
                        placeholder="Search exercises..."
                        className="w-full glass-1 rounded-lg px-3 py-2 text-xs text-foreground bg-transparent outline-none placeholder:text-muted-foreground/60"
                      />
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredLib.map(e => (
                          <button
                            key={e.name}
                            onClick={() => addExercise(e.name)}
                            className="w-full text-left rounded-lg px-3 py-2 hover:bg-white/5 transition-all flex items-center justify-between"
                          >
                            <span className="text-xs text-foreground">{e.name}</span>
                            <span className="text-[9px] text-muted-foreground">{e.category}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </GlassCard>
      )}

      {/* Meal plan builder */}
      {program.type === "meal" && (
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Daily Meal Plan</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const unused = MEAL_LABELS.find(l => !program.meals.find(m => m.label === l));
                if (!unused) return;
                onChange({ ...program, meals: [...program.meals, { id: newId(), label: unused, items: [] }] });
              }}
              className="flex items-center gap-1 text-xs text-teal font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Meal
            </motion.button>
          </div>

          {program.meals.map(meal => (
            <div key={meal.id} className="space-y-2">
              <p className="text-xs font-medium text-foreground">{meal.label}</p>
              {meal.items.map(item => (
                <div key={item.id} className="glass-1 rounded-xl p-2.5 flex items-center gap-2">
                  <input
                    value={item.name}
                    onChange={e => updateMeal(meal.id, {
                      ...meal,
                      items: meal.items.map(i => i.id === item.id ? { ...i, name: e.target.value } : i),
                    })}
                    placeholder="Food item"
                    className="flex-1 bg-transparent text-xs text-foreground outline-none"
                  />
                  <input
                    value={item.qty}
                    onChange={e => updateMeal(meal.id, {
                      ...meal,
                      items: meal.items.map(i => i.id === item.id ? { ...i, qty: e.target.value } : i),
                    })}
                    placeholder="200g"
                    className="w-14 bg-transparent text-xs text-muted-foreground outline-none text-right"
                  />
                  <button
                    onClick={() => updateMeal(meal.id, { ...meal, items: meal.items.filter(i => i.id !== item.id) })}
                    className="text-muted-foreground/40 hover:text-coral transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => updateMeal(meal.id, { ...meal, items: [...meal.items, { id: newId(), name: "", qty: "", kcal: 0 }] })}
                className="text-[10px] text-teal flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add item
              </button>
            </div>
          ))}

          {program.meals.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-3">No meals yet — click Add Meal</p>
          )}
        </GlassCard>
      )}

      {/* Care plan builder */}
      {program.type === "care" && (
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Care Protocol Steps</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({
                ...program,
                careSteps: [...program.careSteps, { id: newId(), name: "", detail: "", durationMins: 10 }],
              })}
              className="flex items-center gap-1 text-xs text-coral font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Step
            </motion.button>
          </div>

          {program.careSteps.map((step, idx) => (
            <div key={step.id} className="glass-1 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full gradient-coral flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                  {idx + 1}
                </span>
                <input
                  value={step.name}
                  onChange={e => updateCareStep(step.id, { ...step, name: e.target.value })}
                  placeholder="Step name (e.g. Cleanse, Apply serum...)"
                  className="flex-1 bg-transparent text-xs text-foreground outline-none"
                />
                <button
                  onClick={() => onChange({ ...program, careSteps: program.careSteps.filter(s => s.id !== step.id) })}
                  className="text-muted-foreground/40 hover:text-coral"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                value={step.detail}
                onChange={e => updateCareStep(step.id, { ...step, detail: e.target.value })}
                placeholder="Instructions or product details..."
                className="w-full bg-transparent text-[11px] text-muted-foreground outline-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Duration:</span>
                <input
                  type="number"
                  value={step.durationMins}
                  onChange={e => updateCareStep(step.id, { ...step, durationMins: Number(e.target.value) })}
                  className="w-14 glass-1 rounded-lg px-2 py-1 text-xs text-foreground bg-transparent outline-none"
                />
                <span className="text-[10px] text-muted-foreground">min</span>
              </div>
            </div>
          ))}

          {program.careSteps.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-3">No steps yet — click Add Step</p>
          )}
        </GlassCard>
      )}

      {/* Assign to clients */}
      <GlassCard className="p-4">
        <button
          onClick={() => setAssignOpen(o => !o)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Assign to Clients</span>
            {program.assignedTo.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 glass-accent-indigo rounded-pill text-indigo">
                {program.assignedTo.length} selected
              </span>
            )}
          </div>
          {assignOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {assignOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-1.5 overflow-hidden"
            >
              {MOCK_CLIENTS.map(client => {
                const selected = program.assignedTo.includes(client);
                return (
                  <button
                    key={client}
                    onClick={() => onChange({
                      ...program,
                      assignedTo: selected
                        ? program.assignedTo.filter(c => c !== client)
                        : [...program.assignedTo, client],
                    })}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      selected ? "glass-accent-indigo" : "glass-1"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selected ? "bg-indigo border-indigo" : "border-muted-foreground/30"
                    }`}>
                      {selected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={selected ? "text-foreground" : "text-muted-foreground"}>{client}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Actions */}
      <div className="flex gap-2 pb-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="flex-1 rounded-pill py-3 glass-1 text-muted-foreground text-sm font-medium"
        >
          Cancel
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSave}
          className="flex-1 rounded-pill py-3 gradient-indigo text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" /> Save & Send
        </motion.button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
const emptyWorkout = (): Program => ({
  id:            newId(),
  type:          "workout",
  title:         "",
  description:   "",
  durationWeeks: 8,
  days:          [{ id: newId(), name: "Day 1 — Push", exercises: [] }],
  meals:         [],
  careSteps:     [],
  assignedTo:    [],
});

// Sample programs using ONLY real data - no manufactured programs
// These are template programs that would be created by providers for their actual services
const SAMPLE_PROGRAMS: Program[] = [
  // Demo program template - the only manufactured content allowed
  {
    id: "demo", type: "workout", title: "Demo Program Template", 
    description: "Template program for demonstration purposes only. Real programs would be created by providers for their specific services.",
    durationWeeks: 4,
    days: [
      { 
        id: "d1", name: "Initial Assessment",  
        exercises: [
          { id: "e1", name: "Service Consultation", sets: 1, reps: "60 min", rest: 0, note: "Initial client assessment and goal setting" },
        ] 
      },
    ],
    meals: [], careSteps: [], 
    assignedTo: ["Demo User"], // Only manufactured user account
  },
  
  // Empty state programs - real programs would be created here
  {
    id: "empty1", type: "workout", title: "Create New Program", 
    description: "Create a custom program for your clients based on your service offerings.",
    durationWeeks: 0,
    days: [],
    meals: [], careSteps: [], 
    assignedTo: [],
  },
  {
    id: "empty2", type: "meal", title: "Create Meal Plan", 
    description: "Design nutrition plans for your clients.",
    durationWeeks: 0,
    days: [],
    meals: [],
    careSteps: [], 
    assignedTo: [],
  },
  {
    id: "empty3", type: "care", title: "Create Care Plan", 
    description: "Develop wellness and care programs for your clients.",
    durationWeeks: 0,
    days: [], meals: [],
    careSteps: [],
    assignedTo: [],
  },
];

export default function ProgramBuilder() {
  const navigate = useNavigate();
  const { canAccess, requiresUpgrade, getUpgradeUrl, tierDisplayName } = useSubscription();
  
  // Check if user can access program builder feature
  const canUseProgramBuilder = canAccess('basicAnalytics'); // Using basicAnalytics as proxy for program builder access
  const needsUpgrade = requiresUpgrade('basicAnalytics');
  
  // Show upgrade prompt if program builder feature is not available
  if (needsUpgrade) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
        <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-12 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="w-9 h-9 glass-1 rounded-full flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Programs</h1>
                <p className="text-xs text-muted-foreground">Upgrade required to access program builder</p>
              </div>
            </div>
          </div>
          
          {/* Upgrade Prompt */}
          <GlassCard className="p-6 text-center">
            <Lock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Program Builder Requires Pro Subscription
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your current plan ({tierDisplayName()}) doesn't include program creation tools. 
              Upgrade to Pro or Elite to create custom workout, meal, and care plans for your clients.
            </p>
            <div className="space-y-3 max-w-md mx-auto">
              <div className="glass-1 rounded-xl p-4 text-left">
                <h3 className="text-sm font-semibold text-foreground mb-2">Pro Plan Includes:</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo"></div>
                    Custom program builder (workout, meal, care plans)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo"></div>
                    Client messaging & notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo"></div>
                    Booking management & calendar sync
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo"></div>
                    Basic analytics & insights
                  </li>
                </ul>
              </div>
              
              <button
                onClick={() => window.location.href = getUpgradeUrl()}
                className="w-full gradient-indigo rounded-pill py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Upgrade to Pro - R499/month
              </button>
              
              <button
                onClick={() => window.location.href = '/provider/billing'}
                className="w-full glass-1 rounded-pill py-3 text-sm font-medium text-foreground"
              >
                View All Plans
              </button>
            </div>
          </GlassCard>
          
          <ProviderNav />
        </div>
      </div>
    );
  }
  
  const [programs, setPrograms]   = useState<Program[]>(SAMPLE_PROGRAMS);
  const [editing, setEditing]     = useState<Program | null>(null);
  const [typeFilter, setTypeFilter] = useState<ProgramType | "all">("all");
  const [showForm, setShowForm]   = useState(false);
  const [savedId, setSavedId]     = useState<string | null>(null);

  const visible = typeFilter === "all" ? programs : programs.filter(p => p.type === typeFilter);

  const handleSave = () => {
    if (!editing) return;
    if (programs.find(p => p.id === editing.id)) {
      setPrograms(prev => prev.map(p => p.id === editing.id ? editing : p));
    } else {
      setPrograms(prev => [editing, ...prev]);
    }

    // Push assigned programs to client-facing routines (localStorage bridge)
    if (editing.assignedTo.length > 0) {
      try {
        const existing = JSON.parse(localStorage.getItem("bion_routines") ?? "[]");
        const routineType = editing.type === "workout" ? "workout" : editing.type === "meal" ? "meal" : "rehab";
        const exercises = editing.type === "workout"
          ? editing.days.flatMap(d => d.exercises.map(e => ({ name: e.name, sets: `${e.sets}×${e.reps}`, done: false })))
          : editing.type === "meal"
          ? editing.meals.flatMap(m => m.items.map(i => ({ name: `${m.label}: ${i.name}`, sets: `${i.qty} · ${i.kcal} kcal`, done: false })))
          : editing.careSteps.map(s => ({ name: s.name, sets: `${s.durationMins} min`, done: false }));

        // Only add if not already assigned
        if (!existing.find((r: any) => r.id === `pro_${editing.id}`)) {
          const newRoutine = {
            id: `pro_${editing.id}`,
            title: editing.title || `${editing.type} Programme`,
            type: routineType,
            provider: "Your Provider",
            vertical: routineType === "workout" ? "teal" : routineType === "meal" ? "amber" : "indigo",
            daysCompleted: 0,
            totalDays: editing.durationWeeks * 7,
            exercises: exercises.length > 0 ? exercises : [{ name: "Follow provider instructions", sets: "—", done: false }],
            createdBy: "provider",
            sharedWith: [],
            schedule: editing.type === "workout" ? "Mon, Wed, Fri" : "Daily",
          };
          existing.unshift(newRoutine);
          localStorage.setItem("bion_routines", JSON.stringify(existing));
        }
      } catch { /* ignore */ }
    }

    setSavedId(editing.id);
    setTimeout(() => setSavedId(null), 2000);
    setEditing(null);
    setShowForm(false);
  };

  const handleNew = (type: ProgramType) => {
    const p = emptyWorkout();
    p.type = type;
    if (type === "meal")    { p.days = []; p.meals = [{ id: newId(), label: "Breakfast", items: [] }]; }
    if (type === "care")    { p.days = []; p.careSteps = [{ id: newId(), name: "", detail: "", durationMins: 10 }]; }
    setEditing(p);
    setShowForm(true);
  };

  if (showForm && editing) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
        <div className="mx-auto max-w-lg px-4 pt-12 space-y-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="w-9 h-9 glass-1 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            <h1 className="text-xl font-bold text-foreground">
              {programs.find(p => p.id === editing.id) ? "Edit Program" : "New Program"}
            </h1>
          </div>
          <BuilderForm
            program={editing}
            onChange={setEditing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
        <BionAssistant />
        <ProviderNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-9 h-9 glass-1 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Programs</h1>
              <p className="text-xs text-muted-foreground">{programs.length} programs · {programs.reduce((a, p) => a + p.assignedTo.length, 0)} assignments</p>
            </div>
          </div>
        </div>

        {/* New program buttons */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { type: "workout" as const, label: "Workout", icon: Dumbbell, color: "gradient-indigo" },
            { type: "meal"    as const, label: "Meal Plan", icon: Salad,  color: "gradient-teal"   },
            { type: "care"    as const, label: "Care Plan", icon: Heart,  color: "gradient-coral"  },
          ]).map(btn => (
            <motion.button
              key={btn.type}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNew(btn.type)}
              className={`rounded-2xl p-3.5 flex flex-col items-center gap-2 ${btn.color} text-primary-foreground`}
            >
              <btn.icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold">{btn.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1.5">
          {(["all", "workout", "meal", "care"] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`rounded-pill px-3 py-1.5 text-[11px] font-medium transition-all capitalize ${
                typeFilter === f ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
              }`}
            >
              {f === "all" ? "All" : f === "workout" ? "Workouts" : f === "meal" ? "Meal Plans" : "Care Plans"}
            </button>
          ))}
        </div>

        {/* Program list */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((prog, i) => (
              <motion.div
                key={prog.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard hover className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TypeBadge type={prog.type} />
                        {savedId === prog.id && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] text-teal flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Saved
                          </motion.span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{prog.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{prog.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground">{prog.durationWeeks}w</span>
                        {prog.type === "workout" && (
                          <span className="text-[10px] text-muted-foreground">
                            {prog.days.length} days · {prog.days.reduce((a, d) => a + d.exercises.length, 0)} exercises
                          </span>
                        )}
                        {prog.type === "meal" && (
                          <span className="text-[10px] text-muted-foreground">{prog.meals.length} meals</span>
                        )}
                        {prog.type === "care" && (
                          <span className="text-[10px] text-muted-foreground">{prog.careSteps.length} steps</span>
                        )}
                        {prog.assignedTo.length > 0 && (
                          <span className="text-[10px] glass-accent-indigo rounded-pill px-1.5 py-0.5 text-indigo">
                            {prog.assignedTo.length} client{prog.assignedTo.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          const clone = { ...prog, id: newId(), title: `${prog.title} (copy)` };
                          setPrograms(prev => [clone, ...prev]);
                        }}
                        className="w-8 h-8 glass-1 rounded-full flex items-center justify-center"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setEditing({ ...prog }); setShowForm(true); }}
                        className="w-8 h-8 glass-1 rounded-full flex items-center justify-center"
                      >
                        <Send className="w-3.5 h-3.5 text-muted-foreground" />
                      </motion.button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <BionAssistant />
      <ProviderNav />
    </div>
  );
}
