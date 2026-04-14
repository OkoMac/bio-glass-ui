import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { resolveDispute, type BRecommendation } from "@/hooks/useDisputes";
import AdminNav from "@/components/AdminNav";
import {
  AlertTriangle, Sparkles, X, Loader2, Package, User, Store,
  CheckCircle, XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface AwaitingRow {
  id: string;
  order_id: string;
  raised_by: string;
  reason: string;
  buyer_statement: string | null;
  provider_statement: string | null;
  buyer_evidence: string[];
  provider_evidence: string[];
  b_recommendation: BRecommendation;
  b_reasoning: string | null;
  b_confidence: number | null;
  resolution: string | null;
  created_at: string;
  // joined
  buyer_id: string;
  provider_id: string;
  total_charged_rand: number;
}

interface Enriched extends AwaitingRow {
  buyer_name: string | null;
  provider_name: string | null;
  order_items: Array<{ product_title_snapshot: string; quantity: number; unit_price_rand: number }>;
}

export default function AdminDisputes() {
  const [rows, setRows] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Enriched | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("disputes_awaiting_admin")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) { setLoading(false); return; }
    if (!data || data.length === 0) { setRows([]); setLoading(false); return; }

    // Enrich with profile names + order items
    const awaiting = data as AwaitingRow[];
    const profileIds = [...new Set(awaiting.flatMap((r) => [r.buyer_id, r.provider_id]))];
    const { data: profiles } = await supabase
      .from("profiles").select("id, full_name").in("id", profileIds);
    const nameMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

    const orderIds = awaiting.map((r) => r.order_id);
    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, product_title_snapshot, quantity, unit_price_rand")
      .in("order_id", orderIds);
    const itemsByOrder = new Map<string, Enriched["order_items"]>();
    items?.forEach((it) => {
      const arr = itemsByOrder.get(it.order_id) ?? [];
      arr.push({
        product_title_snapshot: it.product_title_snapshot,
        quantity: it.quantity,
        unit_price_rand: it.unit_price_rand,
      });
      itemsByOrder.set(it.order_id, arr);
    });

    setRows(awaiting.map((r) => ({
      ...r,
      buyer_name: nameMap.get(r.buyer_id) ?? null,
      provider_name: nameMap.get(r.provider_id) ?? null,
      order_items: itemsByOrder.get(r.order_id) ?? [],
    })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Realtime — refresh when any dispute changes
  useEffect(() => {
    const channel = supabase
      .channel("admin-disputes")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_disputes" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleResolve = async (disputeId: string, resolution: "refunded" | "declined") => {
    try {
      await resolveDispute(disputeId, resolution);
      toast.success(resolution === "refunded" ? "Refund issued to buyer" : "Dispute declined");
      setSelected(null);
      fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const pending = rows.filter((r) => !r.resolution || r.resolution === "admin_decided");

  return (
    <div className="min-h-screen bg-background md:pl-56">
      <AdminNav />
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 pt-20 md:pt-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-coral" /> Disputes
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Escalated by providers or auto-flagged by B_ · final call lands here
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-coral font-data">{pending.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">awaiting</p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="glass-1 rounded-2xl p-12 text-center">
            <CheckCircle className="w-10 h-10 text-teal mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">No escalations</p>
            <p className="text-xs text-muted-foreground mt-1">All disputes are resolved or still with providers.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <DisputeCard key={r.id} row={r} onOpen={() => setSelected(r)} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <DisputeDetail
            row={selected}
            onClose={() => setSelected(null)}
            onResolve={handleResolve}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DisputeCard({ row, onOpen }: { row: Enriched; onOpen: () => void }) {
  const unresolved = !row.resolution || row.resolution === "admin_decided";
  return (
    <button
      onClick={onOpen}
      className="w-full text-left glass-1 hover:bg-white/[0.04] rounded-2xl p-4 flex items-center gap-4 transition-colors"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        unresolved ? "bg-coral/10" : "bg-teal/10"
      }`}>
        {unresolved
          ? <AlertTriangle className="w-4 h-4 text-coral" />
          : <CheckCircle className="w-4 h-4 text-teal" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground capitalize">
            {row.reason.replace(/_/g, " ")}
          </p>
          {row.b_recommendation && (
            <span className="inline-flex items-center gap-1 text-[10px] text-indigo bg-indigo/10 px-1.5 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" /> {row.b_recommendation.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {row.buyer_name ?? "Buyer"} vs {row.provider_name ?? "Provider"} · R{Number(row.total_charged_rand).toFixed(2)} · {new Date(row.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
        </p>
      </div>
      <span className={`text-[11px] font-semibold shrink-0 ${unresolved ? "text-coral" : "text-teal"}`}>
        {unresolved ? "Awaiting" : (row.resolution ?? "")}
      </span>
    </button>
  );
}

function DisputeDetail({ row, onClose, onResolve }: {
  row: Enriched;
  onClose: () => void;
  onResolve: (id: string, r: "refunded" | "declined") => void;
}) {
  const [resolving, setResolving] = useState(false);

  const act = async (res: "refunded" | "declined") => {
    setResolving(true);
    await onResolve(row.id, res);
    setResolving(false);
  };

  const unresolved = !row.resolution || row.resolution === "admin_decided";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-background border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Dispute</p>
            <p className="text-xs font-mono text-muted-foreground">#{row.id.slice(0, 8)}</p>
            <h2 className="text-lg font-bold text-foreground capitalize mt-1">
              {row.reason.replace(/_/g, " ")}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
              <User className="w-3 h-3" /> Buyer
            </p>
            <p className="text-foreground font-medium">{row.buyer_name ?? "—"}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
              <Store className="w-3 h-3" /> Provider
            </p>
            <p className="text-foreground font-medium">{row.provider_name ?? "—"}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-2">
            <Package className="w-3 h-3" /> Order · R{Number(row.total_charged_rand).toFixed(2)}
          </p>
          {row.order_items.map((it, i) => (
            <p key={i} className="text-xs text-foreground">
              {it.product_title_snapshot} × {it.quantity} @ R{Number(it.unit_price_rand).toFixed(2)}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-coral/5 border border-coral/20">
            <p className="text-[10px] text-coral uppercase tracking-wider mb-1">Buyer says</p>
            <p className="text-xs text-foreground whitespace-pre-wrap">{row.buyer_statement}</p>
            {row.buyer_evidence?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {row.buyer_evidence.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-indigo underline truncate max-w-[200px] inline-block">
                    {u}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-indigo/5 border border-indigo/20">
            <p className="text-[10px] text-indigo uppercase tracking-wider mb-1">Provider says</p>
            <p className="text-xs text-foreground whitespace-pre-wrap">
              {row.provider_statement ?? <span className="text-muted-foreground italic">No response from provider yet</span>}
            </p>
            {row.provider_evidence?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {row.provider_evidence.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-indigo underline truncate max-w-[200px] inline-block">
                    {u}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {row.b_recommendation && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo/15 to-teal/10 border border-indigo/30 space-y-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo" />
              <p className="text-xs font-semibold text-foreground">B_ recommends</p>
              {typeof row.b_confidence === "number" && (
                <span className="ml-auto text-[10px] text-muted-foreground">{row.b_confidence}% confidence</span>
              )}
            </div>
            <p className="text-sm font-semibold text-indigo capitalize">
              {row.b_recommendation.replace(/_/g, " ")}
            </p>
            {row.b_reasoning && (
              <p className="text-xs text-foreground/80 leading-relaxed">{row.b_reasoning}</p>
            )}
          </div>
        )}

        {unresolved ? (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => act("refunded")} disabled={resolving}
              className="py-3 rounded-xl bg-teal text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Refund buyer
            </button>
            <button
              onClick={() => act("declined")} disabled={resolving}
              className="py-3 rounded-xl bg-coral/80 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Decline claim
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-teal/10 border border-teal/20 text-center">
            <p className="text-sm font-semibold text-teal capitalize">Resolved: {row.resolution}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
