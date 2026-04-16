import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

// ── Types ───────────────────────────────────────────────────────────────────
export interface ReviewClient {
  id?: string;
  full_name?: string | null;
  first_name?: string | null;
  avatar_url?: string | null;
}

export interface Review {
  id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  created_at: string;
  client?: ReviewClient | null;
}

export interface RatingSummary {
  count: number;
  avg: number;
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

interface SummaryRow {
  provider_id: string;
  review_count: number;
  avg_rating: number | string | null;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

function toSummary(row: SummaryRow | null | undefined): RatingSummary | null {
  if (!row) return null;
  const avg =
    typeof row.avg_rating === "string"
      ? parseFloat(row.avg_rating) || 0
      : row.avg_rating ?? 0;
  return {
    count: row.review_count ?? 0,
    avg: Number(avg) || 0,
    distribution: {
      5: row.five_star ?? 0,
      4: row.four_star ?? 0,
      3: row.three_star ?? 0,
      2: row.two_star ?? 0,
      1: row.one_star ?? 0,
    },
  };
}

// ── Fetching hook ───────────────────────────────────────────────────────────
/**
 * Loads a provider's public reviews + aggregate summary.
 *
 * SELECTs go straight to Supabase (public views respect RLS via
 * security_invoker). Reviews are ordered newest-first, limited to 20.
 */
export function useProviderReviews(providerId?: string): {
  reviews: Review[];
  summary: RatingSummary | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(!!providerId);

  const load = useCallback(async () => {
    if (!providerId) {
      setReviews([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch reviews + client join for display name.
      const reviewsPromise = supabase
        .from("reviews" as any)
        .select(
          "id, booking_id, rating, comment, tags, created_at, client:profiles!reviews_client_id_fkey(id, full_name, avatar_url)",
        )
        .eq("provider_id", providerId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);

      // Aggregate summary view — one row per provider.
      const summaryPromise = supabase
        .from("provider_rating_summary" as any)
        .select("*")
        .eq("provider_id", providerId)
        .maybeSingle();

      const [reviewsRes, summaryRes] = await Promise.all([
        reviewsPromise,
        summaryPromise,
      ]);

      if (!reviewsRes.error && reviewsRes.data) {
        const decorated: Review[] = (reviewsRes.data as any[]).map((r) => {
          const full: string = r.client?.full_name ?? "";
          const first = full.trim().split(" ")[0] || "Client";
          return {
            id: r.id,
            booking_id: r.booking_id,
            rating: r.rating,
            comment: r.comment,
            tags: r.tags ?? [],
            created_at: r.created_at,
            client: { ...(r.client ?? {}), first_name: first },
          };
        });
        setReviews(decorated);
      } else {
        setReviews([]);
      }

      setSummary(toSummary(summaryRes.data as SummaryRow | null | undefined));
    } catch {
      // Network / table-missing — leave empty state.
      setReviews([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { reviews, summary, loading, refresh: load };
}

// ── Submission hook ─────────────────────────────────────────────────────────
/**
 * Submits a review through the backend endpoint (which uses the service role
 * client to run validation + insert). Surfaces toast-friendly errors.
 */
export function useSubmitReview(): {
  submit: (input: {
    bookingId: string;
    rating: number;
    comment?: string;
    tags?: string[];
  }) => Promise<void>;
  submitting: boolean;
} {
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (input: {
      bookingId: string;
      rating: number;
      comment?: string;
      tags?: string[];
    }) => {
      setSubmitting(true);
      try {
        // Grab the live session token — supabase_token in localStorage is the
        // fallback used by older code paths.
        const { data: sessionData } = await supabase.auth.getSession();
        const token =
          sessionData.session?.access_token ??
          localStorage.getItem("supabase_token") ??
          "";

        const res = await fetch(`${API}/api/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            booking_id: input.bookingId,
            rating: input.rating,
            comment: input.comment,
            tags: input.tags,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error ?? "Failed to submit review");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return { submit, submitting };
}
