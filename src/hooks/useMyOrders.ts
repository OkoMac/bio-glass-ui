import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OrderItemRow {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_rand: number;
  line_total_rand: number;
  product_title_snapshot: string;
  product_photo_snapshot: string | null;
}

export type OrderStatus =
  | "pending" | "paid" | "preparing" | "ready_for_pickup" | "shipped"
  | "delivered" | "cancelled" | "disputed" | "refunded";

export interface OrderRow {
  id: string;
  provider_id: string;
  provider_name: string | null;
  subtotal_rand: number;
  client_fee_rand: number;
  delivery_cost_rand: number;
  total_charged_rand: number;
  delivery_zone: string;
  tracking_number: string | null;
  pickup_at_provider: boolean;
  status: OrderStatus;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  items: OrderItemRow[];
}

/** Client's own product orders with line items + provider name. Realtime. */
export function useMyOrders() {
  const { user } = useAuth();
  const profileId = user?.profileId;
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!profileId) { setLoading(false); return; }
    setLoading(true);

    const { data: orderRows, error } = await supabase
      .from("product_orders")
      .select(`
        id, provider_id, subtotal_rand, client_fee_rand, delivery_cost_rand,
        total_charged_rand, delivery_zone, tracking_number, pickup_at_provider,
        status, created_at, paid_at, shipped_at, delivered_at,
        order_items(id, product_id, quantity, unit_price_rand, line_total_rand,
                    product_title_snapshot, product_photo_snapshot)
      `)
      .eq("buyer_id", profileId)
      .order("created_at", { ascending: false });

    if (error || !orderRows) { setLoading(false); return; }

    const providerIds = [...new Set(orderRows.map((o: any) => o.provider_id))];
    const { data: providers } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", providerIds);
    const nameMap = new Map(providers?.map((p: any) => [p.id, p.full_name]) ?? []);

    setOrders(
      orderRows.map((o: any) => ({
        ...o,
        provider_name: nameMap.get(o.provider_id) ?? null,
        items: (o.order_items ?? []) as OrderItemRow[],
      })) as OrderRow[]
    );
    setLoading(false);
  }, [profileId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`my-orders-${profileId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "product_orders", filter: `buyer_id=eq.${profileId}` },
        () => { fetchOrders(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileId, fetchOrders]);

  return { orders, loading, refresh: fetchOrders };
}

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: string }> = {
  pending:          { label: "Awaiting payment",    tone: "text-muted-foreground" },
  paid:             { label: "Paid",                tone: "text-teal" },
  preparing:        { label: "Preparing",           tone: "text-amber" },
  ready_for_pickup: { label: "Ready for pickup",    tone: "text-amber" },
  shipped:          { label: "Shipped",             tone: "text-indigo" },
  delivered:        { label: "Delivered",           tone: "text-teal" },
  cancelled:        { label: "Cancelled",           tone: "text-muted-foreground" },
  disputed:         { label: "In dispute",          tone: "text-coral" },
  refunded:         { label: "Refunded",            tone: "text-muted-foreground" },
};
