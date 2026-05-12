import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Upload, FileText, Shield, CheckCircle, AlertCircle,
  Clock, Camera, X, Eye, Trash2, CreditCard, Award, Building2, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Document {
  id: string;
  type: string;
  name: string;
  status: "pending" | "verified" | "rejected";
  uploadedAt: string;
  fileUrl?: string;
  preview?: string;
}

const REQUIRED_DOCS = [
  { type: "sa_id", label: "South African ID / Passport", desc: "Clear copy of your SA ID book, smart ID card, or passport", icon: CreditCard, required: true },
  { type: "professional_reg", label: "Professional Registration", desc: "HPCSA, SANC, SAPC, AHPCSA, or relevant body registration certificate", icon: Award, required: true },
  { type: "qualifications", label: "Qualifications", desc: "Degree, diploma, or certification relevant to your services", icon: FileText, required: true },
  { type: "insurance", label: "Professional Indemnity Insurance", desc: "Current proof of professional indemnity or liability insurance", icon: Shield, required: false },
  { type: "business_reg", label: "Business Registration (CIPC)", desc: "Company registration certificate if operating as a business", icon: Building2, required: false },
  { type: "proof_address", label: "Proof of Address", desc: "Utility bill or bank statement (not older than 3 months)", icon: FileText, required: false },
];

const BUCKET_NAME = "provider-documents";

export default function ProviderVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocType, setActiveDocType] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [regNumber, setRegNumber] = useState("");

  const isDemo = user?.id?.startsWith("demo_") ?? false;
  const supabaseId = !isDemo && user?.profileId ? user.profileId : null;

  // Load existing documents on mount
  useEffect(() => {
    const load = async () => {
      if (!supabaseId) {
        // Demo mode: load from localStorage
        try {
          const stored = localStorage.getItem("bion_provider_docs");
          if (stored) setDocuments(JSON.parse(stored));
        } catch { /* ignore */ }
        try {
          setRegNumber(localStorage.getItem("bion_provider_reg_number") ?? "");
        } catch { /* ignore */ }
        setLoading(false);
        return;
      }

      try {
        // Load documents from Supabase
        const { data, error: dbError } = await supabase
          .from("provider_documents" as any)
          .select("*")
          .eq("provider_id", supabaseId)
          .order("uploaded_at", { ascending: false });

        if (dbError) throw dbError;

        if (data) {
          const mapped: Document[] = (data as any[]).map(d => ({
            id: d.id,
            type: d.doc_type,
            name: d.file_name,
            status: d.status,
            uploadedAt: new Date(d.uploaded_at).toLocaleDateString("en-ZA"),
            fileUrl: d.file_url,
          }));
          setDocuments(mapped);
        }

        // Load reg number from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("professional_reg_number")
          .eq("id", supabaseId)
          .single();
        if (profile && (profile as any).professional_reg_number) {
          setRegNumber((profile as any).professional_reg_number);
        }
      } catch (err: any) {
        if (import.meta.env.DEV) console.error("[verification] load error:", err);
        setError("Could not load existing documents. They will still be saved when you upload.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [supabaseId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDocType) return;
    e.target.value = ""; // reset so same file can be re-selected

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload JPEG, PNG, WEBP, HEIC, or PDF.");
      setTimeout(() => setError(null), 5000);
      return;
    }

    setUploadingType(activeDocType);
    setError(null);

    // Demo mode: store in localStorage
    if (!supabaseId) {
      const reader = new FileReader();
      reader.onload = () => {
        const newDoc: Document = {
          id: `doc_${Date.now()}`,
          type: activeDocType,
          name: file.name,
          status: "pending",
          uploadedAt: new Date().toLocaleDateString("en-ZA"),
          preview: file.type.startsWith("image/") ? (reader.result as string) : undefined,
        };
        const updated = [...documents.filter(d => d.type !== activeDocType), newDoc];
        setDocuments(updated);
        localStorage.setItem("bion_provider_docs", JSON.stringify(updated));
        setUploadingType(null);
        setActiveDocType(null);
        setSuccess("Document saved (demo mode)");
        setTimeout(() => setSuccess(null), 3000);
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      // Upload to Supabase Storage
      const ext = file.name.split(".").pop() ?? "bin";
      const filePath = `${supabaseId}/${activeDocType}_${Date.now()}.${ext}`;

      // Delete any existing file for this doc type first
      const existing = documents.find(d => d.type === activeDocType);
      if (existing?.fileUrl) {
        // Extract path from URL
        const urlParts = existing.fileUrl.split(`${BUCKET_NAME}/`);
        if (urlParts[1]) {
          await supabase.storage.from(BUCKET_NAME).remove([urlParts[1]]);
        }
        await supabase.from("provider_documents" as any).delete().eq("id", existing.id);
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the URL (signed since bucket is private)
      const { data: signedData, error: signedError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      if (signedError) throw signedError;
      const fileUrl = signedData.signedUrl;

      // Save metadata to provider_documents table
      const { data: insertData, error: insertError } = await supabase
        .from("provider_documents" as any)
        .insert({
          provider_id: supabaseId,
          doc_type: activeDocType,
          file_name: file.name,
          file_url: fileUrl,
          status: "pending",
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state
      const newDoc: Document = {
        id: (insertData as any).id,
        type: activeDocType,
        name: file.name,
        status: "pending",
        uploadedAt: new Date().toLocaleDateString("en-ZA"),
        fileUrl,
      };

      setDocuments(prev => [...prev.filter(d => d.type !== activeDocType), newDoc]);
      setSuccess(`${REQUIRED_DOCS.find(r => r.type === activeDocType)?.label} uploaded successfully`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[verification] upload error:", err);
      setError(err.message ?? "Upload failed. Please try again.");
      setTimeout(() => setError(null), 6000);
    } finally {
      setUploadingType(null);
      setActiveDocType(null);
    }
  };

  const deleteDoc = async (doc: Document) => {
    if (!confirm(`Delete ${doc.name}? This cannot be undone.`)) return;

    if (!supabaseId) {
      // Demo mode
      const updated = documents.filter(d => d.id !== doc.id);
      setDocuments(updated);
      localStorage.setItem("bion_provider_docs", JSON.stringify(updated));
      return;
    }

    try {
      // Delete from storage
      if (doc.fileUrl) {
        const urlParts = doc.fileUrl.split(`${BUCKET_NAME}/`);
        if (urlParts[1]) {
          const path = urlParts[1].split("?")[0]; // strip query string
          await supabase.storage.from(BUCKET_NAME).remove([path]);
        }
      }
      // Delete metadata
      await supabase.from("provider_documents" as any).delete().eq("id", doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[verification] delete error:", err);
      setError("Could not delete document. Please try again.");
    }
  };

  const saveRegNumber = async () => {
    if (!supabaseId) {
      localStorage.setItem("bion_provider_reg_number", regNumber);
      setSuccess("Saved");
      setTimeout(() => setSuccess(null), 2000);
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ professional_reg_number: regNumber } as any)
        .eq("id", supabaseId);
      if (error) {
        // Column may not exist — fall back to localStorage
        localStorage.setItem("bion_provider_reg_number", regNumber);
      }
      setSuccess("Registration number saved");
      setTimeout(() => setSuccess(null), 2500);
    } catch {
      localStorage.setItem("bion_provider_reg_number", regNumber);
    }
  };

  const uploadedTypes = new Set(documents.map(d => d.type));
  const requiredDone = REQUIRED_DOCS.filter(d => d.required).every(d => uploadedTypes.has(d.type));
  const totalUploaded = documents.length;
  const verifiedCount = documents.filter(d => d.status === "verified").length;

  const [submitting, setSubmitting] = useState(false);
  const [submittedFor, setSubmittedFor] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<string>("pending_verification");

  // Fetch current provider_status once we have a profile ID
  useEffect(() => {
    (async () => {
      if (!user?.profileId) return;
      // Multi-Role Step 4: provider_status moved off profiles. Look up
      // user_id from profiles, then read provider_profiles.provider_status.
      const { data: prof } = await supabase
        .from("profiles").select("user_id").eq("id", user.profileId).maybeSingle();
      const userId = (prof as any)?.user_id;
      if (!userId) return;
      const { data: pp } = await supabase
        .from("provider_profiles" as any).select("provider_status").eq("user_id", userId).maybeSingle();
      if ((pp as any)?.provider_status) setProviderStatus((pp as any).provider_status);
    })();
  }, [user?.profileId]);

  /** Submit uploaded docs for B_ AI + admin review. Flips provider_status. */
  const submitForReview = async () => {
    if (!user?.profileId) { setError("Please finish onboarding first."); return; }
    if (!requiredDone)   { setError("Upload all required documents before submitting for review."); return; }
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      // Backend route is requireAuth — without the Bearer token every
      // submit returned 401 and the provider saw "Submission failed"
      // with no path to fix it. Switched to authFetch (auto-injects
      // session token + same-origin relay + 15s timeout).
      const { authFetch } = await import("@/lib/authFetch");
      const findPath = (t: string) => documents.find(d => d.type === t)?.fileUrl;
      const res = await authFetch(`/api/kyc/provider/submit-documents`, {
        method: "POST",
        body: JSON.stringify({
          profileId: user.profileId,
          regulator_body: regNumber ? "HPCSA" : "NONE",  // simplification: any non-empty reg number → HPCSA lookup
          regulator_number: regNumber || null,
          id_document_path: findPath("sa_id"),
          proof_of_address_path: findPath("proof_address"),
          regulator_certificate_path: findPath("professional_reg"),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Submission failed");
      setProviderStatus(data.provider_status);
      setSubmittedFor(data.auto_verified
        ? "Your account is verified — you can now take bookings on BION."
        : "Documents submitted for review. Our compliance team reviews within 1 business day. You'll be notified when approved.");
      setSuccess(data.auto_verified ? "Verified ✓" : "Submitted for review");
    } catch (err: any) {
      setError(err.message ?? "Submission failed");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" onChange={handleFileSelect} className="hidden" />

        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center md:hidden">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Verification</h1>
            <p className="text-xs text-muted-foreground">Upload documents to verify your practice</p>
          </div>
        </div>

        {/* Error / Success banners */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-coral/30 bg-coral/10 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
            <p className="text-xs text-coral">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-teal/30 bg-teal/10 p-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
            <p className="text-xs text-teal">{success}</p>
          </motion.div>
        )}

        {/* Status card */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              providerStatus === "verified" ? "bg-teal/10"
              : providerStatus === "docs_submitted" ? "bg-indigo/10"
              : requiredDone ? "bg-teal/10" : "bg-amber/10"
            }`}>
              {loading ? <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" /> :
                providerStatus === "verified" ? <CheckCircle className="w-6 h-6 text-teal" /> :
                providerStatus === "docs_submitted" ? <Clock className="w-6 h-6 text-indigo" /> :
                requiredDone ? <CheckCircle className="w-6 h-6 text-teal" /> : <Clock className="w-6 h-6 text-amber" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                {loading ? "Loading documents..."
                 : providerStatus === "verified" ? "Verified — you can take bookings"
                 : providerStatus === "docs_submitted" ? "Under review"
                 : requiredDone ? "Ready to submit" : "Upload required documents"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {/* When the account is already verified (e.g. admin override or
                    pre-existing trust), don't surface a "0 of 6 uploaded" count
                    that contradicts the verified state. The status banner above
                    is the authoritative signal. */}
                {providerStatus === "verified"
                  ? (totalUploaded > 0
                      ? `All documents on file · ${verifiedCount} of ${totalUploaded} verified`
                      : "All set — bookings are enabled")
                  : <>
                      {totalUploaded} of {REQUIRED_DOCS.length} documents uploaded
                      {verifiedCount > 0 && ` · ${verifiedCount} verified`}
                    </>}
              </p>
              <div className="h-1.5 rounded-full bg-white/5 mt-2">
                <div className={`h-full rounded-full transition-all ${
                  providerStatus === "verified" ? "bg-teal"
                  : providerStatus === "docs_submitted" ? "bg-indigo"
                  : requiredDone ? "bg-teal" : "bg-amber"
                }`}
                  style={{ width: `${Math.round((totalUploaded / REQUIRED_DOCS.length) * 100)}%` }} />
              </div>
            </div>
          </div>

          {providerStatus === "pending_verification" && requiredDone && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={submitting}
              onClick={submitForReview}
              className="mt-4 w-full rounded-pill py-3 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit for verification"}
            </motion.button>
          )}
          {submittedFor && (
            <p className="mt-3 text-xs text-muted-foreground">{submittedFor}</p>
          )}
        </GlassCard>

        {/* Registration number */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-indigo" />
            <p className="text-sm font-semibold text-foreground">Professional Registration Number</p>
          </div>
          <div className="flex gap-2">
            <input value={regNumber}
              onChange={e => setRegNumber(e.target.value)}
              placeholder="e.g. MP 0123456 (HPCSA)"
              className="flex-1 px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors" />
            <button onClick={saveRegNumber}
              className="px-4 py-2.5 rounded-xl gradient-indigo text-white text-xs font-semibold" title="Save" aria-label="Save">
              Save
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            HPCSA, SANC, SAPC, AHPCSA, or industry-specific registration number
          </p>
        </GlassCard>

        {/* Document list */}
        <div className="space-y-2">
          {REQUIRED_DOCS.map(docType => {
            const uploaded = documents.find(d => d.type === docType.type);
            const Icon = docType.icon;
            const isUploading = uploadingType === docType.type;

            return (
              <GlassCard key={docType.type} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    uploaded?.status === "verified" ? "bg-teal/10" :
                    uploaded ? "bg-amber/10" : "bg-white/[0.03]"
                  }`}>
                    {isUploading ? <Loader2 className="w-4 h-4 text-indigo animate-spin" /> :
                      uploaded?.status === "verified" ? <CheckCircle className="w-4 h-4 text-teal" /> :
                      uploaded ? <Clock className="w-4 h-4 text-amber" /> :
                      <Icon className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{docType.label}</p>
                      {docType.required && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-coral/10 text-coral border border-coral/20">Required</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{docType.desc}</p>

                    {uploaded && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{uploaded.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Uploaded {uploaded.uploadedAt} ·{" "}
                            <span className={
                              uploaded.status === "verified" ? "text-teal" :
                              uploaded.status === "rejected" ? "text-coral" : "text-amber"
                            }>
                              {uploaded.status === "verified" ? "Verified" :
                               uploaded.status === "rejected" ? "Rejected" : "Under review"}
                            </span>
                          </p>
                        </div>
                        {uploaded.fileUrl && (
                          <a href={uploaded.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-teal transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button onClick={() => deleteDoc(uploaded)}
                          className="text-muted-foreground hover:text-coral transition-colors" title="deleteDoc(uploaded)} className='text-muted-foreground hover:text-coral transi…" aria-label="deleteDoc(uploaded)} className='text-muted-foreground hover:text-coral transi…">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <motion.button whileTap={{ scale: 0.95 }}
                    disabled={isUploading}
                    onClick={() => { setActiveDocType(docType.type); fileInputRef.current?.click(); }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 ${
                      isUploading ? "glass-1 text-muted-foreground" :
                      uploaded ? "glass-1 text-muted-foreground hover:text-foreground" :
                      "bg-gradient-to-r from-indigo to-violet text-white"
                    }`}>
                    {isUploading ? <Loader2 className="w-3 h-3 inline animate-spin" /> : <Upload className="w-3 h-3 inline mr-1" />}
                    {isUploading ? " Uploading..." : uploaded ? "Replace" : "Upload"}
                  </motion.button>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Info card */}
        <GlassCard variant="accent-indigo" className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Why we verify</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Verification protects both you and your clients. Verified providers receive a badge on their profile, appear higher in search results, and build trust with potential clients. Documents are stored securely in South Africa and processed in compliance with POPIA.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <BionAssistant />
      <ProviderNav />
    </div>
  );
}
