import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type Permission = NotificationPermission | "unsupported";

export type SubscribeFailReason =
  | "unsupported"            // browser doesn't have SW + PushManager + Notification
  | "permission_denied"      // user clicked Block (or has it pre-blocked)
  | "vapid_missing"          // backend returned ok:false on /vapid-public-key
  | "push_service_blocked"   // PushManager.subscribe() rejected — Brave Shields, Firefox private, etc.
  | "auth_required"          // no supabase session, can't register sub server-side
  | "server_rejected"        // backend POST /subscribe returned ok:false
  | "unknown";               // anything else thrown in the try block

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: SubscribeFailReason; detail?: string };

export interface UsePushNotifications {
  supported: boolean;
  permission: Permission;
  subscribed: boolean;
  loading: boolean;
  subscribe: () => Promise<SubscribeResult>;
  unsubscribe: () => Promise<boolean>;
}

/**
 * Converts a URL-safe base64 VAPID public key into the Uint8Array format
 * PushManager.subscribe() expects. Mirrors the helper published by the
 * w3c Web Push reference docs.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  // Capacitor native (iOS / Android) — @capacitor/push-notifications
  // plugin handles delivery via APNs/FCM. The web-only checks below
  // would all fail on native, which would hide EnablePushCard etc. and
  // mean native users never get prompted.
  if ((window as any).Capacitor?.isNativePlatform?.()) return true;
  // Web Push path
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function isNativePlatform(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Web Push subscription hook. Handles:
 *   - feature detection (`supported`)
 *   - permission gating (`permission` / `requestPermission`)
 *   - VAPID public-key fetch from the backend
 *   - PushManager.subscribe → POST to /api/notifications/push/subscribe
 *   - graceful unsubscribe (both browser + backend)
 *
 * Designed to be safe to mount anywhere — in an unsupported browser it just
 * reports `supported: false` and every action no-ops.
 */
export function usePushNotifications(): UsePushNotifications {
  const [supported] = useState<boolean>(() => isSupported());
  const [permission, setPermission] = useState<Permission>(() => {
    if (!isSupported()) return "unsupported";
    // Native: actual permission state is async (Capacitor plugin); start as
    // 'default' so the EnablePushCard renders the prompt and we resolve
    // when the user taps it.
    if (isNativePlatform()) return "default";
    return Notification.permission;
  });
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // On mount, check whether this device already has a live subscription.
  // Web: getSubscription() from the ServiceWorker registration.
  // Native: Capacitor PushNotifications doesn't expose a "is subscribed"
  // query directly — we proxy by checking permission state. If granted,
  // we assume the registration event fired previously and the token is
  // already with the backend (idempotent upsert handles re-registration).
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;

    if (isNativePlatform()) {
      (async () => {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          const status = await PushNotifications.checkPermissions();
          if (cancelled) return;
          if (status.receive === "granted") {
            setPermission("granted");
            setSubscribed(true);
          } else if (status.receive === "denied") {
            setPermission("denied");
          }
        } catch { /* plugin unavailable in this build — leave as default */ }
      })();
      return () => { cancelled = true; };
    }

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => { if (!cancelled) setSubscribed(!!sub); })
      .catch(() => { if (!cancelled) setSubscribed(false); });
    return () => { cancelled = true; };
  }, [supported]);

  const subscribe = useCallback(async (): Promise<SubscribeResult> => {
    setLoading(true);
    try {
      // ── Native path (Capacitor): FCM on Android, APNs on iOS ──
      // Detected at runtime so the same hook works on web + iOS + Android
      // without separate code paths in callers. Falls through to the Web
      // Push branch on plain browsers.
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          // Permission + register
          const permResult = await PushNotifications.requestPermissions();
          if (permResult.receive !== "granted") {
            setPermission("denied" as Permission);
            return { ok: false, reason: "permission_denied" };
          }
          setPermission("granted" as Permission);

          // Register returns void; the actual token arrives via the
          // 'registration' event listener.
          const tokenPromise = new Promise<string | null>((resolve) => {
            const timer = setTimeout(() => resolve(null), 15_000);
            PushNotifications.addListener("registration", (reg) => {
              clearTimeout(timer);
              resolve(reg.value);
            });
            PushNotifications.addListener("registrationError", () => {
              clearTimeout(timer);
              resolve(null);
            });
          });
          await PushNotifications.register();
          const token = await tokenPromise;
          if (!token) return { ok: false, reason: "push_service_blocked", detail: "native registration timeout" };

          // POST to backend with platform + token. Capacitor on iOS
          // returns APNs tokens unless Firebase iOS SDK is wired to
          // exchange them for FCM tokens (CocoaPods step). Either way,
          // we tag with the platform so the backend dispatches via the
          // correct transport.
          const platform = Capacitor.getPlatform() === "ios" ? "apns" : "fcm";
          const authHeader = await getAuthHeader();
          if (!authHeader.Authorization) {
            if (import.meta.env.DEV) console.warn("[push] no auth session — cannot register native token");
            return { ok: false, reason: "auth_required" };
          }
          const res = await fetch(`${API}/api/notifications/push/subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeader },
            body: JSON.stringify({
              nativeToken: token,
              platform,
              userAgent: navigator.userAgent,
            }),
          });
          const json = await res.json();
          if (!json?.ok) return { ok: false, reason: "server_rejected", detail: json?.error };
          setSubscribed(true);
          return { ok: true };
        }
      } catch {
        // Capacitor not available (web bundle on plain browser) — fall
        // through to Web Push.
      }

      if (!supported) return { ok: false, reason: "unsupported" };

      // 1. Ask for permission (browser-level)
      let perm = Notification.permission;
      if (perm !== "granted") {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }
      if (perm !== "granted") return { ok: false, reason: "permission_denied" };

      // 2. Fetch the server's VAPID public key
      const keyRes = await fetch(`${API}/api/notifications/push/vapid-public-key`);
      const keyJson = await keyRes.json();
      if (!keyJson?.ok || !keyJson?.publicKey) {
        // Real config issue — server is missing VAPID. Surface loud.
        console.error("[push] VAPID key not available from server");
        return { ok: false, reason: "vapid_missing" };
      }

      // 3. Subscribe via PushManager
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        // Already subscribed in this browser — just make sure the server knows
        setSubscribed(true);
      }
      let subscription: PushSubscription;
      try {
        subscription = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey) as any,
        });
      } catch (subErr: any) {
        // Brave Shields blocks Google FCM by default → "Registration failed - push service error"
        // Firefox in private mode → "Push service not available"
        // Some corporate networks block https://fcm.googleapis.com
        console.error("[push] PushManager.subscribe rejected:", subErr?.message);
        return { ok: false, reason: "push_service_blocked", detail: subErr?.message };
      }

      // 4. Register with backend (needs user auth)
      const authHeader = await getAuthHeader();
      if (!authHeader.Authorization) {
        if (import.meta.env.DEV) console.warn("[push] no auth session — cannot register subscription");
        return { ok: false, reason: "auth_required" };
      }
      const payload = {
        subscription: subscription.toJSON(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      };
      const res = await fetch(`${API}/api/notifications/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json?.ok) {
        console.error("[push] server rejected subscription:", json?.error);
        return { ok: false, reason: "server_rejected", detail: json?.error };
      }
      setSubscribed(true);
      return { ok: true };
    } catch (err: any) {
      console.error("[push] subscribe failed:", err?.message);
      return { ok: false, reason: "unknown", detail: err?.message };
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setSubscribed(false);
        return true;
      }
      const endpoint = sub.endpoint;
      await sub.unsubscribe();

      try {
        const authHeader = await getAuthHeader();
        if (authHeader.Authorization) {
          await fetch(`${API}/api/notifications/push/unsubscribe`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json", ...authHeader },
            body: JSON.stringify({ endpoint }),
          });
        }
      } catch (err: any) {
        console.error("[push] backend unsubscribe failed:", err?.message);
      }
      setSubscribed(false);
      return true;
    } catch (err: any) {
      console.error("[push] unsubscribe failed:", err?.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
