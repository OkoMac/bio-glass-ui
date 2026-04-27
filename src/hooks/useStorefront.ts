import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Storefront {
  id: string;
  provider_id: string;
  enabled: boolean;
  storefront_name: string | null;
  storefront_description: string | null;
  pickup_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_instructions: string | null;
  shipping_policy: string | null;
  return_policy: string | null;
  total_sales_count: number;
  total_revenue_rand: number;
}

export function useStorefront(providerProfileId?: string) {
  const { user } = useAuth();
  const targetId = providerProfileId ?? user?.profileId;

  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) { setLoading(false); return; }
    // Skip the query for non-UUID IDs (directory slugs like "fg_specialized_dent").
    // Otherwise Postgres returns a 400 "invalid input syntax for type uuid" error.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    if (!isUuid) { setLoading(false); return; }

    supabase
      .from("provider_storefronts")
      .select("*")
      .eq("provider_id", targetId)
      .maybeSingle()
      .then(({ data }) => {
        setStorefront(data as unknown as Storefront | null);
        setLoading(false);
      });
  }, [targetId]);

  // Enable storefront (creates record if doesn't exist)
  const enableStorefront = useCallback(async (settings: Partial<Storefront>) => {
    if (!user?.profileId) return { ok: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("provider_storefronts")
      .upsert({
        provider_id: user.profileId,
        enabled: true,
        ...settings,
      } as any, { onConflict: "provider_id" })
      .select()
      .single();

    if (!error && data) {
      setStorefront(data as unknown as Storefront);
      return { ok: true };
    }
    return { ok: false, error: error?.message };
  }, [user?.profileId]);

  const disableStorefront = useCallback(async () => {
    if (!user?.profileId) return;
    await supabase.from("provider_storefronts")
      .update({ enabled: false } as any)
      .eq("provider_id", user.profileId);
    setStorefront(prev => prev ? { ...prev, enabled: false } : prev);
  }, [user?.profileId]);

  const updateSettings = useCallback(async (updates: Partial<Storefront>) => {
    if (!user?.profileId) return { ok: false };
    const { error } = await supabase.from("provider_storefronts")
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("provider_id", user.profileId);
    if (!error) {
      setStorefront(prev => prev ? { ...prev, ...updates } : prev);
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }, [user?.profileId]);

  return { storefront, loading, enableStorefront, disableStorefront, updateSettings };
}
