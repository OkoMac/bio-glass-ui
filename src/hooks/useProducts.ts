import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export interface Product {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price_rand: number;
  weight_grams: number;
  largest_side_cm: number;
  stock_qty: number;
  stock_remaining: number;
  photos: string[];
  digital: boolean;
  status: "draft" | "pending_b_review" | "published" | "b_flagged" | "admin_rejected" | "archived";
  b_review_status: "pending" | "b_approved" | "b_flagged" | "admin_approved" | "admin_rejected";
  b_review_notes: string | null;
  b_risk_score: number | null;
  total_sold: number;
  created_at: string;
}

export interface DeliveryQuote {
  courier_cost: number;
  bion_markup: number;
  client_pays: number;
  estimated_days_min: number;
  estimated_days_max: number;
  breakdown: { base: number; weight_surcharge: number; oversize_fee: number };
}

/**
 * Provider's own products (mine) — full visibility regardless of status
 */
export function useMyProducts() {
  const { user } = useAuth();
  const profileId = user?.profileId;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }

    supabase
      .from("products")
      .select("*")
      .eq("provider_id", profileId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setProducts(data as unknown as Product[]);
        setLoading(false);
      });
  }, [profileId]);

  const createProduct = useCallback(async (input: {
    title: string;
    description?: string;
    category?: string;
    price_rand: number;
    weight_grams?: number;
    largest_side_cm?: number;
    stock_qty: number;
    photos?: string[];
    digital?: boolean;
  }) => {
    if (!profileId) return { ok: false, error: "Not authenticated" };

    const { data, error } = await supabase.from("products").insert({
      provider_id: profileId,
      ...input,
      stock_remaining: input.stock_qty,
      photos: input.photos ?? [],
      status: "pending_b_review",
      b_review_status: "pending",
    } as any).select().single();

    if (error || !data) return { ok: false, error: error?.message };

    setProducts(prev => [data as unknown as Product, ...prev]);

    // Trigger B_ review (fire-and-forget)
    fetch(`${API}/api/b-review/product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: (data as any).id }),
    }).catch(() => {});

    return { ok: true, product: data };
  }, [profileId]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const { error } = await supabase.from("products")
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }, []);

  return { products, loading, createProduct, updateProduct, deleteProduct };
}

/**
 * Public products from a specific provider (only published, in stock)
 */
export function useProviderProducts(providerProfileId: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerProfileId) { setLoading(false); return; }

    supabase
      .from("products")
      .select("*")
      .eq("provider_id", providerProfileId)
      .eq("status", "published")
      .gt("stock_remaining", 0)
      .order("total_sold", { ascending: false })
      .then(({ data }) => {
        if (data) setProducts(data as unknown as Product[]);
        setLoading(false);
      });
  }, [providerProfileId]);

  return { products, loading };
}

/**
 * Calculate delivery cost for a product to a chosen zone.
 * Uses Supabase RPC calculate_delivery_cost.
 */
export async function getDeliveryQuote(zone: string, weightGrams: number, largestSideCm: number): Promise<DeliveryQuote | null> {
  const { data, error } = await supabase.rpc("calculate_delivery_cost" as any, {
    p_zone: zone,
    p_weight_grams: weightGrams,
    p_largest_side_cm: largestSideCm,
  });
  if (error || !data || (data as any).error) return null;
  return data as unknown as DeliveryQuote;
}
