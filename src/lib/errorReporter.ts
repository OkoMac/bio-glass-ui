/**
 * BION Auto Error Reporter
 *
 * Catches errors globally (unhandled exceptions, failed fetches, timeouts,
 * ErrorBoundary crashes) and auto-creates support tickets so the team
 * can find and fix issues before users have to report them.
 *
 * Deduplicates by error fingerprint — same error won't flood tickets.
 * Respects a cooldown so the same user doesn't spam the system.
 */

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

// Cooldown: don't report the same error fingerprint more than once per 5 minutes
const COOLDOWN_MS = 5 * 60 * 1000;
const reported = new Map<string, number>();

interface ErrorReport {
  type: "crash" | "api_error" | "timeout" | "unhandled";
  message: string;
  stack?: string;
  url?: string;
  statusCode?: number;
  userId?: string;
  userEmail?: string;
  userAgent: string;
  page: string;
  timestamp: string;
}

function fingerprint(report: ErrorReport): string {
  return `${report.type}:${report.message?.slice(0, 80)}:${report.page}`;
}

function shouldReport(fp: string): boolean {
  const last = reported.get(fp);
  if (last && Date.now() - last < COOLDOWN_MS) return false;
  reported.set(fp, Date.now());
  return true;
}

/** Get current user info from localStorage (avoids importing AuthContext) */
function getCurrentUser(): { id?: string; email?: string } {
  try {
    const raw = localStorage.getItem("bio_user");
    if (!raw) return {};
    const u = JSON.parse(raw);
    return { id: u.id, email: u.email };
  } catch {
    return {};
  }
}

/** Send error report to backend (fire-and-forget, never throws) */
async function sendReport(report: ErrorReport): Promise<void> {
  try {
    await fetch(`${API}/api/support/auto-ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Swallow — error reporting must never cause more errors
  }
}

/** Report a crash from ErrorBoundary */
export function reportCrash(error: Error): void {
  const user = getCurrentUser();
  const report: ErrorReport = {
    type: "crash",
    message: error.message,
    stack: error.stack?.slice(0, 500),
    userId: user.id,
    userEmail: user.email,
    userAgent: navigator.userAgent,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  };
  if (shouldReport(fingerprint(report))) sendReport(report);
}

/** Report a failed API call */
export function reportApiError(url: string, status: number, body?: string): void {
  const user = getCurrentUser();
  const report: ErrorReport = {
    type: "api_error",
    message: `API ${status}: ${url} — ${body?.slice(0, 200) ?? "no body"}`,
    url,
    statusCode: status,
    userId: user.id,
    userEmail: user.email,
    userAgent: navigator.userAgent,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  };
  if (shouldReport(fingerprint(report))) sendReport(report);
}

/** Report a timeout */
export function reportTimeout(action: string, durationMs: number): void {
  const user = getCurrentUser();
  const report: ErrorReport = {
    type: "timeout",
    message: `Timeout after ${durationMs}ms: ${action}`,
    userId: user.id,
    userEmail: user.email,
    userAgent: navigator.userAgent,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  };
  if (shouldReport(fingerprint(report))) sendReport(report);
}

/**
 * Wrap a fetch call with automatic timeout + error reporting.
 * Usage: const res = await trackedFetch("/api/account/verify-email", { method: "POST", ... }, { action: "email verification", timeoutMs: 15000 });
 */
export async function trackedFetch(
  url: string,
  init?: RequestInit,
  opts?: { action?: string; timeoutMs?: number },
): Promise<Response> {
  const timeoutMs = opts?.timeoutMs ?? 15000;
  const action = opts?.action ?? url;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeout);

    // Auto-report server errors (5xx)
    if (res.status >= 500) {
      const body = await res.clone().text().catch(() => "");
      reportApiError(url, res.status, body);
    }
    return res;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      reportTimeout(action, timeoutMs);
      throw new Error(`${action} timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  }
}

/** Install global handlers (call once at app startup) */
export function installGlobalErrorHandlers(): void {
  // Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message ?? String(event.reason ?? "Unknown rejection");
    // Skip chunk loading errors (handled by ErrorBoundary)
    if (msg.includes("dynamically imported module") || msg.includes("Loading chunk")) return;
    // Skip 3rd-party / extension noise
    if (msg.includes("adsbygoogle") || msg.includes("TagError")) return;
    if (msg.includes("chrome-extension://") || msg.includes("moz-extension://")) return;
    // Service worker update failures — fire constantly from older browsers /
    // bad network conditions / browser restart races. Not actionable. Audit
    // (27 Apr 2026) found 200+ auto-tickets in 7 days from this single pattern.
    if (msg.includes("Failed to update a ServiceWorker")) return;
    if (msg.includes("ServiceWorker") && (msg.includes("script evaluation") || msg.includes("scope"))) return;
    const user = getCurrentUser();
    const report: ErrorReport = {
      type: "unhandled",
      message: msg,
      stack: event.reason?.stack?.slice(0, 500),
      userId: user.id,
      userEmail: user.email,
      userAgent: navigator.userAgent,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    };
    if (shouldReport(fingerprint(report))) sendReport(report);
  });

  // Catch global errors
  window.addEventListener("error", (event) => {
    const msg = event.message ?? "Unknown error";
    if (msg.includes("dynamically imported module") || msg.includes("Loading chunk")) return;
    if (msg.includes("ResizeObserver")) return; // Benign browser noise
    // 3rd-party ad SDK noise — Google AdSense fires "TagError: adsbygoogle.push()
    // error: No slot size for available width" on slow connections / mobile.
    // Not actionable, was flooding the support queue with auto-tickets.
    if (msg.includes("adsbygoogle") || msg.includes("TagError")) return;
    // Browser extension errors (Chrome ad-blocker, etc.) we can't fix
    if (msg.includes("chrome-extension://") || msg.includes("moz-extension://")) return;
    // Service worker update / activation failures — see unhandledrejection
    // handler. Same noise, just routed via 'error' event in some browsers.
    if (msg.includes("Failed to update a ServiceWorker")) return;
    if (msg.includes("ServiceWorker") && (msg.includes("script evaluation") || msg.includes("scope"))) return;
    const user = getCurrentUser();
    const report: ErrorReport = {
      type: "unhandled",
      message: msg,
      stack: event.error?.stack?.slice(0, 500),
      userId: user.id,
      userEmail: user.email,
      userAgent: navigator.userAgent,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    };
    if (shouldReport(fingerprint(report))) sendReport(report);
  });
}
