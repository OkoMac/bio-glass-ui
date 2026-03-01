import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Streak {
  id: string;
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export function useStreaks(streakType = "booking") {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak>({
    id: "mock", streakType, currentStreak: 14, longestStreak: 21,
    lastActivityDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!user?.id) return;

    supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .eq("streak_type", streakType)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          setStreak({
            id:               data.id,
            streakType:       data.streak_type,
            currentStreak:    data.current_streak,
            longestStreak:    data.longest_streak,
            lastActivityDate: data.last_activity_date,
          });
        }
      });
  }, [user?.id, streakType]);

  const checkIn = useCallback(async () => {
    if (!user?.id) return;
    const today = new Date().toISOString().split("T")[0];
    if (streak.lastActivityDate === today) return; // already checked in

    const newStreak = streak.currentStreak + 1;
    setStreak(prev => ({ ...prev, currentStreak: newStreak, lastActivityDate: today }));

    await supabase.from("user_streaks").upsert({
      user_id:            user.id,
      streak_type:        streakType,
      current_streak:     newStreak,
      longest_streak:     Math.max(newStreak, streak.longestStreak),
      last_activity_date: today,
    });
  }, [user?.id, streak, streakType]);

  return { streak, checkIn };
}
