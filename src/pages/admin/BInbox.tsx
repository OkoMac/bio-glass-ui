import { useAdminToken } from "@/hooks/useAdminToken";
/**
 * B_ Admin Assistant Inbox — the "what needs my attention right now" surface.
 *
 * Read-only aggregator page that polls /api/admin/assistant/inbox every 60 s
 * and renders a single prioritised list of action items across every
 * ops-adjacent table (tickets, sentry alerts, verifications, disputes,
 * refunds, failed payments). Each card deep-links to the relevant admin
 * surface via action_url.
 *
 * X-Admin-Token gated via localStorage bion_admin_token, identical to
 * /admin/tickets.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles, Loader2, RefreshCcw, CheckCircle2, MessageSquare,
  AlertTriangle, FileCheck, AlertCircle, RotateCcw, CreditCard, Clock, ArrowRight, ArrowLeft,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import GlassCard from "@/components/GlassCard";
import AdminTokenGate from "@/components/AdminTokenGate";
import { authFetch } from "@/lib/authFetch";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type Priority = "urgent" | "high" | "normal" | "low";
type Kind = "ticket" | "sentry" | "verification" | "dispute" | "refund" | "payment";

interface InboxItem {
  id: string;
  kind: Kind;
  priority: Priority;
  title: string;
  summary: string;
  age_hours: number;
  action_label: string;
  action_url: string;
  meta: Record<string, any>;
}

interface InboxResponse {
  ok: boolean;
  items: InboxItem[];
  counts_by_priority: Record<Priority, number>;
  counts_by_kind: Record<Kind, number>;
  generated_at: string;
  error?: string;
}

const KIND_ICON: Record<Kind, React.ComponentType<{ className?: string }>> = {
  ticket:       MessageSquare,
  sentry:       AlertTriangle,
  verification: FileCheck,
  dispute:      AlertCircle,
  refund:       RotateCcw,
  payment:      CreditCard,
};

const KIND_LABEL: Record<Kind, string> = {
  ticket:       "Support ticket",
  sentry:       "Sentry alert",
  verification: "Verification",
  dispute:      "Dispute",
  refund:       "Refund",
  payment:      "Failed payment",
};

const PRIORITY_CHIP: Record<Priority, string> = {
  urgent: "bg-coral/15 text-coral border border-coral/40",
  high:   "bg-amber/15 text-amber border border-amber/40",
  normal: "bg-indigo/15 text-indigo border border-indigo/40",
  low:    "bg-white/[0.04] text-muted-foreground border border-white/10",
};

const PRIORITY_ORDER: Priority[] = ["urgent", "high", "normal", "low"];

function ageLabel(hours: number): string {
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function BInbox() {
  const navigate = useNavigate();
  const { token, loading: tokenLoading } = useAdminToken();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [counts, setCounts] = useState<Record<Priority, number>>({ urgent: 0, high: 0, normal: 0, low: 0 });
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<Priority | "all">("all");

  const load = useCallback(async (quiet = false) => {
    if (!token) return;
    if (!quiet) setLoading(true);
    try {
      const res = await authFetch(`/api/admin/assistant/inbox`);
      const j: InboxResponse = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load inbox");
      setItems(j.items ?? []);
      setCounts(j.counts_by_priority ?? { urgent: 0, high: 0, normal: 0, low: 0 });
      setGeneratedAt(j.generated_at ?? null);
    } catch (err: any) {
      if (!quiet) toast.error(err?.message ?? "Failed to load inbox");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [token]);

  // Initial load + 60 s polling
  useEffect(() => {
    if (!token) return;
    load();
    const t = setInterval(() => load(true), 60_000);
    return () => clearInterval(t);
  }, [token, load]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.priority === filter);
  }, [items, filter]);

  if (!token) return <AdminTokenGate tokenLoading={tokenLoading} />;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <AdminNav />
      <div className="max-w-5xl mx-auto pt-24 md:pt-8 pb-20 px-4 space-y-5">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="relative shrink-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-cta"
                style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-2xl"
                style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", filter: "blur(14px)", opacity: 0.4 }}
                animate={{ opacity: [0.25, 0.55, 0.25] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground">B_ · Admin Assistant</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                What needs your attention right now {generatedAt ? `· refreshed ${new Date(generatedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => load()}
            disabled={loading}
            className="rounded-pill px-3 py-2 text-xs font-medium glass-1 text-foreground flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </header>

        {/* Sticky priority jump chips */}
        <div className="sticky top-0 z-20 -mx-4 px-4 py-2 backdrop-blur-xl bg-obsidian/70 border-b border-white/[0.04]">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <PriorityChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="All"
              count={items.length}
              tone="indigo"
            />
            {PRIORITY_ORDER.map((p) => (
              <PriorityChip
                key={p}
                active={filter === p}
                onClick={() => setFilter(p)}
                label={p}
                count={counts[p] ?? 0}
                tone={p === "urgent" ? "coral" : p === "high" ? "amber" : p === "normal" ? "indigo" : "muted"}
              />
            ))}
          </div>
        </div>

        {/* List */}
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState filterActive={filter !== "all"} />
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {visible.map((item) => (
                <InboxCard
                  key={item.id}
                  item={item}
                  onHandle={() => navigate(item.action_url)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Priority jump chip
 * ────────────────────────────────────────────────────────── */
function PriorityChip({
  active, onClick, label, count, tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone: "coral" | "amber" | "indigo" | "muted";
}) {
  const activeBg =
    tone === "coral"  ? "bg-coral/20 text-coral border border-coral/40"  :
    tone === "amber"  ? "bg-amber/20 text-amber border border-amber/40"  :
    tone === "indigo" ? "gradient-indigo text-primary-foreground shadow-cta" :
    "glass-1 text-foreground";
  return (
    <button
      onClick={onClick}
      className={`rounded-pill px-4 py-1.5 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
        active ? activeBg : "glass-1 text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="capitalize">{label}</span>
      <span className={`text-[10px] rounded-pill px-1.5 py-0.5 ${active ? "bg-white/20" : "bg-white/[0.06]"}`}>
        {count}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Card for one inbox item
 * ────────────────────────────────────────────────────────── */
function InboxCard({ item, onHandle }: { item: InboxItem; onHandle: () => void }) {
  const Icon = KIND_ICON[item.kind];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
    >
      <GlassCard
        className={`p-4 cursor-pointer hover:bg-white/[0.02] transition-colors ${
          item.priority === "urgent" ? "border border-coral/20" : ""
        }`}
        onClick={onHandle}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              item.priority === "urgent" ? "bg-coral/20" :
              item.priority === "high"   ? "bg-amber/15" :
              item.kind === "sentry"     ? "bg-coral/15" :
              "gradient-indigo"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${
                item.priority === "urgent" ? "text-coral" :
                item.priority === "high"   ? "text-amber" :
                item.kind === "sentry"     ? "text-coral" :
                "text-primary-foreground"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[9px] px-2 py-0.5 rounded-pill ${PRIORITY_CHIP[item.priority]}`}>
                {item.priority}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-pill glass-1 text-muted-foreground">
                {KIND_LABEL[item.kind]}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" /> {ageLabel(item.age_hours)}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.summary}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onHandle(); }}
            className="rounded-pill px-3 py-1.5 text-[11px] font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center gap-1 shrink-0"
          >
            Handle <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Empty state
 * ────────────────────────────────────────────────────────── */
function EmptyState({ filterActive }: { filterActive: boolean }) {
  return (
    <GlassCard className="p-10 text-center">
      <motion.div
        className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}
        animate={{ y: [0, -4, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <CheckCircle2 className="w-6 h-6 text-white" />
      </motion.div>
      <p className="text-sm font-semibold text-foreground">All clear</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
        {filterActive
          ? "Nothing matches that priority right now. Try switching back to All."
          : "B_ has nothing urgent for you right now. Enjoy the quiet."}
      </p>
    </GlassCard>
  );
}
