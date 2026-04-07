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

// Simple SVG bar chart
function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  if (data.length === 0) return null;
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

// Data loaded from backend -- empty until real data is connected
const SPEND_DATA: { label: string; value: number }[] = [];

const TOP_PROVIDERS: { name: string; specialty: string; image: string; sessions: number; spend: string; rating: number; vertical: string }[] = [];

const RECENT_ACTIVITY: { emoji: string; text: string; time: string; color: string }[] = [];

const WELLNESS_CATEGORIES: { label: string; pct: number; color: string }[] = [];

export default function CorporateDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");

  const kpis = [
    { label: "MTD Spend",       value: "R0",     trend: "--",   up: true,  icon: Wallet,   color: "#F59E0B" },
    { label: "Employees Active",value: "0 / 0",  trend: "--",   up: true,  icon: Users,    color: "#6366F1" },
    { label: "Sessions MTD",    value: "0",      trend: "--",   up: true,  icon: Calendar, color: "#2DD4BF" },
    { label: "Wellness Score",  value: "0 / 100",trend: "--",   up: true,  icon: Star,     color: "#F05A28" },
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
              Corporate Wellness Dashboard
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
                <p className="text-xs text-muted-foreground">Spend trend</p>
              </div>
              <p className="text-lg font-bold font-data text-amber">R0</p>
            </div>
            {SPEND_DATA.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No spend data yet</p>
            ) : (
              <BarChart data={SPEND_DATA} color="#F59E0B" />
            )}
          </GlassCard>

          {/* Category breakdown */}
          <GlassCard className="p-4">
            <p className="text-sm font-semibold text-foreground mb-4">Spend by Category</p>
            {WELLNESS_CATEGORIES.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No category data yet</p>
            ) : (
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
            )}
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
            {TOP_PROVIDERS.length === 0 ? (
              <GlassCard className="p-4 text-center">
                <p className="text-xs text-muted-foreground">No provider activity yet. Top providers will appear here.</p>
              </GlassCard>
            ) : (
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
            )}
          </div>

          {/* Recent activity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
              <button onClick={() => navigate("/corporate/employees")}
                className="text-[11px] text-indigo font-medium">All employees →</button>
            </div>
            {RECENT_ACTIVITY.length === 0 ? (
              <GlassCard className="p-4 text-center">
                <p className="text-xs text-muted-foreground">No recent activity. Employee bookings will appear here.</p>
              </GlassCard>
            ) : (
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
            )}
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
