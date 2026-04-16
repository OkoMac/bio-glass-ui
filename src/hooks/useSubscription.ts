import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Subscription,
  UserType,
  ProviderSubscriptionTier,
  ClientSubscriptionTier,
  hasFeature,
  isSubscriptionActive,
  getTrialDaysRemaining,
  getTierDisplayName,
  PROVIDER_TIER_FEATURES,
  CLIENT_TIER_FEATURES,
  PROVIDER_TIER_PRICING,
  CLIENT_TIER_PRICING,
} from "@/lib/subscription";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export type BionTier = "premium" | "pro" | "elite";

// Live backend subscription row (matches public.subscriptions). Exposed
// alongside the legacy user.subscription so existing callers keep working
// while the new billing flow consumes `live`.
export interface LiveSubscription {
  id: string;
  profile_id: string;
  tier: BionTier;
  role_at_signup: "client" | "provider";
  paystack_plan_code: string;
  paystack_subscription_code: string | null;
  paystack_customer_code: string | null;
  status: "pending" | "active" | "non_renewing" | "cancelled" | "payment_failed" | "completed";
  amount_rand: number;
  billing_interval: string;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveInvoice {
  id: string;
  subscription_id: string;
  paystack_reference: string | null;
  amount_rand: number;
  status: "paid" | "failed" | "pending";
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  failed_at: string | null;
  created_at: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useSubscription() {
  const { user } = useAuth();

  const subscription = user?.subscription;
  const isProvider = user?.role === "provider";
  const isClient = user?.role === "client";
  const userType: UserType = isProvider ? "provider" : "client";

  // ── Live subscription state (from backend) ──────────────────────
  const [live, setLive] = useState<LiveSubscription | null>(null);
  const [invoices, setInvoices] = useState<LiveInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    if (!user) { setLive(null); setInvoices([]); return; }
    setLoading(true);
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) { setLive(null); setInvoices([]); return; }
      const res = await fetch(`${API}/api/paystack/subscription/mine`, { headers });
      const json = await res.json();
      if (json?.ok) {
        setLive(json.data?.subscription ?? null);
        setInvoices(json.data?.invoices ?? []);
      }
    } catch {
      // Backend down — leave cached state alone.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  /** Start Paystack checkout for the given tier. Returns the authorization URL. */
  const startCheckout = useCallback(async (tier: BionTier): Promise<string> => {
    const headers = await authHeaders();
    if (!headers.Authorization) throw new Error("Please sign in to subscribe");

    const res = await fetch(`${API}/api/paystack/subscription/start`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    const json = await res.json();
    if (!json?.ok) throw new Error(json?.error ?? "Failed to start subscription");
    return json.data.authorization_url as string;
  }, []);

  /** Cancel current active subscription (moves to non_renewing). */
  const cancel = useCallback(async (): Promise<void> => {
    if (!live?.id) throw new Error("No active subscription to cancel");
    const headers = await authHeaders();
    const res = await fetch(`${API}/api/paystack/subscription/cancel`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId: live.id }),
    });
    const json = await res.json();
    if (!json?.ok) throw new Error(json?.error ?? "Failed to cancel subscription");
    await refresh();
  }, [live?.id, refresh]);

  // ── Legacy feature-gating API (unchanged) ───────────────────────

  const canAccess = (feature: keyof typeof PROVIDER_TIER_FEATURES.free): boolean => {
    if (!subscription) return false;
    return hasFeature(subscription, feature);
  };

  const isActive = (): boolean => {
    if (!subscription) return false;
    return isSubscriptionActive(subscription);
  };

  const trialDaysRemaining = (): number | null => {
    if (!subscription) return null;
    return getTrialDaysRemaining(subscription);
  };

  const tierDisplayName = (): string => {
    // Prefer live tier if available — keeps sidebar in sync with real billing.
    if (live?.tier && live.status === "active") {
      return getTierDisplayName(live.tier as any, userType);
    }
    if (!subscription) return "Free";
    return getTierDisplayName(subscription.tier, userType);
  };

  const requiresUpgrade = (feature: keyof typeof PROVIDER_TIER_FEATURES.free): boolean => {
    if (!subscription) return false;
    return !canAccess(feature);
  };

  const getUpgradeUrl = (): string => {
    if (!subscription) return "/pricing";
    const currentTier = subscription.tier;
    if (userType === "provider") {
      switch (currentTier as ProviderSubscriptionTier) {
        case "free":  return "/pro/billing?upgrade=pro";
        case "pro":   return "/pro/billing?upgrade=elite";
        case "elite": return "/pro/billing";
        default:      return "/pricing";
      }
    } else {
      switch (currentTier as ClientSubscriptionTier) {
        case "free":    return "/billing?upgrade=premium";
        case "premium": return "/billing";
        default:        return "/pricing";
      }
    }
  };

  const getFeaturesRequiringUpgrade = (): Array<{
    feature: string;
    name: string;
    description: string;
    availableIn: string[];
  }> => {
    if (!subscription) return [];
    return [];
  };

  return {
    // Legacy (user.subscription-based) — unchanged surface
    subscription,
    isProvider,
    isClient,
    userType,
    canAccess,
    isActive,
    trialDaysRemaining,
    tierDisplayName,
    requiresUpgrade,
    getUpgradeUrl,
    getFeaturesRequiringUpgrade,
    PROVIDER_TIER_FEATURES,
    CLIENT_TIER_FEATURES,
    PROVIDER_TIER_PRICING,
    CLIENT_TIER_PRICING,

    // Live billing
    live,
    invoices,
    loading,
    refresh,
    startCheckout,
    cancel,
  };
}

/** Small helper — resolves the caller's current billing tier or null. */
export function useTier(): BionTier | null {
  const { live } = useSubscription();
  if (!live) return null;
  if (live.status !== "active" && live.status !== "non_renewing") return null;
  return live.tier;
}
