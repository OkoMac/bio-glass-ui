import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import MarketingWalletCard from "@/components/provider/MarketingWalletCard";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { PROVIDER_TIER_PRICING } from "@/lib/subscription";
import {
  CreditCard, TrendingUp, CheckCircle, Download,
  Building2, Zap, Shield, Clock, Check, Loader2, ArrowLeft,
  AlertCircle, Search, ChevronRight, Crown, Star,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Bank {
  name: string;
  code: string;
}

interface BankDetails {
  paystack_subaccount_code: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
}

export default function ProviderBilling() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { live, loading: loadingSub, startCheckout, cancel, refresh } = useSubscription();

  // Bank setup state
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [businessName, setBusinessName] = useState(user?.name ?? "");
  const [resolvedName, setResolvedName] = useState("");
  const [savedDetails, setSavedDetails] = useState<BankDetails | null>(null);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [bankSearch, setBankSearch] = useState("");
  const [upgradingTier, setUpgradingTier] = useState<"pro" | "elite" | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleUpgrade = async (tier: "pro" | "elite") => {
    setUpgradingTier(tier);
    setMessage(null);
    try {
      const url = await startCheckout(tier);
      window.location.href = url;
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ?? "Failed to start checkout" });
      setUpgradingTier(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel your subscription? You'll keep access until your current period ends.")) return;
    setCancelling(true);
    setMessage(null);
    try {
      await cancel();
      setMessage({ type: "success", text: "Subscription will not renew after the current period." });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ?? "Failed to cancel" });
    } finally {
      setCancelling(false);
    }
  };

  // Refresh after returning from Paystack checkout.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") || params.get("subscribed") || params.get("reference")) {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load SA banks and saved details on mount
  useEffect(() => {
    loadBanks();
    loadSavedDetails();
  }, []);

  const loadBanks = async () => {
    try {
      const res = await fetch(`${API}/api/paystack/banks`);
      const json = await res.json();
      if (json.ok) setBanks(json.data ?? []);
    } catch {
      // API might not be running — show manual entry
    } finally {
      setLoadingBanks(false);
    }
  };

  const loadSavedDetails = async () => {
    try {
      const token = (await (await import("@/integrations/supabase/client")).supabase.auth.getSession()).data.session?.access_token;
      if (!token) { setLoadingDetails(false); return; }
      const res = await fetch(`${API}/api/paystack/provider/bank-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok && json.data?.paystack_subaccount_code) {
        setSavedDetails(json.data);
      }
    } catch {
      // Not connected yet
    } finally {
      setLoadingDetails(false);
    }
  };

  // Verify account number with Paystack
  const verifyAccount = async () => {
    if (!selectedBank || accountNumber.length < 5) return;
    setResolving(true);
    setResolvedName("");
    try {
      const res = await fetch(
        `${API}/api/paystack/resolve-account?account_number=${accountNumber}&bank_code=${selectedBank}`,
      );
      const json = await res.json();
      if (json.ok) {
        setResolvedName(json.data.account_name ?? "");
        setBusinessName(json.data.account_name ?? businessName);
      } else {
        setMessage({ type: "error", text: "Could not verify account. Check the number and try again." });
      }
    } catch {
      setMessage({ type: "error", text: "Verification failed. Is the backend running?" });
    } finally {
      setResolving(false);
    }
  };

  // Save bank details to Paystack (creates subaccount)
  const saveBankDetails = async () => {
    if (!selectedBank || !accountNumber || !businessName) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const token = (await (await import("@/integrations/supabase/client")).supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`${API}/api/paystack/provider/setup-bank`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bank_code: selectedBank,
          account_number: accountNumber,
          business_name: businessName,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage({ type: "success", text: "Bank details saved! You'll receive payouts automatically." });
        setSavedDetails({
          paystack_subaccount_code: json.data.subaccount_code,
          bank_name: json.data.bank,
          bank_account_number: accountNumber,
          bank_account_name: json.data.account_name ?? businessName,
        });
      } else {
        setMessage({ type: "error", text: json.error ?? "Failed to save bank details" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to connect. Is the backend running?" });
    } finally {
      setSaving(false);
    }
  };

  const filteredBanks = bankSearch
    ? banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
    : banks;

  const fees = {
    service: "R100",
    clientPays: "R105",
    platformFee: "R5",
    clientFee: "R5",
    providerGets: "R95",
    bionEarns: "R10",
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-4xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Payouts</h1>
          <p className="text-xs text-muted-foreground">Set up your bank account to receive payments from clients</p>
        </div>

        {/* Messages */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-3 text-sm flex items-center gap-2 ${
              message.type === "success" ? "glass-accent-teal text-teal" : "glass-accent-coral text-coral"
            }`}
          >
            {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </motion.div>
        )}

        {/* Marketing Wallet — 5% of every paid booking ring-fenced for client BIONPoints redemption */}
        <MarketingWalletCard />

        {/* Fee Breakdown */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">How Payments Work</h2>
          <div className="space-y-2">
            {[
              { label: "Service price (you set this)", value: fees.service, color: "text-foreground" },
              { label: "Client pays (service + 5% booking fee)", value: fees.clientPays, color: "text-foreground" },
              { label: "Client booking fee (5%)", value: `-${fees.clientFee}`, color: "text-amber" },
              { label: "Platform fee from provider (5%)", value: `-${fees.platformFee}`, color: "text-coral" },
              { label: "You receive", value: fees.providerGets, color: "text-teal" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className={`text-sm font-bold font-data ${row.color}`}>{row.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Payouts are automatic via Paystack. You receive your share directly into your bank account after each completed session.
          </p>
        </GlassCard>

        {/* Banking Details */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-indigo" />
            <h2 className="text-sm font-semibold text-foreground">Banking Details</h2>
            {savedDetails?.paystack_subaccount_code && (
              <span className="flex items-center gap-1 text-[10px] text-teal glass-accent-teal rounded-pill px-2 py-0.5">
                <CheckCircle className="w-3 h-3" /> Connected
              </span>
            )}
          </div>

          {loadingDetails ? (
            <div className="flex items-center gap-2 py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : savedDetails?.paystack_subaccount_code ? (
            /* Show saved details */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Bank</p>
                  <p className="text-sm text-foreground mt-0.5">{savedDetails.bank_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Account Number</p>
                  <p className="text-sm text-foreground mt-0.5">
                    ••••{savedDetails.bank_account_number?.slice(-4) ?? "••••"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-muted-foreground">Account Name</p>
                  <p className="text-sm text-foreground mt-0.5">{savedDetails.bank_account_name ?? "—"}</p>
                </div>
              </div>
              <p className="text-[10px] text-teal">
                ✓ Payouts will be sent to this account automatically after each completed session.
              </p>
              <button
                onClick={() => setSavedDetails(null)}
                className="text-xs text-indigo font-medium"
               title="setSavedDetails(null)} className='text-xs text-indigo font-medium' > Change b…" aria-label="setSavedDetails(null)} className='text-xs text-indigo font-medium' > Change b…">
                Change bank details
              </button>
            </div>
          ) : (
            /* Bank setup form */
            <div className="space-y-4">
              {/* Bank selection */}
              <div>
                <label className="text-[10px] text-muted-foreground">Bank</label>
                {loadingBanks ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading banks...</span>
                  </div>
                ) : banks.length > 0 ? (
                  <div className="mt-1">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <input
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        placeholder="Search bank..."
                        className="w-full glass-1 rounded-xl pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
                      />
                    </div>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none bg-transparent appearance-none"
                    >
                      <option value="">Select your bank</option>
                      {filteredBanks.map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    placeholder="Bank code (e.g. 051 for Standard Bank)"
                    className="w-full mt-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
                  />
                )}
              </div>

              {/* Account number */}
              <div>
                <label className="text-[10px] text-muted-foreground">Account Number</label>
                <div className="flex gap-2 mt-1">
                  <input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter account number"
                    className="flex-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
                  />
                  <button
                    onClick={verifyAccount}
                    disabled={resolving || !selectedBank || accountNumber.length < 5}
                    className="px-4 py-2.5 rounded-xl glass-accent-indigo text-xs font-medium text-indigo disabled:opacity-40"
                   aria-label="Loading" title="Loading">
                    {resolving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify"}
                  </button>
                </div>
                {resolvedName && (
                  <p className="text-xs text-teal mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {resolvedName}
                  </p>
                )}
              </div>

              {/* Business name */}
              <div>
                <label className="text-[10px] text-muted-foreground">Business / Account Name</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your name or business name"
                  className="w-full mt-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
                />
              </div>

              {/* Save button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={saveBankDetails}
                disabled={saving || !selectedBank || !accountNumber || !businessName}
                className="w-full py-3 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                ) : (
                  <><Building2 className="w-4 h-4" /> Connect Bank Account</>
                )}
              </motion.button>

              <p className="text-[10px] text-muted-foreground text-center">
                Secured by Paystack. Your bank details are encrypted and never stored on our servers.
              </p>
            </div>
          )}
        </GlassCard>

        {/* Subscription Plan */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-amber" />
            <h2 className="text-sm font-semibold text-foreground">Subscription Plan</h2>
            {loadingSub && (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Active subscription summary */}
          {live && (live.status === "active" || live.status === "non_renewing") && (
            <div className="mb-4 p-4 rounded-xl glass-accent-indigo">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground capitalize">
                    {live.tier} plan — R{live.amount_rand}/mo
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {live.status === "non_renewing"
                      ? `Cancels on ${live.current_period_end ? new Date(live.current_period_end).toLocaleDateString("en-ZA") : "end of period"}`
                      : live.next_billing_at
                        ? `Next billing: ${new Date(live.next_billing_at).toLocaleDateString("en-ZA")}`
                        : "Active"}
                  </p>
                </div>
                {live.status === "active" && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="px-3 py-1.5 rounded-pill text-[11px] font-medium glass-accent-coral text-coral disabled:opacity-40"
                  >
                    {cancelling ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([
              {
                id: "free" as const,
                name: "Free",
                price: "R0",
                period: "forever",
                Icon: Star,
                features: [
                  "Up to 10 bookings/month",
                  "Basic analytics",
                  "Client messaging",
                  "Standard support",
                ],
              },
              {
                // 2026-04-29 (Mistake 22): was hardcoded with the
                // pre-2026-04-28 legacy prices. Canonical config is in
                // lib/subscription.ts; pulling from there avoids drift.
                id: "pro" as const,
                name: "Pro",
                price: `R${PROVIDER_TIER_PRICING.pro.monthly}`,
                period: "/mo",
                Icon: Zap,
                features: [
                  "Unlimited bookings",
                  "Advanced analytics",
                  "Priority in search",
                  "Program builder",
                  "Client CRM tools",
                  "Priority support",
                ],
              },
              {
                id: "elite" as const,
                name: "Elite",
                price: `R${PROVIDER_TIER_PRICING.elite.monthly}`,
                period: "/mo",
                Icon: Crown,
                features: [
                  "Everything in Pro",
                  "Dedicated account manager",
                  "Custom branding",
                  "API access",
                  "Multi-location support",
                  "Reduced platform fees (3.5%)",
                  "Featured provider badge",
                ],
              },
            ] as const).map((plan) => {
              const currentPlan: "free" | "pro" | "elite" =
                live && (live.status === "active" || live.status === "non_renewing") && (live.tier === "pro" || live.tier === "elite")
                  ? (live.tier as "pro" | "elite")
                  : "free";
              const isActive = plan.id === currentPlan;
              const canUpgrade = plan.id !== "free" && plan.id !== currentPlan;
              return (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: 1.01 }}
                  className={`rounded-2xl p-4 flex flex-col ${
                    isActive ? "gradient-indigo text-primary-foreground shadow-cta" : "glass-1"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <plan.Icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : plan.id === "elite" ? "text-amber" : plan.id === "pro" ? "text-indigo" : "text-muted-foreground"}`} />
                    <h3 className={`text-sm font-bold ${isActive ? "text-primary-foreground" : "text-foreground"}`}>{plan.name}</h3>
                    {isActive && (
                      <span className="ml-auto text-[10px] bg-white/20 rounded-pill px-2 py-0.5 font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mb-3">
                    <span className={`text-2xl font-bold font-data ${isActive ? "text-primary-foreground" : "text-foreground"}`}>{plan.price}</span>
                    <span className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.period}</span>
                  </div>
                  <ul className="space-y-1.5 flex-1 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className={`text-[10px] flex items-start gap-1.5 ${isActive ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                        <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {canUpgrade && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleUpgrade(plan.id as "pro" | "elite")}
                      disabled={upgradingTier !== null}
                      className="w-full py-2.5 rounded-pill text-xs font-semibold glass-accent-indigo text-indigo flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      {upgradingTier === plan.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Redirecting...</>
                      ) : (
                        <>Upgrade to {plan.name}</>
                      )}
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            All plans include Paystack payment processing. Upgrade anytime, cancel anytime.
          </p>
        </GlassCard>

        {/* Payout history */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Payout History</h2>
          </div>
          <div className="text-center py-6">
            <CreditCard className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No payouts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Payout history will appear here once clients pay for sessions.
            </p>
          </div>
        </GlassCard>
      </div>

      <ProviderNav />
      <BionAssistant />
    </div>
  );
}
