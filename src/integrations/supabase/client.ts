import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const AUTH_STORAGE_KEY = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;

/**
 * Proactively purge obviously-corrupt Supabase tokens BEFORE the client
 * initialises. Otherwise `autoRefreshToken: true` can hang every query
 * indefinitely while waiting for a refresh that will never succeed.
 *
 * Symptoms that had us chasing ghosts: every supabase.from() would return
 * a promise that never resolved, zero network requests on the wire, UI
 * components stuck on their loading spinners.
 */
(function cleanStaleAuthToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const expiresAt = parsed?.expires_at ?? parsed?.currentSession?.expires_at;
    // If token has no expiry, or has already expired by >1 day, nuke it.
    const nowSec = Math.floor(Date.now() / 1000);
    if (!expiresAt || expiresAt < nowSec - 86400) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Unparseable token = definitely broken
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
})();

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    storageKey: AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    // Guard against hung auth requests by capping every fetch at 15s.
    // Prevents the "stuck forever" spinner when a refresh stalls.
    fetch: (input, init) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
    },
  },
});

