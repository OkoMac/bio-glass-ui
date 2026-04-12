import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
