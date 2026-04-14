import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActivityPointEntry {
  id: string;
  points: number;
  action: string;
  reference_id: string | null;
  created_at: string;
}

export const POINTS_PER_RAND = 50; // 50 pts = R1
export const YEARLY_EARN_CAP = 250_000; // R5,000 max/year per user

/**
 * Action → point rewards (conservative rates)
 */
export const POINT_REWARDS = {
  signup: 50,              // R1
  daily_open: 1,           // R0.02
  log_food: 1,
  log_water: 1,
  log_sleep: 1,
  book_session: 5,         // R0.10
  complete_session: 10,    // R0.20
  review: 15,              // R0.30
  referral_signup: 50,     // R1 — both referrer + referred get this
  streak_7day: 25,         // R0.50
  streak_4week: 100,       // R2
  streak_12week: 300,      // R6
  streak_26week: 750,      // R15
} as const;

export type ActivityAction = keyof typeof POINT_REWARDS;

export function pointsToRand(points: number): number {
  return Math.round((points / POINTS_PER_RAND) * 100) / 100;
}

export function randToPoints(rand: number): number {
  return Math.round(rand * POINTS_PER_RAND);
}

/**
 * Activity Points hook — usage-based store currency.
 * Anyone earns, only subscribers redeem. Hard cap at 250k/year (trigger enforced).
 */
export function useActivityPoints() {
  const { user } = useAuth();
  const profileId = user?.profileId;

  const [balance, setBalance] = useState(0);
  const [yearlyEarned, setYearlyEarned] = useState(0);
  const [history, setHistory] = useState<ActivityPointEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }

    const fetchData = async () => {
      const { data, error } = await supabase
        .from("activity_points")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const entries = data as unknown as ActivityPointEntry[];
        setHistory(entries);
        setBalance(entries.reduce((sum, e) => sum + e.points, 0));

        // Calculate yearly earned (positive entries in last 365 days)
        const yearAgo = Date.now() - 365 * 86_400_000;
        setYearlyEarned(
          entries
            .filter(e => e.points > 0 && new Date(e.created_at).getTime() > yearAgo)
            .reduce((sum, e) => sum + e.points, 0)
        );
      }
      setLoading(false);
    };

    fetchData();
  }, [profileId]);

  /**
   * Award points for an action.
   * Returns { ok: boolean, reason?: string }
   * Will fail silently if yearly cap is hit (trigger in DB throws).
   */
  const awardPoints = useCallback(async (action: ActivityAction, referenceId?: string) => {
    if (!profileId) return { ok: false, reason: "no_profile" };

    const points = POINT_REWARDS[action];
    if (!points) return { ok: false, reason: "invalid_action" };

    // Check cap before trying
    if (yearlyEarned + points > YEARLY_EARN_CAP) {
      return { ok: false, reason: "yearly_cap_reached" };
    }

    const { error } = await supabase.from("activity_points").insert({
      user_id: profileId,
      points,
      action,
      reference_id: referenceId ?? null,
    });

    if (error) return { ok: false, reason: error.message };

    // Optimistic update
    setBalance(prev => prev + points);
    setYearlyEarned(prev => prev + points);
    return { ok: true };
  }, [profileId, yearlyEarned]);

  const yearlyRemaining = Math.max(0, YEARLY_EARN_CAP - yearlyEarned);

  return {
    balance,
    balanceRand: pointsToRand(balance),
    yearlyEarned,
    yearlyRemaining,
    yearlyCapReached: yearlyEarned >= YEARLY_EARN_CAP,
    history,
    loading,
    awardPoints,
  };
}
