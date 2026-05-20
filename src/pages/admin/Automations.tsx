import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Loader2, Sparkles, Workflow, CheckCircle2, XCircle, Clock, Eye, AlertTriangle, Play } from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type TriggerType = "booking_confirmed" | "booking_completed" | "no_show" | "new_client" | "manual";

interface Flow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: TriggerType;
  steps: Array<{ type: string; [k: string]: unknown }>;
  enabled: boolean;
  shadow_mode: boolean;
  created_at: string;
  updated_at: string;
}

interface Run {
  id: string;
  flow_id: string;
  trigger_type: string;
  context_type: string | null;
  context_id: string | null;
  current_step_idx: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  next_run_at: string | null;
  shadow_mode: boolean;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  automation_flows?: { name: string | null } | null;
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  booking_confirmed: "Booking confirmed",
  booking_completed: "Booking completed",
  no_show:           "No-show",
  new_client:        "New client",
  manual:            "Manual",
};

const RUN_STATUS_STYLE: Record<Run["status"], { label: string; cls: string; Icon: typeof Clock }> = {
  pending:   { label: "Pending",   cls: "bg-amber-500/15 text-amber-400 border border-amber-500/30",  Icon: Clock },
  running:   { label: "Running",   cls: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30", Icon: Play },
  completed: { label: "Completed", cls: "bg-teal-500/15 text-teal-400 border border-teal-500/30",     Icon: CheckCircle2 },
  failed:    { label: "Failed",    cls: "bg-red-500/15 text-red-400 border border-red-500/30",         Icon: AlertTriangle },
  cancelled: { label: "Cancelled", cls: "bg-white/[0.06] text-muted-foreground border border-white/[0.08]", Icon: XCircle },
};

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" }); }
  catch { return iso; }
}

function relTime(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms)) return "—";
  const min = Math.round(ms / 60_000);
  if (min < 1)    return "just now";
  if (min < 60)   return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24)    return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export default function AdminAutomations() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [flows, setFlows] = useState<Flow[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Initial load + auto-refresh every 30s so admins watching a fresh flow
  // see runs land without manual refresh. Stops if the tab is hidden.
  useEffect(() => {
    if (!session?.access_token) return;
    let cancelled = false;
    const headers = { Authorization: `Bearer ${session.access_token}` };

    const load = async () => {
      try {
        const [flowsRes, runsRes] = await Promise.all([
          fetch(`${API}/api/automations/flows`, { headers }),
          fetch(`${API}/api/automations/runs?limit=50`, { headers }),
        ]);
        const flowsJson = await flowsRes.json().catch(() => ({}));
        const runsJson = await runsRes.json().catch(() => ({}));
        if (cancelled) return;
        if (!flowsRes.ok)
          throw new Error(flowsJson?.error ?? `Couldn't load flows (HTTP ${flowsRes.status})`);
        setFlows(flowsJson?.data ?? []);
        setRuns(runsJson?.data ?? []);
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message ?? "Couldn't load automations", { duration: 8000 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const interval = setInterval(() => {
      if (!document.hidden) void load();
    }, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [session?.access_token]);

  const toggle = async (flow: Flow, patch: { enabled?: boolean; shadow_mode?: boolean }) => {
    if (!session?.access_token) return;
    setToggling(flow.id);
    try {
      const res = await fetch(`${API}/api/automations/flows/${flow.id}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(patch),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      setFlows((prev) => prev.map(f => f.id === flow.id ? { ...f, ...patch } : f));
      toast.success(`Updated "${flow.name}"`);
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't update flow", { duration: 8000 });
    } finally {
      setToggling(null);
    }
  };

  const runsByFlow = useMemo(() => {
    const map = new Map<string, Run[]>();
    for (const r of runs) {
      const arr = map.get(r.flow_id) ?? [];
      arr.push(r);
      map.set(r.flow_id, arr);
    }
    return map;
  }, [runs]);

  if (loading) {
    return (
      <>
        <AdminNav />
        <div className="md:ml-56 min-h-screen pt-16 md:pt-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-coral animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNav />
      <div className="md:ml-56 min-h-screen pt-16 md:pt-0 px-4 md:px-8 py-6 space-y-5">
        <button onClick={() => navigate("/admin/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#F59E0B,#F05A28)" }}>
            <Workflow className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-foreground">Automations</h1>
            <p className="text-[11px] text-muted-foreground">
              WhatsApp flow engine — runs configured sequences in response to events like booking_confirmed.
            </p>
          </div>
        </div>

        {/* Flows table */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Flows</p>
            <p className="text-[10px] text-muted-foreground">{flows.length} configured</p>
          </div>
          {flows.length === 0 ? (
            <p className="p-6 text-xs text-muted-foreground text-center">No flows yet — apply <code className="text-[10px] bg-white/[0.04] px-1 rounded">automation-engine.sql</code> to seed the 24h booking reminder.</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {flows.map((flow) => {
                const flowRuns = runsByFlow.get(flow.id) ?? [];
                const recent = flowRuns[0] ?? null;
                const counts = {
                  pending:   flowRuns.filter(r => r.status === "pending").length,
                  completed: flowRuns.filter(r => r.status === "completed").length,
                  failed:    flowRuns.filter(r => r.status === "failed").length,
                };
                return (
                  <div key={flow.id} className="px-4 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Sparkles className="w-3.5 h-3.5 text-amber" />
                          <p className="text-sm font-medium text-foreground">{flow.name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground border border-white/[0.06]">
                            {TRIGGER_LABELS[flow.trigger_type] ?? flow.trigger_type}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                            flow.enabled
                              ? "bg-teal-500/15 text-teal-400 border-teal-500/30"
                              : "bg-white/[0.04] text-muted-foreground border-white/[0.08]"
                          }`}>
                            {flow.enabled ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {flow.enabled ? "Enabled" : "Disabled"}
                          </span>
                          {flow.shadow_mode && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center gap-1">
                              <Eye className="w-3 h-3" /> Shadow
                            </span>
                          )}
                        </div>
                        {flow.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{flow.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {flow.steps.length} step{flow.steps.length === 1 ? "" : "s"} ·
                          {" "}{flow.steps.map(s => s.type).join(" → ")}
                        </p>
                      </div>

                      {/* Toggle switches */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          disabled={toggling === flow.id}
                          onClick={() => toggle(flow, { enabled: !flow.enabled })}
                          className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                            flow.enabled
                              ? "bg-teal-500/15 text-teal-400 border-teal-500/30 hover:bg-teal-500/25"
                              : "bg-white/[0.04] text-muted-foreground border-white/[0.08] hover:bg-white/[0.06]"
                          } disabled:opacity-50`}
                        >
                          {toggling === flow.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : flow.enabled ? "Disable" : "Enable"}
                        </button>
                        <button
                          disabled={toggling === flow.id}
                          onClick={() => toggle(flow, { shadow_mode: !flow.shadow_mode })}
                          className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                            flow.shadow_mode
                              ? "bg-violet-500/15 text-violet-400 border-violet-500/30 hover:bg-violet-500/25"
                              : "bg-white/[0.04] text-muted-foreground border-white/[0.08] hover:bg-white/[0.06]"
                          } disabled:opacity-50`}
                          title="Shadow mode logs what the step would have done but doesn't actually send WhatsApp."
                        >
                          {flow.shadow_mode ? "Stop shadow" : "Shadow"}
                        </button>
                      </div>
                    </div>

                    {/* Per-flow run snapshot */}
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground pl-5">
                      <span>Runs (last 50): <span className="text-foreground tabular-nums">{flowRuns.length}</span></span>
                      <span>Pending: <span className="text-amber-400 tabular-nums">{counts.pending}</span></span>
                      <span>Completed: <span className="text-teal-400 tabular-nums">{counts.completed}</span></span>
                      <span>Failed: <span className="text-red-400 tabular-nums">{counts.failed}</span></span>
                      {recent && <span>· last run {relTime(recent.created_at)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Recent runs across all flows */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Recent runs</p>
            <p className="text-[10px] text-muted-foreground">{runs.length} most-recent</p>
          </div>
          {runs.length === 0 ? (
            <p className="p-6 text-xs text-muted-foreground text-center">
              No runs yet. Confirm a booking once the engine is enabled — a run will appear here within a minute.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {runs.slice(0, 30).map((r) => {
                const cfg = RUN_STATUS_STYLE[r.status];
                return (
                  <div key={r.id} className="px-4 py-2.5 flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.cls} shrink-0`}>
                      <cfg.Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {r.automation_flows?.name ?? "(deleted flow)"}
                        {r.shadow_mode && <span className="text-violet-400 ml-1 text-[10px]">(shadow)</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {r.trigger_type} · step {r.current_step_idx}
                        {r.context_type && r.context_id ? ` · ${r.context_type}=${r.context_id.slice(0, 8)}` : ""}
                        {r.error_message ? ` · ${r.error_message}` : ""}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground tabular-nums w-24 text-right hidden md:block">
                      {r.next_run_at ? `→ ${fmtTime(r.next_run_at)}` : fmtTime(r.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
