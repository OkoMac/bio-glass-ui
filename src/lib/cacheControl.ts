/**
 * Conservative cache maintenance.
 *
 * Earlier this was an aggressive "sweep everything that's not in this allow-list"
 * unload handler. That broke Google OAuth in the WhatsApp in-app browser — when
 * the tab leaves BION for the Google consent screen, `pagehide` fired the sweep
 * and some Supabase PKCE state ended up cleared, bouncing the user back to
 * /welcome on return.
 *
 * New approach: inverted policy. Only clear KNOWN stale keys (temporary flags,
 * dismissed-notification sets, draft form state). Everything else — including
 * anything Supabase writes — is left alone by default.
 *
 * React Query invalidation on tab-hidden is kept, because that was only about
 * forcing a refetch when the user comes back — no localStorage mutation.
 */

// Explicit stale-clear list. Only these keys get wiped on unload.
const CLEAR_EXACT = new Set<string>([
  "bion_dismissed_notifs",   // per-session dismissal set
  "bion_read_notifs",        // per-session read markers
]);

// Prefix-based clear — keep narrow to avoid accidentally blowing away auth.
const CLEAR_PREFIX: string[] = [
  "bion_draft_",             // form drafts (not currently used, reserved)
];

// Date-scoped reminder dismissals — the date in the suffix keeps them bounded,
// but let's proactively drop older-than-today entries.
import { getSASTDateKey } from "@/utils/sastDate";

function purgeStaleDatedKeys(): void {
  const today = getSASTDateKey();
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("bion_reminders_dismissed_") && !k.endsWith(today)) {
        localStorage.removeItem(k);
      }
    }
  } catch { /* no-op */ }
}

function sweep(): void {
  try {
    for (const k of CLEAR_EXACT) localStorage.removeItem(k);
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    for (const k of keys) {
      if (CLEAR_PREFIX.some(p => k.startsWith(p))) localStorage.removeItem(k);
    }
    purgeStaleDatedKeys();
  } catch { /* no-op */ }
  // sessionStorage is tab-scoped anyway; no need to explicitly clear.
}

export function installCacheControl(queryClient?: { clear: () => void }): void {
  const onLeave = () => sweep();
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("beforeunload", onLeave);

  // Force query cache refetch when the tab returns from background, so the
  // UI isn't showing 20-minute-old data. This never touches localStorage.
  const onVisibility = () => {
    if (document.visibilityState === "hidden" && queryClient) {
      try { queryClient.clear(); } catch {}
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
}
