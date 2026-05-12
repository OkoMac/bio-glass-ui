import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NudgePopup from "@/components/NudgePopup";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ComposedChart,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Crown, Lock, ArrowRight,
  Loader2, ArrowLeft, Eye, CalendarCheck, DollarSign,
  Star, Clock, Lightbulb, BarChart3, UserCheck,
} from "lucide-react";

import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { useProviderAnalytics } from "@/hooks/useProviderAnalytics";
import { useDetailedAnalytics, type Period } from "@/hooks/useDetailedAnalytics";
import { useSubscription } from "@/hooks/useSubscription";

// ─── Small helpers ─────────────────────────────────────────────────────────
const rand = (n: number) => `R${Math.round(n).toLocaleString()}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;
const hourLabel = (h: number) => `${h.toString().padStart(2, "0")}:00`;

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  accent: string;
}) {
  const isPositive = trend?.startsWith("+");
  return (
    <GlassCard className="p-4 relative overflow-hidden">
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}20` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        {trend && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xl font-bold font-data text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: accent, opacity: 0.4 }} />
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

// ─── Pro gate mini card ───────────────────────────────────────────────────
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

// ─── Period selector pills ────────────────────────────────────────────────
function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const options: { label: string; value: Period }[] = [
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "All time", value: "all" },
  ];
  return (
    <div className="flex gap-1 p-0.5 glass-1 rounded-xl w-fit">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            value === o.value
              ? "bg-indigo-500/20 text-indigo-300 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
          }`}
         title="onChange(o.value)} className= `} >" aria-label="onChange(o.value)} className= `} >">
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Chart tooltip (glass-styled) ─────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-1 rounded-2xl p-3 text-xs border border-white/5">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-data text-foreground">
            {p.dataKey === "revenue" ? rand(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── CSS bar (no chart library) ───────────────────────────────────────────
function CssBar({ value, max, color, delay = 0 }: { value: number; max: number; color: string; delay?: number }) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

// ─── Peak hours heatmap ───────────────────────────────────────────────────
function PeakHoursGrid({ hours }: { hours: { hour: number; bookings: number }[] }) {
  const maxBookings = Math.max(...hours.map(h => h.bookings), 1);
  // Show hours 6-21
  const grid = [];
  for (let h = 6; h <= 21; h++) {
    const found = hours.find(x => x.hour === h);
    const count = found?.bookings ?? 0;
    const intensity = count / maxBookings;
    grid.push({ hour: h, count, intensity });
  }
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {grid.map(g => (
        <div
          key={g.hour}
          className="flex flex-col items-center gap-0.5"
          title={`${hourLabel(g.hour)}: ${g.count} bookings`}
        >
          <div
            className="w-full aspect-square rounded-lg transition-colors flex items-center justify-center"
            style={{
              background: g.count > 0
                ? `rgba(99, 102, 241, ${0.15 + g.intensity * 0.7})`
                : "rgba(255,255,255,0.03)",
            }}
          >
            <span className="text-[9px] font-data text-foreground/70">{g.count || ""}</span>
          </div>
          <span className="text-[8px] text-muted-foreground">{g.hour}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Rating bar ───────────────────────────────────────────────────────────
function RatingDistribution({ distribution, total }: { distribution: Record<string, number>; total: number }) {
  const stars = [5, 4, 3, 2, 1];
  const colors: Record<number, string> = { 5: "#22C55E", 4: "#84CC16", 3: "#FBBF24", 2: "#F97316", 1: "#EF4444" };
  return (
    <div className="space-y-2">
      {stars.map(s => {
        const count = distribution[String(s)] ?? 0;
        return (
          <div key={s} className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-4 text-right">{s}</span>
            <Star className="w-3 h-3" style={{ color: colors[s] }} />
            <div className="flex-1">
              <CssBar value={count} max={total || 1} color={colors[s]} delay={0.05 * (5 - s)} />
            </div>
            <span className="text-[11px] font-data text-muted-foreground w-6 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function ProviderAnalytics() {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const { loading: basicLoading, revenueByMonth, retention, topServices, totals } = useProviderAnalytics();

  const tier = subscription?.tier ?? "free";
  const isProOrAbove = tier === "pro" || tier === "elite";

  // Detailed analytics (Pro+ only)
  const { loading: detailedLoading, data: detailed, period, setPeriod } = useDetailedAnalytics();

  const loading = basicLoading || (isProOrAbove && detailedLoading);

  // Composed chart data: daily bookings + revenue overlay
  const dailyChartData = useMemo(() => {
    if (!detailed?.daily_trend) return [];
    return detailed.daily_trend.map(d => ({
      date: d.date.slice(5), // "MM-DD"
      bookings: d.bookings,
      revenue: d.revenue,
    }));
  }, [detailed?.daily_trend]);

  // Peak days chart
  const peakDaysData = useMemo(() => {
    if (!detailed?.peak_days) return [];
    return detailed.peak_days.slice(0, 7);
  }, [detailed?.peak_days]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      {/* Layer 4 nudge — BIONBoost Pro value prop on first analytics visit */}
      <NudgePopup featureKey="provider_boost" />
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">
              {isProOrAbove
                ? "Detailed performance insights for your practice"
                : "Revenue, retention & top services — last 12 months"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isProOrAbove && <PeriodSelector value={period} onChange={setPeriod} />}
            {!isProOrAbove && (
              <span className="text-[10px] px-2 py-1 rounded-pill glass-accent-amber text-amber">
                Free plan
              </span>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && isProOrAbove && detailed && detailed.profile_views && (
          <>
            {/* ── KPI Cards Row ───────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard
                icon={Eye}
                label="Profile Views"
                value={String(detailed.profile_views.today)}
                sub={`${detailed.profile_views.this_month} this month`}
                trend={detailed.profile_views.trend}
                accent="#A78BFA"
              />
              <KpiCard
                icon={CalendarCheck}
                label="Total Bookings"
                value={String(detailed.bookings.total)}
                sub={`${detailed.bookings.completed} completed`}
                accent="#6366F1"
              />
              <KpiCard
                icon={DollarSign}
                label="Revenue"
                value={rand(detailed.revenue.this_month)}
                sub="This month"
                trend={detailed.revenue.trend}
                accent="#2DD4BF"
              />
              <KpiCard
                icon={UserCheck}
                label="Retention Rate"
                value={pct(detailed.clients.returning_rate)}
                sub={`${detailed.clients.total_unique} unique clients`}
                accent="#FBBF24"
              />
            </div>

            {/* ── Bookings & Revenue Trend (Composed) ─────────────── */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Daily Bookings & Revenue</p>
                  <p className="text-lg font-bold font-data text-foreground">
                    {rand(detailed.revenue.total)} total
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Bookings</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400" /> Revenue</span>
                </div>
              </div>
              {dailyChartData.length === 0 ? (
                <EmptyState>No bookings in this period yet.</EmptyState>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dailyChartData} barCategoryGap={4}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} width={30} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} width={40}
                        tickFormatter={(v) => `R${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#2DD4BF" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassCard>

            {/* ── Peak Hours + Peak Days row ──────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Peak hours heatmap */}
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Peak Hours</p>
                </div>
                {detailed.peak_hours.length === 0 ? (
                  <EmptyState>No booking time data yet.</EmptyState>
                ) : (
                  <PeakHoursGrid hours={detailed.peak_hours} />
                )}
              </GlassCard>

              {/* Peak days bar chart */}
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Busiest Days</p>
                </div>
                {peakDaysData.length === 0 ? (
                  <EmptyState>No booking data yet.</EmptyState>
                ) : (
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakDaysData} barCategoryGap={8}>
                        <defs>
                          <linearGradient id="dayGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false}
                          tickFormatter={(v) => v.slice(0, 3)} />
                        <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} width={25} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="bookings" name="Bookings" fill="url(#dayGrad)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* ── Top Clients + Service Popularity ────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top clients table */}
              <GlassCard className="p-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Top Clients</p>
                {detailed.clients.top_clients.length === 0 ? (
                  <EmptyState>No client data yet.</EmptyState>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 text-[9px] text-muted-foreground/60 uppercase tracking-wider pb-1 border-b border-white/5">
                      <span>Name</span>
                      <span className="text-center">Sessions</span>
                      <span className="text-right">Spent</span>
                    </div>
                    {detailed.clients.top_clients.map((c, i) => (
                      <div key={i} className="grid grid-cols-3 items-center py-1.5">
                        <span className="text-xs text-foreground truncate pr-2">{c.name}</span>
                        <span className="text-xs font-data text-muted-foreground text-center">{c.sessions}</span>
                        <span className="text-xs font-data text-foreground text-right">{rand(c.total_spent)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* Service popularity */}
              <GlassCard className="p-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3">Service Popularity</p>
                {detailed.services.most_popular.length === 0 ? (
                  <EmptyState>No service data yet.</EmptyState>
                ) : (
                  <div className="space-y-3">
                    {detailed.services.most_popular.map((svc, i) => {
                      const max = detailed.services.most_popular[0].bookings || 1;
                      const totalBookings = detailed.services.most_popular.reduce((s, x) => s + x.bookings, 0);
                      const pctOfTotal = totalBookings > 0 ? Math.round((svc.bookings / totalBookings) * 100) : 0;
                      const colors = ["#6366F1", "#2DD4BF", "#A78BFA", "#FBBF24", "#FB7185"];
                      return (
                        <div key={svc.name + i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-foreground truncate pr-2">{svc.name}</span>
                            <span className="text-[10px] font-data text-muted-foreground shrink-0">
                              {svc.bookings} bookings · {rand(svc.revenue)} · {pctOfTotal}%
                            </span>
                          </div>
                          <CssBar value={svc.bookings} max={max} color={colors[i % colors.length]} delay={0.08 * i} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* ── Ratings + Quick Stats row ───────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rating distribution */}
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-amber-400" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Ratings</p>
                </div>
                {detailed.ratings.count === 0 ? (
                  <EmptyState>No reviews yet.</EmptyState>
                ) : (
                  <>
                    <div className="flex items-end gap-2 mb-4">
                      <p className="text-4xl font-bold font-data text-foreground">{detailed.ratings.average}</p>
                      <div className="mb-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className="w-3 h-3" style={{
                              color: s <= Math.round(detailed.ratings.average) ? "#FBBF24" : "rgba(255,255,255,0.1)",
                              fill: s <= Math.round(detailed.ratings.average) ? "#FBBF24" : "transparent",
                            }} />
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{detailed.ratings.count} reviews</p>
                      </div>
                    </div>
                    <RatingDistribution distribution={detailed.ratings.distribution} total={detailed.ratings.count} />
                  </>
                )}
              </GlassCard>

              {/* Quick stats grid */}
              <GlassCard className="p-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-4">Quick Stats</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-1 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold font-data text-foreground">{rand(detailed.avg_booking_value)}</p>
                    <p className="text-[10px] text-muted-foreground">Avg Booking Value</p>
                  </div>
                  <div className="glass-1 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold font-data text-foreground">{pct(detailed.no_show_rate)}</p>
                    <p className="text-[10px] text-muted-foreground">No-Show Rate</p>
                  </div>
                  <div className="glass-1 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold font-data text-foreground">{pct(detailed.cancellation_rate)}</p>
                    <p className="text-[10px] text-muted-foreground">Cancellation Rate</p>
                  </div>
                  <div className="glass-1 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold font-data text-foreground">{detailed.clients.new_this_month}</p>
                    <p className="text-[10px] text-muted-foreground">New Clients</p>
                  </div>
                </div>

                {/* Referral sources */}
                {detailed.referral_sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Traffic Sources</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailed.referral_sources.map(rs => (
                        <span key={rs.source} className="text-[10px] px-2 py-1 rounded-full glass-1 text-muted-foreground">
                          {rs.source}: <span className="text-foreground font-data">{rs.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* ── B_ Insights ────────────────────────────────────── */}
            {detailed.insights.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">B_ Insights</p>
                </div>
                <div className="space-y-2">
                  {detailed.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 py-2 px-3 glass-1 rounded-xl">
                      <span className="text-[10px] mt-0.5 shrink-0 text-amber-400/60">
                        {i + 1}.
                      </span>
                      <p className="text-xs text-foreground/90">{insight}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* ── Booking status breakdown ────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: "Completed", value: detailed.bookings.completed, color: "#22C55E" },
                { label: "Pending", value: detailed.bookings.pending, color: "#FBBF24" },
                { label: "Cancelled", value: detailed.bookings.cancelled, color: "#F97316" },
                { label: "No-Shows", value: detailed.bookings.no_shows, color: "#EF4444" },
                { label: "Total", value: detailed.bookings.total, color: "#6366F1" },
              ].map(s => (
                <GlassCard key={s.label} className="p-3 text-center">
                  <p className="text-lg font-bold font-data" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </GlassCard>
              ))}
            </div>
          </>
        )}

        {/* ── Free-tier fallback (existing basic analytics) ───── */}
        {!loading && !isProOrAbove && (
          <>
            {/* Basic KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard icon={DollarSign} label="MTD Gross" value={rand(totals.mtdGross)} accent="#6366F1" />
              <KpiCard icon={DollarSign} label="MTD Net" value={rand(totals.mtdNet)} accent="#2DD4BF" />
              <KpiCard icon={DollarSign} label="Last 30 days" value={rand(totals.last30dGross)} accent="#A78BFA" />
              <KpiCard icon={DollarSign} label="YTD Gross" value={rand(totals.ytdGross)} accent="#FBBF24" />
            </div>

            {/* Monthly revenue chart */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Monthly Revenue</p>
                  <p className="text-2xl font-bold font-data text-foreground">{rand(totals.ytdGross)}</p>
                  <p className="text-[10px] text-muted-foreground">Year to date</p>
                </div>
              </div>
              {!revenueByMonth.some(m => m.completed > 0) ? (
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
                      <Bar dataKey="gross" name="Gross" fill="url(#grossGrad)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="net" name="Net payout" fill="url(#netGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassCard>

            {/* Pro gate cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProGate
                title="Detailed Analytics"
                blurb="Unlock peak hours, client insights, ratings breakdown, and B_ insights. Upgrade to Pro for R499/mo."
              />
              <ProGate
                title="Client Retention & Traffic"
                blurb="See where your clients come from, retention rates, and top spenders. Pro plan required."
              />
            </div>

            {/* Footer snapshot */}
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-4 flex flex-col items-center text-center">
                <Users className="w-6 h-6 text-indigo mb-2" />
                <p className="text-2xl font-bold font-data text-foreground">--</p>
                <p className="text-[11px] text-muted-foreground">Returning clients</p>
              </GlassCard>
              <GlassCard className="p-4 flex flex-col items-center text-center">
                <TrendingUp className="w-6 h-6 text-teal mb-2" />
                <p className="text-2xl font-bold font-data text-foreground">--</p>
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
