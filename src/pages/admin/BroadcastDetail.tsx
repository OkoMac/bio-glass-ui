import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Loader2, MessageSquare, CheckCircle2, Eye, Reply, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface BroadcastSummary {
  id: string;
  message: string;
  target_audience: string;
  status: string;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  replied_count?: number;
  failed_count?: number;
  created_at: string;
  sent_at: string | null;
}

interface Recipient {
  id: string;
  profile_id: string | null;
  phone: string;
  status: "pending" | "sent" | "delivered" | "read" | "replied" | "failed";
  whatsapp_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  replied_at: string | null;
  error_message: string | null;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

const STATUS_ORDER: Recipient["status"][] = ["pending", "sent", "delivered", "read", "replied", "failed"];

// Status pill style — chosen to match the rest of /admin/* (glass + accent).
// Replied uses teal to distinguish "engaged" from passive read.
const STATUS_STYLES: Record<Recipient["status"], { label: string; cls: string; Icon: typeof Clock }> = {
  pending:   { label: "Pending",   cls: "bg-white/[0.06] text-muted-foreground border border-white/[0.08]", Icon: Clock },
  sent:      { label: "Sent",      cls: "bg-amber-500/15 text-amber-400 border border-amber-500/30",       Icon: MessageSquare },
  delivered: { label: "Delivered", cls: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",   Icon: CheckCircle2 },
  read:      { label: "Read",      cls: "bg-violet-500/15 text-violet-400 border border-violet-500/30",   Icon: Eye },
  replied:   { label: "Replied",   cls: "bg-teal-500/15 text-teal-400 border border-teal-500/30",         Icon: Reply },
  failed:    { label: "Failed",    cls: "bg-red-500/15 text-red-400 border border-red-500/30",            Icon: AlertTriangle },
};

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" }); }
  catch { return iso; }
}

export default function AdminBroadcastDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();

  const [broadcast, setBroadcast] = useState<BroadcastSummary | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Recipient["status"]>("all");

  useEffect(() => {
    if (!id || !session?.access_token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [statsRes, recipRes] = await Promise.all([
          fetch(`${API}/api/broadcasts`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch(`${API}/api/broadcasts/${id}/recipients?limit=500`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
        ]);
        const statsJson = await statsRes.json().catch(() => ({}));
        const recipJson = await recipRes.json().catch(() => ({}));
        if (cancelled) return;
        // Broadcasts list returns all; grab the one we care about.
        const b = (statsJson?.data ?? []).find((x: BroadcastSummary) => x.id === id) ?? null;
        setBroadcast(b);
        setRecipients(recipJson?.data ?? []);
      } catch (err: any) {
        toast.error(err?.message ?? "Couldn't load broadcast", { duration: 8000 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, session?.access_token]);

  // Counts derived from recipients so the page reflects real state even if
  // the parent broadcast counters drift (the aggregate trigger keeps them
  // in sync, but recipients is the source of truth).
  const counts = useMemo(() => {
    const c: Record<Recipient["status"], number> = { pending: 0, sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 };
    for (const r of recipients) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [recipients]);

  const filtered = useMemo(() => {
    if (filter === "all") return recipients;
    return recipients.filter(r => r.status === filter);
  }, [recipients, filter]);

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
        {/* Back + title */}
        <button onClick={() => navigate("/admin/broadcasts")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to broadcasts
        </button>

        {broadcast ? (
          <GlassCard className="p-5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Broadcast</p>
            <p className="text-sm text-foreground whitespace-pre-wrap mt-1">{broadcast.message}</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              Sent {fmtTime(broadcast.sent_at)} · Created {fmtTime(broadcast.created_at)} · {broadcast.target_audience}
            </p>
          </GlassCard>
        ) : (
          <GlassCard className="p-5">
            <p className="text-xs text-muted-foreground">Broadcast {id} not found in your list.</p>
          </GlassCard>
        )}

        {/* Status ladder summary — click a card to filter the table below */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <button onClick={() => setFilter("all")}
            className={`p-3 rounded-2xl border text-left transition-colors ${
              filter === "all" ? "bg-white/[0.06] border-white/[0.16]" : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
            }`}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">All</p>
            <p className="text-xl font-semibold text-foreground">{recipients.length}</p>
          </button>
          {STATUS_ORDER.map((s) => {
            const cfg = STATUS_STYLES[s];
            const active = filter === s;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`p-3 rounded-2xl border text-left transition-colors ${
                  active ? "bg-white/[0.06] border-white/[0.16]" : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                }`}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <cfg.Icon className="w-3 h-3" /> {cfg.label}
                </p>
                <p className="text-xl font-semibold text-foreground">{counts[s] ?? 0}</p>
              </button>
            );
          })}
        </div>

        {/* Per-recipient table */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Recipients {filter !== "all" && <span className="text-muted-foreground">— filtered to {STATUS_STYLES[filter].label.toLowerCase()}</span>}
            </p>
            <p className="text-[10px] text-muted-foreground">{filtered.length} of {recipients.length}</p>
          </div>
          {filtered.length === 0 ? (
            <p className="p-6 text-xs text-muted-foreground text-center">No recipients match this filter.</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((r) => {
                const cfg = STATUS_STYLES[r.status];
                const name = r.profiles?.full_name ?? null;
                const latestTs =
                  r.replied_at ?? r.read_at ?? r.delivered_at ?? r.sent_at ?? r.created_at;
                return (
                  <div key={r.id} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-[11px] font-semibold text-foreground shrink-0">
                      {(name ?? r.phone).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{name ?? r.phone}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {name ? r.phone : ""}{r.error_message ? ` · ${r.error_message}` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.cls}`}>
                      <cfg.Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                    <p className="text-[10px] text-muted-foreground tabular-nums w-28 text-right shrink-0 hidden md:block">
                      {fmtTime(latestTs)}
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
