/**
 * MarketingWalletCard — provider's marketing-wallet dashboard widget.
 *
 * v2.0 Phase 2D. Shows the provider:
 *   • Their current redeemable balance (BIONPoints liability funded)
 *   • Lifetime totals (credited / redeemed / reverted)
 *   • Recent activity (credits from paid bookings, redemptions
 *     from clients spending Class A points at this provider)
 *
 * The 5% acquisition contribution lands here automatically when a
 * client's paystack payment confirms (backend paystack.ts → services/
 * marketingWallet.ts). Redemptions debit this wallet when a client
 * spends Class A points against a booking with this provider
 * (backend bionpoints.ts → /redeem-for-booking).
 *
 * Embed in /pro/billing.
 */

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import GlassCard from "@/components/GlassCard";
import { TrendingUp, ArrowDownCircle, ArrowUpCircle, Clock, Wallet } from "lucide-react";

interface CreditRow {
  id: string;
  amount_rand: number;
  source_booking: string | null;
  credited_at: string;
  expires_at: string;
  reverted_at: string | null;
  reverted_to: string | null;
}

interface RedemptionRow {
  id: string;
  points: number;
  reason: string;
  source_id: string | null;
  created_at: string;
}

interface WalletData {
  balance_rand: number;
  lifetime_credited: number;
  lifetime_redeemed: number;
  lifetime_reverted: number;
  deactivated_at: string | null;
  credits: CreditRow[];
  redemptions: RedemptionRow[];
}

const fmtZAR = (n: number) =>
  `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

export default function MarketingWalletCard() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/providers/me/marketing-wallet");
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error ?? "Failed to load wallet");
        setData(json.data as WalletData);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load wallet");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock className="w-4 h-4 animate-pulse" />
          <span>Loading marketing wallet…</span>
        </div>
      </GlassCard>
    );
  }

  if (error || !data) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-rose-400">{error ?? "No wallet data"}</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-indigo" />
          <h3 className="text-sm font-semibold text-foreground">Marketing Wallet</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">5% of every paid booking</span>
      </div>

      {/* Balance */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Available for client redemption</p>
        <p className="text-2xl font-bold text-foreground font-data">{fmtZAR(data.balance_rand)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Funds the BIONPoints discount when clients book your services. Credits expire 12 months after they land.
        </p>
      </div>

      {/* Lifetime stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="glass-1 rounded-xl p-3">
          <ArrowUpCircle className="w-4 h-4 text-teal mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Credited</p>
          <p className="text-sm font-bold text-foreground font-data">{fmtZAR(data.lifetime_credited)}</p>
        </div>
        <div className="glass-1 rounded-xl p-3">
          <ArrowDownCircle className="w-4 h-4 text-coral mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Redeemed</p>
          <p className="text-sm font-bold text-foreground font-data">{fmtZAR(data.lifetime_redeemed)}</p>
        </div>
        <div className="glass-1 rounded-xl p-3">
          <TrendingUp className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Expired</p>
          <p className="text-sm font-bold text-foreground font-data">{fmtZAR(data.lifetime_reverted)}</p>
        </div>
      </div>

      {/* Recent activity */}
      {(data.credits.length > 0 || data.redemptions.length > 0) && (
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2">Recent activity</h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {data.credits.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs glass-1 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ArrowUpCircle className="w-3 h-3 text-teal shrink-0" />
                  <span>Credit · {fmtDate(c.credited_at)}</span>
                </div>
                <span className="font-data text-teal">+{fmtZAR(c.amount_rand)}</span>
              </div>
            ))}
            {data.redemptions.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs glass-1 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-muted-foreground truncate">
                  <ArrowDownCircle className="w-3 h-3 text-coral shrink-0" />
                  <span className="truncate">Redemption · {fmtDate(r.created_at)}</span>
                </div>
                <span className="font-data text-coral">{Math.abs(r.points)} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.credits.length === 0 && data.redemptions.length === 0 && (
        <p className="text-xs text-muted-foreground italic text-center py-2">
          No activity yet. Your wallet credits 5% of every paid booking automatically.
        </p>
      )}
    </GlassCard>
  );
}
