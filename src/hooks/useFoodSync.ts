import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  time: string;
  photo?: string;
  date: string;
}

interface DailyGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

const FOOD_KEY = "bion_food_tracker";
const GOALS_KEY = "bion_food_goals";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Syncs food entries and goals between localStorage and Supabase.
 */
export function useFoodSync() {
  const { user } = useAuth();
  const supabaseId = user?.profileId && !user.id?.startsWith("demo_") ? user.profileId : null;

  const [entries, setEntries] = useState<FoodEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(FOOD_KEY) ?? "[]"); }
    catch { return []; }
  });

  const [goals, setGoals] = useState<DailyGoal>(() => {
    try { return JSON.parse(localStorage.getItem(GOALS_KEY) ?? "null") ?? { calories: 2000, protein: 120, carbs: 250, fat: 65, water: 8 }; }
    catch { return { calories: 2000, protein: 120, carbs: 250, fat: 65, water: 8 }; }
  });

  const [loading, setLoading] = useState(true);

  // Pre-aggregated history rollups, populated from food_entries_monthly /
  // _yearly views (bion-food-history-rollups-2026-04-28.sql). Empty arrays
  // until first load completes; UI tolerates that.
  const [monthly, setMonthly] = useState<Array<{ month_start: string; total_calories: number; total_protein: number; total_carbs: number; total_fat: number; entry_count: number; days_logged: number }>>([]);
  const [yearly,  setYearly]  = useState<Array<{ year_start: string;  total_calories: number; total_protein: number; total_carbs: number; total_fat: number; entry_count: number; days_logged: number }>>([]);

  // Load from Supabase
  useEffect(() => {
    if (!supabaseId) { setLoading(false); return; }
    const load = async () => {
      try {
        // Load the last 30 days of food entries so the history view has
        // something to show. Capped to bound payload — older data lives
        // in localStorage if the user wants further back on this device.
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const { data } = await supabase
          .from("food_entries" as any)
          .select("*")
          .eq("user_id", supabaseId)
          .gte("date", cutoff)
          .order("created_at", { ascending: true });

        if (data && data.length > 0) {
          const mapped: FoodEntry[] = (data as any[]).map(e => ({
            id: e.id,
            name: e.name,
            calories: e.calories,
            protein: e.protein,
            carbs: e.carbs,
            fat: e.fat,
            meal: e.meal,
            time: e.time ?? "",
            photo: e.photo_url,
            date: e.date,
          }));
          setEntries(mapped);
          localStorage.setItem(FOOD_KEY, JSON.stringify(mapped));
        }

        // Load monthly + yearly rollups in parallel — pre-aggregated views,
        // bounded payload (12 months ≈ 12 rows; years even smaller).
        Promise.all([
          supabase.from("food_entries_monthly" as any)
            .select("*").eq("user_id", supabaseId)
            .order("month_start", { ascending: false }),
          supabase.from("food_entries_yearly" as any)
            .select("*").eq("user_id", supabaseId)
            .order("year_start", { ascending: false }),
        ]).then(([m, y]) => {
          setMonthly((m.data ?? []) as any);
          setYearly((y.data ?? []) as any);
        }).catch(() => { /* views may not exist on stale envs — silent */ });

        // Load goals
        const { data: goalsData } = await supabase
          .from("daily_goals" as any)
          .select("*")
          .eq("user_id", supabaseId)
          .single();

        if (goalsData) {
          const g: DailyGoal = {
            calories: (goalsData as any).calories,
            protein: (goalsData as any).protein,
            carbs: (goalsData as any).carbs,
            fat: (goalsData as any).fat,
            water: (goalsData as any).water,
          };
          setGoals(g);
          localStorage.setItem(GOALS_KEY, JSON.stringify(g));
        }
      } catch { /* localStorage fallback */ }
      setLoading(false);
    };
    load();
  }, [supabaseId]);

  const addEntry = useCallback((entry: FoodEntry) => {
    const updated = [...entries, entry];
    setEntries(updated);
    localStorage.setItem(FOOD_KEY, JSON.stringify(updated));

    if (supabaseId) {
      supabase.from("food_entries" as any).insert({
        id: entry.id,
        user_id: supabaseId,
        name: entry.name,
        calories: entry.calories,
        protein: entry.protein ?? 0,
        carbs: entry.carbs ?? 0,
        fat: entry.fat ?? 0,
        meal: entry.meal,
        time: entry.time,
        photo_url: entry.photo,
        date: entry.date,
      } as any).then(({ error }) => {
        if (error && import.meta.env.DEV) console.warn("[food] insert failed:", error.message);
      });
    }
  }, [entries, supabaseId]);

  const deleteEntry = useCallback((id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem(FOOD_KEY, JSON.stringify(updated));

    if (supabaseId) {
      supabase.from("food_entries" as any).delete().eq("id", id).then(({ error }) => {
        if (error && import.meta.env.DEV) console.warn("[food] delete failed:", error.message);
      });
    }
  }, [entries, supabaseId]);

  const saveGoals = useCallback((g: DailyGoal) => {
    setGoals(g);
    localStorage.setItem(GOALS_KEY, JSON.stringify(g));

    if (supabaseId) {
      supabase.from("daily_goals" as any).upsert({
        user_id: supabaseId,
        ...g,
      } as any, { onConflict: "user_id" }).then(({ error }) => {
        if (error && import.meta.env.DEV) console.warn("[food] goals save failed:", error.message);
      });
    }
  }, [supabaseId]);

  const todayEntries = entries.filter(e => e.date === getToday());

  return { entries, todayEntries, monthly, yearly, goals, addEntry, deleteEntry, saveGoals, loading };
}
