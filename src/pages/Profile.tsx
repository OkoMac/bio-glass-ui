import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings, BookingStatus } from "@/contexts/BookingsContext";
import { useBioPoints } from "@/hooks/useBioPoints";
import { useStreaks } from "@/hooks/useStreaks";
import {
  Shield, Star, Award, Flame, Gift, Lock,
  LogOut, CreditCard, Bell, Eye, Activity, Trophy, Settings,
  Copy, Share2, CheckCircle, MessageCircle,
  Droplets, Moon, HeartPulse, Brain, Utensils, CalendarDays,
  BarChart3, Dumbbell, FileText, Wallet,
} from "lucide-react";
import { getReferralShareUrl, openWhatsApp } from "@/lib/whatsapp";
import { ImagePickerOverlay } from "@/components/ImagePickerOverlay";
import { getProviderImage } from "@/lib/providerImages";

const VERTICAL_PALETTE = ["teal", "indigo", "coral", "amber"] as const;

function statusLabel(s: BookingStatus): string {
  if (s === "pending" || s === "confirmed") return "Upcoming";
  if (s === "completed") return "Completed";
  if (s === "no_show") return "No Show";
  return "Declined";
}

function getOrCreateReferralCode(userName: string): string {
  const KEY = "bion_referral_code";
  const stored = localStorage.getItem(KEY);
  if (stored) return stored;
  const prefix = (userName || "USR").replace(/\s/g, "").substring(0, 3).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const code = `BION-${prefix}${rand}`;
  localStorage.setItem(KEY, code);
  return code;
}

/* ── Glass tile component ──────────────────────────── */
function Tile({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.93 }} onClick={onClick}
      className="group rounded-2xl py-4 flex flex-col items-center gap-2 border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm hover:border-white/[0.16] hover:bg-white/[0.04] transition-all duration-200"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
      <span className={`${color} transition-all group-hover:scale-110`} style={{ filter: "drop-shadow(0 0 6px currentColor)" }}>
        {icon}
      </span>
      <span className="text-[10px] text-muted-foreground font-medium tracking-wide">{label}</span>
    </motion.button>
  );
}

/* ── Stat tile ─────────────────────────────────────── */
function StatTile({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-2xl py-3 px-2 border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm text-center"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
      <p className={`text-xl font-bold font-data ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  );
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "rewards">("dashboard");
  const [referralCopied, setReferralCopied] = useState(false);
  const navigate = useNavigate();
  const { user, logout, switchRole, updateAvatar } = useAuth();
  const { bookings } = useBookings();
  const { balance: bioPoints } = useBioPoints();
  const { streak } = useStreaks("booking");

  const referralCode = getOrCreateReferralCode(user?.name ?? "User");

  const copyReferralCode = useCallback(() => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    });
  }, [referralCode]);

  const shareReferral = useCallback(() => {
    const text = `Join BION with my code ${referralCode} and get 25 BIO Points!`;
    if (navigator.share) {
      navigator.share({ title: "Join BION", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    }
  }, [referralCode]);

  const upcomingCount = bookings.filter(b => b.status === "pending" || b.status === "confirmed").length;
  const completedCount = bookings.filter(b => b.status === "completed").length;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="w-full max-w-lg md:max-w-3xl xl:max-w-5xl mx-auto px-4 md:px-8 pt-12 space-y-6">

        {/* ── Profile Header ──────────────────────────── */}
        <div className="flex items-center gap-4">
          <ImagePickerOverlay onChange={updateAvatar}>
            <BioAvatar
              src={user?.avatar ?? getProviderImage(user?.id ?? "user", user?.name ?? "User")}
              alt={user?.name ?? "User"}
              size="xl"
              verticalColor="indigo"
              verified
            />
          </ImagePickerOverlay>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{user?.name ?? "User"}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="w-3 h-3 text-teal" />
              <span className="text-xs text-teal font-medium">Verified</span>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/settings")}
            className="w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>

        {/* ── Stats row ───────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2.5">
          <StatTile value={String(bioPoints)} label="Points" color="text-amber" />
          <StatTile value={`${streak.currentStreak}d`} label="Streak" color="text-coral" />
          <StatTile value={String(upcomingCount)} label="Upcoming" color="text-teal" />
          <StatTile value={String(completedCount)} label="Sessions" color="text-indigo" />
        </div>

        {/* ── Tab Toggle ──────────────────────────────── */}
        <div className="flex gap-2">
          {(["dashboard", "rewards"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-medium border transition-all duration-200 capitalize ${
                activeTab === tab
                  ? "border-teal/40 bg-teal/10 text-teal"
                  : "border-white/[0.08] bg-white/[0.02] text-muted-foreground"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ═══════ DASHBOARD TAB ═══════ */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* ── Wellness Tools ─────────────────────── */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Wellness Tools</p>
              <div className="grid grid-cols-4 gap-2.5">
                <Tile icon={<Utensils className="w-5 h-5" />}     label="Food"     color="text-teal"      onClick={() => navigate("/food-tracker")} />
                <Tile icon={<CalendarDays className="w-5 h-5" />} label="Calendar" color="text-indigo"    onClick={() => navigate("/calendar")} />
                <Tile icon={<BarChart3 className="w-5 h-5" />}    label="Insights" color="text-violet"    onClick={() => navigate("/health-insights")} />
                <Tile icon={<Dumbbell className="w-5 h-5" />}     label="Routines" color="text-teal"      onClick={() => navigate("/routines")} />
                <Tile icon={<Droplets className="w-5 h-5" />}     label="Water"    color="text-blue-400"  onClick={() => navigate("/water-tracker")} />
                <Tile icon={<Moon className="w-5 h-5" />}          label="Sleep"    color="text-violet"    onClick={() => navigate("/sleep-tracker")} />
                <Tile icon={<HeartPulse className="w-5 h-5" />}   label="Med Card" color="text-coral"     onClick={() => navigate("/medical-card")} />
                <Tile icon={<Brain className="w-5 h-5" />}         label="Coach"    color="text-indigo"    onClick={() => navigate("/life-coach")} />
              </div>
            </div>

            {/* ── Quick Access ───────────────────────── */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Quick Access</p>
              <div className="grid grid-cols-4 gap-2.5">
                <Tile icon={<Activity className="w-5 h-5" />}    label="Health"       color="text-teal"   onClick={() => navigate("/health-profile")} />
                <Tile icon={<Trophy className="w-5 h-5" />}      label="Challenges"   color="text-amber"  onClick={() => navigate("/challenges")} />
                <Tile icon={<Wallet className="w-5 h-5" />}      label="Wallet"       color="text-indigo" onClick={() => navigate("/wallet")} />
                <Tile icon={<Bell className="w-5 h-5" />}         label="Alerts"       color="text-coral"  onClick={() => navigate("/notifications")} />
              </div>
            </div>

            {/* ── Booking History (compact) ──────────── */}
            {bookings.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Recent Bookings</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {bookings.slice(0, 4).map((b, i) => {
                    const vertical = VERTICAL_PALETTE[i % VERTICAL_PALETTE.length];
                    const status = statusLabel(b.status);
                    return (
                      <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 flex items-center gap-3"
                        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                        <div className={`w-1 h-10 rounded-full shrink-0 ${
                          vertical === "teal" ? "bg-teal" : vertical === "indigo" ? "bg-indigo" : vertical === "coral" ? "bg-coral" : "bg-amber"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{b.service}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{b.providerName ?? b.clientName} · {b.date}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 ${
                          status === "Upcoming" ? "border-teal/30 text-teal bg-teal/10" : "border-white/[0.08] text-muted-foreground"
                        }`}>{status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Referral ───────────────────────────── */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-amber" style={{ filter: "drop-shadow(0 0 6px #F59E0B)" }} />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Invite Friends</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2">
                  <p className="text-[9px] text-muted-foreground">Your code</p>
                  <p className="text-sm font-bold font-data text-indigo tracking-wider">{referralCode}</p>
                </div>
                <div className="flex gap-1.5">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={copyReferralCode}
                    className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center hover:border-indigo/30 transition-colors">
                    {referralCopied ? <CheckCircle className="w-3.5 h-3.5 text-teal" /> : <Copy className="w-3.5 h-3.5 text-indigo" />}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={shareReferral}
                    className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center hover:border-indigo/30 transition-colors">
                    <Share2 className="w-3.5 h-3.5 text-indigo" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => openWhatsApp(getReferralShareUrl(referralCode, user?.name))}
                    className="w-9 h-9 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 flex items-center justify-center hover:border-[#25D366]/40 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* ── Account ────────────────────────────── */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Account</p>
              <div className="grid grid-cols-3 gap-2.5">
                <Tile icon={<Eye className="w-5 h-5" />}     label="Privacy" color="text-muted-foreground" onClick={() => navigate("/settings?tab=privacy")} />
                <Tile icon={<CreditCard className="w-5 h-5" />} label="Billing" color="text-muted-foreground" onClick={() => navigate("/billing")} />
                <Tile icon={<LogOut className="w-5 h-5" />}  label="Sign Out" color="text-coral" onClick={logout} />
              </div>
            </div>

            {/* Switch to provider */}
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { switchRole("provider"); navigate("/pro/dashboard"); }}
              className="w-full rounded-2xl py-3 border border-indigo/20 bg-indigo/5 text-sm text-indigo font-medium flex items-center justify-center gap-2 hover:bg-indigo/10 transition-colors">
              <Star className="w-4 h-4" /> Switch to Provider Mode
            </motion.button>
          </motion.div>
        )}

        {/* ═══════ REWARDS TAB ═══════ */}
        {activeTab === "rewards" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* Points hero */}
            <div className="flex flex-col items-center py-4">
              <div className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ background: "radial-gradient(circle, rgba(251,191,36,0.12), transparent 70%)" }}>
                <div className="text-center">
                  <p className="text-3xl font-bold font-data text-amber">{bioPoints.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">BIONPoints</p>
                </div>
              </div>
            </div>

            {/* Streak */}
            <div className="rounded-2xl border border-amber/20 bg-amber/5 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Flame className="w-5 h-5 text-amber" style={{ filter: "drop-shadow(0 0 6px #F59E0B)" }} />
                <div>
                  <p className="text-sm font-bold text-foreground">{streak.currentStreak}-day streak</p>
                  <p className="text-[10px] text-muted-foreground">Keep booking to grow your streak</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className={`flex-1 py-1.5 rounded-xl text-center text-[10px] font-medium border ${
                    i < Math.min(streak.currentStreak, 7)
                      ? "border-amber/30 bg-amber/10 text-amber"
                      : "border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                  }`}>{d}</div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Badges</p>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { name: "First Session", icon: <Award className="w-5 h-5" />, earned: true, color: "text-teal" },
                  { name: "5-Day Streak", icon: <Flame className="w-5 h-5" />, earned: true, color: "text-amber" },
                  { name: "Multi-Vertical", icon: <Star className="w-5 h-5" />, earned: true, color: "text-violet" },
                  { name: "Early Bird", icon: <Moon className="w-5 h-5" />, earned: false, color: "text-muted-foreground" },
                  { name: "Social", icon: <MessageCircle className="w-5 h-5" />, earned: false, color: "text-muted-foreground" },
                  { name: "Fitness Pro", icon: <Dumbbell className="w-5 h-5" />, earned: false, color: "text-muted-foreground" },
                ].map(badge => (
                  <div key={badge.name}
                    className={`rounded-2xl py-4 flex flex-col items-center gap-2 border bg-white/[0.02] ${
                      badge.earned ? "border-white/[0.12]" : "border-white/[0.06] opacity-40"
                    }`} style={{ boxShadow: badge.earned ? "inset 0 1px 0 rgba(255,255,255,0.04)" : "none" }}>
                    <span className={badge.color} style={badge.earned ? { filter: "drop-shadow(0 0 6px currentColor)" } : {}}>
                      {badge.icon}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Redeem */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Redeem Points</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { name: "R50 Credit", cost: 500, icon: <Wallet className="w-5 h-5" />, color: "text-teal" },
                  { name: "Free Session", cost: 1000, icon: <Gift className="w-5 h-5" />, color: "text-indigo" },
                  { name: "Premium Theme", cost: 250, icon: <Star className="w-5 h-5" />, color: "text-violet" },
                  { name: "Charity", cost: 300, icon: <HeartPulse className="w-5 h-5" />, color: "text-coral" },
                ].map(item => (
                  <motion.button key={item.name} whileTap={{ scale: 0.95 }}
                    className="rounded-2xl py-4 border border-white/[0.08] bg-white/[0.02] flex flex-col items-center gap-2 hover:border-white/[0.16] transition-colors"
                    style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                    <span className={item.color} style={{ filter: "drop-shadow(0 0 6px currentColor)" }}>
                      {item.icon}
                    </span>
                    <span className="text-xs text-foreground font-medium">{item.name}</span>
                    <span className="text-[10px] font-data text-amber">{item.cost} pts</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
      <BionAssistant />
    </div>
  );
};

export default Profile;
