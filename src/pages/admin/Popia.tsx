/**
 * /admin/popia — POPIA §27(1)(b) peer-review queue + IO audit dashboard.
 *
 * Architecture review §3.4 follow-up. Surfaces:
 *   • Pending peer reviews — admin reads of health data still
 *     awaiting a second admin's approval. Self-reviews are excluded
 *     server-side. Approve / Deny actions hit the new endpoints.
 *   • Audit summary — counts by status / scope / emergency for the
 *     IO sign-off (default last 90 days, prep for quarterly review).
 *
 * Auth: requires admin role. The page is gated by RequireAuth in
 * App.tsx; the API endpoints re-check via requireAdmin server-side.
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/AdminNav";
import GlassCard from "@/components/GlassCard";
import {
  ShieldAlert, CheckCircle, XCircle, Loader2, ArrowLeft,
  AlertTriangle, FileText, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/relativeTime";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface PendingReview {
  id: string;
  scope: string;
  justification: string;
  dispute_id: string | null;
  ticket_id: string | null;
  compliance_case_id: string | null;
  is_emergency: boolean;
  read_at: string;
  hours_since_read: number | null;
  reader: { full_name?: string; email?: string } | null;
  client: { full_name?: string; email?: string } | null;
}

interface AuditSummary {
  total: number;
  by_status: Record<string, number>;
  emergency_count: number;
  by_scope: Record<string, number>;
}

interface AuditPayload {
  range: { from: string; to: string };
  summary: AuditSummary;
  recent_denials: Array<{
    id: string;
    scope: string;
    justification: string;
    peer_review_notes: string | null;
    read_at: string;
    peer_reviewed_at: string;
  }>;
}

type Tab = "pending" | "audit";

const PRETTY_STATUS: Record<string, string> = {
  pending:           "Pending",
  approved:          "Approved",
  denied:            "Denied",
  auto_flagged:      "Auto-flagged (24h SLA)",
  emergency_bypass:  "Emergency bypass",
  null:              "Other",
};

const STATUS_COLOR: Record<string, string> = {
  pending:           "text-amber-400",
  approved:          "text-teal",
  denied:            "text-coral",
  auto_flagged:      "text-coral",
  emergency_bypass:  "text-violet",
  null:              "text-muted-foreground",
};

export default function AdminPopia() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<PendingReview[]>([]);
  const [audit, setAudit] = useState<AuditPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [decisionFor, setDecisionFor] = useState<string | null>(null);
  const [denyNotes, setDenyNotes] = useState("");

  const buildHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
  };

  const loadPending = useCallback(async () => {
    try {
      const headers = await buildHeaders();
      const res = await fetch(`${API}/api/popia/admin/peer-reviews/pending`, { headers });
      const j = await res.json();
      if (j.ok) setPending(j.items ?? []);
      else toast.error(j.error ?? "Could not load pending reviews");
    } catch (e: any) {
      toast.error("Network error loading pending reviews");
    }
  }, []);

  const loadAudit = useCallback(async () => {
    try {
      const headers = await buildHeaders();
      const res = await fetch(`${API}/api/popia/admin/audit-summary`, { headers });
      const j = await res.json();
      if (j.ok) setAudit({ range: j.range, summary: j.summary, recent_denials: j.recent_denials ?? [] });
      else toast.error(j.error ?? "Could not load audit summary");
    } catch (e: any) {
      toast.error("Network error loading audit summary");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPending(), loadAudit()]).finally(() => setLoading(false));
  }, [loadPending, loadAudit]);

  const approve = async (id: string) => {
    setDecisionFor(id);
    try {
      const headers = await buildHeaders();
      const res = await fetch(`${API}/api/popia/admin/peer-reviews/${id}/approve`, {
        method: "POST", headers, body: JSON.stringify({}),
      });
      const j = await res.json();
      if (j.ok) {
        toast.success("Approved");
        setPending(p => p.filter(x => x.id !== id));
        loadAudit();
      } else {
        toast.error(j.error ?? "Approve failed");
      }
    } finally {
      setDecisionFor(null);
    }
  };

  const deny = async (id: string) => {
    if (denyNotes.trim().length < 20) {
      toast.error("Denial rationale must be at least 20 characters.");
      return;
    }
    setDecisionFor(id);
    try {
      const headers = await buildHeaders();
      const res = await fetch(`${API}/api/popia/admin/peer-reviews/${id}/deny`, {
        method: "POST", headers, body: JSON.stringify({ notes: denyNotes.trim() }),
      });
      const j = await res.json();
      if (j.ok) {
        toast.success("Denied — flagged for compliance follow-up");
        setPending(p => p.filter(x => x.id !== id));
        setDenyNotes("");
        loadAudit();
      } else {
        toast.error(j.error ?? "Deny failed");
      }
    } finally {
      setDecisionFor(null);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-foreground pb-24">
      <AdminNav />

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back to dashboard
        </button>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-violet" />
            POPIA Peer Review
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Section 27(1)(b) compliance — second-admin review of health-data reads, plus quarterly audit data for the Information Officer.
          </p>
        </div>

        {/* Stat strip */}
        {audit && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Pending now"             value={pending.length}                                  color="text-amber-400" />
            <Stat label={`Total reads (${rangeLabel(audit.range)})`} value={audit.summary.total}          color="text-foreground" />
            <Stat label="Emergency reads"         value={audit.summary.emergency_count}                   color="text-violet" />
            <Stat label="Auto-flagged"            value={audit.summary.by_status.auto_flagged ?? 0}       color="text-coral" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/5">
          {(["pending", "audit"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm transition-colors ${
                tab === t
                  ? "text-foreground border-b-2 border-violet -mb-[1px]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "pending" ? `Pending (${pending.length})` : "Audit summary"}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && tab === "pending" && (
          <div className="space-y-3">
            {pending.length === 0 ? (
              <GlassCard className="p-6 text-center text-sm text-muted-foreground">
                <CheckCircle className="w-8 h-8 text-teal mx-auto mb-2" />
                No pending peer reviews. All admin reads in the last 24h have been approved or are still within SLA.
              </GlassCard>
            ) : (
              <AnimatePresence>
                {pending.map(p => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    <PendingCard
                      review={p}
                      busy={decisionFor === p.id}
                      denyNotes={denyNotes}
                      setDenyNotes={setDenyNotes}
                      onApprove={() => approve(p.id)}
                      onDeny={() => deny(p.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

        {!loading && tab === "audit" && audit && (
          <div className="space-y-4">
            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet" />
                Status distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(audit.summary.by_status)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className={STATUS_COLOR[status] ?? "text-muted-foreground"}>
                        {PRETTY_STATUS[status] ?? status}
                      </span>
                      <span className="font-mono">{count}</span>
                    </div>
                  ))}
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold mb-3">Reads by scope</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {Object.entries(audit.summary.by_scope).length === 0 ? (
                  <p>No reads in window.</p>
                ) : (
                  Object.entries(audit.summary.by_scope)
                    .sort((a, b) => b[1] - a[1])
                    .map(([scope, count]) => (
                      <div key={scope} className="flex justify-between">
                        <span>{scope.replace(/_/g, " ")}</span>
                        <span className="font-mono">{count}</span>
                      </div>
                    ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-coral" />
                Recent denials
              </h3>
              {audit.recent_denials.length === 0 ? (
                <p className="text-xs text-muted-foreground">No denied reads in this window. Good signal.</p>
              ) : (
                <div className="space-y-3">
                  {audit.recent_denials.map(d => (
                    <div key={d.id} className="text-xs border-l-2 border-coral pl-3">
                      <div className="flex justify-between text-muted-foreground">
                        <span className="font-medium text-foreground">{d.scope.replace(/_/g, " ")}</span>
                        <span>{formatRelativeTime(d.peer_reviewed_at)}</span>
                      </div>
                      <p className="text-muted-foreground mt-1 italic">"{(d.justification ?? "").slice(0, 160)}"</p>
                      {d.peer_review_notes && (
                        <p className="text-coral mt-1">Reason: {d.peer_review_notes.slice(0, 200)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <GlassCard className="p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${color} mt-1`}>{value}</div>
    </GlassCard>
  );
}

function rangeLabel(range: { from: string; to: string }): string {
  const from = new Date(range.from), to = new Date(range.to);
  const days = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  return `${days}d`;
}

function PendingCard({
  review, busy, denyNotes, setDenyNotes, onApprove, onDeny,
}: {
  review: PendingReview;
  busy: boolean;
  denyNotes: string;
  setDenyNotes: (s: string) => void;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const [denyOpen, setDenyOpen] = useState(false);
  const slaRemaining = review.hours_since_read != null
    ? Math.max(0, 24 - review.hours_since_read)
    : null;
  const slaExpiringSoon = slaRemaining != null && slaRemaining < 4;

  const linkedEntity =
    review.dispute_id ? `dispute ${review.dispute_id.slice(0, 8)}…` :
    review.ticket_id  ? `ticket ${review.ticket_id.slice(0, 8)}…`  :
    review.compliance_case_id ? `case ${review.compliance_case_id}` :
    "(no linked entity — should not happen)";

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{review.scope.replace(/_/g, " ")}</span>
            {review.is_emergency && (
              <span className="px-2 py-0.5 rounded-full bg-violet/15 text-violet text-[10px] font-medium">
                EMERGENCY
              </span>
            )}
            {slaExpiringSoon && (
              <span className="px-2 py-0.5 rounded-full bg-coral/15 text-coral text-[10px] font-medium">
                SLA EXPIRING
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {review.reader?.full_name ?? "Unknown admin"} → {review.client?.full_name ?? "client"}
            {" · "}
            <Clock className="inline w-3 h-3 -mt-0.5" />
            {" "}{formatRelativeTime(review.read_at)}
            {slaRemaining != null && (
              <span className="ml-1">· {slaRemaining.toFixed(1)}h left in 24h SLA</span>
            )}
          </p>
        </div>
      </div>

      <div className="text-xs space-y-1.5">
        <div className="text-muted-foreground">
          <span className="text-foreground/80">Justification:</span> {review.justification}
        </div>
        <div className="text-muted-foreground">
          <span className="text-foreground/80">Linked:</span> {linkedEntity}
        </div>
      </div>

      {!denyOpen && (
        <div className="flex gap-2 pt-1">
          <button
            disabled={busy}
            onClick={onApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal/15 text-teal text-xs hover:bg-teal/25 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            disabled={busy}
            onClick={() => setDenyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-coral/15 text-coral text-xs hover:bg-coral/25 disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" /> Deny
          </button>
        </div>
      )}

      {denyOpen && (
        <div className="space-y-2 pt-1">
          <textarea
            value={denyNotes}
            onChange={(e) => setDenyNotes(e.target.value)}
            placeholder="Why are you denying this read? (≥20 chars — logged for IO follow-up)"
            rows={3}
            className="w-full glass-1 rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/10 focus:border-coral/50"
          />
          <div className="flex gap-2 justify-end">
            <button
              disabled={busy}
              onClick={() => { setDenyOpen(false); setDenyNotes(""); }}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-muted-foreground text-xs hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={busy || denyNotes.trim().length < 20}
              onClick={onDeny}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-coral text-white text-xs hover:bg-coral/90 disabled:opacity-50 transition-colors"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Confirm denial
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
