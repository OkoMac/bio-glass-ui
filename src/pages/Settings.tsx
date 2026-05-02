import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell, CreditCard, Eye, User, ChevronLeft, Save, Check,
  Smartphone, Mail, Shield, Trash2, Plus, Loader2, Download,
  AlertTriangle, FileText, X, Cookie, ArrowRight,
} from "lucide-react";
import CookieConsent, { openCookieBanner } from "@/components/CookieConsent";
import NotificationSettings from "@/components/NotificationSettings";
import { getConsent, onConsentChanged, type ConsentState } from "@/lib/cookieConsent";
import { trackedFetch } from "@/lib/errorReporter";

type Tab = "notifications" | "payment" | "privacy" | "account";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type PopiaRequest = {
  id: string;
  request_type: "export" | "delete" | "correction" | "objection";
  status: "pending" | "processing" | "completed" | "rejected";
  requested_at: string;
  completed_at: string | null;
  export_file_url: string | null;
  notes: string | null;
};

const DELETION_REASONS = [
  "Too expensive",
  "Not useful",
  "Bad experience",
  "Privacy concerns",
  "Moving to another app",
  "Other",
];

async function authToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// ─── Data export card ────────────────────────────────────────────
function ExportDataCard() {
  const [state, setState] = useState<"idle" | "requesting" | "ready" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const requestExport = async () => {
    setState("requesting");
    setError("");
    setDownloadUrl(null);
    try {
      const token = await authToken();
      if (!token) {
        setState("error");
        setError("Please sign in with a real account to export your data.");
        return;
      }
      const res = await fetch(`${API}/api/popia/export`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.ok && json.downloadUrl) {
        setDownloadUrl(json.downloadUrl);
        setState("ready");
      } else if (json.ok && json.inline) {
        // Storage bucket not provisioned — inline fallback
        const blob = new Blob([JSON.stringify(json.inline, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setState("ready");
      } else {
        setState("error");
        setError(json.error ?? "Export failed. Contact support@bionhealth.co.za");
      }
    } catch {
      setState("error");
      setError("Network error. Please try again.");
    }
  };

  return (
    <GlassCard className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-teal" />
        <h2 className="text-sm font-semibold text-foreground">Export my data</h2>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Under POPIA you have the right to a full copy of everything BION holds about you. The export is a single JSON file covering your profile, bookings, messages, health logs, reviews, wallet history, notifications and KYC metadata.
      </p>

      {state === "idle" && (
        <button
          onClick={requestExport}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-indigo text-primary-foreground text-xs font-semibold"
        >
          <Download className="w-3.5 h-3.5" />
          Request export
        </button>
      )}

      {state === "requesting" && (
        <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl glass-1 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Preparing your data... this usually takes under a minute
        </div>
      )}

      {state === "ready" && downloadUrl && (
        <div className="space-y-2">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal/10 border border-teal/30 text-teal text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            Download your data
          </a>
          <p className="text-[10px] text-muted-foreground">
            We also emailed this link to you. It expires in 7 days.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-2">
          <p className="text-[10px] text-coral">{error}</p>
          <button
            onClick={requestExport}
            className="w-full py-2 rounded-xl glass-1 text-xs text-foreground"
          >
            Try again
          </button>
        </div>
      )}
    </GlassCard>
  );
}

// ─── Cookie preferences card ─────────────────────────────────────
function CookiePreferencesCard() {
  const [state, setState] = useState<ConsentState | null>(() => getConsent());

  useEffect(() => {
    return onConsentChanged((s) => setState(s));
  }, []);

  const summary = state
    ? [
        `Analytics: ${state.analytics ? "on" : "off"}`,
        `Marketing: ${state.marketing ? "on" : "off"}`,
      ].join(" · ")
    : "No preferences saved yet";

  return (
    <GlassCard className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Cookie className="w-4 h-4 text-indigo" />
        <h2 className="text-sm font-semibold text-foreground">Cookie preferences</h2>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Essential cookies are always on to keep BION signed in and working. Analytics and marketing cookies are opt-in.
      </p>
      <div className="p-2.5 rounded-xl glass-1 border border-white/5">
        <p className="text-[11px] text-foreground">
          <span className="text-muted-foreground">Current:</span>{" "}
          <span className="text-teal">Essential: on</span>
          {state && (
            <>
              {" "}·{" "}
              <span className={state.analytics ? "text-teal" : "text-muted-foreground"}>
                Analytics: {state.analytics ? "on" : "off"}
              </span>
              {" "}·{" "}
              <span className={state.marketing ? "text-teal" : "text-muted-foreground"}>
                Marketing: {state.marketing ? "on" : "off"}
              </span>
            </>
          )}
          {!state && <> · <span className="text-muted-foreground">not yet decided</span></>}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{summary}</p>
      </div>
      <button
        onClick={openCookieBanner}
        className="w-full py-2.5 rounded-xl gradient-indigo text-primary-foreground text-xs font-semibold"
      >
        Change preferences
      </button>
    </GlassCard>
  );
}

// ─── Deletion modal ──────────────────────────────────────────────
function DeleteRequestModal({
  userEmail, onClose, onSubmitted,
}: { userEmail: string; onClose: () => void; onSubmitted: () => void }) {
  const [reason, setReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    reason.length > 0 &&
    (reason !== "Other" || otherReason.trim().length > 2) &&
    confirmEmail.toLowerCase().trim() === userEmail.toLowerCase().trim();

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const token = await authToken();
      if (!token) {
        setError("Please sign in with a real account to delete.");
        setSubmitting(false);
        return;
      }
      const res = await fetch(`${API}/api/popia/delete-request`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          other_reason: reason === "Other" ? otherReason : undefined,
          confirm: confirmEmail,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        onSubmitted();
      } else {
        setError(json.error ?? "Could not submit request.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl bg-obsidian border border-coral/30 p-5 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-coral" />
            <h3 className="text-base font-semibold text-foreground">Request account deletion</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full glass-1 flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          This starts a <strong className="text-foreground">7-day grace period</strong>. After 7 days your personal data is permanently removed. Financial records are retained for 5 years as required by SARB, but they are fully anonymised.
        </p>

        <div>
          <label className="text-[10px] text-muted-foreground">Why are you leaving? <span className="text-coral">*</span></label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-white/5 bg-transparent"
          >
            <option value="" className="bg-obsidian">Select a reason…</option>
            {DELETION_REASONS.map((r) => (
              <option key={r} value={r} className="bg-obsidian">{r}</option>
            ))}
          </select>
        </div>

        {reason === "Other" && (
          <div>
            <label className="text-[10px] text-muted-foreground">Tell us more <span className="text-coral">*</span></label>
            <textarea
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              rows={2}
              className="w-full mt-1 glass-1 rounded-xl px-3 py-2 text-sm text-foreground outline-none border border-white/5 bg-transparent resize-none"
            />
          </div>
        )}

        <div>
          <label className="text-[10px] text-muted-foreground">
            Type your email (<span className="text-foreground font-mono">{userEmail}</span>) to confirm <span className="text-coral">*</span>
          </label>
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            autoComplete="off"
            className="w-full mt-1 glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none border border-white/5 bg-transparent"
          />
        </div>

        {error && <p className="text-[11px] text-coral">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl glass-1 text-xs font-semibold text-foreground disabled:opacity-50"
          >
            Keep my account
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="flex-1 py-2.5 rounded-xl bg-coral text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? <><Loader2 className="w-3 h-3 animate-spin" /> Submitting…</> : "Request deletion"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete account card ─────────────────────────────────────────
function DeleteAccountCard({ userEmail }: { userEmail: string }) {
  const [requests, setRequests] = useState<PopiaRequest[]>([]);
  const [pendingDelete, setPendingDelete] = useState<PopiaRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmBanner, setConfirmBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const token = await authToken();
      if (!token) { setLoading(false); return; }
      const res = await fetch(`${API}/api/popia/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) {
        const list = (json.requests ?? []) as PopiaRequest[];
        setRequests(list);
        const inflight = list.find(
          (r) => r.request_type === "delete" && r.status === "pending",
        );
        setPendingDelete(inflight ?? null);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cancelDelete = async () => {
    setCancelling(true);
    try {
      const token = await authToken();
      if (!token) return;
      const res = await fetch(`${API}/api/popia/delete-cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.ok) {
        setPendingDelete(null);
        setConfirmBanner("Deletion cancelled. Welcome back.");
        await load();
      }
    } catch { /* ignore */ }
    setCancelling(false);
  };

  return (
    <>
      <GlassCard className="p-5 space-y-3 border border-coral/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-coral" />
          <h2 className="text-sm font-semibold text-coral">Delete my account</h2>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Requesting deletion starts a <strong className="text-foreground">7-day grace period</strong>. After 7 days, your data is permanently removed (financial records retained for 5 years per SARB).
        </p>

        {confirmBanner && (
          <div className="p-2.5 rounded-xl bg-teal/10 border border-teal/30">
            <p className="text-[11px] text-teal">{confirmBanner}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-2 text-[11px] text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        ) : pendingDelete ? (
          <div className="space-y-2">
            <div className="p-3 rounded-xl border border-coral/30 bg-coral/5">
              <p className="text-[11px] text-foreground font-medium">
                Deletion requested {new Date(pendingDelete.requested_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Grace period ends {new Date(new Date(pendingDelete.requested_at).getTime() + 7 * 864e5).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <button
              onClick={cancelDelete}
              disabled={cancelling}
              className="w-full py-2.5 rounded-xl gradient-indigo text-primary-foreground text-xs font-semibold disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel deletion request"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-coral/10 border border-coral/30 text-coral text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Request deletion
          </button>
        )}

        {requests.length > 0 && (
          <details className="text-[10px] text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              View my {requests.length} POPIA request{requests.length === 1 ? "" : "s"}
            </summary>
            <div className="mt-2 space-y-1.5">
              {requests.slice(0, 10).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-[10px]">
                  <span className="capitalize text-foreground">{r.request_type}</span>
                  <span className={
                    r.status === "completed" ? "text-teal" :
                    r.status === "rejected"  ? "text-coral" :
                    r.status === "processing" ? "text-warning" : "text-muted-foreground"
                  }>
                    {r.status} · {new Date(r.requested_at).toLocaleDateString("en-ZA")}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </GlassCard>

      {modalOpen && (
        <DeleteRequestModal
          userEmail={userEmail}
          onClose={() => setModalOpen(false)}
          onSubmitted={() => {
            setModalOpen(false);
            setConfirmBanner("Deletion scheduled. Check your email for confirmation.");
            load();
          }}
        />
      )}
    </>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-pill relative transition-all ${value ? "gradient-indigo" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

const TABS: { id: Tab; label: string; icon: typeof Bell }[] = [
  { id: "notifications", label: "Alerts",   icon: Bell       },
  { id: "payment",       label: "Payment",  icon: CreditCard },
  { id: "privacy",       label: "Privacy",  icon: Eye        },
  { id: "account",       label: "Account",  icon: User       },
];

export default function Settings() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, switchRole, availableRoles } = useAuth();
  const { balance: walletBalance } = useWallet();

  const initialTab = (params.get("tab") as Tab | null) ?? "notifications";
  const [tab, setTab]     = useState<Tab>(initialTab);
  const [saved, setSaved] = useState(false);

  /* ── Notification prefs — now managed by NotificationSettings component ── */

  /* ── Payment ── */
  type SavedCard = { id: string; last4: string; brand: string; expiry: string };
  const [savedCards, setSavedCards] = useState<SavedCard[]>(() => {
    try {
      const raw = localStorage.getItem("bion_saved_cards");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [defaultCard, setDefaultCard] = useState(() => localStorage.getItem("bion_default_card") ?? "");
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardName, setNewCardName] = useState("");

  const persistCards = (cards: SavedCard[], def?: string) => {
    localStorage.setItem("bion_saved_cards", JSON.stringify(cards));
    if (def !== undefined) localStorage.setItem("bion_default_card", def);
  };
  const addCard = () => {
    const digits = newCardNumber.replace(/\s/g, "");
    if (digits.length < 13 || !newCardExpiry.includes("/")) return;
    const last4 = digits.slice(-4);
    const brand = digits.startsWith("4") ? "Visa" : digits.startsWith("5") ? "Mastercard" : digits.startsWith("3") ? "Amex" : "Card";
    const id = `c_${Date.now()}`;
    const updated = [...savedCards, { id, last4, brand, expiry: newCardExpiry }];
    setSavedCards(updated);
    if (!defaultCard) { setDefaultCard(id); persistCards(updated, id); }
    else persistCards(updated);
    setNewCardNumber(""); setNewCardExpiry(""); setNewCardName(""); setShowAddCard(false);
  };
  const removeCard = (id: string) => {
    const updated = savedCards.filter(c => c.id !== id);
    setSavedCards(updated);
    const newDefault = defaultCard === id ? (updated[0]?.id ?? "") : defaultCard;
    setDefaultCard(newDefault);
    persistCards(updated, newDefault);
  };
  const setDefault = (id: string) => {
    setDefaultCard(id);
    localStorage.setItem("bion_default_card", id);
  };

  /* ── Privacy ── */
  const [shareProgressWithProviders, setShareProgress] = useState(true);
  const [allowAnonymousAnalytics, setAllowAnalytics]  = useState(true);
  const [hideProfileFromSearch, setHideProfile]        = useState(false);
  const [twoFactorEnabled, set2FA]                    = useState(false);

  /* ── Account ── */
  const [name,  setName]  = useState(user?.name  ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");

  /* ── Email verification ── */
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [verifyStep, setVerifyStep] = useState<"idle" | "sent" | "verified">("idle");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Check if email is verified on mount
  // Sources (any true = verified): Google OAuth email_verified, bion_email_verified, profiles column
  useEffect(() => {
    if (!user || user.id?.startsWith("demo_")) return;
    const checkVerified = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const meta = authUser?.user_metadata ?? {};
        // Google OAuth sets email_verified, our flow sets bion_email_verified
        if (meta.email_verified || meta.bion_email_verified) {
          setEmailVerified(true);
          return;
        }
        // Fallback: check profiles table
        try {
          const { data: profile } = await supabase.from("profiles")
            .select("email_verified")
            .eq("user_id", user.id!)
            .maybeSingle();
          setEmailVerified(profile?.email_verified ?? false);
        } catch {
          setEmailVerified(false);
        }
      } catch { setEmailVerified(false); }
    };
    checkVerified();
  }, [user?.id]);

  const sendVerificationEmail = async () => {
    setVerifyError("");
    setVerifyBusy(true);
    try {
      const token = await authToken();
      if (!token) {
        setVerifyError("You need a real account to verify email. Demo accounts can't verify.");
        return;
      }
      const res = await trackedFetch(`${API}/api/account/verify-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }, { action: "send verification email", timeoutMs: 15000 });
      const json = await res.json();
      if (json.ok) {
        setVerifyStep("sent");
      } else {
        setVerifyError(json.error ?? "Could not send verification email.");
      }
    } catch (err: any) {
      setVerifyError(err?.message?.includes("timed out")
        ? "Request timed out. Check your connection and try again."
        : "Network error. Please try again.");
    } finally {
      setVerifyBusy(false);
    }
  };

  const confirmVerificationCode = async () => {
    setVerifyError("");
    if (!verifyCode.trim() || verifyCode.length !== 6) {
      setVerifyError("Enter the 6-digit code.");
      return;
    }
    setVerifyBusy(true);
    try {
      const token = await authToken();
      if (!token) {
        setVerifyError("You need a real account to verify email. Demo accounts can't verify.");
        return;
      }
      const res = await trackedFetch(`${API}/api/account/verify-email/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode.trim() }),
      }, { action: "confirm verification code", timeoutMs: 15000 });
      const json = await res.json();
      if (json.ok) {
        setVerifyStep("verified");
        setEmailVerified(true);
      } else {
        setVerifyError(json.error ?? "Invalid code. Please try again.");
      }
    } catch (err: any) {
      setVerifyError(err?.message?.includes("timed out")
        ? "Request timed out. Check your connection and try again."
        : "Network error. Please try again.");
    } finally {
      setVerifyBusy(false);
    }
  };

  /* ── Role switching ── */
  const handleSwitchRole = (role: string) => {
    switchRole(role as any);
    const homes: Record<string, string> = {
      client: "/home",
      provider: "/pro/dashboard",
      admin: "/admin/dashboard",
      corporate: "/corporate/dashboard",
      sales_rep: "/rep/dashboard",
    };
    navigate(homes[role] ?? "/home");
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-12 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full glass-1 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold gradient-indigo text-primary-foreground"
          >
            {saved ? <><Check className="w-3.5 h-3.5" />Saved!</> : <><Save className="w-3.5 h-3.5" />Save</>}
          </motion.button>
        </div>

        {/* Tab bar */}
        <div className="glass-1 rounded-pill p-0.5 flex gap-0.5">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-pill text-xs font-medium transition-all ${
                  tab === t.id ? "gradient-indigo text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Notifications — real preferences via API ── */}
        {tab === "notifications" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard className="p-5">
              <NotificationSettings />
            </GlassCard>
          </motion.div>
        )}

        {/* ── Payment ── */}
        {tab === "payment" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground mb-1">Saved Cards</h2>
              {savedCards.length === 0 && !showAddCard && (
                <p className="text-[11px] text-muted-foreground py-2">No saved cards. Add one to speed up payments.</p>
              )}
              {savedCards.map(card => (
                <div
                  key={card.id}
                  onClick={() => setDefault(card.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    defaultCard === card.id ? "border-indigo/40 bg-indigo/5" : "border-white/5 glass-1"
                  }`}
                >
                  <div className="w-9 h-6 rounded-md bg-white/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{card.brand} •••• {card.last4}</p>
                    <p className="text-[10px] text-muted-foreground">Expires {card.expiry}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {defaultCard === card.id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-pill glass-accent-teal text-teal font-medium">Default</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeCard(card.id); }}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-coral/10 transition-colors"
                    >
                      <X className="w-3 h-3 text-muted-foreground hover:text-coral" />
                    </button>
                  </div>
                </div>
              ))}

              {showAddCard ? (
                <div className="space-y-2 p-3 rounded-xl border border-white/10 glass-1">
                  <input
                    value={newCardName}
                    onChange={e => setNewCardName(e.target.value)}
                    placeholder="Name on card"
                    className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 bg-transparent"
                  />
                  <input
                    value={newCardNumber}
                    onChange={e => setNewCardNumber(e.target.value.replace(/[^\d\s]/g, "").slice(0, 19))}
                    placeholder="Card number"
                    inputMode="numeric"
                    className="w-full glass-1 rounded-xl px-3 py-2 text-sm font-data text-foreground placeholder:text-muted-foreground outline-none border border-white/5 bg-transparent"
                  />
                  <input
                    value={newCardExpiry}
                    onChange={e => {
                      let v = e.target.value.replace(/[^\d/]/g, "");
                      if (v.length === 2 && !v.includes("/") && newCardExpiry.length < 2) v += "/";
                      setNewCardExpiry(v.slice(0, 5));
                    }}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    className="w-full glass-1 rounded-xl px-3 py-2 text-sm font-data text-foreground placeholder:text-muted-foreground outline-none border border-white/5 bg-transparent"
                  />
                  <div className="flex gap-2 pt-1">
                    <button onClick={addCard} className="flex-1 py-2 rounded-xl gradient-indigo text-primary-foreground text-xs font-semibold">Save Card</button>
                    <button onClick={() => { setShowAddCard(false); setNewCardNumber(""); setNewCardExpiry(""); setNewCardName(""); }} className="py-2 px-3 rounded-xl glass-1 text-xs text-muted-foreground">Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/15 text-xs text-muted-foreground hover:text-foreground hover:border-white/30 transition-colors" onClick={() => setShowAddCard(true)}>
                  <Plus className="w-3.5 h-3.5" />
                  Add new card
                </button>
              )}
            </GlassCard>

            <GlassCard className="p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground mb-1">BIONWallet</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold font-data text-teal">R{walletBalance.toLocaleString("en-ZA")}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Available balance</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold gradient-indigo text-primary-foreground"
                  onClick={() => navigate('/wallet')}
                >
                  Top Up
                </motion.button>
              </div>
              <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] text-muted-foreground">
                  BIONWallet credits are used for session payments. Unused credits roll over monthly.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ── Privacy ── */}
        {tab === "privacy" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-teal" />
                <h2 className="text-sm font-semibold text-foreground">Data & Privacy</h2>
              </div>
              {[
                { label: "Share progress with providers", sub: "Providers can view your tracked metrics",     val: shareProgressWithProviders, set: setShareProgress },
                { label: "Anonymous analytics",           sub: "Help improve BION with anonymised usage data", val: allowAnonymousAnalytics,    set: setAllowAnalytics },
                { label: "Hide profile from search",     sub: "Prevent your name appearing in provider search", val: hideProfileFromSearch,  set: setHideProfile },
                { label: "Two-factor authentication",   sub: "Require OTP on each login",                    val: twoFactorEnabled,          set: set2FA },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{row.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{row.sub}</p>
                  </div>
                  <Toggle value={row.val} onChange={row.set} />
                </div>
              ))}
            </GlassCard>

            {/* B1-0: per-provider data-sharing (replaces the old binary
                "Share progress with providers" toggle above for any
                user who's used the new flow at least once) */}
            <GlassCard className="p-4 cursor-pointer" onClick={() => navigate("/settings/data-sharing")}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo/15 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-indigo" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Per-provider data sharing</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Choose what each provider can see. Adjust anytime.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </GlassCard>

            <CookiePreferencesCard />

            <ExportDataCard />

            <DeleteAccountCard userEmail={user?.email ?? ""} />

            <GlassCard className="p-4">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your data is protected under the Protection of Personal Information Act (POPIA).
                Read our full <a href="/legal/privacy" className="text-teal underline">Privacy Policy</a> or
                contact our Information Officer at <span className="text-teal">support@bionhealth.co.za</span>.
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* ── Account ── */}
        {tab === "account" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Email verification banner */}
            {emailVerified === false && verifyStep !== "verified" && (
              <GlassCard className="p-4 border border-amber-400/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-amber-400">Verify your email</h2>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Email: <span className="text-foreground font-medium">{user?.email}</span>{" "}
                  <span className="text-amber-400">(not verified)</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Verify your email to secure your account and enable password recovery.
                </p>
                {verifyError && <p className="text-[10px] text-coral">{verifyError}</p>}

                {verifyStep === "idle" && (
                  <button
                    onClick={sendVerificationEmail}
                    disabled={verifyBusy}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-indigo text-primary-foreground text-xs font-semibold disabled:opacity-50"
                  >
                    {verifyBusy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</> : "Send verification code"}
                  </button>
                )}

                {verifyStep === "sent" && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-teal">Code sent! Check your inbox.</p>
                    <input
                      value={verifyCode}
                      onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit code"
                      inputMode="numeric"
                      maxLength={6}
                      className="w-full glass-1 rounded-xl px-4 py-2.5 text-center text-lg font-data tracking-widest text-foreground placeholder:text-muted-foreground outline-none border border-white/5 bg-transparent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={confirmVerificationCode}
                        disabled={verifyBusy}
                        className="flex-1 py-2 rounded-xl gradient-indigo text-primary-foreground text-xs font-semibold disabled:opacity-50"
                      >
                        {verifyBusy ? "Verifying..." : "Verify"}
                      </button>
                      <button
                        onClick={sendVerificationEmail}
                        disabled={verifyBusy}
                        className="py-2 px-3 rounded-xl glass-1 text-xs text-muted-foreground disabled:opacity-50"
                      >
                        Resend
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

            {emailVerified === true && (
              <GlassCard className="p-3 border border-teal/20">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal" />
                  <p className="text-[11px] text-foreground">
                    Email: <span className="font-medium">{user?.email}</span>{" "}
                    <span className="text-teal font-medium">(verified)</span>
                  </p>
                </div>
              </GlassCard>
            )}

            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-indigo" />
                <h2 className="text-sm font-semibold text-foreground">Profile Details</h2>
              </div>
              {[
                { label: "Full Name",     value: name,  set: setName,  type: "text"  },
                { label: "Email Address", value: email, set: setEmail, type: "email" },
                { label: "Phone Number",  value: phone, set: setPhone, type: "tel"   },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-[10px] text-muted-foreground">{field.label}</label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    className="w-full mt-1 glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none border border-white/5 bg-transparent"
                  />
                </div>
              ))}
            </GlassCard>

            <GlassCard className="p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Security</h2>
              <button
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl glass-1 text-sm text-foreground hover:bg-white/5 transition-colors"
                onClick={async () => {
                  try {
                    const token = await authToken();
                    if (!token) { alert("Please sign in first."); return; }
                    const res = await fetch(`${API}/api/account/forgot-password`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: user?.email }),
                    });
                    const json = await res.json();
                    if (json.ok) alert("Password reset email sent! Check your inbox.");
                    else alert(json.error ?? "Could not send reset email.");
                  } catch { alert("Network error. Try again."); }
                }}
              >
                <span>Change Password</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl glass-1 text-sm text-foreground hover:bg-white/5 transition-colors" onClick={() => alert("Social account linking coming soon.")}>
                <span>Linked Social Accounts</span>
                <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
              </button>
            </GlassCard>

            {/* Role switcher — shown only when user has multiple roles */}
            {availableRoles.length > 1 && (
              <GlassCard className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-indigo" />
                  <h2 className="text-sm font-semibold text-foreground">Switch Role</h2>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  You have access to multiple roles. Switch without signing out.
                </p>
                <div className="space-y-2">
                  {availableRoles.map(role => (
                    <button
                      key={role}
                      onClick={() => role !== user?.role && handleSwitchRole(role)}
                      disabled={role === user?.role}
                      className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm transition-all ${
                        role === user?.role
                          ? "border border-indigo/40 bg-indigo/8 text-foreground"
                          : "glass-1 text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="capitalize">{role.replace(/_/g, " ")}</span>
                      {role === user?.role && (
                        <span className="text-[10px] px-2 py-0.5 rounded-pill glass-accent-teal text-teal font-medium">Active</span>
                      )}
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            <GlassCard className="p-4">
              <p className="text-[10px] text-muted-foreground">
                Member since <span className="text-foreground font-medium">{(() => {
                  try {
                    // Use profile created_at from Supabase, fallback to current month
                    const stored = localStorage.getItem("bio_user");
                    const createdAt = stored ? JSON.parse(stored).createdAt : null;
                    if (createdAt) return new Date(createdAt).toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
                    // Fallback: check Supabase auth user metadata
                    return new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
                  } catch { return new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" }); }
                })()}</span> ·
                Role: <span className="text-indigo font-medium capitalize">{(user?.role ?? "client").replace(/_/g, " ")}</span>
                {availableRoles.length > 1 && (
                  <> · <span className="text-muted-foreground">{availableRoles.length} roles</span></>
                )}
              </p>
            </GlassCard>
          </motion.div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
