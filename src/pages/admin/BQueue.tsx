import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/AdminNav";
import {
  Sparkles, X, Loader2, Package, Gift, Building,
  CheckCircle, XCircle, AlertTriangle,
ArrowLeft, } from "lucide-react";
import { toast } from "sonner";

type EntityType = "sponsor" | "reward" | "product";
type Tab = EntityType;

interface QueueItem {
  id: string;
  type: EntityType;
  title: string;
  subtitle: string | null;
  b_review_status: string;
  b_review_notes: string | null;
  b_risk_score: number | null;
  b_reviewed_at: string | null;
  created_at: string;
  raw: Record<string, unknown>;
}

const STATUS_META: Record<string, { tone: string; label: string }> = {
  pending:          { tone: "text-muted-foreground", label: "Pre-B_" },
  b_approved:       { tone: "text-teal",             label: "B_ approved" },
  b_flagged:        { tone: "text-amber",            label: "B_ flagged" },
  admin_rejected:   { tone: "text-coral",            label: "Rejected" },
  admin_approved:   { tone: "text-teal",             label: "Admin approved" },
};

export default function AdminBQueue() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("product");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QueueItem | null>(null);

  const fetchItems = async () => {
    setLoading(true);

    if (tab === "sponsor") {
      const { data } = await supabase
        .from("sponsors")
        .select("*")
        .in("b_review_status", ["b_approved", "b_flagged"])
        .order("created_at", { ascending: false });
      setItems((data ?? []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        type: "sponsor",
        title: String(d.company_name ?? "—"),
        subtitle: `${d.tier ?? "—"} · R${d.monthly_spend_rand ?? 0}/mo`,
        b_review_status: String(d.b_review_status ?? "pending"),
        b_review_notes: d.b_review_notes as string | null,
        b_risk_score: d.b_risk_score as number | null,
        b_reviewed_at: d.b_reviewed_at as string | null,
        created_at: String(d.created_at),
        raw: d,
      })));
    } else if (tab === "reward") {
      const { data } = await supabase
        .from("sponsored_rewards")
        .select("*, sponsors(company_name)")
        .in("b_review_status", ["b_approved", "b_flagged"])
        .order("created_at", { ascending: false });
      setItems((data ?? []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        type: "reward",
        title: String(d.title ?? "—"),
        subtitle: `${(d as { sponsors?: { company_name?: string } }).sponsors?.company_name ?? "—"} · ${d.reward_type}`,
        b_review_status: String(d.b_review_status ?? "pending"),
        b_review_notes: d.b_review_notes as string | null,
        b_risk_score: d.b_risk_score as number | null,
        b_reviewed_at: d.b_reviewed_at as string | null,
        created_at: String(d.created_at),
        raw: d,
      })));
    } else {
      const { data } = await supabase
        .from("products")
        .select("*")
        .in("b_review_status", ["b_approved", "b_flagged"])
        .order("created_at", { ascending: false });
      setItems((data ?? []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        type: "product",
        title: String(d.title ?? "—"),
        subtitle: `R${d.price_rand} · ${d.category ?? "—"}`,
        b_review_status: String(d.b_review_status ?? "pending"),
        b_review_notes: d.b_review_notes as string | null,
        b_risk_score: d.b_risk_score as number | null,
        b_reviewed_at: d.b_reviewed_at as string | null,
        created_at: String(d.created_at),
        raw: d,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

  const handleAdminDecision = async (item: QueueItem, decision: "approve" | "reject") => {
    const newStatus = decision === "approve" ? "admin_approved" : "admin_rejected";
    const table = item.type === "sponsor" ? "sponsors" : item.type === "reward" ? "sponsored_rewards" : "products";

    // Products: also update main status
    const extra = item.type === "product"
      ? { status: decision === "approve" ? "published" : "admin_rejected" }
      : {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table) as any)
      .update({ b_review_status: newStatus, ...extra })
      .eq("id", item.id);

    if (error) { toast.error(error.message); return; }
    toast.success(`${item.title} ${decision === "approve" ? "approved" : "rejected"}`);
    setSelected(null);
    fetchItems();
  };

  const pendingCount = items.filter((i) => !i.b_review_status.startsWith("admin_")).length;

  return (
    <div className="min-h-screen bg-background md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <AdminNav />
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 pt-24 md:pt-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo" /> B_ Review Queue
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Items B_ has pre-screened · final admin sign-off
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo font-data">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">awaiting</p>
          </div>
        </header>

        <div className="flex gap-1 glass-1 rounded-pill p-1">
          {(["product", "sponsor", "reward"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-pill text-xs font-semibold capitalize transition-all ${
                tab === t ? "gradient-indigo text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "product" && <Package className="w-3 h-3 inline mr-1" />}
              {t === "sponsor" && <Building className="w-3 h-3 inline mr-1" />}
              {t === "reward" && <Gift className="w-3 h-3 inline mr-1" />}
              {t}s
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="glass-1 rounded-2xl p-12 text-center">
            <CheckCircle className="w-10 h-10 text-teal mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Queue empty</p>
            <p className="text-xs text-muted-foreground mt-1">Nothing awaiting your review.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => {
              const meta = STATUS_META[it.b_review_status] ?? STATUS_META.pending;
              return (
                <button key={it.id} onClick={() => setSelected(it)}
                  className="w-full text-left glass-1 hover:bg-white/[0.04] rounded-2xl p-4 flex items-center gap-4 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center shrink-0">
                    {it.b_review_status === "b_flagged"
                      ? <AlertTriangle className="w-4 h-4 text-amber" />
                      : <Sparkles className="w-4 h-4 text-indigo" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{it.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{it.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[11px] font-semibold ${meta.tone}`}>{meta.label}</p>
                    {typeof it.b_risk_score === "number" && (
                      <p className="text-[10px] text-muted-foreground">risk {it.b_risk_score}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <ReviewDetail item={selected} onClose={() => setSelected(null)} onDecide={handleAdminDecision} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewDetail({ item, onClose, onDecide }: {
  item: QueueItem;
  onClose: () => void;
  onDecide: (i: QueueItem, d: "approve" | "reject") => void;
}) {
  const [acting, setActing] = useState(false);
  const act = async (d: "approve" | "reject") => {
    setActing(true); await onDecide(item, d); setActing(false);
  };
  const meta = STATUS_META[item.b_review_status] ?? STATUS_META.pending;
  const raw = item.raw;
  const done = item.b_review_status.startsWith("admin_");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-background border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.type}</p>
            <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Type-specific details */}
        {item.type === "product" && (
          <div className="space-y-2">
            {(raw as { photos?: string[] })?.photos?.[0] && (
              <img src={(raw as { photos: string[] }).photos[0]} alt={item.title}
                className="w-full h-40 object-cover rounded-xl" />
            )}
            {typeof raw.description === "string" && (
              <p className="text-xs text-foreground/80 leading-relaxed">{raw.description}</p>
            )}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Metric label="Stock" value={String(raw.stock_qty ?? "—")} />
              <Metric label="Weight" value={`${raw.weight_grams ?? "—"}g`} />
              <Metric label="Size" value={`${raw.largest_side_cm ?? "—"}cm`} />
            </div>
          </div>
        )}

        {item.type === "sponsor" && (
          <div className="space-y-2 text-xs">
            <Row label="Company"      value={String(raw.company_name ?? "—")} />
            <Row label="Contact"      value={`${raw.contact_email ?? ""} ${raw.contact_phone ?? ""}`.trim()} />
            <Row label="Tier"         value={String(raw.tier ?? "—")} />
            <Row label="Monthly spend" value={`R${raw.monthly_spend_rand ?? 0}`} />
          </div>
        )}

        {item.type === "reward" && (
          <div className="space-y-2 text-xs">
            {typeof raw.image_url === "string" && raw.image_url && (
              <img src={raw.image_url as string} alt={item.title} className="w-full h-40 object-cover rounded-xl" />
            )}
            {typeof raw.description === "string" && (
              <p className="text-foreground/80 leading-relaxed">{raw.description}</p>
            )}
            <Row label="Type"  value={String(raw.reward_type ?? "—")} />
            <Row label="Tier"  value={String(raw.milestone_tier ?? "n/a")} />
            <Row label="Stock" value={`${raw.stock_remaining}/${raw.stock_qty}`} />
            {raw.points_cost != null && <Row label="Cost" value={`${raw.points_cost} pts`} />}
          </div>
        )}

        {/* B_ verdict */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo/15 to-teal/10 border border-indigo/30 space-y-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo" />
            <p className="text-xs font-semibold text-foreground">B_ says</p>
            {typeof item.b_risk_score === "number" && (
              <span className="ml-auto text-[10px] text-muted-foreground">risk {item.b_risk_score}/100</span>
            )}
          </div>
          <p className={`text-sm font-semibold capitalize ${meta.tone}`}>{meta.label}</p>
          {item.b_review_notes && (
            <p className="text-xs text-foreground/80 leading-relaxed">{item.b_review_notes}</p>
          )}
        </div>

        {!done ? (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => act("approve")} disabled={acting}
              className="py-3 rounded-xl bg-teal text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve
            </button>
            <button
              onClick={() => act("reject")} disabled={acting}
              className="py-3 rounded-xl bg-coral/80 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-sm font-semibold text-foreground capitalize">Final: {item.b_review_status.replace(/_/g, " ")}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-foreground font-semibold">{value}</p>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
