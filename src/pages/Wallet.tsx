import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Plus, ArrowUpRight, ArrowDownLeft, Gift,
  CreditCard, Shield, Info, CheckCircle, X,
} from "lucide-react";

// Transactions loaded from backend
const TRANSACTIONS: { id: string; type: string; label: string; amount: number; date: string; icon: string }[] = [];

const PRESETS = [100, 250, 500, 1000];

const PAYMENT_METHODS = [
  { id: "pm1", label: "Visa •••• 4242", icon: "💳", primary: true  },
  { id: "pm2", label: "FNB EFT",         icon: "🏦", primary: false },
];

export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [balance, setBalance]           = useState(0);
  const [transactions, setTransactions] = useState(TRANSACTIONS);
  const [preset, setPreset]             = useState<number | null>(null);
  const [custom, setCustom]             = useState("");
  const [showTopUp, setShowTopUp]       = useState(false);
  const [success, setSuccess]           = useState(false);
  const [filter, setFilter]             = useState<"all" | "topup" | "debit" | "reward">("all");

  const amount = preset ?? (custom ? parseFloat(custom) : 0);

  const handleTopUp = () => {
    if (!amount || amount < 10) return;
    const newBalance = balance + amount;
    setBalance(newBalance);
    setTransactions(prev => [{
      id:     `t${Date.now()}`,
      type:   "topup",
      label:  "Top-up",
      amount: amount,
      date:   "Today",
      icon:   "💳",
    }, ...prev]);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setShowTopUp(false);
      setPreset(null);
      setCustom("");
    }, 1800);
  };

  const visible = filter === "all" ? transactions : transactions.filter(t => t.type === filter);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(45,212,191,0.08), transparent)" }}
      />

      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">BIONWallet</h1>
            <p className="text-xs text-muted-foreground">{user?.name ?? "User"}</p>
          </div>
          <Shield className="w-4 h-4 text-teal" />
          <span className="text-[10px] text-teal font-medium">Secure</span>
        </div>

        {/* Balance Hero */}
        <GlassCard variant="accent-teal" className="p-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(45,212,191,0.06), transparent)" }}
          />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Available Balance</p>
          <motion.p
            key={balance}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-bold font-data text-teal"
          >
            R{balance.toLocaleString()}
          </motion.p>
          <p className="text-[10px] text-muted-foreground mt-1">BION Credits · closed-loop</p>

          <div className="flex gap-2 mt-5 justify-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTopUp(true)}
              className="flex items-center gap-1.5 rounded-pill px-4 py-2 gradient-teal text-obsidian text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Top Up
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => window.alert("Transfer feature coming soon.")}
              className="flex items-center gap-1.5 rounded-pill px-4 py-2 glass-1 text-foreground text-xs font-medium"
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Send
            </motion.button>
          </div>
        </GlassCard>

        {/* Info pill */}
        <div className="flex items-start gap-2 glass-1 rounded-2xl p-3">
          <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            BIONWallet credits are used for session payments only. Credits expire 12 months after top-up. Not a banking product.
          </p>
        </div>

        {/* Payment methods */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment Methods</h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(pm => (
              <GlassCard key={pm.id} hover className="p-3.5 flex items-center gap-3">
                <span className="text-lg">{pm.icon}</span>
                <span className="flex-1 text-sm text-foreground">{pm.label}</span>
                {pm.primary && (
                  <span className="text-[9px] px-1.5 py-0.5 glass-accent-teal rounded-pill text-teal">Default</span>
                )}
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </GlassCard>
            ))}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/settings?tab=payment")}
              className="w-full glass-1 rounded-2xl p-3.5 flex items-center gap-3 text-muted-foreground hover:bg-white/5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add payment method</span>
            </motion.button>
          </div>
        </div>

        {/* Transaction history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transactions</h2>
            <div className="flex gap-1">
              {(["all", "topup", "debit", "reward"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-pill px-2.5 py-1 text-[10px] font-medium transition-all ${
                    filter === f ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                  }`}
                >
                  {f === "all" ? "All" : f === "topup" ? "Top-ups" : f === "debit" ? "Sessions" : "Rewards"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {visible.length === 0 ? (
              <GlassCard className="p-6 text-center">
                <p className="text-sm font-medium text-foreground mb-1">No transactions yet</p>
                <p className="text-xs text-muted-foreground">Top up your wallet to get started. Transactions will appear here.</p>
              </GlassCard>
            ) : (
              <AnimatePresence initial={false}>
                {visible.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i < 6 ? i * 0.03 : 0 }}
                  >
                    <GlassCard className="p-3.5 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                        tx.amount > 0 ? "glass-accent-teal" : "glass-1"
                      }`}>
                        {tx.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{tx.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{tx.date}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {tx.amount > 0
                          ? <ArrowDownLeft className="w-3 h-3 text-teal" />
                          : <ArrowUpRight className="w-3 h-3 text-coral" />
                        }
                        <span className={`text-sm font-semibold font-data ${tx.amount > 0 ? "text-teal" : "text-foreground"}`}>
                          {tx.amount > 0 ? "+" : ""}R{Math.abs(tx.amount)}
                        </span>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Top-up sheet */}
      <AnimatePresence>
        {showTopUp && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-obsidian/60 backdrop-blur-sm z-40"
              onClick={() => setShowTopUp(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass-2 rounded-t-3xl px-4 pt-5 pb-10"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-foreground">Top Up Wallet</h3>
                <button onClick={() => setShowTopUp(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 flex flex-col items-center gap-3"
                >
                  <CheckCircle className="w-12 h-12 text-teal" />
                  <p className="text-lg font-bold text-foreground">R{amount} added!</p>
                  <p className="text-xs text-muted-foreground">New balance: R{(balance).toLocaleString()}</p>
                </motion.div>
              ) : (
                <>
                  {/* Preset buttons */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {PRESETS.map(p => (
                      <motion.button
                        key={p}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setPreset(p); setCustom(""); }}
                        className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
                          preset === p ? "gradient-teal text-obsidian" : "glass-1 text-muted-foreground"
                        }`}
                      >
                        R{p}
                      </motion.button>
                    ))}
                  </div>

                  {/* Custom amount */}
                  <div className="glass-1 rounded-2xl flex items-center gap-2 px-4 py-3 mb-4">
                    <span className="text-lg font-bold text-muted-foreground">R</span>
                    <input
                      type="number"
                      value={custom}
                      onChange={e => { setCustom(e.target.value); setPreset(null); }}
                      placeholder="Custom amount"
                      className="flex-1 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Payment method selector */}
                  <div className="flex gap-2 mb-4">
                    {PAYMENT_METHODS.map(pm => (
                      <div key={pm.id} className={`flex-1 glass-1 rounded-xl p-2.5 text-center ${pm.primary ? "border border-teal/30" : ""}`}>
                        <p className="text-sm">{pm.icon}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{pm.label}</p>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleTopUp}
                    disabled={!amount || amount < 10}
                    className="w-full rounded-pill py-3 gradient-teal text-obsidian font-semibold text-sm disabled:opacity-40"
                  >
                    Add {amount ? `R${amount}` : "Funds"}
                  </motion.button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BionAssistant />
      <BottomNav />
    </div>
  );
}
