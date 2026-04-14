import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Period = "Week" | "Month" | "Quarter";

interface BookingRow {
  id: string;
  client_id: string;
  total_price: number | null;
  booking_date: string;
  status: string;
  service_id: string | null;
}

interface ServiceCount {
  service_id: string;
  title: string;
  count: number;
  revenue: number;
}

interface AnalyticsResult {
  loading: boolean;
  // KPIs (current period)
  revenue: number;
  bookings: number;
  uniqueClients: number;
  avgPrice: number;
  // Trend % vs previous period (e.g. +12 means +12% growth)
  revenueTrend: number;
  bookingsTrend: number;
  clientsTrend: number;
  // Time-bucketed series for chart (length matches period buckets)
  series: number[];
  // Bookings split by status
  noShowRate: number;
  cancellationRate: number;
  // Churn: clients with no booking in last 60 days who had one before
  atRiskClientCount: number;
  topServices: ServiceCount[];
}

const PERIOD_DAYS: Record<Period, number> = { Week: 7, Month: 30, Quarter: 90 };
const PERIOD_BUCKETS: Record<Period, number> = { Week: 7, Month: 7, Quarter: 3 };

function bucketise(rows: BookingRow[], period: Period, end: Date): number[] {
  const days = PERIOD_DAYS[period];
  const buckets = PERIOD_BUCKETS[period];
  const bucketDays = days / buckets;
  const out = Array(buckets).fill(0);
  for (const r of rows) {
    if (r.status !== "completed" || !r.total_price) continue;
    const d = new Date(r.booking_date);
    const daysAgo = (end.getTime() - d.getTime()) / 86400000;
    if (daysAgo < 0 || daysAgo > days) continue;
    const idx = Math.min(buckets - 1, Math.max(0, Math.floor((days - daysAgo) / bucketDays)));
    out[idx] += Number(r.total_price);
  }
  return out;
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export function useProviderAnalytics(period: Period): AnalyticsResult {
  const { user } = useAuth();
  const [result, setResult] = useState<AnalyticsResult>({
    loading: true, revenue: 0, bookings: 0, uniqueClients: 0, avgPrice: 0,
    revenueTrend: 0, bookingsTrend: 0, clientsTrend: 0,
    series: Array(PERIOD_BUCKETS[period]).fill(0),
    noShowRate: 0, cancellationRate: 0, atRiskClientCount: 0, topServices: [],
  });

  useEffect(() => {
    if (!user?.profileId) { setResult(r => ({ ...r, loading: false })); return; }
    (async () => {
      setResult(r => ({ ...r, loading: true }));
      const days = PERIOD_DAYS[period];
      const now = new Date();
      const periodStart = new Date(now.getTime() - days * 86400000);
      const prevPeriodStart = new Date(now.getTime() - days * 2 * 86400000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

      // Pull last 2 periods worth of bookings for trend calc + churn detection
      const lookback = new Date(now.getTime() - Math.max(180, days * 2) * 86400000);
      const { data: rawRows } = await supabase
        .from("bookings")
        .select("id, client_id, total_price, booking_date, status, service_id")
        .eq("provider_id", user.profileId)
        .gte("booking_date", lookback.toISOString().slice(0, 10))
        .order("booking_date", { ascending: false });

      const rows = (rawRows ?? []) as BookingRow[];
      const inWindow = (r: BookingRow, start: Date, end: Date) => {
        const d = new Date(r.booking_date);
        return d >= start && d <= end;
      };

      const curr = rows.filter(r => inWindow(r, periodStart, now));
      const prev = rows.filter(r => inWindow(r, prevPeriodStart, periodStart));

      const completedCurr = curr.filter(r => r.status === "completed");
      const completedPrev = prev.filter(r => r.status === "completed");

      const revenueCurr = completedCurr.reduce((s, r) => s + Number(r.total_price ?? 0), 0);
      const revenuePrev = completedPrev.reduce((s, r) => s + Number(r.total_price ?? 0), 0);

      const clientsCurr = new Set(curr.map(r => r.client_id)).size;
      const clientsPrev = new Set(prev.map(r => r.client_id)).size;

      const noShowCount = curr.filter(r => r.status === "no_show").length;
      const cancelCount = curr.filter(r => r.status === "cancelled").length;
      const totalCurr   = curr.length || 1;

      // Churn: clients who booked >60 days ago AND have no booking in last 60 days
      const allClientLastBooking = new Map<string, Date>();
      for (const r of rows) {
        const d = new Date(r.booking_date);
        const existing = allClientLastBooking.get(r.client_id);
        if (!existing || d > existing) allClientLastBooking.set(r.client_id, d);
      }
      let atRiskCount = 0;
      for (const [, lastDate] of allClientLastBooking) {
        if (lastDate < sixtyDaysAgo) atRiskCount++;
      }

      // Top services by revenue this period
      const svcMap = new Map<string, { count: number; revenue: number }>();
      for (const r of completedCurr) {
        if (!r.service_id) continue;
        const cur = svcMap.get(r.service_id) ?? { count: 0, revenue: 0 };
        cur.count += 1;
        cur.revenue += Number(r.total_price ?? 0);
        svcMap.set(r.service_id, cur);
      }
      let topServices: ServiceCount[] = [];
      if (svcMap.size > 0) {
        const ids = Array.from(svcMap.keys());
        const { data: svcRows } = await supabase
          .from("services")
          .select("id, title")
          .in("id", ids);
        const titleById = new Map((svcRows ?? []).map(s => [s.id as string, s.title as string]));
        topServices = ids.map(id => ({
          service_id: id,
          title: titleById.get(id) ?? "—",
          ...svcMap.get(id)!,
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      }

      setResult({
        loading: false,
        revenue: revenueCurr,
        bookings: curr.length,
        uniqueClients: clientsCurr,
        avgPrice: completedCurr.length > 0 ? Math.round(revenueCurr / completedCurr.length) : 0,
        revenueTrend: pctChange(revenueCurr, revenuePrev),
        bookingsTrend: pctChange(curr.length, prev.length),
        clientsTrend: pctChange(clientsCurr, clientsPrev),
        series: bucketise(curr, period, now),
        noShowRate: Math.round((noShowCount / totalCurr) * 100),
        cancellationRate: Math.round((cancelCount / totalCurr) * 100),
        atRiskClientCount: atRiskCount,
        topServices,
      });
    })();
  }, [user?.profileId, period]);

  return result;
}
