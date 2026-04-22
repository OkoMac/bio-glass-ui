import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Zap, Crown, Loader2, CheckCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

const TIERS = [
  { duration: "7d", label: "1 Week", price: 199, icon: Zap },
  { duration: "14d", label: "2 Weeks", price: 349, icon: Sparkles },
  { duration: "30d", label: "1 Month", price: 599, icon: Crown, popular: true },
];

export default function BoostListingCard() {
  const { session } = useAuth();
  const [mySpotlight, setMySpotlight] = useState<any>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };

  useEffect(() => {
    fetch(`${API}/api/spotlight/my`, { headers })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          const active = (res.data ?? []).find((s: any) => s.is_active);
          if (active) setMySpotlight(active);
        }
      })
      .catch(() => {});
  }, []);

  async function purchase(duration: string) {
    setPurchasing(duration);
    try {
      const res = await fetch(`${API}/api/spotlight/purchase`, {
        method: "POST",
        headers,
        body: JSON.stringify({ duration, position: "top" }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
        setMySpotlight(data.data);
      }
    } catch {}
    setPurchasing(null);
  }

  // If already spotlighted, show status
  if (mySpotlight?.is_active) {
    const daysLeft = Math.max(0, Math.ceil((new Date(mySpotlight.end_date).getTime() - Date.now()) / 86400000));
    return (
      <GlassCard className="p-4 border-2 border-amber/30 bg-gradient-to-br from-amber/5 to-amber/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Spotlight Active
              <CheckCircle className="w-3.5 h-3.5 text-teal" />
            </h4>
            <p className="text-xs text-muted-foreground">{daysLeft} days remaining</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (success) {
    return (
      <GlassCard className="p-4 border-2 border-teal/30">
        <div className="text-center py-2">
          <CheckCircle className="w-8 h-8 text-teal mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">Spotlight activated!</p>
          <p className="text-xs text-muted-foreground">Your listing is now featured in the directory.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber" />
        <h4 className="text-sm font-semibold text-foreground">Boost Your Listing</h4>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Get featured at the top of the directory with a gold badge. More visibility = more bookings.
      </p>

      <div className="space-y-2">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          return (
            <button
              key={tier.duration}
              onClick={() => purchase(tier.duration)}
              disabled={purchasing !== null}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                tier.popular
                  ? "border-2 border-amber/30 bg-amber/5 hover:bg-amber/10"
                  : "glass-1 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${tier.popular ? "text-amber" : "text-muted-foreground"}`} />
                <span className="text-xs font-medium text-foreground">{tier.label}</span>
                {tier.popular && (
                  <span className="px-1.5 py-0.5 rounded-pill text-[8px] font-bold bg-amber/20 text-amber">
                    POPULAR
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">R{tier.price}</span>
                {purchasing === tier.duration ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo" />
                ) : (
                  <span className="text-[10px] text-indigo font-semibold">Boost</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}
