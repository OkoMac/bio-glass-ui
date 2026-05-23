import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Sparkles, Loader2, Send, Trash2, Clock, CheckCircle } from "lucide-react";
import {
  useOrderDispute, submitProviderResponse, resolveDispute,
  fetchMyBookingDisputes, respondToBookingDispute, acceptBookingDisputeAi,
  escalateBookingDispute,
  type BookingDisputeRow,
} from "@/hooks/useDisputes";
import { useAuth } from "@/contexts/AuthContext";
import { useImageUpload } from "@/hooks/useUpload";
import { toast } from "sonner";

interface Props {
  /** Per-order variant (legacy): renders the panel for a single order. */
  orderId?: string;
  /** Standalone booking variant: lists ALL open booking disputes on this provider. */
  mode?: "order" | "bookings";
  onResolved?: () => void;
}

/**
 * Provider-side dispute UI.
 * - Default (orderId) = order-dispute flow (product order, order_disputes table)
 * - mode="bookings"   = booking-dispute queue (public.disputes, /api/disputes)
 */
export default function ProviderDisputePanel({ orderId, mode, onResolved }: Props) {
  const effectiveMode: "order" | "bookings" = mode ?? (orderId ? "order" : "bookings");
  if (effectiveMode === "bookings") return <BookingDisputesQueue onResolved={onResolved} />;
  return <OrderDisputeView orderId={orderId!} onResolved={onResolved} />;
}

/* ─────────────────────────────────────────────────────────────
 * Order-dispute single-card view (legacy)
 * ────────────────────────────────────────────────────────── */
function OrderDisputeView({ orderId, onResolved }: { orderId: string; onResolved?: () => void }) {
  const { dispute, refresh, loading } = useOrderDispute(orderId);
  const [statement, setStatement] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { upload, uploading } = useImageUpload({ bucket: "bion-evidence", folder: "disputes" });
  const evRef = useRef<HTMLInputElement>(null);
  const addEvidence = async (file: File) => {
    try { const u = await upload(file); setEvidence((p) => [...p, u]); toast.success("Photo added"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
  };
  const [resolving, setResolving] = useState(false);

  useEffect(() => { refresh();   }, [orderId]);

  if (loading) return (
    <div className="glass-1 rounded-2xl p-4 flex items-center justify-center">
      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    </div>
  );
  if (!dispute) return null;

  const hasResponded = !!dispute.provider_statement;

  const handleSubmit = async () => {
    if (statement.trim().length < 10) {
      toast.error("Please explain your side (10+ characters)");
      return;
    }
    try {
      setSubmitting(true);
      const res = await submitProviderResponse(dispute.id, statement.trim(), evidence);
      await refresh();
      if (res.b_review?.ok) toast.success("B_ has reviewed — see recommendation below");
      else toast.message("Response submitted — B_ is reviewing");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (resolution: "refunded" | "replaced" | "admin_decided") => {
    try {
      setResolving(true);
      await resolveDispute(dispute.id, resolution);
      toast.success(
        resolution === "refunded" ? "Buyer refunded from your wallet" :
        resolution === "replaced" ? "Marked as replacement — ship new item" :
        "Escalated to admin review"
      );
      onResolved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setResolving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 space-y-3 bg-coral/5 border border-coral/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-coral" />
        <p className="text-sm font-semibold text-coral">Dispute opened</p>
      </div>

      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Buyer's claim · {dispute.reason.replace(/_/g, " ")}</p>
        <p className="text-xs text-foreground whitespace-pre-wrap">{dispute.buyer_statement}</p>
      </div>

      {!hasResponded ? (
        <>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Your response</label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Tell B_ what you know — what was shipped, condition, any signal the claim is wrong."
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-coral/50 resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Photo evidence (private)</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {evidence.map((u, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 h-16">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setEvidence(evidence.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => evRef.current?.click()} disabled={uploading}
                className="h-16 rounded-lg border border-dashed border-white/10 hover:border-coral/40 text-muted-foreground hover:text-foreground text-[9px] flex flex-col items-center justify-center disabled:opacity-50">
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><span className="text-base leading-none">+</span>Add</>}
              </button>
            </div>
            <input ref={evRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && addEvidence(e.target.files[0])} />
          </div>
          <button
            onClick={handleSubmit} disabled={submitting || statement.trim().length < 10}
            className="w-full py-2.5 rounded-xl bg-coral text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit to B_ for review
          </button>
        </>
      ) : (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Your response</p>
          <p className="text-xs text-foreground whitespace-pre-wrap">{dispute.provider_statement}</p>
        </div>
      )}

      {hasResponded && dispute.b_recommendation && (
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo/15 to-teal/10 border border-indigo/30 space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo" />
            <p className="text-xs font-semibold text-foreground">B_ recommends</p>
            {typeof dispute.b_confidence === "number" && (
              <span className="ml-auto text-[10px] text-muted-foreground">{dispute.b_confidence}% confidence</span>
            )}
          </div>
          <p className="text-sm font-semibold text-indigo capitalize">
            {dispute.b_recommendation.replace(/_/g, " ")}
          </p>
          {dispute.b_reasoning && (
            <p className="text-xs text-foreground/80 leading-relaxed">{dispute.b_reasoning}</p>
          )}
        </div>
      )}

      {hasResponded && !dispute.resolution && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => handleResolve("refunded")} disabled={resolving}
            className="py-2 rounded-lg bg-teal/10 text-teal text-[11px] font-semibold disabled:opacity-50"
          >
            Refund buyer
          </button>
          <button
            onClick={() => handleResolve("replaced")} disabled={resolving}
            className="py-2 rounded-lg bg-indigo/10 text-indigo text-[11px] font-semibold disabled:opacity-50"
          >
            Ship replacement
          </button>
          <button
            onClick={() => handleResolve("admin_decided")} disabled={resolving}
            className="py-2 rounded-lg bg-white/5 text-muted-foreground text-[11px] font-semibold disabled:opacity-50"
          >
            Escalate to admin
          </button>
        </div>
      )}

      {dispute.resolution && (
        <div className="p-2.5 rounded-xl bg-teal/10 border border-teal/20">
          <p className="text-xs font-semibold text-teal capitalize">Resolved: {dispute.resolution.replace(/_/g, " ")}</p>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Booking-dispute queue (this provider only)
 *   - Lists active booking disputes (opened | provider_responded |
 *     b_ai_reviewed | escalated)
 *   - For each, countdown to provider_response_due_at
 *   - Respond form if not yet responded → /respond (triggers B_ inline)
 *   - On b_ai_reviewed, show recommendation + Accept / Escalate buttons
 * ────────────────────────────────────────────────────────── */
function BookingDisputesQueue({ onResolved }: { onResolved?: () => void }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<BookingDisputeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyBookingDisputes();
      const mine = data.filter(
        (d) =>
          d.provider_id === user?.profileId &&
          ["opened", "provider_responded", "b_ai_reviewed", "escalated"].includes(d.status),
      );
      setRows(mine);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  }, [user?.profileId]);

  useEffect(() => { load(); }, [load]);

  // Soft auto-refresh while the list has active items
  useEffect(() => {
    if (rows.length === 0) return;
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [rows.length, load]);

  if (loading) {
    return (
      <div className="glass-1 rounded-2xl p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="glass-1 rounded-2xl p-6 text-center">
        <CheckCircle className="w-6 h-6 text-teal mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">No open booking disputes</p>
        <p className="text-[11px] text-muted-foreground mt-1">You're in the clear. Keep it up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((d) => (
        <BookingDisputeCard key={d.id} dispute={d} onAfterAction={async () => { await load(); onResolved?.(); }} />
      ))}
    </div>
  );
}

function formatCountdown(dueIso: string): { text: string; overdue: boolean } {
  const due = new Date(dueIso).getTime();
  const ms = due - Date.now();
  if (ms < 0) return { text: "Overdue — B_ is reviewing", overdue: true };
  const hrs = Math.floor(ms / 3_600_000);
  if (hrs >= 24) return { text: `${Math.floor(hrs / 24)}d ${hrs % 24}h left`, overdue: false };
  if (hrs >= 1)  return { text: `${hrs}h left`, overdue: false };
  const mins = Math.max(1, Math.floor(ms / 60_000));
  return { text: `${mins}m left`, overdue: false };
}

function BookingDisputeCard({
  dispute,
  onAfterAction,
}: {
  dispute: BookingDisputeRow;
  onAfterAction: () => Promise<void> | void;
}) {
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [refundTo, setRefundTo] = useState<"wallet" | "bank">("wallet");
  const countdown = formatCountdown(dispute.provider_response_due_at);

  const handleRespond = async () => {
    if (response.trim().length < 10) {
      toast.error("Please explain your side (10+ characters)");
      return;
    }
    try {
      setSubmitting(true);
      const res = await respondToBookingDispute(dispute.id, response.trim());
      toast.success(res?.review ? "B_ has reviewed — see below" : "Response submitted");
      await onAfterAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    try {
      setActioning(true);
      const res = await acceptBookingDisputeAi(dispute.id, refundTo);
      toast.success(
        res.refunded > 0
          ? `Resolved · R${res.refunded.toFixed(2)} to client ${refundTo}`
          : `Resolved: ${res.resolution_type.replace(/_/g, " ")}`,
      );
      await onAfterAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setActioning(false);
    }
  };

  const handleEscalate = async () => {
    try {
      setActioning(true);
      await escalateBookingDispute(dispute.id, "Provider escalated after B_ review");
      toast.success("Escalated to BION admin");
      await onAfterAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to escalate");
    } finally {
      setActioning(false);
    }
  };

  const serviceTitle = dispute.booking?.service?.title ?? "Booking";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 space-y-3 bg-coral/5 border border-coral/20"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-coral" />
          <div>
            <p className="text-sm font-semibold text-coral">{serviceTitle}</p>
            <p className="text-[11px] text-muted-foreground">
              R{Number(dispute.amount_rand).toFixed(2)} · {dispute.client?.full_name ?? "Client"}
            </p>
          </div>
        </div>
        {dispute.status === "opened" && (
          <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${
            countdown.overdue ? "bg-coral/20 text-coral" : "bg-amber/10 text-amber"
          }`}>
            <Clock className="w-3 h-3" />
            {countdown.text}
          </div>
        )}
        {dispute.status === "escalated" && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-amber/10 text-amber">Escalated</span>
        )}
      </div>

      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Client complaint</p>
        <p className="text-xs text-foreground whitespace-pre-wrap">{dispute.reason}</p>
      </div>

      {dispute.provider_response ? (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Your response</p>
          <p className="text-xs text-foreground whitespace-pre-wrap">{dispute.provider_response}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Your response</label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Tell B_ what happened. Be specific — what was delivered, when, any context."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-coral/50 resize-none"
          />
          <button
            onClick={handleRespond} disabled={submitting || response.trim().length < 10}
            className="w-full py-2.5 rounded-xl bg-coral text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit to B_ for review
          </button>
        </div>
      )}

      {dispute.b_ai_recommendation && (
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo/15 to-teal/10 border border-indigo/30 space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo" />
            <p className="text-xs font-semibold text-foreground">B_ recommends</p>
          </div>
          <p className="text-sm font-semibold text-indigo capitalize">
            {dispute.b_ai_recommendation.replace(/_/g, " ")}
            {dispute.b_ai_partial_pct ? ` · ${Number(dispute.b_ai_partial_pct).toFixed(0)}%` : ""}
          </p>
          {dispute.b_ai_reasoning && (
            <p className="text-xs text-foreground/80 leading-relaxed">{dispute.b_ai_reasoning}</p>
          )}
        </div>
      )}

      {dispute.status === "b_ai_reviewed" && (
        <div className="space-y-2">
          {(dispute.b_ai_recommendation === "partial_refund" || dispute.b_ai_recommendation === "full_refund") && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">Refund to:</span>
              <button
                onClick={() => setRefundTo("wallet")}
                className={`px-2 py-1 rounded-lg border text-[11px] ${
                  refundTo === "wallet" ? "border-teal/50 bg-teal/10 text-teal" : "border-white/10 text-muted-foreground"
                }`}
              >
                Client wallet
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
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAccept} disabled={actioning}
              className="py-2 rounded-lg bg-teal/10 text-teal text-[11px] font-semibold disabled:opacity-50"
            >
              Accept B_'s recommendation
            </button>
            <button
              onClick={handleEscalate} disabled={actioning}
              className="py-2 rounded-lg bg-amber/10 text-amber text-[11px] font-semibold disabled:opacity-50"
            >
              Escalate to admin
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
