import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HabitProfile {
  total_events: number;
  page_views: number;
  provider_views: number;
  bookings_started: number;
  bookings_completed: number;
  tool_uses: number;
  articles_read: number;
  top_categories: Array<{ category: string; count: number }>;
  peak_active_hours: number[];
  most_viewed_providers: Array<{ provider_id: string; count: number }>;
  last_active_at: string | null;
}

/**
 * Reads the user's aggregated habit profile. Hooks into the pre-computed
 * user_habit_profile row (refreshed every 10 events via DB trigger). Used by
 * B_ + the Home discovery feed to personalise the surface.
 */
export function useHabitProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<HabitProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.profileId || String(user.id).startsWith("demo_")) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_habit_profile")
        .select("*")
        .eq("profile_id", user.profileId)
        .maybeSingle();
      if (!alive) return;
      if (data) {
        setProfile(data as unknown as HabitProfile);
        // Cache peak_active_hours to localStorage so the reminder engine
        // (which runs synchronously and can't wait on Supabase) can gate
        // proactive nudges to the user's real active-hour window.
        try {
          const peak = (data as any).peak_active_hours;
          if (Array.isArray(peak)) localStorage.setItem("bion_peak_hours", JSON.stringify(peak));
          const cats = (data as any).top_categories;
          if (Array.isArray(cats)) localStorage.setItem("bion_top_categories", JSON.stringify(cats));
        } catch { /* no-op */ }
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user?.profileId]);

  return { profile, loading };
}

/** Convenience — the user's single most-engaged category (e.g. "medical", "fitness"). */
export function useTopCategory(): string | null {
  const { profile } = useHabitProfile();
  return profile?.top_categories?.[0]?.category ?? null;
}
