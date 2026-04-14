import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WalletTransaction {
  id: string;
  amount_rand: number;
  type: string;
  reference_id: string | null;
  paystack_ref: string | null;
  description: string | null;
  balance_after: number | null;
  created_at: string;
}

export const WITHDRAWAL_FEE_PERCENT = 10; // 10% BION fee
export const WITHDRAWAL_MIN_RAND = 50;
export const TOPUP_MIN_RAND = 50;

/**
 * Wallet hook — Rand-denominated spending balance.
 * Users can top up via card, spend on bookings/tips/subs, or withdraw to bank (10% fee).
 */
export function useWallet() {
  const { user } = useAuth();
  const profileId = user?.profileId;

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }

    const fetchData = async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        const txns = data as unknown as WalletTransaction[];
        setTransactions(txns);
        // Balance = sum of all txns
        const total = txns.reduce((sum, t) => sum + Number(t.amount_rand), 0);
        setBalance(total);
      }
      setLoading(false);
    };

    fetchData();

    // Subscribe to inserts
    const channel = supabase
      .channel(`wallet-${profileId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${profileId}` },
        (payload) => {
          const t = payload.new as WalletTransaction;
          setTransactions(prev => [t, ...prev]);
          setBalance(prev => prev + Number(t.amount_rand));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  // Calculate withdrawal fee + net
  const calculateWithdrawal = useCallback((grossRand: number) => {
    const fee = Math.max(grossRand * (WITHDRAWAL_FEE_PERCENT / 100), 10);
    const net = grossRand - fee;
    return { gross: grossRand, fee, net };
  }, []);

  return {
    balance,
    transactions,
    loading,
    calculateWithdrawal,
    canWithdraw: balance >= WITHDRAWAL_MIN_RAND,
  };
}
