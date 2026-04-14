import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStreaks } from "@/hooks/useStreaks";

export type StreakTier = "bronze" | "silver" | "gold" | "platinum";

export interface SponsoredReward {
  id: string;
  sponsor_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  reward_type: "streak_milestone" | "store_product";
  milestone_tier: StreakTier | null;
  points_cost: number | null;
  stock_qty: number;
  stock_remaining: number;
  requires_streak_days: number;
  shipping_required: boolean;
  digital_code: string | null;
  created_at: string;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  shipping_address: any;
  status: "claimed" | "shipped" | "delivered" | "cancelled";
  tracking_number: string | null;
  claimed_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
}

const MILESTONES: { weeks: number; tier: StreakTier }[] = [
  { weeks: 4,  tier: "bronze"   },
  { weeks: 8,  tier: "silver"   },
  { weeks: 12, tier: "gold"     },
  { weeks: 26, tier: "platinum" },
];

const TIER_LABELS: Record<StreakTier, { label: string; color: string; icon: string }> = {
  bronze:   { label: "Bronze",   color: "#CD7F32", icon: "🥉" },
  silver:   { label: "Silver",   color: "#C0C0C0", icon: "🥈" },
  gold:     { label: "Gold",     color: "#FFD700", icon: "🥇" },
  platinum: { label: "Platinum", color: "#E5E4E2", icon: "💎" },
};

export function useStreakRewards() {
  const { user } = useAuth();
  const profileId = user?.profileId;
  const { streak } = useStreaks("booking");

  const [eligibleRewards, setEligibleRewards] = useState<SponsoredReward[]>([]);
  const [pendingMilestone, setPendingMilestone] = useState<{ tier: StreakTier; weeks: number } | null>(null);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  const currentWeeks = Math.floor(streak.currentStreak / 7);

  // Determine which milestones the user has hit
  const earnedTiers: StreakTier[] = MILESTONES
    .filter(m => currentWeeks >= m.weeks)
    .map(m => m.tier);

  // Next milestone to hit
  const nextMilestone = MILESTONES.find(m => currentWeeks < m.weeks);

  // Fetch eligible rewards based on user's earned tiers
  useEffect(() => {
    if (!profileId) { setLoading(false); return; }

    const fetch = async () => {
      // Fetch in-stock streak rewards
      const { data: rewards } = await supabase
        .from("sponsored_rewards")
        .select("*")
        .eq("reward_type", "streak_milestone")
        .gt("stock_remaining", 0);

      // Fetch user's existing redemptions
      const { data: reds } = await supabase
        .from("reward_redemptions")
        .select("*")
        .eq("user_id", profileId);

      if (rewards) {
        const eligible = (rewards as any[]).filter(r =>
          r.milestone_tier && earnedTiers.includes(r.milestone_tier as StreakTier)
        );
        setEligibleRewards(eligible as unknown as SponsoredReward[]);
      }
      if (reds) {
        setRedemptions(reds as unknown as RewardRedemption[]);
      }

      // Detect newly hit milestones (user just crossed threshold)
      const lastNotifiedKey = `bion_last_milestone_${profileId}`;
      const lastNotified = parseInt(localStorage.getItem(lastNotifiedKey) ?? "0", 10);
      const newMilestone = MILESTONES.find(m =>
        currentWeeks >= m.weeks && m.weeks > lastNotified
      );
      if (newMilestone) {
        setPendingMilestone(newMilestone);
        localStorage.setItem(lastNotifiedKey, String(newMilestone.weeks));
      }

      setLoading(false);
    };

    fetch();
  }, [profileId, currentWeeks, earnedTiers.join(",")]);

  // Claim a reward
  const claimReward = useCallback(async (
    rewardId: string,
    shippingAddress?: { street: string; suburb: string; city: string; postal_code: string }
  ) => {
    if (!profileId) return { ok: false, error: "Not authenticated" };

    const reward = eligibleRewards.find(r => r.id === rewardId);
    if (!reward) return { ok: false, error: "Reward not found" };
    if (reward.stock_remaining <= 0) return { ok: false, error: "Out of stock" };

    // Check user hasn't already claimed this reward
    const alreadyClaimed = redemptions.some(r => r.reward_id === rewardId);
    if (alreadyClaimed) return { ok: false, error: "Already claimed" };

    // Insert redemption
    const { error: redError } = await supabase.from("reward_redemptions").insert({
      user_id: profileId,
      reward_id: rewardId,
      points_spent: 0, // streak milestones are free
      shipping_address: shippingAddress ?? null,
      status: "claimed",
    });

    if (redError) return { ok: false, error: redError.message };

    // Decrement stock
    await supabase.from("sponsored_rewards")
      .update({ stock_remaining: reward.stock_remaining - 1 })
      .eq("id", rewardId);

    // Update local state
    setEligibleRewards(prev => prev.map(r =>
      r.id === rewardId ? { ...r, stock_remaining: r.stock_remaining - 1 } : r
    ));

    return { ok: true };
  }, [profileId, eligibleRewards, redemptions]);

  const dismissMilestone = useCallback(() => {
    setPendingMilestone(null);
  }, []);

  return {
    earnedTiers,
    nextMilestone,
    currentWeeks,
    streakDays: streak.currentStreak,
    eligibleRewards,
    redemptions,
    pendingMilestone,
    dismissMilestone,
    claimReward,
    loading,
    TIER_LABELS,
  };
}
