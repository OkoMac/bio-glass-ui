import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Sparkles, Loader2, Send, Plus, Trash2 } from "lucide-react";
import { useOrderDispute, submitProviderResponse, resolveDispute } from "@/hooks/useDisputes";
import { toast } from "sonner";

interface Props {
  orderId: string;
  onResolved?: () => void;
}

/**
 * Provider-side dispute UI.
 * Phase 1: provider submits statement → triggers B_ review
 * Phase 2: provider acts on B_ recommendation (refund / replace / escalate)
 */
export default function ProviderDisputePanel({ orderId, onResolved }: Props) {
  const { dispute, refresh, loading } = useOrderDispute(orderId);
  const [statement, setStatement] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [orderId]);

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
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Evidence (photo URLs)</label>
            {evidence.map((u, i) => (
              <div key={i} className="flex items-center gap-2 mt-1">
                <span className="flex-1 text-xs text-foreground/70 truncate">{u}</span>
                <button onClick={() => setEvidence(evidence.filter((_, j) => j !== i))}>
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input
                value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground focus:outline-none"
              />
              <button onClick={() => { if (newUrl) { setEvidence([...evidence, newUrl]); setNewUrl(""); } }}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-foreground">
                <Plus className="w-3 h-3" />
              </button>
            </div>
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
