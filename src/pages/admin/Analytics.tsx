import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { TrendingUp, Users, Briefcase, DollarSign } from "lucide-react";

type Period = "Week" | "Month" | "Quarter";

const gmvData = {
  Week:    [42000, 38000, 51000, 47000, 63000, 55000, 78000],
  Month:   [180000, 210000, 195000, 240000, 228000, 310000, 385000],
  Quarter: [820000, 1050000, 1280000],
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
  const data = gmvData[period];
  const total = data.reduce((s, v) => s + v, 0);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

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
            { label: "Platform GMV",   value: `R${(total/1000).toFixed(0)}k`, trend: +22, color: "#6366F1", icon: DollarSign },
            { label: "Active Clients", value: "4,810",                        trend: +14, color: "#2DD4BF", icon: Users },
            { label: "Providers",      value: "284",                           trend: +8,  color: "#FBBF24", icon: Briefcase },
            { label: "Avg Session Val",value: "R485",                          trend: +5,  color: "#A78BFA", icon: TrendingUp },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground">{k.label}</p>
                  <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                </div>
                <p className="text-xl font-bold font-data text-foreground">{k.value}</p>
                <p className="text-[10px] text-teal mt-1">↑ {k.trend}% this {period.toLowerCase()}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* GMV Chart */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Gross Merchandise Value</p>
              <p className="text-2xl font-bold font-data text-foreground">R{total.toLocaleString()}</p>
            </div>
            <span className="text-teal text-xs font-semibold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +22%
            </span>
          </div>
          <SVGChart data={data} />
          <div className="flex justify-between mt-1">
            {labels[period].map((l, i) => (
              <span key={i} className="text-[9px] text-muted-foreground">{l}</span>
            ))}
          </div>
        </GlassCard>

        {/* Top verticals */}
        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Revenue by Vertical</p>
          <div className="space-y-3">
            {[
              { name: "Fitness",      rev: "R520k", pct: 100, color: "#2DD4BF" },
              { name: "Medical",      rev: "R380k", pct: 73,  color: "#6366F1" },
              { name: "Beauty",       rev: "R290k", pct: 56,  color: "#FB7185" },
              { name: "Professional", rev: "R120k", pct: 23,  color: "#FBBF24" },
              { name: "Wellness",     rev: "R80k",  pct: 15,  color: "#A78BFA" },
            ].map((v, i) => (
              <div key={v.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{v.name}</span>
                  <span className="text-xs font-bold text-foreground">{v.rev}</span>
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
        </GlassCard>
      </div>
      <AdminNav />
    </div>
  );
}
