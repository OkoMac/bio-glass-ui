import { useEffect, useRef } from "react";

/**
 * Fires `callback` whenever the tab returns to visibility AFTER being hidden,
 * regardless of how long it was away.
 *
 * Why: PWA and Safari browser are separate localStorage contexts. Lee's bug
 * (2026-05-01): "I am logged in via app and browser. They don't update each
 * other. I updated water on app and it's not updating in browser." Each
 * instance reads from server on mount, then stays static. When the user
 * tabs away to update something elsewhere and comes back, we should refetch.
 *
 * Cheaper than Supabase Realtime subscriptions (which would require RLS
 * audit + connection management for every table). For BION's workload —
 * users open and close the app, switch between PWA and browser — this
 * pattern catches the desync at the exact moment the user can perceive it.
 *
 * Usage:
 *   useVisibilityRefetch(() => { refresh(); }, [user?.profileId]);
 *
 * The callback is debounced via the deps array; it fires once per
 * hidden→visible transition AND on initial mount when visible. We do NOT
 * fire when the tab becomes hidden — only when it returns.
 *
 * Skips the refetch if the tab was hidden for less than 5 seconds (the user
 * was just touching another window briefly, no point re-querying).
 */
export function useVisibilityRefetch(callback: () => void, deps: unknown[] = []) {
  // Hold the latest callback in a ref so we don't tear down + recreate the
  // event listener on every render — only the deps array drives that.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const lastHiddenAt = useRef<number | null>(null);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenAt.current = Date.now();
        return;
      }
      // Visible — fire callback if we were hidden for >5s (or first time).
      const hiddenFor = lastHiddenAt.current ? Date.now() - lastHiddenAt.current : Infinity;
      if (hiddenFor >= 5000) {
        callbackRef.current();
      }
      lastHiddenAt.current = null;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
