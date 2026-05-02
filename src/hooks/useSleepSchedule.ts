/**
 * useSleepSchedule — read + write the user's bedtime/wake schedule.
 *
 * Lee feedback 2026-05-01 ("more intuition, less effort"): the user sets
 * bedtime + wake-up ONCE (separately for weekday vs weekend). A backend
 * cron worker (added in v2) sends a push 30 min before bedtime and a
 * morning rating prompt at wake-up. This hook is the read/write surface
 * for the schedule itself.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SleepSchedule {
  enabled: boolean;
  weekday_bedtime: string;   // HH:MM
  weekday_wake: string;
  weekend_bedtime: string;
  weekend_wake: string;
  alarm_enabled: boolean;
  reminder_lead_min: number;
  channels: string[];        // 'push' | 'whatsapp'
}

const DEFAULT_SCHEDULE: SleepSchedule = {
  enabled: false,
  weekday_bedtime: "22:30",
  weekday_wake: "06:30",
  weekend_bedtime: "23:30",
  weekend_wake: "08:00",
  alarm_enabled: false,
  reminder_lead_min: 30,
  channels: ["push"],
};

export function useSleepSchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<SleepSchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.profileId || user.id?.startsWith("demo_")) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("sleep_schedules" as any)
        .select("*")
        .eq("user_id", user.profileId)
        .maybeSingle();
      if (data) setSchedule(data as unknown as SleepSchedule);
    } catch { /* table may not exist on stale envs — silent */ }
    setLoading(false);
  }, [user?.profileId, user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  /** Save the schedule (upsert). Optimistic local update; server-side
   *  is the source of truth. Throws on db error so the UI can show a toast. */
  const save = useCallback(async (next: Partial<SleepSchedule>) => {
    if (!user?.profileId || user.id?.startsWith("demo_")) {
      throw new Error("Sign in to save your sleep schedule");
    }
    const merged = { ...schedule, ...next };
    setSchedule(merged);
    const { error } = await supabase
      .from("sleep_schedules" as any)
      .upsert({ user_id: user.profileId, ...merged } as any, { onConflict: "user_id" });
    if (error) {
      // Rollback the optimistic update so UI reflects reality
      setSchedule(schedule);
      throw error;
    }
  }, [schedule, user?.profileId, user?.id]);

  return { schedule, loading, save, refresh };
}
