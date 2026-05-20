/**
 * useBiometricsSync — global background sync of phone biometrics into Supabase.
 *
 * Per Oko 2026-05-20: B_'s calorie recommendation and the Food Tracker's
 * goal calculator should reflect REAL data from the user's cellphone
 * (Apple Health on iOS, Health Connect on Android). Before this hook,
 * sync only happened when the user opened /health-profile — so every
 * other page (B_ chat, Food Tracker) was seeing stale data.
 *
 * This hook mounts ONCE in App.tsx and runs the same auto-write logic
 * that HealthProfile.tsx had baked in, but globally:
 *
 *   1. On any signed-in non-demo user on a Capacitor native build,
 *      auto-request HealthKit / Health Connect authorisation. (Idempotent
 *      via the plugin — repeat calls are no-ops once granted.)
 *   2. On every refresh tick (initial + visibility-change), upsert the
 *      latest steps / weight / sleep into health_logs for today.
 *
 * Web / desktop browser: no-op. HealthKit and Health Connect are not
 * available outside the wrapped native app — only data the user has
 * logged manually (or that came from another device sync) will be in
 * health_logs. The UI surfaces an "Apple Health connected" banner where
 * this matters so the user knows whether biometrics are flowing.
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNativeHealth } from "@/hooks/useNativeHealth";
import { useHealthLogs } from "@/hooks/useHealth";
import { getSASTDateKey } from "@/utils/sastDate";

export function useBiometricsSync(): void {
  const { user } = useAuth();
  const { logs, logToday } = useHealthLogs(2);
  const native = useNativeHealth();
  const authReqOnceRef = useRef(false);

  // Auto-request permissions on first opportunity. Plugin no-ops if
  // already granted, so calling it on every mount is safe. We don't
  // want to pester the user with a permission sheet on every page
  // change though — so guard with a ref to fire once per session.
  useEffect(() => {
    if (!user || user.id?.startsWith("demo_")) return;
    if (!native.isNative) return;
    if (native.authorized || authReqOnceRef.current) return;
    authReqOnceRef.current = true;
    native.requestAuth().catch(() => { /* user denied or plugin hiccup; silent */ });
  }, [user, native]);

  // Push fresh native readings into health_logs whenever they change.
  // The condition mirrors the original HealthProfile logic so behaviour
  // stays identical for users who were used to that page being the
  // only place this happened.
  useEffect(() => {
    if (!user || user.id?.startsWith("demo_")) return;
    if (!native.isNative || !native.authorized) return;

    const todayStr = getSASTDateKey();
    const todayLog = (logs as any[]).find((l) => l.log_date === todayStr) ?? {};
    const patch: Record<string, number> = {};

    if (typeof native.steps === "number" && native.steps > ((todayLog.steps as number | undefined) ?? 0)) {
      patch.steps = Math.round(native.steps);
    }
    if (typeof native.weight === "number" && !(todayLog.weight_kg as number | undefined)) {
      patch.weight_kg = Math.round(native.weight * 10) / 10;
    }
    if (typeof native.sleep === "number" && !(todayLog.sleep_hours as number | undefined)) {
      patch.sleep_hours = Math.round(native.sleep * 10) / 10;
    }
    if (Object.keys(patch).length > 0) {
      logToday(patch).catch(() => { /* next visibility-change tick retries */ });
    }
  }, [user, native.isNative, native.authorized, native.steps, native.weight, native.sleep, logs, logToday]);

  // Re-pull from device on visibility change so the data is fresh
  // when the user returns to the app. Cheap — native plugins cache.
  useEffect(() => {
    if (!native.isNative || !native.authorized) return;
    const onVisible = () => { if (!document.hidden) native.refresh().catch(() => { /* */ }); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [native]);
}
