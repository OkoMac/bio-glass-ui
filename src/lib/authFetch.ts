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
 * Authenticated fetch wrapper. If no session exists, redirects to /welcome.
 * If the backend returns 401/403, also redirects.
 * Returns the Response object on success.
 */
export async function authFetch(
  path: string,
  init?: RequestInit,
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
  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });

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
  init?: RequestInit,
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
  window.location.href = "/welcome";
}
