import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle, XCircle, Clock, Loader2, FileText, User,
  ExternalLink, Filter, AlertCircle, Award, CreditCard, Shield, Building2,
  Sparkles, Search,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface PendingDoc {
  id: string;
  provider_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  status: "pending" | "verified" | "rejected";
  uploaded_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  // Joined provider info
  provider_name?: string;
  provider_email?: string;
}

const DOC_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  sa_id:           { label: "SA ID / Passport",       icon: CreditCard },
  professional_reg:{ label: "Professional Reg",        icon: Award },
  qualifications:  { label: "Qualifications",         icon: FileText },
  insurance:       { label: "Indemnity Insurance",    icon: Shield },
  business_reg:    { label: "Business Reg (CIPC)",    icon: Building2 },
  proof_address:   { label: "Proof of Address",       icon: FileText },
};

const STATUS_CONFIG = {
  pending:  { label: "Pending Review", color: "text-amber",  bg: "bg-amber/10",  border: "border-amber/20",  icon: Clock },
  verified: { label: "Verified",       color: "text-teal",   bg: "bg-teal/10",   border: "border-teal/20",   icon: CheckCircle },
  rejected: { label: "Rejected",       color: "text-coral",  bg: "bg-coral/10",  border: "border-coral/20",  icon: XCircle },
};

export default function AdminVerification() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<PendingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<PendingDoc | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Load all documents
  const loadDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all provider documents (admin RLS allows reading all)
      const { data, error: dbError } = await supabase
        .from("provider_documents" as any)
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (dbError) throw dbError;

      // Fetch provider names from profiles
      const docsList = (data as any[]) ?? [];
      const providerIds = [...new Set(docsList.map(d => d.provider_id))];

      if (providerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", providerIds);

        const profileMap = new Map<string, { name: string; email: string }>();
        (profiles as any[] ?? []).forEach(p => {
          profileMap.set(p.id, { name: p.full_name ?? "Unknown", email: p.email ?? "" });
        });

        docsList.forEach(d => {
          const profile = profileMap.get(d.provider_id);
          d.provider_name = profile?.name ?? "Unknown Provider";
          d.provider_email = profile?.email ?? "";
        });
      }

      setDocs(docsList);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[admin verification] load error:", err);
      setError(err.message ?? "Could not load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, []);

  // Filter docs
  const filtered = useMemo(() => {
    if (filter === "all") return docs;
    return docs.filter(d => d.status === filter);
  }, [docs, filter]);

  // Group by provider
  const byProvider = useMemo(() => {
    const groups = new Map<string, { providerId: string; providerName: string; providerEmail: string; docs: PendingDoc[] }>();
    filtered.forEach(d => {
      const key = d.provider_id;
      if (!groups.has(key)) {
        groups.set(key, {
          providerId: d.provider_id,
          providerName: d.provider_name ?? "Unknown",
          providerEmail: d.provider_email ?? "",
          docs: [],
        });
      }
      groups.get(key)!.docs.push(d);
    });
    return Array.from(groups.values());
  }, [filtered]);

  // Counts
  const counts = useMemo(() => ({
    all:      docs.length,
    pending:  docs.filter(d => d.status === "pending").length,
    verified: docs.filter(d => d.status === "verified").length,
    rejected: docs.filter(d => d.status === "rejected").length,
  }), [docs]);

  /** Once a provider has all required docs verified, promote profiles.provider_status
   *  to 'verified' — that's the flag the booking checkout endpoint gates on. */
  const maybePromoteProvider = async (providerId: string) => {
    try {
      const { data: providerDocs } = await supabase
        .from("provider_documents" as any)
        .select("doc_type, status")
        .eq("provider_id", providerId);
      const rows = (providerDocs ?? []) as any[];
      const verified = new Set(rows.filter(d => d.status === "verified").map(d => d.doc_type));
      const REQUIRED = ["sa_id", "professional_reg", "qualifications"];
      const allDone = REQUIRED.every(r => verified.has(r));
      if (allDone) {
        await supabase.from("profiles").update({
          provider_status: "verified",
          provider_status_at: new Date().toISOString(),
          identity_verified: true,
          identity_verified_at: new Date().toISOString(),
        }).eq("id", providerId);

        // Notify the provider via backend email endpoint
        try {
          await fetch(`${API}/api/email/verification-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Admin-Token": token },
            body: JSON.stringify({ profileId: providerId, status: "verified" }),
          });
        } catch { /* email is best-effort */ }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[admin verification] provider promote skipped:", err);
    }
  };

  // Approve action
  const approveDoc = async (doc: PendingDoc) => {
    setActionLoading(doc.id);
    try {
      const { error: updateError } = await supabase
        .from("provider_documents" as any)
        .update({
          status: "verified",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        } as any)
        .eq("id", doc.id);

      if (updateError) throw updateError;

      setDocs(prev => prev.map(d =>
        d.id === doc.id
          ? { ...d, status: "verified", reviewed_at: new Date().toISOString(), reviewed_by: user?.id }
          : d
      ));

      // Promote the provider once all required docs are verified.
      await maybePromoteProvider(doc.provider_id);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[admin verification] approve error:", err);
      setError(err.message ?? "Could not approve document");
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject action (opens modal first)
  const openRejectModal = (doc: PendingDoc) => {
    setRejectModal(doc);
    setRejectNotes("");
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      const { error: updateError } = await supabase
        .from("provider_documents" as any)
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          notes: rejectNotes || "Document rejected — please re-upload",
        } as any)
        .eq("id", rejectModal.id);

      if (updateError) throw updateError;

      setDocs(prev => prev.map(d =>
        d.id === rejectModal.id
          ? { ...d, status: "rejected", reviewed_at: new Date().toISOString(), notes: rejectNotes || "Document rejected" }
          : d
      ));
      setRejectModal(null);
      setRejectNotes("");
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[admin verification] reject error:", err);
      setError(err.message ?? "Could not reject document");
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Provider Verification</h1>
            <p className="text-xs text-muted-foreground">Review and approve KYC documents</p>
          </div>
          <button onClick={loadDocs}
            className="text-xs text-teal font-medium px-3 py-1.5 rounded-pill border border-teal/20 bg-teal/5 hover:bg-teal/10 transition-colors">
            Refresh
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-coral/30 bg-coral/10 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
            <p className="text-xs text-coral">{error}</p>
          </motion.div>
        )}

        {/* Filter tabs */}
        <div className="grid grid-cols-4 gap-2">
          {(["pending", "verified", "rejected", "all"] as const).map(f => {
            const count = counts[f];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`py-2.5 rounded-2xl text-xs font-medium border transition-all ${
                  filter === f
                    ? f === "pending" ? "border-amber/40 bg-amber/10 text-amber" :
                      f === "verified" ? "border-teal/40 bg-teal/10 text-teal" :
                      f === "rejected" ? "border-coral/40 bg-coral/10 text-coral" :
                      "border-indigo/40 bg-indigo/10 text-indigo"
                    : "border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                }`}>
                <span className="capitalize">{f}</span>
                <span className="ml-1.5 font-data">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Document list grouped by provider */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : byProvider.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-teal/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">No {filter !== "all" ? filter : ""} documents</p>
            <p className="text-xs text-muted-foreground">
              {filter === "pending" ? "All caught up — no documents waiting for review." :
               filter === "verified" ? "No verified documents yet." :
               filter === "rejected" ? "No rejected documents." :
               "No provider documents have been uploaded yet."}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {byProvider.map(group => (
              <GlassCard key={group.providerId} className="p-4">
                {/* Provider header */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-indigo" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{group.providerName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{group.providerEmail || group.providerId}</p>
                  </div>
                  <span className="text-xs font-data text-muted-foreground">{group.docs.length} doc{group.docs.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Document rows */}
                <div className="space-y-2">
                  {group.docs.map(doc => {
                    const docMeta = DOC_LABELS[doc.doc_type] ?? { label: doc.doc_type, icon: FileText };
                    const Icon = docMeta.icon;
                    const status = STATUS_CONFIG[doc.status];
                    const StatusIcon = status.icon;
                    const isLoading = actionLoading === doc.id;

                    return (
                      <div key={doc.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${status.bg}`}>
                            <Icon className={`w-4 h-4 ${status.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-foreground">{docMeta.label}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${status.color} ${status.border} ${status.bg}`}>
                                <StatusIcon className="w-2.5 h-2.5 inline mr-0.5" />
                                {status.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{doc.file_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Uploaded {new Date(doc.uploaded_at).toLocaleDateString("en-ZA")}
                              {doc.reviewed_at && ` · Reviewed ${new Date(doc.reviewed_at).toLocaleDateString("en-ZA")}`}
                            </p>
                            {doc.notes && (
                              <p className="text-[10px] text-coral mt-1 italic">"{doc.notes}"</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            {doc.file_url && (
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] px-2 py-1 rounded-lg border border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-white/[0.16] flex items-center gap-1 transition-colors">
                                <ExternalLink className="w-3 h-3" /> View
                              </a>
                            )}
                            {doc.status === "pending" && (
                              <>
                                {doc.doc_type === "professional_reg" && (
                                  <VerifyHelperButton doc={doc} />
                                )}
                                <button onClick={() => approveDoc(doc)} disabled={isLoading}
                                  className="text-[10px] px-2 py-1 rounded-lg bg-teal/10 border border-teal/30 text-teal hover:bg-teal/20 flex items-center gap-1 transition-colors disabled:opacity-50">
                                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Approve
                                </button>
                                <button onClick={() => openRejectModal(doc)} disabled={isLoading}
                                  className="text-[10px] px-2 py-1 rounded-lg bg-coral/10 border border-coral/30 text-coral hover:bg-coral/20 flex items-center gap-1 transition-colors disabled:opacity-50">
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRejectModal(null)} className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-md mx-auto rounded-3xl p-6"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Reject Document</h3>
                  <p className="text-[10px] text-muted-foreground">{DOC_LABELS[rejectModal.doc_type]?.label} from {rejectModal.provider_name}</p>
                </div>
              </div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">Reason for rejection</label>
              <textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder="e.g. Document is blurry, expired, or doesn't match provider name..."
                rows={4}
                className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-coral/40 transition-colors resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                The provider will see this message and can re-upload.
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setRejectModal(null)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border border-white/[0.08] bg-white/[0.02] text-muted-foreground">
                  Cancel
                </button>
                <button onClick={confirmReject} disabled={actionLoading === rejectModal.id}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-coral to-red-500 disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {actionLoading === rejectModal.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BionAssistant />
      <AdminNav />
    </div>
  );
}

/* ── Helper: AI-assisted verification (GPT-4o OCR + HPCSA registry lookup) ── */
interface VerifyResult {
  ocr?: {
    ok: boolean;
    documentType?: string;
    registrationNumber?: string;
    issuingBody?: string;
    practitionerName?: string;
    profession?: string;
    confidence?: "high" | "medium" | "low";
    reason?: string;
  };
  hpcsa?: {
    ok: boolean;
    verified: boolean;
    registeredName?: string | null;
    profession?: string | null;
    status?: string;
    nameMatchScore?: number | null;
    sourceUrl?: string;
    reason?: string;
  };
}

function VerifyHelperButton({ doc }: { doc: PendingDoc }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const runChecks = async () => {
    setBusy(true);
    setResult(null);
    try {
      // 1. OCR the document image
      const ocrRes = await fetch(`${API_URL}/api/verify/ocr-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: doc.file_url }),
      });
      const ocr = await ocrRes.json();

      let hpcsa = null;
      // 2. If OCR found a reg number, query the HPCSA registry
      if (ocr?.ok && ocr.registrationNumber) {
        const hRes = await fetch(`${API_URL}/api/verify/hpcsa`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registrationNumber: ocr.registrationNumber,
            providerName: doc.provider_name,
          }),
        });
        hpcsa = await hRes.json();
      }
      setResult({ ocr, hpcsa });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); if (!result) runChecks(); }}
        className="text-[10px] px-2 py-1 rounded-lg bg-indigo/10 border border-indigo/30 text-indigo hover:bg-indigo/20 flex items-center gap-1 transition-colors"
      >
        <Sparkles className="w-3 h-3" /> Verify
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-md mx-auto rounded-3xl p-6"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-indigo" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground">AI verification</h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {doc.provider_name} · {doc.file_name}
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {busy && (
                <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Reading document and querying HPCSA…</span>
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  {/* OCR card */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Document OCR</p>
                      {result.ocr?.confidence && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          result.ocr.confidence === "high"   ? "bg-teal/10 text-teal"   :
                          result.ocr.confidence === "medium" ? "bg-amber/10 text-amber" :
                                                              "bg-coral/10 text-coral"
                        }`}>
                          {result.ocr.confidence} confidence
                        </span>
                      )}
                    </div>
                    {result.ocr?.ok ? (
                      <dl className="space-y-1 text-xs">
                        <Row label="Type"  value={result.ocr.documentType} />
                        <Row label="Reg #" value={result.ocr.registrationNumber} mono />
                        <Row label="Issued by" value={result.ocr.issuingBody} />
                        <Row label="Name"  value={result.ocr.practitionerName} />
                        <Row label="Profession" value={result.ocr.profession} />
                      </dl>
                    ) : (
                      <p className="text-xs text-coral">{result.ocr?.reason ?? "OCR failed"}</p>
                    )}
                  </div>

                  {/* HPCSA card */}
                  {result.hpcsa && (
                    <div className={`rounded-xl border p-3 ${
                      result.hpcsa.verified ? "bg-teal/5 border-teal/20" : "bg-amber/5 border-amber/20"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">HPCSA registry</p>
                        {result.hpcsa.verified
                          ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal/10 text-teal">Found</span>
                          : <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber/10 text-amber">Not found</span>}
                      </div>
                      {result.hpcsa.verified ? (
                        <dl className="space-y-1 text-xs">
                          <Row label="Registered name" value={result.hpcsa.registeredName ?? "—"} />
                          <Row label="Profession" value={result.hpcsa.profession ?? "—"} />
                          <Row label="Status" value={result.hpcsa.status ?? "—"} />
                          {typeof result.hpcsa.nameMatchScore === "number" && (
                            <Row label="Name match"
                              value={`${result.hpcsa.nameMatchScore}%`}
                              tone={result.hpcsa.nameMatchScore >= 60 ? "good" : "warn"} />
                          )}
                          {result.hpcsa.sourceUrl && (
                            <a href={result.hpcsa.sourceUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-indigo underline inline-flex items-center gap-1 mt-1">
                              <ExternalLink className="w-2.5 h-2.5" /> Open HPCSA page
                            </a>
                          )}
                        </dl>
                      ) : (
                        <p className="text-xs text-amber">{result.hpcsa.reason ?? "Couldn't verify with HPCSA"}</p>
                      )}
                    </div>
                  )}

                  {!result.hpcsa && result.ocr?.ok && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      No registration number extracted from document — skipped HPCSA lookup.
                    </p>
                  )}

                  <p className="text-[10px] text-muted-foreground text-center">
                    AI-assisted only — final approval is your call.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Row({ label, value, mono, tone }: { label: string; value?: string | null; mono?: boolean; tone?: "good" | "warn" }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className={`text-right truncate ${mono ? "font-mono" : ""} ${
        tone === "good" ? "text-teal" : tone === "warn" ? "text-amber" : "text-foreground"
      }`}>{value}</dd>
    </div>
  );
}
