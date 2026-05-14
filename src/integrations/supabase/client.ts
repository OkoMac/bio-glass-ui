import { createClient, processLock } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
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

/**
 * QA audit M-10 (2026-04-28, P1): on Capacitor native, default
 * localStorage is plain JSON in the app's data directory and
 * readable by ADB / device-compromise / a malicious sibling app.
 * Wrap the storage with @capacitor/preferences which uses
 * platform-encrypted storage (Keychain on iOS, EncryptedSharedPreferences
 * on Android). Web path is unchanged.
 *
 * Migrates legacy localStorage tokens on first read so existing
 * sessions don't get orphaned by the swap.
 */
function buildSupabaseStorage(): any {
  if (!Capacitor.isNativePlatform()) return localStorage;

  // Lazy-import the plugin so web bundles don't pay the cost.
  let prefsP: Promise<typeof import('@capacitor/preferences').Preferences> | null = null;
  const prefs = async () => {
    if (!prefsP) prefsP = import('@capacitor/preferences').then(m => m.Preferences);
    return prefsP!;
  };

  return {
    getItem: async (key: string): Promise<string | null> => {
      const P = await prefs();
      const { value } = await P.get({ key });
      if (value !== null) return value;
      // One-time migration from plain localStorage on first read so
      // a user who upgrades the app stays signed in.
      const legacy = localStorage.getItem(key);
      if (legacy !== null) {
        await P.set({ key, value: legacy });
        localStorage.removeItem(key);
        return legacy;
      }
      return null;
    },
    setItem: async (key: string, value: string): Promise<void> => {
      const P = await prefs();
      await P.set({ key, value });
    },
    removeItem: async (key: string): Promise<void> => {
      const P = await prefs();
      await P.remove({ key });
      // Belt-and-suspenders: also clear any straggling legacy entry.
      try { localStorage.removeItem(key); } catch { /* noop */ }
    },
  };
}

const _supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: buildSupabaseStorage(),
    storageKey: AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Use the in-process lock instead of navigator.locks. The default
    // navigator-based lock is cross-tab exclusive — if any other tab (or a
    // killed-but-not-GC'd context) holds it, every query in every other tab
    // hangs forever with no network activity. processLock is per-tab, which
    // is all we actually need since each tab has its own auth session.
    lock: processLock,
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

/**
 * Proxy that casts from() as `any` to work around the Postgrest v14.1
 * type-narrowing limitation in supabase-js@2.105 — `.eq("column_name")`
 * fails for columns that aren't in the intersection of all primary keys.
 *
 * TODO: the trailing `as any` on the Proxy means every `.from(...)` query
 * loses type checking entirely — not just the narrowing case the proxy
 * was meant to handle. The comment ("Keeps `.auth`, `.rpc`, etc. fully
 * typed — only `.from()` is affected") is misleading: as exported, the
 * whole supabase variable is `any`. Untangle by typing this as
 * `Omit<typeof _supabase, "from"> & { from: (relation: string) => any }`
 * once you can fix the cascading errors that re-surface. Track the
 * upstream narrowing bug in postgrest-js and remove the workaround
 * entirely when supabase-js is upgraded past the fix.
 */
export const supabase = new Proxy(_supabase, {
  get(target, prop) {
    if (prop === "from") {
      return (relation: string) => (target as any).from(relation);
    }
    return (target as any)[prop];
  },
}) as any;
