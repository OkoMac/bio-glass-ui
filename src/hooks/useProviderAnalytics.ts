import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types exposed to callers ──────────────────────────────────────────────
export interface RevenueMonthPoint {
  month: string;       // ISO date string (first of month)
  label: string;       // "Jan", "Feb", …
  gross: number;       // rand
  net: number;         // rand (90% of gross)
  fee: number;         // rand (5% platform fee)
  completed: number;   // session count
}

export interface RetentionSummary {
  total: number;
  new: number;
  returning: number;
  pct: number;         // 0 – 100
}

export interface TopServiceRow {
  name: string;
  count: number;
  gross: number;
}

export interface RevenueTotals {
  mtdGross: number;
  mtdNet: number;
  last30dGross: number;
  ytdGross: number;
}

export interface ProviderAnalyticsResult {
  loading: boolean;
  revenueByMonth: RevenueMonthPoint[];
  retention: RetentionSummary;
  topServices: TopServiceRow[];
  totals: RevenueTotals;
}

// ─── Internal shapes returned by the three views ───────────────────────────
interface RevenueRow {
  provider_id: string;
  month: string;
  completed_count: number | null;
  gross_rand: number | null;
  net_payout_rand: number | null;
  platform_fee_rand: number | null;
}

interface RetentionRow {
  provider_id: string;
  total_clients_90d: number | null;
  new_clients_90d: number | null;
  returning_clients_90d: number | null;
  retention_pct: number | null;
}

interface TopServiceRow_DB {
  provider_id: string;
  service_id: string | null;
  service_name: string | null;
  booking_count: number | null;
  gross_rand: number | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const emptyResult = (): ProviderAnalyticsResult => ({
  loading: false,
  revenueByMonth: [],
  retention: { total: 0, new: 0, returning: 0, pct: 0 },
  topServices: [],
  totals: { mtdGross: 0, mtdNet: 0, last30dGross: 0, ytdGross: 0 },
});

function dev(msg: string, err: unknown) {
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[useProviderAnalytics] ${msg}`, err);
  }
}

function buildTwelveMonthSeries(rows: RevenueRow[]): RevenueMonthPoint[] {
  // Bucket DB rows by month-key for fast lookup
  const byMonth = new Map<string, RevenueRow>();
  for (const r of rows) {
    const key = r.month?.slice(0, 7); // "YYYY-MM"
    if (key) byMonth.set(key, r);
  }

  const out: RevenueMonthPoint[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = byMonth.get(key);
    out.push({
      month: `${key}-01`,
      label: MONTH_LABELS[d.getMonth()],
      gross: Number(row?.gross_rand ?? 0),
      net: Number(row?.net_payout_rand ?? 0),
      fee: Number(row?.platform_fee_rand ?? 0),
      completed: Number(row?.completed_count ?? 0),
    });
  }
  return out;
}

function computeTotals(series: RevenueMonthPoint[]): RevenueTotals {
  if (series.length === 0) return { mtdGross: 0, mtdNet: 0, last30dGross: 0, ytdGross: 0 };

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonthKey = `${thisYear}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const mtd = series.find(s => s.month === thisMonthKey);
  const mtdGross = mtd?.gross ?? 0;
  const mtdNet = mtd?.net ?? 0;

  // YTD = sum of all months in current calendar year that are in the 12-month window
  const ytdGross = series
    .filter(s => s.month.startsWith(`${thisYear}-`))
    .reduce((sum, s) => sum + s.gross, 0);

  // last30dGross ≈ current month's gross (finer granularity isn't available at
  // the monthly-view level). This is a reasonable approximation for a KPI tile
  // and matches how providers intuitively read "this month's revenue".
  const last30dGross = mtdGross;

  return { mtdGross, mtdNet, last30dGross, ytdGross };
}

// ───────────────────────────────────────────────────────────────────────────
export function useProviderAnalytics(): ProviderAnalyticsResult {
  const { user } = useAuth();
  const [result, setResult] = useState<ProviderAnalyticsResult>({
    ...emptyResult(),
    loading: true,
  });

  useEffect(() => {
    const providerId = user?.profileId;
    if (!providerId) {
      setResult({ ...emptyResult(), loading: false });
      return;
    }

    let cancelled = false;
    (async () => {
      setResult(r => ({ ...r, loading: true }));

      // Run the three view queries in parallel. If any view is missing
      // (migration not yet applied) we fall back to empty data for that slice
      // — the page still renders.
      const [revRes, retRes, topRes] = await Promise.all([
        // provider_revenue_monthly
        (async () => {
          try {
            const r = await (supabase as any)
              .from("provider_revenue_monthly")
              .select("*")
              .eq("provider_id", providerId)
              .order("month", { ascending: true });
            if (r.error) throw r.error;
            return r.data as RevenueRow[];
          } catch (err) {
            dev("provider_revenue_monthly unavailable — returning empty series", err);
            return [] as RevenueRow[];
          }
        })(),
        // provider_client_retention
        (async () => {
          try {
            const r = await (supabase as any)
              .from("provider_client_retention")
              .select("*")
              .eq("provider_id", providerId)
              .maybeSingle();
            if (r.error) throw r.error;
            return (r.data ?? null) as RetentionRow | null;
          } catch (err) {
            dev("provider_client_retention unavailable — returning zeros", err);
            return null;
          }
        })(),
        // provider_top_services
        (async () => {
          try {
            const r = await (supabase as any)
              .from("provider_top_services")
              .select("*")
              .eq("provider_id", providerId)
              .order("gross_rand", { ascending: false })
              .limit(5);
            if (r.error) throw r.error;
            return r.data as TopServiceRow_DB[];
          } catch (err) {
            dev("provider_top_services unavailable — returning empty list", err);
            return [] as TopServiceRow_DB[];
          }
        })(),
      ]);

      if (cancelled) return;

      const revenueByMonth = buildTwelveMonthSeries(revRes ?? []);
      const totals = computeTotals(revenueByMonth);

      const retention: RetentionSummary = {
        total: Number(retRes?.total_clients_90d ?? 0),
        new: Number(retRes?.new_clients_90d ?? 0),
        returning: Number(retRes?.returning_clients_90d ?? 0),
        pct: Number(retRes?.retention_pct ?? 0),
      };

      const topServices: TopServiceRow[] = (topRes ?? []).map(s => ({
        name: s.service_name ?? "Unnamed service",
        count: Number(s.booking_count ?? 0),
        gross: Number(s.gross_rand ?? 0),
      }));

      setResult({ loading: false, revenueByMonth, retention, topServices, totals });
    })();

    return () => { cancelled = true; };
  }, [user?.profileId]);

  return result;
}
