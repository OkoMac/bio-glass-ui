/**
 * Hook to fetch/save notification preferences from the backend API.
 * Returns current preferences + update function.
 * Defaults are used when the user hasn't set preferences yet.
 */

import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders, NoSessionError } from "@/lib/authFetch";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export interface NotificationPreferences {
  channel_email: boolean;
  channel_push: boolean;
  channel_whatsapp: boolean;
  channel_in_app: boolean;
  cat_critical: boolean;
  cat_transactional: boolean;
  cat_wellness: boolean;
  cat_engagement: boolean;
  cat_business: boolean;
  cat_marketing: boolean;
  quiet_start: string;
  quiet_end: string;
  quiet_enabled: boolean;
  daily_cap: number;
}

const DEFAULTS: NotificationPreferences = {
  channel_email: true,
  channel_push: true,
  channel_whatsapp: true,
  channel_in_app: true,
  cat_critical: true,
  cat_transactional: true,
  cat_wellness: true,
  cat_engagement: true,
  cat_business: true,
  cat_marketing: false,
  quiet_start: "22:00",
  quiet_end: "07:00",
  quiet_enabled: true,
  daily_cap: 5,
};

// Demo accounts (id starts with "demo_") use localStorage instead of the API
const DEMO_KEY = "bion_demo_notif_prefs";

function loadDemoPrefs(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* fall through */ }
  return DEFAULTS;
}

function saveDemoPrefs(prefs: NotificationPreferences): void {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(prefs)); } catch { /* quota? */ }
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const isDemo = !!user?.id?.startsWith("demo_");

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(true);

  const fetchPrefs = useCallback(async () => {
    if (isDemo) {
      setPrefs(loadDemoPrefs());
      setIsDefault(false);
      setLoading(false);
      return;
    }
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API}/api/notification-preferences`, { headers });
      const json = await res.json();
      if (json.ok && json.preferences) {
        setPrefs({ ...DEFAULTS, ...json.preferences });
        setIsDefault(json.isDefault ?? false);
      }
    } catch (e) {
      if (e instanceof NoSessionError) return;
      console.warn("[useNotificationPreferences] fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const updatePrefs = useCallback(async (updates: Partial<NotificationPreferences>): Promise<boolean> => {
    setSaving(true);
    try {
      // Demo accounts → localStorage only
      if (isDemo) {
        setPrefs(prev => {
          const next = { ...prev, ...updates };
          saveDemoPrefs(next);
          return next;
        });
        return true;
      }

      const headers = await getAuthHeaders();
      const res = await fetch(`${API}/api/notification-preferences`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.ok && json.preferences) {
        setPrefs({ ...DEFAULTS, ...json.preferences });
        setIsDefault(false);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [isDemo]);

  return { prefs, loading, saving, isDefault, isDemo, updatePrefs, refetch: fetchPrefs };
}
