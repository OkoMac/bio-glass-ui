import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CorporateAnalytics {
  loading: boolean;
  // KPIs
  total_employees: number;
  total_budget: number;
  active_providers: number;
  mtd_spend: number;
  spend_30d: number;
  spend_90d: number;
  sessions_mtd: number;
  // Charts / lists
  spendBuckets: Array<{ label: string; value: number }>;
  topProviders: Array<{ id: string; name: string; specialty: string | null; vertical: string | null; sessions: number; spend: number }>;
  recentActivity: Array<{ id: string; emoji: string; text: string; time: string; vertical: string | null }>;
  byVertical: Array<{ label: string; pct: number; color: string }>;
}

const VERTICAL_COLOURS: Record<string, string> = {
  fitness: "#2DD4BF",
  medical: "#1E1B4B",
  beauty: "#F05A28",
  professional: "#334155",
  vet: "#059669",
  other: "#6B7280",
};

const VERTICAL_EMOJI: Record<string, string> = {
  fitness: "🏋️", medical: "🩺", beauty: "💅", professional: "🧠", vet: "🐾", other: "✨",
};

const empty: CorporateAnalytics = {
  loading: true,
  total_employees: 0, total_budget: 0, active_providers: 0,
  mtd_spend: 0, spend_30d: 0, spend_90d: 0, sessions_mtd: 0,
  spendBuckets: [], topProviders: [], recentActivity: [], byVertical: [],
};

export function useCorporateAnalytics(): CorporateAnalytics {
  const { user } = useAuth();
  const [data, setData] = useState<CorporateAnalytics>(empty);

  useEffect(() => {
    if (!user?.id) { setData(d => ({ ...d, loading: false })); return; }
    (async () => {
      setData(d => ({ ...d, loading: true }));

      const [
        { data: kpiRow },
        { data: bucketsRaw },
        { data: topRaw },
        { data: vertRaw },
        { data: activityRaw },
      ] = await Promise.all([
        supabase.from("corporate_analytics").select("*").eq("corporate_user_id", user.id).maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.rpc as any)("corporate_spend_buckets"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.rpc as any)("corporate_top_providers", { p_limit: 5 }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.rpc as any)("corporate_spend_by_vertical"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.rpc as any)("corporate_recent_activity", { p_limit: 8 }),
      ]);

      const kpi = (kpiRow ?? {}) as Partial<CorporateAnalytics>;

      const buckets = (bucketsRaw ?? []) as Array<{ label: string; spend: number }>;
      const totalVertSpend = (vertRaw ?? []).reduce((s: number, r: { spend: number }) => s + Number(r.spend ?? 0), 0);

      setData({
        loading: false,
        total_employees: Number(kpi.total_employees ?? 0),
        total_budget: Number(kpi.total_budget ?? 0),
        active_providers: Number(kpi.active_providers ?? 0),
        mtd_spend: Number(kpi.mtd_spend ?? 0),
        spend_30d: Number(kpi.spend_30d ?? 0),
        spend_90d: Number(kpi.spend_90d ?? 0),
        sessions_mtd: Number(kpi.sessions_mtd ?? 0),
        spendBuckets: buckets.map(b => ({ label: b.label, value: Number(b.spend) })),
        topProviders: (topRaw ?? []).map((r: { provider_id: string; provider_name: string; specialty: string | null; vertical: string | null; sessions: number; total_spend: number }) => ({
          id: r.provider_id,
          name: r.provider_name,
          specialty: r.specialty,
          vertical: r.vertical,
          sessions: r.sessions,
          spend: Number(r.total_spend),
        })),
        recentActivity: (activityRaw ?? []).map((r: { booking_id: string; employee_name: string; provider_name: string | null; service_title: string | null; amount_rand: number; booking_date: string; vertical: string | null }) => ({
          id: r.booking_id,
          emoji: VERTICAL_EMOJI[r.vertical ?? "other"] ?? "✨",
          text: `${r.employee_name} → ${r.provider_name ?? "Provider"} · ${r.service_title ?? "session"} (R${Number(r.amount_rand).toFixed(0)})`,
          time: new Date(r.booking_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
          vertical: r.vertical,
        })),
        byVertical: totalVertSpend > 0
          ? (vertRaw ?? []).map((r: { vertical: string; spend: number }) => ({
              label: (r.vertical ?? "other").charAt(0).toUpperCase() + (r.vertical ?? "other").slice(1),
              pct: Math.round((Number(r.spend) / totalVertSpend) * 100),
              color: VERTICAL_COLOURS[r.vertical ?? "other"] ?? VERTICAL_COLOURS.other,
            }))
          : [],
      });
    })();
  }, [user?.id]);

  return data;
}
