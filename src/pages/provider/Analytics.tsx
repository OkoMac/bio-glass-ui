import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import SubscriptionGate from "@/components/SubscriptionGate";
import { TrendingUp, TrendingDown, Users, AlertTriangle } from "lucide-react";

type Period = "Week" | "Month" | "Quarter";

const revenueData = {
  Week:    [680, 450, 900, 750, 1100, 820, 1700],
  Month:   [4200, 5100, 4800, 6200, 5900, 7100, 8450],
  Quarter: [18200, 22400, 26800],
};
const labels = {
  Week:    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  Month:   ["W1","W2","W3","W4","W5","W6","W7"],
  Quarter: ["Dec","Jan","Feb"],
};

function SVGChart({ data, color = "#6366F1" }: { data: number[]; color?: string }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const w = 400, h = 100;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 8) - 4,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28 overflow-visible">
      <defs>
        <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0,25,50,75].map(y => (
        <line key={y} x1="0" y1={y} x2={w} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#aGrad)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />
      ))}
    </svg>
  );
}

export default function ProviderAnalytics() {
  const [period, setPeriod] = useState<Period>("Month");
  const data = revenueData[period];
  const totalRevenue  = data.reduce((s, v) => s + v, 0);
  const totalBookings = { Week: 14, Month: 67, Quarter: 194 }[period];

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <SubscriptionGate feature="basicAnalytics" featureName="Analytics" description="Track revenue, bookings, and client metrics to grow your business.">
      <div className="mx-auto max-w-3xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">Business performance overview</p>
          </div>
          <div className="glass-1 rounded-pill p-1 flex">
            {(["Week","Month","Quarter"] as Period[]).map(p => (
              <motion.button key={p} whileTap={{ scale: 0.95 }}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                  period === p ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
                }`}>
                {p}
              </motion.button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Revenue",   value: `R${totalRevenue.toLocaleString()}`, trend: +12, color: "#6366F1" },
            { label: "Bookings",  value: String(totalBookings),               trend: +8,  color: "#2DD4BF" },
            { label: "Occupancy", value: "78%",                               trend: +5,  color: "#FBBF24" },
            { label: "No-shows",  value: "4%",                                trend: -2,  color: "#FB7185" },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlassCard className="p-4">
                <p className="text-[11px] text-muted-foreground mb-1">{k.label}</p>
                <p className="text-xl font-bold font-data text-foreground">{k.value}</p>
                <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-medium ${k.trend > 0 ? "text-teal" : "text-coral"}`}>
                  {k.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(k.trend)}%
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Revenue chart */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Revenue</p>
              <p className="text-2xl font-bold font-data text-foreground">R{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 text-teal text-xs font-semibold">
              <TrendingUp className="w-4 h-4" /> +12%
            </div>
          </div>
          <SVGChart data={data} />
          <div className="flex justify-between mt-1">
            {labels[period].map((l, i) => (
              <span key={i} className="text-[9px] text-muted-foreground">{l}</span>
            ))}
          </div>
        </GlassCard>

        {/* 2-col: top services + client mix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top Services</p>
            <div className="space-y-3">
              {[
                { name: "Personal Training", bookings: 47, color: "#6366F1" },
                { name: "Strength Assessment", bookings: 12, color: "#2DD4BF" },
                { name: "Free Intro", bookings: 8, color: "#A78BFA" },
              ].map((svc, i) => (
                <div key={svc.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-muted-foreground truncate pr-2">{svc.name}</span>
                    <span className="text-xs font-bold text-foreground shrink-0">{svc.bookings}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(svc.bookings / 47) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: svc.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Client Mix</p>
            <div className="space-y-3">
              {[
                { dot: "#6366F1", label: "Returning", value: 24 },
                { dot: "#2DD4BF", label: "New",       value: 6  },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: r.dot }} />
                    <span className="text-xs text-muted-foreground">{r.label}</span>
                  </div>
                  <span className="text-sm font-bold font-data text-foreground">{r.value}</span>
                </div>
              ))}
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg session value</span>
                <span className="text-sm font-bold font-data text-amber">R413</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Retention rate</span>
                <span className="text-sm font-bold font-data text-teal">87%</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Churn risk */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber" />
            <h2 className="text-base font-semibold text-foreground">Churn Risk</h2>
          </div>
          <div className="space-y-2">
            {[
              { name: "Amir K.",   days: 21, risk: "high" },
              { name: "Busisiwe", days: 14,  risk: "medium" },
            ].map(c => (
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
                <span className={`text-[10px] px-2 py-1 rounded-pill ${
                  c.risk === "high" ? "glass-accent-coral text-coral" : "glass-accent-amber text-amber"
                }`}>
                  {c.risk === "high" ? "High risk" : "Medium risk"}
                </span>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Bottom: returning + retention */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="p-4 flex flex-col items-center text-center">
            <Users className="w-6 h-6 text-indigo mb-2" />
            <p className="text-2xl font-bold font-data text-foreground">24</p>
            <p className="text-[11px] text-muted-foreground">Returning clients</p>
          </GlassCard>
          <GlassCard className="p-4 flex flex-col items-center text-center">
            <TrendingUp className="w-6 h-6 text-teal mb-2" />
            <p className="text-2xl font-bold font-data text-foreground">87%</p>
            <p className="text-[11px] text-muted-foreground">Retention rate</p>
          </GlassCard>
        </div>
      </div>

      </SubscriptionGate>
      <BionAssistant />
      <ProviderNav />
    </div>
  );
}
