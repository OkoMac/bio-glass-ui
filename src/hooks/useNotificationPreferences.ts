/**
 * Hook to fetch/save notification preferences from the backend API.
 * Returns current preferences + update function.
 * Defaults are used when the user hasn't set preferences yet.
 */

import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders, NoSessionError } from "@/lib/authFetch";

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

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(true);

  const fetchPrefs = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const updatePrefs = useCallback(async (updates: Partial<NotificationPreferences>): Promise<boolean> => {
    setSaving(true);
    try {
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
  }, []);

  return { prefs, loading, saving, isDefault, updatePrefs, refetch: fetchPrefs };
}
