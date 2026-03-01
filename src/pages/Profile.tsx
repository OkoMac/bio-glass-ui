import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import CoachAI from "@/components/CoachAI";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings, BookingStatus } from "@/contexts/BookingsContext";
import { useBioPoints } from "@/hooks/useBioPoints";
import { useStreaks } from "@/hooks/useStreaks";
import {
  Shield, FileText, Star, Award, Flame, Gift,
  ChevronRight, Download, Lock, Heart, Settings,
  LogOut, CreditCard, Bell, Eye, Activity, Trophy
} from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

const connectedProviders = [
  { id: "lisa", name: "Lisa D.", image: provider1, vertical: "teal" as const },
  { id: "kagiso", name: "Kagiso S.", image: provider2, vertical: "indigo" as const },
  { id: "sarah", name: "Sarah C.", image: provider3, vertical: "coral" as const },
  { id: "amir", name: "Amir P.", image: provider4, vertical: "amber" as const },
];

const documents = [
  { name: "Training Plan — Week 3", provider: "Lisa Dlamini", date: "Feb 22", icon: "📋" },
  { name: "Rehab Protocol", provider: "Dr. Kagiso Sithole", date: "Feb 18", icon: "🏥" },
  { name: "Skin Analysis Report", provider: "Sarah Chen", date: "Feb 15", icon: "📄" },
  { name: "Meal Plan — Feb", provider: "Lisa Dlamini", date: "Feb 10", icon: "🥗" },
];

const VERTICAL_PALETTE = ["teal", "indigo", "coral", "amber"] as const;

function statusLabel(s: BookingStatus): string {
  if (s === "pending" || s === "confirmed") return "Upcoming";
  if (s === "completed") return "Completed";
  if (s === "no_show") return "No Show";
  return "Declined";
}

const badges = [
  { name: "First Session", icon: "🎯", earned: true },
  { name: "5-Day Streak", icon: "🔥", earned: true },
  { name: "Multi-Vertical", icon: "🌈", earned: true },
  { name: "Early Bird", icon: "🌅", earned: false },
  { name: "Social Butterfly", icon: "🦋", earned: false },
  { name: "Fitness Pro", icon: "💪", earned: false },
];

const rewardItems = [
  { name: "R50 Wallet Credit", cost: 500, icon: "💰" },
  { name: "Free Session", cost: 1000, icon: "🎁" },
  { name: "Premium Theme", cost: 250, icon: "🎨" },
  { name: "Charity Donation", cost: 300, icon: "❤️" },
];

const Profile = () => {
  const [activeTab, setActiveTab] = useState<"passport" | "rewards">("passport");
  const navigate = useNavigate();
  const { user, logout, switchRole } = useAuth();
  const { bookings } = useBookings();
  const { balance: bioPoints } = useBioPoints();
  const { streak } = useStreaks("booking");

  const bookingHistory = bookings.map((b, i) => ({
    provider: b.providerName ?? b.clientName,
    service:  b.service,
    date:     b.date,
    status:   statusLabel(b.status),
    vertical: VERTICAL_PALETTE[i % VERTICAL_PALETTE.length],
  }));

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-12 space-y-5">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <BioAvatar
            src={provider1}
            alt="Oko"
            size="xl"
            verticalColor="indigo"
            verified
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">{user?.name ?? "Oko Mthembu"}</h1>
            <p className="text-xs text-muted-foreground">Member since Jan 2026</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Shield className="w-3 h-3 text-indigo" />
              <span className="text-xs text-indigo font-medium">Verified</span>
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="glass-1 rounded-pill p-1 flex">
          {(["passport", "rewards"] as const).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 rounded-pill py-2 text-sm font-medium transition-all capitalize ${
                activeTab === tab ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {tab === "passport" ? "BIO Passport" : "Rewards"}
            </motion.button>
          ))}
        </div>

        {activeTab === "passport" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Health Summary */}
            <GlassCard className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Heart className="w-4 h-4 text-coral" />
                  Health Summary
                </h2>
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="glass-1 rounded-pill px-2.5 py-1 text-[10px] text-foreground">No known allergies</span>
                <span className="glass-accent-amber rounded-pill px-2.5 py-1 text-[10px] text-amber">Lactose intolerant</span>
                <span className="glass-1 rounded-pill px-2.5 py-1 text-[10px] text-foreground">Blood Type: O+</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Emergency: +27 82 555 0100</p>
            </GlassCard>

            {/* Connected Providers */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Connected Providers</h2>
              <div className="flex gap-4">
                {connectedProviders.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/provider/${p.id}`)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <BioAvatar src={p.image} alt={p.name} size="md" verticalColor={p.vertical} />
                    <span className="text-[10px] text-muted-foreground">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Documents</h2>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <GlassCard key={doc.name} hover className="p-3 flex items-center gap-3">
                    <span className="text-xl">{doc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{doc.provider} · {doc.date}</p>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Booking History */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Booking History</h2>
              <div className="space-y-2">
                {bookingHistory.map((b, i) => (
                  <GlassCard key={i} className="p-3 flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${
                      b.vertical === "teal" ? "bg-teal" : b.vertical === "indigo" ? "bg-indigo" : b.vertical === "coral" ? "bg-coral" : "bg-amber"
                    }`} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">{b.service}</p>
                      <p className="text-[10px] text-muted-foreground">{b.provider} · {b.date}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-pill ${
                      b.status === "Upcoming" ? "glass-accent-teal text-teal" : "glass-1 text-muted-foreground"
                    }`}>
                      {b.status}
                    </span>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="space-y-1">
              <GlassCard hover className="p-3.5 flex items-center gap-3 cursor-pointer" onClick={() => navigate("/health-profile")}>
                <Activity className="w-4 h-4 text-teal" />
                <div className="flex-1">
                  <span className="text-sm text-foreground">Health Profile</span>
                  <p className="text-[10px] text-muted-foreground">Metrics, goals, medical info & privacy</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </GlassCard>
              <GlassCard hover className="p-3.5 flex items-center gap-3 cursor-pointer" onClick={() => navigate("/challenges")}>
                <Trophy className="w-4 h-4 text-amber" />
                <div className="flex-1">
                  <span className="text-sm text-foreground">Challenges</span>
                  <p className="text-[10px] text-muted-foreground">Join group challenges, earn BIOPoints</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 glass-accent-amber rounded-pill text-amber mr-1">2 active</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </GlassCard>
            </div>

            {/* Settings */}
            <div className="space-y-1">
              {[
                { icon: Bell,       label: "Notifications",   tab: "notifications" },
                { icon: CreditCard, label: "BIOWallet",        tab: "wallet"        },
                { icon: Eye,        label: "Privacy & Data",  tab: "privacy"       },
                { icon: Settings,   label: "Settings",        tab: "account"       },
              ].map((item) => (
                <GlassCard
                  key={item.label}
                  hover
                  className="p-3.5 flex items-center gap-3 cursor-pointer"
                  onClick={() =>
                    item.tab === "wallet" ? navigate("/wallet") :
                    item.tab === "notifications" ? navigate("/notifications") :
                    navigate(`/settings?tab=${item.tab}`)
                  }
                >
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-sm text-foreground">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </GlassCard>
              ))}
              <GlassCard hover className="p-3.5 flex items-center gap-3 cursor-pointer" onClick={() => { switchRole("provider"); navigate("/pro/dashboard"); }}>
                <span className="text-base">💼</span>
                <div className="flex-1">
                  <span className="text-sm text-foreground">Switch to Provider Mode</span>
                  <p className="text-[10px] text-muted-foreground">Manage bookings, clients & revenue</p>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo" />
              </GlassCard>
              <GlassCard hover className="p-3.5 flex items-center gap-3 cursor-pointer" onClick={logout}>
                <LogOut className="w-4 h-4 text-coral" />
                <span className="flex-1 text-sm text-coral">Sign Out</span>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {activeTab === "rewards" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* BIOPoints Hero */}
            <div className="flex flex-col items-center py-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full flex items-center justify-center shadow-glow-amber"
                  style={{ background: "radial-gradient(circle, rgba(251,191,36,0.15), transparent 70%)" }}
                >
                  <div className="text-center">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-4xl font-bold font-data text-amber"
                    >
                      {bioPoints.toLocaleString()}
                    </motion.p>
                    <p className="text-[10px] text-muted-foreground">BIOPoints</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Lifetime earned: 4,820</p>
            </div>

            {/* Streak Card */}
            <GlassCard variant="accent-amber" className="p-4">
              <div className="flex items-center gap-3">
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl"
                >
                  🔥
                </motion.span>
                <div className="flex-1">
                  <p className="text-lg font-bold text-foreground">{streak.currentStreak}-day streak!</p>
                  <p className="text-xs text-muted-foreground">Booking Streak · You're on fire</p>
                </div>
              </div>
              <div className="flex gap-1.5 mt-3">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div
                    key={i}
                    className={`flex-1 py-1.5 rounded-lg text-center text-[10px] font-medium ${
                      i < Math.min(streak.currentStreak, 7) ? "gradient-amber text-obsidian" : "glass-1 text-muted-foreground"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Badges */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Badges</h2>
              <div className="grid grid-cols-3 gap-2">
                {badges.map((badge) => (
                  <GlassCard
                    key={badge.name}
                    className={`p-3 flex flex-col items-center gap-1.5 ${!badge.earned ? "opacity-30" : ""}`}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-[10px] text-foreground text-center">{badge.name}</span>
                    {badge.earned && <div className="w-1 h-1 rounded-full bg-amber animate-pulse-glow" />}
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Rewards Catalogue */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Redeem</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
                {rewardItems.map((item) => (
                  <GlassCard key={item.name} hover className="p-4 w-[140px] shrink-0 flex flex-col items-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-xs font-medium text-foreground text-center">{item.name}</p>
                    <p className="text-[10px] font-data text-amber">{item.cost} pts</p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="rounded-pill px-3 py-1.5 text-[10px] font-semibold gradient-indigo text-primary-foreground w-full text-center"
                    >
                      Redeem
                    </motion.button>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Earn More */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Earn More</h2>
              <div className="space-y-2">
                {[
                  { label: "Refer a Friend", points: 500, progress: 0 },
                  { label: "Book a New Vertical", points: 300, progress: 66 },
                  { label: "Complete Profile", points: 250, progress: 80 },
                ].map((action) => (
                  <GlassCard key={action.label} hover className="p-3.5 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">{action.label}</p>
                      <div className="w-full h-1 rounded-full bg-foreground/5 mt-1.5">
                        <div
                          className="h-full rounded-full gradient-amber"
                          style={{ width: `${action.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-data text-amber shrink-0">+{action.points}</span>
                  </GlassCard>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
      <CoachAI />
    </div>
  );
};

export default Profile;
