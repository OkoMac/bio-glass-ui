import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
