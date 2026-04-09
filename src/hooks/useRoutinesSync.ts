import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Exercise {
  name: string;
  sets: string;
  done: boolean;
}

interface Routine {
  id: string;
  title: string;
  type: string;
  provider?: string;
  providerId?: string;
  providerImage?: string;
  vertical: string;
  daysCompleted: number;
  totalDays: number;
  exercises: Exercise[];
  createdBy: "self" | "provider";
  sharedWith: string[];
  schedule?: string;
}

const LOCAL_KEY = "bion_routines";

/**
 * Syncs routines between localStorage (offline) and Supabase (persistent).
 * On mount: loads from Supabase if authenticated, falls back to localStorage.
 * On update: writes to both localStorage and Supabase.
 */
export function useRoutinesSync() {
  const { user } = useAuth();
  const supabaseId = user?.id && !user.id.startsWith("demo_") ? user.id : null;

  const [routines, setRoutines] = useState<Routine[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    if (!supabaseId) { setLoading(false); return; }

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("routines" as any)
          .select("*")
          .eq("user_id", supabaseId)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Routine[] = (data as any[]).map(r => ({
            id: r.id,
            title: r.title,
            type: r.type,
            provider: r.provider_name,
            providerId: r.provider_id,
            vertical: r.vertical,
            daysCompleted: r.days_completed,
            totalDays: r.total_days,
            exercises: r.exercises ?? [],
            createdBy: r.created_by,
            sharedWith: r.shared_with ?? [],
            schedule: r.schedule,
          }));
          setRoutines(mapped);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(mapped));
        }
      } catch { /* use localStorage fallback */ }
      setLoading(false);
    };
    load();
  }, [supabaseId]);

  // Save to both localStorage and Supabase
  const saveRoutines = useCallback((updated: Routine[]) => {
    setRoutines(updated);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));

    if (!supabaseId) return;

    // Async upsert to Supabase (fire and forget)
    for (const r of updated) {
      supabase.from("routines" as any).upsert({
        id: r.id,
        user_id: supabaseId,
        title: r.title,
        type: r.type,
        vertical: r.vertical,
        days_completed: r.daysCompleted,
        total_days: r.totalDays,
        exercises: r.exercises,
        created_by: r.createdBy,
        provider_id: r.providerId || null,
        provider_name: r.provider || null,
        shared_with: r.sharedWith,
        schedule: r.schedule,
      } as any, { onConflict: "id" }).then(() => {});
    }
  }, [supabaseId]);

  const addRoutine = useCallback((routine: Routine) => {
    saveRoutines([routine, ...routines]);
  }, [routines, saveRoutines]);

  const deleteRoutine = useCallback((id: string) => {
    const updated = routines.filter(r => r.id !== id);
    saveRoutines(updated);
    if (supabaseId) {
      supabase.from("routines" as any).delete().eq("id", id).then(() => {});
    }
  }, [routines, saveRoutines, supabaseId]);

  return { routines, setRoutines: saveRoutines, addRoutine, deleteRoutine, loading };
}
