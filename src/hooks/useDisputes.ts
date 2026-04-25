import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/authFetch";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export type BRecommendation =
  | "refund_buyer" | "replace_product" | "decline_buyer" | "admin_review_needed" | null;

export interface DisputeRow {
  id: string;
  order_id: string;
  raised_by: string;
  reason: string;
  buyer_statement: string | null;
  provider_statement: string | null;
  buyer_evidence: string[];
  provider_evidence: string[];
  b_recommendation: BRecommendation;
  b_reasoning: string | null;
  b_confidence: number | null;
  resolution: "refunded" | "replaced" | "declined" | "admin_decided" | null;
  resolved_at: string | null;
  created_at: string;
}

/** Buyer: raise a dispute on an order. */
export async function raiseDispute(
  orderId: string,
  reason: string,
  statement: string,
  evidence: string[] = []
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("raise_dispute", {
    p_order_id: orderId,
    p_reason: reason,
    p_statement: statement,
    p_evidence: evidence,
  });
  if (error) throw error;
  return data as { ok: boolean; dispute_id: string };
}

/** Provider: submit response to an open dispute. */
export async function submitProviderResponse(
  disputeId: string,
  statement: string,
  evidence: string[] = []
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("submit_provider_dispute_response", {
    p_dispute_id: disputeId,
    p_statement: statement,
    p_evidence: evidence,
  });
  if (error) throw error;

  // Trigger B_ review once both sides in
  const bRes = await fetch(`${API}/api/b-review/dispute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dispute_id: disputeId }),
  });
  const bData = await bRes.json().catch(() => null);

  return { ok: data?.ok, b_review: bData };
}

/** Resolve: provider picks refund/replace/escalate; admin can do anything. */
export async function resolveDispute(
  disputeId: string,
  resolution: "refunded" | "replaced" | "declined" | "admin_decided"
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("resolve_dispute", {
    p_dispute_id: disputeId,
    p_resolution: resolution,
  });
  if (error) throw error;
  return data;
}

/** Fetch the dispute(s) for a given order (realtime-ready). */
export function useOrderDispute(orderId: string | null) {
  const [dispute, setDispute] = useState<DisputeRow | null>(null);
  const [loading, setLoading] = useState(!!orderId);

  const fetchDispute = useCallback(async () => {
    if (!orderId) { setDispute(null); setLoading(false); return; }
    const { data, error } = await supabase
      .from("order_disputes")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error) setDispute((data as DisputeRow | null) ?? null);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchDispute(); }, [fetchDispute]);

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`dispute-${orderId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "order_disputes", filter: `order_id=eq.${orderId}` },
        () => fetchDispute()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, fetchDispute]);

  return { dispute, loading, refresh: fetchDispute };
}

/* ═══════════════════════════════════════════════════════════════
 * BOOKING DISPUTES (service-level, not product-order)
 * Flow: client opens → provider responds (3d window) → B_ AI review →
 * provider accepts/escalates → admin final call (7d target).
 * Backed by /api/disputes and public.disputes table.
 * ════════════════════════════════════════════════════════════ */

export type BookingDisputeStatus =
  | "opened"
  | "provider_responded"
  | "b_ai_reviewed"
  | "resolved"
  | "escalated"
  | "closed";

export type BookingDisputeResolutionType =
  | "warning"
  | "partial_refund"
  | "full_refund"
  | "no_refund";

export interface BookingDisputeRow {
  id: string;
  booking_id: string;
  client_id: string;
  provider_id: string;
  reason: string;
  evidence: string[];
  amount_rand: number;
  status: BookingDisputeStatus;
  provider_response: string | null;
  provider_responded_at: string | null;
  b_ai_recommendation: BookingDisputeResolutionType | null;
  b_ai_partial_pct: number | null;
  b_ai_reasoning: string | null;
  b_ai_reviewed_at: string | null;
  resolution: string | null;
  resolution_type: BookingDisputeResolutionType | null;
  resolution_amount_rand: number | null;
  resolution_refunded_to: "wallet" | "bank" | null;
  resolved_at: string | null;
  resolved_by: string | null;
  provider_response_due_at: string;
  target_resolution_at: string;
  created_at: string;
  updated_at: string;
  // Joined (depending on endpoint)
  client?: { id: string; full_name: string | null; email: string | null } | null;
  provider?: { id: string; full_name: string | null; email: string | null } | null;
  booking?: {
    id: string;
    booking_date: string;
    booking_time: string;
    service?: { id: string; title: string | null } | null;
  } | null;
  days_elapsed?: number;
}

async function authHeaders(): Promise<Record<string, string>> {
  try {
    return await getAuthHeaders();
  } catch {
    window.location.href = "/welcome";
    return { "Content-Type": "application/json" };
  }
}

/** Client: open a booking dispute */
export async function openBookingDispute(
  bookingId: string,
  reason: string,
  evidence: string[] = [],
): Promise<{ ok: boolean; disputeId: string }> {
  const res = await fetch(`${API}/api/disputes/open`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ bookingId, reason, evidence }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body;
}

/** Provider: respond — the backend fires B_ AI inline. */
export async function respondToBookingDispute(
  disputeId: string,
  response: string,
): Promise<{ ok: boolean; review: any }> {
  const res = await fetch(`${API}/api/disputes/${disputeId}/respond`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ response }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body;
}

/** Provider: accept B_'s recommendation — auto-executes settlement. */
export async function acceptBookingDisputeAi(
  disputeId: string,
  refundTo: "wallet" | "bank" = "wallet",
): Promise<{ ok: boolean; resolution_type: BookingDisputeResolutionType; refunded: number }> {
  const res = await fetch(`${API}/api/disputes/${disputeId}/accept-ai`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ refund_to: refundTo }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body;
}

/** Either party: escalate to admin. */
export async function escalateBookingDispute(
  disputeId: string,
  note?: string,
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API}/api/disputes/${disputeId}/escalate`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(note ? { note } : {}),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body;
}

/** Caller's disputes (client or provider); ordered newest-first. */
export async function fetchMyBookingDisputes(): Promise<BookingDisputeRow[]> {
  const res = await fetch(`${API}/api/disputes/mine`, {
    method: "GET",
    headers: await authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return (body.data as BookingDisputeRow[]) ?? [];
}

/** Admin queue — requires X-Admin-Token. */
export async function fetchAdminBookingDisputes(token: string): Promise<BookingDisputeRow[]> {
  const res = await fetch(`${API}/api/disputes/admin/open`, {
    method: "GET",
    headers: { "X-Admin-Token": token },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return (body.data as BookingDisputeRow[]) ?? [];
}

/** Admin final resolve — requires X-Admin-Token. */
export async function adminResolveBookingDispute(
  token: string,
  disputeId: string,
  payload: {
    resolution_type: BookingDisputeResolutionType;
    partial_pct?: number;
    refund_to: "wallet" | "bank";
    note?: string;
  },
): Promise<{ ok: boolean; resolution_type: BookingDisputeResolutionType; refunded: number }> {
  const res = await fetch(`${API}/api/disputes/admin/${disputeId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body;
}

/**
 * React hook: live-polling a single booking dispute while it's in progress.
 * Poll every 15s until status is resolved/closed.
 */
export function useBookingDispute(bookingId: string | null) {
  const [dispute, setDispute] = useState<BookingDisputeRow | null>(null);
  const [loading, setLoading] = useState<boolean>(!!bookingId);

  const refresh = useCallback(async () => {
    if (!bookingId) { setDispute(null); setLoading(false); return; }
    try {
      const list = await fetchMyBookingDisputes();
      const match = list.find((d) => d.booking_id === bookingId) ?? null;
      setDispute(match);
    } catch {
      // swallow — UI handles missing dispute gracefully
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!bookingId) return;
    const live =
      !dispute ||
      (dispute.status !== "resolved" && dispute.status !== "closed");
    if (!live) return;
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, [bookingId, dispute, refresh]);

  return { dispute, loading, refresh };
}

/** Provider-side: list open disputes raised against this provider's orders */
export function useProviderOpenDisputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<(DisputeRow & { order_id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user?.profileId) { setLoading(false); return; }

    // Orders belonging to this provider with active disputes
    const { data: orderIds } = await supabase
      .from("product_orders")
      .select("id")
      .eq("provider_id", user.profileId)
      .eq("status", "disputed");

    if (!orderIds || orderIds.length === 0) {
      setDisputes([]); setLoading(false); return;
    }

    const { data, error } = await supabase
      .from("order_disputes")
      .select("*")
      .in("order_id", orderIds.map(o => o.id))
      .is("resolved_at", null)
      .order("created_at", { ascending: false });

    if (!error && data) setDisputes(data as (DisputeRow & { order_id: string })[]);
    setLoading(false);
  }, [user?.profileId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { disputes, loading, refresh: fetchAll };
}
