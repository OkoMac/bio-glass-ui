/**
 * /admin/compliance — ops-facing review queue for FICA holds (Ranger
 * withdrawals above R250k) and corporate beneficial-ownership submissions.
 *
 * Reads from the admin metrics queues endpoint (/api/admin/metrics/queues).
 * Approve / reject actions update Supabase directly using the service-role
 * surface via dedicated backend endpoints (coming soon) — for now the admin
 * can at least SEE what's pending and contact the user.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/AdminNav";
import GlassCard from "@/components/GlassCard";
import {
  AlertTriangle, ShieldCheck, Loader2, CheckCircle, XCircle,
  FileText, Users as UsersIcon, Clock, Shield, ScrollText,
ArrowLeft, } from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/relativeTime";
import { AdminMfaProvider, useAdminMfa } from "@/hooks/useAdminMfa";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface FicaHold {
  id: string;
  profile_id: string;
  amount_rand: number;
  ytd_after: number;
  created_at: string;
  status: string;
  // joined (we fetch profile name client-side)
  profile_name?: string;
  profile_email?: string;
}

interface BoSubmission {
  id: string;
  company_name: string;
  monthly_budget_rand: number;
  beneficial_owners: Array<{ full_name: string; id_number: string; ownership_pct: number; position?: string }>;
  bo_status: string;
  bo_submitted_at: string;
}

type Tab = "fica" | "bo" | "audit";

type AuditFilter = "all" | "fica" | "bo" | "sars";

interface AuditEvent {
  id: string;
  actor_profile: string | null;
  event_type: string;
  payload: any;
  created_at: string;
  profile_name: string | null;
}

const FICA_EVENT_TYPES = [
  "ranger_fica_hold",
  "ranger_withdrawal_approved",
  "admin_fica_released",
  "admin_fica_rejected",
];
const BO_EVENT_TYPES = [
  "corporate_bo_submitted",
  "admin_bo_approved",
  "admin_bo_rejected",
];
const SARS_EVENT_TYPES = ["ranger_sars_declared"];

export default function AdminCompliance() {
  return (
    <AdminMfaProvider>
      <AdminComplianceInner />
    </AdminMfaProvider>
  );
}

function AdminComplianceInner() {
  const { mfaProtectedFetch } = useAdminMfa();
  const buildHeaders = async (token: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const h: Record<string, string> = { "Content-Type": "application/json", "X-Admin-Token": token };
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
  };
  return _AdminComplianceBody({ mfaProtectedFetch, buildHeaders });
}

function _AdminComplianceBody({ mfaProtectedFetch, buildHeaders }: { mfaProtectedFetch: (i: RequestInfo, init?: RequestInit) => Promise<Response>; buildHeaders: (t: string) => Promise<Record<string, string>> }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("fica");
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("bion_admin_token") ?? ""; } catch { return ""; }
  });
  const [ficaHolds, setFicaHolds] = useState<FicaHold[]>([]);
  const [boSubmissions, setBoSubmissions] = useState<BoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/metrics/queues`, {
        headers: { "X-Admin-Token": token },
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load");

      const ficaRaw = (j.queues?.fica_holds ?? []) as FicaHold[];
      // Enrich with profile names
      if (ficaRaw.length) {
        const ids = [...new Set(ficaRaw.map(f => f.profile_id))];
        const { data: profiles } = await supabase.from("profiles")
          .select("id, full_name, email").in("id", ids);
        const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
        setFicaHolds(ficaRaw.map(f => ({
          ...f,
          profile_name: (map.get(f.profile_id) as any)?.full_name,
          profile_email: (map.get(f.profile_id) as any)?.email,
        })));
      } else {
        setFicaHolds([]);
      }
      setBoSubmissions((j.queues?.bo_submissions ?? []) as BoSubmission[]);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load compliance queue");
    }
    setLoading(false);
  };

  useEffect(() => { if (token) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

  // ═══ Audit log ═══
  const loadAudit = async (filter: AuditFilter = auditFilter) => {
    if (!token) return;
    setAuditLoading(true);
    try {
      // Backend supports one exact-match event_type filter. For our group
      // filters (fica/bo/sars) we fetch everything and filter client-side so
      // one request covers "all" + any grouping.
      const res = await fetch(`${API}/api/compliance/admin/events?limit=500`, {
        headers: { "X-Admin-Token": token },
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load events");
      const all = (j.events ?? []) as AuditEvent[];
      setAuditEvents(all);
      setAuditFilter(filter);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load audit log");
    }
    setAuditLoading(false);
  };

  useEffect(() => {
    if (token && tab === "audit" && auditEvents.length === 0 && !auditLoading) {
      loadAudit("all");
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [tab, token]);

  const filteredAudit = auditEvents.filter(e => {
    if (auditFilter === "all") return true;
    if (auditFilter === "fica") return FICA_EVENT_TYPES.includes(e.event_type);
    if (auditFilter === "bo")   return BO_EVENT_TYPES.includes(e.event_type);
    if (auditFilter === "sars") return SARS_EVENT_TYPES.includes(e.event_type);
    return true;
  });

  const eventMeta = (e: AuditEvent): { icon: typeof AlertTriangle; color: string; bg: string; summary: string } => {
    const name = e.profile_name ?? (e.actor_profile ? e.actor_profile.slice(0, 8) : "admin");
    const p = e.payload ?? {};
    const rand = (v: any) => `R${Number(v ?? 0).toLocaleString("en-ZA")}`;
    switch (e.event_type) {
      case "ranger_fica_hold":
        return { icon: AlertTriangle, color: "text-amber", bg: "bg-amber/10",
          summary: `FICA hold · ${rand(p.amount_rand)} · ${name}` };
      case "ranger_withdrawal_approved":
        return { icon: CheckCircle, color: "text-teal", bg: "bg-teal/10",
          summary: `Withdrawal auto-approved · ${rand(p.amount_rand)} · ${name}` };
      case "admin_fica_released":
        return { icon: CheckCircle, color: "text-teal", bg: "bg-teal/10",
          summary: `FICA released · ${rand(p.amount_rand)} · withdrawal ${String(p.withdrawal_id ?? "").slice(0, 8)}` };
      case "admin_fica_rejected":
        return { icon: XCircle, color: "text-coral", bg: "bg-coral/10",
          summary: `FICA rejected · ${rand(p.amount_rand)}${p.reason ? ` · ${p.reason}` : ""}` };
      case "corporate_bo_submitted":
        return { icon: FileText, color: "text-indigo", bg: "bg-indigo/10",
          summary: `BO submitted · ${p.owner_count ?? 0} owners · ${p.total_ownership_pct ?? 0}%` };
      case "admin_bo_approved":
        return { icon: CheckCircle, color: "text-teal", bg: "bg-teal/10",
          summary: `BO approved · corporate ${String(p.corporate_id ?? "").slice(0, 8)}` };
      case "admin_bo_rejected":
        return { icon: XCircle, color: "text-coral", bg: "bg-coral/10",
          summary: `BO rejected${p.reason ? ` · ${p.reason}` : ""}` };
      case "ranger_sars_declared":
        return { icon: Shield, color: "text-indigo", bg: "bg-indigo/10",
          summary: `SARS declared · ${name} · tax# ${p.sars_tax_number ?? "—"}` };
      default:
        return { icon: ScrollText, color: "text-muted-foreground", bg: "bg-muted/10",
          summary: `${e.event_type} · ${name}` };
    }
  };

  // All admin actions now route through the backend (compliance.ts admin
  // endpoints) so they hit the auditEvent() trail + send email notifications
  // to the affected user. Previously these wrote directly to Supabase.
  const releaseFicaHold = async (f: FicaHold) => {
    setBusy(f.id);
    try {
      const res = await mfaProtectedFetch(`${API}/api/compliance/admin/fica/release`, {
        method: "POST",
        headers: await buildHeaders(token),
        body: JSON.stringify({ withdrawalId: f.id }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Release failed");
      toast.success(`Released R${f.amount_rand.toLocaleString("en-ZA")} for ${f.profile_name ?? "ranger"}`);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Could not release");
    }
    setBusy(null);
  };

  const rejectFicaHold = async (f: FicaHold) => {
    setBusy(f.id);
    try {
      const res = await mfaProtectedFetch(`${API}/api/compliance/admin/fica/reject`, {
        method: "POST",
        headers: await buildHeaders(token),
        body: JSON.stringify({ withdrawalId: f.id, reason: "Admin rejected" }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Reject failed");
      toast.success("Withdrawal rejected");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Could not reject");
    }
    setBusy(null);
  };

  const approveBo = async (bo: BoSubmission) => {
    setBusy(bo.id);
    try {
      const res = await mfaProtectedFetch(`${API}/api/compliance/admin/bo/approve`, {
        method: "POST",
        headers: await buildHeaders(token),
        body: JSON.stringify({ corporateId: bo.id }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Approve failed");
      toast.success(`${bo.company_name} approved`);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Could not approve");
    }
    setBusy(null);
  };

  const rejectBo = async (bo: BoSubmission) => {
    setBusy(bo.id);
    try {
      const res = await mfaProtectedFetch(`${API}/api/compliance/admin/bo/reject`, {
        method: "POST",
        headers: await buildHeaders(token),
        body: JSON.stringify({ corporateId: bo.id, reason: "Admin rejected" }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Reject failed");
      toast.success(`${bo.company_name} rejected`);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Could not reject");
    }
    setBusy(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
        <AdminNav />
        <div className="max-w-md mx-auto pt-24 px-4">
          <GlassCard className="p-6 space-y-4">
            <h1 className="text-xl font-bold text-foreground">Admin token required</h1>
            <p className="text-sm text-muted-foreground">Paste your ADMIN_SETUP_TOKEN to view the compliance queue.</p>
            <input
              type="password"
              placeholder="ADMIN_SETUP_TOKEN"
              className="w-full h-10 glass-1 rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) { localStorage.setItem("bion_admin_token", v); setToken(v); }
                }
              }}
              autoFocus
            />
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <AdminNav />
      <div className="max-w-5xl mx-auto pt-24 md:pt-8 pb-20 px-4 space-y-5">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo" /> Compliance Queue
            </h1>
            <p className="text-xs text-muted-foreground">FICA holds + Corporate Beneficial-Ownership submissions</p>
          </div>
          <button onClick={load} className="px-3 py-1.5 glass-1 rounded-full text-xs text-foreground">Refresh</button>
        </header>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("fica")}
            className={`px-4 py-2 rounded-pill text-sm font-medium ${tab === "fica" ? "gradient-indigo text-primary-foreground" : "glass-1 text-foreground"}`}
          >
            FICA holds · {ficaHolds.length}
          </button>
          <button
            onClick={() => setTab("bo")}
            className={`px-4 py-2 rounded-pill text-sm font-medium ${tab === "bo" ? "gradient-indigo text-primary-foreground" : "glass-1 text-foreground"}`}
          >
            BO submissions · {boSubmissions.length}
          </button>
          <button
            onClick={() => setTab("audit")}
            className={`px-4 py-2 rounded-pill text-sm font-medium ${tab === "audit" ? "gradient-indigo text-primary-foreground" : "glass-1 text-foreground"}`}
          >
            Audit log · {auditEvents.length}
          </button>
        </div>

        {loading && tab !== "audit" ? (
          <GlassCard className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </GlassCard>
        ) : tab === "fica" ? (
          ficaHolds.length === 0 ? (
            <GlassCard className="p-10 text-center">
              <CheckCircle className="w-8 h-8 text-teal mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No FICA holds pending</p>
              <p className="text-xs text-muted-foreground mt-1">Ranger withdrawals above the R250,000 annual threshold appear here for review.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {ficaHolds.map(f => (
                <GlassCard key={f.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{f.profile_name ?? f.profile_id}</p>
                      <p className="text-xs text-muted-foreground">{f.profile_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold font-data text-foreground">R{Number(f.amount_rand).toLocaleString("en-ZA")}</p>
                      <p className="text-[10px] text-muted-foreground">YTD after: R{Number(f.ytd_after).toLocaleString("en-ZA")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={busy === f.id}
                      onClick={() => releaseFicaHold(f)}
                      className="flex-1 py-2 rounded-pill bg-teal/20 text-teal text-xs font-semibold disabled:opacity-50"
                    >
                      {busy === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Release payout"}
                    </button>
                    <button
                      disabled={busy === f.id}
                      onClick={() => rejectFicaHold(f)}
                      className="flex-1 py-2 rounded-pill bg-coral/20 text-coral text-xs font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        ) : tab === "bo" ? (
          // BO tab
          boSubmissions.length === 0 ? (
            <GlassCard className="p-10 text-center">
              <UsersIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No BO submissions pending</p>
              <p className="text-xs text-muted-foreground mt-1">Corporate accounts with monthly budgets above R50,000 must declare beneficial owners here.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {boSubmissions.map(bo => (
                <GlassCard key={bo.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-indigo" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{bo.company_name}</p>
                      <p className="text-xs text-muted-foreground">Monthly budget R{Number(bo.monthly_budget_rand ?? 0).toLocaleString("en-ZA")} · submitted {bo.bo_submitted_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {(bo.beneficial_owners ?? []).map((b, i) => (
                      <div key={i} className="text-xs text-foreground flex items-center justify-between glass-1 rounded-xl px-3 py-2">
                        <span>
                          <strong>{b.full_name}</strong>
                          {b.position ? ` · ${b.position}` : ""}
                        </span>
                        <span className="text-muted-foreground font-data">ID {b.id_number} · {b.ownership_pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={busy === bo.id}
                      onClick={() => approveBo(bo)}
                      className="flex-1 py-2 rounded-pill bg-teal/20 text-teal text-xs font-semibold disabled:opacity-50"
                    >
                      {busy === bo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Approve"}
                    </button>
                    <button
                      disabled={busy === bo.id}
                      onClick={() => rejectBo(bo)}
                      className="flex-1 py-2 rounded-pill bg-coral/20 text-coral text-xs font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        ) : (
          // Audit log tab
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={auditFilter}
                onChange={e => setAuditFilter(e.target.value as AuditFilter)}
                className="h-9 glass-1 rounded-xl px-3 text-xs text-foreground bg-transparent outline-none"
              >
                <option value="all" className="bg-obsidian">All events</option>
                <option value="fica" className="bg-obsidian">FICA only</option>
                <option value="bo" className="bg-obsidian">BO only</option>
                <option value="sars" className="bg-obsidian">SARS only</option>
              </select>
              <button
                onClick={() => loadAudit(auditFilter)}
                disabled={auditLoading}
                className="px-3 h-9 glass-1 rounded-xl text-xs text-foreground disabled:opacity-50 flex items-center gap-1.5"
              >
                {auditLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                Refresh
              </button>
              <span className="text-[10px] text-muted-foreground ml-auto">
                Showing {filteredAudit.length} of {auditEvents.length} events
              </span>
            </div>

            {auditLoading && auditEvents.length === 0 ? (
              <GlassCard className="p-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </GlassCard>
            ) : filteredAudit.length === 0 ? (
              <GlassCard className="p-10 text-center">
                <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">No compliance events yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Events are written whenever a FICA hold, BO submission, SARS declaration, or admin decision happens.
                </p>
              </GlassCard>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-2">
                <AnimatePresence initial={false}>
                  {filteredAudit.map((e, idx) => {
                    const meta = eventMeta(e);
                    const Icon = meta.icon;
                    return (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, delay: Math.min(idx * 0.01, 0.15) }}
                      >
                        <GlassCard className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-4 h-4 ${meta.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{meta.summary}</p>
                              <p className="text-[10px] text-muted-foreground font-data mt-0.5">
                                {e.event_type} · {formatRelativeTime(e.created_at)}
                              </p>
                              <details className="mt-1.5 group">
                                <summary className="text-[10px] text-indigo cursor-pointer select-none list-none group-open:mb-1.5">
                                  View payload
                                </summary>
                                <pre className="text-[10px] text-muted-foreground font-data glass-1 rounded-xl p-2 overflow-x-auto whitespace-pre-wrap break-all">
{JSON.stringify(e.payload ?? {}, null, 2)}
                                </pre>
                              </details>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
