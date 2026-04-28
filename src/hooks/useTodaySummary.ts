import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Unified "what did I do today" rollup — one hook, four sources.
//
// Until this existed, each tracker wrote its own silo and the dashboard
// only showed water (because that was the one localStorage key that
// happened to be wired). Reported 2026-04-28 — the user logged sleep,
// food, exercise and saw nothing on Progress / Me beyond the water row.
//
// Sources:
//   • water         — localStorage flat key  bion_water_<YYYY-MM-DD>
//                      (cross-checked with water_log table for cross-device)
//   • food kcal     — food_entries WHERE date = today, summed
//   • sleep hours   — health_logs.sleep_hours WHERE log_date = today
//   • session min   — bion_routine_sessions in localStorage WHERE date = today

export interface TodaySummary {
  loading: boolean;
  water: { glasses: number; goal: number };
  food:  { kcal: number; entries: number };
  sleep: { hours: number; logged: boolean };
  sessions: { count: number; minutes: number };
}

const todayKey = () => new Date().toISOString().slice(0, 10);

export function useTodaySummary(): TodaySummary {
  const { user } = useAuth();
  const supabaseId = user?.profileId && !user.id?.startsWith("demo_") ? user.profileId : null;

  const [summary, setSummary] = useState<TodaySummary>(() => ({
    loading: true,
    water: localReadWater(),
    food: { kcal: 0, entries: 0 },
    sleep: { hours: 0, logged: false },
    sessions: localReadSessions(),
  }));

  useEffect(() => {
    let cancelled = false;
    const today = todayKey();

    (async () => {
      // Always read local first so the card paints fast even when offline.
      const localWater    = localReadWater();
      const localSessions = localReadSessions();
      const localFood     = localReadFood();

      if (!cancelled) {
        setSummary(s => ({ ...s, water: localWater, sessions: localSessions, food: localFood, loading: !!supabaseId }));
      }

      if (!supabaseId) { if (!cancelled) setSummary(s => ({ ...s, loading: false })); return; }

      try {
        // Three queries in parallel — small payloads, today only.
        const [foodRes, sleepRes, waterRes] = await Promise.all([
          supabase
            .from("food_entries" as any)
            .select("calories")
            .eq("user_id", supabaseId)
            .eq("date", today),
          supabase
            .from("health_logs")
            .select("sleep_hours")
            .eq("user_id", supabaseId)
            .eq("log_date", today)
            .maybeSingle(),
          supabase
            .from("water_log" as any)
            .select("count")
            .eq("user_id", supabaseId)
            .eq("date", today)
            .maybeSingle(),
        ]);

        const foodRows  = (foodRes.data ?? []) as Array<{ calories?: number }>;
        const foodKcal  = foodRows.reduce((s, r) => s + Number(r.calories ?? 0), 0);
        const sleepHours = Number((sleepRes.data as any)?.sleep_hours ?? 0);
        const dbWater   = Number((waterRes.data as any)?.count ?? 0);

        if (!cancelled) {
          setSummary(s => ({
            ...s,
            loading: false,
            food: { kcal: foodKcal, entries: foodRows.length },
            sleep: { hours: sleepHours, logged: sleepHours > 0 },
            // Cross-device: take the higher of local & DB.
            water: { glasses: Math.max(localWater.glasses, dbWater), goal: localWater.goal },
          }));
        }
      } catch {
        if (!cancelled) setSummary(s => ({ ...s, loading: false }));
      }
    })();

    return () => { cancelled = true; };
  }, [supabaseId]);

  return summary;
}

// ── localStorage readers (same shape as each tracker writes) ──

function localReadWater(): { glasses: number; goal: number } {
  try {
    const flat = parseInt(localStorage.getItem(`bion_water_${todayKey()}`) ?? "0") || 0;
    const struct = JSON.parse(localStorage.getItem("bion_water_tracker") ?? "{}");
    const day = struct?.[todayKey()];
    const glasses = Math.max(flat, Number(day?.glasses ?? 0));
    const goal = Number(day?.goal ?? 8);
    return { glasses, goal };
  } catch { return { glasses: 0, goal: 8 }; }
}

function localReadSessions(): { count: number; minutes: number } {
  try {
    const log = JSON.parse(localStorage.getItem("bion_routine_sessions") ?? "[]") as Array<any>;
    const today = todayKey();
    const todayRows = log.filter((r) => r?.date === today);
    const minutes = Math.round(todayRows.reduce((s, r) => s + Number(r?.durationSec ?? 0), 0) / 60);
    return { count: todayRows.length, minutes };
  } catch { return { count: 0, minutes: 0 }; }
}

function localReadFood(): { kcal: number; entries: number } {
  try {
    const entries = JSON.parse(localStorage.getItem("bion_food_tracker") ?? "[]") as Array<any>;
    const today = todayKey();
    const todays = entries.filter((e) => e?.date === today);
    const kcal = todays.reduce((s, e) => s + Number(e?.calories ?? 0), 0);
    return { kcal, entries: todays.length };
  } catch { return { kcal: 0, entries: 0 }; }
}
