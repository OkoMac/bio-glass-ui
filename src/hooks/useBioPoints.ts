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
  const [balance, setBalance]   = useState(2450); // mock default
  const [history, setHistory]   = useState<BioPointsEntry[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    supabase
      .from("biopoints")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const entries: BioPointsEntry[] = data.map(r => ({
            id: r.id, points: r.points, reason: r.reason,
            sourceType: r.source_type, createdAt: r.created_at,
          }));
          setHistory(entries);
          setBalance(entries.reduce((sum, e) => sum + e.points, 0));
        }
        setLoading(false);
      });
  }, [user?.id]);

  const awardPoints = useCallback(async (points: number, reason: string, sourceType?: string) => {
    if (!user?.id) return;
    setBalance(prev => prev + points);
    await supabase.from("biopoints").insert({
      user_id: user.id,
      points,
      reason,
      source_type: sourceType ?? null,
    });
  }, [user?.id]);

  return { balance, history, loading, awardPoints };
}
