import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProfileViews {
  today: number;
  this_week: number;
  this_month: number;
  trend: string;
}

export interface BookingsBreakdown {
  total: number;
  completed: number;
  cancelled: number;
  no_shows: number;
  pending: number;
}

export interface RevenueBreakdown {
  today: number;
  this_week: number;
  this_month: number;
  total: number;
  trend: string;
}

export interface TopClient {
  name: string;
  sessions: number;
  total_spent: number;
}

export interface ClientsBreakdown {
  total_unique: number;
  new_this_month: number;
  returning_rate: number;
  top_clients: TopClient[];
}

export interface ServicePopularity {
  name: string;
  bookings: number;
  revenue: number;
}

export interface ServicesBreakdown {
  most_popular: ServicePopularity[];
  least_booked: { name: string; bookings: number }[];
}

export interface PeakHour {
  hour: number;
  bookings: number;
}

export interface PeakDay {
  day: string;
  bookings: number;
}

export interface RatingsBreakdown {
  average: number;
  count: number;
  distribution: Record<string, number>;
}

export interface ReferralSource {
  source: string;
  count: number;
}

export interface DailyTrend {
  date: string;
  bookings: number;
  revenue: number;
}

export interface DetailedAnalyticsData {
  period: string;
  profile_views: ProfileViews;
  bookings: BookingsBreakdown;
  revenue: RevenueBreakdown;
  clients: ClientsBreakdown;
  services: ServicesBreakdown;
  peak_hours: PeakHour[];
  peak_days: PeakDay[];
  ratings: RatingsBreakdown;
  no_show_rate: number;
  avg_booking_value: number;
  cancellation_rate: number;
  referral_sources: ReferralSource[];
  daily_trend: DailyTrend[];
  insights: string[];
}

export type Period = "7d" | "30d" | "90d" | "all";

export interface DetailedAnalyticsResult {
  loading: boolean;
  error: string | null;
  data: DetailedAnalyticsData | null;
  period: Period;
  setPeriod: (p: Period) => void;
  refetch: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useDetailedAnalytics(): DetailedAnalyticsResult {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DetailedAnalyticsData | null>(null);
  const [period, setPeriod] = useState<Period>("30d");

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API}/api/analytics/provider/detailed?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Failed to load analytics");
        setData(null);
      } else {
        setData(json.data as DetailedAnalyticsData);
      }
    } catch (err: any) {
      setError(err.message ?? "Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { loading, error, data, period, setPeriod, refetch: fetchData };
}
