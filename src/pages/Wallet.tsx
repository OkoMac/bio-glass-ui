import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet, TOPUP_MIN_RAND } from "@/hooks/useWallet";
import { useEarnings, REFERRAL_COMMISSION_PER_PREMIUM, SALES_REP_THRESHOLD } from "@/hooks/useEarnings";
import { useActivityPoints, pointsToRand } from "@/hooks/useActivityPoints";
import { useVouchers } from "@/hooks/useVouchers";
import MyOrdersSection from "@/components/wallet/MyOrdersSection";
import {
  Plus, ArrowUpRight, ArrowDownLeft, Gift, TrendingUp,
  CreditCard, Wallet as WalletIcon, Award, X, Check, Loader2,
  Users, Star, Sparkles, Download, Info, ArrowLeft,
} from "lucide-react";

type Tab = "wallet" | "earnings";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

const TOPUP_PRESETS = [100, 250, 500, 1000];

// Wrap Paystack fee into top-up: charged = amount + (amount * 3% + R1)
function calculateTopUpCharge(amount: number) {
  const paystackFee = amount * 0.03 + 1;
  return Math.round((amount + paystackFee) * 100) / 100;
}

export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const wallet = useWallet();
  const earnings = useEarnings();
  const points = useActivityPoints();
  const vouchers = useVouchers();

  const [activeTab, setActiveTab] = useState<Tab>("wallet");
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState<"wallet" | "earnings" | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ── Top-up handler ──
  const handleTopUp = async () => {
    const amount = topUpAmount ?? parseFloat(customAmount);
    if (!amount || amount < TOPUP_MIN_RAND) {
      showMessage("error", `Minimum top-up is R${TOPUP_MIN_RAND}`);
      return;
    }
    setProcessing(true);
    // TODO: Real Paystack integration — this will charge calculateTopUpCharge(amount) but credit amount
    // For now: show success and refresh. Backend integration needed for actual payment.
    showMessage("success", `R${amount.toFixed(2)} top-up initiated. You'll be redirected to Paystack.`);
    setTimeout(() => {
      setShowTopUp(false);
      setTopUpAmount(null);
      setCustomAmount("");
      setProcessing(false);
    }, 2000);
  };

  // ── Earnings → Wallet transfer ──
  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0 || amount > earnings.balance) {
      showMessage("error", "Invalid transfer amount");
      return;
    }
    setProcessing(true);
    const result = await earnings.transferToWallet(amount);
    if (result.ok) {
      showMessage("success", `R${amount.toFixed(2)} transferred to wallet`);
      setShowTransfer(false);
      setTransferAmount("");
    } else {
      showMessage("error", result.error ?? "Transfer failed");
    }
    setProcessing(false);
  };

  // ── Withdrawal handler ──
  // Posts to /api/wallet/withdraw which debits the wallet and queues a
  // pending wallet_transactions row. The Payouts worker (server-side
  // setInterval) picks the row up every 10 min and runs the Paystack Transfer.
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const source = showWithdraw;
    if (!amount || amount <= 0 || !source) return;

    const sourceBalance = source === "wallet" ? wallet.balance : earnings.balance;
    if (amount > sourceBalance) {
      showMessage("error", "Insufficient balance");
      return;
    }
    // Backend enforces R200 minimum + 10% cash-out fee
    if (amount < 200) {
      showMessage("error", "Minimum withdrawal is R200");
      return;
    }

    setProcessing(true);
    try {
      const token = (await (await import("@/integrations/supabase/client")).supabase.auth.getSession()).data.session?.access_token;
      const endpoint = source === "wallet" ? "/api/wallet/withdraw" : "/api/earnings/withdraw";
      const resp = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount }),
      });
      const body = await resp.json();
      if (!resp.ok || !body.ok) {
        showMessage("error", body.error ?? "Withdrawal failed");
      } else {
        const net = body.data?.net_payout ?? amount * 0.9;
        const fee = body.data?.fee ?? amount * 0.1;
        showMessage(
          "success",
          `R${Number(net).toFixed(2)} queued (R${Number(fee).toFixed(2)} BION fee). Expected to land in 1-2 business days.`,
        );
        setShowWithdraw(null);
        setWithdrawAmount("");
      }
    } catch (err: any) {
      showMessage("error", err?.message ?? "Network error");
    } finally {
      setProcessing(false);
    }
  };

  // Derived displays
  const pointsRandValue = pointsToRand(points.balance);
  const totalAvailable = wallet.balance + vouchers.balance;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <div className="max-w-3xl xl:max-w-5xl mx-auto px-4 md:px-8 pt-12 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Money</h1>
            <p className="text-xs text-muted-foreground">Spend, receive, withdraw — all in one place</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-1 rounded-pill p-1 flex">
          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex-1 rounded-pill py-2 text-sm font-medium transition-all ${
              activeTab === "wallet" ? "gradient-indigo text-white" : "text-muted-foreground"
            }`}
          >
            <WalletIcon className="w-3.5 h-3.5 inline mr-1" /> Wallet
          </button>
          <button
            onClick={() => setActiveTab("earnings")}
            className={`flex-1 rounded-pill py-2 text-sm font-medium transition-all ${
              activeTab === "earnings" ? "gradient-indigo text-white" : "text-muted-foreground"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 inline mr-1" /> Earnings
          </button>
        </div>

        {/* Message banner */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-2xl p-3 flex items-start gap-2 ${
                message.type === "success" ? "bg-teal/10 border border-teal/30" : "bg-coral/10 border border-coral/30"
              }`}
            >
              {message.type === "success" ? <Check className="w-4 h-4 text-teal shrink-0" /> : <X className="w-4 h-4 text-coral shrink-0" />}
              <p className={`text-xs ${message.type === "success" ? "text-teal" : "text-coral"}`}>{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── WALLET TAB ── */}
        {activeTab === "wallet" && (
          <>
            {/* Main balance */}
            <GlassCard className="p-6 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Wallet balance</p>
              <p className="text-4xl font-bold text-foreground font-data">R{wallet.balance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Spendable on BION bookings, tips, and subscriptions
              </p>

              <div className="flex gap-2 mt-5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowTopUp(true)}
                  className="flex-1 rounded-pill py-3 gradient-indigo text-white text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Top up
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowWithdraw("wallet")}
                  disabled={!wallet.canWithdraw}
                  className="flex-1 rounded-pill py-3 glass-1 text-foreground text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <ArrowDownLeft className="w-4 h-4" /> Withdraw
                </motion.button>
              </div>
            </GlassCard>

            {/* Sub-balances: Vouchers + Points */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Gift className="w-4 h-4 text-coral" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Vouchers</span>
                </div>
                <p className="text-xl font-bold text-foreground font-data">R{vouchers.balance.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {vouchers.activeVouchers.length > 0 ? `${vouchers.activeVouchers.length} active` : "Spend R20,000 to earn"}
                </p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Sparkles className="w-4 h-4 text-amber" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</span>
                </div>
                <p className="text-xl font-bold text-foreground font-data">{points.balance.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">
                  ≈ R{pointsRandValue.toFixed(2)} in store
                </p>
              </GlassCard>
            </div>

            {/* My orders (storefront purchases) */}
            <MyOrdersSection />

            {/* Transactions */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Recent activity</p>
              {wallet.loading ? (
                <GlassCard className="p-6 text-center">
                  <Loader2 className="w-6 h-6 text-muted-foreground mx-auto animate-spin" />
                </GlassCard>
              ) : wallet.transactions.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <WalletIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Top up to start using your wallet</p>
                </GlassCard>
              ) : (
                <div className="space-y-2">
                  {wallet.transactions.slice(0, 20).map(t => {
                    const isPending = t.status === "pending" || t.status === "processing";
                    const isFailed = t.status === "failed";
                    return (
                      <GlassCard key={t.id} className="p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          Number(t.amount_rand) > 0 ? "bg-teal/10" : "bg-coral/10"
                        }`}>
                          {Number(t.amount_rand) > 0
                            ? <ArrowDownLeft className="w-4 h-4 text-teal" />
                            : <ArrowUpRight className="w-4 h-4 text-coral" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm text-foreground truncate">{t.description ?? t.type}</p>
                            {isPending && (
                              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/30">
                                {t.status === "processing" ? "processing" : "pending"}
                              </span>
                            )}
                            {isFailed && (
                              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-coral/15 text-coral border border-coral/30">
                                failed
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(t.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} · {t.type}
                            {isPending && t.type === "withdrawal" && " · arrives in 1-2 business days"}
                          </p>
                        </div>
                        <p className={`text-sm font-bold font-data shrink-0 ${
                          Number(t.amount_rand) > 0 ? "text-teal" : "text-foreground"
                        }`}>
                          {Number(t.amount_rand) > 0 ? "+" : ""}R{Number(t.amount_rand).toFixed(2)}
                        </p>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── EARNINGS TAB ── */}
        {activeTab === "earnings" && (
          <>
            <GlassCard className="p-6 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Earnings balance</p>
              <p className="text-4xl font-bold text-foreground font-data">R{earnings.balance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                From {earnings.activeReferrals} active referral{earnings.activeReferrals !== 1 ? "s" : ""}
                {earnings.monthlyRecurring > 0 && ` · R${earnings.monthlyRecurring.toFixed(2)}/mo recurring`}
              </p>

              <div className="flex gap-2 mt-5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowTransfer(true)}
                  disabled={earnings.balance <= 0}
                  className="flex-1 rounded-pill py-3 gradient-indigo text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <ArrowDownLeft className="w-4 h-4" /> To wallet
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowWithdraw("earnings")}
                  disabled={!earnings.canWithdraw}
                  className="flex-1 rounded-pill py-3 glass-1 text-foreground text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <Download className="w-4 h-4" /> Withdraw
                </motion.button>
              </div>
            </GlassCard>

            {/* Referral progress */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Your referrals</p>
                  <h3 className="text-lg font-bold text-foreground mt-0.5">
                    {earnings.totalReferrals} signed up · {earnings.activeReferrals} active
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-teal" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress to Sales Rep</span>
                  <span className="text-foreground font-medium">{earnings.activeReferrals} / {SALES_REP_THRESHOLD}</span>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${earnings.progressToSalesRep}%` }}
                    className="h-full gradient-indigo rounded-full"
                  />
                </div>
                {earnings.isSalesRepEligible && (
                  <div className="mt-3 p-3 rounded-xl bg-teal/10 border border-teal/30">
                    <p className="text-xs font-bold text-teal">🎉 Sales Rep invitation ready!</p>
                    <p className="text-[11px] text-teal/80 mt-1">You've hit 100 referrals. Tap to upgrade and unlock provider commissions.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-muted-foreground mb-2">You earn <span className="text-foreground font-bold">R{REFERRAL_COMMISSION_PER_PREMIUM.toFixed(2)}/month</span> for every Premium subscriber you refer. Perpetually.</p>
                <button
                  onClick={() => navigate("/profile")}
                  className="text-xs text-indigo font-medium"
                >
                  Get your referral link →
                </button>
              </div>
            </GlassCard>

            {/* Transaction history */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Commission history</p>
              {earnings.loading ? (
                <GlassCard className="p-6 text-center">
                  <Loader2 className="w-6 h-6 text-muted-foreground mx-auto animate-spin" />
                </GlassCard>
              ) : earnings.transactions.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <Award className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-foreground">No commissions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share your referral code to start earning R{REFERRAL_COMMISSION_PER_PREMIUM}/mo per Premium signup
                  </p>
                </GlassCard>
              ) : (
                <div className="space-y-2">
                  {earnings.transactions.slice(0, 20).map(t => (
                    <GlassCard key={t.id} className="p-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        Number(t.amount_rand) > 0 ? "bg-teal/10" : "bg-indigo/10"
                      }`}>
                        {Number(t.amount_rand) > 0 ? <Star className="w-4 h-4 text-teal" /> : <ArrowUpRight className="w-4 h-4 text-indigo" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{t.description ?? t.type.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <p className={`text-sm font-bold font-data shrink-0 ${
                        Number(t.amount_rand) > 0 ? "text-teal" : "text-foreground"
                      }`}>
                        {Number(t.amount_rand) > 0 ? "+" : ""}R{Number(t.amount_rand).toFixed(2)}
                      </p>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── TOP UP MODAL ── */}
      <AnimatePresence>
        {showTopUp && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTopUp(false)}
              className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-4"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Top up wallet</h3>
                <button onClick={() => setShowTopUp(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {TOPUP_PRESETS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => { setTopUpAmount(amt); setCustomAmount(""); }}
                    className={`py-3 rounded-xl text-sm font-bold transition-colors ${
                      topUpAmount === amt ? "gradient-indigo text-white" : "glass-1 text-foreground"
                    }`}
                  >
                    R{amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 glass-1 rounded-xl px-3 py-2">
                <span className="text-sm text-muted-foreground">R</span>
                <input
                  type="number"
                  min={TOPUP_MIN_RAND}
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setTopUpAmount(null); }}
                  placeholder={`Custom amount (min R${TOPUP_MIN_RAND})`}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none"
                />
              </div>

              {/* Fee transparency */}
              {(topUpAmount ?? parseFloat(customAmount)) >= TOPUP_MIN_RAND && (
                <div className="glass-1 rounded-2xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Top-up amount</span>
                    <span className="text-foreground font-data">R{(topUpAmount ?? parseFloat(customAmount)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Card processing (~3% + R1)</span>
                    <span className="text-muted-foreground font-data">R{(calculateTopUpCharge(topUpAmount ?? parseFloat(customAmount)) - (topUpAmount ?? parseFloat(customAmount))).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1.5 border-t border-white/[0.06]">
                    <span className="text-foreground font-medium">Your card is charged</span>
                    <span className="text-foreground font-bold font-data">R{calculateTopUpCharge(topUpAmount ?? parseFloat(customAmount)).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleTopUp}
                disabled={processing || !((topUpAmount ?? parseFloat(customAmount)) >= TOPUP_MIN_RAND)}
                className="w-full rounded-pill py-4 gradient-indigo text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {processing ? "Processing..." : "Pay with card"}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── TRANSFER MODAL ── */}
      <AnimatePresence>
        {showTransfer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTransfer(false)}
              className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-4"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Transfer to wallet</h3>
                <button onClick={() => setShowTransfer(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Move earnings to your wallet to spend on bookings. No fee — instant.
              </p>

              <div className="glass-1 rounded-2xl p-3">
                <p className="text-[10px] text-muted-foreground mb-1">Available</p>
                <p className="text-lg font-bold text-foreground font-data">R{earnings.balance.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-2 glass-1 rounded-xl px-3 py-2">
                <span className="text-sm text-muted-foreground">R</span>
                <input
                  type="number"
                  min="0.01"
                  max={earnings.balance}
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="Amount to transfer"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none"
                />
                <button onClick={() => setTransferAmount(earnings.balance.toFixed(2))} className="text-xs text-indigo font-medium">Max</button>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleTransfer}
                disabled={processing || !transferAmount || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) > earnings.balance}
                className="w-full rounded-pill py-4 gradient-indigo text-white font-semibold disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Transfer R${transferAmount || "0.00"}`}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── WITHDRAW MODAL ── */}
      <AnimatePresence>
        {showWithdraw && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWithdraw(null)}
              className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-4"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Withdraw to bank</h3>
                <button onClick={() => setShowWithdraw(null)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex gap-2 text-xs text-muted-foreground glass-1 rounded-xl p-3">
                <Info className="w-4 h-4 text-indigo shrink-0 mt-0.5" />
                <p>
                  10% BION fee covers Paystack transfer costs and platform operations. Paid into your bank account on the 15th of the month.
                </p>
              </div>

              <div className="flex items-center gap-2 glass-1 rounded-xl px-3 py-2">
                <span className="text-sm text-muted-foreground">R</span>
                <input
                  type="number"
                  min="50"
                  max={showWithdraw === "wallet" ? wallet.balance : earnings.balance}
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Amount (min R50)"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none"
                />
              </div>

              {withdrawAmount && parseFloat(withdrawAmount) >= 50 && (
                <div className="glass-1 rounded-2xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">You withdraw</span>
                    <span className="text-foreground font-data">R{parseFloat(withdrawAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">BION fee (10%)</span>
                    <span className="text-coral font-data">-R{(parseFloat(withdrawAmount) * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1.5 border-t border-white/[0.06]">
                    <span className="text-foreground font-medium">You receive in bank</span>
                    <span className="text-teal font-bold font-data">R{(parseFloat(withdrawAmount) * 0.9).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleWithdraw}
                disabled={processing || !withdrawAmount || parseFloat(withdrawAmount) < 50}
                className="w-full rounded-pill py-4 gradient-indigo text-white font-semibold disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Request withdrawal"}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
      <BionAssistant />
    </div>
  );
}
