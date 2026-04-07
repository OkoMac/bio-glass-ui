import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import CorporateNav from "@/components/CorporateNav";
import CoachAI from "@/components/CoachAI";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, TrendingUp, Wallet, Star, ChevronRight,
  ArrowUpRight, ArrowDownRight, Zap, Calendar, BarChart2,
  Briefcase, UserPlus, Link2, Plus, X,
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

interface CorporateStats {
  total_employees: number;
  total_budget: number;
  total_spent: number;
  active_providers: number;
  linked_rep: string | null;
}

export default function CorporateDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [stats, setStats] = useState<CorporateStats>({
    total_employees: 0, total_budget: 0, total_spent: 0, active_providers: 0, linked_rep: null,
  });
  const [showRepModal, setShowRepModal] = useState(false);
  const [repCode, setRepCode] = useState("");
  const [repLinking, setRepLinking] = useState(false);

  // Fetch stats from API with timeout fallback
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch("/api/corporate/stats", { signal: controller.signal })
      .then(r => r.json())
      .then(res => {
        if (res.ok && res.data) setStats(res.data);
      })
      .catch(() => {
        // Also try localStorage fallback
        const employees = JSON.parse(localStorage.getItem("bion_corp_employees") || "[]");
        const providers = JSON.parse(localStorage.getItem("bion_corp_providers") || "[]");
        const rep = localStorage.getItem("bion_corp_rep");
        setStats({
          total_employees: employees.length,
          total_budget: employees.reduce((s: number, e: any) => s + (e.monthly_budget || 0), 0),
          total_spent: employees.reduce((s: number, e: any) => s + (e.spent || 0), 0),
          active_providers: providers.length,
          linked_rep: rep ? JSON.parse(rep).name : null,
        });
      })
      .finally(() => clearTimeout(timeout));

    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  const handleLinkRep = () => {
    if (!repCode.trim()) return;
    setRepLinking(true);
    fetch("/api/corporate/rep/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referral_code: repCode }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.ok && res.data) {
          const repName = res.data.rep_name || "Sales Rep";
          setStats(prev => ({ ...prev, linked_rep: repName }));
          localStorage.setItem("bion_corp_rep", JSON.stringify({ name: repName, code: repCode }));
        }
      })
      .catch(() => {
        // Fallback: save locally
        const repName = "Sales Rep (" + repCode + ")";
        setStats(prev => ({ ...prev, linked_rep: repName }));
        localStorage.setItem("bion_corp_rep", JSON.stringify({ name: repName, code: repCode }));
      })
      .finally(() => {
        setRepLinking(false);
        setShowRepModal(false);
        setRepCode("");
      });
  };

  const kpis = [
    { label: "MTD Spend",       value: `R${stats.total_spent.toLocaleString()}`,     trend: "--",   up: true,  icon: Wallet,   color: "#F59E0B" },
    { label: "Employees",       value: String(stats.total_employees),                trend: "--",   up: true,  icon: Users,    color: "#6366F1" },
    { label: "Providers",       value: String(stats.active_providers),               trend: "--",   up: true,  icon: Briefcase,color: "#2DD4BF" },
    { label: "Budget",          value: `R${stats.total_budget.toLocaleString()}`,    trend: "--",   up: true,  icon: Star,     color: "#F05A28" },
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

        {/* Linking sections: Employees, Providers, Sales Rep */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Employees */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo" />
                <p className="text-sm font-semibold text-foreground">Employees</p>
              </div>
              <span className="text-xs font-data font-bold text-foreground">{stats.total_employees}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {stats.total_employees === 0
                ? "No employees linked yet. Invite your team."
                : `${stats.total_employees} employee${stats.total_employees !== 1 ? "s" : ""} linked, R${stats.total_budget.toLocaleString()} total budget.`}
            </p>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/corporate/employees")}
              className="w-full py-2 glass-1 rounded-pill text-xs font-medium text-foreground hover:bg-white/5 transition-all flex items-center justify-center gap-1.5">
              Manage <ChevronRight className="w-3 h-3" />
            </motion.button>
          </GlassCard>

          {/* Preferred Providers */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal" />
                <p className="text-sm font-semibold text-foreground">Preferred Providers</p>
              </div>
              <span className="text-xs font-data font-bold text-foreground">{stats.active_providers}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {stats.active_providers === 0
                ? "No preferred providers yet. Curate your list."
                : `${stats.active_providers} approved provider${stats.active_providers !== 1 ? "s" : ""} for your team.`}
            </p>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/corporate/providers")}
              className="w-full py-2 glass-1 rounded-pill text-xs font-medium text-foreground hover:bg-white/5 transition-all flex items-center justify-center gap-1.5">
              Manage <ChevronRight className="w-3 h-3" />
            </motion.button>
          </GlassCard>

          {/* Sales Rep */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-amber" />
                <p className="text-sm font-semibold text-foreground">Sales Rep</p>
              </div>
            </div>
            {stats.linked_rep ? (
              <div className="mb-3">
                <p className="text-sm font-bold text-foreground">{stats.linked_rep}</p>
                <p className="text-[10px] text-muted-foreground">Linked sales representative</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-3">
                No sales rep linked. Enter a referral code to connect.
              </p>
            )}
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setShowRepModal(true)}
              className="w-full py-2 glass-1 rounded-pill text-xs font-medium text-foreground hover:bg-white/5 transition-all flex items-center justify-center gap-1.5">
              {stats.linked_rep ? "Change Rep" : "Link a Sales Rep"} <ChevronRight className="w-3 h-3" />
            </motion.button>
          </GlassCard>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Allocate Credits",  icon: Zap,       path: "/corporate/wallet",     color: "#F59E0B" },
            { label: "Invite Employee",   icon: UserPlus,  path: "/corporate/employees",  color: "#6366F1" },
            { label: "Add Provider",      icon: Plus,      path: "/corporate/providers",  color: "#2DD4BF" },
            { label: "View Analytics",    icon: BarChart2, path: "/corporate/analytics",  color: "#F05A28" },
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

      {/* Sales Rep Link Modal */}
      <AnimatePresence>
        {showRepModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRepModal(false)} className="fixed inset-0 bg-obsidian/70 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-sm rounded-3xl overflow-hidden"
              style={{ background: "rgba(14,14,22,0.97)", backdropFilter: "blur(60px)" }}>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">Link Sales Rep</h3>
                  <button onClick={() => setShowRepModal(false)} className="p-1 rounded-full hover:bg-white/5">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the referral code provided by your sales representative.
                </p>
                <input
                  value={repCode}
                  onChange={e => setRepCode(e.target.value)}
                  placeholder="e.g. REP-ABC123"
                  className="w-full h-10 glass-1 rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                />
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleLinkRep}
                  disabled={repLinking || !repCode.trim()}
                  className="w-full py-3 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {repLinking ? "Linking..." : "Link Rep"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CoachAI />
      <CorporateNav />
    </div>
  );
}
