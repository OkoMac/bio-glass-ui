import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { MessageSquare, RefreshCw, Phone, Bot, User, AlertCircle, ArrowLeft } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Thread {
  phone: string;
  message_count: number;
  last_message_at: string;
  last_message: string;
  last_direction: "in" | "out";
  in_count: number;
  out_count: number;
  live?: boolean;
  active_flow?: string | null;
  idle_warned?: boolean;
  last_user_at?: number | null;
}

interface Message {
  id: string;
  direction: "in" | "out";
  content: string;
  meta?: Record<string, any> | null;
  created_at: string;
}

interface ThreadDetail {
  phone: string;
  messages: Message[];
  live?: boolean;
  active_flow?: string | null;
  idle_warned?: boolean;
}

function formatPhone(p: string) {
  // 27726884826 → +27 72 688 4826
  const d = p.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("27")) return `+27 ${d.slice(2,4)} ${d.slice(4,7)} ${d.slice(7)}`;
  return p.startsWith("+") ? p : `+${d}`;
}

function relative(ts: string | number | null | undefined) {
  if (!ts) return "";
  const ms = typeof ts === "number" ? ts : new Date(ts).getTime();
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export default function AdminWhatsApp() {
  const navigate = useNavigate();
  const { user, availableRoles } = useAuth();
  // ANY user with admin in their availableRoles can see WhatsApp messages
  // (per 2026-05-18 request: "make sure that all admins can see whatsapp
  // messages when they log in"). Previous check was user.role === "admin"
  // which gated on the currently-selected role — multi-role users sitting
  // in provider/client view would silently get 0 threads even though they
  // had admin permission. The route's RequireAuth still gates page access
  // to the admin role specifically; this just bulletproofs the inside.
  const isAdmin = user?.role === "admin" || (availableRoles ?? []).includes("admin");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<{ daily_cap: number; active_conversations: number } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  // Slice "admin reply confirmation" — after Skin Nourishers wrong-thread
  // send (2026-04-26ish), every send goes through a confirm modal showing
  // the recipient + preview before the message actually leaves.
  const [pendingReply, setPendingReply] = useState<{ phone: string; message: string } | null>(null);

  // No isAdmin early returns inside fetch fns anymore — if you reached this
  // page, the route already verified admin role. The inner gates were
  // racing the auth hydration on cold mount (user starts null, isAdmin
  // false, fetch no-ops; useEffect re-fires when isAdmin flips true but
  // by then the React state and side-effects can mismatch).
  async function fetchThreads() {
    setLoading(true); setErr(null);
    try {
      const r = await authFetch(`/api/whatsapp/admin/conversations`);
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setThreads(d.threads ?? []);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function fetchDetail(phone: string) {
    try {
      const r = await authFetch(`/api/whatsapp/admin/conversations/${phone}`);
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setDetail(d);
    } catch (e: any) { setErr(e.message); }
  }

  async function fetchStats() {
    try {
      const r = await authFetch(`/api/whatsapp/admin/stats`);
      const d = await r.json();
      if (d.ok) setStats({ daily_cap: d.daily_cap, active_conversations: d.active_conversations });
    } catch {}
  }

  // Open the confirm modal — the actual fetch only fires from confirmSend()
  // below. This is intentional: pressing Enter or clicking Send no longer
  // immediately blasts a reply down the wire.
  const stageReply = () => {
    if (!replyText.trim() || !selected) return;
    setPendingReply({ phone: selected, message: replyText.trim() });
  };

  const confirmSend = async () => {
    if (!pendingReply) return;
    setSending(true);
    try {
      const res = await authFetch(`/api/whatsapp/admin/reply`, {
        method: "POST",
        body: JSON.stringify({ phone: pendingReply.phone, message: pendingReply.message }),
      });
      const j = await res.json();
      if (j.ok) {
        setReplyText("");
        setPendingReply(null);
        fetchDetail(pendingReply.phone);
        toast.success("Reply sent");
      } else {
        toast.error(j.error ?? "Failed to send");
      }
    } catch { toast.error("Send failed"); }
    finally { setSending(false); }
  };

  useEffect(() => {
    // Fetch unconditionally on mount — route guard already confirmed admin.
    // Previous guard was `if (isAdmin)` which raced auth hydration; if the
    // user state was still null/loading at mount, the fetch would no-op and
    // never retry until something else changed the dep.
    fetchThreads();
    fetchStats();
    const iv = setInterval(() => { fetchThreads(); fetchStats(); }, 30_000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (selected) { fetchDetail(selected); } }, [selected]);

  const sorted = useMemo(() =>
    [...threads].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()),
    [threads]
  );

  // Non-admins are blocked by the route's RequireAuth allowedRoles=admin
  // already; this is just a defensive empty render.
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <AdminNav />
      <div className="px-4 pt-24 md:pt-8 pb-16 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-teal" /> WhatsApp Conversations
            </h1>
            <p className="text-sm text-muted-foreground">
              Live + archived threads with B_ on +27 64 743 2005
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">{stats.active_conversations} live · cap {stats.daily_cap}/phone/day</div>
              </div>
            )}
            <button
              onClick={() => { fetchThreads(); fetchStats(); if (selected) fetchDetail(selected); }}
              className="p-2 glass-1 rounded-full"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
            {/* Clear-token escape-hatch removed — admin auth is now JWT,
                no manual token to clear. */}
          </div>
        </div>

        {err && (
          <GlassCard className="p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-coral" />
            <p className="text-sm text-coral">{err}</p>
          </GlassCard>
        )}

        {/* 2026-05-19 (Oko bug): on mobile the layout stacked the threads
            list above the detail panel, so tapping a row appended the
            detail far below the fold and felt like "nothing happens".
            Mobile now hides the list when a thread is selected and shows
            the detail full-width with a Back arrow. Desktop layout
            (md+) keeps both side-by-side as before. */}
        <div className={`grid gap-4 md:grid-cols-[320px_1fr] ${selected ? "grid-cols-1" : "grid-cols-1"}`}>

          {/* Thread list — hidden on mobile when a thread is open */}
          <GlassCard className={`p-0 max-h-[75vh] overflow-y-auto ${selected ? "hidden md:block" : ""}`}>
            <div className="sticky top-0 bg-obsidian/90 backdrop-blur px-4 py-3 border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground">
              {sorted.length} threads
            </div>
            {sorted.length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No conversations yet. They'll appear here as users message the bot.
              </div>
            )}
            {sorted.map(t => (
              <motion.button
                key={t.phone}
                onClick={() => setSelected(t.phone)}
                whileTap={{ scale: 0.99 }}
                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${selected === t.phone ? "bg-white/5" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{formatPhone(t.phone)}</span>
                    {t.live && <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" title="Live conversation" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{relative(t.last_message_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {t.last_direction === "in" ? (
                    <User className="w-3 h-3 text-muted-foreground shrink-0" />
                  ) : (
                    <Bot className="w-3 h-3 text-teal shrink-0" />
                  )}
                  <p className="text-xs text-muted-foreground truncate">{t.last_message}</p>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{t.message_count} msgs · ↓{t.in_count} ↑{t.out_count}</span>
                  {t.active_flow && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-indigo/20 text-indigo">{t.active_flow}</span>
                  )}
                  {t.idle_warned && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-amber/20 text-amber">idle</span>
                  )}
                </div>
              </motion.button>
            ))}
          </GlassCard>

          {/* Thread view — hidden on mobile until a thread is selected */}
          <GlassCard className={`p-0 max-h-[75vh] overflow-y-auto ${selected ? "" : "hidden md:block"}`}>
            {!selected && (
              <div className="p-10 text-center text-muted-foreground text-sm">
                Pick a thread to view the conversation.
              </div>
            )}
            {selected && detail && (
              <>
                <div className="sticky top-0 bg-obsidian/90 backdrop-blur px-4 py-3 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Mobile-only back button — closes detail and returns to list */}
                      <button
                        onClick={() => setSelected(null)}
                        className="md:hidden -ml-1 mr-1 p-1 rounded-full hover:bg-white/5 transition-colors"
                        aria-label="Back to threads"
                      >
                        <ArrowLeft className="w-4 h-4 text-foreground" />
                      </button>
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{formatPhone(detail.phone)}</span>
                      {detail.live && <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-teal/20 text-teal">live</span>}
                      {detail.active_flow && <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-indigo/20 text-indigo">{detail.active_flow}</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{detail.messages.length} messages</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {detail.messages.map(m => (
                    <div
                      key={m.id}
                      className={`flex ${m.direction === "in" ? "justify-start" : "justify-end"}`}
                    >
                      <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${m.direction === "in" ? "glass-1 text-foreground" : "bg-teal/20 text-foreground"}`}>
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                          {m.direction === "in" ? <User className="w-2.5 h-2.5" /> : <Bot className="w-2.5 h-2.5" />}
                          <span>{new Date(m.created_at).toLocaleString("en-ZA", { hour12: false, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Admin reply — Enter no longer auto-sends. Click Send (or
                      Cmd/Ctrl+Enter) to open the confirm modal first. */}
                  <div className="flex gap-2 mt-3">
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type a reply..."
                      onKeyDown={e => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) stageReply();
                      }}
                      className="flex-1 glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent outline-none"
                    />
                    <button onClick={stageReply} disabled={!replyText.trim() || sending}
                      className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground disabled:opacity-50">
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Send-confirmation modal — reads the staged recipient + message
          back to the admin so accidentally selecting the wrong thread
          becomes recoverable before the message goes out. */}
      {pendingReply && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-obsidian/70 backdrop-blur-sm"
          onClick={() => !sending && setPendingReply(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm reply">
          <div className="w-full max-w-md glass-2 rounded-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber" />
              <h3 className="text-base font-bold text-foreground">Send this reply?</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                <span className="font-data text-foreground">{formatPhone(pendingReply.phone)}</span>
              </div>
              <div className="glass-1 rounded-xl p-3 text-foreground whitespace-pre-wrap text-sm">
                {pendingReply.message}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setPendingReply(null)}
                disabled={sending}
                className="rounded-pill px-4 py-2 text-xs font-semibold glass-1 text-muted-foreground hover:text-foreground disabled:opacity-50">
                Cancel
              </button>
              <button onClick={confirmSend}
                disabled={sending}
                className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground disabled:opacity-50">
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
