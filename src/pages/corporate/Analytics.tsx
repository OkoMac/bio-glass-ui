import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CorporateNav from "@/components/CorporateNav";
import BionAssistant from "@/components/BionAssistant";
import { TrendingUp, TrendingDown, Users, Zap, Target, Award } from "lucide-react";

// SVG line chart
function LineChart({ data, color, height = 80 }: { data: number[]; color: string; height?: number }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 100, h = height;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 8) - 4,
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#grad-${color})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.at(-1)!.x} cy={pts.at(-1)!.y} r="3" fill={color} />
    </svg>
  );
}

const PERIODS = ["Month", "Quarter", "Year"] as const;
type Period = typeof PERIODS[number];

const METRICS: Record<Period, {
  spend: number[]; engagement: number[]; sessions: number[]; score: number[];
  spendLabels: string[]; kpis: { label: string; value: string; trend: string; up: boolean }[];
}> = {
  Month: {
    spend:       [62000, 67000, 71000, 75000, 79500],
    engagement:  [68, 71, 74, 77, 78],
    sessions:    [280, 298, 312, 328, 342],
    score:       [70, 72, 74, 76, 78],
    spendLabels: ["10 Feb","14 Feb","18 Feb","22 Feb","28 Feb"],
    kpis: [
      { label: "Total Spend",         value: "R79,500",  trend: "+12.3%", up: true  },
      { label: "Active Employees",    value: "187",       trend: "+8.1%",  up: true  },
      { label: "Sessions Completed",  value: "342",       trend: "+24.6%", up: true  },
      { label: "Avg Session Cost",    value: "R232",      trend: "-3.2%",  up: false },
    ],
  },
  Quarter: {
    spend:       [195000, 218000, 245000],
    engagement:  [64, 71, 78],
    sessions:    [890, 1010, 1180],
    score:       [68, 73, 78],
    spendLabels: ["Dec","Jan","Feb"],
    kpis: [
      { label: "Total Spend",        value: "R658,000",  trend: "+18.4%", up: true },
      { label: "Active Employees",   value: "193",        trend: "+12.3%", up: true },
      { label: "Sessions Completed", value: "3,080",      trend: "+31.2%", up: true },
      { label: "Avg Session Cost",   value: "R214",       trend: "-5.1%",  up: false },
    ],
  },
  Year: {
    spend:       [48000,52000,58000,61000,67000,71000,68000,75000,72000,79000,82000,79500],
    engagement:  [55,58,60,63,65,68,71,73,74,75,77,78],
    sessions:    [190,210,230,250,270,295,310,318,320,330,338,342],
    score:       [60,62,63,66,68,70,72,73,74,75,77,78],
    spendLabels: ["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb"],
    kpis: [
      { label: "Total Spend",        value: "R883,500",  trend: "+41.2%", up: true },
      { label: "Active Employees",   value: "187",        trend: "+24.7%", up: true },
      { label: "Sessions Completed", value: "3,603",      trend: "+56.8%", up: true },
      { label: "Avg Session Cost",   value: "R245",       trend: "+3.4%",  up: false },
    ],
  },
};

// Department breakdown scales with the selected period.
// Quarter ≈ 3× month · Year ≈ 12× month.
const DEPT_BREAKDOWN_BY_PERIOD: Record<Period, Array<{ dept: string; employees: number; sessions: number; spend: string; score: number }>> = {
  Month: [
    { dept: "Engineering", employees: 52, sessions: 124, spend: "R27,900", score: 82 },
    { dept: "Product",     employees: 31, sessions: 78,  spend: "R17,550", score: 79 },
    { dept: "Finance",     employees: 28, sessions: 56,  spend: "R12,600", score: 71 },
    { dept: "HR",          employees: 18, sessions: 38,  spend: "R8,550",  score: 88 },
    { dept: "Marketing",   employees: 24, sessions: 29,  spend: "R6,525",  score: 64 },
    { dept: "Operations",  employees: 34, sessions: 17,  spend: "R3,825",  score: 52 },
  ],
  Quarter: [
    { dept: "Engineering", employees: 54, sessions: 402, spend: "R90,450",  score: 83 },
    { dept: "Product",     employees: 33, sessions: 255, spend: "R57,375",  score: 78 },
    { dept: "Finance",     employees: 29, sessions: 181, spend: "R40,725",  score: 72 },
    { dept: "HR",          employees: 19, sessions: 124, spend: "R27,900",  score: 86 },
    { dept: "Marketing",   employees: 25, sessions: 94,  spend: "R21,150",  score: 66 },
    { dept: "Operations",  employees: 33, sessions: 56,  spend: "R12,600",  score: 55 },
  ],
  Year: [
    { dept: "Engineering", employees: 55, sessions: 1_480, spend: "R333,000", score: 80 },
    { dept: "Product",     employees: 32, sessions: 935,   spend: "R210,375", score: 76 },
    { dept: "Finance",     employees: 27, sessions: 668,   spend: "R150,300", score: 74 },
    { dept: "HR",          employees: 19, sessions: 456,   spend: "R102,600", score: 85 },
    { dept: "Marketing",   employees: 26, sessions: 348,   spend: "R78,300",  score: 68 },
    { dept: "Operations",  employees: 31, sessions: 204,   spend: "R45,900",  score: 58 },
  ],
};

const INSIGHTS = [
  { emoji: "🔥", text: "Engineering has the highest wellness score (82/100). Consider expanding their budget.", color: "#2DD4BF" },
  { emoji: "⚠️", text: "Operations engagement dropped to 52%. Consider a wellness awareness campaign.", color: "#FBBF24" },
  { emoji: "💪", text: "Fitness is your top category (41%). Personal training bookings up 28% vs last quarter.", color: "#6366F1" },
  { emoji: "💡", text: "Employees who use 3+ service categories have 34% lower sick day rates.", color: "#F05A28" },
];

export default function CorporateAnalytics() {
  const [period, setPeriod] = useState<Period>("Month");
  const data = METRICS[period];

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl xl:max-w-7xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground">Wellness ROI & engagement insights</p>
          </div>
          {/* Period toggle */}
          <div className="glass-1 rounded-pill p-0.5 flex">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                  period === p ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <GlassCard className="p-4">
                <p className="text-xl font-bold font-data text-foreground">{k.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
                <span className={`text-[10px] font-medium flex items-center gap-0.5 mt-1 ${k.up ? "text-teal" : "text-coral"}`}>
                  {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {k.trend} vs last {period.toLowerCase()}
                </span>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Spend trend */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Spend Trend</p>
              <p className="text-xs font-data text-amber">{data.kpis[0].value}</p>
            </div>
            <LineChart data={data.spend} color="#F59E0B" height={80} />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">{data.spendLabels[0]}</span>
              <span className="text-[9px] text-muted-foreground">{data.spendLabels.at(-1)}</span>
            </div>
          </GlassCard>

          {/* Engagement rate */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Engagement Rate</p>
              <p className="text-xs font-data text-teal">{data.engagement.at(-1)}%</p>
            </div>
            <LineChart data={data.engagement} color="#2DD4BF" height={80} />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">{data.spendLabels[0]}</span>
              <span className="text-[9px] text-muted-foreground">{data.spendLabels.at(-1)}</span>
            </div>
          </GlassCard>
        </div>

        {/* Wellness score trend */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Wellness Score</p>
              <p className="text-xs text-muted-foreground">Company-wide health index (0–100)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-data text-foreground">{data.score.at(-1)}</p>
              <p className="text-[10px] text-teal">/ 100</p>
            </div>
          </div>
          <LineChart data={data.score} color="#6366F1" height={60} />
        </GlassCard>

        {/* Department breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Department Breakdown</h2>
          <div className="space-y-2">
            {DEPT_BREAKDOWN_BY_PERIOD[period].map((d, i) => (
              <motion.div key={d.dept} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground">{d.dept}</p>
                        <span className={`text-xs font-bold font-data ${
                          d.score >= 80 ? "text-teal" : d.score >= 65 ? "text-amber" : "text-coral"
                        }`}>{d.score}/100</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-1.5">
                        <span><Users className="w-3 h-3 inline mr-0.5" />{d.employees} employees</span>
                        <span>{d.sessions} sessions</span>
                        <span className="font-data">{d.spend}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${d.score}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ background: d.score >= 80 ? "#2DD4BF" : d.score >= 65 ? "#FBBF24" : "#F05A28" }}
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber" />
            <h2 className="text-sm font-semibold text-foreground">B_ Insights</h2>
          </div>
          <div className="space-y-2">
            {INSIGHTS.map((ins, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="p-3.5">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{ins.emoji}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ins.text}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <BionAssistant />
      <CorporateNav />
    </div>
  );
}
