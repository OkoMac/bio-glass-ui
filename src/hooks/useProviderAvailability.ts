// Hook for the current provider to load + save their weekly availability.
// Returns { slots, overrides, loading, saveSlots, addOverride, removeOverride }.
//
// Reads are public (GET /:providerId/availability). Writes go through the
// authenticated backend routes (PUT /availability, POST/DELETE
// /availability/override) which resolve the caller's profile from the
// Supabase JWT.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export interface AvailabilitySlot {
  id?: string;
  day_of_week: number; // 0=Sun ... 6=Sat
  start_time: string;  // HH:MM or HH:MM:SS
  end_time: string;
  timezone?: string;
  active?: boolean;
}

export interface AvailabilityOverride {
  id?: string;
  date: string;              // YYYY-MM-DD
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface UseProviderAvailability {
  slots: AvailabilitySlot[];
  overrides: AvailabilityOverride[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveSlots: (next: AvailabilitySlot[]) => Promise<boolean>;
  addOverride: (o: Omit<AvailabilityOverride, "id">) => Promise<boolean>;
  removeOverride: (date: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

export function useProviderAvailability(): UseProviderAvailability {
  const { user } = useAuth();
  const profileId = user?.profileId ?? null;

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/providers/${profileId}/availability`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to load availability");
      setSlots((json.weekly ?? []) as AvailabilitySlot[]);
      setOverrides((json.overrides ?? []) as AvailabilityOverride[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => { refresh(); }, [refresh]);

  const saveSlots = useCallback(async (next: AvailabilitySlot[]): Promise<boolean> => {
    if (!profileId) return false;
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const payload = next.map(s => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time,
        end_time:   s.end_time.length   === 5 ? `${s.end_time}:00`   : s.end_time,
      }));
      const res = await fetch(`${API}/api/providers/availability`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ slots: payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to save availability");
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [profileId, refresh]);

  const addOverride = useCallback(async (o: Omit<AvailabilityOverride, "id">): Promise<boolean> => {
    if (!profileId) return false;
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/api/providers/availability/override`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          date: o.date,
          start_time: o.start_time ?? null,
          end_time: o.end_time ?? null,
          reason: o.reason ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to save override");
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [profileId, refresh]);

  const removeOverride = useCallback(async (date: string): Promise<boolean> => {
    if (!profileId) return false;
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(
        `${API}/api/providers/availability/override/${encodeURIComponent(date)}`,
        { method: "DELETE", headers },
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to remove override");
      await refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [profileId, refresh]);

  return { slots, overrides, loading, saving, error, saveSlots, addOverride, removeOverride, refresh };
}
