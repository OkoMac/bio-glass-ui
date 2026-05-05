import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Auto-logout after 10 minutes of user inactivity.
 * Listens for mousedown, keydown, touchstart, scroll, mousemove.
 * Only active when the user is logged in (non-demo).
 * Cleans up timers on unmount.
 */
export function useInactivityLogout(timeoutMs = 10 * 60 * 1000) {
  const { user, logout } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (user && !user.id?.startsWith("demo_")) {
        console.log("[inactivity] 10-min idle timeout — signing out");
        logout();
      }
    }, timeoutMs);
  };

  useEffect(() => {
    // Only active for real (non-demo) logged-in users
    if (!user || user.id?.startsWith("demo_")) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Start the initial timer
    resetTimer();

    const events: Array<keyof WindowEventMap> = [
      "mousedown", "keydown", "touchstart", "scroll", "mousemove",
    ];

    const handleActivity = () => resetTimer();

    // Throttle mousemove so we don't reset on every pixel
    let lastMove = 0;
    const throttledMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMove < 1000) return;
      lastMove = now;
      resetTimer();
    };

    for (const ev of events) {
      if (ev === "mousemove") {
        window.addEventListener(ev, throttledMove, { passive: true });
      } else {
        window.addEventListener(ev, handleActivity, { passive: true });
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const ev of events) {
        if (ev === "mousemove") {
          window.removeEventListener(ev, throttledMove);
        } else {
          window.removeEventListener(ev, handleActivity);
        }
      }
    };
  }, [user?.id, user?.id?.startsWith("demo_")]);
}
