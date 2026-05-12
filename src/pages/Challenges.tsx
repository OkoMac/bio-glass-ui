import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useChallenges } from "@/hooks/useChallenges";
import { toast } from "sonner";
import {
  Flame, Trophy, Users, Target, Clock, CheckCircle,
  Lock, ChevronRight, Medal, Star, Zap, Plus, Loader2, ArrowLeft, X,
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

/* ── main component ───────────────────────────────────────────── */
export default function Challenges() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ChallengeCategory | "all">("all");
  const [selected, setSelected]   = useState<Challenge | null>(null);
  const [view, setView]           = useState<"grid" | "list">("grid");

  const { challenges: rows, participation, loading, join, updateTaskProgress } = useChallenges();

  // Map DB rows → page Challenge type, infused with user participation state
  const allChallenges: Challenge[] = useMemo(() => rows.map((r) => {
    const part = participation[r.id];
    const taskList = r.tasks.map((t, i) => ({ label: t.label, done: !!part?.task_progress?.[i] }));
    const doneCount = taskList.filter(t => t.done).length;
    const progress = r.tasks.length > 0 ? Math.round((doneCount / r.tasks.length) * 100) : 0;
    const ends = r.ends_at ? new Date(r.ends_at).getTime() : null;
    const daysLeft = ends ? Math.max(0, Math.ceil((ends - Date.now()) / (1000 * 60 * 60 * 24))) : undefined;

    let status: ChallengeStatus;
    if (part?.completed_at) status = "completed";
    else if (part) status = "active";
    else status = "available";

    return {
      id: r.id, title: r.title, description: r.description, category: r.category,
      status, participants: r.participant_count, daysLeft, daysTotal: r.days_total,
      progress, reward: r.reward_text, rewardPoints: r.reward_points,
      createdBy: r.created_by_label, badge: r.badge, difficulty: r.difficulty,
      tasks: taskList, providerId: r.provider_id ?? undefined, location: r.location ?? undefined,
    } as Challenge;
  }), [rows, participation]);

  const filtered = filter === "all" ? allChallenges : allChallenges.filter(c => c.category === filter);
  const activeCount = allChallenges.filter(c => c.status === "active").length;
  const availableCount = allChallenges.filter(c => c.status === "available").length;
  const totalParticipants = allChallenges.reduce((sum, c) => sum + c.participants, 0);

  const providerStats = useMemo(() => {
    const byProvider = new Map<string, { name: string; challengeCount: number; totalParticipants: number }>();
    for (const c of allChallenges) {
      const cur = byProvider.get(c.createdBy) ?? { name: c.createdBy, challengeCount: 0, totalParticipants: 0 };
      cur.challengeCount += 1;
      cur.totalParticipants += c.participants;
      byProvider.set(c.createdBy, cur);
    }
    return Array.from(byProvider.values());
  }, [allChallenges]);

  const handleJoin = async (id: string) => {
    try { await join(id); toast.success("You're in — let's go"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to join"); }
  };

  const handleToggleTask = async (challengeId: string, idx: number, done: boolean) => {
    try {
      const completed = await updateTaskProgress(challengeId, idx, done);
      if (completed) {
        const c = allChallenges.find(x => x.id === challengeId);
        toast.success(`Challenge complete — ${c?.rewardPoints ?? 0} points awarded!`);
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="max-w-3xl mx-auto px-4 pt-20 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 mt-0.5 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='shrink-0 w-9 h-9 mt-0.5 glass-2 rounded-full flex it…" aria-label="navigate(-1)} className='shrink-0 w-9 h-9 mt-0.5 glass-2 rounded-full flex it…">
              <ArrowLeft className="w-4 h-4" />
            </button>
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
              <div className="text-2xl font-bold text-foreground">{allChallenges.length}</div>
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
                  <button className="px-3 py-1 gradient-indigo rounded-full text-xs font-medium" onClick={() => toast("Provider profile coming soon")} title="toast('Provider profile coming soon')}> View Profile" aria-label="toast('Provider profile coming soon')}> View Profile">
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
              onJoin={() => handleJoin(selected.id)}
              onToggleTask={(idx, done) => handleToggleTask(selected.id, idx, done)}
            />
          )}
        </AnimatePresence>

        {loading && allChallenges.length === 0 && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Bottom nav */}
        <BottomNav />
      </div>

      {/* Coach AI */}
      <BionAssistant
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

function ChallengeDetailModal({ challenge, onClose, onJoin, onToggleTask }: {
  challenge: Challenge;
  onClose: () => void;
  onJoin: () => void;
  onToggleTask: (idx: number, done: boolean) => void;
}) {
  const navigate = useNavigate();
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
        className="glass-2 rounded-3xl max-w-lg md:max-w-3xl xl:max-w-7xl w-full max-h-[90vh] overflow-y-auto"
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
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10" aria-label="Close" title="Close">
              <X className="w-5 h-5 text-foreground" />
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
              <button className="px-4 py-2 gradient-indigo rounded-full text-sm font-medium" onClick={() => challenge.providerId ? navigate(`/provider/${challenge.providerId}`) : toast("Provider profile coming soon")} title="challenge.providerId ? navigate(`/provider/$ `) : toast('Provider profile com…" aria-label="challenge.providerId ? navigate(`/provider/$ `) : toast('Provider profile com…">
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

          {/* Tasks (when active) — tap to toggle */}
          {challenge.status === "active" && challenge.tasks.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {challenge.tasks.map((t, i) => (
                <button
                  key={i}
                  onClick={() => onToggleTask(i, !t.done)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    t.done ? "bg-teal/10 text-foreground" : "bg-white/5 text-muted-foreground hover:text-foreground"
                  }`}
                 title="onToggleTask(i, !t.done)} className= `} >" aria-label="onToggleTask(i, !t.done)} className= `} >">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    t.done ? "border-teal bg-teal" : "border-white/20"
                  }`}>
                    {t.done && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm ${t.done ? "line-through opacity-70" : ""}`}>{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {challenge.status === "available" && (
              <button onClick={onJoin} className="flex-1 py-3 gradient-indigo rounded-xl text-sm font-medium" title="Join Challenge" aria-label="Join Challenge">
                Join Challenge
              </button>
            )}
            {challenge.status === "completed" && (
              <button disabled className="flex-1 py-3 bg-teal/20 text-teal rounded-xl text-sm font-semibold cursor-default" title="✓ Completed" aria-label="✓ Completed">
                ✓ Completed
              </button>
            )}
            {challenge.status === "locked" && (
              <button className="flex-1 py-3 glass-1 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed" title="Unlock Requirements" aria-label="Unlock Requirements">
                Unlock Requirements
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}