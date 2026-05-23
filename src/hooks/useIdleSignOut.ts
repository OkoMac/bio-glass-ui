/**
 * useIdleSignOut — auto-logout after N minutes of inactivity.
 *
 * Per Oko 2026-05-19: BION holds personal health data, so an installed
 * PWA shouldn't stay logged-in indefinitely. But it also shouldn't kick
 * the user the instant they switch to another app to check WhatsApp.
 *
 * Behaviour:
 *   • Activity events (touch / click / key / scroll) update a
 *     localStorage timestamp `bion_last_active_at`. Throttled to one
 *     write every 5s so we don't thrash storage on scrolling pages.
 *   • On AuthContext mount AND on every visibilitychange → visible,
 *     compare now - lastActive against IDLE_MS. If exceeded, call the
 *     onIdle callback (typically logout + redirect).
 *
 * Default threshold: 3 minutes. Tweak via IDLE_MINUTES env var if we
 * ever want a different policy per role.
 *
 * NOT applied to demo accounts — they have no PII to protect and the
 * extra logout friction makes the QA / demo experience worse.
 */
import { useEffect, useRef } from "react";

const STORAGE_KEY = "bion_last_active_at";
const IDLE_MINUTES = Number(import.meta.env.VITE_IDLE_MINUTES ?? 3);
const IDLE_MS = IDLE_MINUTES * 60 * 1000;
const THROTTLE_MS = 5_000;

function stampNow(): void {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* */ }
}

function readLastActive(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

export function useIdleSignOut(opts: {
  enabled: boolean;
  onIdle: () => void;
}): void {
  const { enabled, onIdle } = opts;
  const lastStampRef = useRef(0);

  // Throttled activity bumper — one write per THROTTLE_MS regardless
  // of how often the user is interacting.
  useEffect(() => {
    if (!enabled) return;

    const bump = () => {
      const now = Date.now();
      if (now - lastStampRef.current < THROTTLE_MS) return;
      lastStampRef.current = now;
      stampNow();
    };

    // Stamp once immediately so a fresh login doesn't read 0 from a
    // previous session and trip the threshold on the very next check.
    bump();

    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("mousedown", bump, opts);
    window.addEventListener("touchstart", bump, opts);
    window.addEventListener("keydown", bump, opts);
    window.addEventListener("scroll", bump, opts);

    return () => {
      window.removeEventListener("mousedown", bump, opts);
      window.removeEventListener("touchstart", bump, opts);
      window.removeEventListener("keydown", bump, opts);
      window.removeEventListener("scroll", bump, opts);
    };
  }, [enabled]);

  // Check-on-mount and check-on-visible. If the user has been away
  // longer than the threshold, fire onIdle.
  useEffect(() => {
    if (!enabled) return;

    const check = () => {
      const last = readLastActive();
      if (last === 0) {
        // No prior stamp — treat as fresh and stamp now. Avoids an
        // immediate logout right after first sign-in.
        stampNow();
        return;
      }
      if (Date.now() - last > IDLE_MS) {
         
        console.info("[idle-signout] idle threshold exceeded, signing out");
        onIdle();
      }
    };

    // Check on mount.
    check();

    // Check on focus/visibility.
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [enabled, onIdle]);
}
