import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ChallengeCategory = "fitness" | "mindfulness" | "nutrition" | "consistency" | "social";
export type ChallengeDifficulty = "easy" | "medium" | "hard";

export interface ChallengeRow {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  badge: string;
  reward_text: string;
  reward_points: number;
  days_total: number;
  starts_at: string;
  ends_at: string | null;
  created_by_id: string | null;
  created_by_label: string;
  location: string | null;
  tasks: Array<{ label: string }>;
  participant_count: number;
}

export interface ParticipationRow {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  completed_at: string | null;
  task_progress: boolean[];
}

/** Public challenge feed + user's own participation per challenge. */
export function useChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [participation, setParticipation] = useState<Record<string, ParticipationRow>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: cs } = await supabase
      .from("challenges")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    setChallenges(((cs ?? []) as Array<ChallengeRow & { tasks: unknown }>).map(c => ({
      ...c,
      tasks: Array.isArray(c.tasks) ? (c.tasks as Array<{ label: string }>) : [],
    })));

    if (user?.profileId) {
      const { data: ps } = await supabase
        .from("challenge_participants")
        .select("*")
        .eq("user_id", user.profileId);
      const map: Record<string, ParticipationRow> = {};
      (ps ?? []).forEach((p: unknown) => {
        const row = p as ParticipationRow & { task_progress: unknown };
        map[row.challenge_id] = {
          ...row,
          task_progress: Array.isArray(row.task_progress) ? (row.task_progress as boolean[]) : [],
        };
      });
      setParticipation(map);
    }
    setLoading(false);
  }, [user?.profileId]);

  useEffect(() => { refresh(); }, [refresh]);

  const join = useCallback(async (challengeId: string) => {
    if (!user?.profileId) throw new Error("Not signed in");
    const c = challenges.find(c => c.id === challengeId);
    const initialProgress = (c?.tasks ?? []).map(() => false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("challenge_participants") as any)
      .insert({ challenge_id: challengeId, user_id: user.profileId, task_progress: initialProgress });
    if (error && error.code !== "23505") throw error;  // ignore unique conflict
    await refresh();
  }, [user?.profileId, challenges, refresh]);

  const updateTaskProgress = useCallback(async (challengeId: string, idx: number, done: boolean) => {
    if (!user?.profileId) throw new Error("Not signed in");
    const part = participation[challengeId];
    if (!part) return;
    const next = [...part.task_progress];
    next[idx] = done;
    const allDone = next.length > 0 && next.every(Boolean);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("challenge_participants") as any)
      .update({
        task_progress: next,
        completed_at: allDone ? new Date().toISOString() : null,
      })
      .eq("id", part.id);
    if (error) throw error;
    await refresh();
    return allDone;
  }, [user?.profileId, participation, refresh]);

  return { challenges, participation, loading, join, updateTaskProgress, refresh };
}
