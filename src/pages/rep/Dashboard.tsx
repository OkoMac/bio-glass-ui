import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import RepNav from "@/components/RepNav";
import OnboardingChecklistCard from "@/components/OnboardingChecklistCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, Users, DollarSign, CalendarClock, Copy, Share2,
  CreditCard, History, Landmark, ChevronRight, Package, MessageCircle,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────
function generateReferralCode(name: string): string {
  const key = "bion_rep_referral";
  const stored = localStorage.getItem(key);
  if (stored) return stored;

  const clean = name.replace(/\s+/g, "").toUpperCase().slice(0, 6);
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  const code = `BION-REP-${clean}${digits}`;
  localStorage.setItem(key, code);
  return code;
}

function getNextPayout(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ── Mock data (localStorage-backed) ─────────────────────────────────
function getRepProviders(): any[] {
  try {
    const raw = localStorage.getItem("bion_rep_providers");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function getCommissionHistory(): any[] {
  try {
    const raw = localStorage.getItem("bion_rep_commissions");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Component ───────────────────────────────────────────────────────
export default function RepDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Redirect to agreement page if not yet accepted
  const agreementRaw = localStorage.getItem("bion_rep_agreement");
  const agreement = agreementRaw ? JSON.parse(agreementRaw) : null;
  if (!agreement?.accepted) { navigate("/rep/agreement"); return null; }

  // Referral code — prefer the canonical one stored on the Ranger's profile
  // (written once when the rep accepts the agreement). Fall back to the
  // legacy localStorage-only helper so existing demo flows still work.
  const [referralCode, setReferralCode] = useState<string>(() => generateReferralCode(user?.name ?? "REP"));
  const [attributionCount, setAttributionCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) return;
      try {
        // Pull the profile to get the authoritative referral_code + profile id.
        // Profile id (not auth user_id) is what `ranger_attribution_summary` keys on.
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, referral_code")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;
        if (prof?.referral_code) setReferralCode(prof.referral_code);

        if (prof?.id) {
          // Fetch aggregated attribution count from the view. View may not
          // exist yet in dev — swallow errors.
          const { data: summary } = await supabase
            .from("ranger_attribution_summary" as any)
            .select("total_referred")
            .eq("ranger_id", prof.id)
            .maybeSingle();

          if (!cancelled && summary && (summary as any).total_referred != null) {
            setAttributionCount(Number((summary as any).total_referred));
          }
        }
      } catch {/* non-fatal */}
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const shareUrl = `https://bionhealth.co.za/welcome?ref=${encodeURIComponent(referralCode)}`;
  const shareMessage = `Join BION — Africa's health, beauty and wellness platform. Sign up via my link and I'll be here to help you get onboarded. ${shareUrl}`;

  const providers = getRepProviders();
  const commissions = getCommissionHistory();

  const totalProviders = providers.length;
  const monthlyCommission = providers
    .filter((p: any) => p.status === "active")
    .reduce((sum: number, p: any) => sum + (p.monthlyCommission ?? 0), 0);
  const totalEarned = commissions.reduce((sum: number, c: any) => sum + (c.amount ?? 0), 0);

  const markShared = () => {
    try { localStorage.setItem("bion_rep_shared_at", new Date().toISOString()); } catch { /* ignore */ }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      markShared();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join BION",
        text: `Sign up as a provider on BION using my referral code: ${referralCode}`,
        url: "https://bion.app",
      }).catch(() => {});
      markShared();
    } else {
      handleCopy();
    }
  };

  const kpis = [
    { label: "Signups via Link",  value: String(attributionCount),    icon: Users,         color: "#10B981" },
    { label: "This Month",        value: `R${monthlyCommission.toLocaleString()}`, icon: TrendingUp,    color: "#6366F1" },
    { label: "Total Earned",      value: `R${totalEarned.toLocaleString()}`,       icon: DollarSign,    color: "#2DD4BF" },
    { label: "Next Payout",       value: getNextPayout(),              icon: CalendarClock, color: "#FBBF24" },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      markShared();
      setTimeout(() => setCopiedLink(false), 2000);
    } catch { setCopiedLink(false); }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
    markShared();
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      <div className="mx-auto max-w-3xl px-4 pt-12 pb-28 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src="/bion-logo-white-sm.png" alt="BION" className="h-20 w-auto rounded" />
              <span className="text-xs font-semibold text-emerald-400/80 glass-1 px-2 py-0.5 rounded-pill">Sales Rep</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Sales Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {attributionCount > 0
                ? `${attributionCount} signup${attributionCount > 1 ? "s" : ""} via your link`
                : totalProviders > 0
                  ? `${totalProviders} provider${totalProviders > 1 ? "s" : ""} signed up`
                  : "Share your link to start earning"}
            </p>
          </div>
          <button onClick={logout} className="text-[10px] text-muted-foreground glass-1 px-3 py-1.5 rounded-pill">Sign out</button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground">{k.label}</p>
                  <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                </div>
                <p className="text-xl font-bold font-data text-foreground">{k.value}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Onboarding checklist — nudges Rangers to complete SARS, bank, share link, first signup */}
        <OnboardingChecklistCard role="sales_rep" />

        {/* Referral Code */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GlassCard variant="accent-teal" className="p-5">
            <h2 className="text-sm font-semibold text-foreground mb-1">Your Referral Code</h2>
            <p className="text-[11px] text-muted-foreground mb-3">Share this code with providers to earn commissions</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 glass-1 rounded-xl px-4 py-3 text-center">
                <span className="text-lg font-bold font-mono tracking-wider text-emerald-400">{referralCode}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleCopy}
                className="w-11 h-11 rounded-xl glass-1 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="w-4.5 h-4.5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleShare}
                className="w-11 h-11 rounded-xl glass-1 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="w-4.5 h-4.5" />
              </motion.button>
            </div>
            {copied && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-emerald-400 mt-2 text-center">
                Copied to clipboard!
              </motion.p>
            )}
          </GlassCard>
        </motion.div>

        {/* Your share link — the canonical on-ramp. Every signup that lands
            via this URL is durably attributed to this Ranger for perpetual
            commissions. Copying a raw code still works (legacy flow), but
            the full link is friction-free for WhatsApp + SMS shares. */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
          <GlassCard className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Your share link</h2>
                <p className="text-[11px] text-muted-foreground">Every signup via this link is attributed to you — forever.</p>
              </div>
            </div>
            <div className="glass-1 rounded-xl px-3 py-2.5 mb-3 break-all">
              <p className="text-[11px] font-mono text-foreground/90 leading-snug">{shareUrl}</p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyLink}
                className="flex-1 rounded-pill py-2.5 text-xs font-semibold glass-1 border border-white/8 text-foreground flex items-center justify-center gap-1.5 hover:border-white/20 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedLink ? "Copied!" : "Copy link"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleWhatsAppShare}
                className="flex-1 rounded-pill py-2.5 text-xs font-semibold bg-emerald-500/90 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Share on WhatsApp
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>

        {/* My Providers Preview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">My Providers</h2>
              {providers.length > 0 && (
                <a href="/rep/providers" className="text-xs text-emerald-400 flex items-center gap-0.5">
                  View all <ChevronRight className="w-3 h-3" />
                </a>
              )}
            </div>
            {providers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No providers signed up yet</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Share your referral code with providers to start earning</p>
              </div>
            ) : (
              <div className="space-y-2">
                {providers.slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 glass-1 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
                      {p.name?.[0] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.service}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-pill font-medium ${
                      p.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Commission Breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-indigo" />
              <h2 className="text-sm font-semibold text-foreground">Commission Structure</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Standard Providers", rate: "2%", desc: "of transactions (first 12 months, then 1%)" },
                { label: "Elite Providers",    rate: "1%", desc: "of transactions (reduced for Elite tier)" },
                { label: "Subscription Fee",   rate: "20%", desc: "of provider subscription fees" },
              ].map((tier, i) => (
                <div key={i} className="flex items-center justify-between glass-1 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{tier.label}</p>
                    <p className="text-[10px] text-muted-foreground">{tier.desc}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{tier.rate}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-3 text-center">
              Commissions accumulate monthly. Payout on the 1st of each month.
            </p>
          </GlassCard>
        </motion.div>

        {/* Bank Details */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="w-4 h-4 text-indigo" />
              <h2 className="text-sm font-semibold text-foreground">Payout Details</h2>
            </div>
            <div className="text-center py-6">
              <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No bank account linked</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1 mb-4">Add your bank details via Paystack to receive payouts</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="px-6 py-2.5 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
              >
                Link Bank Account
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Commission History */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-indigo" />
              <h2 className="text-sm font-semibold text-foreground">Commission History</h2>
            </div>
            {commissions.length === 0 ? (
              <div className="text-center py-6">
                <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No commissions yet</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Commissions will appear here as your providers transact</p>
              </div>
            ) : (
              <div className="space-y-2">
                {commissions.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between glass-1 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.providerName}</p>
                      <p className="text-[10px] text-muted-foreground">{c.date}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">+R{c.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      <RepNav />
    </div>
  );
}
