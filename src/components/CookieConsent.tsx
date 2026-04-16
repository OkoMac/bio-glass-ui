/**
 * BION cookie-consent banner.
 *
 * Renders at the bottom of the viewport (above the BottomNav pill) the first
 * time a user lands on any page. The banner is dismissible in 3 ways:
 *   • Accept all       → analytics + marketing granted
 *   • Reject all       → only essential
 *   • Customise        → per-category toggles
 *
 * Essential cookies (Supabase session, CSRF, cart) are never switchable.
 *
 * Accessibility:
 *   • role="dialog" + aria-modal="false" (non-blocking notice, not a modal trap)
 *   • aria-labelledby / aria-describedby for screen readers
 *   • Keyboard focusable controls; Escape collapses the expanded panel
 *
 * Re-promptable from Settings → Privacy via the `openOnMount` prop +
 * `bion:consent-open` event.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ShieldCheck, BarChart3, Megaphone, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  getConsent,
  setConsent,
  defaultConsent,
  type ConsentState,
} from "@/lib/cookieConsent";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

/** Fire-and-forget POST to the audit endpoint. Never blocks the UI. */
async function logConsentAudit(state: ConsentState, previous: ConsentState | null) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    void fetch(`${API}/api/popia/consent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        state,
        previous_state: previous,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      }),
      keepalive: true,
    }).catch(() => { /* swallow — audit is best-effort, never blocks consent */ });
  } catch {
    /* swallow */
  }
}

/**
 * The in-place banner. Mount once in <App/>. It decides whether to render
 * based on stored state. Pass `forceOpen` to always show (Settings → Privacy).
 */
export default function CookieConsent({
  forceOpen = false,
  onClose,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  // null = not decided yet; object = already persisted
  const [stored, setStored] = useState<ConsentState | null>(() => getConsent());
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<ConsentState>(() => stored ?? defaultConsent());
  const [visible, setVisible] = useState(() => forceOpen || stored === null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* ── Sync props + storage into visibility ───────────────────────── */
  useEffect(() => {
    // Listen for the app asking us to re-open (from Settings)
    const reopen = () => {
      setStored(getConsent());
      setDraft(getConsent() ?? defaultConsent());
      setExpanded(true);
      setVisible(true);
    };
    window.addEventListener("bion:consent-open", reopen);
    return () => window.removeEventListener("bion:consent-open", reopen);
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setDraft(getConsent() ?? defaultConsent());
      setExpanded(true);
      setVisible(true);
    }
  }, [forceOpen]);

  /* ── Close the panel on Escape ──────────────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expanded) {
        e.preventDefault();
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, expanded]);

  /* ── Focus the first control when the banner appears ───────────── */
  useEffect(() => {
    if (!visible || !panelRef.current) return;
    const first = panelRef.current.querySelector<HTMLElement>("[data-cookie-first-focus]");
    first?.focus({ preventScroll: true });
  }, [visible, expanded]);

  const persist = useCallback(
    (next: ConsentState, label: string) => {
      const prev = getConsent();
      setConsent(next);
      setStored(next);
      void logConsentAudit(next, prev);
      setVisible(false);
      setExpanded(false);
      onClose?.();
      toast.success(label, { description: "Your cookie preferences have been saved." });
    },
    [onClose],
  );

  const acceptAll = useCallback(
    () => persist({ essential: true, analytics: true, marketing: true }, "Accepted all cookies"),
    [persist],
  );
  const rejectAll = useCallback(
    () => persist({ essential: true, analytics: false, marketing: false }, "Only essential cookies on"),
    [persist],
  );
  const savePreferences = useCallback(
    () => persist({ ...draft, essential: true }, "Preferences saved"),
    [persist, draft],
  );

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="cookie-consent"
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="bion-cookie-title"
        aria-describedby="bion-cookie-desc"
        initial={{ y: 160, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 160, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        /* Sits above the BottomNav (z-50) but below modals (z-[100+]).
           Bottom offset clears the nav pill on mobile + leaves a breath on desktop. */
        style={{ zIndex: 100 }}
        className="fixed left-3 right-3 bottom-20 md:left-6 md:right-6 md:bottom-24 max-w-xl mx-auto"
      >
        <div className="glass-2 rounded-2xl shadow-card border border-white/10 overflow-hidden">
          {/* ── Collapsed summary ─────────────────────────────── */}
          {!expanded && (
            <div className="p-4 md:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full gradient-indigo flex items-center justify-center shrink-0">
                  <Cookie className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    id="bion-cookie-title"
                    className="text-sm font-semibold text-foreground"
                  >
                    Cookies on BION
                  </h2>
                  <p
                    id="bion-cookie-desc"
                    className="text-[11px] text-muted-foreground leading-relaxed mt-1"
                  >
                    Essential cookies keep the app working. Analytics and marketing cookies are optional and help us improve BION — you're in control.{" "}
                    <a href="/legal/privacy" className="text-teal underline">
                      Privacy policy
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  data-cookie-first-focus
                  onClick={acceptAll}
                  className="flex-1 min-w-[120px] py-2.5 px-4 rounded-xl gradient-indigo text-primary-foreground text-xs font-semibold"
                  aria-label="Accept all cookies"
                >
                  Accept all
                </button>
                <button
                  onClick={rejectAll}
                  className="flex-1 min-w-[120px] py-2.5 px-4 rounded-xl glass-1 border border-white/10 text-foreground text-xs font-semibold"
                  aria-label="Reject all non-essential cookies"
                >
                  Reject all
                </button>
                <button
                  onClick={() => setExpanded(true)}
                  className="flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={expanded}
                  aria-controls="bion-cookie-details"
                >
                  Customise
                </button>
              </div>
            </div>
          )}

          {/* ── Expanded per-category view ─────────────────────── */}
          {expanded && (
            <div id="bion-cookie-details" className="p-4 md:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="bion-cookie-title"
                    className="text-sm font-semibold text-foreground flex items-center gap-2"
                  >
                    <Cookie className="w-4 h-4 text-indigo" />
                    Your cookie preferences
                  </h2>
                  <p
                    id="bion-cookie-desc"
                    className="text-[11px] text-muted-foreground mt-1"
                  >
                    You can change these any time in Settings → Privacy.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (stored) {
                      // Already decided — Customise was opened from settings.
                      setVisible(false);
                      onClose?.();
                    } else {
                      setExpanded(false);
                    }
                  }}
                  className="w-7 h-7 rounded-full glass-1 flex items-center justify-center shrink-0"
                  aria-label="Close cookie preferences"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Essential row (locked) */}
              <Row
                icon={<ShieldCheck className="w-4 h-4 text-teal" />}
                title="Essential"
                subtitle="Sign-in session, CSRF, cart. Can't be turned off."
                value={true}
                locked
              />

              {/* Analytics */}
              <Row
                icon={<BarChart3 className="w-4 h-4 text-indigo" />}
                title="Analytics"
                subtitle="Page views and habit tracking that improves BION for everyone."
                value={draft.analytics}
                onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
              />

              {/* Marketing */}
              <Row
                icon={<Megaphone className="w-4 h-4 text-coral" />}
                title="Marketing"
                subtitle="Measuring ads (e.g. Facebook, Google) and voucher attribution."
                value={draft.marketing}
                onChange={(v) => setDraft((d) => ({ ...d, marketing: v }))}
              />

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  data-cookie-first-focus
                  onClick={savePreferences}
                  className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl gradient-indigo text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                  aria-label="Save current cookie preferences"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save preferences
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 min-w-[120px] py-2.5 px-4 rounded-xl glass-1 border border-white/10 text-foreground text-xs font-semibold"
                  aria-label="Accept all cookies"
                >
                  Accept all
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** A single category row inside the expanded panel. */
function Row({
  icon,
  title,
  subtitle,
  value,
  locked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  locked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl glass-1 border border-white/5">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={`${title} cookies — ${value ? "on" : "off"}${locked ? " (required)" : ""}`}
        disabled={locked}
        onClick={() => !locked && onChange?.(!value)}
        className={`w-10 h-5 rounded-pill relative transition-all shrink-0 ${
          value ? "gradient-indigo" : "bg-white/10"
        } ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
            value ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/** Helper for Settings → Privacy to request the banner open again. */
export function openCookieBanner() {
  window.dispatchEvent(new CustomEvent("bion:consent-open"));
}
