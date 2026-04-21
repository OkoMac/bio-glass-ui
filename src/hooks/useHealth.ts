import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Demo accounts use non-UUID IDs that Supabase rejects with 400. */
const isReal = (id?: string | null) => !!id && !id.startsWith("demo_");

export interface HealthLog {
  id: string;
  user_id: string;
  log_date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  lean_mass_kg: number | null;
  resting_hr: number | null;
  steps: number | null;
  sleep_hours: number | null;
  notes: string | null;
}

export interface HealthProfile {
  id?: string;
  user_id: string;
  date_of_birth: string | null;
  height_cm: number | null;
  blood_type: string | null;
  conditions: string[];
  allergies: string[];
  medications: Array<{ name: string; dose: string; frequency: string }>;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  insurance_provider: string | null;
  insurance_member_id: string | null;
  goals: string | null;
  notes: string | null;
}

/** Last N days of health logs for the current user. */
export function useHealthLogs(days = 30) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isReal(user?.profileId)) { setLoading(false); return; }
    setLoading(true);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data } = await supabase
      .from("health_logs")
      .select("*")
      .eq("user_id", user.profileId)
      .gte("log_date", since)
      .order("log_date", { ascending: true });
    setLogs((data ?? []) as HealthLog[]);
    setLoading(false);
  }, [user?.profileId, days]);

  useEffect(() => { refresh(); }, [refresh]);

  /** Upsert today's log entry — overwrites the row for today if it exists. */
  const logToday = useCallback(async (entry: Partial<Omit<HealthLog, "id" | "user_id" | "log_date">>) => {
    if (!user?.profileId) throw new Error("Not signed in");
    const today = new Date().toISOString().slice(0, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("health_logs") as any)
      .upsert(
        { user_id: user.profileId, log_date: today, ...entry },
        { onConflict: "user_id,log_date" }
      );
    if (error) throw error;
    await refresh();
  }, [user?.profileId, refresh]);

  return { logs, loading, logToday, refresh };
}

/** Single health profile row for the current user (conditions/allergies/etc). */
export function useHealthProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isReal(user?.profileId)) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("health_profiles")
      .select("*")
      .eq("user_id", user.profileId)
      .maybeSingle();
    if (data) {
      const d = data as HealthProfile & { conditions: unknown; allergies: unknown; medications: unknown };
      setProfile({
        ...d,
        conditions:  Array.isArray(d.conditions)  ? (d.conditions as string[])  : [],
        allergies:   Array.isArray(d.allergies)   ? (d.allergies as string[])   : [],
        medications: Array.isArray(d.medications) ? (d.medications as HealthProfile["medications"]) : [],
      });
    } else {
      // Default empty shape so forms can bind cleanly
      setProfile({
        user_id: user.profileId,
        date_of_birth: null, height_cm: null, blood_type: null,
        conditions: [], allergies: [], medications: [],
        emergency_contact_name: null, emergency_contact_phone: null,
        insurance_provider: null, insurance_member_id: null,
        goals: null, notes: null,
      });
    }
    setLoading(false);
  }, [user?.profileId]);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (patch: Partial<HealthProfile>) => {
    if (!user?.profileId) throw new Error("Not signed in");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("health_profiles") as any)
      .upsert(
        { user_id: user.profileId, ...patch, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (error) throw error;
    await refresh();
  }, [user?.profileId, refresh]);

  return { profile, loading, save, refresh };
}
