import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import CoachAI from "@/components/CoachAI";
import {
  ArrowLeft, ChevronRight, CheckCircle, Circle,
  Dumbbell, Apple, Stethoscope, Play, Lock
} from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";

const routines = [
  {
    id: "r1",
    title: "Week 4 — Upper Body Strength",
    provider: "Lisa Dlamini",
    providerImage: provider1,
    vertical: "teal" as const,
    type: "workout",
    daysCompleted: 3,
    totalDays: 5,
    exercises: [
      { name: "Push-ups (wide grip)", sets: "4×12", done: true },
      { name: "Dumbbell Row", sets: "3×10 each", done: true },
      { name: "Shoulder Press", sets: "3×10", done: true },
      { name: "Tricep Dips", sets: "3×15", done: false },
      { name: "Bicep Curls", sets: "3×12", done: false },
      { name: "Plank", sets: "3×45s", done: false },
    ],
  },
  {
    id: "r2",
    title: "Knee Rehab Phase 2",
    provider: "Dr. Kagiso Sithole",
    providerImage: provider2,
    vertical: "indigo" as const,
    type: "rehab",
    daysCompleted: 5,
    totalDays: 7,
    exercises: [
      { name: "Quad Sets", sets: "3×20", done: true },
      { name: "Straight Leg Raises", sets: "3×15", done: true },
      { name: "Wall Slides", sets: "3×10", done: true },
      { name: "Mini Squats", sets: "3×12", done: true },
      { name: "Calf Raises", sets: "3×20", done: false },
    ],
  },
  {
    id: "r3",
    title: "February Meal Plan",
    provider: "Lisa Dlamini",
    providerImage: provider1,
    vertical: "teal" as const,
    type: "meal",
    daysCompleted: 18,
    totalDays: 28,
    exercises: [
      { name: "Breakfast: Oats + banana + protein shake", sets: "", done: true },
      { name: "Snack: Greek yoghurt + almonds", sets: "", done: true },
      { name: "Lunch: Grilled chicken + brown rice + salad", sets: "", done: false },
      { name: "Snack: Apple + peanut butter", sets: "", done: false },
      { name: "Dinner: Salmon + sweet potato + greens", sets: "", done: false },
    ],
  },
  {
    id: "r4",
    title: "Skin Care Routine — AM/PM",
    provider: "Sarah Chen",
    providerImage: provider3,
    vertical: "coral" as const,
    type: "skincare",
    daysCompleted: 12,
    totalDays: 30,
    exercises: [
      { name: "AM: Gentle cleanser", sets: "1×", done: true },
      { name: "AM: Vitamin C serum", sets: "2 drops", done: true },
      { name: "AM: SPF 50 moisturiser", sets: "pea size", done: false },
      { name: "PM: Double cleanse", sets: "2 steps", done: false },
      { name: "PM: Retinol (0.3%)", sets: "avoid 48h pre-session", done: false },
    ],
  },
];

const typeIcon: Record<string, React.ReactNode> = {
  workout:  <Dumbbell className="w-4 h-4" />,
  rehab:    <Stethoscope className="w-4 h-4" />,
  meal:     <Apple className="w-4 h-4" />,
  skincare: <span className="text-sm">✨</span>,
};

const typeLabel: Record<string, string> = {
  workout: "Workout", rehab: "Rehab", meal: "Meal Plan", skincare: "Skincare",
};

export default function Routines() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>("r1");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const toggle = (routineId: string, idx: number) => {
    const key = `${routineId}-${idx}`;
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="mx-auto max-w-lg px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Routines</h1>
            <p className="text-xs text-muted-foreground">{routines.length} active prescriptions</p>
          </div>
        </div>

        {/* Routines */}
        {routines.map((r, ri) => {
          const isOpen = expanded === r.id;
          const completedCount = r.exercises.filter((e, ei) =>
            e.done || checked[`${r.id}-${ei}`]
          ).length;
          const pct = Math.round((completedCount / r.exercises.length) * 100);

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ri * 0.05 }}
            >
              <GlassCard className="overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  <BioAvatar src={r.providerImage} alt={r.provider} size="sm" verticalColor={r.vertical} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-${r.vertical}`}>{typeIcon[r.type]}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{typeLabel[r.type]}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground">{r.provider}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-data text-foreground">{pct}%</p>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform mt-0.5 ${isOpen ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {/* Progress bar */}
                <div className="px-4 pb-3">
                  <div className="w-full h-1 rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        r.vertical === "teal" ? "gradient-teal" :
                        r.vertical === "indigo" ? "gradient-indigo" :
                        r.vertical === "coral" ? "gradient-coral" : "gradient-amber"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-muted-foreground">{completedCount}/{r.exercises.length} done</span>
                    <span className="text-[9px] text-muted-foreground">Day {r.daysCompleted}/{r.totalDays}</span>
                  </div>
                </div>

                {/* Exercise list */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 px-4 py-3 space-y-2">
                        {r.exercises.map((ex, ei) => {
                          const key = `${r.id}-${ei}`;
                          const isDone = ex.done || !!checked[key];
                          return (
                            <motion.button
                              key={ei}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => toggle(r.id, ei)}
                              className="w-full flex items-center gap-3 py-1.5 text-left"
                            >
                              {isDone
                                ? <CheckCircle className={`w-4 h-4 shrink-0 text-${r.vertical}`} />
                                : <Circle className="w-4 h-4 shrink-0 text-muted-foreground" />
                              }
                              <span className={`flex-1 text-xs ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {ex.name}
                              </span>
                              {ex.sets && (
                                <span className="text-[10px] font-data text-muted-foreground shrink-0">{ex.sets}</span>
                              )}
                            </motion.button>
                          );
                        })}

                        {r.type === "workout" && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setActiveSession(r.id);
                              setTimeout(() => setActiveSession(null), 2000);
                            }}
                            className={`mt-2 w-full rounded-pill py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                              activeSession === r.id
                                ? "glass-accent-teal text-teal"
                                : r.vertical === "teal"
                                ? "gradient-teal text-obsidian"
                                : "gradient-indigo text-primary-foreground"
                            }`}
                          >
                            {activeSession === r.id
                              ? <><CheckCircle className="w-3.5 h-3.5" /> Session Started!</>
                              : <><Play className="w-3.5 h-3.5" /> Start Session</>
                            }
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })}

        {/* ServeAI nudge */}
        <GlassCard variant="accent-indigo" className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✦</span>
            <div>
              <p className="text-sm font-medium text-foreground">ServeAI Insight</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                You're 67% through your upper body week. Completing tomorrow's session will unlock the
                <span className="text-amber font-medium"> "Consistency King" badge</span>.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <CoachAI />
      <BottomNav />
    </div>
  );
}
