import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as Sentry from "@sentry/react";

// ── Sentry error monitoring ──
// QA audit M-13 (2026-04-28): DSN must come from VITE_SENTRY_DSN at
// build time. The previous hardcoded prod fallback baked the org id +
// DSN into the bundle, where any visitor could harvest it to flood
// the project's Sentry quota with junk events.
const SENTRY_DSN = (import.meta.env.VITE_SENTRY_DSN as string | undefined) ?? "";
if (!SENTRY_DSN && import.meta.env.PROD) {
  console.warn("[sentry] VITE_SENTRY_DSN not set — error monitoring is OFF in this build. Set it in Vercel project env vars.");
}
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `bion-frontend@${import.meta.env.MODE}`,
    integrations: [Sentry.browserTracingIntegration()],
    // Sample 10% of page loads for performance monitoring in prod; always in dev.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    // Don't send benign fetch aborts / network cancellations
    ignoreErrors: [
      "AbortError",
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "Failed to fetch dynamically imported module",  // handled by ErrorBoundary reload logic
    ],
    // Strip PII before send — we don't want to send emails/names to Sentry
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
      }
      return event;
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);

// ── Service Worker registration ──
//
// Auto-update strategy:
//   1. /sw.js is byte-stamped per deploy by scripts/inject-sw-version.mjs
//      (replaces __BION_BUILD__ in CACHE_NAME with version-shortsha). Every
//      deploy guarantees a different SW file even if no SW logic changed.
//   2. reg.update() runs on every page load AND every 30 minutes for
//      long-lived tabs (someone leaving BION open all day still picks up
//      updates within the half-hour).
//   3. When a new SW activates we don't yank the page mid-interaction — we
//      defer the reload until the tab is hidden (the user switched apps or
//      closed the tab). They never witness a sudden refresh, and on the
//      very next visit they're on fresh code with all their localStorage
//      data still intact.
//
// Data preservation: localStorage and IndexedDB are NEVER cleared by the
// app or the SW. Caches are scoped (bion-<build>) and reset cleanly on
// activate via clients.claim — but caches only hold app shell + asset
// bundles, not user data.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");

      const reloadWhenHidden = () => {
        if (document.visibilityState === "hidden") {
          window.location.reload();
          return;
        }
        const onVis = () => {
          if (document.visibilityState === "hidden") {
            document.removeEventListener("visibilitychange", onVis);
            window.location.reload();
          }
        };
        document.addEventListener("visibilitychange", onVis);
      };

      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "activated" && navigator.serviceWorker.controller) {
            reloadWhenHidden();
          }
        });
      });

      // Initial check + recurring poll for long-open tabs.
      reg.update().catch(() => {});
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    } catch (err: any) {
      console.warn("[SW] registration failed:", err?.message ?? err);
    }
  });
}

// ── Global error monitoring ──
// Catches unhandled errors and promise rejections.
// In production, these could be sent to a monitoring service (Sentry, LogRocket).
window.addEventListener("error", (event) => {
  console.error("[BION Error]", event.error?.message ?? event.message, event.filename, event.lineno);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[BION Unhandled Promise]", event.reason);
});

// ── Performance monitoring ──
// Log paint metrics after load (First Contentful Paint, Largest Contentful Paint)
if ("PerformanceObserver" in window) {
  try {
    const paintObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          console.debug(`[perf] FCP: ${Math.round(entry.startTime)}ms`);
        }
      });
    });
    paintObserver.observe({ type: "paint", buffered: true });

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        console.debug(`[perf] LCP: ${Math.round(lastEntry.startTime)}ms`);
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    // PerformanceObserver not fully supported — skip
  }
}
