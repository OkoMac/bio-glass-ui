import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getSASTDateKey } from "../utils/sastDate";

export interface Streak {
  id: string;
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

/**
 * Compute booking streak from localStorage booking history.
 * Streak = consecutive weeks with at least 1 booking.
 * Resets if user goes a full week without any booking.
 */
function computeBookingStreak(): { current: number; longest: number; lastDate: string | null } {
  try {
    const stored = localStorage.getItem("bio_user");
    if (!stored) return { current: 0, longest: 0, lastDate: null };

    // Gather all booking dates from localStorage calendar events
    const events = JSON.parse(localStorage.getItem("bion_calendar_events") ?? "[]");
    const dates: Date[] = events
      .filter((e: any) => e.category === "appointment" && e.date)
      .map((e: any) => new Date(e.date))
      .filter((d: Date) => !isNaN(d.getTime()))
      .sort((a: Date, b: Date) => a.getTime() - b.getTime());

    if (dates.length === 0) return { current: 0, longest: 0, lastDate: null };

    // Group by ISO week
    const getWeek = (d: Date) => {
      const jan1 = new Date(d.getFullYear(), 0, 1);
      return `${d.getFullYear()}-W${Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)}`;
    };

    const weeks = [...new Set(dates.map(getWeek))].sort();
    if (weeks.length === 0) return { current: 0, longest: 0, lastDate: null };

    // Count consecutive weeks — walk backwards from most recent week
    let current = 1;
    let longest = 1;
    let streak = 1;
    let currentFound = false;

    for (let i = weeks.length - 1; i > 0; i--) {
      const [y1, w1] = weeks[i].split("-W").map(Number);
      const [y2, w2] = weeks[i - 1].split("-W").map(Number);
      const consecutive = (y1 === y2 && w1 - w2 === 1) || (y1 === y2 + 1 && w2 >= 52 && w1 === 1);

      if (consecutive) {
        streak++;
      } else {
        // First break from the end = current streak is locked in
        if (!currentFound) {
          current = streak;
          currentFound = true;
        }
        streak = 1;
      }
      longest = Math.max(longest, streak);
    }
    // If we never hit a break, current streak = entire run
    if (!currentFound) current = streak;
    longest = Math.max(longest, streak);

    const lastDate = getSASTDateKey(dates[dates.length - 1]);
    return { current, longest, lastDate };
  } catch {
    return { current: 0, longest: 0, lastDate: null };
  }
}

export function useStreaks(streakType = "booking") {
  const { user } = useAuth();
  const profileId = user?.profileId;

  // Start with computed local streak
  const localStreak = computeBookingStreak();
  const [streak, setStreak] = useState<Streak>({
    id: "local",
    streakType,
    currentStreak: localStreak.current,
    longestStreak: localStreak.longest,
    lastActivityDate: localStreak.lastDate,
  });

  // Try to fetch from Supabase (overrides local if available)
  useEffect(() => {
    if (!profileId) return;

    supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", profileId)
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
  }, [profileId, streakType]);

  const checkIn = useCallback(async () => {
    if (!profileId) return;
    const today = getSASTDateKey();
    if (streak.lastActivityDate === today) return;

    const newStreak = streak.currentStreak + 1;
    const newLongest = Math.max(newStreak, streak.longestStreak);
    setStreak(prev => ({ ...prev, currentStreak: newStreak, longestStreak: newLongest, lastActivityDate: today }));

    await supabase.from("user_streaks").upsert({
      user_id:            profileId,
      streak_type:        streakType,
      current_streak:     newStreak,
      longest_streak:     newLongest,
      last_activity_date: today,
    });
  }, [profileId, streak, streakType]);

  // Auto check-in when a booking is created
  useEffect(() => {
    const handler = () => checkIn();
    window.addEventListener("bion:booking-created", handler);
    return () => window.removeEventListener("bion:booking-created", handler);
  }, [checkIn]);

  return { streak, checkIn };
}
