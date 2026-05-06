// Shared authenticated fetch utility.
// Ensures every API call that needs auth either has a valid token or
// redirects the user to /welcome instead of showing "Missing authorization header".

import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export class NoSessionError extends Error {
  constructor() {
    super("No active session");
    this.name = "NoSessionError";
  }
}

/**
 * Get auth headers, throwing NoSessionError if no session exists.
 * Use this when the caller needs raw headers (e.g. for non-JSON requests).
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new NoSessionError();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Surfaced when an authFetch call has exceeded its timeout window.
 * Distinct from NoSessionError + the Response error path so callers
 * can show "Request timed out — try again" instead of a generic
 * "Network error" that leaves the user wondering whether to retry.
 */
export class RequestTimeoutError extends Error {
  constructor(public readonly timeoutMs: number, public readonly path: string) {
    super(`Request to ${path} timed out after ${timeoutMs}ms`);
    this.name = "RequestTimeoutError";
  }
}

interface AuthFetchOpts extends RequestInit {
  /** Hard ceiling for the request. Cross-origin POSTs on iOS Safari /
   *  cellular sometimes silently hang; without a timeout the calling
   *  UI would sit on "Saving…" forever. Defaults: 15s for write
   *  methods, 30s for reads. Pass `0` to disable. */
  timeoutMs?: number;
}

/**
 * Authenticated fetch wrapper. If no session exists, redirects to /welcome.
 * If the backend returns 401/403 with an auth-related body, also redirects.
 * Wraps the fetch in an AbortController with a sensible default timeout
 * so a hung request surfaces as a clear RequestTimeoutError instead of
 * a never-resolving promise.
 */
export async function authFetch(
  path: string,
  init?: AuthFetchOpts,
): Promise<Response> {
  let headers: Record<string, string>;
  try {
    headers = await getAuthHeaders();
  } catch (e) {
    if (e instanceof NoSessionError) {
      redirectToLogin();
      // Return a never-resolving promise so the caller doesn't continue
      return new Promise(() => {});
    }
    throw e;
  }

  const url = path.startsWith("http") ? path : `${API}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();
  const isWrite = method !== "GET" && method !== "HEAD";
  const timeoutMs = init?.timeoutMs ?? (isWrite ? 15_000 : 30_000);

  // Build an abort signal that combines the caller's signal (if any)
  // with our timeout. If timeoutMs === 0, skip the timeout entirely.
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  let signal: AbortSignal | undefined = init?.signal ?? undefined;
  if (timeoutMs > 0) {
    const ctrl = new AbortController();
    timeoutHandle = setTimeout(() => ctrl.abort(), timeoutMs);
    if (init?.signal) {
      // Forward upstream aborts onto our controller so both fire as one.
      if (init.signal.aborted) ctrl.abort();
      else init.signal.addEventListener("abort", () => ctrl.abort(), { once: true });
    }
    signal = ctrl.signal;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal,
      headers: { ...headers, ...(init?.headers as Record<string, string>) },
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      // Distinguish "we timed out" vs "caller explicitly aborted". If the
      // caller's signal already fired, it's their abort, re-throw plain.
      if (init?.signal?.aborted) throw err;
      throw new RequestTimeoutError(timeoutMs, path);
    }
    throw err;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }

  if (res.status === 401 || res.status === 403) {
    const body = await res.clone().text();
    // Only redirect on auth-related errors, not permission errors
    if (
      body.includes("Missing auth") ||
      body.includes("Missing authorization") ||
      body.includes("Invalid token") ||
      body.includes("jwt expired") ||
      body.includes("not authenticated")
    ) {
      redirectToLogin();
      return new Promise(() => {});
    }
  }

  return res;
}

/**
 * Convenience: authFetch + parse JSON. Throws on non-ok responses.
 */
export async function authFetchJson<T = unknown>(
  path: string,
  init?: AuthFetchOpts,
): Promise<T> {
  const res = await authFetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

function redirectToLogin() {
  // Avoid redirect loops — only redirect if not already on auth pages
  const loc = window.location.pathname;
  if (loc === "/welcome" || loc === "/login" || loc === "/signup") return;
  window.location.href = "/welcome?login=true";
}
