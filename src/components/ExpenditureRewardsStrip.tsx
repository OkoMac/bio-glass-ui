import { motion } from "framer-motion";
import { Gift, ChevronRight, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAcquisitionVouchers } from "@/hooks/useAcquisitionVouchers";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Discovery-feed strip: "Expenditure Rewards" available to this user.
 * Public name is neutral — the underlying mechanic (5% provider marketing
 * levy, never-visited+nearby eligibility) is not advertised.
 */
export default function ExpenditureRewardsStrip() {
  const { eligible, loading, claim } = useAcquisitionVouchers(8);
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState<string | null>(null);

  if (loading || eligible.length === 0) return null;

  const vertTint: Record<string, string> = {
    indigo: "from-indigo/20 to-indigo/5",
    teal:   "from-teal/20 to-teal/5",
    coral:  "from-coral/20 to-coral/5",
    amber:  "from-amber/20 to-amber/5",
  };

  const handleClaim = async (voucherId: string, providerId: string) => {
    try {
      setClaiming(voucherId);
      await claim(voucherId);
      toast.success("Reward claimed — book to use it");
      navigate(`/provider/${providerId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not claim";
      toast.error(msg);
    } finally {
      setClaiming(null);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber/10 flex items-center justify-center">
            <Gift className="w-4 h-4 text-amber" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Expenditure Rewards</p>
            <p className="text-[10px] text-muted-foreground">Try these providers — we've covered part of it</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-2">
        {eligible.map((v, i) => {
          const daysLeft = Math.max(
            0,
            Math.ceil((new Date(v.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );
          const tint = vertTint[v.provider_vertical ?? "indigo"] ?? vertTint.indigo;
          return (
            <motion.button
              key={v.voucher_id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleClaim(v.voucher_id, v.provider_id)}
              disabled={claiming === v.voucher_id}
              className={`shrink-0 w-[240px] rounded-2xl p-4 bg-gradient-to-br ${tint} border border-white/10 text-left relative overflow-hidden disabled:opacity-60`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  {v.provider_avatar_url ? (
                    <img src={v.provider_avatar_url} alt={v.provider_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-foreground">{v.provider_name?.charAt(0) ?? "?"}</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Reward</p>
                  <p className="text-xl font-bold text-amber leading-none">R{Math.round(v.face_value_rand)}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground truncate mb-2">{v.provider_name}</p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {v.distance_km !== null && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {v.distance_km < 1 ? "<1" : v.distance_km.toFixed(1)}km
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysLeft}d left
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-foreground/70 font-medium">
                  {claiming === v.voucher_id ? "Claiming…" : "Tap to claim"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-foreground/70" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
