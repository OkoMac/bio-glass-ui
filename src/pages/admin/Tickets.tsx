import { useAdminToken } from "@/hooks/useAdminToken";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  MessageSquare, Loader2, Inbox, Clock, AlertCircle, CheckCircle2,
  Mail, User, Phone, ArrowLeft, Send, RefreshCcw, Flame, UserCheck,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import AdminTokenGate from "@/components/AdminTokenGate";
import GlassCard from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { authFetch } from "@/lib/authFetch";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

async function jwtHeader(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return { Authorization: `Bearer ${session.access_token}` };
  } catch { /* */ }
  return {};
}

type Status = "open" | "in_progress" | "awaiting_user" | "resolved" | "closed";
type Priority = "low" | "normal" | "high" | "urgent";

interface QueueRow {
  id: string;
  ticket_number: number;
  submitter_email: string;
  submitter_name: string | null;
  submitter_phone: string | null;
  category: string;
  priority: Priority;
  subject: string;
  body: string;
  status: Status;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  first_response_at: string | null;
  age_hours: number;
  is_sentry?: boolean;
  is_auto?: boolean;
  submitter?: { id: string; full_name: string | null; email: string | null } | null;
  assignee?:  { id: string; full_name: string | null; email: string | null } | null;
}

interface ReplyRow {
  id: string;
  author_profile_id: string | null;
  author_kind: "user" | "admin" | "system";
  body: string;
  created_at: string;
}

const STATUS_TABS: Array<{ key: string; label: string; icon: React.ReactNode }> = [
  { key: "open",           label: "Open",           icon: <Inbox className="w-3.5 h-3.5" /> },
  { key: "in_progress",    label: "In progress",    icon: <Clock className="w-3.5 h-3.5" /> },
  { key: "awaiting_user",  label: "Awaiting user",  icon: <AlertCircle className="w-3.5 h-3.5" /> },
  { key: "resolved",       label: "Resolved",       icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { key: "all",            label: "All",            icon: <Inbox className="w-3.5 h-3.5" /> },
];

const PRIORITY_FILTERS = ["all", "urgent", "high", "normal", "low"] as const;
const SOURCE_FILTERS = ["all", "user", "sentry", "auto"] as const;

const STATUS_TONE: Record<Status, string> = {
  open:           "border-indigo/30 text-indigo bg-indigo/10",
  in_progress:    "border-amber/30 text-amber bg-amber/10",
  awaiting_user:  "border-coral/30 text-coral bg-coral/10",
  resolved:       "border-teal/30 text-teal bg-teal/10",
  closed:         "border-white/10 text-muted-foreground bg-white/[0.03]",
};

const PRIORITY_TONE: Record<Priority, string> = {
  low:    "text-muted-foreground",
  normal: "text-foreground",
  high:   "text-amber",
  urgent: "text-coral",
};

export default function AdminTickets() {
  const { token, loading: tokenLoading } = useAdminToken();
  const [tab, setTab] = useState<string>("open");
  const [priorityFilter, setPriorityFilter] = useState<(typeof PRIORITY_FILTERS)[number]>("all");
  const [sourceFilter, setSourceFilter] = useState<(typeof SOURCE_FILTERS)[number]>("all");
  // First-response-time meta from the queue endpoint — single metric
  // shown in the header so admins can see if the team is keeping up.
  const [meta, setMeta] = useState<{ median_frt_ms: number | null; frt_sample_size: number; frt_window_days: number } | null>(null);
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<QueueRow | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", tab);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      const res = await authFetch(`/api/support/tickets/admin/queue?${params}`);
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load queue");
      setRows(j.data ?? []);
      setMeta(j.meta ?? null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab, priorityFilter, sourceFilter, token]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0, in_progress: 0, awaiting_user: 0, resolved: 0, all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  if (!token) return <AdminTokenGate tokenLoading={tokenLoading} />;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <AdminNav />
      {selected ? (
        <TicketDetail
          ticket={selected}
          token={token}
          onBack={() => setSelected(null)}
          onChanged={async () => { await load(); }}
        />
      ) : (
        <div className="max-w-6xl mx-auto pt-24 md:pt-8 pb-20 px-4 space-y-5">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-indigo" /> Support tickets
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Triage user support requests. Urgent first, sorted by age.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <FrtPill meta={meta} />
              <button
                onClick={load}
                className="rounded-pill px-3 py-2 text-xs font-medium glass-1 text-foreground flex items-center gap-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </header>

          {/* Status tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-pill px-4 py-2 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
                  tab === t.key ? "gradient-indigo text-primary-foreground shadow-cta" : "glass-1 text-muted-foreground"
                }`}
              >
                {t.icon} {t.label}
                {t.key !== "all" && (counts[t.key] ?? 0) > 0 && (
                  <span className={`ml-1 text-[10px] rounded-pill px-1.5 py-0.5 ${tab === t.key ? "bg-white/20" : "bg-white/[0.06]"}`}>
                    {counts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Priority</span>
            {PRIORITY_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`rounded-pill px-3 py-1.5 text-[11px] font-medium ${
                  priorityFilter === p
                    ? (p === "urgent" ? "bg-coral/20 text-coral border border-coral/40"
                     : p === "high"   ? "bg-amber/20 text-amber border border-amber/40"
                     : "gradient-indigo text-primary-foreground")
                    : "glass-1 text-muted-foreground"
                }`}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>

          {/* Source filter — Sentry / auto-error / user-submitted */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Source</span>
            {SOURCE_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={`rounded-pill px-3 py-1.5 text-[11px] font-medium ${
                  sourceFilter === s
                    ? "gradient-indigo text-primary-foreground"
                    : "glass-1 text-muted-foreground"
                }`}
                title={s === "sentry" ? "Tickets originated from Sentry alerts" : s === "auto" ? "Auto-tickets from frontend crashes / API errors" : s === "user" ? "Human-submitted tickets only" : "All ticket sources"}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>

          {/* Queue */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">No tickets match your filter</p>
              <p className="text-xs text-muted-foreground mt-1">Try switching tabs or priority.</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => <TicketRow key={r.id} row={r} onOpen={() => setSelected(r)} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TicketRow({ row, onOpen }: { row: QueueRow; onOpen: () => void }) {
  const isOverdue = row.age_hours > 48 && (row.status === "open" || row.status === "in_progress");
  return (
    <GlassCard
      className={`p-4 cursor-pointer hover:bg-white/[0.02] transition-colors ${
        row.priority === "urgent" ? "border border-coral/20" : ""
      }`}
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          row.priority === "urgent" ? "bg-coral/20" : "gradient-indigo"
        }`}>
          {row.priority === "urgent"
            ? <Flame className="w-4 h-4 text-coral" />
            : <MessageSquare className="w-4 h-4 text-primary-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-data text-muted-foreground">#{row.ticket_number}</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-pill inline-flex items-center gap-1 border ${STATUS_TONE[row.status]}`}>
              {row.status.replace(/_/g, " ")}
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded-pill border border-white/10 ${PRIORITY_TONE[row.priority]}`}>
              {row.priority}
            </span>
            <span className="text-[10px] text-muted-foreground">{row.category}</span>
            {row.is_sentry && (
              <span className="text-[9px] px-2 py-0.5 rounded-pill border border-violet-500/30 text-violet-300 bg-violet-500/10" title="Originated from Sentry">
                sentry
              </span>
            )}
            {row.is_auto && !row.is_sentry && (
              <span className="text-[9px] px-2 py-0.5 rounded-pill border border-amber/30 text-amber bg-amber/10" title="Auto-reported frontend error">
                auto
              </span>
            )}
            {isOverdue && (
              <span className="text-[9px] px-2 py-0.5 rounded-pill border border-coral/30 text-coral bg-coral/10">
                overdue
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{row.subject}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <User className="w-3 h-3 shrink-0" /> {row.submitter_name ?? row.submitter?.full_name ?? "(no name)"}
            </span>
            <span className="flex items-center gap-1 truncate">
              <Mail className="w-3 h-3 shrink-0" /> {row.submitter_email}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" /> {ageLabel(row.age_hours)}
            </span>
            {row.assignee && (
              <span className="flex items-center gap-1 shrink-0 text-teal" title={`Assigned to ${row.assignee.full_name ?? row.assignee.email ?? "admin"}`}>
                <UserCheck className="w-3 h-3" /> {row.assignee.full_name?.split(" ")[0] ?? "assigned"}
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function TicketDetail({
  ticket, token, onBack, onChanged,
}: {
  ticket: QueueRow;
  token: string;
  onBack: () => void;
  onChanged: () => Promise<void>;
}) {
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState<Status | null>(null);
  const [note, setNote] = useState("");
  // Admin assignment — load the admin profile list once so the
  // "Assign to…" dropdown can render. Backend endpoint at
  // POST /api/support/tickets/admin/:id/assign already exists; this is
  // just the UI it was missing.
  const [admins, setAdmins] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([]);
  const [assignBusy, setAssignBusy] = useState(false);
  const [currentAssignee, setCurrentAssignee] = useState<string | null>(ticket.assigned_to);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/support/tickets/${ticket.id}`);
      const j = await res.json();
      if (j?.ok) { setReplies(j.replies ?? []); }
      else { setReplies([]); }
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [ticket.id]);

  // Load admin profile list once. Multi-role admins (post-Step-2) are
  // user_roles rows where role='admin'; we need their profile id, not
  // just user_id, since support_tickets.assigned_to references profiles.id.
  useEffect(() => {
    (async () => {
      const { data: roleRows } = await supabase
        .from("user_roles").select("user_id").eq("role", "admin");
      const userIds = (roleRows ?? []).map((r: any) => r.user_id).filter(Boolean);
      if (!userIds.length) return;
      const { data: profileRows } = await supabase
        .from("profiles").select("id, full_name, email").in("user_id", userIds).order("full_name");
      setAdmins((profileRows ?? []) as any[]);
    })();
  }, []);

  const assign = async (adminProfileId: string | null) => {
    setAssignBusy(true);
    try {
      const res = await authFetch(`/api/support/tickets/admin/${ticket.id}/assign`, {
        method: "POST",
        body: JSON.stringify({ adminProfileId }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to assign");
      const target = adminProfileId
        ? admins.find(a => a.id === adminProfileId)?.full_name ?? "admin"
        : "unassigned";
      toast.success(`Ticket → ${target}`);
      setCurrentAssignee(adminProfileId);
      await onChanged();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to assign");
    } finally {
      setAssignBusy(false);
    }
  };

  const sendReply = async () => {
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      const res = await authFetch(`/api/support/tickets/admin/${ticket.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to send reply");
      toast.success("Reply sent · user notified by email");
      setReplyBody("");
      await load();
      await onChanged();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status: Status) => {
    setStatusBusy(status);
    try {
      const res = await authFetch(`/api/support/tickets/admin/${ticket.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status, resolution_note: note.trim() || undefined }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to change status");
      toast.success(`Status → ${status.replace(/_/g, " ")} · user emailed`);
      setNote("");
      await load();
      await onChanged();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to change status");
    } finally {
      setStatusBusy(null);
    }
  };

  const statusOptions: Array<{ value: Status; label: string; tone: string }> = [
    { value: "in_progress",   label: "In progress",   tone: "bg-amber/20 text-amber border border-amber/40" },
    { value: "awaiting_user", label: "Awaiting user", tone: "bg-coral/20 text-coral border border-coral/40" },
    { value: "resolved",      label: "Resolved",      tone: "bg-teal/20 text-teal border border-teal/40" },
    { value: "closed",        label: "Closed",        tone: "glass-1 text-muted-foreground" },
  ];

  const [confirmResolve, setConfirmResolve] = useState(false);
  const isResolved = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="max-w-4xl mx-auto pt-24 md:pt-8 pb-20 px-4 space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="w-9 h-9 rounded-xl glass-1 flex items-center justify-center text-foreground" aria-label="Go back" title="Go back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-data text-muted-foreground">Ticket #{ticket.ticket_number}</p>
          <h1 className="text-lg font-bold text-foreground truncate">{ticket.subject}</h1>
        </div>
        {!isResolved && (
          <button
            onClick={() => setConfirmResolve(true)}
            disabled={statusBusy === "resolved"}
            className="rounded-pill px-4 py-2 text-xs font-semibold bg-teal/20 text-teal border border-teal/40 flex items-center gap-1.5 shrink-0 hover:bg-teal/30 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark resolved
          </button>
        )}
      </div>

      {confirmResolve && !isResolved && (
        <GlassCard className="p-4 space-y-3 border border-teal/40">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Confirm resolve ticket #{ticket.ticket_number}?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The submitter ({ticket.submitter_email}) will receive a resolution email. Add an optional note below — it's included in the email and becomes a system reply on the ticket thread.
              </p>
            </div>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Resolution note (optional — e.g. 'Rescheduled to 17 Apr 14:00')"
            className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setConfirmResolve(false); setNote(""); }}
              disabled={statusBusy === "resolved"}
              className="flex-1 rounded-pill py-2 text-xs font-medium glass-1 text-muted-foreground"
            >
              Cancel
            </button>
            <button
              onClick={async () => { await changeStatus("resolved"); setConfirmResolve(false); }}
              disabled={statusBusy === "resolved"}
              className="flex-1 rounded-pill py-2 text-xs font-semibold bg-teal/30 text-teal border border-teal/40 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {statusBusy === "resolved" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {statusBusy === "resolved" ? "Resolving…" : "Confirm resolve"}
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-4 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow icon={<User className="w-3.5 h-3.5" />} label="From">
            {ticket.submitter_name ?? ticket.submitter?.full_name ?? "(no name)"}
          </InfoRow>
          <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email">
            <a href={`mailto:${ticket.submitter_email}`} className="text-teal">{ticket.submitter_email}</a>
          </InfoRow>
          {ticket.submitter_phone && (
            <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone">{ticket.submitter_phone}</InfoRow>
          )}
          <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Age">{ageLabel(ticket.age_hours)}</InfoRow>
        </div>
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/[0.06]">
          <span className={`text-[10px] px-2.5 py-1 rounded-pill inline-flex items-center gap-1 border ${STATUS_TONE[ticket.status]}`}>
            {ticket.status.replace(/_/g, " ")}
          </span>
          <span className={`text-[10px] px-2.5 py-1 rounded-pill border border-white/10 ${PRIORITY_TONE[ticket.priority]}`}>
            {ticket.priority} priority
          </span>
          <span className="text-[10px] px-2.5 py-1 rounded-pill glass-1 text-muted-foreground">
            {ticket.category}
          </span>
        </div>
      </GlassCard>

      {/* Original body */}
      <GlassCard className="p-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Original message</p>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{ticket.body}</p>
      </GlassCard>

      {/* Thread */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : replies.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Thread ({replies.length})</p>
          {replies.map((r) => <AdminReplyBubble key={r.id} reply={r} />)}
        </div>
      ) : null}

      {/* Assignment */}
      <GlassCard className="p-4 space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <UserCheck className="w-3 h-3" /> Assign to
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={currentAssignee ?? ""}
            onChange={(e) => assign(e.target.value || null)}
            disabled={assignBusy}
            className="flex-1 min-w-[200px] glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent outline-none disabled:opacity-50"
          >
            <option value="" className="bg-obsidian">Unassigned</option>
            {admins.map(a => (
              <option key={a.id} value={a.id} className="bg-obsidian">
                {a.full_name ?? a.email ?? a.id.slice(0, 8)}
              </option>
            ))}
          </select>
          {assignBusy && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {currentAssignee && (
          <p className="text-[11px] text-muted-foreground">
            Assigning auto-flips status from <span className="font-data">open</span> → <span className="font-data">in_progress</span>.
          </p>
        )}
      </GlassCard>

      {/* Status controls */}
      <GlassCard className="p-4 space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Change status</p>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => changeStatus(o.value)}
              disabled={statusBusy === o.value || ticket.status === o.value}
              className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${o.tone} disabled:opacity-40`}
            >
              {statusBusy === o.value ? "…" : o.label}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Optional note (e.g. resolution summary — emailed to user)"
          className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none resize-none"
        />
      </GlassCard>

      {/* Admin reply */}
      <GlassCard className="p-4 space-y-2 border border-indigo/20">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Admin reply</p>
        <textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={5}
          placeholder="Type your reply — user will get an email with a link back to the ticket."
          className="w-full glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none resize-none"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={sendReply}
          disabled={sending || !replyBody.trim()}
          className="w-full rounded-pill py-2.5 text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? "Sending…" : "Send reply"}
        </motion.button>
      </GlassCard>
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1 mb-1">{icon} {label}</p>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  );
}

function AdminReplyBubble({ reply }: { reply: ReplyRow }) {
  const isAdmin = reply.author_kind === "admin";
  const isSystem = reply.author_kind === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] text-muted-foreground glass-1 rounded-pill px-3 py-1 border border-white/[0.05]">
          {reply.body}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
        isAdmin
          ? "gradient-indigo text-primary-foreground rounded-br-sm"
          : "glass-1 text-foreground rounded-bl-sm"
      }`}>
        <p className="text-[10px] opacity-60 mb-1">
          {isAdmin ? "BION Support (admin)" : "User"} · {new Date(reply.created_at).toLocaleString("en-ZA")}
        </p>
        <p className="whitespace-pre-wrap">{reply.body}</p>
      </div>
    </div>
  );
}

/**
 * Median first-response-time over the last 7d. The single metric per
 * the CTO refactor — visible on the queue header so the team sees
 * slippage in real time. Tinted by tier: <1h teal, <4h amber, >=4h coral.
 */
function FrtPill({ meta }: { meta: { median_frt_ms: number | null; frt_sample_size: number; frt_window_days: number } | null }) {
  if (!meta || meta.median_frt_ms == null) {
    return (
      <span className="rounded-pill px-3 py-2 text-[11px] glass-1 text-muted-foreground" title="No tickets with a first response in the last 7 days">
        FRT · n/a
      </span>
    );
  }
  const ms = meta.median_frt_ms;
  const mins = Math.round(ms / 60_000);
  const label = mins < 60 ? `${mins}m` : mins < 24 * 60 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 60 / 24)}d`;
  const tone =
    ms < 60 * 60_000          ? "bg-teal/20 text-teal border border-teal/40"
    : ms < 4 * 60 * 60_000    ? "bg-amber/20 text-amber border border-amber/40"
    :                            "bg-coral/20 text-coral border border-coral/40";
  return (
    <span
      className={`rounded-pill px-3 py-2 text-[11px] font-semibold ${tone}`}
      title={`Median first-response time over last ${meta.frt_window_days} days · ${meta.frt_sample_size} tickets`}
    >
      FRT · {label}
    </span>
  );
}

function ageLabel(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}
