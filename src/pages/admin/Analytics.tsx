import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Briefcase, DollarSign, Loader2 } from "lucide-react";

type Period = "Week" | "Month" | "Quarter";

function SVGChart({ data, color = "#6366F1" }: { data: number[]; color?: string }) {
  if (data.length === 0 || data.every(v => v === 0)) {
    return (
      <div className="w-full h-28 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">No chart data yet</p>
      </div>
    );
  }
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const w = 400, h = 100;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 8) - 4,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28">
      <defs>
        <linearGradient id="aGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0,25,50,75].map(y => (
        <line key={y} x1="0" y1={y} x2={w} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#aGrad2)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />)}
    </svg>
  );
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<Period>("Month");
  const [loading, setLoading] = useState(true);

  // Real KPI state
  const [totalGmv, setTotalGmv] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [providerCount, setProviderCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [avgSessionVal, setAvgSessionVal] = useState(0);

  // Chart data from bookings
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);

  // Vertical breakdown
  const [verticalRevenue, setVerticalRevenue] = useState<{ name: string; rev: number; pct: number; color: string }[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load counts
      const [providers, clients, bookingsRes] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "provider"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("bookings").select("id, total_price, booking_date, status"),
      ]);

      setProviderCount(providers.count ?? 0);
      setClientCount(clients.count ?? 0);

      const bookings = bookingsRes.data ?? [];
      setBookingCount(bookings.length);

      // Calculate GMV from completed bookings
      const completedBookings = bookings.filter(b => b.status === "completed");
      const gmv = completedBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
      setTotalGmv(gmv);
      setAvgSessionVal(completedBookings.length > 0 ? Math.round(gmv / completedBookings.length) : 0);

      // Build chart data based on period
      buildChartData(bookings, period);

      // Vertical revenue is not available without a specialty join -- show empty
      setVerticalRevenue([]);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const buildChartData = (bookings: any[], selectedPeriod: Period) => {
    const now = new Date();
    let buckets: { label: string; start: Date; end: Date }[] = [];

    if (selectedPeriod === "Week") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString("en-ZA", { weekday: "short" });
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        buckets.push({ label: dayLabel, start, end });
      }
    } else if (selectedPeriod === "Month") {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 7);
        buckets.push({ label: `W${4 - i}`, start, end });
      }
    } else {
      // Last 3 months
      for (let i = 2; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthLabel = start.toLocaleDateString("en-ZA", { month: "short" });
        buckets.push({ label: monthLabel, start, end });
      }
    }

    const data = buckets.map(bucket => {
      return bookings
        .filter(b => {
          if (!b.booking_date) return false;
          const bd = new Date(b.booking_date);
          return bd >= bucket.start && bd < bucket.end;
        })
        .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    });

    setChartData(data);
    setChartLabels(buckets.map(b => b.label));
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl xl:max-w-7xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
            <p className="text-xs text-muted-foreground">Real-time business performance</p>
          </div>
          <div className="glass-1 rounded-pill p-1 flex">
            {(["Week","Month","Quarter"] as Period[]).map(p => (
              <motion.button key={p} whileTap={{ scale: 0.95 }} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                  period === p ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
                }`}>
                {p}
              </motion.button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Platform GMV",    value: loading ? "..." : `R${totalGmv > 0 ? (totalGmv / 1000).toFixed(0) + "k" : "0"}`, color: "#6366F1", icon: DollarSign },
            { label: "Active Clients",  value: loading ? "..." : String(clientCount),    color: "#2DD4BF", icon: Users },
            { label: "Providers",       value: loading ? "..." : String(providerCount),  color: "#FBBF24", icon: Briefcase },
            { label: "Avg Session Val", value: loading ? "..." : `R${avgSessionVal}`,    color: "#A78BFA", icon: TrendingUp },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground">{k.label}</p>
                  <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                </div>
                <p className="text-xl font-bold font-data text-foreground">{k.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">This {period.toLowerCase()}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* GMV Chart */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Gross Merchandise Value</p>
              <p className="text-2xl font-bold font-data text-foreground">
                {loading ? "..." : `R${totalGmv.toLocaleString()}`}
              </p>
            </div>
            {totalGmv > 0 && (
              <span className="text-teal text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Live
              </span>
            )}
          </div>
          {loading ? (
            <div className="w-full h-28 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <SVGChart data={chartData} />
          )}
          {!loading && chartLabels.length > 0 && (
            <div className="flex justify-between mt-1">
              {chartLabels.map((l, i) => (
                <span key={i} className="text-[9px] text-muted-foreground">{l}</span>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Top verticals */}
        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Revenue by Vertical</p>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : verticalRevenue.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No revenue data yet. Revenue will appear here once bookings with provider specialties are completed.
            </p>
          ) : (
            <div className="space-y-3">
              {verticalRevenue.map((v, i) => (
                <div key={v.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{v.name}</span>
                    <span className="text-xs font-bold text-foreground">R{v.rev.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${v.pct}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.7 }}
                      className="h-full rounded-full" style={{ background: v.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
      <AdminNav />
    </div>
  );
}
