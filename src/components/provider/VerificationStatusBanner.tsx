import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, CheckCircle, Clock, FileWarning, ShieldCheck,
  Upload, ArrowRight, X, Landmark,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ProviderStatus = "pending_verification" | "docs_submitted" | "verified" | "rejected";

interface ProviderDoc {
  id: string;
  doc_type: string;
  status: "pending" | "verified" | "rejected";
  notes: string | null;
}

interface ProfileRow {
  provider_status: ProviderStatus | null;
  paystack_subaccount_code: string | null;
}

const REQUIRED_DOC_TYPES: { type: string; label: string }[] = [
  { type: "sa_id",           label: "SA ID / Passport" },
  { type: "professional_reg", label: "Professional registration" },
  { type: "qualifications",  label: "Qualifications" },
];

type BannerKind = "pending_none" | "pending_partial" | "submitted" | "rejected" | "verified_no_bank";

interface BannerViewModel {
  kind: BannerKind;
  statusKey: string;                    // stable key for localStorage (auto-undismisses on change)
  dismissible: boolean;
  tone: "amber" | "indigo" | "coral" | "teal";
  icon: typeof AlertTriangle;
  title: string;
  body: string;
  cta?: { label: string; to: string; icon?: typeof ArrowRight };
  rejectionReasons?: string[];
  docsProgress?: { uploaded: number; total: number };
  missingDocs?: string[];
}

/**
 * Provider verification status banner.
 *
 * Shows providers exactly what's blocking them from taking paid bookings —
 * document upload, admin review, rejection follow-up, or bank connection.
 * Renders nothing once the provider is fully operational (verified + bank linked).
 */
export default function VerificationStatusBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profileId = user?.profileId;

  const [loading, setLoading]   = useState(true);
  const [profile, setProfile]   = useState<ProfileRow | null>(null);
  const [docs, setDocs]         = useState<ProviderDoc[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // Fetch profile + documents
  useEffect(() => {
    if (!profileId) { setLoading(false); return; }

    let cancelled = false;
    (async () => {
      try {
        // provider_status lives on provider_profiles, paystack_subaccount_code on profiles
        // (Multi-Role Step 4 column move). Joining them in one select 400s with PG 42703.
        const [profileRes, providerProfileRes, docsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("paystack_subaccount_code")
            .eq("id", profileId)
            .maybeSingle(),
          supabase
            .from("provider_profiles" as any)
            .select("provider_status")
            .eq("user_id", profileId)
            .maybeSingle(),
          supabase
            .from("provider_documents" as any)
            .select("id, doc_type, status, notes")
            .eq("provider_id", profileId),
        ]);

        if (cancelled) return;
        const p  = (profileRes.data as any) ?? {};
        const pp = (providerProfileRes.data as any) ?? {};
        setProfile({
          provider_status: pp.provider_status ?? null,
          paystack_subaccount_code: p.paystack_subaccount_code ?? null,
        } as unknown as ProfileRow);
        setDocs(((docsRes.data as unknown as ProviderDoc[]) ?? []));
      } catch {
        /* best-effort — banner stays hidden on failure */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profileId]);

  // Derive the banner view-model
  const vm = useMemo<BannerViewModel | null>(() => {
    if (!profile) return null;

    const status: ProviderStatus = (profile.provider_status ?? "pending_verification") as ProviderStatus;
    const hasBank = !!profile.paystack_subaccount_code;

    // Fully operational — no banner needed
    if (status === "verified" && hasBank) return null;

    const uploadedTypes = new Set(docs.map(d => d.doc_type));
    const requiredUploaded = REQUIRED_DOC_TYPES.filter(r => uploadedTypes.has(r.type));
    const missingRequired  = REQUIRED_DOC_TYPES.filter(r => !uploadedTypes.has(r.type));

    if (status === "rejected") {
      const reasons = docs
        .filter(d => d.status === "rejected" && d.notes && d.notes.trim().length > 0)
        .map(d => d.notes as string);
      return {
        kind: "rejected",
        statusKey: "rejected",
        dismissible: false,
        tone: "coral",
        icon: FileWarning,
        title: "One or more documents were rejected",
        body: "Please review the feedback below and re-upload the flagged documents so we can verify your account.",
        cta: { label: "Review documents", to: "/pro/verification", icon: ArrowRight },
        rejectionReasons: reasons,
      };
    }

    if (status === "docs_submitted") {
      return {
        kind: "submitted",
        statusKey: "docs_submitted",
        dismissible: true,
        tone: "indigo",
        icon: Clock,
        title: "Under review",
        body: "We'll email you within 1 business day once our compliance team has reviewed your documents.",
      };
    }

    if (status === "verified" && !hasBank) {
      return {
        kind: "verified_no_bank",
        statusKey: "verified_no_bank",
        dismissible: true,
        tone: "teal",
        icon: ShieldCheck,
        title: "You're verified — connect a bank to start receiving payouts",
        body: "Bookings will route directly to your SA bank account via Paystack once your bank is linked.",
        cta: { label: "Connect bank", to: "/pro/settings?tab=billing", icon: Landmark },
      };
    }

    // pending_verification
    if (requiredUploaded.length === 0) {
      return {
        kind: "pending_none",
        statusKey: "pending_none",
        dismissible: false,
        tone: "amber",
        icon: AlertTriangle,
        title: "Upload your verification documents to start taking bookings",
        body: "BION needs to verify your practice before clients can book paid sessions with you.",
        cta: { label: "Upload documents", to: "/pro/verification", icon: Upload },
        docsProgress: { uploaded: 0, total: REQUIRED_DOC_TYPES.length },
        missingDocs: missingRequired.map(d => d.label),
      };
    }

    // Some but not all required docs uploaded
    return {
      kind: "pending_partial",
      statusKey: `pending_partial_${requiredUploaded.length}`,
      dismissible: false,
      tone: "amber",
      icon: AlertTriangle,
      title: `Keep going — ${requiredUploaded.length} of ${REQUIRED_DOC_TYPES.length} documents uploaded`,
      body: "Upload the remaining required documents to submit for verification.",
      cta: { label: "Complete verification", to: "/pro/verification", icon: ArrowRight },
      docsProgress: { uploaded: requiredUploaded.length, total: REQUIRED_DOC_TYPES.length },
      missingDocs: missingRequired.map(d => d.label),
    };
  }, [profile, docs]);

  // localStorage dismissal — keyed by profileId + statusKey, so it auto-undismisses on status change
  const dismissKey = vm && profileId ? `bion_dismissed_verification_banner_${profileId}_${vm.statusKey}` : null;

  useEffect(() => {
    if (!dismissKey) { setDismissed(false); return; }
    try {
      setDismissed(localStorage.getItem(dismissKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [dismissKey]);

  const handleDismiss = () => {
    if (!dismissKey) return;
    try { localStorage.setItem(dismissKey, "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  // Gate rendering
  if (!profileId) return null;
  if (loading) return null;
  if (!vm) return null;
  if (vm.dismissible && dismissed) return null;

  // Tone → tailwind classes (leveraging existing glass-accent-* utilities)
  const toneStyles: Record<BannerViewModel["tone"], { card: string; icon: string; badge: string; cta: string }> = {
    amber:  { card: "glass-accent-amber",  icon: "text-amber",  badge: "bg-amber/15 text-amber",   cta: "gradient-indigo text-primary-foreground" },
    coral:  { card: "glass-accent-coral",  icon: "text-coral",  badge: "bg-coral/15 text-coral",   cta: "bg-coral text-white" },
    indigo: { card: "glass-accent-indigo", icon: "text-indigo", badge: "bg-indigo/15 text-indigo", cta: "gradient-indigo text-primary-foreground" },
    teal:   { card: "glass-accent-teal",   icon: "text-teal",   badge: "bg-teal/15 text-teal",     cta: "gradient-indigo text-primary-foreground" },
  };
  const t = toneStyles[vm.tone];
  const Icon = vm.icon;
  const CtaIcon = vm.cta?.icon ?? ArrowRight;

  return (
    <AnimatePresence>
      <motion.div
        key={vm.statusKey}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className={`${t.card} rounded-2xl shadow-card p-4 md:p-5 relative`}
      >
        {vm.dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="absolute top-3 right-3 w-7 h-7 rounded-full glass-1 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.badge}`}>
            <Icon className={`w-5 h-5 ${t.icon}`} />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <p className="text-sm font-semibold text-foreground">{vm.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{vm.body}</p>

            {/* Docs checklist (pending states) */}
            {vm.docsProgress && (
              <div className="mt-3 space-y-2">
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(vm.docsProgress.uploaded / vm.docsProgress.total) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${vm.tone === "amber" ? "bg-amber" : "bg-indigo"}`}
                  />
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mt-2">
                  {REQUIRED_DOC_TYPES.map(d => {
                    const uploaded = docs.some(doc => doc.doc_type === d.type);
                    return (
                      <li key={d.type} className="flex items-center gap-1.5 text-[11px]">
                        {uploaded ? (
                          <CheckCircle className="w-3 h-3 text-teal shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-muted-foreground/40 shrink-0" />
                        )}
                        <span className={uploaded ? "text-foreground" : "text-muted-foreground"}>
                          {d.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Rejection reasons */}
            {vm.rejectionReasons && vm.rejectionReasons.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {vm.rejectionReasons.map((reason, i) => (
                  <li key={i} className="text-[11px] text-coral italic leading-relaxed border-l-2 border-coral/40 pl-2">
                    "{reason}"
                  </li>
                ))}
              </ul>
            )}

            {/* CTA */}
            {vm.cta && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(vm.cta!.to)}
                className={`mt-4 inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-xs font-semibold shadow-cta ${t.cta}`}
              >
                <CtaIcon className="w-3.5 h-3.5" />
                {vm.cta.label}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
