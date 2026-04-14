import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useStreakRewards, StreakTier } from "@/hooks/useStreakRewards";
import { useActivityPoints, pointsToRand } from "@/hooks/useActivityPoints";
import { useAuth } from "@/contexts/AuthContext";
import {
  Lock, Trophy, Sparkles, ShoppingBag, ArrowLeft, X, Check, Loader2,
  Package, Truck, Mail, MapPin,
} from "lucide-react";

export default function Store() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rewards = useStreakRewards();
  const points = useActivityPoints();

  const [filter, setFilter] = useState<"available" | "claimed">("available");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [shippingForm, setShippingForm] = useState({
    street: "", suburb: "", city: "", postal_code: "",
  });
  const [success, setSuccess] = useState<string | null>(null);

  const STREAK_GATE_DAYS = 7;
  const isUnlocked = rewards.streakDays >= STREAK_GATE_DAYS;

  const claimedIds = new Set(rewards.redemptions.map(r => r.reward_id));
  const availableRewards = rewards.eligibleRewards.filter(r => !claimedIds.has(r.id));
  const myRedemptions = rewards.redemptions;

  const claimingReward = rewards.eligibleRewards.find(r => r.id === claimingId);

  const handleClaim = async () => {
    if (!claimingId) return;
    const reward = rewards.eligibleRewards.find(r => r.id === claimingId);
    if (!reward) return;

    const needsShipping = reward.shipping_required;
    if (needsShipping && (!shippingForm.street || !shippingForm.city || !shippingForm.postal_code)) {
      return;
    }

    const result = await rewards.claimReward(claimingId, needsShipping ? shippingForm : undefined);
    if (result.ok) {
      setSuccess(reward.title);
      setClaimingId(null);
      setShippingForm({ street: "", suburb: "", city: "", postal_code: "" });
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  // ── Locked state (no streak) ──
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-12 space-y-5">
          <button onClick={() => navigate(-1)} className="glass-2 rounded-full w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          <GlassCard className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-amber" />
            </div>
            <h1 className="text-xl font-bold text-foreground">BION Store is locked</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Build a {STREAK_GATE_DAYS}-day streak by booking sessions and engaging with BION daily to unlock the store.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 glass-1 rounded-pill px-4 py-2">
              <Trophy className="w-4 h-4 text-amber" />
              <span className="text-sm font-data text-foreground">{rewards.streakDays} / {STREAK_GATE_DAYS} days</span>
            </div>
            <button
              onClick={() => navigate("/home")}
              className="block mx-auto mt-5 rounded-pill px-6 py-2.5 gradient-indigo text-white text-sm font-semibold"
            >
              Discover providers
            </button>
          </GlassCard>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <div className="max-w-3xl xl:max-w-5xl mx-auto px-4 md:px-8 pt-12 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-amber" /> BION Store
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Sponsored rewards for your wellness journey
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Your points</p>
            <p className="text-lg font-bold text-foreground font-data">{points.balance.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">≈ R{pointsToRand(points.balance).toFixed(2)}</p>
          </div>
        </div>

        {/* Streak status */}
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-teal" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{rewards.streakDays} day streak</p>
            <p className="text-[11px] text-muted-foreground">
              {rewards.earnedTiers.length > 0
                ? `${rewards.earnedTiers.length} milestone${rewards.earnedTiers.length > 1 ? "s" : ""} unlocked`
                : "Keep going to unlock sponsored rewards"}
            </p>
          </div>
          {rewards.nextMilestone && (
            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground">Next</p>
              <p className="text-xs font-semibold text-amber">{rewards.nextMilestone.weeks * 7 - rewards.streakDays} days</p>
            </div>
          )}
        </GlassCard>

        {/* Tier badges */}
        {rewards.earnedTiers.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {rewards.earnedTiers.map(tier => (
              <div key={tier} className="shrink-0 glass-1 rounded-pill px-3 py-1.5 flex items-center gap-1.5">
                <span>{rewards.TIER_LABELS[tier].icon}</span>
                <span className="text-xs font-medium text-foreground">{rewards.TIER_LABELS[tier].label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="glass-1 rounded-pill p-1 flex">
          <button
            onClick={() => setFilter("available")}
            className={`flex-1 rounded-pill py-2 text-xs font-medium transition-all ${
              filter === "available" ? "gradient-indigo text-white" : "text-muted-foreground"
            }`}
          >
            Available ({availableRewards.length})
          </button>
          <button
            onClick={() => setFilter("claimed")}
            className={`flex-1 rounded-pill py-2 text-xs font-medium transition-all ${
              filter === "claimed" ? "gradient-indigo text-white" : "text-muted-foreground"
            }`}
          >
            My claims ({myRedemptions.length})
          </button>
        </div>

        {/* Success banner */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl p-3 bg-teal/10 border border-teal/30 flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-teal shrink-0" />
              <p className="text-xs text-teal">"{success}" claimed! Check My claims for status.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rewards grid */}
        {rewards.loading ? (
          <GlassCard className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-muted-foreground mx-auto animate-spin" />
          </GlassCard>
        ) : filter === "available" ? (
          availableRewards.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">No rewards available</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Sponsors are on the way. Keep your streak alive — new merchandise drops regularly.
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableRewards.map(r => (
                <RewardCard
                  key={r.id}
                  reward={r}
                  tierLabel={rewards.TIER_LABELS[r.milestone_tier as StreakTier]?.label ?? "Sponsored"}
                  onClaim={() => setClaimingId(r.id)}
                />
              ))}
            </div>
          )
        ) : (
          myRedemptions.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Nothing claimed yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your claimed rewards will appear here.</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {myRedemptions.map(red => {
                const reward = rewards.eligibleRewards.find(r => r.id === red.reward_id);
                return (
                  <GlassCard key={red.id} className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      red.status === "delivered" ? "bg-teal/10" :
                      red.status === "shipped" ? "bg-indigo/10" : "bg-amber/10"
                    }`}>
                      {red.status === "delivered" ? <Check className="w-4 h-4 text-teal" /> :
                       red.status === "shipped" ? <Truck className="w-4 h-4 text-indigo" /> :
                       <Package className="w-4 h-4 text-amber" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{reward?.title ?? "Reward"}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {red.status} · {new Date(red.claimed_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {red.tracking_number && (
                      <p className="text-[10px] text-muted-foreground font-data">{red.tracking_number}</p>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── CLAIM MODAL ── */}
      <AnimatePresence>
        {claimingReward && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setClaimingId(null)}
              className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto space-y-4"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Claim reward</h3>
                <button onClick={() => setClaimingId(null)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {claimingReward.image_url && (
                <img src={claimingReward.image_url} alt={claimingReward.title}
                  className="w-full aspect-video rounded-2xl object-cover" />
              )}

              <div>
                <p className="text-xs text-amber font-semibold uppercase tracking-widest mb-1">
                  {rewards.TIER_LABELS[claimingReward.milestone_tier as StreakTier]?.label} reward
                </p>
                <h4 className="text-lg font-bold text-foreground">{claimingReward.title}</h4>
                {claimingReward.description && (
                  <p className="text-sm text-muted-foreground mt-2">{claimingReward.description}</p>
                )}
              </div>

              {claimingReward.shipping_required && (
                <div className="space-y-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Shipping address
                  </p>
                  <input
                    value={shippingForm.street}
                    onChange={e => setShippingForm(p => ({ ...p, street: e.target.value }))}
                    placeholder="Street address"
                    className="w-full px-4 py-3 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={shippingForm.suburb}
                      onChange={e => setShippingForm(p => ({ ...p, suburb: e.target.value }))}
                      placeholder="Suburb"
                      className="px-4 py-3 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]"
                    />
                    <input
                      value={shippingForm.city}
                      onChange={e => setShippingForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="City"
                      className="px-4 py-3 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]"
                    />
                  </div>
                  <input
                    value={shippingForm.postal_code}
                    onChange={e => setShippingForm(p => ({ ...p, postal_code: e.target.value }))}
                    placeholder="Postal code"
                    className="w-full px-4 py-3 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]"
                  />
                </div>
              )}

              {claimingReward.digital_code && !claimingReward.shipping_required && (
                <div className="glass-1 rounded-2xl p-3 flex items-start gap-2">
                  <Mail className="w-4 h-4 text-indigo shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Digital reward — code will be revealed after claim and emailed to you.
                  </p>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleClaim}
                disabled={claimingReward.shipping_required && (!shippingForm.street || !shippingForm.city || !shippingForm.postal_code)}
                className="w-full rounded-pill py-4 gradient-indigo text-white font-semibold disabled:opacity-50"
              >
                Claim reward (free)
              </motion.button>

              <p className="text-[10px] text-muted-foreground text-center">
                Sponsored by partner brands. Allow 5-10 working days for delivery.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

function RewardCard({ reward, tierLabel, onClaim }: { reward: any; tierLabel: string; onClaim: () => void }) {
  return (
    <GlassCard hover className="overflow-hidden">
      {reward.image_url && (
        <div className="aspect-video bg-white/[0.03]"
          style={{ backgroundImage: `url(${reward.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      )}
      <div className="p-4">
        <p className="text-[10px] text-amber uppercase tracking-widest font-semibold mb-1">{tierLabel}</p>
        <h3 className="text-sm font-bold text-foreground">{reward.title}</h3>
        {reward.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{reward.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-muted-foreground">
            {reward.stock_remaining} of {reward.stock_qty} left
          </span>
          <button onClick={onClaim}
            className="rounded-pill px-3 py-1.5 gradient-indigo text-white text-xs font-semibold">
            Claim free
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
