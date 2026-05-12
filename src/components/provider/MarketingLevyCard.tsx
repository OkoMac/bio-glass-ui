import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Gift, Plus, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderMarketingStats } from "@/hooks/useAcquisitionVouchers";
import { toast } from "sonner";

/**
 * Provider dashboard card: shows their acquisition marketing spend
 * (5% mandatory levy on completed bookings) and lets them voluntarily
 * boost to mint more vouchers for nearby never-visited clients.
 */
export default function MarketingLevyCard() {
  const { user } = useAuth();
  const { stats, loading, boost } = useProviderMarketingStats(user?.profileId);
  const [boostOpen, setBoostOpen] = useState(false);
  const [boostAmount, setBoostAmount] = useState(500);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  const s = stats ?? {
    lifetime_levy_rand: 0, mtd_levy_rand: 0,
    vouchers_minted: 0, vouchers_available: 0,
    vouchers_claimed: 0, vouchers_redeemed: 0,
    attributed_acquisition_rand: 0,
    redeemed_payout_rand: 0, redeemed_bion_fee_rand: 0,
  };

  const handleBoost = async () => {
    try {
      setSubmitting(true);
      const res = await boost(boostAmount);
      toast.success(`Boosted R${boostAmount} — minted ${res.vouchers_minted} new voucher(s)`);
      setBoostOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Boost failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass-2 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-coral" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Acquisition Marketing</p>
            <p className="text-[11px] text-muted-foreground">Funds rewards for new clients nearby</p>
          </div>
        </div>
        <button
          onClick={() => setBoostOpen(!boostOpen)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-coral/10 text-coral text-xs font-medium hover:bg-coral/20 transition-colors"
         title="setBoostOpen(!boostOpen)} className='flex items-center gap-1 px-3 py-1.5 roun…" aria-label="setBoostOpen(!boostOpen)} className='flex items-center gap-1 px-3 py-1.5 roun…">
          <Plus className="w-3 h-3" /> Boost
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">This month</p>
          <p className="text-lg font-bold text-foreground">R{s.mtd_levy_rand.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground">levy</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Live</p>
          <p className="text-lg font-bold text-amber">{s.vouchers_available}</p>
          <p className="text-[10px] text-muted-foreground">vouchers</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">New clients</p>
          <p className="text-lg font-bold text-teal">{s.vouchers_redeemed}</p>
          <p className="text-[10px] text-muted-foreground">acquired</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          A portion of every completed booking is ring-fenced to win you new clients. Vouchers
          appear in Discovery for people nearby who've never booked you — redeemable only at
          your place. When a voucher is redeemed, the value pays out to your wallet.
        </p>
      </div>

      {s.vouchers_claimed > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber/10 to-transparent border border-amber/20">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber" />
            <span className="text-xs font-medium text-foreground">{s.vouchers_claimed} claimed, awaiting booking</span>
          </div>
        </div>
      )}

      {boostOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="space-y-3 pt-2 border-t border-white/5">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Extra marketing spend (R)</label>
            <input
              type="number" value={boostAmount}
              onChange={(e) => setBoostAmount(parseInt(e.target.value) || 0)}
              min={100} step={100}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-coral/50"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Every R500 mints one additional R500 voucher. Unused balance rolls into your next voucher.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setBoostOpen(false)} className="flex-1 py-2 rounded-lg bg-white/5 text-xs text-muted-foreground" title="setBoostOpen(false)} className='flex-1 py-2 rounded-lg bg-white/5 text-xs tex…" aria-label="setBoostOpen(false)} className='flex-1 py-2 rounded-lg bg-white/5 text-xs tex…">Cancel</button>
            <button
              onClick={handleBoost} disabled={submitting || boostAmount < 100}
              className="flex-1 py-2 rounded-lg bg-coral text-white text-xs font-semibold disabled:opacity-50"
             title="`}" aria-label="`}">
              {submitting ? "Processing…" : `Boost R${boostAmount}`}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
