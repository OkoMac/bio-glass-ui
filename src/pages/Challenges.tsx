import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import {
  Flame, Trophy, Users, Target, Clock, CheckCircle,
  Lock, ChevronRight, Medal, Star, Zap, Plus
} from "lucide-react";

/* ── types ───────────────────────────────────────────────────── */
type ChallengeStatus = "active" | "completed" | "locked" | "available";
type ChallengeCategory = "fitness" | "mindfulness" | "nutrition" | "consistency" | "social";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  status: ChallengeStatus;
  participants: number;
  daysLeft?: number;
  daysTotal: number;
  progress: number; // 0-100
  reward: string;
  rewardPoints: number;
  createdBy: string;
  badge: string;
  difficulty: "easy" | "medium" | "hard";
  tasks: { label: string; done: boolean }[];
  providerId?: string;
  location?: string;
}

// Challenges loaded from backend
const REAL_CHALLENGES: Challenge[] = [];

const UNIQUE_PROVIDERS: string[] = [];

/* ── main component ───────────────────────────────────────────── */
export default function Challenges() {
  const [filter, setFilter] = useState<ChallengeCategory | "all">("all");
  const [selected, setSelected]   = useState<Challenge | null>(null);
  const [view, setView]           = useState<"grid" | "list">("grid");

  const filtered = filter === "all"
    ? REAL_CHALLENGES
    : REAL_CHALLENGES.filter(c => c.category === filter);

  const activeCount = REAL_CHALLENGES.filter(c => c.status === "active").length;
  const availableCount = REAL_CHALLENGES.filter(c => c.status === "available").length;

  // Calculate total participants across all challenges
  const totalParticipants = REAL_CHALLENGES.reduce((sum, c) => sum + c.participants, 0);

  // Get provider stats
  const providerStats = UNIQUE_PROVIDERS.map(provider => {
    const providerChallenges = REAL_CHALLENGES.filter(c => c.createdBy === provider);
    return {
      name: provider,
      challengeCount: providerChallenges.length,
      totalParticipants: providerChallenges.reduce((sum, c) => sum + c.participants, 0)
    };
  });

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="max-w-3xl mx-auto px-4 pt-12 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Challenges</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Earn rewards by completing wellness challenges
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber" />
                <span className="text-xs text-foreground">{activeCount} active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo" />
                <span className="text-xs text-foreground">{totalParticipants.toLocaleString()} participants</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="glass-1 rounded-pill p-1 flex">
              {(["grid", "list"] as const).map(v => (
                <motion.button
                  key={v}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-pill text-xs font-medium transition-all capitalize ${
                    view === v ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {v}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {["all", "fitness", "nutrition", "mindfulness", "consistency", "social"].map(cat => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(cat as any)}
              className={`px-4 py-2 rounded-pill text-sm font-medium whitespace-nowrap ${
                filter === cat ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
              }`}
            >
              {cat === "all" ? "All Challenges" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Stats card */}
        <GlassCard className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{REAL_CHALLENGES.length}</div>
              <div className="text-xs text-muted-foreground">Total Challenges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{availableCount}</div>
              <div className="text-xs text-muted-foreground">Available Now</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{providerStats.length}</div>
              <div className="text-xs text-muted-foreground">Providers</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-muted-foreground">
              Challenges created by service providers in your area
            </p>
          </div>
        </GlassCard>

        {/* Challenges grid / list / empty state */}
        {filtered.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No challenges available yet</p>
            <p className="text-xs text-muted-foreground">
              Challenges from providers will appear here. Check back soon!
            </p>
          </GlassCard>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onClick={() => setSelected(challenge)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(challenge => (
              <ChallengeListItem
                key={challenge.id}
                challenge={challenge}
                onClick={() => setSelected(challenge)}
              />
            ))}
          </div>
        )}

        {/* Provider showcase */}
        {filter === "all" && providerStats.length > 0 && (
          <GlassCard className="p-4 mt-6">
            <h3 className="font-semibold text-foreground mb-3">Featured Providers</h3>
            <div className="space-y-3">
              {providerStats.slice(0, 4).map(provider => (
                <div key={provider.name} className="flex items-center justify-between p-3 glass-1 rounded-2xl">
                  <div>
                    <div className="font-medium text-foreground">{provider.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {provider.challengeCount} challenge{provider.challengeCount !== 1 ? 's' : ''} • {provider.totalParticipants} participants
                    </div>
                  </div>
                  <button className="px-3 py-1 gradient-indigo rounded-full text-xs font-medium">
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Detail modal */}
        <AnimatePresence>
          {selected && (
            <ChallengeDetailModal
              challenge={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>

        {/* Bottom nav */}
        <BottomNav />
      </div>

      {/* Coach AI */}
      <CoachAI
        context={`Challenges page. Viewing ${filter === "all" ? "all" : filter} challenges. ${filtered.length} challenges available.`}
        suggestions={[
          "How do I choose the right challenge for my fitness level?",
          "What's the benefit of provider-created challenges?",
          "How can I stay motivated throughout a 30-day challenge?",
          "Are there challenges suitable for beginners in Pretoria?"
        ]}
      />
    </div>
  );
}

/* ── subcomponents ────────────────────────────────────────────── */

function ChallengeCard({ challenge, onClick }: { challenge: Challenge; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-1 rounded-3xl p-5 cursor-pointer transition-all relative overflow-hidden ${
        challenge.status === "locked" ? "opacity-70" : ""
      }`}
    >
      {/* Status badge */}
      <div className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        challenge.status === "active" ? "bg-emerald-500/20 text-emerald-300" :
        challenge.status === "completed" ? "bg-indigo-500/20 text-indigo-300" :
        challenge.status === "available" ? "bg-amber-500/20 text-amber-300" :
        "bg-slate-500/20 text-slate-300"
      }`}>
        {challenge.status}
      </div>

      {/* Lock icon for locked challenges */}
      {challenge.status === "locked" && (
        <div className="absolute top-4 left-4">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="text-3xl">{challenge.badge}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground truncate">{challenge.title}</h3>
            {challenge.difficulty === "hard" && <Flame className="w-4 h-4 text-amber flex-shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{challenge.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo" />
                <span className="text-xs text-foreground">{challenge.participants}</span>
              </div>
              {challenge.daysLeft !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal" />
                  <span className="text-xs text-foreground">{challenge.daysLeft}d left</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-foreground">{challenge.createdBy}</div>
              {challenge.location && (
                <div className="text-[10px] text-muted-foreground">{challenge.location}</div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {challenge.status === "active" && challenge.progress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{challenge.progress}%</span>
              </div>
              <div className="h-1.5 glass-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${challenge.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full gradient-indigo rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ChallengeListItem({ challenge, onClick }: { challenge: Challenge; onClick: () => void }) {
  return (
    <motion.div
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className="glass-1 rounded-2xl p-4 cursor-pointer flex items-center gap-4"
    >
      <div className="text-2xl">{challenge.badge}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground truncate">{challenge.title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            challenge.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-300" :
            challenge.difficulty === "medium" ? "bg-amber-500/20 text-amber-300" :
            "bg-rose-500/20 text-rose-300"
          }`}>
            {challenge.difficulty}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-1">{challenge.description}</p>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo" />
            <span className="text-xs text-foreground">{challenge.participants}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber" />
            <span className="text-xs text-foreground">{challenge.rewardPoints} pts</span>
          </div>
          <div className="text-xs text-muted-foreground">{challenge.createdBy}</div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </motion.div>
  );
}

function ChallengeDetailModal({ challenge, onClose }: { challenge: Challenge; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-2 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{challenge.badge}</div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{challenge.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    challenge.status === "active" ? "bg-emerald-500/20 text-emerald-300" :
                    challenge.status === "completed" ? "bg-indigo-500/20 text-indigo-300" :
                    challenge.status === "available" ? "bg-amber-500/20 text-amber-300" :
                    "bg-slate-500/20 text-slate-300"
                  }`}>
                    {challenge.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    challenge.difficulty === "easy" ? "bg-emerald-500/20 text-emerald-300" :
                    challenge.difficulty === "medium" ? "bg-amber-500/20 text-amber-300" :
                    "bg-rose-500/20 text-rose-300"
                  }`}>
                    {challenge.difficulty}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10">
              <Lock className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Description */}
          <p className="text-foreground/80 mb-6">{challenge.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 glass-1 rounded-2xl">
              <div className="text-2xl font-bold text-foreground">{challenge.participants}</div>
              <div className="text-xs text-muted-foreground">Participants</div>
            </div>
            <div className="text-center p-3 glass-1 rounded-2xl">
              <div className="text-2xl font-bold text-foreground">{challenge.daysTotal}</div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
            <div className="text-center p-3 glass-1 rounded-2xl">
              <div className="text-2xl font-bold text-foreground">{challenge.rewardPoints}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
          </div>

          {/* Provider info */}
          <div className="p-4 glass-1 rounded-2xl mb-6">
            <div className="text-sm font-medium text-foreground mb-2">Created by</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">{challenge.createdBy}</div>
                {challenge.location && (
                  <div className="text-xs text-muted-foreground">{challenge.location}</div>
                )}
                {challenge.createdBy !== "BION" && challenge.createdBy !== "BION Community" && (
                  <div className="text-xs text-muted-foreground mt-1">Certified Pretoria Service Provider</div>
                )}
              </div>
              <button className="px-4 py-2 gradient-indigo rounded-full text-sm font-medium">
                View Profile
              </button>
            </div>
          </div>

          {/* Tasks */}
          {challenge.tasks.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">Tasks</h3>
              <div className="space-y-2">
                {challenge.tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 glass-1 rounded-xl">
                    {task.done ? (
                      <CheckCircle className="w-5 h-5 text-emerald" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-muted-foreground" />
                    )}
                    <span className={`text-sm ${task.done ? "text-foreground/60 line-through" : "text-foreground"}`}>
                      {task.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reward */}
          <div className="p-4 gradient-indigo/20 rounded-2xl mb-6">
            <div className="text-sm font-medium text-foreground mb-1">Reward</div>
            <div className="text-lg font-bold text-foreground">{challenge.reward}</div>
            <div className="text-sm text-muted-foreground mt-1">+ {challenge.rewardPoints} BIO Points</div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {challenge.status === "available" && (
              <button className="flex-1 py-3 gradient-indigo rounded-xl text-sm font-medium">
                Join Challenge
              </button>
            )}
            {challenge.status === "active" && (
              <>
                <button className="flex-1 py-3 glass-1 rounded-xl text-sm font-medium">
                  Update Progress
                </button>
                <button className="flex-1 py-3 gradient-indigo rounded-xl text-sm font-medium">
                  Check In
                </button>
              </>
            )}
            {challenge.status === "locked" && (
              <button className="flex-1 py-3 glass-1 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed">
                Unlock Requirements
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}