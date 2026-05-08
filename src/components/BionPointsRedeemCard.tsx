/**
 * BionPointsRedeemCard — client-side redemption widget.
 *
 * v2.0 Phase 2E. Lets the user spend Class A BIONPoints against a
 * specific booking. Shows their balance, lets them pick how many
 * points to apply, calls POST /api/bionpoints/redeem-for-booking.
 *
 * On success, calls onApplied(randDiscount) so the parent can subtract
 * the discount from the booking total before payment. The actual
 * voucher / wallet drawdown happens server-side; this component just
 * surfaces the affordance.
 *
 * Class B points (challenges, referrals, daily logs) cannot redeem
 * here — they're for platform inventory only. The component reads
 * only the Class A balance.
 *
 * Empty-wallet handling: if the provider's wallet is dry, the
 * /redeem-for-booking endpoint returns 409 with code "wallet_empty".
 * We surface a friendly message; the v2.0 strategy plans an
 * "alternate funded providers" suggestion in Phase 4.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import GlassCard from "@/components/GlassCard";
import { Sparkles, Loader2, Check } from "lucide-react";

const POINTS_PER_RAND = 50; // canonical (mirrors REWARDS.pointsPerRand)

interface Props {
  bookingId: string;
  /** Booking total in rand — caps how much discount can apply. */
  bookingTotalRand: number;
  /** Called with the rand discount on successful redemption. */
  onApplied: (randDiscount: number, pointsRedeemed: number) => void;
}

export default function BionPointsRedeemCard({ bookingId, bookingTotalRand, onApplied }: Props) {
  const { user } = useAuth();
  const profileId = user?.profileId;
  const [classABalance, setClassABalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState<{ pts: number; rand: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }
    let cancelled = false;
    supabase
      .from("bionpoints")
      .select("points")
      .eq("user_id", profileId)
      .eq("class", "A")
      .then(({ data }) => {
        if (cancelled) return;
        const total = (data ?? []).reduce(
          (s: number, r: { points: number }) => s + (r.points ?? 0),
          0,
        );
        setClassABalance(Math.max(0, total));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [profileId]);

  // Cap points by both the user's balance AND the booking total.
  // No point redeeming more than the booking is worth.
  const maxPointsByBooking = Math.floor(bookingTotalRand * POINTS_PER_RAND);
  const maxPoints = Math.min(classABalance, maxPointsByBooking);
  const randDiscount = Math.round((points / POINTS_PER_RAND) * 100) / 100;

  const apply = async () => {
    if (points <= 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch("/api/bionpoints/redeem-for-booking", {
        method: "POST",
        body: JSON.stringify({ points, bookingId }),
      });
      const j = await res.json();
      if (!j.ok) {
        if (j.code === "wallet_empty") {
          setError("This provider's promotional wallet is empty right now — try another provider, or pay full price.");
        } else {
          setError(j.error ?? "Could not apply points");
        }
        return;
      }
      setApplied({ pts: points, rand: randDiscount });
      onApplied(randDiscount, points);
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (classABalance < POINTS_PER_RAND) return null; // less than R1 worth — hide

  if (applied) {
    return (
      <GlassCard className="p-4 border-teal/30 bg-teal/5">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-teal" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">R{applied.rand.toFixed(2)} discount applied</span> — used {applied.pts.toLocaleString()} BIONPoints
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo" />
          <span className="text-sm font-semibold text-foreground">Use BIONPoints</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Balance: {classABalance.toLocaleString()} pts
        </span>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={maxPoints}
          step={POINTS_PER_RAND}
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value, 10) || 0)}
          className="w-full accent-indigo"
        />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{points.toLocaleString()} pts</span>
          <span className="font-data text-foreground">−R{randDiscount.toFixed(2)}</span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-400">{error}</p>
      )}

      <button
        onClick={apply}
        disabled={points <= 0 || submitting}
        className="w-full glass-1 rounded-xl py-2.5 text-sm font-semibold text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Apply discount
      </button>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        50 BIONPoints = R1 store credit. Redeems against this provider's promotional wallet — the more popular the provider, the larger the discount they can fund.
      </p>
    </GlassCard>
  );
}
