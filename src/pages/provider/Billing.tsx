import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import CoachAI from "@/components/CoachAI";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import {
  CreditCard, TrendingUp, CheckCircle, Download,
  Building2, Zap, Shield, ChevronRight, Clock,
  Check, Crown, Star,
} from "lucide-react";

// Import real Pretoria data
import realData from "@/data/bion_pretoria_data.json";

/* ── helpers ──────────────────────────────────────────────────────────────── */
function SVGBar({ data, color = "#6366F1" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all"
          style={{
            height: `${(v / max) * 100}%`,
            background: `linear-gradient(to top, ${color}80, ${color})`,
            opacity: i === data.length - 1 ? 1 : 0.55 + (i / data.length) * 0.35,
          }}
        />
      ))}
    </div>
  );
}

/* ── Real billing data based on Pretoria service providers ────────────── */
// Calculate payouts using ONLY real data - no fake session counts
const calculateRealPayouts = () => {
  // Get real prices from Pretoria providers
  const prices = realData.providers.map(p => {
    const priceStr = p.price.replace('R', '').replace(',', '');
    return parseInt(priceStr) || 0;
  }).filter(p => p > 0);
  
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b) / prices.length : 0;
  
  // No fake session data - show empty/placeholder until real data exists
  const months = ["March 2026", "February 2026", "January 2026", "December 2025", "November 2025"];
  
  return months.map((period, index) => {
    // No real session data yet - will be populated with actual usage
    const sessions = 0; // Real sessions will be tracked when service is used
    const gross = 0; // Real gross will be calculated from actual bookings
    const fee = 0; // Real fees will be calculated from actual transactions
    const net = 0; // Real net will be calculated from actual payouts
    
    return {
      period,
      sessions,
      gross: `R${gross.toLocaleString('en-ZA')}`,
      fee: `R${fee.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      net: `R${net.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      status: "No data yet",
      date: "Will populate with real data",
    };
  });
};

const PAYOUTS = calculateRealPayouts();

// No real trend data yet - chart will show when real data exists
const MONTHLY_NET = [0, 0, 0, 0, 0]; // Will be populated with real net values
const MONTH_LABELS = ["Nov", "Dec", "Jan", "Feb", "Mar"];

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    fee: "15%",
    features: ["Up to 20 sessions/month", "Basic analytics", "1 service listing", "Standard support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R499/mo",
    fee: "10%",
    features: ["Unlimited sessions", "Full analytics", "5 service listings", "Priority support", "Custom availability", "Client messaging"],
    current: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: "R999/mo",
    fee: "7%",
    features: ["Everything in Pro", "Unlimited listings", "White-label booking page", "Dedicated account manager", "Early access to features", "Advanced reporting"],
  },
];

/* ── ProviderBilling ──────────────────────────────────────────────────────── */
export default function ProviderBilling() {
  const { user } = useAuth();
  const [bankName, setBankName] = useState("Standard Bank");
  const [accNumber, setAccNumber] = useState("•••• •••• 4821");
  const [branchCode, setBranchCode] = useState("051001");
  const [editBank, setEditBank] = useState(false);

  const thisMonth = PAYOUTS[0];

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-xs text-muted-foreground">Payouts, subscription & banking details</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "This month (est.)",  value: thisMonth.net,     icon: TrendingUp, color: "text-teal"   },
            { label: "Sessions",            value: `${thisMonth.sessions}`,icon: Zap,    color: "text-indigo" },
            { label: "BION fee (10%)",       value: thisMonth.fee,     icon: Shield,     color: "text-amber"  },
            { label: "Payout date",         value: "1 Mar 2026",      icon: Clock,      color: "text-coral"  },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-[10px] text-muted-foreground">{card.label}</p>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className={`text-lg font-bold font-data ${card.color}`}>{card.value}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Payout trend */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Net Payout Trend</h2>
            <span className="text-[10px] text-muted-foreground">6 months</span>
          </div>
          <SVGBar data={MONTHLY_NET} color="#6366F1" />
          <div className="flex justify-between mt-2">
            {MONTH_LABELS.map((l, i) => (
              <span key={i} className="flex-1 text-[10px] text-center text-muted-foreground">{l}</span>
            ))}
          </div>
        </GlassCard>

        {/* Payout history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Payout History</h2>
            <button className="text-[10px] text-indigo flex items-center gap-1">
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>
          <div className="space-y-2">
            {PAYOUTS.map((p, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard className="p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        p.status === "Paid" ? "bg-teal/10" : "bg-amber/10"
                      }`}>
                        {p.status === "Paid"
                          ? <CheckCircle className="w-4 h-4 text-teal" />
                          : <Clock className="w-4 h-4 text-amber" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.period}</p>
                        <p className="text-[10px] text-muted-foreground">{p.sessions} sessions · fee {p.fee}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-data text-foreground">{p.net}</p>
                      <span className={`text-[10px] font-medium ${
                        p.status === "Paid" ? "text-teal" : "text-amber"
                      }`}>{p.status}</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Banking details */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo" />
              <h2 className="text-sm font-semibold text-foreground">Banking Details</h2>
            </div>
            <button
              onClick={() => setEditBank(!editBank)}
              className="text-[10px] text-indigo font-medium"
            >
              {editBank ? "Save" : "Edit"}
            </button>
          </div>
          <div className="space-y-3">
            {[
              { label: "Bank",          value: bankName,   set: setBankName   },
              { label: "Account number",value: accNumber,  set: setAccNumber  },
              { label: "Branch code",   value: branchCode, set: setBranchCode },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[10px] text-muted-foreground">{f.label}</label>
                {editBank ? (
                  <input
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    className="w-full mt-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none border border-white/5 bg-transparent"
                  />
                ) : (
                  <p className="mt-1 text-sm text-foreground">{f.value}</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
            Payouts are processed on the 1st of each month. Bank verification required on first payout.
          </p>
        </GlassCard>

        {/* Commission breakdown */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Commission Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Gross session revenue", value: thisMonth.gross,  color: "text-foreground" },
              { label: "BION platform fee (10%)",  value: `-${thisMonth.fee}`, color: "text-coral"    },
              { label: "Net payout",              value: thisMonth.net,   color: "text-teal"     },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <p className="text-sm text-muted-foreground">{row.label}</p>
                <p className={`text-sm font-bold font-data ${row.color}`}>{row.value}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Subscription plans */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PLANS.map((plan) => (
              <GlassCard
                key={plan.id}
                className={`p-4 flex flex-col ${plan.current ? "border border-indigo/30" : ""}`}
              >
                {plan.current && (
                  <span className="text-[10px] text-indigo font-semibold mb-2 uppercase tracking-wider">Current</span>
                )}
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-sm font-bold text-foreground">{plan.name}</p>
                  <p className="text-xs font-data text-muted-foreground">{plan.fee} fee</p>
                </div>
                <p className="text-xl font-bold font-data text-foreground mb-3">{plan.price}</p>
                <ul className="space-y-1.5 flex-1 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-teal shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                    plan.current
                      ? "gradient-indigo text-primary-foreground"
                      : "glass-1 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {plan.current ? "Current Plan" : plan.id === "starter" ? "Downgrade" : "Upgrade"}
                </motion.button>
              </GlassCard>
            ))}
          </div>
        </div>

      </div>
      <CoachAI />
      <ProviderNav />
    </div>
  );
}
