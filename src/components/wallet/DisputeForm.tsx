import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, AlertTriangle, Send, Trash2, Sparkles, Loader2, Clock, CheckCircle } from "lucide-react";
import {
  raiseDispute, useOrderDispute, resolveDispute,
  openBookingDispute, useBookingDispute, escalateBookingDispute,
} from "@/hooks/useDisputes";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/useUpload";

const REASONS_ORDER = [
  { value: "never_arrived",     label: "Never arrived" },
  { value: "damaged",           label: "Arrived damaged" },
  { value: "wrong_item",        label: "Wrong item received" },
  { value: "not_as_described",  label: "Not as described" },
  { value: "quality_issue",     label: "Quality issue" },
  { value: "other",             label: "Other" },
];

const REASONS_BOOKING = [
  { value: "service_not_delivered",  label: "Service not delivered" },
  { value: "materially_different",   label: "Materially different" },
  { value: "provider_late",          label: "Provider late (30min+)" },
  { value: "unsafe_or_unprofessional", label: "Unsafe / unprofessional" },
  { value: "quality_issue",          label: "Quality issue" },
  { value: "other",                  label: "Other" },
];

interface Props {
  /** Pass EITHER orderId (product-order dispute) OR bookingId (service-booking dispute). */
  orderId?: string;
  bookingId?: string;
  onClose: () => void;
}

/**
 * Unified dispute form. Accepts either a product order id (legacy flow via
 * order_disputes RPCs) or a booking id (new /api/disputes flow with 3-day
 * provider response + B_ AI mediation + 7-day target).
 */
export default function DisputeForm({ orderId, bookingId, onClose }: Props) {
  if (bookingId) return <BookingDisputeView bookingId={bookingId} onClose={onClose} />;
  return <OrderDisputeView orderId={orderId!} onClose={onClose} />;
}

/* ─────────────────────────────────────────────────────────────
 * Order-dispute view (unchanged legacy flow)
 * ────────────────────────────────────────────────────────── */
function OrderDisputeView({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const REASONS = REASONS_ORDER;
  const { dispute, refresh } = useOrderDispute(orderId);
  const [reason, setReason] = useState(REASONS[0].value);
  const [statement, setStatement] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { upload, uploading } = useImageUpload({ bucket: "bion-evidence", folder: "disputes" });
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  const handleEvidenceFile = async (file: File) => {
    try {
      const url = await upload(file);
      setEvidence((prev) => [...prev, url]);
      toast.success("Photo added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [orderId]);

  const handleSubmit = async () => {
    if (statement.trim().length < 10) {
      toast.error("Please describe what happened (10+ characters)");
      return;
    }
    try {
      setSubmitting(true);
      await raiseDispute(orderId, reason, statement.trim(), evidence);
      toast.success("Dispute opened. Provider will respond, then B_ mediates.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptReplacement = async () => {
    if (!dispute) return;
    try {
      await resolveDispute(dispute.id, "replaced");
      toast.success("Replacement accepted. Provider will re-ship.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-background border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-coral/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-coral" />
            </div>
            <div>
              <p className="text-sm font-semibold">Report a problem</p>
              <p className="text-[11px] text-muted-foreground">B_ mediates after both sides respond</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Already-opened dispute view */}
        {dispute ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-coral/5 border border-coral/20 space-y-2">
              <p className="text-xs font-semibold text-coral capitalize">
                {REASONS.find(r => r.value === dispute.reason)?.label ?? dispute.reason}
              </p>
              <p className="text-xs text-foreground whitespace-pre-wrap">{dispute.buyer_statement}</p>
            </div>

            {dispute.provider_statement ? (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Provider response</p>
                <p className="text-xs text-foreground whitespace-pre-wrap">{dispute.provider_statement}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                <p className="text-[11px] text-muted-foreground">Waiting for provider to respond…</p>
              </div>
            )}

            {dispute.b_recommendation && (
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo/10 to-teal/10 border border-indigo/20 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo" />
                  <p className="text-xs font-semibold text-foreground">B_ recommendation</p>
                  {typeof dispute.b_confidence === "number" && (
                    <span className="ml-auto text-[10px] text-muted-foreground">{dispute.b_confidence}% confidence</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-indigo capitalize">
                  {dispute.b_recommendation.replace(/_/g, " ")}
                </p>
                {dispute.b_reasoning && (
                  <p className="text-xs text-foreground/80">{dispute.b_reasoning}</p>
                )}

                {dispute.b_recommendation === "replace_product" && !dispute.resolution && (
                  <button
                    onClick={handleAcceptReplacement}
                    className="w-full mt-2 py-2 rounded-xl bg-indigo text-white text-xs font-semibold"
                  >
                    Accept replacement
                  </button>
                )}
              </div>
            )}

            {dispute.resolution && (
              <div className="p-3 rounded-xl bg-teal/5 border border-teal/20">
                <p className="text-xs font-semibold text-teal capitalize">Resolved: {dispute.resolution}</p>
                {dispute.resolution === "refunded" && (
                  <p className="text-[11px] text-muted-foreground mt-1">Refund credited to your wallet</p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* New dispute form */
          <>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Reason</label>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                      reason === r.value
                        ? "border-coral/50 bg-coral/10 text-foreground"
                        : "border-white/5 bg-white/[0.02] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">What happened?</label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Describe the issue. Be specific — dates, condition, what you expected vs got."
                rows={4}
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-coral/50 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Photo evidence (optional, private)</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {evidence.map((u, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 h-20">
                    <img src={u} alt={`Evidence ${i+1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEvidence(evidence.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => evidenceInputRef.current?.click()}
                  disabled={uploading}
                  className="h-20 rounded-lg border border-dashed border-white/10 hover:border-coral/40 hover:bg-white/[0.02] text-muted-foreground hover:text-foreground text-[10px] flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <><span className="text-lg leading-none">+</span><span>Add photo</span></>}
                </button>
              </div>
              <input
                ref={evidenceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleEvidenceFile(e.target.files[0]); }}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Only you, the provider, and BION admins can see these.</p>
            </div>

            <div className="p-3 rounded-xl bg-amber/5 border border-amber/20">
              <p className="text-[11px] text-amber/90">
                By opening a dispute, the order is frozen. If you accept a replacement, the buyer ships the
                original back at their own cost. If refunded, you'll receive the full amount to your wallet.
              </p>
            </div>

            <button
              onClick={handleSubmit} disabled={submitting || statement.trim().length < 10}
              className="w-full py-3 rounded-xl bg-coral text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Open dispute
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Booking-dispute view (new /api/disputes flow)
 *   stages: opened → provider_responded → b_ai_reviewed → resolved
 * ────────────────────────────────────────────────────────── */
function BookingDisputeView({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { dispute, refresh } = useBookingDispute(bookingId);
  const [reason, setReason] = useState(REASONS_BOOKING[0].value);
  const [statement, setStatement] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const { upload, uploading } = useImageUpload({ bucket: "bion-evidence", folder: "disputes" });
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  const handleEvidenceFile = async (file: File) => {
    try {
      const url = await upload(file);
      setEvidence((prev) => [...prev, url]);
      toast.success("Photo added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleSubmit = async () => {
    if (statement.trim().length < 10) {
      toast.error("Please describe what happened (10+ characters)");
      return;
    }
    try {
      setSubmitting(true);
      // Combine the reason tag with the statement so the backend has both.
      const fullReason = `${reason}: ${statement.trim()}`;
      await openBookingDispute(bookingId, fullReason, evidence);
      toast.success("Dispute opened. Provider has 3 days to respond.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!dispute) return;
    try {
      setEscalating(true);
      await escalateBookingDispute(dispute.id, "Client escalated from dispute form");
      toast.success("Escalated to BION admin");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to escalate");
    } finally {
      setEscalating(false);
    }
  };

  // Timeline state derived from status
  const stages: Array<{ key: string; label: string; done: boolean; active: boolean }> = dispute
    ? [
        { key: "opened",   label: "Opened",          done: true, active: dispute.status === "opened" },
        { key: "provider", label: "Provider responds", done: !!dispute.provider_responded_at, active: dispute.status === "provider_responded" },
        { key: "b_ai",     label: "B_ review",         done: dispute.status === "b_ai_reviewed" || dispute.status === "resolved" || dispute.status === "escalated", active: dispute.status === "b_ai_reviewed" },
        { key: "resolved", label: "Resolved",          done: dispute.status === "resolved", active: dispute.status === "escalated" },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-background border-t sm:border border-white/10 sm:rounded-3xl rounded-t-3xl p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-coral/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-coral" />
            </div>
            <div>
              <p className="text-sm font-semibold">Booking dispute</p>
              <p className="text-[11px] text-muted-foreground">B_ mediates · 7-day target</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {dispute ? (
          <div className="space-y-3">
            {/* Timeline */}
            <div className="flex items-center justify-between px-1">
              {stages.map((s, i) => (
                <div key={s.key} className="flex-1 flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    s.done ? "bg-teal text-white" :
                    s.active ? "bg-coral text-white" :
                    "bg-white/5 text-muted-foreground"
                  }`}>
                    {s.done ? <CheckCircle className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`text-[9px] mt-1 text-center ${s.active ? "text-coral font-semibold" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-coral/5 border border-coral/20 space-y-1">
              <p className="text-[10px] text-coral uppercase tracking-wider">Your complaint</p>
              <p className="text-xs text-foreground whitespace-pre-wrap">{dispute.reason}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                R{Number(dispute.amount_rand).toFixed(2)} · opened {new Date(dispute.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
              </p>
            </div>

            {dispute.provider_response ? (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Provider response</p>
                <p className="text-xs text-foreground whitespace-pre-wrap">{dispute.provider_response}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <Clock className="w-3 h-3 text-amber animate-pulse" />
                <p className="text-[11px] text-muted-foreground">
                  Waiting for provider — due{" "}
                  {new Date(dispute.provider_response_due_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                </p>
              </div>
            )}

            {dispute.b_ai_recommendation && (
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo/10 to-teal/10 border border-indigo/20 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo" />
                  <p className="text-xs font-semibold text-foreground">B_ recommendation</p>
                </div>
                <p className="text-sm font-semibold text-indigo capitalize">
                  {dispute.b_ai_recommendation.replace(/_/g, " ")}
                  {dispute.b_ai_partial_pct ? ` · ${Number(dispute.b_ai_partial_pct).toFixed(0)}%` : ""}
                </p>
                {dispute.b_ai_reasoning && (
                  <p className="text-xs text-foreground/80">{dispute.b_ai_reasoning}</p>
                )}
              </div>
            )}

            {dispute.resolution_type && dispute.status === "resolved" && (
              <div className="p-3 rounded-xl bg-teal/5 border border-teal/20 space-y-1">
                <p className="text-xs font-semibold text-teal capitalize">
                  Resolved: {dispute.resolution_type.replace(/_/g, " ")}
                  {dispute.resolution_amount_rand ? ` · R${Number(dispute.resolution_amount_rand).toFixed(2)}` : ""}
                </p>
                {dispute.resolution_refunded_to && (
                  <p className="text-[11px] text-muted-foreground">
                    Refund credited to your {dispute.resolution_refunded_to === "wallet" ? "BION Wallet" : "bank account"}
                  </p>
                )}
              </div>
            )}

            {dispute.status === "escalated" && (
              <div className="p-3 rounded-xl bg-amber/5 border border-amber/20">
                <p className="text-xs font-semibold text-amber">Escalated to BION admin</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Expect a final call within the 7-day target window.</p>
              </div>
            )}

            {/* Client escalation option while active */}
            {dispute.status !== "resolved" && dispute.status !== "escalated" && dispute.status !== "closed" && (
              <button
                onClick={handleEscalate} disabled={escalating}
                className="w-full py-2 rounded-xl bg-white/5 text-muted-foreground hover:text-foreground text-[11px] font-semibold disabled:opacity-50"
              >
                {escalating ? "Escalating…" : "Escalate to BION admin"}
              </button>
            )}
          </div>
        ) : (
          /* New dispute form */
          <>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Reason</label>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                {REASONS_BOOKING.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                      reason === r.value
                        ? "border-coral/50 bg-coral/10 text-foreground"
                        : "border-white/5 bg-white/[0.02] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">What happened?</label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Be specific — dates, what you expected vs what happened."
                rows={4}
                className="w-full mt-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-coral/50 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Evidence (optional, private)</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {evidence.map((u, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 h-20">
                    <img src={u} alt={`Evidence ${i+1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEvidence(evidence.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => evidenceInputRef.current?.click()}
                  disabled={uploading}
                  className="h-20 rounded-lg border border-dashed border-white/10 hover:border-coral/40 hover:bg-white/[0.02] text-muted-foreground hover:text-foreground text-[10px] flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                    <><span className="text-lg leading-none">+</span><span>Add photo</span></>}
                </button>
              </div>
              <input
                ref={evidenceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleEvidenceFile(e.target.files[0]); }}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Only you, the provider, and BION admins can see these.</p>
            </div>

            <div className="p-3 rounded-xl bg-amber/5 border border-amber/20">
              <p className="text-[11px] text-amber/90">
                Opening this dispute emails the provider. They have <strong>3 business days</strong> to respond, then
                B_ AI issues a recommendation. Target resolution: 7 days.
              </p>
            </div>

            <button
              onClick={handleSubmit} disabled={submitting || statement.trim().length < 10}
              className="w-full py-3 rounded-xl bg-coral text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Open dispute
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
