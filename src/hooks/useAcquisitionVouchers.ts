import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AcquisitionVoucher {
  voucher_id: string;
  provider_id: string;
  provider_name: string;
  provider_avatar_url: string | null;
  provider_vertical: string | null;
  face_value_rand: number;
  expires_at: string;
  distance_km: number | null;
}

export interface ClaimedAcquisitionVoucher {
  id: string;
  provider_id: string;
  face_value_rand: number;
  status: "claimed" | "redeemed" | "expired" | "forfeited";
  claimed_at: string | null;
  redeemed_at: string | null;
  expires_at: string;
}

/**
 * Client-side hook — surfaces "Expenditure Rewards" from nearby providers
 * the user has never completed a paid booking with. Funded by the 5%
 * provider marketing levy. Redeemable only at the minting provider.
 */
export function useAcquisitionVouchers(limit = 10) {
  const { user } = useAuth();
  const [eligible, setEligible] = useState<AcquisitionVoucher[]>([]);
  const [claimed, setClaimed] = useState<ClaimedAcquisitionVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEligible = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)(
      "eligible_acquisition_vouchers",
      { p_limit: limit }
    );
    if (!error && data) setEligible(data as AcquisitionVoucher[]);
  }, [limit]);

  const fetchClaimed = useCallback(async () => {
    if (!user?.profileId) return;
    const { data, error } = await supabase
      .from("acquisition_vouchers")
      .select("id, provider_id, face_value_rand, status, claimed_at, redeemed_at, expires_at")
      .eq("claimed_by", user.profileId)
      .order("claimed_at", { ascending: false });
    if (!error && data) setClaimed(data as unknown as ClaimedAcquisitionVoucher[]);
  }, [user?.profileId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchEligible(), fetchClaimed()]);
      setLoading(false);
    })();
  }, [fetchEligible, fetchClaimed]);

  const claim = useCallback(
    async (voucherId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        "claim_acquisition_voucher",
        { p_voucher_id: voucherId }
      );
      if (error) throw error;
      // Optimistic refresh
      await Promise.all([fetchEligible(), fetchClaimed()]);
      return data;
    },
    [fetchEligible, fetchClaimed]
  );

  return {
    eligible,
    claimed,
    loading,
    claim,
    refresh: async () => { await Promise.all([fetchEligible(), fetchClaimed()]); },
  };
}

/** Provider-side: marketing stats (levy paid, vouchers minted/claimed/redeemed) */
export function useProviderMarketingStats(providerId?: string) {
  const [stats, setStats] = useState<{
    lifetime_levy_rand: number;
    mtd_levy_rand: number;
    vouchers_minted: number;
    vouchers_available: number;
    vouchers_claimed: number;
    vouchers_redeemed: number;
    attributed_acquisition_rand: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!providerId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("provider_marketing_stats")
      .select("*")
      .eq("provider_id", providerId)
      .maybeSingle();
    if (!error && data) setStats(data as typeof stats);
    setLoading(false);
  }, [providerId]);

  useEffect(() => { fetch(); }, [fetch]);

  /** Provider boosts the levy pool to mint more acquisition vouchers. */
  const boost = useCallback(async (amount: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)(
      "boost_marketing_levy",
      { p_amount: amount }
    );
    if (error) throw error;
    await fetch();
    return data as { boost_amount: number; vouchers_minted: number; face_value: number; remaining_pool: number };
  }, [fetch]);

  return { stats, loading, boost, refresh: fetch };
}
