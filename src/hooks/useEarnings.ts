import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EarningsTransaction {
  id: string;
  amount_rand: number;
  type: string;
  reference_id: string | null;
  source_user_id: string | null;
  description: string | null;
  balance_after: number | null;
  created_at: string;
}

export interface ReferralRecord {
  id: string;
  referred_id: string;
  referral_code: string;
  signup_bonus_awarded: boolean;
  subscription_active: boolean;
  created_at: string;
}

export const EARNINGS_WITHDRAWAL_FEE_PERCENT = 10;
export const EARNINGS_WITHDRAWAL_MIN_RAND = 50;
export const REFERRAL_COMMISSION_PER_PREMIUM = 5.80; // 20% of R29
export const SALES_REP_THRESHOLD = 100;

/**
 * Earnings hook — commission ledger.
 * Sources: referral (client-to-client), Sales Rep commissions.
 * Transfer to wallet (free) or withdraw to bank (10% fee, min R50).
 */
export function useEarnings() {
  const { user } = useAuth();
  const profileId = user?.profileId;

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }

    const fetchData = async () => {
      const [txResp, refResp] = await Promise.all([
        supabase
          .from("earnings_transactions")
          .select("*")
          .eq("user_id", profileId)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("referrals")
          .select("*")
          .eq("referrer_id", profileId)
          .order("created_at", { ascending: false }),
      ]);

      if (!txResp.error && txResp.data) {
        const txns = txResp.data as unknown as EarningsTransaction[];
        setTransactions(txns);
        setBalance(txns.reduce((sum, t) => sum + Number(t.amount_rand), 0));
      }
      if (!refResp.error && refResp.data) {
        setReferrals(refResp.data as unknown as ReferralRecord[]);
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel(`earnings-${profileId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "earnings_transactions", filter: `user_id=eq.${profileId}` },
        (payload) => {
          const t = payload.new as EarningsTransaction;
          setTransactions(prev => [t, ...prev]);
          setBalance(prev => prev + Number(t.amount_rand));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  // Transfer earnings -> wallet (free internal move)
  const transferToWallet = useCallback(async (amount: number) => {
    if (!profileId || amount <= 0 || amount > balance) {
      return { ok: false, error: "Invalid amount" };
    }

    // Debit earnings
    const { error: debitError } = await supabase.from("earnings_transactions").insert({
      user_id: profileId,
      amount_rand: -amount,
      type: "transfer_to_wallet",
      description: `Transfer R${amount.toFixed(2)} to wallet`,
      balance_after: balance - amount,
    });
    if (debitError) return { ok: false, error: debitError.message };

    // Credit wallet
    await supabase.from("wallet_transactions").insert({
      user_id: profileId,
      amount_rand: amount,
      type: "earnings_transfer_in",
      description: `Transfer R${amount.toFixed(2)} from earnings`,
    });

    return { ok: true };
  }, [profileId, balance]);

  // Calculate withdrawal (10% BION fee)
  const calculateWithdrawal = useCallback((grossRand: number) => {
    const fee = Math.max(grossRand * (EARNINGS_WITHDRAWAL_FEE_PERCENT / 100), 5);
    const net = grossRand - fee;
    return { gross: grossRand, fee, net };
  }, []);

  const activeReferrals = referrals.filter(r => r.subscription_active).length;
  const totalReferrals = referrals.length;
  const monthlyRecurring = activeReferrals * REFERRAL_COMMISSION_PER_PREMIUM;
  const isSalesRepEligible = activeReferrals >= SALES_REP_THRESHOLD;

  return {
    balance,
    transactions,
    referrals,
    loading,
    transferToWallet,
    calculateWithdrawal,
    canWithdraw: balance >= EARNINGS_WITHDRAWAL_MIN_RAND,
    activeReferrals,
    totalReferrals,
    monthlyRecurring,
    isSalesRepEligible,
    progressToSalesRep: Math.min(100, Math.round((activeReferrals / SALES_REP_THRESHOLD) * 100)),
  };
}
