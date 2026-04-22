import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingUp, Users, Crown, Lock, ArrowRight, Loader2, ArrowLeft } from "lucide-react";

import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { useProviderAnalytics } from "@/hooks/useProviderAnalytics";
import { useSubscription } from "@/hooks/useSubscription";

// ─── Small helpers ─────────────────────────────────────────────────────────
const rand = (n: number) => `R${Math.round(n).toLocaleString()}`;

function KpiTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <GlassCard className="p-4">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold font-data text-foreground">{value}</p>
      <div className="h-1 mt-3 rounded-full" style={{ background: accent, opacity: 0.6 }} />
    </GlassCard>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <TrendingUp className="w-6 h-6 text-muted-foreground/50 mb-2" />
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
}

// ─── Pro gate mini card (inline, not full-page) ────────────────────────────
function ProGate({ title, blurb }: { title: string; blurb: string }) {
  const navigate = useNavigate();
  return (
    <GlassCard className="p-5 text-center">
      <div className="w-10 h-10 rounded-2xl gradient-indigo flex items-center justify-center mx-auto mb-3">
        <Lock className="w-4 h-4 text-white" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4">{blurb}</p>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/pro/billing")}
        className="w-full py-2.5 rounded-2xl text-xs font-semibold text-white gradient-indigo flex items-center justify-center gap-1.5"
      >
        <Crown className="w-3.5 h-3.5" /> Upgrade to Pro <ArrowRight className="w-3.5 h-3.5" />
      </motion.button>
    </GlassCard>
  );
}

// ─── Chart tooltip (glass-styled) ──────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-1 rounded-2xl p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-data text-foreground">
            {typeof p.value === "number" ? rand(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function ProviderAnalytics() {
  const { loading, revenueByMonth, retention, topServices, totals } = useProviderAnalytics();
  const { subscription } = useSubscription();

  // Pro gate — gate retention + top services behind Pro/Elite.
  // Free plan still sees the monthly revenue chart + KPIs (basic tier).
  const tier = subscription?.tier ?? "free";
  const isProOrAbove = tier === "pro" || tier === "elite";

  const hasAnyCompleted = useMemo(
    () => revenueByMonth.some(m => m.completed > 0),
    [revenueByMonth]
  );

  // Data massaged for the top-services bar chart
  const topServicesChartData = useMemo(
    () => topServices.map(s => ({ name: s.name, gross: s.gross, count: s.count })),
    [topServices]
  );

  const retentionChartData = useMemo(() => ([
    { name: "New",       value: retention.new,       fill: "#FBBF24" }, // amber
    { name: "Returning", value: retention.returning, fill: "#2DD4BF" }, // teal
  ]), [retention]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">
              Revenue, retention & top services — last 12 months
            </p>
          </div>
          {!isProOrAbove && (
            <span className="text-[10px] px-2 py-1 rounded-pill glass-accent-amber text-amber">
              Free plan
            </span>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── KPI row ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiTile label="MTD Gross"      value={rand(totals.mtdGross)}     accent="#6366F1" />
              <KpiTile label="MTD Net"        value={rand(totals.mtdNet)}       accent="#2DD4BF" />
              <KpiTile label="Last 30 days"   value={rand(totals.last30dGross)} accent="#A78BFA" />
              <KpiTile label="YTD Gross"      value={rand(totals.ytdGross)}     accent="#FBBF24" />
            </div>

            {/* ── Monthly revenue chart (all tiers) ───────────── */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Monthly Revenue</p>
                  <p className="text-2xl font-bold font-data text-foreground">{rand(totals.ytdGross)}</p>
                  <p className="text-[10px] text-muted-foreground">Year to date</p>
                </div>
              </div>

              {!hasAnyCompleted ? (
                <EmptyState>
                  No completed sessions yet. Complete your first booking to see revenue trends.
                </EmptyState>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByMonth} barCategoryGap={10}>
                      <defs>
                        <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0.25} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} width={40}
                        tickFormatter={(v) => `R${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="gross" name="Gross"     fill="url(#grossGrad)" radius={[6,6,0,0]} />
                      <Bar dataKey="net"   name="Net payout" fill="url(#netGrad)"   radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassCard>

            {/* ── Retention + completed-sessions line (Pro+) ───── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Retention */}
              {isProOrAbove ? (
                <GlassCard className="p-5">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Client retention</p>
                  <div className="flex items-end gap-2 mb-4">
                    <p className="text-4xl font-bold font-data text-teal">{retention.pct}%</p>
                    <p className="text-[10px] text-muted-foreground mb-1.5">returning · last 90d</p>
                  </div>

                  {retention.total === 0 ? (
                    <EmptyState>No completed sessions in the last 90 days.</EmptyState>
                  ) : (
                    <>
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={retentionChartData} layout="vertical" margin={{ left: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={80}
                              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                            <Bar dataKey="value" radius={[0,6,6,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground pt-2 border-t border-white/5 mt-2">
                        <span><span className="text-foreground font-semibold">{retention.total}</span> total</span>
                        <span><span className="text-amber font-semibold">{retention.new}</span> new</span>
                        <span><span className="text-teal font-semibold">{retention.returning}</span> returning</span>
                      </div>
                    </>
                  )}
                </GlassCard>
              ) : (
                <ProGate
                  title="Client retention"
                  blurb="Analytics is a Pro feature (R499/mo). Unlock retention + revenue tracking."
                />
              )}

              {/* Completed sessions trend (always-on quality chart) */}
              <GlassCard className="p-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Completed sessions</p>
                <p className="text-2xl font-bold font-data text-foreground">
                  {revenueByMonth.reduce((s, m) => s + m.completed, 0)}
                </p>
                <p className="text-[10px] text-muted-foreground mb-3">Last 12 months</p>
                {!hasAnyCompleted ? (
                  <EmptyState>No completed sessions yet.</EmptyState>
                ) : (
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueByMonth}>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="completed" name="Sessions" stroke="#A78BFA" strokeWidth={2.5} dot={{ r: 3, fill: "#A78BFA" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* ── Top services (Pro+) ─────────────────────────── */}
            {isProOrAbove ? (
              <GlassCard className="p-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Top services · last 90 days</p>
                {topServicesChartData.length === 0 ? (
                  <EmptyState>No completed bookings in the last 90 days.</EmptyState>
                ) : (
                  <div className="space-y-3">
                    {topServicesChartData.map((svc, i) => {
                      const max = topServicesChartData[0].gross || 1;
                      const colors = ["#6366F1", "#2DD4BF", "#A78BFA", "#FBBF24", "#FB7185"];
                      return (
                        <div key={svc.name + i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-foreground truncate pr-2">{svc.name}</span>
                            <span className="text-xs font-data text-muted-foreground shrink-0">
                              {svc.count} · <span className="text-foreground font-semibold">{rand(svc.gross)}</span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(svc.gross / max) * 100}%` }}
                              transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
                              className="h-full rounded-full"
                              style={{ background: colors[i % colors.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            ) : (
              <ProGate
                title="Top-earning services"
                blurb="See which services drive the most revenue. Upgrade to Pro for R499/mo to unlock."
              />
            )}

            {/* ── Footer snapshot (Free-visible) ──────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-4 flex flex-col items-center text-center">
                <Users className="w-6 h-6 text-indigo mb-2" />
                <p className="text-2xl font-bold font-data text-foreground">
                  {isProOrAbove ? retention.returning : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">Returning clients · 90d</p>
              </GlassCard>
              <GlassCard className="p-4 flex flex-col items-center text-center">
                <TrendingUp className="w-6 h-6 text-teal mb-2" />
                <p className="text-2xl font-bold font-data text-foreground">
                  {isProOrAbove ? `${retention.pct}%` : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">Retention rate</p>
              </GlassCard>
            </div>
          </>
        )}
      </div>

      <BionAssistant />
      <ProviderNav />
    </div>
  );
}
