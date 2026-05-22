import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * useUserPref — server-persisted user preferences with a localStorage
 * hot cache for first-paint speed.
 *
 * Why this exists:
 *   Pre-fix preferences (Hub pinned tools, notification channels, etc.)
 *   lived in localStorage only. iOS wipes a PWA's localStorage when the
 *   user removes it from the home screen, so re-installing meant losing
 *   every customisation. Reported 2026-05-05 (investable123).
 *
 * How it works:
 *   1. First render reads from localStorage so the UI doesn't flash —
 *      whatever the user last saw is on screen instantly.
 *   2. In parallel, fetch user_preferences row from Supabase. If the
 *      server has a value for this key, that wins (source of truth).
 *      If the server has NO value but localStorage does, push the
 *      local value up to the server (one-time migration for existing
 *      users so they don't start over on first sign-in after this lands).
 *   3. setValue: optimistic local update + write to localStorage + upsert
 *      to user_preferences.prefs[key] via JSONB jsonb_set on the server.
 *   4. Demo accounts and signed-out users use localStorage only; the
 *      server round-trip is skipped.
 *
 * Single JSONB blob keyed by profile_id, so adding a new pref is just a
 * new key — no schema changes per preference type.
 *
 * Race protection: a `lastSetAt` ref guards against the parallel server
 * fetch overwriting an in-flight user setValue. If the user changed the
 * value < 5s ago, the server response is ignored.
 */

const PREFS_TABLE = "user_preferences";
const RACE_WINDOW_MS = 5_000;

type SetValue<T> = (next: T | ((prev: T) => T)) => void;

export function useUserPref<T>(key: string, defaultValue: T, opts?: { lsKey?: string }): [T, SetValue<T>, { synced: boolean }] {
  const { user } = useAuth();
  const lsKey = opts?.lsKey ?? `bion_pref_${key}`;
  const isReal = !!user?.profileId && !user.id?.startsWith("demo_");

  const lastSetAt = useRef(0);

  const [value, setValueState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      return raw != null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const [synced, setSynced] = useState(false);

  // Pull from server once we have a profileId. If the server is empty
  // for this key but local has a value, migrate local → server.
  useEffect(() => {
    if (!isReal) { setSynced(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from(PREFS_TABLE)
          .select("prefs")
          .eq("profile_id", user!.profileId!)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          // Table missing or transient error — keep using localStorage,
          // mark synced=true so the UI doesn't wait forever.
          setSynced(true);
          return;
        }
        const serverPrefs = (data?.prefs ?? {}) as Record<string, unknown>;
        const serverValue = serverPrefs[key];

        // Skip if user just modified locally — their write is in flight.
        if (Date.now() - lastSetAt.current < RACE_WINDOW_MS) {
          setSynced(true);
          return;
        }

        if (serverValue !== undefined) {
          // Server is the source of truth.
          setValueState(serverValue as T);
          try { localStorage.setItem(lsKey, JSON.stringify(serverValue)); } catch { /* */ }
        } else {
          // Server has no value but local might — push local up so the
          // user's customisation survives the next PWA reinstall.
          const lsRaw = (() => { try { return localStorage.getItem(lsKey); } catch { return null; } })();
          if (lsRaw != null) {
            try {
              const parsed = JSON.parse(lsRaw) as T;
              await writeServerPref(user!.profileId!, key, parsed);
            } catch { /* */ }
          }
        }
        setSynced(true);
      } catch {
        setSynced(true);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId, key, lsKey, isReal]);

  const setValue: SetValue<T> = useCallback((next) => {
    setValueState(prev => {
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      lastSetAt.current = Date.now();
      try { localStorage.setItem(lsKey, JSON.stringify(v)); } catch { /* */ }
      if (isReal) {
        // Fire-and-forget; race-protected by lastSetAt above.
        writeServerPref(user!.profileId!, key, v).catch((e: unknown) => console.warn("[useUserPref] writeServerPref:", e instanceof Error ? e.message : String(e)));
      }
      return v;
    });
  }, [isReal, key, lsKey, user?.profileId]);

  return [value, setValue, { synced }];
}

/** Upsert one key inside user_preferences.prefs without clobbering siblings. */
async function writeServerPref(profileId: string, key: string, value: unknown): Promise<void> {
  // Read-modify-write keeps the JSON merge logic on the client; for
  // higher write contention we could move to a SQL function with
  // jsonb_set, but per-user prefs see ~zero concurrent writes.
  const { data: existing } = await supabase
    .from(PREFS_TABLE)
    .select("prefs")
    .eq("profile_id", profileId)
    .maybeSingle();

  const merged = { ...((existing?.prefs as Record<string, unknown> | undefined) ?? {}), [key]: value };

  await supabase
    .from(PREFS_TABLE)
    .upsert({ profile_id: profileId, prefs: merged }, { onConflict: "profile_id" });
}
