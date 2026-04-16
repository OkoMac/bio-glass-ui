import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as Sentry from "@sentry/react";

// ── Sentry error monitoring ──
// DSN is injected at build time via VITE_SENTRY_DSN. Falls back to a
// baked-in DSN for the prod build. Dev builds without VITE_SENTRY_DSN
// never report to Sentry (DSN empty → init no-ops).
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
  || (import.meta.env.PROD
    ? "https://1b97b3c9e494f532ca8e4f26bc477fb5@o4511231086821376.ingest.de.sentry.io/4511231110086736"
    : "");
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
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
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
