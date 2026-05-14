/**
 * useStreaks — read-only view of the user's server-side streak counters.
 *
 * v2.0 Phase 1C rewrite. Was a hybrid: localStorage compute + Supabase
 * read + Supabase write on a custom DOM event. Three problems:
 *   1. localStorage compute lost the streak when the user switched
 *      device or cleared storage.
 *   2. The server-side update path was supabaseAdmin.rpc("increment_streak")
 *      which silently 404'd because the SQL function was never created.
 *   3. The window event listener tried to write the streak from the
 *      frontend but couldn't reach a working write path.
 *
 * v2.0 architecture: backend writes the streak via services/streaks.ts
 * recordStreakActivity() on real economic events (session completed
 * via bookings.ts, etc.). Frontend just reads.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Streak {
  id: string;
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

const EMPTY: Streak = {
  id: "",
  streakType: "booking",
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
};

/** Read-only streak hook. Backend updates are server-side via
 *  services/streaks.ts → recordStreakActivity. */
export function useStreaks(streakType: string = "booking"): { streak: Streak; loading: boolean } {
  const { user } = useAuth();
  const profileId = user?.profileId;
  const [streak, setStreak] = useState<Streak>({ ...EMPTY, streakType });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) {
      setStreak({ ...EMPTY, streakType });
      return;
    }
    setLoading(true);
    let cancelled = false;
    supabase
      .from("user_streaks")
      .select("id, streak_type, current_streak, longest_streak, last_activity_date")
      .eq("user_id", profileId)
      .eq("streak_type", streakType)
      .maybeSingle()
      .then(({ data }: any) => {
        if (cancelled) return;
        if (data) {
          const row = data as Record<string, unknown>;
          setStreak({
            id:               String(row.id ?? ""),
            streakType:       String(row.streak_type ?? streakType),
            currentStreak:    Number(row.current_streak ?? 0),
            longestStreak:    Number(row.longest_streak ?? 0),
            lastActivityDate: (row.last_activity_date as string | null) ?? null,
          });
        } else {
          // No row yet — user has never triggered a streak event.
          setStreak({ ...EMPTY, streakType });
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [profileId, streakType]);

  return { streak, loading };
}
