import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ExerciseRow {
  id?: string;
  name: string;
  sets?: string | null;
  duration?: string | null;
  notes?: string | null;
}

export interface AssignedProgram {
  id: string;
  title: string;
  type: "workout" | "meal" | "rehab" | "skincare" | "medication" | "wellness" | "beauty";
  provider_id: string | null;
  provider_name: string | null;
  provider_avatar: string | null;
  vertical: "teal" | "indigo" | "coral" | "amber";
  total_days: number;
  days_completed: number;
  schedule: string | null;
  exercises: ExerciseRow[];
}

interface ClientProgramRow {
  id: string;
  client_id: string;
  program_id: string;
  days_completed: number | null;
  program?: {
    id: string;
    title: string;
    type: string;
    total_days: number;
    schedule: string | null;
    provider_id: string;
    exercises?: Array<{ name: string; sets?: string; duration?: string; notes?: string }>;
  };
}

const TYPE_TO_VERTICAL: Record<string, "teal" | "indigo" | "coral" | "amber"> = {
  workout: "teal", rehab: "indigo", medication: "indigo",
  skincare: "coral", beauty: "coral",
  meal: "amber", wellness: "amber",
};

/** Programs assigned to the current user by their providers. */
export function useMyPrograms() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<AssignedProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data: assigns } = await supabase
        .from("client_programs")
        .select("id, client_id, program_id, days_completed, program:programs(id,title,type,total_days,schedule,provider_id,exercises:program_exercises(name,sets,duration,notes))")
        .eq("client_id", user.profileId);

      const rows = (assigns ?? []) as unknown as ClientProgramRow[];
      if (rows.length === 0) { setPrograms([]); setLoading(false); return; }

      // Fetch provider names in one go
      const providerIds = [...new Set(rows.map(r => r.program?.provider_id).filter(Boolean) as string[])];
      const { data: providers } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", providerIds);
      const providerMap = new Map(
        (providers ?? []).map(p => [p.id as string, { name: p.full_name as string, avatar: p.avatar_url as string | null }])
      );

      setPrograms(rows.map((r): AssignedProgram => {
        const p = r.program;
        const prov = p?.provider_id ? providerMap.get(p.provider_id as string) : null;
        const t = (p?.type ?? "workout") as AssignedProgram["type"];
        return {
          id: r.id,
          title: p?.title ?? "Untitled programme",
          type: t,
          provider_id: p?.provider_id ?? null,
          provider_name: (prov as any)?.name ?? null,
          provider_avatar: (prov as any)?.avatar ?? null,
          vertical: TYPE_TO_VERTICAL[t] ?? "teal",
          total_days: p?.total_days ?? 14,
          days_completed: r.days_completed ?? 0,
          schedule: p?.schedule ?? null,
          exercises: (p?.exercises ?? []).map(e => ({
            name: e.name, sets: e.sets ?? null, duration: e.duration ?? null, notes: e.notes ?? null,
          })),
        };
      }));
      setLoading(false);
    })();
  }, [user?.profileId]);

  return { programs, loading };
}
