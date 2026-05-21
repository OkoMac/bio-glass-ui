import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CorporateNav from "@/components/CorporateNav";
import BionAssistant from "@/components/BionAssistant";
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingDown, Plus, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

/* ─── types & data ──────────────────────────────────────────────────────── */
type TxType = "topup" | "allocation" | "session" | "refund";

interface Tx {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TxType;
  employee?: string;
  provider?: string;
}

const TOP_UP_AMOUNTS = [5000, 10000, 25000, 50000];

interface ApiTx {
  id: string;
  amount_cents: number;
  kind: "topup" | "allocation" | "session" | "refund_in" | "refund_out" | "manual_adjust";
  description: string | null;
  paystack_reference: string | null;
  created_at: string;
}
interface WalletState {
  balance_cents: number;
  lifetime_topup_cents: number;
}

function kindToTxType(kind: ApiTx["kind"]): TxType {
  if (kind === "topup" || kind === "refund_in") return "topup";
  if (kind === "allocation" || kind === "refund_out" || kind === "manual_adjust") return "allocation";
  return "session";
}

const TX_COLORS: Record<TxType, string> = {
  topup:      "text-teal",
  refund:     "text-teal",
  allocation: "text-amber",
  session:    "text-coral",
};
const TX_ICONS: Record<TxType, typeof Wallet> = {
  topup:      ArrowUpRight,
  refund:     ArrowUpRight,
  allocation: ArrowDownLeft,
  session:    TrendingDown,
};

/* ─── CorporateWallet ───────────────────────────────────────────────────── */
export default function CorporateWallet() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [topUpAmount, setTopUpAmount]   = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [wallet, setWallet] = useState<WalletState>({ balance_cents: 0, lifetime_topup_cents: 0 });
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setLoading(false); return; }
      const r = await fetch(`${API}/api/corporate/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${r.status}`);
      setWallet(j.wallet);
      setTransactions((j.transactions as ApiTx[]).map((t) => ({
        id: t.id,
        date: new Date(t.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
        description: t.description ?? (t.kind === "topup" ? "Top-up" : t.kind),
        // Frontend convention: positive = credit, negative = debit. Backend
        // stores signed cents in the SAME polarity, so convert to rand by /100.
        amount: t.amount_cents / 100,
        type: kindToTxType(t.kind),
      })));
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't load wallet", { duration: 8000 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadWallet(); }, [loadWallet]);

  // If we just came back from Paystack with ?topup=success, refresh
  // immediately (webhook may take 1-3 seconds — schedule a second
  // refresh to catch the credit) and show a confirmation toast.
  useEffect(() => {
    if (searchParams.get("topup") === "success") {
      toast.success("Top-up processing — your balance will update in a moment.", { duration: 8000 });
      const timer = setTimeout(() => void loadWallet(), 3000);
      // Strip the query param so refreshing the page doesn't re-trigger.
      setSearchParams({}, { replace: true });
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams, loadWallet]);

  const companyBalance = wallet.balance_cents / 100;
  const totalAllocated = 0; // future: sum of allocation kinds
  const pendingClaims  = 0; // future: sum of pending session debits

  const handleTopUp = async () => {
    const amt = topUpAmount ?? Number(customAmount);
    if (!amt || amt < 100) {
      toast.error("Minimum top-up is R100");
      return;
    }
    setSubmitting(true);
    const tId = toast.loading("Connecting to Paystack…");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Please sign in again");
      const r = await fetch(`${API}/api/corporate/wallet/topup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: Math.round(amt * 100) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok || !j.authorization_url) {
        throw new Error(j?.error ?? `Top-up init failed (HTTP ${r.status})`);
      }
      toast.success("Redirecting to Paystack…", { id: tId });
      // Full-page redirect — Paystack will return the user to
      // /corporate/wallet?topup=success after the charge.
      window.location.href = j.authorization_url;
    } catch (err: any) {
      toast.error(err?.message ?? "Top-up failed", { id: tId, duration: 10000 });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl xl:max-w-7xl px-4 pt-20 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <p className="text-xs text-muted-foreground">Company wellness budget & transactions</p>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label:"Company Balance",    value:`R${companyBalance.toLocaleString()}`, sub:"Available to allocate", color:"text-teal",  icon:Wallet },
            { label:"Allocated to Employees", value:`R${totalAllocated.toLocaleString()}`, sub:"Across employees", color:"text-amber", icon:ArrowDownLeft },
            { label:"Pending Claims",     value:`R${pendingClaims.toLocaleString()}`,  sub:"Awaiting confirmation",   color:"text-coral", icon:TrendingDown },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.06 }}>
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-[10px] text-muted-foreground">{card.label}</p>
                    <Icon className={`w-4 h-4 ${card.color}`}/>
                  </div>
                  <p className={`text-2xl font-bold font-data ${card.color}`}>{card.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Top-up section */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#F59E0B,#F05A28)" }}>
              <Plus className="w-4 h-4 text-white"/>
            </div>
            <h2 className="text-sm font-semibold text-foreground">Top Up Company Wallet</h2>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {TOP_UP_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => { setTopUpAmount(amt); setCustomAmount(""); }}
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                  topUpAmount === amt
                    ? "gradient-indigo text-primary-foreground"
                    : "glass-1 text-muted-foreground hover:text-foreground"
                }`}>
                R{(amt / 1000).toFixed(0)}k
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R</span>
              <input
                type="number"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setTopUpAmount(null); }}
                placeholder="Custom amount"
                min={100}
                step={100}
                inputMode="numeric"
                className="w-full glass-1 rounded-xl pl-7 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleTopUp}
              disabled={submitting || (!topUpAmount && !customAmount)}
              className="px-5 rounded-xl text-sm font-semibold gradient-indigo text-primary-foreground disabled:opacity-40 flex items-center gap-1.5">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Top Up</> : "Top Up"}
            </motion.button>
          </div>

          <div className="p-3 glass-1 rounded-xl flex items-start gap-2">
            <Building2 className="w-4 h-4 text-amber shrink-0 mt-0.5"/>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Funds are loaded to your BIONWallet company account. Employees draw from their allocated monthly budgets.
              Top-ups are instant. Corporate invoices issued at month-end.
            </p>
          </div>
        </GlassCard>

        {/* Transaction history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Transactions</h2>
            <span className="text-[10px] text-muted-foreground">{transactions.length} this month</span>
          </div>
          <div className="space-y-2">
            {transactions.length === 0 && (
              <GlassCard className="p-6 text-center">
                <p className="text-sm font-medium text-foreground mb-1">No transactions yet</p>
                <p className="text-xs text-muted-foreground">Top up your company wallet to get started. Transactions will appear here.</p>
              </GlassCard>
            )}
            {transactions.map((tx, i) => {
              const Icon   = TX_ICONS[tx.type];
              const colour = TX_COLORS[tx.type];
              const isPos  = tx.amount > 0;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity:0, x:-8 }}
                  animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.03 }}>
                  <GlassCard className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isPos ? "bg-teal/10" : tx.type === "allocation" ? "bg-amber/10" : "bg-coral/10"
                      }`}>
                        <Icon className={`w-4 h-4 ${colour}`}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{tx.date}</span>
                          {tx.employee && (
                            <span className="text-[10px] text-muted-foreground">· {tx.employee}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-bold font-data shrink-0 ${colour}`}>
                        {isPos ? "+" : ""}R{Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
      <BionAssistant />
      <CorporateNav/>
    </div>
  );
}
