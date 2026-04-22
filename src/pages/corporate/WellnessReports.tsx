import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, BarChart3, Users, DollarSign, Calendar,
  TrendingUp, Download, Loader2, Heart, Activity,
  ChevronRight, ClipboardList,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface ReportSummary {
  totalSpend: number;
  totalEmployees: number;
  employeesWhoBooked: number;
  totalBookings: number;
  popularCategories: Array<{ category: string; count: number }>;
  avgSessionsPerEmployee: number;
  engagementRate: number;
  estimatedSickDaysSaved: number;
  estimatedRoi: number;
  trends: Array<{ month: string; bookings: number; spend: number; activeEmployees: number }>;
}

interface EmployeeUsage {
  employeeName: string;
  email: string;
  sessionsBooked: number;
  amountSpent: number;
  lastBooking: string | null;
  topCategory: string | null;
}

export default function WellnessReports() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [employees, setEmployees] = useState<EmployeeUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };

  useEffect(() => { loadReport(); }, [period]);

  async function loadReport() {
    setLoading(true);
    try {
      const [summaryRes, employeeRes] = await Promise.all([
        fetch(`${API}/api/corporate/reports/summary?period=${period}`, { headers }),
        fetch(`${API}/api/corporate/reports/employee-usage`, { headers }),
      ]);
      const summaryData = await summaryRes.json();
      const employeeData = await employeeRes.json();

      if (summaryData.ok) setSummary(summaryData.data);
      if (employeeData.ok) setEmployees(employeeData.data ?? []);
    } catch {}
    setLoading(false);
  }

  async function exportReport() {
    setExporting(true);
    try {
      const res = await fetch(`${API}/api/corporate/reports/export?period=${period}`, { headers });
      const data = await res.json();
      if (data.ok) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bion-wellness-report-${period}-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
    setExporting(false);
  }

  const PERIOD_LABELS = { month: "This Month", quarter: "This Quarter", year: "This Year" };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-20 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/corporate/dashboard")} className="w-9 h-9 glass-2 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Wellness Reports</h1>
            <p className="text-xs text-muted-foreground">ROI insights for your wellness program</p>
          </div>
          <button
            onClick={exportReport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs font-semibold glass-2 text-foreground hover:bg-white/[0.06]"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download
          </button>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          {(["month", "quarter", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                period === p
                  ? "gradient-indigo text-primary-foreground shadow-cta"
                  : "glass-1 text-muted-foreground hover:text-foreground"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* KPI cards */}
        {summary && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-amber" />
                  <span className="text-[10px] text-muted-foreground">Total Spend</span>
                </div>
                <p className="text-xl font-bold text-foreground">R{summary.totalSpend.toLocaleString()}</p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-indigo" />
                  <span className="text-[10px] text-muted-foreground">Total Bookings</span>
                </div>
                <p className="text-xl font-bold text-foreground">{summary.totalBookings}</p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-teal" />
                  <span className="text-[10px] text-muted-foreground">Engagement Rate</span>
                </div>
                <p className="text-xl font-bold text-foreground">{summary.engagementRate}%</p>
                <p className="text-[10px] text-muted-foreground">
                  {summary.employeesWhoBooked}/{summary.totalEmployees} employees
                </p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-coral" />
                  <span className="text-[10px] text-muted-foreground">Sick Days Saved</span>
                </div>
                <p className="text-xl font-bold text-foreground">{summary.estimatedSickDaysSaved}</p>
                <p className="text-[10px] text-muted-foreground">
                  Est. saving: R{summary.estimatedRoi.toLocaleString()}
                </p>
              </GlassCard>
            </div>

            {/* Average sessions per employee */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Sessions / Employee</p>
                  <p className="text-lg font-bold text-foreground">{summary.avgSessionsPerEmployee}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estimated ROI</p>
                  <p className="text-lg font-bold text-teal">R{summary.estimatedRoi.toLocaleString()}</p>
                </div>
              </div>
            </GlassCard>

            {/* Popular categories */}
            {summary.popularCategories.length > 0 && (
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo" />
                  Popular Service Categories
                </h3>
                <div className="space-y-2">
                  {summary.popularCategories.map((cat, i) => {
                    const maxCount = summary.popularCategories[0]?.count || 1;
                    const pct = Math.round((cat.count / maxCount) * 100);
                    return (
                      <div key={cat.category} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24 truncate">{cat.category}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo to-teal"
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground w-8 text-right">{cat.count}</span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Monthly trend chart (simple bar chart) */}
            {summary.trends.length > 0 && (
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal" />
                  Monthly Trends
                </h3>
                <div className="flex items-end gap-2 h-32">
                  {summary.trends.map((t) => {
                    const maxBookings = Math.max(...summary.trends.map((tr) => tr.bookings), 1);
                    const heightPct = Math.max(8, (t.bookings / maxBookings) * 100);
                    return (
                      <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">{t.bookings}</span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPct}%` }}
                          transition={{ duration: 0.6 }}
                          className="w-full rounded-t-lg bg-gradient-to-t from-indigo/60 to-indigo"
                        />
                        <span className="text-[9px] text-muted-foreground">{t.month.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* Employee usage table */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo" />
            Employee Usage
          </h3>
          {employees.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No employee data yet.</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {employees.map((emp) => (
                <GlassCard key={emp.email ?? emp.employeeName} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{emp.employeeName}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span>{emp.sessionsBooked} sessions</span>
                        <span>R{emp.amountSpent.toFixed(0)} spent</span>
                        {emp.topCategory && <span>{emp.topCategory}</span>}
                      </div>
                    </div>
                    {emp.lastBooking && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        Last: {new Date(emp.lastBooking).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
