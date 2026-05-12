import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, MessageSquare, Send, Loader2, HelpCircle, Clock, CheckCircle2,
  AlertCircle, Inbox, ChevronRight, Sparkles,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { getAuthHeaders } from "@/lib/authFetch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type Status = "open" | "in_progress" | "awaiting_user" | "resolved" | "closed";
type Priority = "low" | "normal" | "high" | "urgent";

interface TicketRow {
  id: string;
  ticket_number: number;
  category: string;
  priority: Priority;
  subject: string;
  status: Status;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  reply_count?: number;
}

interface ReplyRow {
  id: string;
  author_profile_id: string | null;
  author_kind: "user" | "admin" | "system";
  body: string;
  created_at: string;
}

interface TicketDetail extends TicketRow {
  body: string;
  submitter_email: string;
  submitter_name: string | null;
  resolution_note?: string | null;
  first_response_at?: string | null;
}

const STATUS_META: Record<Status, { label: string; tone: string; icon: React.ReactNode }> = {
  open:          { label: "Open",            tone: "border-indigo/30 text-indigo bg-indigo/10",    icon: <Inbox className="w-3 h-3" /> },
  in_progress:   { label: "In progress",     tone: "border-amber/30 text-amber bg-amber/10",       icon: <Clock className="w-3 h-3" /> },
  awaiting_user: { label: "Awaiting you",    tone: "border-coral/30 text-coral bg-coral/10",       icon: <AlertCircle className="w-3 h-3" /> },
  resolved:      { label: "Resolved",        tone: "border-teal/30 text-teal bg-teal/10",          icon: <CheckCircle2 className="w-3 h-3" /> },
  closed:        { label: "Closed",          tone: "border-white/10 text-muted-foreground bg-white/[0.03]", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const PRIORITY_TONE: Record<Priority, string> = {
  low:    "text-muted-foreground",
  normal: "text-foreground",
  high:   "text-amber",
  urgent: "text-coral",
};

async function authHeaders(): Promise<Record<string, string>> {
  try {
    return await getAuthHeaders();
  } catch {
    window.location.href = "/welcome?login=true";
    return { "Content-Type": "application/json" };
  }
}

export default function MyTickets() {
  const { id } = useParams<{ id?: string }>();
  return id ? <TicketDetailView id={id} /> : <TicketListView />;
}

function TicketListView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/support/tickets/mine`, { headers: await authHeaders() });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error ?? "Failed to load tickets");
        setTickets(j.data ?? []);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl glass-1 flex items-center justify-center text-foreground" title="navigate(-1)} className='w-9 h-9 rounded-xl glass-1 flex items-center justify…" aria-label="navigate(-1)} className='w-9 h-9 rounded-xl glass-1 flex items-center justify…">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">My tickets</h1>
              <p className="text-[11px] text-muted-foreground">Support requests for {user?.email ?? "your account"}</p>
            </div>
          </div>
          <Link
            to="/help"
            className="rounded-pill px-3 py-1.5 text-[11px] font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center gap-1.5"
          >
            <HelpCircle className="w-3 h-3" /> New ticket
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No tickets yet</p>
            <p className="text-xs text-muted-foreground mt-1">Need a hand? Raise one from the Help page.</p>
            <Link
              to="/help"
              className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta mt-4"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Go to Help
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => {
              const meta = STATUS_META[t.status];
              const hasUnread = t.status === "awaiting_user";
              return (
                <GlassCard
                  key={t.id}
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => navigate(`/my-tickets/${t.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl gradient-indigo flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-data text-muted-foreground">#{t.ticket_number}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-pill inline-flex items-center gap-1 border ${meta.tone}`}>
                          {meta.icon} {meta.label}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-pill border border-white/10 ${PRIORITY_TONE[t.priority]}`}>
                          {t.priority}
                        </span>
                        {hasUnread && <span className="w-1.5 h-1.5 rounded-full bg-coral shrink-0" title="Awaiting your reply" />}
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">{t.subject}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t.category} · {(t.reply_count ?? 0)} repl{(t.reply_count ?? 0) === 1 ? "y" : "ies"} · {timeAgo(t.updated_at)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function TicketDetailView({ id }: { id: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/support/tickets/${id}`, { headers: await authHeaders() });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load ticket");
      setTicket(j.ticket);
      setReplies(j.replies ?? []);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const sendReply = async () => {
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/support/tickets/${id}/reply`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to send reply");
      toast.success("Reply sent");
      setReplyBody("");
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow flex flex-col items-center justify-center p-8">
        <p className="text-sm text-muted-foreground mb-4">Ticket not found.</p>
        <button onClick={() => navigate("/my-tickets")} className="rounded-pill px-4 py-2 text-xs font-semibold glass-1 text-foreground" title="navigate('/my-tickets')} className='rounded-pill px-4 py-2 text-xs font-semib…" aria-label="navigate('/my-tickets')} className='rounded-pill px-4 py-2 text-xs font-semib…">
          Back to tickets
        </button>
      </div>
    );
  }

  const meta = STATUS_META[ticket.status];
  const canReply = ticket.status !== "closed";

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/my-tickets")} className="w-9 h-9 rounded-xl glass-1 flex items-center justify-center text-foreground" title="navigate('/my-tickets')} className='w-9 h-9 rounded-xl glass-1 flex items-cen…" aria-label="navigate('/my-tickets')} className='w-9 h-9 rounded-xl glass-1 flex items-cen…">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-data text-muted-foreground">Ticket #{ticket.ticket_number}</p>
            <h1 className="text-lg font-bold text-foreground truncate">{ticket.subject}</h1>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-pill inline-flex items-center gap-1 border ${meta.tone} shrink-0`}>
            {meta.icon} {meta.label}
          </span>
        </div>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full glass-1 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              {(ticket.submitter_name ?? user?.email ?? "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{ticket.submitter_name ?? ticket.submitter_email}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(ticket.created_at).toLocaleString("en-ZA")}</p>
            </div>
            <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-pill border border-white/10 ${PRIORITY_TONE[ticket.priority]}`}>
              {ticket.priority}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{ticket.body}</p>
          <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-white/[0.06]">
            Category: <span className="text-foreground">{ticket.category}</span>
          </p>
        </GlassCard>

        {replies.length > 0 && (
          <div className="space-y-2">
            {replies.map((r) => <ReplyBubble key={r.id} reply={r} />)}
          </div>
        )}

        {ticket.resolution_note && ticket.status === "resolved" && (
          <GlassCard variant="accent-teal" className="p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Ticket resolved</p>
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{ticket.resolution_note}</p>
            </div>
          </GlassCard>
        )}

        {canReply ? (
          <GlassCard className="p-4 space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Reply</label>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={4}
              placeholder="Type your reply…"
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
        ) : (
          <p className="text-xs text-muted-foreground text-center">This ticket is closed — raise a new one from the Help page if needed.</p>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function ReplyBubble({ reply }: { reply: ReplyRow }) {
  const isAdmin  = reply.author_kind === "admin";
  const isSystem = reply.author_kind === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] text-muted-foreground glass-1 rounded-pill px-3 py-1 border border-white/[0.05]">
          <Sparkles className="inline w-3 h-3 mr-1 text-indigo" />
          {reply.body}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
        isAdmin
          ? "glass-1 text-foreground rounded-bl-sm"
          : "gradient-indigo text-primary-foreground rounded-br-sm"
      }`}>
        <p className="text-[10px] opacity-60 mb-1">
          {isAdmin ? "BION Support" : "You"} · {new Date(reply.created_at).toLocaleString("en-ZA")}
        </p>
        <p className="whitespace-pre-wrap">{reply.body}</p>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}
