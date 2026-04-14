import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import { useStreakRewards, StreakTier } from "@/hooks/useStreakRewards";
import { Sparkles, Gift, X, ArrowRight, Trophy } from "lucide-react";

const TIER_COPY: Record<StreakTier, { title: string; subtitle: string; emoji: string }> = {
  bronze:   { title: "4 Week Streak!",  subtitle: "Bronze tier unlocked",   emoji: "🥉" },
  silver:   { title: "8 Week Streak!",  subtitle: "Silver tier unlocked",   emoji: "🥈" },
  gold:     { title: "12 Week Streak!", subtitle: "Gold tier unlocked",     emoji: "🥇" },
  platinum: { title: "26 Week Streak!", subtitle: "Platinum tier unlocked", emoji: "💎" },
};

/**
 * Pops up automatically when the user crosses a streak milestone.
 * Reveals sponsored rewards available at that tier.
 * Tap to go to /store to claim.
 */
export default function StreakMilestoneModal() {
  const { pendingMilestone, dismissMilestone, eligibleRewards } = useStreakRewards();
  const navigate = useNavigate();
  const [show, setShow] = useState(true);

  if (!pendingMilestone || !show) return null;

  const copy = TIER_COPY[pendingMilestone.tier];
  const tierRewards = eligibleRewards.filter(r => r.milestone_tier === pendingMilestone.tier);

  const handleDismiss = () => {
    setShow(false);
    dismissMilestone();
  };

  const handleClaim = () => {
    handleDismiss();
    navigate("/store");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleDismiss}
        className="fixed inset-0 bg-obsidian/80 z-[100] flex items-center justify-center px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-sm w-full"
        >
          <GlassCard className="p-6 text-center relative overflow-hidden">
            {/* Confetti gradient bg */}
            <div className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.4) 0%, transparent 60%)" }} />

            <button onClick={handleDismiss}
              className="absolute top-3 right-3 w-8 h-8 glass-1 rounded-full flex items-center justify-center z-10">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 12 }}
                className="text-7xl mb-3"
              >
                {copy.emoji}
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground">{copy.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{copy.subtitle}</p>

              <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-amber">
                <Trophy className="w-4 h-4" />
                <span className="font-semibold">{pendingMilestone.weeks} weeks of consistency</span>
              </div>

              {tierRewards.length > 0 ? (
                <div className="mt-5 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-coral" />
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Rewards available</p>
                  </div>
                  <p className="text-sm text-foreground font-medium">
                    {tierRewards.length} sponsored {tierRewards.length === 1 ? "reward" : "rewards"} ready to claim
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {tierRewards.slice(0, 3).map(r => (
                      <span key={r.id} className="text-[10px] px-2 py-0.5 glass-1 rounded-pill text-foreground">
                        {r.title.slice(0, 20)}{r.title.length > 20 ? "…" : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-5">
                  We're sourcing sponsors for this tier. Check back soon!
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleClaim}
                className="w-full mt-6 rounded-pill py-3 gradient-indigo text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {tierRewards.length > 0 ? "Claim my reward" : "Open BION Store"}
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <button onClick={handleDismiss}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground">
                Maybe later
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
