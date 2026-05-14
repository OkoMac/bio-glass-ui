import { useAdminToken } from "@/hooks/useAdminToken";
import { useNavigate } from "react-router-dom";
/**
 * /admin/disputes — unified admin queue.
 *
 * Two top-level views:
 *   1. "Bookings" (default)  — service-booking disputes from public.disputes
 *        Tabs: "Escalated to admin" (status='escalated') +
 *              "All active" (status not in resolved/closed)
 *        Actions: resolve with { resolution_type, partial_pct?, refund_to, note }
 *
 *   2. "Orders" — product-order disputes from public.order_disputes
 *        (legacy surface — unchanged)
 */

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  resolveDispute, type BRecommendation,
  fetchAdminBookingDisputes, adminResolveBookingDispute,
  type BookingDisputeRow, type BookingDisputeResolutionType,
} from "@/hooks/useDisputes";
import AdminNav from "@/components/AdminNav";
import {
  AlertTriangle, Sparkles, X, Loader2, Package, User, Store,
  CheckCircle, XCircle, Clock, CalendarCheck, ShoppingBag,
ArrowLeft, } from "lucide-react";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════
 * Booking-dispute admin queue
 * ════════════════════════════════════════════════════════════ */

type BookingTab = "escalated" | "active";

function BookingDisputesAdmin({ token }: { token: string }) {
  const [tab, setTab] = useState<BookingTab>("escalated");
  const [rows, setRows] = useState<BookingDisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BookingDisputeRow | null>(null);

  const load = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchAdminBookingDisputes(token);
      setRows(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

  const visible = useMemo(() => {
    if (tab === "escalated") return rows.filter((r) => r.status === "escalated");
    return rows.filter((r) => r.status !== "resolved" && r.status !== "closed");
  }, [rows, tab]);

  const handleResolve = async (
    disputeId: string,
    payload: {
      resolution_type: BookingDisputeResolutionType;
      partial_pct?: number;
      refund_to: "wallet" | "bank";
      note?: string;
    },
  ) => {
    try {
      const res = await adminResolveBookingDispute(token, disputeId, payload);
      toast.success(
        res.refunded > 0
          ? `Resolved · R${res.refunded.toFixed(2)} to client ${payload.refund_to}`
          : `Resolved: ${payload.resolution_type.replace(/_/g, " ")}`,
      );
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab("escalated")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            tab === "escalated" ? "bg-coral text-white" : "bg-white/5 text-muted-foreground"
          }`}
        >
          Escalated to admin ({rows.filter((r) => r.status === "escalated").length})
        </button>
        <button
          onClick={() => setTab("active")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            tab === "active" ? "bg-coral text-white" : "bg-white/5 text-muted-foreground"
          }`}
        >
          All active ({rows.filter((r) => r.status !== "resolved" && r.status !== "closed").length})
        </button>
      </div>

      {!token && (
        <div className="glass-1 rounded-2xl p-4 text-xs text-amber">
          Enter your admin token below to load disputes.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-1 rounded-2xl p-12 text-center">
          <CheckCircle className="w-10 h-10 text-teal mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Nothing here</p>
          <p className="text-xs text-muted-foreground mt-1">
            {tab === "escalated" ? "No disputes escalated to admin right now." : "No active booking disputes."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => (
            <BookingCard key={r.id} row={r} onOpen={() => setSelected(r)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <BookingDetail row={selected} onClose={() => setSelected(null)} onResolve={handleResolve} />
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingCard({ row, onOpen }: { row: BookingDisputeRow; onOpen: () => void }) {
  const days = row.days_elapsed ?? Math.max(0, Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86_400_000));
  const overTarget = days >= 7;
  return (
    <button
      onClick={onOpen}
      className="w-full text-left glass-1 hover:bg-white/[0.04] rounded-2xl p-4 flex items-center gap-4 transition-colors"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        row.status === "escalated" ? "bg-amber/10" :
        row.status === "b_ai_reviewed" ? "bg-indigo/10" :
        "bg-coral/10"
      }`}>
        {row.status === "escalated" ? <AlertTriangle className="w-4 h-4 text-amber" /> :
         row.status === "b_ai_reviewed" ? <Sparkles className="w-4 h-4 text-indigo" /> :
         <Clock className="w-4 h-4 text-coral" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground truncate">
            {row.booking?.service?.title ?? "Booking"} · R{Number(row.amount_rand).toFixed(2)}
          </p>
          {row.b_ai_recommendation && (
            <span className="inline-flex items-center gap-1 text-[10px] text-indigo bg-indigo/10 px-1.5 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" /> {row.b_ai_recommendation.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {row.client?.full_name ?? "Client"} vs {row.provider?.full_name ?? "Provider"} · {" "}
          <span className={overTarget ? "text-coral font-semibold" : ""}>
            {days}d elapsed
          </span>
        </p>
      </div>
      <span className={`text-[10px] font-semibold shrink-0 px-2 py-1 rounded-full ${
        row.status === "escalated" ? "bg-amber/10 text-amber" :
        row.status === "b_ai_reviewed" ? "bg-indigo/10 text-indigo" :
        row.status === "provider_responded" ? "bg-teal/10 text-teal" :
        "bg-coral/10 text-coral"
      }`}>
        {row.status.replace(/_/g, " ")}
      </span>
    </button>
  );
}

function BookingDetail({
  row, onClose, onResolve,
}: {
  row: BookingDisputeRow;
  onClose: () => void;
  onResolve: (
    id: string,
    payload: {
      resolution_type: BookingDisputeResolutionType;
      partial_pct?: number;
      refund_to: "wallet" | "bank";
      note?: string;
    },
  ) => void | Promise<void>;
}) {
  const [resolutionType, setResolutionType] = useState<BookingDisputeResolutionType>(
    (row.b_ai_recommendation as BookingDisputeResolutionType) ?? "no_refund",
  );
  const [partialPct, setPartialPct] = useState<number>(
    row.b_ai_partial_pct ? Number(row.b_ai_partial_pct) : 30,
  );
  const [refundTo, setRefundTo] = useState<"wallet" | "bank">("wallet");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    await onResolve(row.id, {
      resolution_type: resolutionType,
      partial_pct: resolutionType === "partial_refund" ? partialPct : undefined,
      refund_to: refundTo,
      note: note || undefined,
    });
    setSubmitting(false);
  };

  const days = row.days_elapsed ?? Math.max(0, Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86_400_000));

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
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Dispute · Booking</p>
            <p className="text-xs font-mono text-muted-foreground">#{row.id.slice(0, 8)}</p>
            <h2 className="text-lg font-bold text-foreground mt-1">
              {row.booking?.service?.title ?? "Booking"} · R{Number(row.amount_rand).toFixed(2)}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {days}d elapsed of 7d target · status: {row.status.replace(/_/g, " ")}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center" aria-label="Close" title="Close">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
              <User className="w-3 h-3" /> Client
            </p>
            <p className="text-foreground font-medium">{row.client?.full_name ?? "—"}</p>
            {row.client?.email && <p className="text-[10px] text-muted-foreground">{row.client.email}</p>}
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
              <Store className="w-3 h-3" /> Provider
            </p>
            <p className="text-foreground font-medium">{row.provider?.full_name ?? "—"}</p>
            {row.provider?.email && <p className="text-[10px] text-muted-foreground">{row.provider.email}</p>}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-coral/5 border border-coral/20 space-y-1">
          <p className="text-[10px] text-coral uppercase tracking-wider">Client complaint</p>
          <p className="text-xs text-foreground whitespace-pre-wrap">{row.reason}</p>
          {Array.isArray(row.evidence) && row.evidence.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {row.evidence.map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-indigo underline truncate max-w-[200px] inline-block">
                  {u}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-indigo/5 border border-indigo/20 space-y-1">
          <p className="text-[10px] text-indigo uppercase tracking-wider">Provider response</p>
          {row.provider_response ? (
            <p className="text-xs text-foreground whitespace-pre-wrap">{row.provider_response}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">No response from provider yet</p>
          )}
        </div>

        {row.b_ai_recommendation && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo/15 to-teal/10 border border-indigo/30 space-y-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo" />
              <p className="text-xs font-semibold text-foreground">B_ recommends</p>
            </div>
            <p className="text-sm font-semibold text-indigo capitalize">
              {row.b_ai_recommendation.replace(/_/g, " ")}
              {row.b_ai_partial_pct ? ` · ${Number(row.b_ai_partial_pct).toFixed(0)}%` : ""}
            </p>
            {row.b_ai_reasoning && (
              <p className="text-xs text-foreground/80 leading-relaxed">{row.b_ai_reasoning}</p>
            )}
          </div>
        )}

        {/* Admin resolution controls */}
        {row.status !== "resolved" && row.status !== "closed" && (
          <div className="space-y-3 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
            <p className="text-[11px] text-foreground font-semibold">Admin resolution</p>

            <div className="grid grid-cols-2 gap-2">
              {(["warning","partial_refund","full_refund","no_refund"] as BookingDisputeResolutionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setResolutionType(t)}
                  className={`px-3 py-2 rounded-lg text-[11px] font-semibold border ${
                    resolutionType === t
                      ? "border-teal/50 bg-teal/10 text-teal"
                      : "border-white/10 bg-white/[0.02] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {resolutionType === "partial_refund" && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Partial %</label>
                <input
                  type="number" min={0} max={100}
                  value={partialPct}
                  onChange={(e) => setPartialPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Refund preview: R{((Number(row.amount_rand) * partialPct) / 100).toFixed(2)}
                </p>
              </div>
            )}

            {(resolutionType === "partial_refund" || resolutionType === "full_refund") && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Refund to:</span>
                <button
                  onClick={() => setRefundTo("wallet")}
                  className={`px-2 py-1 rounded-lg border text-[11px] ${
                    refundTo === "wallet" ? "border-teal/50 bg-teal/10 text-teal" : "border-white/10 text-muted-foreground"
                  }`}
                >
                  Wallet (default)
                </button>
                <button
                  onClick={() => setRefundTo("bank")}
                  className={`px-2 py-1 rounded-lg border text-[11px] ${
                    refundTo === "bank" ? "border-teal/50 bg-teal/10 text-teal" : "border-white/10 text-muted-foreground"
                  }`}
                >
                  Bank
                </button>
              </div>
            )}

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Short reason for the audit trail."
                className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo/40 resize-none"
              />
            </div>

            <button
              onClick={submit} disabled={submitting}
              className="w-full py-3 rounded-xl bg-teal text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Apply final resolution
            </button>
          </div>
        )}

        {row.status === "resolved" && (
          <div className="p-3 rounded-xl bg-teal/10 border border-teal/20 text-center">
            <p className="text-sm font-semibold text-teal capitalize">
              Resolved: {row.resolution_type?.replace(/_/g, " ")}
            </p>
            {row.resolution_amount_rand ? (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                R{Number(row.resolution_amount_rand).toFixed(2)} to {row.resolution_refunded_to ?? "—"}
              </p>
            ) : null}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * Legacy order-dispute admin queue (product orders)
 * ════════════════════════════════════════════════════════════ */

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
  buyer_id: string;
  provider_id: string;
  total_charged_rand: number;
}

interface Enriched extends AwaitingRow {
  buyer_name: string | null;
  provider_name: string | null;
  order_items: Array<{ product_title_snapshot: string; quantity: number; unit_price_rand: number }>;
}

function OrderDisputesAdmin() {
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

    const awaiting = data as AwaitingRow[];
    const profileIds = [...new Set(awaiting.flatMap((r) => [r.buyer_id, r.provider_id]))];
    const { data: profiles } = await supabase
      .from("profiles").select("id, full_name").in("id", profileIds);
    const nameMap = new Map(profiles?.map((p: any /* TODO(types) */) => [p.id, p.full_name]) ?? []);

    const orderIds = awaiting.map((r) => r.order_id);
    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, product_title_snapshot, quantity, unit_price_rand")
      .in("order_id", orderIds);
    const itemsByOrder = new Map<string, Enriched["order_items"]>();
    items?.forEach((it: any /* TODO(types) */) => {
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
    })) as any);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Product order disputes escalated to admin.</p>
        <p className="text-[10px] text-muted-foreground">{pending.length} pending</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-1 rounded-2xl p-12 text-center">
          <CheckCircle className="w-10 h-10 text-teal mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No order escalations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <OrderDisputeCard key={r.id} row={r} onOpen={() => setSelected(r)} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <OrderDisputeDetail row={selected} onClose={() => setSelected(null)} onResolve={handleResolve} />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderDisputeCard({ row, onOpen }: { row: Enriched; onOpen: () => void }) {
  const unresolved = !row.resolution || row.resolution === "admin_decided";
  return (
    <button
      onClick={onOpen}
      className="w-full text-left glass-1 hover:bg-white/[0.04] rounded-2xl p-4 flex items-center gap-4 transition-colors"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${unresolved ? "bg-coral/10" : "bg-teal/10"}`}>
        {unresolved ? <AlertTriangle className="w-4 h-4 text-coral" /> : <CheckCircle className="w-4 h-4 text-teal" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground capitalize">{row.reason.replace(/_/g, " ")}</p>
          {row.b_recommendation && (
            <span className="inline-flex items-center gap-1 text-[10px] text-indigo bg-indigo/10 px-1.5 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" /> {row.b_recommendation.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {row.buyer_name ?? "Buyer"} vs {row.provider_name ?? "Provider"} · R{Number(row.total_charged_rand).toFixed(2)}
        </p>
      </div>
      <span className={`text-[11px] font-semibold shrink-0 ${unresolved ? "text-coral" : "text-teal"}`}>
        {unresolved ? "Awaiting" : (row.resolution ?? "")}
      </span>
    </button>
  );
}

function OrderDisputeDetail({ row, onClose, onResolve }: {
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
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Dispute · Order</p>
            <p className="text-xs font-mono text-muted-foreground">#{row.id.slice(0, 8)}</p>
            <h2 className="text-lg font-bold text-foreground capitalize mt-1">{row.reason.replace(/_/g, " ")}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center" aria-label="Close" title="Close">
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
          </div>

          <div className="p-3 rounded-xl bg-indigo/5 border border-indigo/20">
            <p className="text-[10px] text-indigo uppercase tracking-wider mb-1">Provider says</p>
            <p className="text-xs text-foreground whitespace-pre-wrap">
              {row.provider_statement ?? <span className="text-muted-foreground italic">No response from provider yet</span>}
            </p>
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
            <p className="text-sm font-semibold text-indigo capitalize">{row.b_recommendation.replace(/_/g, " ")}</p>
            {row.b_reasoning && <p className="text-xs text-foreground/80 leading-relaxed">{row.b_reasoning}</p>}
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

/* ═══════════════════════════════════════════════════════════════
 * Page wrapper — switches between Bookings and Orders view
 * ════════════════════════════════════════════════════════════ */

type TopView = "bookings" | "orders";

export default function AdminDisputes() {
  const navigate = useNavigate();
  const [view, setView] = useState<TopView>("bookings");
  const { token, loading: tokenLoading } = useAdminToken();
  const [tokenDraft, setTokenDraft] = useState(token);

  const saveToken = () => {
    try { localStorage.setItem("bion_admin_token", tokenDraft); } catch {}
    // setToken is internal to useAdminToken — trigger reload to pick up new value
    window.location.reload();
    toast.success("Admin token saved locally");
  };

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
              <AlertTriangle className="w-6 h-6 text-coral" /> Disputes
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Service bookings (7-day target) and product orders · final call lands here
            </p>
          </div>
        </header>

        {/* Top view tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("bookings")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              view === "bookings" ? "bg-indigo text-white" : "bg-white/5 text-muted-foreground"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" /> Bookings
          </button>
          <button
            onClick={() => setView("orders")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              view === "orders" ? "bg-indigo text-white" : "bg-white/5 text-muted-foreground"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Orders
          </button>
        </div>

        {/* Admin token input (needed for bookings endpoint) */}
        {view === "bookings" && (
          <div className="glass-1 rounded-2xl p-3 flex items-center gap-2">
            <input
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              placeholder="X-Admin-Token"
              type="password"
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo/40"
            />
            <button
              onClick={saveToken}
              className="px-3 py-2 rounded-lg bg-indigo text-white text-[11px] font-semibold"
            >
              Save
            </button>
          </div>
        )}

        {view === "bookings" ? <BookingDisputesAdmin token={token} /> : <OrderDisputesAdmin />}
      </div>
    </div>
  );
}
