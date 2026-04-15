/**
 * On-unload cache control.
 *
 * When the user closes the tab or navigates away, we sweep localStorage and
 * keep ONLY keys that:
 *  (a) represent the user's identity or authenticated session, or
 *  (b) are UX-persistence flags that are cheap to keep and hostile to lose
 *      (e.g. "skip the intro carousel next time").
 *
 * Everything else — stale React Query snapshots, dismissed-notification sets,
 * draft forms, etc. — is cleared so the next visit doesn't surface stale data
 * and the app doesn't replay finished flows.
 *
 * Also invalidates in-memory React Query cache on `visibilitychange → hidden`
 * so the NEXT time the tab regains focus, fresh data is fetched.
 */

const KEEP_EXACT = new Set<string>([
  "bion_seen_intro",         // "don't show the splash carousel again"
  "bion_role",               // last-active role (for demo account selection)
  "bion_notifs_muted",       // user preference
  "bion_admin_token",        // admin WhatsApp viewer token (desktop admin only)
]);

// Prefixes we keep. Everything that matches is retained on cleanup.
const KEEP_PREFIX = [
  "sb-",                     // Supabase auth session (sb-*-auth-token etc.)
  "supabase.auth",           // alternate Supabase key
  "bion_onboarding_",        // per-user onboarding completion state
  "bion_favorite_providers_",// per-user favourite providers
];

function shouldKeep(key: string): boolean {
  if (KEEP_EXACT.has(key)) return true;
  return KEEP_PREFIX.some(p => key.startsWith(p));
}

function sweep(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    for (const k of keys) {
      if (!shouldKeep(k)) localStorage.removeItem(k);
    }
  } catch {
    // localStorage may throw in some privacy modes — fail silently.
  }
  try { sessionStorage.clear(); } catch {}
}

export function installCacheControl(queryClient?: { clear: () => void }): void {
  // `pagehide` is the reliable unload hook on iOS Safari; `beforeunload` covers
  // desktop and Android. Both are harmless to fire together — sweep is idempotent.
  const onLeave = () => sweep();
  window.addEventListener("pagehide", onLeave);
  window.addEventListener("beforeunload", onLeave);

  // Invalidate query cache when the tab goes to background so the next focus
  // refetches. This is what kills the "stale / repetitive / cut-off" feel.
  const onVisibility = () => {
    if (document.visibilityState === "hidden" && queryClient) {
      try { queryClient.clear(); } catch {}
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
}
