import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import CorporateNav from "@/components/CorporateNav";
import CoachAI from "@/components/CoachAI";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, TrendingUp, Wallet, Star, ChevronRight,
  ArrowUpRight, ArrowDownRight, Zap, Calendar, BarChart2,
} from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

// Simple SVG bar chart
function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * 72}px` }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
            className="w-full rounded-t-sm"
            style={{ background: color, opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.6 }}
          />
          <span className="text-[8px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

const SPEND_DATA = [
  { label: "Aug", value: 42000 },
  { label: "Sep", value: 51000 },
  { label: "Oct", value: 48000 },
  { label: "Nov", value: 63000 },
  { label: "Dec", value: 55000 },
  { label: "Jan", value: 71000 },
  { label: "Feb", value: 79500 },
];

const TOP_PROVIDERS = [
  { name: "Lisa Dlamini",      specialty: "Personal Trainer",    image: provider1, sessions: 147, spend: "R66,150", rating: 4.9, vertical: "teal" },
  { name: "Dr. Kagiso Sithole",specialty: "Biokineticist",       image: provider2, sessions: 89,  spend: "R44,500", rating: 4.8, vertical: "indigo" },
  { name: "Sarah Chen",        specialty: "Skincare Specialist", image: provider3, sessions: 62,  spend: "R27,900", rating: 4.8, vertical: "coral" },
  { name: "Amir Patel",        specialty: "Yoga Instructor",     image: provider4, sessions: 44,  spend: "R22,000", rating: 4.7, vertical: "amber" },
];

const RECENT_ACTIVITY = [
  { emoji: "💪", text: "Sipho Mabunda booked Personal Training with Lisa", time: "2m ago",   color: "#2DD4BF" },
  { emoji: "🩺", text: "Naledi Khumalo completed biokineticist session",   time: "15m ago",  color: "#6366F1" },
  { emoji: "✨", text: "Kobus Pretorius booked Signature Facial",          time: "1h ago",   color: "#F05A28" },
  { emoji: "🧘", text: "Thandi Moyo started yoga subscription",            time: "3h ago",   color: "#FBBF24" },
  { emoji: "📋", text: "Lisa Dlamini uploaded 3 workout plans",            time: "Yesterday",color: "#2DD4BF" },
];

const WELLNESS_CATEGORIES = [
  { label: "Fitness",     pct: 41, color: "#2DD4BF" },
  { label: "Medical",     pct: 28, color: "#6366F1" },
  { label: "Beauty",      pct: 17, color: "#F05A28" },
  { label: "Wellness",    pct: 10, color: "#FBBF24" },
  { label: "Professional",pct:  4, color: "#94A3B8" },
];

export default function CorporateDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");

  const kpis = [
    { label: "MTD Spend",      value: "R79,500",  trend: "+12%", up: true,  icon: Wallet,     color: "#F59E0B" },
    { label: "Employees Active",value: "187 / 240", trend: "+8%",up: true,  icon: Users,      color: "#6366F1" },
    { label: "Sessions MTD",   value: "342",       trend: "+24%",up: true,  icon: Calendar,   color: "#2DD4BF" },
    { label: "Wellness Score", value: "78 / 100",  trend: "+5pts",up: true, icon: Star,       color: "#F05A28" },
  ];

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl px-4 pt-16 pb-10 md:pt-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good morning, {user?.name.split(" ")[0]} 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Capitec Corporate Wellness — February 2026
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/corporate/employees")}
            className="flex items-center gap-1.5 rounded-pill px-3 py-2 gradient-indigo text-primary-foreground text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" /> Allocate Credits
          </motion.button>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <k.icon className="w-4 h-4" style={{ color: k.color }} />
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 ${k.up ? "text-teal" : "text-coral"}`}>
                    {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {k.trend}
                  </span>
                </div>
                <p className="text-xl font-bold font-data text-foreground">{k.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Spend chart */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Monthly Spend</p>
                <p className="text-xs text-muted-foreground">7-month trend</p>
              </div>
              <p className="text-lg font-bold font-data text-amber">R79,500</p>
            </div>
            <BarChart data={SPEND_DATA} color="#F59E0B" />
          </GlassCard>

          {/* Category breakdown */}
          <GlassCard className="p-4">
            <p className="text-sm font-semibold text-foreground mb-4">Spend by Category</p>
            <div className="space-y-2.5">
              {WELLNESS_CATEGORIES.map(c => (
                <div key={c.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{c.label}</span>
                    <span className="text-xs font-data text-foreground">{c.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: c.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Top providers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Top Providers</h2>
              <button onClick={() => navigate("/corporate/analytics")}
                className="text-[11px] text-indigo font-medium">View all →</button>
            </div>
            <div className="space-y-2">
              {TOP_PROVIDERS.map((p, i) => (
                <motion.div key={p.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard hover className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-9 h-9 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.specialty}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold font-data text-foreground">{p.spend}</p>
                        <p className="text-[9px] text-muted-foreground">{p.sessions} sessions</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
              <button onClick={() => navigate("/corporate/employees")}
                className="text-[11px] text-indigo font-medium">All employees →</button>
            </div>
            <div className="space-y-2">
              {RECENT_ACTIVITY.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <GlassCard className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg shrink-0">{a.emoji}</span>
                      <p className="flex-1 text-xs text-muted-foreground leading-relaxed">{a.text}</p>
                      <span className="text-[9px] text-muted-foreground shrink-0 whitespace-nowrap">{a.time}</span>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Manage Employees", icon: Users,     path: "/corporate/employees", color: "#6366F1" },
            { label: "View Analytics",   icon: BarChart2, path: "/corporate/analytics", color: "#2DD4BF" },
            { label: "BIONWallet",        icon: Wallet,    path: "/corporate/wallet",    color: "#F59E0B" },
            { label: "Settings",         icon: TrendingUp,path: "/corporate/settings",  color: "#F05A28" },
          ].map(q => (
            <motion.button key={q.label} whileTap={{ scale: 0.95 }}
              onClick={() => navigate(q.path)}
              className="p-4 glass-1 rounded-2xl text-left hover:bg-white/5 transition-all">
              <q.icon className="w-5 h-5 mb-2" style={{ color: q.color }} />
              <p className="text-xs font-medium text-foreground">{q.label}</p>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-1" />
            </motion.button>
          ))}
        </div>
      </div>

      <CoachAI />
      <CorporateNav />
    </div>
  );
}
