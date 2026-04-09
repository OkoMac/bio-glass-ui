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

// Routines loaded from backend
const routines: {
  id: string;
  title: string;
  provider: string;
  providerImage: string;
  vertical: "teal" | "indigo" | "coral" | "amber";
  type: string;
  daysCompleted: number;
  totalDays: number;
  exercises: { name: string; sets: string; done: boolean }[];
}[] = [];

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
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Routines</h1>
            <p className="text-xs text-muted-foreground">{routines.length === 0 ? "No active prescriptions" : `${routines.length} active prescriptions`}</p>
          </div>
        </div>

        {/* Routines */}
        {routines.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Dumbbell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No routines assigned yet</p>
            <p className="text-xs text-muted-foreground">
              Routines from your providers will appear here once assigned.
            </p>
          </GlassCard>
        ) : null}
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

        {/* ServeAI nudge — only shown when routines exist */}
        {routines.length > 0 && (
          <GlassCard variant="accent-indigo" className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✦</span>
              <div>
                <p className="text-sm font-medium text-foreground">ServeAI Insight</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Keep up the consistency with your routines to unlock more badges!
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      <CoachAI />
      <BottomNav />
    </div>
  );
}
