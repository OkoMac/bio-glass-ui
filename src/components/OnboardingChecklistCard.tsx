import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Circle, X, ArrowRight, ClipboardList, Bot } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { UserRole } from "@/lib/auth";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

/** Kept narrow — the checklist only cares about "client" | "provider"
 *  | "corporate" | "sales_rep". Admins don't get a checklist. */
export type ChecklistRole = Exclude<UserRole, "admin">;

/* ─── Types ────────────────────────────────────────────────────────── */

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  to?: string;                                    // router destination for the action
  onAction?: () => void | Promise<void>;          // optional inline handler (e.g. push subscribe)
  actionLabel?: string;                           // optional override for the CTA text
}

interface ComputedSignals {
  // Client
  hasPhone: boolean;
  phoneVerified: boolean;
  hasLocation: boolean;
  hasBooking: boolean;
  hasHealthLog: boolean;
  // Provider
  providerVerified: boolean;
  hasService: boolean;
  hasAvailability: boolean;
  hasBank: boolean;
  hasBioTagline: boolean;
  hasAvatar: boolean;
  // Corporate
  hasCompanyDetails: boolean;
  hasWalletFunds: boolean;
  hasEmployee: boolean;
  hasLinkedProvider: boolean;
  needsBoDeclaration: boolean;
  boApproved: boolean;
  // Sales rep
  sarsAccepted: boolean;
  repBankConnected: boolean;
  hasSharedLink: boolean;
  hasFirstProviderSignup: boolean;
}

interface OnboardingChecklistCardProps {
  role: ChecklistRole;
  className?: string;
}

/* ─── Cache keys & helpers ─────────────────────────────────────────── */

function completeKey(profileId: string | null | undefined) {
  return `bion_checklist_complete_${profileId ?? "anon"}`;
}
function dismissKey(profileId: string | null | undefined, completedCount: number) {
  return `bion_checklist_dismissed_${profileId ?? "anon"}_${completedCount}`;
}

/* ─── Per-role item builders ───────────────────────────────────────── */

function buildClientItems(
  s: ComputedSignals,
  push: ReturnType<typeof usePushNotifications>,
): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { id: "phone",        label: "B_ says: Add your phone so I can send you reminders",                 done: s.hasPhone,       to: "/settings" },
    { id: "phoneVerify",  label: "B_ says: Verify your number — it keeps your account secure",          done: s.phoneVerified,  to: "/settings" },
    { id: "location",     label: "B_ says: Set your city so I can find providers near you",             done: s.hasLocation,    to: "/settings" },
    { id: "firstBooking", label: "B_ says: Book a session — I'll remind you and track your progress",   done: s.hasBooking,     to: "/directory" },
    { id: "firstLog",     label: "B_ says: Log your first metric — I'll start building your wellness insights", done: s.hasHealthLog,   to: "/progress" },
  ];
  // Push opt-in — only include when the browser can still ask.
  // (If permission is already granted/denied, there's nothing for the user to do.)
  if (push.supported && push.permission === "default" && !push.subscribed) {
    items.push({
      id: "push",
      label: "Enable push notifications",
      done: false,
      actionLabel: push.loading ? "Enabling…" : "Enable",
      onAction: async () => { await push.subscribe(); },
    });
  }
  return items;
}

function buildProviderItems(s: ComputedSignals): ChecklistItem[] {
  return [
    { id: "verify",       label: "Upload verification documents",  done: s.providerVerified, to: "/pro/verification" },
    { id: "service",      label: "Add at least one service",       done: s.hasService,       to: "/pro/services" },
    { id: "availability", label: "Set your weekly availability",   done: s.hasAvailability,  to: "/pro/settings?tab=profile" },
    { id: "bank",         label: "Connect a bank account",         done: s.hasBank,          to: "/pro/settings?tab=billing" },
    { id: "bio",          label: "Complete your bio and tagline",  done: s.hasBioTagline,    to: "/pro/settings?tab=profile" },
    { id: "avatar",       label: "Upload a profile photo",         done: s.hasAvatar,        to: "/pro/settings?tab=profile" },
  ];
}

function buildCorporateItems(s: ComputedSignals): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { id: "company",   label: "Complete company details (CIPC, VAT)", done: s.hasCompanyDetails, to: "/corporate/settings" },
    { id: "wallet",    label: "Load wallet funds",                    done: s.hasWalletFunds,    to: "/corporate/wallet" },
    { id: "employee",  label: "Add your first employee",              done: s.hasEmployee,       to: "/corporate/employees" },
    { id: "providers", label: "Link preferred providers",             done: s.hasLinkedProvider, to: "/corporate/providers" },
  ];
  // Only surface BO declaration when the backend says it's actually required.
  if (s.needsBoDeclaration) {
    items.push({
      id: "bo",
      label: "Declare beneficial owners",
      done: s.boApproved,
      to: "/corporate/beneficial-owners",
    });
  }
  return items;
}

function buildRepItems(s: ComputedSignals): ChecklistItem[] {
  return [
    { id: "sars",          label: "Complete SARS tax declaration",     done: s.sarsAccepted,          to: "/rep/agreement" },
    { id: "bank",          label: "Connect bank for payouts",          done: s.repBankConnected,      to: "/rep/settings" },
    { id: "share",         label: "Share your referral link",          done: s.hasSharedLink,         to: "/rep/dashboard" },
    { id: "firstProvider", label: "Sign up your first provider",       done: s.hasFirstProviderSignup,to: "/rep/providers" },
  ];
}

/* ─── Signal fetcher ───────────────────────────────────────────────── */

async function fetchSignals(role: ChecklistRole, profileId: string, authUserId?: string): Promise<ComputedSignals> {
  const out: ComputedSignals = {
    hasPhone: false, phoneVerified: false, hasLocation: false, hasBooking: false, hasHealthLog: false,
    providerVerified: false, hasService: false, hasAvailability: false, hasBank: false,
    hasBioTagline: false, hasAvatar: false,
    hasCompanyDetails: false, hasWalletFunds: false, hasEmployee: false, hasLinkedProvider: false,
    needsBoDeclaration: false, boApproved: false,
    sarsAccepted: false, repBankConnected: false, hasSharedLink: false, hasFirstProviderSignup: false,
  };

  // Profile row is needed for most roles (phone / location / bio / avatar / bank / verified status).
  // Cast to any because the generated types.ts doesn't include every column we touch
  // (phone_verified, paystack_subaccount_code, provider_status, city, suburb).
  // Same pattern used by VerificationStatusBanner.
  const profileQuery = supabase
    .from("profiles")
    .select("id, phone, avatar_url, bio, specialty, location, city, suburb, phone_verified, provider_status, paystack_subaccount_code")
    .eq("id", profileId)
    .maybeSingle();

  try {
    if (role === "client") {
      const [profileRes, bookingsRes, healthRes] = await Promise.all([
        profileQuery,
        supabase.from("bookings").select("id").eq("client_id", profileId).limit(1),
        (supabase.from("health_logs" as any) as any).select("id").eq("user_id", profileId).limit(1),
      ]);
      const p = (profileRes.data as any) ?? {};
      out.hasPhone      = Boolean((p.phone ?? "").toString().trim());
      out.phoneVerified = Boolean(p.phone_verified);
      out.hasLocation   = Boolean(p.city && p.suburb) || Boolean((p.location ?? "").toString().trim());
      out.hasBooking    = (bookingsRes.data?.length ?? 0) > 0;
      out.hasHealthLog  = ((healthRes.data as any[] | null)?.length ?? 0) > 0;
    }

    else if (role === "provider") {
      const [profileRes, servicesRes, availRes] = await Promise.all([
        profileQuery,
        supabase.from("services").select("id").eq("provider_id", profileId).limit(1),
        supabase.from("provider_availabilities").select("id").eq("provider_id", profileId).limit(1),
      ]);
      const p = (profileRes.data as any) ?? {};
      out.providerVerified = p.provider_status === "verified";
      out.hasService       = (servicesRes.data?.length ?? 0) > 0;
      out.hasAvailability  = (availRes.data?.length ?? 0) > 0;
      out.hasBank          = Boolean(p.paystack_subaccount_code);
      out.hasBioTagline    = Boolean((p.bio ?? "").toString().trim()) && Boolean((p.specialty ?? "").toString().trim());
      out.hasAvatar        = Boolean((p.avatar_url ?? "").toString().trim());
    }

    else if (role === "corporate") {
      // Compliance endpoint already gives us company_name, bo_status, monthly_budget_rand
      // in one shot — reuse rather than inventing new tables.
      const compId = profileId || authUserId || "";
      const [complianceRes, employeesLS, providersLS, walletLS] = await Promise.all([
        fetch(`${API}/api/compliance/corporate/${compId}/required`)
          .then(r => r.json())
          .catch(() => null),
        Promise.resolve(readLocalJsonArray("bion_corp_employees")),
        Promise.resolve(readLocalJsonArray("bion_corp_providers")),
        Promise.resolve(readLocalNumber("bion_corp_wallet_balance")),
      ]);

      const companyName  = (complianceRes?.company_name ?? "").toString().trim();
      const vatNumber    = (complianceRes?.vat_number ?? "").toString().trim();
      const cipcNumber   = (complianceRes?.company_registration ?? complianceRes?.cipc_number ?? "").toString().trim();
      out.hasCompanyDetails = Boolean(companyName) && (Boolean(vatNumber) || Boolean(cipcNumber));

      out.hasWalletFunds    = walletLS > 0;
      out.hasEmployee       = employeesLS.length > 0;
      out.hasLinkedProvider = providersLS.length > 0;

      const boStatus    = (complianceRes?.bo_status ?? "not_required") as string;
      const monthlyRand = Number(complianceRes?.monthly_budget_rand ?? 0);
      out.needsBoDeclaration = monthlyRand > 50_000 && boStatus !== "approved";
      out.boApproved         = boStatus === "approved";
    }

    else if (role === "sales_rep") {
      // Rep signals live in API + ranger_attribution_summary view.
      // Fetch agreement status from the backend API.
      const providersLS   = readLocalJsonArray("bion_rep_providers");
      const sharedAt      = (() => { try { return localStorage.getItem("bion_rep_shared_at"); } catch { return null; } })();
      const bankLinked    = (() => { try { return localStorage.getItem("bion_rep_bank_linked") === "1"; } catch { return false; } })();

      let agreementAccepted = false;
      try {
        const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          const res = await fetch(`${API}/api/rep/agreement`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const body = await res.json();
            agreementAccepted = Boolean(body.accepted);
          }
        }
      } catch { /* non-fatal — fall back to false */ }

      let attributedCount = 0;
      try {
        const { data } = await (supabase
          .from("ranger_attribution_summary" as any) as any)
          .select("total_referred")
          .eq("ranger_id", profileId)
          .maybeSingle();
        if (data && (data as any).total_referred != null) attributedCount = Number((data as any).total_referred);
      } catch { /* view may not exist in dev */ }

      out.sarsAccepted           = agreementAccepted;
      out.repBankConnected       = bankLinked;
      out.hasSharedLink          = Boolean(sharedAt);
      out.hasFirstProviderSignup = providersLS.length > 0 || attributedCount > 0;
    }
  } catch { /* best-effort — card stays hidden on fatal failure */ }

  return out;
}

/* ─── Local storage helpers ────────────────────────────────────────── */

function readLocalJsonArray(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function readLocalNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

function safeParse(raw: string): any {
  try { return JSON.parse(raw); } catch { return null; }
}

/* ─── Component ────────────────────────────────────────────────────── */

export default function OnboardingChecklistCard({ role, className }: OnboardingChecklistCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const push     = usePushNotifications();
  const profileId = user?.profileId ?? null;

  const [signals, setSignals] = useState<ComputedSignals | null>(null);
  const [loading, setLoading] = useState(true);

  // 60s cache — stops the card churning on route-level re-mounts. Key by role
  // (not profileId — components only ever mount for the caller's role).
  const cacheRef = useRef<{ at: number; role: ChecklistRole; profileId: string; data: ComputedSignals } | null>(null);

  useEffect(() => {
    if (!profileId || profileId.startsWith("demo_")) { setLoading(false); return; }
    let cancelled = false;

    const cached = cacheRef.current;
    if (cached && cached.role === role && cached.profileId === profileId && Date.now() - cached.at < 60_000) {
      setSignals(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchSignals(role, profileId, user?.id).then(data => {
      if (cancelled) return;
      cacheRef.current = { at: Date.now(), role, profileId, data };
      setSignals(data);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [role, profileId, user?.id]);

  const items: ChecklistItem[] = useMemo(() => {
    if (!signals) return [];
    if (role === "client")     return buildClientItems(signals, push);
    if (role === "provider")   return buildProviderItems(signals);
    if (role === "corporate")  return buildCorporateItems(signals);
    if (role === "sales_rep")  return buildRepItems(signals);
    return [];
  }, [role, signals, push]);

  const completedCount = items.filter(i => i.done).length;
  const totalCount     = items.length;
  const pct            = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const allDone        = totalCount > 0 && completedCount === totalCount;

  // Persist "fully complete" so we don't flash the card before signals resolve
  // on the next load. (Dismissal key is progress-scoped, so it auto-undismisses
  // once the user makes additional progress.)
  useEffect(() => {
    if (!profileId || !allDone) return;
    try { localStorage.setItem(completeKey(profileId), "1"); } catch { /* ignore */ }
  }, [profileId, allDone]);

  // Dismissal state — reset whenever the completedCount changes so the card
  // reappears after the user takes an action.
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!profileId) { setDismissed(false); return; }
    try {
      setDismissed(localStorage.getItem(dismissKey(profileId, completedCount)) === "1");
    } catch { setDismissed(false); }
  }, [profileId, completedCount]);

  // Pre-hydrate "fully complete" state from storage so no flash on remount.
  const [initiallyComplete] = useState<boolean>(() => {
    try { return localStorage.getItem(completeKey(profileId)) === "1"; }
    catch { return false; }
  });

  const handleDismiss = () => {
    if (!profileId) return;
    try { localStorage.setItem(dismissKey(profileId, completedCount), "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  const handleItemClick = async (item: ChecklistItem) => {
    if (item.onAction) {
      await item.onAction();
      // Bust the cache so the next render re-reads signals
      cacheRef.current = null;
      if (profileId) {
        const fresh = await fetchSignals(role, profileId, user?.id);
        cacheRef.current = { at: Date.now(), role, profileId, data: fresh };
        setSignals(fresh);
      }
      return;
    }
    if (item.to) navigate(item.to);
  };

  // ── Gate rendering ─────────────────────────────────────────────────
  if (!profileId) return null;
  if (loading && initiallyComplete) return null; // already done previously → don't flash
  if (loading) return null;
  if (totalCount === 0) return null;
  if (allDone) return null;
  if (dismissed) return null;

  // ── Render ─────────────────────────────────────────────────────────
  const RING_SIZE   = 44;
  const RING_STROKE = 4;
  const radius      = (RING_SIZE - RING_STROKE) / 2;
  const circumf     = 2 * Math.PI * radius;
  const dashOffset  = circumf - (pct / 100) * circumf;

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-checklist"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className={className}
      >
        <GlassCard variant="glass-1" className="p-4 md:p-5 rounded-2xl relative">
          <button
            onClick={handleDismiss}
            aria-label="Dismiss checklist"
            className="absolute top-3 right-3 w-7 h-7 rounded-full glass-1 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-start gap-3 pr-8">
            {/* Progress ring */}
            <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
              <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
                <circle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius}
                  stroke="rgba(255,255,255,0.08)" strokeWidth={RING_STROKE} fill="none"
                />
                <motion.circle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius}
                  stroke="currentColor" strokeWidth={RING_STROKE} fill="none"
                  strokeLinecap="round"
                  className="text-teal"
                  initial={{ strokeDashoffset: circumf }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  strokeDasharray={circumf}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-teal" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Complete your profile · {completedCount} of {totalCount} done
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {pct}% complete — finish these to get the most out of BION.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-1.5">
            {items.map(item => {
              const Icon = item.done ? CheckCircle : Circle;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    disabled={item.done}
                    className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-xl text-left transition-colors ${
                      item.done
                        ? "opacity-60 cursor-default"
                        : "hover:bg-white/[0.03] cursor-pointer"
                    }`}
                  >
                    {item.done ? (
                      <Icon className="w-4 h-4 shrink-0 text-teal" />
                    ) : (
                      <Bot className="w-4 h-4 shrink-0 text-teal" style={{ filter: "drop-shadow(0 0 3px rgba(13,148,136,0.4))" }} />
                    )}
                    <span className={`text-xs flex-1 min-w-0 truncate ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {item.label}
                    </span>
                    {!item.done && (
                      <span className="shrink-0 text-[11px] font-medium text-indigo flex items-center gap-0.5">
                        {item.actionLabel ?? "Do it"}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
