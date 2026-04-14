import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VoucherEntry {
  id: string;
  amount_rand: number;
  source: string;
  related_booking_id: string | null;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_booking_id: string | null;
  created_at: string;
}

export const VOUCHER_CASHBACK_RATE = 0.0025; // 0.25% (R50 per R20,000) — internal rate, not advertised
export const VOUCHER_MONTHLY_MIN_SPEND = 300; // R300/month to qualify
export const VOUCHER_MAX_DISCOUNT_PERCENT = 30; // 30% max off any booking

/**
 * Expenditure Rewards (formerly "cashback") — Rand-backed.
 * Quietly accrues at 0.25% on R300+ monthly spend. Not advertised publicly;
 * UI just surfaces "Expenditure Rewards" and "Referral Commissions".
 * 12-month expiry, max 30% discount per booking.
 */
export function useVouchers() {
  const { user } = useAuth();
  const profileId = user?.profileId;

  const [vouchers, setVouchers] = useState<VoucherEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }

    const fetchData = async () => {
      const { data, error } = await supabase
        .from("voucher_wallet")
        .select("*")
        .eq("user_id", profileId)
        .order("expires_at", { ascending: true });

      if (!error && data) {
        setVouchers(data as unknown as VoucherEntry[]);
      }
      setLoading(false);
    };

    fetchData();
  }, [profileId]);

  const now = Date.now();
  const activeVouchers = vouchers.filter(
    v => !v.redeemed_at && new Date(v.expires_at).getTime() > now
  );
  const expiredVouchers = vouchers.filter(
    v => !v.redeemed_at && new Date(v.expires_at).getTime() <= now
  );
  const redeemedVouchers = vouchers.filter(v => !!v.redeemed_at);

  const balance = activeVouchers.reduce((sum, v) => sum + Number(v.amount_rand), 0);

  // How much discount can be applied to a booking of given price
  const maxDiscountOnBooking = useCallback((bookingPrice: number) => {
    const maxByPercent = bookingPrice * (VOUCHER_MAX_DISCOUNT_PERCENT / 100);
    return Math.min(maxByPercent, balance);
  }, [balance]);

  // Next expiry date of available vouchers (earliest)
  const nextExpiry = activeVouchers.length > 0 ? activeVouchers[0].expires_at : null;

  return {
    balance,
    vouchers,
    activeVouchers,
    expiredVouchers,
    redeemedVouchers,
    loading,
    maxDiscountOnBooking,
    nextExpiry,
  };
}
