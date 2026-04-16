/**
 * /corporate/beneficial-owners
 *
 * Corporate beneficial ownership (BO) declaration form.
 *
 * FICA / POPIA context:
 * A corporate account whose monthly wellness budget exceeds R50,000 is
 * considered a higher-risk customer under our AML/KYC policy and must declare
 * the natural persons who ultimately own or control the business (≥ 25% equity
 * or control). Wallet top-ups above the threshold are blocked until this
 * declaration has been submitted and approved by BION compliance.
 *
 * Backend contract:
 *   GET  /api/compliance/corporate/:profileId/required
 *   POST /api/compliance/corporate/beneficial-owners
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import GlassCard from "@/components/GlassCard";
import CorporateNav from "@/components/CorporateNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { validateSaId } from "@/lib/saIdValidator";
import {
  Shield, Plus, Trash2, Info, AlertTriangle, CheckCircle2,
  Clock, XCircle, Send, Loader2, ArrowLeft,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type BoStatus = "not_required" | "required" | "submitted" | "approved" | "rejected";

interface BeneficialOwner {
  full_name: string;
  id_number: string;
  ownership_pct: string;    // keep as string in form, coerce on submit
  position: string;
}

interface RequiredResponse {
  ok: boolean;
  required: boolean;
  threshold_rand: number;
  monthly_budget_rand: number;
  bo_status: BoStatus;
  // These last two are optional — current backend returns the status only,
  // but admin-review updates may expand the payload later.
  company_name?: string;
  bo_reviewed_at?: string | null;
  bo_reject_reason?: string | null;
  existing_owners?: Array<{
    full_name: string;
    id_number: string;
    ownership_pct: number;
    position?: string;
  }>;
}

function emptyOwner(): BeneficialOwner {
  return { full_name: "", id_number: "", ownership_pct: "", position: "" };
}

// Passport: min 6 alphanumeric chars. SA ID: 13 digits + Luhn via saIdValidator.
function validateIdOrPassport(id: string): { ok: boolean; error?: string } {
  const cleaned = id.replace(/[\s-]/g, "");
  if (!cleaned) return { ok: false, error: "ID or passport required" };
  // If it's 13 digits, treat as SA ID and run Luhn.
  if (/^\d{13}$/.test(cleaned)) {
    const r = validateSaId(cleaned);
    return r.valid ? { ok: true } : { ok: false, error: r.error ?? "Invalid SA ID" };
  }
  // Otherwise passport-style: 6+ alphanumerics
  if (/^[A-Za-z0-9]{6,}$/.test(cleaned)) return { ok: true };
  return {
    ok: false,
    error: "Must be a 13-digit SA ID or a passport (6+ letters/digits)",
  };
}

function StatusBanner({
  status,
  data,
  onResubmit,
}: {
  status: BoStatus;
  data: RequiredResponse | null;
  onResubmit: () => void;
}) {
  if (!data) return null;
  const monthly = data.monthly_budget_rand ?? 0;

  if (status === "not_required") {
    return (
      <GlassCard className="p-4 border border-indigo/20">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">No declaration required</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Under R50,000/mo — no BO declaration required. You can still declare voluntarily.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (status === "required") {
    return (
      <GlassCard className="p-4 border border-amber/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber">Action required</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Monthly budget R{monthly.toLocaleString()} — you must declare your
              beneficial owners before wallet top-ups can be processed.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (status === "submitted") {
    return (
      <GlassCard className="p-4 border border-indigo/30">
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-indigo shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-indigo">Under review</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Your declaration is under review. BION compliance responds within 1 business day.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (status === "approved") {
    const when = data.bo_reviewed_at
      ? new Date(data.bo_reviewed_at).toLocaleDateString("en-ZA", {
          day: "numeric", month: "long", year: "numeric",
        })
      : null;
    return (
      <GlassCard className="p-4 border border-teal/30">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-teal shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-teal">Approved</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Your beneficial ownership declaration was approved
              {when ? ` on ${when}` : ""}.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (status === "rejected") {
    return (
      <GlassCard className="p-4 border border-coral/30">
        <div className="flex items-start gap-3">
          <XCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-coral">Declaration rejected</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {data.bo_reject_reason
                ? data.bo_reject_reason
                : "Please review the details and submit a corrected declaration."}
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onResubmit}
              className="mt-3 px-4 py-1.5 rounded-pill bg-coral/15 border border-coral/30 text-coral text-xs font-semibold">
              Resubmit
            </motion.button>
          </div>
        </div>
      </GlassCard>
    );
  }

  return null;
}

export default function BeneficialOwners() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profileId = user?.profileId ?? user?.id ?? "";

  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData]             = useState<RequiredResponse | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [owners, setOwners]         = useState<BeneficialOwner[]>([emptyOwner()]);

  // Show the form whenever the user can still edit; hide it behind a button
  // when an approved/submitted record already exists (they'll click "Update"
  // or "Resubmit" to reopen).
  const [editing, setEditing] = useState(false);

  // ── Load initial status + any existing owners ─────────────────────────────
  useEffect(() => {
    if (!profileId) { setLoading(false); return; }
    let abort = false;

    (async () => {
      try {
        const res = await fetch(`${API}/api/compliance/corporate/${profileId}/required`);
        const j = (await res.json()) as RequiredResponse;
        if (abort) return;
        if (!j.ok) throw new Error("Failed to load compliance status");
        setData(j);
        if (j.company_name) setCompanyName(j.company_name);

        // Prefill company name from the corporate_account row if provided.
        // If the record has existing owners (submitted/approved/rejected),
        // preload them so the user can edit them on resubmit.
        if (Array.isArray(j.existing_owners) && j.existing_owners.length > 0) {
          setOwners(j.existing_owners.map(o => ({
            full_name: o.full_name,
            id_number: o.id_number,
            ownership_pct: String(o.ownership_pct),
            position: o.position ?? "",
          })));
        }

        // Open the form by default when action is required / rejected / not-yet-submitted
        if (j.bo_status === "required" || j.bo_status === "rejected" || j.bo_status === "not_required") {
          setEditing(true);
        }
      } catch (err: any) {
        if (!abort) toast.error(err.message ?? "Could not load compliance status");
      } finally {
        if (!abort) setLoading(false);
      }
    })();

    return () => { abort = true; };
  }, [profileId]);

  const totalPct = useMemo(() => {
    return owners.reduce((s, o) => s + (Number(o.ownership_pct) || 0), 0);
  }, [owners]);

  const addOwner = () => setOwners(prev => [...prev, emptyOwner()]);
  const removeOwner = (i: number) => setOwners(prev => prev.filter((_, idx) => idx !== i));
  const updateOwner = (i: number, patch: Partial<BeneficialOwner>) =>
    setOwners(prev => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const handleSubmit = async () => {
    if (!profileId) {
      toast.error("You must be signed in to submit a declaration.");
      return;
    }
    if (!companyName.trim()) {
      toast.error("Company name is required.");
      return;
    }
    if (owners.length === 0) {
      toast.error("Add at least one beneficial owner.");
      return;
    }

    // Per-row validation
    for (let i = 0; i < owners.length; i++) {
      const o = owners[i];
      if (!o.full_name.trim()) {
        toast.error(`Owner ${i + 1}: full name is required.`);
        return;
      }
      const idCheck = validateIdOrPassport(o.id_number);
      if (!idCheck.ok) {
        toast.error(`Owner ${i + 1}: ${idCheck.error}`);
        return;
      }
      const pct = Number(o.ownership_pct);
      if (!isFinite(pct) || pct <= 0 || pct > 100) {
        toast.error(`Owner ${i + 1}: ownership % must be between 0 and 100.`);
        return;
      }
    }

    if (totalPct > 100) {
      toast.error(`Ownership totals ${totalPct}% — must sum to 100 or less.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/compliance/corporate/beneficial-owners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          company_name: companyName.trim(),
          beneficial_owners: owners.map(o => ({
            full_name: o.full_name.trim(),
            id_number: o.id_number.replace(/[\s-]/g, ""),
            ownership_pct: Number(o.ownership_pct),
            position: o.position.trim() || undefined,
          })),
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Submission failed");

      toast.success("Declaration submitted. BION compliance will review shortly.");
      setData(prev => prev ? { ...prev, bo_status: "submitted" } : prev);
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message ?? "Could not submit declaration");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const boStatus: BoStatus = data?.bo_status ?? "not_required";
  const showExistingPreview =
    (boStatus === "submitted" || boStatus === "approved") &&
    Array.isArray(data?.existing_owners) &&
    data!.existing_owners!.length > 0 &&
    !editing;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl xl:max-w-5xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate("/corporate/dashboard")}
              className="p-2 rounded-full glass-1 hover:bg-white/5 transition-all shrink-0"
              aria-label="Back to dashboard">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber" />
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  Beneficial Ownership
                </h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                FICA compliance · Corporate wellness programs
              </p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <GlassCard className="p-6 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            <p className="text-xs text-muted-foreground">Loading compliance status…</p>
          </GlassCard>
        )}

        {!loading && (
          <>
            <StatusBanner
              status={boStatus}
              data={data}
              onResubmit={() => setEditing(true)}
            />

            {/* Explanation */}
            <GlassCard className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Declare anyone holding <strong className="text-foreground">25% or more equity</strong>
                  {" "}OR exercising control (CEO, MD, major shareholder). BION uses this
                  to comply with South African FICA requirements for corporate wellness
                  spend above R50,000/month.
                </p>
              </div>
            </GlassCard>

            {/* Read-only preview of currently-on-file owners */}
            {showExistingPreview && (
              <GlassCard className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Currently on file</p>
                    <p className="text-[11px] text-muted-foreground">
                      {boStatus === "approved"
                        ? "Approved declaration"
                        : "Awaiting compliance review"}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 rounded-pill glass-1 text-xs font-medium text-foreground hover:bg-white/5">
                    Update
                  </motion.button>
                </div>
                <div className="space-y-2">
                  {data!.existing_owners!.map((o, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{o.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {o.position ?? "—"} · ID {o.id_number}
                        </p>
                      </div>
                      <span className="text-xs font-data font-bold text-amber whitespace-nowrap">
                        {o.ownership_pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Form */}
            {editing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Company name */}
                <GlassCard className="p-5 space-y-3">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Company name
                  </label>
                  <input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Pty Ltd"
                    className="w-full glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 bg-transparent"
                  />
                </GlassCard>

                {/* Owners */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Beneficial owners</p>
                    <span className={`text-xs font-data ${
                      totalPct > 100 ? "text-coral" : "text-muted-foreground"
                    }`}>
                      Total: {totalPct}%
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {owners.map((o, i) => (
                      <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.18 }}>
                        <GlassCard className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground">
                              Owner {i + 1}
                            </p>
                            <button
                              onClick={() => removeOwner(i)}
                              disabled={owners.length === 1}
                              aria-label="Remove owner"
                              className={`p-1.5 rounded-full transition-all ${
                                owners.length === 1
                                  ? "text-muted-foreground/40 cursor-not-allowed"
                                  : "text-coral hover:bg-coral/10"
                              }`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-muted-foreground">
                                Full name <span className="text-coral">*</span>
                              </label>
                              <input
                                value={o.full_name}
                                onChange={e => updateOwner(i, { full_name: e.target.value })}
                                placeholder="e.g. Thandi Nkosi"
                                className="w-full mt-1 glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 bg-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">
                                SA ID or Passport <span className="text-coral">*</span>
                              </label>
                              <input
                                value={o.id_number}
                                onChange={e => updateOwner(i, { id_number: e.target.value })}
                                placeholder="13-digit SA ID or passport"
                                className="w-full mt-1 glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 bg-transparent font-data"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">
                                Ownership % <span className="text-coral">*</span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                value={o.ownership_pct}
                                onChange={e => updateOwner(i, { ownership_pct: e.target.value })}
                                placeholder="25"
                                className="w-full mt-1 glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 bg-transparent font-data"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">
                                Position (optional)
                              </label>
                              <input
                                value={o.position}
                                onChange={e => updateOwner(i, { position: e.target.value })}
                                placeholder="e.g. CEO, Director"
                                className="w-full mt-1 glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 bg-transparent"
                              />
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {totalPct > 100 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-2 px-3 py-2 rounded-xl bg-coral/10 border border-coral/30">
                      <AlertTriangle className="w-3.5 h-3.5 text-coral shrink-0 mt-0.5" />
                      <p className="text-xs text-coral">
                        Ownership totals {totalPct}% — must sum to 100 or less.
                      </p>
                    </motion.div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={addOwner}
                    className="w-full py-2.5 glass-1 rounded-xl text-xs font-medium text-foreground hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 border border-dashed border-white/10">
                    <Plus className="w-3.5 h-3.5" /> Add owner
                  </motion.button>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  {(boStatus === "submitted" || boStatus === "approved") && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 rounded-pill glass-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                      Cancel
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-pill gradient-indigo text-primary-foreground text-xs font-semibold disabled:opacity-60">
                    {submitting ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> Submit declaration</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <BionAssistant />
      <CorporateNav />
    </div>
  );
}
