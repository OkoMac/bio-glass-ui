/**
 * AdminAlertsPanel — real-time ops alerts list for /admin/dashboard.
 *
 * Pulls /api/admin/metrics/alerts every 60s (tab-visible only), groups alerts
 * by severity, and links each one to its action page. Pairs with AdminOpsStrip
 * above it — AdminOpsStrip shows counts, this panel surfaces the actual rows
 * ops needs to touch today.
 *
 * Token source: same `bion_admin_token` key AdminOpsStrip writes to, so this
 * component doesn't re-prompt — it just renders nothing until a token exists.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import {
  AlertTriangle, Clock, FileText, UserCheck, Shield, DollarSign,
  CheckCircle2, RefreshCw, ChevronRight,
} from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type AlertSeverity = "critical" | "warning" | "info";
type AlertType =
  | "overdue_dispute"
  | "fica_hold_aging"
  | "stale_booking"
  | "unreviewed_claim"
  | "bo_pending_review"
  | "refund_stuck";

interface AdminAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  subtitle: string;
  action_url: string;
  created_at: string;
  age_hours: number;
}

const ICON_BY_TYPE: Record<AlertType, typeof AlertTriangle> = {
  overdue_dispute: AlertTriangle,
  fica_hold_aging: Shield,
  stale_booking: Clock,
  unreviewed_claim: UserCheck,
  bo_pending_review: FileText,
  refund_stuck: DollarSign,
};

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  critical: "bg-coral",
  warning: "bg-amber",
  info: "bg-indigo",
};

const SEVERITY_TEXT: Record<AlertSeverity, string> = {
  critical: "text-coral",
  warning: "text-amber",
  info: "text-indigo-light",
};

const SEVERITY_BG: Record<AlertSeverity, string> = {
  critical: "glass-accent-coral",
  warning: "glass-accent-amber",
  info: "glass-accent-indigo",
};

function fmtAgeShort(hours: number): string {
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminAlertsPanel() {
  // The metrics endpoint switched from the legacy X-Admin-Token header
  // to the Supabase JWT (requireAdmin middleware) months ago, but this
  // component still sent the old header — which is why every admin
  // hit "Missing authorization header" on the dashboard. authFetch
  // injects the right Bearer JWT automatically.
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AdminAlert[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (user?.role !== "admin") return;
    setLoading(true);
    setErr(null);
    try {
      const res = await authFetch(`${API}/api/admin/metrics/alerts`);
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load alerts");
      setAlerts(j.alerts as AdminAlert[]);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load alerts");
    }
    setLoading(false);
  }, [user?.role]);

  // Initial load + 60s auto-refetch (pauses when tab hidden)
  useEffect(() => {
    if (user?.role !== "admin") return;
    refresh();
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 60_000);
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user?.role, refresh]);

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0 };
    for (const a of alerts ?? []) c[a.severity]++;
    return c;
  }, [alerts]);

  // Non-admins never see this panel.
  if (user?.role !== "admin") return null;

  if (err) {
    return (
      <GlassCard className="p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-coral shrink-0" />
        <p className="text-sm text-coral flex-1">Alerts: {err}</p>
        <button onClick={refresh} className="text-xs text-indigo underline" title="Retry" aria-label="Retry">Retry</button>
      </GlassCard>
    );
  }

  if (alerts === null) {
    return (
      <GlassCard className="p-4 flex items-center gap-3">
        <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading operational alerts…</p>
      </GlassCard>
    );
  }

  if (alerts.length === 0) {
    return (
      <GlassCard className="p-6 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-teal shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Nothing needs your attention right now ✓</p>
          <p className="text-xs text-muted-foreground">All queues are healthy.</p>
        </div>
        <button
          onClick={refresh}
          aria-label="Refresh alerts"
          className="p-1.5 glass-1 rounded-full"
         title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </GlassCard>
    );
  }

  // Group for rendering order: critical → warning → info
  const groups: Array<{ sev: AlertSeverity; rows: AdminAlert[] }> = [
    { sev: "critical", rows: alerts.filter(a => a.severity === "critical") },
    { sev: "warning", rows: alerts.filter(a => a.severity === "warning") },
    { sev: "info", rows: alerts.filter(a => a.severity === "info") },
  ];

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-coral" />
          <h3 className="text-sm font-semibold text-foreground">Operational alerts</h3>
          <span className="text-[10px] text-muted-foreground">
            <span className={counts.critical > 0 ? SEVERITY_TEXT.critical : ""}>{counts.critical} critical</span>
            <span className="mx-1">·</span>
            <span className={counts.warning > 0 ? SEVERITY_TEXT.warning : ""}>{counts.warning} warnings</span>
            <span className="mx-1">·</span>
            <span className={counts.info > 0 ? SEVERITY_TEXT.info : ""}>{counts.info} info</span>
          </span>
        </div>
        <button onClick={refresh} className="p-1.5 glass-1 rounded-full" aria-label="Refresh alerts" title="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-2">
        {groups.map(group =>
          group.rows.length === 0 ? null : (
            <div key={group.sev} className="space-y-1.5">
              {group.rows.map((a, i) => {
                const Icon = ICON_BY_TYPE[a.type] ?? AlertTriangle;
                return (
                  <motion.a
                    key={a.id}
                    href={a.action_url}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2) }}
                    className="flex items-center gap-3 glass-1 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[a.severity]}`} aria-hidden />
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${SEVERITY_BG[a.severity]}`}>
                      <Icon className={`w-3.5 h-3.5 ${SEVERITY_TEXT[a.severity]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{a.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {fmtAgeShort(a.age_hours)}
                    </span>
                    <span className="text-[11px] text-indigo flex items-center gap-0.5 shrink-0">
                      View <ChevronRight className="w-3 h-3" />
                    </span>
                  </motion.a>
                );
              })}
            </div>
          ),
        )}
      </div>
    </GlassCard>
  );
}
