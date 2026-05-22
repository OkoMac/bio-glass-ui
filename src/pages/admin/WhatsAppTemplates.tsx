import { useState, useEffect, useMemo, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import WhatsAppCRMTabs from "@/components/WhatsAppCRMTabs";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, RefreshCw, FileText, CheckCircle2, AlertTriangle, Clock, Pause, Slash, Search, Plus } from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Template {
  meta_template_id: string;
  name: string;
  language: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION" | "OTP" | "UNKNOWN";
  status: "APPROVED" | "PENDING" | "REJECTED" | "DISABLED" | "PAUSED" | "UNKNOWN";
  components: Array<{ type: string; text?: string; format?: string; [k: string]: unknown }>;
  parameter_count: number;
  rejection_reason: string | null;
  quality_score: string | null;
  synced_at: string;
  updated_at: string;
}

const STATUS_STYLE: Record<Template["status"], { label: string; cls: string; Icon: typeof Clock }> = {
  APPROVED: { label: "Approved", cls: "bg-teal-500/15 text-teal-400 border-teal-500/30", Icon: CheckCircle2 },
  PENDING:  { label: "Pending",  cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", Icon: Clock },
  REJECTED: { label: "Rejected", cls: "bg-red-500/15 text-red-400 border-red-500/30", Icon: AlertTriangle },
  DISABLED: { label: "Disabled", cls: "bg-white/[0.06] text-muted-foreground border-white/[0.08]", Icon: Slash },
  PAUSED:   { label: "Paused",   cls: "bg-violet-500/15 text-violet-400 border-violet-500/30", Icon: Pause },
  UNKNOWN:  { label: "Unknown",  cls: "bg-white/[0.06] text-muted-foreground border-white/[0.08]", Icon: AlertTriangle },
};

const CATEGORY_STYLE: Record<Template["category"], string> = {
  UTILITY:        "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  MARKETING:      "bg-coral/15 text-coral border-coral/30",
  AUTHENTICATION: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  OTP:            "bg-violet-500/15 text-violet-400 border-violet-500/30",
  UNKNOWN:        "bg-white/[0.06] text-muted-foreground border-white/[0.08]",
};

function bodyText(components: Template["components"]): string {
  const body = components.find(c => String(c.type).toUpperCase() === "BODY");
  return String(body?.text ?? "");
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1)  return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24)  return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

export default function AdminWhatsAppTemplates() {
  const { session } = useAuth();
  const headers = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {};
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
  }, [session?.access_token]);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Template["status"] | "ALL">("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API}/api/whatsapp/templates`, { headers });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      setTemplates(j?.data ?? []);
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't load templates", { duration: 8000 });
    } finally {
      setLoading(false);
    }
  }, [headers, session?.access_token]);

  useEffect(() => { void load(); }, [load]);

  const sync = async () => {
    setSyncing(true);
    const tId = toast.loading("Syncing templates from Meta…");
    try {
      const res = await fetch(`${API}/api/whatsapp/templates/sync`, { method: "POST", headers });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      await load();
      toast.success(`Synced ${j.synced ?? 0} templates`, { id: tId });
    } catch (err: any) {
      toast.error(err?.message ?? "Sync failed", { id: tId, duration: 10000 });
    } finally {
      setSyncing(false);
    }
  };

  const createCanonical = async () => {
    if (!confirm("Submit the 7 canonical BION templates to Meta for review? Meta will approve UTILITY ones within minutes; MARKETING ones can take longer.")) return;
    setCreating(true);
    const tId = toast.loading("Submitting templates to Meta…");
    try {
      const res = await fetch(`${API}/api/whatsapp/templates/submit-canonical`, { method: "POST", headers });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      const succ = j.succeeded ?? 0;
      const total = j.submitted ?? 0;
      const failed = (j.results ?? []).filter((r: any) => !r.ok);
      // Wait a beat then sync so the new templates show up in the list with PENDING status
      await new Promise(r => setTimeout(r, 1500));
      await fetch(`${API}/api/whatsapp/templates/sync`, { method: "POST", headers }).catch((e: unknown) => console.warn("[WhatsAppTemplates] sync:", e instanceof Error ? e.message : String(e)));
      await load();
      if (failed.length > 0) {
        toast.warning(
          `${succ}/${total} submitted; ${failed.length} rejected. First error: ${failed[0]?.error ?? "?"}`,
          { id: tId, duration: 12000 },
        );
      } else {
        toast.success(`Submitted ${succ}/${total} templates to Meta. They'll appear with PENDING status until approved.`, { id: tId, duration: 10000 });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Submission failed", { id: tId, duration: 10000 });
    } finally {
      setCreating(false);
    }
  };

  const counts = useMemo(() => {
    return {
      total:     templates.length,
      approved:  templates.filter(t => t.status === "APPROVED").length,
      pending:   templates.filter(t => t.status === "PENDING").length,
      rejected:  templates.filter(t => t.status === "REJECTED").length,
    };
  }, [templates]);

  const filtered = useMemo(() => {
    let list = templates;
    if (statusFilter !== "ALL") list = list.filter(t => t.status === statusFilter);
    if (q) {
      const lo = q.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(lo) ||
        bodyText(t.components).toLowerCase().includes(lo),
      );
    }
    return list;
  }, [templates, statusFilter, q]);

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
        <WhatsAppCRMTabs />

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#10B981,#0D9488)" }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-foreground">WhatsApp Templates</h1>
            <p className="text-[11px] text-muted-foreground">
              Meta-approved message templates. Sync pulls the latest list from Meta Cloud API.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={createCanonical} disabled={creating || syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-teal-500/15 text-teal-400 border border-teal-500/30 hover:bg-teal-500/25 text-xs font-medium disabled:opacity-50"
              title="Submits 7 BION canonical templates to Meta. Any already approved are skipped — Meta returns 'already exists' for duplicates.">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {creating ? "Submitting…" : "Submit canonical set"}
            </button>
            <button onClick={sync} disabled={syncing || creating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-coral/15 text-coral border border-coral/30 hover:bg-coral/25 text-xs font-medium disabled:opacity-50">
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {syncing ? "Syncing…" : "Sync from Meta"}
            </button>
          </div>
        </div>

        {/* Counts strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button onClick={() => setStatusFilter("ALL")}
            className={`p-3 rounded-2xl border text-left transition-colors ${
              statusFilter === "ALL" ? "bg-white/[0.06] border-white/[0.16]" : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
            }`}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</p>
            <p className="text-xl font-semibold text-foreground tabular-nums">{counts.total}</p>
          </button>
          {(["APPROVED", "PENDING", "REJECTED"] as const).map((s) => {
            const cfg = STATUS_STYLE[s];
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(active ? "ALL" : s)}
                className={`p-3 rounded-2xl border text-left transition-colors ${
                  active ? "bg-white/[0.06] border-white/[0.16]" : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                }`}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <cfg.Icon className="w-3 h-3" /> {cfg.label}
                </p>
                <p className="text-xl font-semibold text-foreground tabular-nums">{counts[s.toLowerCase() as "approved"|"pending"|"rejected"]}</p>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by template name or message text…"
            className="w-full bg-white/[0.02] border border-white/[0.06] rounded-pill pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-coral/40" />
        </div>

        {/* Templates list */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Templates</p>
            <p className="text-[10px] text-muted-foreground">{filtered.length} shown</p>
          </div>
          {filtered.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
              {templates.length === 0 ? (
                <>
                  <p className="text-xs text-foreground font-medium">No templates registered with Meta yet</p>
                  <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                    BION needs approved templates to send business-initiated WhatsApps (booking reminders,
                    confirmations, outreach). Click <span className="text-teal-400">Create canonical templates</span>
                    {" "}above to submit the 7 BION needs in one go — Meta usually approves UTILITY templates within minutes.
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No templates match the current filter.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((t) => {
                const cfg = STATUS_STYLE[t.status];
                const isOpen = expanded === t.meta_template_id;
                const body = bodyText(t.components);
                return (
                  <div key={t.meta_template_id} className="px-4 py-3">
                    <button onClick={() => setExpanded(isOpen ? null : t.meta_template_id)}
                      className="w-full text-left flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-xs font-semibold text-foreground truncate">{t.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.cls}`}>
                            <cfg.Icon className="w-3 h-3" /> {cfg.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORY_STYLE[t.category]}`}>
                            {t.category}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground border border-white/[0.06]">
                            {t.language.toUpperCase()}
                          </span>
                          {t.parameter_count > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {t.parameter_count} var{t.parameter_count === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{body}</p>
                        {t.rejection_reason && (
                          <p className="text-[10px] text-red-400 mt-1">↳ {t.rejection_reason}</p>
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-3 pl-0 space-y-2">
                        {/* Component breakdown */}
                        {t.components.map((c, idx) => {
                          const type = String(c.type).toUpperCase();
                          const text = String(c.text ?? "");
                          if (!text && !c.format) return null;
                          return (
                            <div key={idx} className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
                                {type}{c.format ? ` · ${c.format}` : ""}
                              </p>
                              {text && (
                                <p className="text-[11px] text-foreground whitespace-pre-wrap">{text}</p>
                              )}
                            </div>
                          );
                        })}
                        <p className="text-[10px] text-muted-foreground">
                          ID <code className="text-[10px] bg-white/[0.04] px-1 rounded">{t.meta_template_id}</code>
                          {" · "}quality {t.quality_score ?? "—"}
                          {" · "}synced {relTime(t.synced_at)}
                        </p>
                      </div>
                    )}
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
