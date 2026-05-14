import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BioPointsEntry {
  id: string;
  points: number;
  reason: string;
  sourceType: string | null;
  createdAt: string;
}

export function useBioPoints() {
  const { user } = useAuth();
  // bionpoints.user_id references profiles.id — use profileId, not auth user id
  const profileId = user?.profileId;
  // Start at 0 — the previous 2450 "demo default" was being shown on /profile
  // even for brand-new users, creating a mismatch with /wallet which reads
  // the real balance via useActivityPoints.
  const [balance, setBalance]   = useState(0);
  const [history, setHistory]   = useState<BioPointsEntry[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);

    supabase
      .from("bionpoints")
      .select("*")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false })
      .then(({ data, error }: any /* TODO(types) */) => {
        if (!error && data) {
          const entries: BioPointsEntry[] = data.map((r: any /* TODO(types) */) => ({
            id: r.id, points: r.points, reason: r.reason,
            sourceType: r.source_type, createdAt: r.created_at,
          }));
          setHistory(entries);
          setBalance(entries.reduce((sum, e) => sum + e.points, 0));
        }
        setLoading(false);
      });
  }, [profileId]);

  const awardPoints = useCallback(async (points: number, reason: string, sourceType?: string) => {
    if (!profileId) return;
    setBalance(prev => prev + points);
    await supabase.from("bionpoints").insert({
      user_id: profileId,
      points,
      reason,
      source_type: sourceType ?? null,
    });
  }, [profileId]);

  return { balance, history, loading, awardPoints };
}
