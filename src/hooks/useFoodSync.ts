import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVisibilityRefetch } from "./useVisibilityRefetch.js";
import { useAuth } from "@/contexts/AuthContext";
import { getSASTDateKey } from "../utils/sastDate";
import { toast } from "sonner";

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
// Mistake 18 (2026-04-29): real iPhone user (investable123@gmail.com,
// ticket #10) hit `QuotaExceededError` writing to localStorage on
// /food-tracker. Cause: every entry's `photo` field was a base64 data
// URL (50-500KB each), inlined into the JSON we wrote on every change.
// 30 logged meals with photos × 200KB ≈ 6MB → past Safari's quota.
//
// Fix: sanitise before write — drop dataURL photos and trim to last
// 60 days. The DB still has full data including photo_url (the server
// URL, not the base64). Memory state keeps the photo for the current
// view; only the persisted copy is slimmed.
const PERSIST_DAYS = 60;
function sanitiseForStorage(entries: FoodEntry[]): FoodEntry[] {
  const cutoff = new Date(Date.now() - PERSIST_DAYS * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
  return entries
    .filter(e => !e.date || e.date >= cutoff)
    .map(e => {
      // Strip base64 data URLs; keep external/server URLs (smaller).
      const photo = e.photo && !e.photo.startsWith("data:") ? e.photo : undefined;
      return { ...e, photo };
    });
}
function safeSetEntries(entries: FoodEntry[]): void {
  const slim = sanitiseForStorage(entries);
  try {
    localStorage.setItem(FOOD_KEY, JSON.stringify(slim));
  } catch (err: any) {
    if (err?.name === "QuotaExceededError") {
      // Last-ditch: drop to last 14 days, no photos
      const minimal = slim.slice(-50).map(e => ({ ...e, photo: undefined }));
      try {
        localStorage.setItem(FOOD_KEY, JSON.stringify(minimal));
        console.warn("[food] localStorage trimmed to last 50 entries due to quota");
      } catch {
        console.error("[food] localStorage write still failing after trim — dropping cache");
        try { localStorage.removeItem(FOOD_KEY); } catch { /* */ }
      }
    } else {
      console.error("[food] localStorage write failed:", err?.message);
    }
  }
}

function getToday(): string {
  return getSASTDateKey();
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

  // Load from Supabase. Extracted so we can also call it on visibilitychange
  // (Lee bug 2026-05-01: PWA + Safari instances don't update each other).
  const loadFromServer = useCallback(async () => {
    if (!supabaseId) { setLoading(false); return; }
    try {
      // Load the last 30 days of food entries so the history view has
      // something to show. Capped to bound payload — older data lives
      // in localStorage if the user wants further back on this device.
    const cutoff = getSASTDateKey(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
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
        safeSetEntries(mapped);
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
  }, [supabaseId]);

  // Initial load on mount + when supabaseId resolves
  useEffect(() => { loadFromServer(); }, [loadFromServer]);

  // Refetch when tab returns to visibility — closes the PWA/browser desync
  useVisibilityRefetch(() => { loadFromServer(); }, [supabaseId]);

  const addEntry = useCallback((entry: FoodEntry) => {
    const updated = [...entries, entry];
    setEntries(updated);
    safeSetEntries(updated);

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
      } as any).then(({ error }: any) => {
        if (error) {
          // Loud both ways — console for diagnosis, toast so the user knows
          // their meal didn't reach the server (reported "no history on food
          // logging" Lee Grant 2026-05-14).
          console.error("[food] insert failed:", {
            code: error.code, message: error.message,
            details: error.details, hint: error.hint,
          });
          toast.error(`Couldn't save meal: ${error.message}`, { duration: 5000 });
        }
      });
    }
  }, [entries, supabaseId]);

  const deleteEntry = useCallback((id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    safeSetEntries(updated);

    if (supabaseId) {
      supabase.from("food_entries" as any).delete().eq("id", id).then(({ error }: any) => {
        if (error) {
          console.error("[food] delete failed:", { code: error.code, message: error.message });
          toast.error(`Couldn't delete meal: ${error.message}`, { duration: 5000 });
        }
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
      } as any, { onConflict: "user_id" }).then(({ error }: any) => {
        if (error) {
          console.error("[food] goals save failed:", { code: error.code, message: error.message });
          toast.error(`Couldn't save goals: ${error.message}`, { duration: 5000 });
        }
      });
    }
  }, [supabaseId]);

  const todayEntries = entries.filter(e => e.date === getToday());

  return { entries, todayEntries, monthly, yearly, goals, addEntry, deleteEntry, saveGoals, loading };
}
