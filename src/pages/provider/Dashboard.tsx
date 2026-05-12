import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import MarketingLevyCard from "@/components/provider/MarketingLevyCard";
import BoostListingCard from "@/components/provider/BoostListingCard";
import VerificationStatusBanner from "@/components/provider/VerificationStatusBanner";
import EnablePushCard from "@/components/EnablePushCard";
import OnboardingChecklistCard from "@/components/OnboardingChecklistCard";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { getSastGreeting } from "@/lib/greeting";
import {
  CheckCircle, XCircle, MessageSquare, TrendingUp,
  Users, Calendar, AlertTriangle, ChevronRight, ArrowLeft,
} from "lucide-react";

// No longer hardcoded — computed from bookings context below

import { getSASTDateKey } from "../../utils/sastDate";

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getByStatus, confirm, decline, pendingCount } = useBookings();

  const pending  = getByStatus("pending");
  const upcoming = getByStatus("confirmed");
  const completed = getByStatus("completed");

  const parsePrice = (p: string) => parseInt(p.replace(/[^0-9]/g, ""), 10) || 0;

  const todayRevenue = upcoming.filter(b => b.price !== "FREE")
    .reduce((sum, b) => sum + parsePrice(b.price), 0);

  // Monthly earnings from completed bookings (current calendar month)
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthCompleted = completed.filter(b => {
    if (!b.date) return false;
    return new Date(b.date) >= monthStart;
  });
  const monthRevenue = monthCompleted.reduce((sum, b) => sum + parsePrice(b.price), 0);
  const platformFee = Math.round(monthRevenue * 0.05);
  const netEarnings = monthRevenue - platformFee;
  const daysIntoMonth = Math.max(1, new Date().getDate());
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedMonthly = Math.round(netEarnings * (daysInMonth / daysIntoMonth));

  // Active clients = unique client names from all non-declined bookings
  const allBookings = [...pending, ...upcoming, ...completed];
  const uniqueClients = new Set(allBookings.map(b => b.clientName ?? b.providerName).filter(Boolean));
  const activeClientCount = uniqueClients.size;

  // Today's sessions = confirmed bookings for today
  const today = getSASTDateKey();
  const todaySessions = upcoming.filter(b => b.date === today);

  // Churn risk — clients who haven't booked recently (computed from completed bookings)
  const churnRisk = (() => {
    const clientLastBooking = new Map<string, string>();
    completed.forEach(b => {
      const name = b.clientName ?? "Unknown";
      const existing = clientLastBooking.get(name);
      if (!existing || b.date > existing) clientLastBooking.set(name, b.date);
    });
    const now = Date.now();
    return Array.from(clientLastBooking.entries())
      .map(([name, date]) => {
        const ts = new Date(date).getTime();
      if (isNaN(ts)) return null;
      const days = Math.floor((now - ts) / 86_400_000);
        return { name, days, risk: days > 30 ? "high" as const : "medium" as const };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null && c.days > 14)
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);
  })();

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-5xl xl:max-w-7xl px-4 md:px-8 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate(-1)} className="shrink-0 md:hidden w-9 h-9 mt-0.5 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs text-muted-foreground">{getSastGreeting()} 👋</p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{user?.name ?? "Provider"}</h1>
              <p className="text-xs text-muted-foreground">
                {pending.length > 0 ? `${pending.length} request${pending.length > 1 ? "s" : ""} waiting` : "All caught up"}
              </p>
            </div>
          </div>
          <button onClick={logout} className="text-[10px] text-muted-foreground glass-1 px-3 py-1.5 rounded-pill">Sign out</button>
        </div>

        {/* Verification / bank-connect status — surfaces anything blocking bookable state */}
        <VerificationStatusBanner />

        {/* Web-push opt-in — dismissible, only renders when supported + not yet subscribed */}
        <EnablePushCard role="provider" profileId={user?.profileId ?? null} />

        {/* Onboarding checklist — nudges providers to complete services, bank, bio, avatar */}
        <OnboardingChecklistCard role="provider" />

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Today's revenue", value: `R${todayRevenue.toLocaleString()}`, icon: TrendingUp, color: "#6366F1" },
            { label: "Sessions today",  value: String(todaySessions.length),          icon: Calendar,  color: "#2DD4BF" },
            { label: "Active clients",  value: String(activeClientCount),             icon: Users,     color: "#FBBF24" },
            { label: "Pending requests",value: String(pendingCount),                  icon: AlertTriangle, color: "#FB7185" },
          ].map((k, i) => (
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

        {/* Monthly Earnings Summary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">This Month Earnings</p>
                <h2 className="text-2xl font-bold text-foreground mt-1">R{netEarnings.toLocaleString()}</h2>
                <p className="text-[11px] text-muted-foreground mt-1">{monthCompleted.length} completed session{monthCompleted.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Projected</p>
                <p className="text-sm font-bold text-teal font-data">R{projectedMonthly.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/[0.06]">
              <div>
                <p className="text-[10px] text-muted-foreground">Gross</p>
                <p className="text-sm font-semibold text-foreground font-data">R{monthRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Platform fee</p>
                <p className="text-sm font-semibold text-coral font-data">-R{platformFee.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Net payout</p>
                <p className="text-sm font-semibold text-teal font-data">R{netEarnings.toLocaleString()}</p>
              </div>
            </div>

            <button onClick={() => navigate("/pro/billing")}
              className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 glass-1 rounded-pill text-xs font-medium text-indigo hover:bg-white/[0.04] transition-colors">
              View payouts & bank details <ChevronRight className="w-3 h-3" />
            </button>
          </GlassCard>
        </motion.div>

        {/* Pending booking requests */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Booking Requests</h2>
                <span className="text-[10px] px-1.5 py-0.5 glass-accent-amber text-amber rounded-pill">{pending.length}</span>
              </div>
              <button onClick={() => navigate("/pro/bookings")} className="text-xs text-indigo">View all →</button>
            </div>
            <div className="space-y-2">
              {pending.slice(0, 3).map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={b.clientImage} alt={b.clientName} className="w-9 h-9 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{b.clientName}</p>
                        <p className="text-[11px] text-muted-foreground">{b.service} · {b.date} at {b.time}</p>
                        <p className="text-[10px] text-indigo font-medium">{b.price} · {b.duration}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => confirm(b.id)}
                        className="flex-1 py-2 glass-accent-teal rounded-pill text-xs font-semibold text-teal flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Accept
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => decline(b.id)}
                        className="flex-1 py-2 glass-accent-coral rounded-pill text-xs font-medium text-coral flex items-center justify-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/pro/messages")}
                        className="p-2 glass-1 rounded-pill text-muted-foreground">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Today's schedule */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Today's Schedule</h2>
            <button onClick={() => navigate("/pro/schedule")} className="text-xs text-indigo">Full calendar →</button>
          </div>
          <div className="space-y-2">
            {todaySessions.length > 0 ? todaySessions.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <GlassCard className="p-3 flex items-center gap-3">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-xs font-bold font-data text-foreground">{s.time}</p>
                    <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${s.status === "confirmed" ? "bg-teal" : "bg-amber"}`} />
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <BioAvatar src={s.clientImage} alt={s.clientName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.clientName}</p>
                    <p className="text-[11px] text-muted-foreground">{s.service}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </GlassCard>
              </motion.div>
            )) : (
              <GlassCard className="p-6 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No sessions scheduled today</p>
                <p className="text-xs text-muted-foreground mt-1">Your schedule will populate as clients book with you.</p>
              </GlassCard>
            )}
          </div>
        </section>

        {/* Churn risk */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber" />
            <h2 className="text-base font-semibold text-foreground">Churn Risk</h2>
          </div>
          <div className="space-y-2">
            {churnRisk.length > 0 ? churnRisk.map(c => (
              <GlassCard key={c.name} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full glass-2 flex items-center justify-center text-xs font-bold text-foreground">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.days} days since last booking</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-1 rounded-pill ${c.risk === "high" ? "glass-accent-coral text-coral" : "glass-accent-amber text-amber"}`}>
                    {c.risk === "high" ? "High risk" : "Medium"}
                  </span>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/pro/messages")}
                    className="p-1.5 glass-1 rounded-full">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo" />
                  </motion.button>
                </div>
              </GlassCard>
            )) : (
              <GlassCard className="p-4 text-center">
                <p className="text-sm text-muted-foreground">No at-risk clients</p>
              </GlassCard>
            )}
          </div>
        </section>

        {/* Acquisition marketing (5% levy + voucher pool) */}
        <MarketingLevyCard />

        {/* Boost listing — spotlight purchase */}
        <BoostListingCard />

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Clients",     path: "/pro/clients",   color: "#6366F1" },
            { label: "Services",    path: "/pro/services",  color: "#2DD4BF" },
            { label: "Analytics",  path: "/pro/analytics", color: "#FBBF24" },
            { label: "Availability",path: "/pro/availability", color: "#A78BFA" },
          ].map(q => (
            <GlassCard key={q.label} hover className="p-4 cursor-pointer" onClick={() => navigate(q.path)}>
              <p className="text-sm font-medium text-foreground">{q.label}</p>
              <ChevronRight className="w-4 h-4 mt-1" style={{ color: q.color }} />
            </GlassCard>
          ))}
        </div>
      </div>

      <BionAssistant />
      <ProviderNav />
    </div>
  );
}
