import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Copy, Share2, CheckCircle, Users, DollarSign,
  TrendingUp, Award, Loader2, Gift, ChevronRight, ExternalLink,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

const TIER_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  bronze: { color: "text-amber-600", bg: "bg-amber-600/20", border: "border-amber-600/30", label: "Bronze" },
  silver: { color: "text-slate-300", bg: "bg-slate-300/20", border: "border-slate-300/30", label: "Silver" },
  gold: { color: "text-amber", bg: "bg-amber/20", border: "border-amber/30", label: "Gold" },
};

interface AffiliateData {
  registered: boolean;
  affiliateCode?: string;
  affiliateLink?: string;
  tier: string;
  commissionPct: number;
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  pendingPayout: number;
  nextTier: string | null;
  nextTierAt: number | null;
  referrals: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
    joined_at: string;
    status: "active" | "pending";
  }>;
}

export default function AffiliateDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/affiliates/dashboard`, { headers });
      const json = await res.json();
      if (json.ok) setData(json.data);
    } catch {}
    setLoading(false);
  }

  async function register() {
    setRegistering(true);
    try {
      const res = await fetch(`${API}/api/affiliates/register`, { method: "POST", headers });
      const json = await res.json();
      if (json.ok) loadDashboard();
    } catch {}
    setRegistering(false);
  }

  async function withdraw() {
    setWithdrawing(true);
    setWithdrawMsg("");
    try {
      const res = await fetch(`${API}/api/affiliates/withdraw`, { method: "POST", headers });
      const json = await res.json();
      if (json.ok) {
        setWithdrawMsg(json.data?.message ?? "Withdrawal requested!");
        loadDashboard();
      } else {
        setWithdrawMsg(json.error ?? "Withdrawal failed");
      }
    } catch {
      setWithdrawMsg("Withdrawal failed");
    }
    setWithdrawing(false);
  }

  function copyLink() {
    if (data?.affiliateLink) {
      navigator.clipboard.writeText(data.affiliateLink).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function shareWhatsApp() {
    if (data?.affiliateLink) {
      window.open(`https://wa.me/?text=${encodeURIComponent(`Join BION Health and get R25 welcome bonus! ${data.affiliateLink}`)}`, "_blank");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo" />
      </div>
    );
  }

  // Not registered
  if (!data?.registered) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
        <div className="w-full px-4 md:px-8 xl:px-12 pt-20 space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 glass-2 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Affiliate Program</h1>
          </div>

          <GlassCard className="p-6 text-center">
            <Gift className="w-12 h-12 text-amber mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">Earn by Sharing BION</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Refer friends to BION and earn commission on their bookings. Start at 5% (Bronze),
              grow to 10% (Gold) as you refer more people.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { tier: "Bronze", refs: "0-9", pct: "5%" },
                { tier: "Silver", refs: "10-24", pct: "7.5%" },
                { tier: "Gold", refs: "25+", pct: "10%" },
              ].map((t) => (
                <div key={t.tier} className="glass-1 rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-foreground">{t.tier}</p>
                  <p className="text-lg font-bold text-amber">{t.pct}</p>
                  <p className="text-[10px] text-muted-foreground">{t.refs} referrals</p>
                </div>
              ))}
            </div>

            <button
              onClick={register}
              disabled={registering}
              className="px-6 py-3 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
            >
              {registering ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Join Affiliate Program"}
            </button>
          </GlassCard>
        </div>
        <BottomNav />
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[data.tier] ?? TIER_CONFIG.bronze;
  const progressPct = data.nextTierAt
    ? Math.min(100, Math.round((data.totalReferrals / data.nextTierAt) * 100))
    : 100;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-20 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 glass-2 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Affiliate Dashboard</h1>
            <p className="text-xs text-muted-foreground">Earn from referrals</p>
          </div>
          <span className={`px-2.5 py-1 rounded-pill text-xs font-bold ${tierConfig.bg} ${tierConfig.color} border ${tierConfig.border}`}>
            <Award className="w-3 h-3 inline mr-1" />
            {tierConfig.label}
          </span>
        </div>

        {/* Tier progress */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {data.tier.charAt(0).toUpperCase() + data.tier.slice(1)} Tier - {data.commissionPct}% commission
            </span>
            {data.nextTier && (
              <span className="text-[10px] text-amber">
                {data.nextTierAt! - data.totalReferrals} more for {data.nextTier}
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-amber to-amber/60"
            />
          </div>
          {!data.nextTier && (
            <p className="text-[10px] text-teal mt-1">Maximum tier reached!</p>
          )}
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Referrals", value: data.totalReferrals, icon: Users, color: "text-indigo" },
            { label: "Active Referrals", value: data.activeReferrals, icon: CheckCircle, color: "text-teal" },
            { label: "Total Earned", value: `R${data.totalEarned.toFixed(2)}`, icon: DollarSign, color: "text-amber" },
            { label: "Pending Payout", value: `R${data.pendingPayout.toFixed(2)}`, icon: TrendingUp, color: "text-violet" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <GlassCard key={stat.label} className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </GlassCard>
            );
          })}
        </div>

        {/* Share link */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Your Affiliate Link</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-xl glass-1 text-xs text-muted-foreground truncate font-mono">
              {data.affiliateLink}
            </div>
            <button
              onClick={copyLink}
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                copied ? "bg-teal/20 text-teal" : "glass-2 text-foreground hover:bg-white/[0.06]"
              }`}
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={shareWhatsApp}
              className="shrink-0 w-9 h-9 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/30"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>

        {/* Withdraw */}
        {data.pendingPayout >= 100 && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Withdraw Earnings</h4>
                <p className="text-xs text-muted-foreground">R{data.pendingPayout.toFixed(2)} available</p>
              </div>
              <button
                onClick={withdraw}
                disabled={withdrawing}
                className="px-4 py-2 rounded-pill text-xs font-semibold gradient-teal text-primary-foreground"
              >
                {withdrawing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Withdraw to Wallet"}
              </button>
            </div>
            {withdrawMsg && (
              <p className="text-xs text-teal mt-2">{withdrawMsg}</p>
            )}
          </GlassCard>
        )}

        {data.pendingPayout < 100 && data.pendingPayout > 0 && (
          <GlassCard className="p-3">
            <p className="text-xs text-muted-foreground text-center">
              Minimum withdrawal: R100 (R{(100 - data.pendingPayout).toFixed(2)} more needed)
            </p>
          </GlassCard>
        )}

        {/* Referral list */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Your Referrals</h3>
          {data.referrals.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No referrals yet. Share your link to get started!</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {data.referrals.map((ref) => (
                <GlassCard key={ref.id} className="p-3">
                  <div className="flex items-center gap-3">
                    {ref.avatar_url ? (
                      <img src={ref.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo/20 flex items-center justify-center text-xs font-bold text-indigo">
                        {ref.name?.charAt(0) ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{ref.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Joined {new Date(ref.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-pill text-[9px] font-bold ${
                      ref.status === "active"
                        ? "bg-teal/20 text-teal border border-teal/30"
                        : "bg-amber/20 text-amber border border-amber/30"
                    }`}>
                      {ref.status === "active" ? "Active" : "Pending"}
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
