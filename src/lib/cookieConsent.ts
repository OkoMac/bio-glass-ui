/**
 * BION cookie consent store.
 *
 * Legal basis:
 *   • POPIA (Act 4 of 2013) s 11(1)(a) — consent must be voluntary, specific,
 *     and informed. We must be able to prove the user *actively* opted in.
 *   • GDPR Art. 7 — same, plus "withdraw as easily as give".
 *   • ePrivacy Directive Art. 5(3) — strict opt-in before any non-essential
 *     cookie/script fires (analytics, ads, tracking pixels).
 *
 * Storage shape:
 *   localStorage["bion_cookie_consent"] = {
 *     version: <CONSENT_VERSION>,
 *     state:   { essential: true, analytics: bool, marketing: bool },
 *     timestamp: <epoch-ms>
 *   }
 *
 * Bump CONSENT_VERSION when the privacy policy materially changes — every
 * client will be re-prompted on the next visit.
 *
 * The banner + any gated integration subscribes to the `bion:consent-changed`
 * CustomEvent on `window` so they react live without a reload.
 */

export type ConsentCategory = "essential" | "analytics" | "marketing";
export type ConsentState = Record<ConsentCategory, boolean>;

const STORAGE_KEY = "bion_cookie_consent";
export const CONSENT_VERSION = 1; // ↑ bump this to re-prompt all users

/** Default state for a fresh user, honouring the browser's DNT signal. */
export function defaultConsent(): ConsentState {
  const dnt =
    typeof navigator !== "undefined" &&
    // Some browsers set navigator.doNotTrack, others window.doNotTrack or msDoNotTrack
    // Treat "1" or "yes" as an explicit opt-out signal.
    ((navigator as any).doNotTrack === "1" ||
      (navigator as any).doNotTrack === "yes" ||
      (window as any).doNotTrack === "1" ||
      (navigator as any).msDoNotTrack === "1");

  return {
    essential: true,
    analytics: !dnt ? false : false, // always false pre-consent; DNT just reinforces it
    marketing: !dnt ? false : false,
  };
}

/** Read the stored consent state. `null` means the user has never decided. */
export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      version?: number;
      state?: ConsentState;
    };
    if (parsed.version !== CONSENT_VERSION) return null;
    if (!parsed.state) return null;
    // Defensive: essential is always true regardless of what's stored
    return {
      essential: true,
      analytics: !!parsed.state.analytics,
      marketing: !!parsed.state.marketing,
    };
  } catch {
    return null;
  }
}

/** Persist the new state and broadcast to listeners. */
export function setConsent(state: ConsentState): void {
  const safe: ConsentState = {
    essential: true, // never allow essential to flip off
    analytics: !!state.analytics,
    marketing: !!state.marketing,
  };
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: CONSENT_VERSION,
        state: safe,
        timestamp: Date.now(),
      }),
    );
  } catch (err) {
    // Quota exceeded / storage blocked — log but don't crash the app.
    // Private-browsing Safari throws on every localStorage.setItem.
     
    console.warn("[bion] cookie consent could not be persisted:", err);
  }
  try {
    window.dispatchEvent(
      new CustomEvent<ConsentState>("bion:consent-changed", { detail: safe }),
    );
  } catch {
    /* ignore — CustomEvent unsupported */
  }
}

/** True if the user has consented to the given category. Essential is always granted. */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === "essential") return true;
  const s = getConsent();
  if (!s) return false; // pre-consent — nothing non-essential is allowed
  return !!s[category];
}

/** Clear the stored decision so the banner re-shows (used by "Change preferences"). */
export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent("bion:consent-changed", { detail: null }));
  } catch {
    /* ignore */
  }
}

/** Subscribe to consent changes. Returns an unsubscribe function. */
export function onConsentChanged(
  handler: (state: ConsentState | null) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<ConsentState | null>).detail ?? null;
    handler(detail);
  };
  window.addEventListener("bion:consent-changed", listener);
  return () => window.removeEventListener("bion:consent-changed", listener);
}
