import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CorporateNav from "@/components/CorporateNav";
import BionAssistant from "@/components/BionAssistant";
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingDown, Plus, Building2, CheckCircle } from "lucide-react";

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

// Transactions loaded from backend
const TRANSACTIONS: Tx[] = [];

const TOP_UP_AMOUNTS = [5000, 10000, 25000, 50000];

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
  const [topUpAmount, setTopUpAmount]   = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showSuccess, setShowSuccess]   = useState(false);

  const companyBalance = 0;
  const totalAllocated = 0;
  const pendingClaims  = 0;

  const handleTopUp = () => {
    const amt = topUpAmount ?? Number(customAmount);
    if (!amt || amt <= 0) return;
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setTopUpAmount(null); setCustomAmount(""); }, 2000);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl xl:max-w-7xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

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
              disabled={!topUpAmount && !customAmount}
              className="px-5 rounded-xl text-sm font-semibold gradient-indigo text-primary-foreground disabled:opacity-40">
              {showSuccess ? <><CheckCircle className="w-4 h-4 inline mr-1"/>Done!</> : "Top Up"}
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
            <span className="text-[10px] text-muted-foreground">{TRANSACTIONS.length} this month</span>
          </div>
          <div className="space-y-2">
            {TRANSACTIONS.length === 0 && (
              <GlassCard className="p-6 text-center">
                <p className="text-sm font-medium text-foreground mb-1">No transactions yet</p>
                <p className="text-xs text-muted-foreground">Top up your company wallet to get started. Transactions will appear here.</p>
              </GlassCard>
            )}
            {TRANSACTIONS.map((tx, i) => {
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
