import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type Permission = NotificationPermission | "unsupported";

export interface UsePushNotifications {
  supported: boolean;
  permission: Permission;
  subscribed: boolean;
  loading: boolean;
  subscribe: () => Promise<boolean>;
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
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
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
  const [permission, setPermission] = useState<Permission>(() =>
    isSupported() ? Notification.permission : "unsupported",
  );
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // On mount, check whether this browser already has a live subscription.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => { if (!cancelled) setSubscribed(!!sub); })
      .catch(() => { if (!cancelled) setSubscribed(false); });
    return () => { cancelled = true; };
  }, [supported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
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
            return false;
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
          if (!token) return false;

          // POST to backend with platform + token. Capacitor on iOS
          // returns APNs tokens unless Firebase iOS SDK is wired to
          // exchange them for FCM tokens (CocoaPods step). Either way,
          // we tag with the platform so the backend dispatches via the
          // correct transport.
          const platform = Capacitor.getPlatform() === "ios" ? "apns" : "fcm";
          const authHeader = await getAuthHeader();
          if (!authHeader.Authorization) {
            if (import.meta.env.DEV) console.warn("[push] no auth session — cannot register native token");
            return false;
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
          if (!json?.ok) return false;
          setSubscribed(true);
          return true;
        }
      } catch {
        // Capacitor not available (web bundle on plain browser) — fall
        // through to Web Push.
      }

      if (!supported) return false;

      // 1. Ask for permission (browser-level)
      let perm = Notification.permission;
      if (perm !== "granted") {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }
      if (perm !== "granted") return false;

      // 2. Fetch the server's VAPID public key
      const keyRes = await fetch(`${API}/api/notifications/push/vapid-public-key`);
      const keyJson = await keyRes.json();
      if (!keyJson?.ok || !keyJson?.publicKey) {
        if (import.meta.env.DEV) console.warn("[push] VAPID key not available from server");
        return false;
      }

      // 3. Subscribe via PushManager
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        // Already subscribed in this browser — just make sure the server knows
        setSubscribed(true);
      }
      const subscription = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey),
      });

      // 4. Register with backend (needs user auth)
      const authHeader = await getAuthHeader();
      if (!authHeader.Authorization) {
        if (import.meta.env.DEV) console.warn("[push] no auth session — cannot register subscription");
        return false;
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
        if (import.meta.env.DEV) console.warn("[push] server rejected subscription:", json?.error);
        return false;
      }
      setSubscribed(true);
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.warn("[push] subscribe failed:", err?.message);
      return false;
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
        if (import.meta.env.DEV) console.warn("[push] backend unsubscribe failed:", err?.message);
      }
      setSubscribed(false);
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.warn("[push] unsubscribe failed:", err?.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
