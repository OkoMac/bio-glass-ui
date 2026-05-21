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
  // 2026-05-21 Phase 3: real metrics from the wallet ledger
  utilization_pct: number;
  wallet_balance: number;
  active_employees: number;
  spendByDepartment: Array<{ department: string; spend: number; sessions: number; employees: number }>;
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
  utilization_pct: 0, wallet_balance: 0, active_employees: 0,
  spendByDepartment: [],
  spendBuckets: [], topProviders: [], recentActivity: [], byVertical: [],
};

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface ReportsData {
  mtd_spend_rand: number;
  mtd_sessions: number;
  total_employees: number;
  active_employees: number;
  total_budget_rand: number;
  utilization_pct: number;
  wallet_balance_rand: number;
  top_providers: Array<{ id: string; name: string; sessions: number; spend_rand: number }>;
  recent_activity: Array<{ booking_id: string; employee_name: string; provider_name: string; amount_rand: number; booking_date: string }>;
  spend_by_department: Array<{ department: string; spend_rand: number; sessions: number; employees: number }>;
}

async function fetchReports(): Promise<ReportsData | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    const r = await fetch(`${API}/api/corporate/reports`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!r.ok) return null;
    const j = await r.json().catch(() => ({}));
    return j?.ok && j.data ? (j.data as ReportsData) : null;
  } catch { return null; }
}

export function useCorporateAnalytics(): CorporateAnalytics {
  const { user } = useAuth();
  const [data, setData] = useState<CorporateAnalytics>(empty);

  useEffect(() => {
    if (!user?.id && !user?.profileId) { setData(d => ({ ...d, loading: false })); return; }
    (async () => {
      setData(d => ({ ...d, loading: true }));

      const [
        { data: kpiRow },
        { data: bucketsRaw },
        { data: topRaw },
        { data: vertRaw },
        { data: activityRaw },
        reports,
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
        // 2026-05-21 Phase 3: real metrics from the wallet ledger.
        // Falls back to the legacy RPC data above when /reports returns
        // null (corporate hasn't had any wallet activity yet).
        fetchReports(),
      ]);

      const kpi = (kpiRow ?? {}) as Partial<CorporateAnalytics>;

      const buckets = (bucketsRaw ?? []) as Array<{ label: string; spend: number }>;
      const totalVertSpend = (vertRaw ?? []).reduce((s: number, r: { spend: number }) => s + Number(r.spend ?? 0), 0);

      // RPC-derived data (legacy paths); reports-derived data overrides
      // when present (real wallet ledger > stale corporate_analytics view).
      const rpcTopProviders = (topRaw ?? []).map((r: { provider_id: string; provider_name: string; specialty: string | null; vertical: string | null; sessions: number; total_spend: number }) => ({
        id: r.provider_id,
        name: r.provider_name,
        specialty: r.specialty,
        vertical: r.vertical,
        sessions: r.sessions,
        spend: Number(r.total_spend),
      }));
      const rpcRecent = (activityRaw ?? []).map((r: { booking_id: string; employee_name: string; provider_name: string | null; service_title: string | null; amount_rand: number; booking_date: string; vertical: string | null }) => ({
        id: r.booking_id,
        emoji: VERTICAL_EMOJI[r.vertical ?? "other"] ?? "✨",
        text: `${r.employee_name} → ${r.provider_name ?? "Provider"} · ${r.service_title ?? "session"} (R${Number(r.amount_rand).toFixed(0)})`,
        time: new Date(r.booking_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
        vertical: r.vertical,
      }));

      // Prefer reports data when it has rows; fall back to RPC.
      const topProviders = (reports?.top_providers?.length ?? 0) > 0
        ? reports!.top_providers.map(p => ({
            id: p.id, name: p.name, specialty: null, vertical: null,
            sessions: p.sessions, spend: Number(p.spend_rand),
          }))
        : rpcTopProviders;

      const recentActivity = (reports?.recent_activity?.length ?? 0) > 0
        ? reports!.recent_activity.map(a => ({
            id: a.booking_id,
            emoji: "✨",
            text: `${a.employee_name} → ${a.provider_name} (R${Number(a.amount_rand).toFixed(0)})`,
            time: new Date(a.booking_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
            vertical: null,
          }))
        : rpcRecent;

      setData({
        loading: false,
        // Reports endpoint is authoritative when present (real wallet
        // data from corporate_wallet_transactions). RPC kpis are legacy.
        total_employees: Number(reports?.total_employees ?? kpi.total_employees ?? 0),
        total_budget:    Number(reports?.total_budget_rand ?? kpi.total_budget ?? 0),
        active_providers: Number(kpi.active_providers ?? 0),
        mtd_spend:       Number(reports?.mtd_spend_rand ?? kpi.mtd_spend ?? 0),
        spend_30d:       Number(kpi.spend_30d ?? 0),
        spend_90d:       Number(kpi.spend_90d ?? 0),
        sessions_mtd:    Number(reports?.mtd_sessions ?? kpi.sessions_mtd ?? 0),
        utilization_pct: Number(reports?.utilization_pct ?? 0),
        wallet_balance:  Number(reports?.wallet_balance_rand ?? 0),
        active_employees: Number(reports?.active_employees ?? 0),
        spendByDepartment: (reports?.spend_by_department ?? []).map(d => ({
          department: d.department,
          spend:      Number(d.spend_rand),
          sessions:   Number(d.sessions),
          employees:  Number(d.employees),
        })),
        spendBuckets: buckets.map(b => ({ label: b.label, value: Number(b.spend) })),
        topProviders,
        recentActivity,
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
