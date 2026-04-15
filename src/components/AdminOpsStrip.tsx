/**
 * Live ops metrics strip for /admin/dashboard — pulls from the new
 * /api/admin/metrics endpoint and surfaces everything that needs ops action:
 * verification queue, FICA holds, BO submissions, GMV, booking pipeline.
 *
 * Token is stored in localStorage as `bion_admin_token` (same key the
 * /admin/whatsapp page already writes + reads). Prompts for it once.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { useNavigate } from "react-router-dom";
import {
  Users, Briefcase, CheckCircle, Clock, AlertTriangle, ShieldCheck,
  Banknote, TrendingUp, RefreshCw,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Metrics {
  users: { total: number; new_today: number; new_7d: number };
  providers: { verified: number; docs_submitted: number; pending: number };
  bookings: { today: number; paid_total: number; pending: number };
  gmv_rand: { today: number; week: number; month: number };
  compliance: {
    fica_holds_pending: number;
    bo_submissions_pending: number;
    duplicate_signups_blocked_7d: number;
  };
  external_providers: { total: number };
}

function fmtR(n: number): string {
  if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `R${(n / 1_000).toFixed(1)}k`;
  return `R${n.toLocaleString("en-ZA")}`;
}

export default function AdminOpsStrip() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("bion_admin_token") ?? ""; } catch { return ""; }
  });
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    if (!token) return;
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`${API}/api/admin/metrics`, { headers: { "X-Admin-Token": token } });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed");
      setData(j);
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };

  useEffect(() => {
    if (token) refresh();
    const iv = setInterval(() => { if (token) refresh(); }, 60_000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Admin token required for ops metrics</p>
            <p className="text-xs text-muted-foreground">Paste the ADMIN_SETUP_TOKEN — stored in localStorage for this session.</p>
          </div>
          <input
            type="password"
            placeholder="ADMIN_SETUP_TOKEN"
            className="w-64 h-9 glass-1 rounded-xl px-3 text-xs text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
            onKeyDown={e => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value.trim();
                if (v) { localStorage.setItem("bion_admin_token", v); setToken(v); }
              }
            }}
            autoFocus
          />
        </div>
      </GlassCard>
    );
  }

  if (err) {
    return (
      <GlassCard className="p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-coral" />
        <p className="text-sm text-coral flex-1">{err}</p>
        <button onClick={refresh} className="text-xs text-indigo underline">Retry</button>
        <button
          onClick={() => { localStorage.removeItem("bion_admin_token"); setToken(""); }}
          className="text-xs text-muted-foreground underline"
        >Clear token</button>
      </GlassCard>
    );
  }

  if (!data) {
    return (
      <GlassCard className="p-4 flex items-center gap-3">
        <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading ops metrics…</p>
      </GlassCard>
    );
  }

  // Action items the admin needs to touch today
  const actionItems = [
    { label: "Provider verifications", count: data.providers.docs_submitted, icon: Briefcase, path: "/admin/verification", tone: data.providers.docs_submitted > 0 ? "warn" : "ok" },
    { label: "FICA holds",             count: data.compliance.fica_holds_pending,     icon: AlertTriangle, path: "/admin/compliance", tone: data.compliance.fica_holds_pending > 0 ? "alert" : "ok" },
    { label: "BO submissions",         count: data.compliance.bo_submissions_pending, icon: ShieldCheck,   path: "/admin/compliance", tone: data.compliance.bo_submissions_pending > 0 ? "warn" : "ok" },
    { label: "Pending bookings",       count: data.bookings.pending,                  icon: Clock,         path: "/admin/disputes",   tone: "ok" },
  ];

  // Top-line KPIs
  const kpis = [
    { label: "Users total",          value: data.users.total.toLocaleString("en-ZA"),                        delta: `+${data.users.new_today} today` },
    { label: "Verified providers",   value: data.providers.verified.toLocaleString("en-ZA"),                 delta: `${data.providers.pending} pending` },
    { label: "Bookings paid",        value: data.bookings.paid_total.toLocaleString("en-ZA"),                delta: `${data.bookings.today} today` },
    { label: "GMV this month",       value: fmtR(data.gmv_rand.month),                                       delta: `${fmtR(data.gmv_rand.today)} today` },
  ];

  const toneClasses = {
    ok:    "text-teal  bg-teal/10",
    warn:  "text-amber bg-amber/10",
    alert: "text-coral bg-coral/10",
  } as const;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <GlassCard className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{k.label}</p>
              <p className="text-xl font-bold font-data text-foreground mt-0.5">{k.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{k.delta}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Action items — things that need a human */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Needs action</h3>
          <button onClick={refresh} className="p-1.5 glass-1 rounded-full" aria-label="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {actionItems.map(a => {
            const Icon = a.icon;
            const t = toneClasses[a.tone as keyof typeof toneClasses] ?? toneClasses.ok;
            return (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="text-left glass-1 rounded-xl p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-lg font-bold font-data text-foreground">{a.count}</span>
                </div>
                <p className="text-[11px] text-foreground">{a.label}</p>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Small GMV + compliance row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <GlassCard className="p-3 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-teal" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">GMV week</p>
            <p className="text-sm font-bold font-data text-foreground">{fmtR(data.gmv_rand.week)}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-3 flex items-center gap-3">
          <Users className="w-5 h-5 text-indigo" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">New users 7d</p>
            <p className="text-sm font-bold font-data text-foreground">{data.users.new_7d.toLocaleString("en-ZA")}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-3 flex items-center gap-3">
          <Banknote className="w-5 h-5 text-amber" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Dup signups blocked 7d</p>
            <p className="text-sm font-bold font-data text-foreground">{data.compliance.duplicate_signups_blocked_7d}</p>
          </div>
        </GlassCard>
      </div>

      {/* Quick jump to full directory + external-providers */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button onClick={() => navigate("/admin/providers")}      className="px-3 py-1.5 glass-1 rounded-pill text-foreground">Providers ({data.providers.verified + data.providers.pending + data.providers.docs_submitted})</button>
        <button onClick={() => navigate("/admin/whatsapp")}       className="px-3 py-1.5 glass-1 rounded-pill text-foreground">WhatsApp conversations</button>
        <button onClick={() => navigate("/admin/b-queue")}        className="px-3 py-1.5 glass-1 rounded-pill text-foreground">B_ Review Queue</button>
        <button onClick={() => navigate("/admin/disputes")}       className="px-3 py-1.5 glass-1 rounded-pill text-foreground">Disputes</button>
        <span className="px-3 py-1.5 glass-1 rounded-pill text-muted-foreground">Leads: {data.external_providers.total}</span>
      </div>
    </div>
  );
}
