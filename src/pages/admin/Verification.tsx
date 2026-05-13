import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { authFetch } from "@/lib/authFetch";
import { AdminMfaProvider, useAdminMfa } from "@/hooks/useAdminMfa";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, Clock, Loader2, FileText, User,
  ExternalLink, AlertCircle, Award, CreditCard, Shield, Building2,
  Sparkles, Search,
ArrowLeft, } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

/** QA audit pass-2 A2-4 (2026-04-28): fire-and-forget audit log write
 *  for KYC decisions (doc verify / reject / provider auto-promote).
 *  Posts to the admin-token-gated POST /api/admin/audit-log endpoint.
 *  Best-effort — a logging failure shouldn't block the admin's action,
 *  but we surface in dev console so it's visible. */
async function logAuditAction(
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, any>,
  adminUserId?: string | null,
): Promise<void> {
  try {
    // Backend requireAdmin needs the JWT (Bearer); X-Admin-Token alone 401s.
    await authFetch(`/api/admin/audit-log`, {
      method: "POST",
      body: JSON.stringify({ admin_user_id: adminUserId ?? "system", action, target_type: targetType, target_id: targetId, details }),
    });
  } catch (err: any) {
    if (import.meta.env.DEV) console.warn("[admin verification] audit log failed:", err?.message);
  }
}

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
  return (
    <AdminMfaProvider>
      <AdminVerificationInner />
    </AdminMfaProvider>
  );
}

function AdminVerificationInner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mfaProtectedFetch } = useAdminMfa();
  const [manualOpen, setManualOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<any>>([]);
  const [searching, setSearching] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<any | null>(null);
  const [verifyReason, setVerifyReason] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pendingProviders, setPendingProviders] = useState<Array<any>>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [orphans, setOrphans] = useState<Array<any>>([]);
  const [orphansLoading, setOrphansLoading] = useState(false);
  const [orphansSelected, setOrphansSelected] = useState<Set<string>>(new Set());
  const [orphansCleanupOpen, setOrphansCleanupOpen] = useState(false);
  const [orphansCleanupReason, setOrphansCleanupReason] = useState("");
  const [orphansCleaning, setOrphansCleaning] = useState(false);

  const buildHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    } as Record<string, string>;
  };

  const loadPending = async () => {
    setPendingLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/providers/pending`, {
        method: "GET",
        headers: await buildHeaders(),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? `Pending list failed (${r.status})`);
      setPendingProviders(j.results ?? []);
    } catch (err: any) {
      // Quiet — admin sees an empty section instead of an error toast on
      // every page load. Real errors land in console for debugging.
      console.error("[admin verification] pending fetch failed:", err?.message);
      setPendingProviders([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const loadOrphans = async () => {
    setOrphansLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/orphans/scan`, {
        method: "GET",
        headers: await buildHeaders(),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? `Orphan scan failed (${r.status})`);
      setOrphans(j.results ?? []);
      setOrphansSelected(new Set());
    } catch (err: any) {
      console.error("[admin verification] orphan scan failed:", err?.message);
      setOrphans([]);
    } finally {
      setOrphansLoading(false);
    }
  };

  const submitOrphanCleanup = async () => {
    if (orphansSelected.size === 0) return;
    if (orphansCleanupReason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters.");
      return;
    }
    setOrphansCleaning(true);
    try {
      const r = await mfaProtectedFetch(`${API_URL}/api/admin/orphans/cleanup`, {
        method: "POST",
        headers: await buildHeaders(),
        body: JSON.stringify({
          ids: Array.from(orphansSelected),
          reason: orphansCleanupReason.trim(),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? `Cleanup failed (${r.status})`);
      toast.success(`Deleted ${j.deleted ?? 0} of ${j.attempted ?? 0} orphan(s).`);
      setOrphansCleanupOpen(false);
      setOrphansCleanupReason("");
      void loadOrphans();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not delete orphans");
    } finally {
      setOrphansCleaning(false);
    }
  };

  useEffect(() => {
    loadPending();
    loadOrphans();
  }, []);

  const runProviderSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/providers/search`, {
        method: "POST",
        headers: await buildHeaders(),
        body: JSON.stringify({ q: searchQuery.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? `Search failed (${r.status})`);
      setSearchResults(j.results ?? []);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not search providers");
    } finally {
      setSearching(false);
    }
  };

  const submitManualVerify = async () => {
    if (!verifyTarget) return;
    if (verifyReason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters — explain why we're bypassing the doc flow.");
      return;
    }
    setVerifying(true);
    try {
      const r = await mfaProtectedFetch(`${API_URL}/api/admin/providers/verify-manual`, {
        method: "POST",
        headers: await buildHeaders(),
        body: JSON.stringify({ profileId: verifyTarget.id, reason: verifyReason.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? `Verify failed (${r.status})`);
      toast.success(`${verifyTarget.full_name ?? "Provider"} verified.`);
      setVerifyTarget(null);
      setVerifyReason("");
      // Refresh both the search list (if open) and the pending queue
      void runProviderSearch();
      void loadPending();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not verify provider");
    } finally {
      setVerifying(false);
    }
  };

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
      // Doc-type alignment fix (2026-04-29): KYC submit-documents writes
      // "id_document", "proof_of_address", "regulator_certificate". The
      // page previously checked for "sa_id" / "professional_reg" /
      // "qualifications" — types KYC never produces — so the
      // auto-promote-to-verified branch never fired in prod even after
      // admin approved everything. Aligned with kyc.ts.
      // 2026-04-29 (Mistake 23): two paths submit docs with different
      // doc_type values:
      //   • /pages/provider/Verification.tsx (in-app, the path Skin
      //     Nourishers and every active provider uses) — writes
      //     'sa_id', 'professional_reg', 'qualifications', plus optional
      //     'insurance' / 'business_reg' / 'proof_address'.
      //   • /api/kyc/provider/submit-documents (legacy signup wizard
      //     path, less commonly hit) — writes 'id_document',
      //     'proof_of_address', 'regulator_certificate'.
      // Mistake 12's fix aligned to the legacy path, so the in-app
      // provider UI's uploads never tripped the auto-promote. Now we
      // treat either naming scheme as valid — provider auto-promotes
      // when EITHER set of three is fully verified.
      const REQUIRED_PROVIDER_UI = ["sa_id", "professional_reg", "qualifications"];
      const REQUIRED_KYC_API     = ["id_document", "proof_of_address", "regulator_certificate"];
      const allDone =
        REQUIRED_PROVIDER_UI.every(r => verified.has(r)) ||
        REQUIRED_KYC_API.every(r => verified.has(r));
      if (allDone) {
        // 2026-04-29 (Mistake 20): the original dual-write targeted
        // profiles.provider_status / .provider_status_at, but those
        // columns were dropped in Multi-Role Step 4 of the migration —
        // leaving the legacy update silently 400'ing inside a try/catch
        // and the auto-promote dead. Now we only touch columns that
        // actually exist: profiles.identity_verified for the audit
        // signal, and provider_profiles.provider_status for the
        // canonical verified state.
        const updateAt = new Date().toISOString();
        const { error: profErr } = await supabase.from("profiles").update({
          identity_verified: true,
          identity_verified_at: updateAt,
          verified_by: user?.id,
        } as any).eq("id", providerId);
        if (profErr) console.error("[admin verification] profile identity_verified update failed:", profErr.message);

        try {
          const { data: row } = await supabase
            .from("profiles").select("user_id").eq("id", providerId).maybeSingle();
          const userId = (row as any)?.user_id;
          if (userId) {
            const { error: ppErr } = await supabase.from("provider_profiles" as any).update({
              provider_status: "verified",
            }).eq("user_id", userId);
            if (ppErr) console.error("[admin verification] provider_profiles status update failed:", ppErr.message);
          }
        } catch (e: any) {
          console.error("[admin verification] provider_profiles dual-write error:", e?.message);
        }

        // QA audit pass-2 C-5: log the provider promotion.
        logAuditAction(
          "provider_promoted",
          "provider",
          providerId,
          { identity_verified: true, provider_status: "verified" },
          user?.id ?? null,
        );

        // Notify the provider via backend email endpoint
        try {
          await fetch(`${API_URL}/api/email/verification-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: providerId, status: "verified" }),
          });
        } catch { /* email is best-effort */ }
      }
    } catch (err) {
      console.error("[admin verification] provider promote skipped:", err);
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

      // QA audit pass-2 A2-4: log the verification decision.
      logAuditAction(
        "provider_document_verified",
        "provider_document",
        doc.id,
        { provider_id: doc.provider_id, doc_type: doc.doc_type, file_name: doc.file_name },
        user?.id ?? null,
      );

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

      // QA audit pass-2 A2-4: log the rejection decision (with reason).
      logAuditAction(
        "provider_document_rejected",
        "provider_document",
        rejectModal.id,
        {
          provider_id: rejectModal.provider_id,
          doc_type: rejectModal.doc_type,
          file_name: rejectModal.file_name,
          reason: rejectNotes || "Document rejected — please re-upload",
        },
        user?.id ?? null,
      );

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
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-24 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Provider Verification</h1>
            <p className="text-xs text-muted-foreground">Review and approve KYC documents</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setManualOpen(v => !v)}
              className="text-xs text-indigo font-medium px-3 py-1.5 rounded-pill border border-indigo/20 bg-indigo/5 hover:bg-indigo/10 transition-colors flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Verify Manually
            </button>
            <button onClick={loadDocs}
              className="text-xs text-teal font-medium px-3 py-1.5 rounded-pill border border-teal/20 bg-teal/5 hover:bg-teal/10 transition-colors">
              Refresh
            </button>
          </div>
        </div>

        {/* Manual-verify panel — collapsed by default. Search providers
            by name / email / phone, pick one, give a reason, MFA
            challenge fires, profile is flipped to verified. */}
        <AnimatePresence>
          {manualOpen && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <GlassCard className="p-4 border border-indigo/20">
                <div className="flex items-start gap-3 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Manual Verification (override)</p>
                    <p className="text-[11px] text-muted-foreground">
                      Bypass the doc-submission flow when a provider has been vetted off-platform.
                      Requires admin MFA + a written reason for audit.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") void runProviderSearch(); }}
                      placeholder="Name, email, or phone (+27...)"
                      className="w-full pl-9 pr-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40" />
                  </div>
                  <button onClick={() => void runProviderSearch()} disabled={searching || searchQuery.trim().length < 2}
                    className="px-4 py-2 rounded-xl text-xs font-semibold gradient-indigo text-primary-foreground disabled:opacity-40">
                    {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {searchResults.map((row: any) => {
                      const verified = row.identity_verified === true ||
                                       row.provider_profile?.provider_status === "verified";
                      // Only providers can be manually verified — verifying a
                      // client would incorrectly insert a provider_profiles row
                      // and convert their account silently. Walkthrough caught
                      // this 2026-04-29: Lee Grant (client) showed a Verify
                      // button even though it'd mis-promote him.
                      const isProvider = row.primary_role === "provider";
                      return (
                        <div key={row.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-sm font-medium text-foreground truncate">{row.full_name ?? "(no name)"}</p>
                              {verified && <span className="text-[9px] px-1.5 py-0.5 rounded-pill bg-teal/15 text-teal font-semibold uppercase">Verified</span>}
                              {row.primary_role && <span className="text-[9px] px-1.5 py-0.5 rounded-pill bg-white/[0.05] text-muted-foreground">{row.primary_role}</span>}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {row.email ?? "—"} · {row.phone ?? "no phone"} · {row.city ?? "no city"}
                            </p>
                            {row.provider_profile?.specialty && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{row.provider_profile.specialty}</p>
                            )}
                          </div>
                          {!verified && isProvider && (
                            <button onClick={() => { setVerifyTarget(row); setVerifyReason(""); }}
                              className="shrink-0 px-3 py-1.5 rounded-pill text-[11px] font-semibold gradient-teal text-obsidian">
                              Verify
                            </button>
                          )}
                          {!verified && !isProvider && (
                            <span className="shrink-0 text-[10px] text-muted-foreground italic">
                              not a provider
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verify confirmation modal */}
        <AnimatePresence>
          {verifyTarget && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => !verifying && setVerifyTarget(null)}
                className="fixed inset-0 bg-obsidian/70 z-[100]" />
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-md rounded-3xl p-5"
                  style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-indigo" />
                    <h3 className="text-base font-bold text-foreground">Manually verify {verifyTarget.full_name}?</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    This bypasses the standard doc-submission flow. Provide a reason for the audit log
                    (e.g. "Regulator confirmed via phone", "Known business — verified via in-person meeting").
                  </p>
                  <textarea
                    value={verifyReason}
                    onChange={e => setVerifyReason(e.target.value)}
                    placeholder="Why are we bypassing the doc flow?"
                    rows={3}
                    className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40 mb-3" />
                  <p className="text-[10px] text-muted-foreground mb-3">
                    Tap Verify → admin MFA challenge fires → profile is marked verified + provider is emailed.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setVerifyTarget(null)} disabled={verifying}
                      className="flex-1 py-2 rounded-pill text-xs font-semibold glass-1 text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                    <button onClick={() => void submitManualVerify()} disabled={verifying || verifyReason.trim().length < 10}
                      className="flex-1 py-2 rounded-pill text-xs font-semibold text-white bg-gradient-to-r from-teal to-emerald-400 disabled:opacity-40 flex items-center justify-center gap-1.5">
                      {verifying ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…</> : "Verify"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Error banner */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-coral/30 bg-coral/10 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
            <p className="text-xs text-coral">{error}</p>
          </motion.div>
        )}

        {/* Pending Providers — verified-status queue. Shows every
            primary_role=provider profile that isn't both
            identity_verified=true AND provider_status='verified'.
            Admin can one-click → MFA → verified. Updates after each
            successful verify so the list shrinks to nothing as the
            queue clears. */}
        {(pendingLoading || pendingProviders.length > 0) && (
          <GlassCard className="p-4 border border-amber/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber" />
                <p className="text-sm font-medium text-foreground">
                  Pending Providers
                  {!pendingLoading && (
                    <span className="ml-2 text-[11px] font-data text-amber">{pendingProviders.length}</span>
                  )}
                </p>
              </div>
              <button onClick={loadPending} disabled={pendingLoading}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1" aria-label="Loading" title="Loading">
                {pendingLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
              </button>
            </div>
            {pendingLoading && pendingProviders.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Loading…</p>
            ) : pendingProviders.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">All caught up — no providers awaiting verification.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingProviders.map((row: any) => {
                  const noLogin = (row.login_count ?? 0) === 0;
                  const docsState = row.provider_profile?.provider_status ?? "no provider profile";
                  // Belt-and-braces: if the backend filter ever includes
                  // a partially-verified row (e.g. provider_status=verified
                  // but identity_verified=false), don't render a Verify
                  // button on top of an already-good profile.
                  const verified = row.identity_verified === true ||
                                   row.provider_profile?.provider_status === "verified";
                  return (
                    <div key={row.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">{row.full_name ?? "(no name)"}</p>
                          {verified ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-pill bg-teal/15 text-teal font-semibold uppercase">Verified</span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-pill bg-amber/10 text-amber font-semibold uppercase">
                              {docsState.replace(/_/g, " ")}
                            </span>
                          )}
                          {noLogin && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-pill bg-coral/10 text-coral font-medium">
                              never logged in
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {row.email ?? "—"} · {row.phone ?? "no phone"} · {row.city ?? "no city"}
                        </p>
                        {row.provider_profile?.specialty && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{row.provider_profile.specialty}</p>
                        )}
                      </div>
                      {!verified && (
                        <button onClick={() => { setVerifyTarget(row); setVerifyReason(""); }}
                          className="shrink-0 px-3 py-1.5 rounded-pill text-[11px] font-semibold gradient-teal text-obsidian">
                          Verify
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}

        {/* Orphan Auth Users — auth.users rows with no matching profile.
            These block re-signups even after the precheck Mistake 21 fix
            because supabase.auth.signUp checks auth.users uniqueness on
            its own. The daily cron auto-deletes orphans >7 days old that
            never signed in; this panel handles edge cases (recent
            signups, partially-completed accounts) under MFA. */}
        {(orphansLoading || orphans.length > 0) && (
          <GlassCard className="p-4 border border-coral/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-coral" />
                <p className="text-sm font-medium text-foreground">
                  Orphan Auth Users
                  {!orphansLoading && (
                    <span className="ml-2 text-[11px] font-data text-coral">{orphans.length}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {orphansSelected.size > 0 && (
                  <button onClick={() => setOrphansCleanupOpen(true)}
                    className="text-[10px] px-2.5 py-1 rounded-pill bg-coral/15 text-coral font-semibold hover:bg-coral/25">
                    Delete {orphansSelected.size}
                  </button>
                )}
                <button onClick={loadOrphans} disabled={orphansLoading}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1" aria-label="Loading" title="Loading">
                  {orphansLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3 italic">
              auth.users rows with no profile. Block new signups with the same phone/email until cleaned. Daily cron auto-deletes those &gt;7d old without sign-in; tick the rest manually.
            </p>
            {orphansLoading && orphans.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Loading…</p>
            ) : orphans.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No orphan auth users — clean.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orphans.map((row: any) => {
                  const checked = orphansSelected.has(row.id);
                  const everSignedIn = !!row.last_sign_in_at;
                  return (
                    <label key={row.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        checked ? "bg-coral/10 border-coral/40" : "bg-white/[0.03] border-white/[0.05] hover:border-white/[0.12]"
                      }`}>
                      <input type="checkbox" checked={checked}
                        onChange={(e) => {
                          const next = new Set(orphansSelected);
                          if (e.target.checked) next.add(row.id); else next.delete(row.id);
                          setOrphansSelected(next);
                        }}
                        className="shrink-0 w-4 h-4 accent-coral" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <p className="text-xs font-medium text-foreground truncate">
                            {row.email ?? row.phone ?? "(no contact)"}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-pill bg-white/[0.05] text-muted-foreground font-data">
                            {row.age_days}d old
                          </span>
                          {everSignedIn && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-pill bg-amber/15 text-amber font-medium">
                              signed in before
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate font-data">
                          {row.id} · {row.email ? row.phone ?? "no phone" : ""}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}

        {/* Orphan cleanup confirmation modal */}
        <AnimatePresence>
          {orphansCleanupOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => !orphansCleaning && setOrphansCleanupOpen(false)}
                className="fixed inset-0 bg-obsidian/70 z-[100]" />
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-md rounded-3xl p-5"
                  style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-coral" />
                    <h3 className="text-base font-bold text-foreground">Delete {orphansSelected.size} orphan auth user{orphansSelected.size === 1 ? "" : "s"}?</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    This permanently removes the auth.users row(s). The next signup attempt with the same phone/email will be allowed. Audit-logged with your reason.
                  </p>
                  <textarea
                    value={orphansCleanupReason}
                    onChange={e => setOrphansCleanupReason(e.target.value)}
                    placeholder="e.g. Lee Grant's stale orphans from partial signups Apr 20+27 — re-engagement requires the original phone to be free"
                    rows={3}
                    className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-coral/40 mb-3" />
                  <p className="text-[10px] text-muted-foreground mb-3">
                    Tap Delete → admin MFA challenge fires → ids removed from auth.users.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setOrphansCleanupOpen(false)} disabled={orphansCleaning}
                      className="flex-1 py-2 rounded-pill text-xs font-semibold glass-1 text-muted-foreground hover:text-foreground">
                      Cancel
                    </button>
                    <button onClick={() => void submitOrphanCleanup()}
                      disabled={orphansCleaning || orphansCleanupReason.trim().length < 10}
                      className="flex-1 py-2 rounded-pill text-xs font-semibold text-white bg-gradient-to-r from-coral to-rose-500 disabled:opacity-40 flex items-center justify-center gap-1.5">
                      {orphansCleaning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</> : "Delete"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
      setResult({ ocr, hpcsa } as any);
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
