import { useAdminToken } from "@/hooks/useAdminToken";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { MessageSquare, RefreshCw, Phone, Clock, Bot, User, AlertCircle } from "lucide-react";

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
  const { token } = useAdminToken();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<{ daily_cap: number; active_conversations: number } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function fetchThreads() {
    if (!token) return;
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`${API}/api/whatsapp/admin/conversations`, { headers: { "X-Admin-Token": token } });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setThreads(d.threads);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function fetchDetail(phone: string) {
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/whatsapp/admin/conversations/${phone}`, { headers: { "X-Admin-Token": token } });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setDetail(d);
    } catch (e: any) { setErr(e.message); }
  }

  async function fetchStats() {
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/whatsapp/admin/stats`, { headers: { "X-Admin-Token": token } });
      const d = await r.json();
      if (d.ok) setStats({ daily_cap: d.daily_cap, active_conversations: d.active_conversations });
    } catch {}
  }

  const sendAdminReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/whatsapp/admin/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ phone: selected, message: replyText.trim() }),
      });
      const j = await res.json();
      if (j.ok) {
        setReplyText("");
        fetchDetail(selected);
        toast.success("Reply sent");
      } else {
        toast.error(j.error ?? "Failed to send");
      }
    } catch { toast.error("Send failed"); }
    finally { setSending(false); }
  };

  useEffect(() => {
    if (token) { fetchThreads(); fetchStats(); }
    const iv = setInterval(() => { if (token) { fetchThreads(); fetchStats(); } }, 30_000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { if (selected) { fetchDetail(selected); } }, [selected, token]);

  const sorted = useMemo(() =>
    [...threads].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()),
    [threads]
  );

  // ── Token entry gate ──
  if (!token) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <AdminNav />
        <div className="max-w-md mx-auto pt-20 px-4">
          <GlassCard className="p-6 space-y-4">
            <h1 className="text-xl font-bold text-foreground">Admin token required</h1>
            <p className="text-sm text-muted-foreground">
              The WhatsApp archive is protected by the <code>ADMIN_SETUP_TOKEN</code> set on the backend. Paste it below — it'll be stored in your browser localStorage for this session.
            </p>
            <input
              type="password"
              placeholder="ADMIN_SETUP_TOKEN"
              className="w-full h-10 glass-1 rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) { localStorage.setItem("bion_admin_token", v); location.reload(); }
                }
              }}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Press Enter to save.</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <AdminNav />
      <div className="px-4 pt-8 pb-16 max-w-7xl mx-auto">

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
            <button
              onClick={() => { localStorage.removeItem("bion_admin_token"); location.reload(); }}
              className="text-xs text-muted-foreground underline"
            >
              Clear token
            </button>
          </div>
        </div>

        {err && (
          <GlassCard className="p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-coral" />
            <p className="text-sm text-coral">{err}</p>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">

          {/* Thread list */}
          <GlassCard className="p-0 max-h-[75vh] overflow-y-auto">
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

          {/* Thread view */}
          <GlassCard className="p-0 max-h-[75vh] overflow-y-auto">
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
                  {/* Admin reply */}
                  <div className="flex gap-2 mt-3">
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type a reply..."
                      onKeyDown={e => e.key === "Enter" && sendAdminReply()}
                      className="flex-1 glass-1 rounded-xl px-3 py-2 text-sm text-foreground bg-transparent outline-none"
                    />
                    <button onClick={sendAdminReply} disabled={!replyText.trim() || sending}
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
    </div>
  );
}
