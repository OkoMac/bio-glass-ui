// Hook for the current provider to load + manage their service catalogue.
// Reads hit GET /api/providers/me/services (auth-gated, returns ALL rows
// including inactive). Mutations go through the backend CRUD endpoints:
//   POST   /api/providers/services
//   PATCH  /api/providers/services/:id
//   DELETE /api/providers/services/:id
//   POST   /api/providers/services/:id/toggle-active
//
// Backend ownership check means we can't accidentally edit someone else's
// service — the server will 403. This hook is intentionally optimistic on
// toggleActive (common path) but strict on create/update/remove so we keep
// the UI in sync with whatever the DB actually persisted.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/authFetch";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export type BionVertical =
  | "fitness"
  | "medical"
  | "beauty"
  | "mental"
  | "nutrition"
  | "wellness"
  | "professional";

export type DeliveryMode = "in_person" | "telehealth" | "both";

export interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  price_rand: number;
  duration_minutes: number;
  category: BionVertical | string;
  active: boolean;
  delivery_mode?: DeliveryMode;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceInput {
  title: string;
  description?: string | null;
  price_rand: number;
  duration_minutes: number;
  category: BionVertical;
  active?: boolean;
  delivery_mode?: DeliveryMode;
}

export interface UseProviderServices {
  services: Service[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  create: (input: ServiceInput) => Promise<Service>;
  update: (id: string, input: Partial<ServiceInput>) => Promise<Service>;
  remove: (id: string) => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

async function authHeaders(): Promise<Record<string, string>> {
  try {
    return await getAuthHeaders();
  } catch {
    window.location.href = "/welcome?login=true";
    return { "Content-Type": "application/json" };
  }
}

/**
 * Normalise a service row from the backend. The DB may still hold legacy
 * rows where price/is_published are set but price_rand/active are NULL; the
 * backend's GET endpoints already fill these in, but we double-belt here so
 * the hook's consumers never see a stray `undefined`.
 */
function normalise(row: any): Service {
  return {
    id: row.id,
    provider_id: row.provider_id,
    title: row.title ?? "",
    description: row.description ?? null,
    price_rand: Number(row.price_rand ?? row.price ?? 0),
    duration_minutes: Number(row.duration_minutes ?? 60),
    category: row.category ?? "wellness",
    active: row.active ?? row.is_published ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useProviderServices(): UseProviderServices {
  const { user } = useAuth();
  const profileId = user?.profileId ?? null;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/api/providers/me/services`, { headers });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to load services");
      setServices(((json.data ?? []) as any[]).map(normalise));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (input: ServiceInput): Promise<Service> => {
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/api/providers/services`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: input.title,
          description: input.description ?? null,
          price_rand: input.price_rand,
          duration_minutes: input.duration_minutes,
          category: input.category,
          active: input.active ?? true,
          delivery_mode: input.delivery_mode ?? "in_person",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not create service");
      const created = normalise(json.data);
      setServices(prev => [created, ...prev]);
      return created;
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const update = useCallback(async (id: string, input: Partial<ServiceInput>): Promise<Service> => {
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/api/providers/services/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not update service");
      const next = normalise(json.data);
      setServices(prev => prev.map(s => (s.id === id ? next : s)));
      return next;
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    setSaving(true);
    setError(null);
    // Optimistic — rollback on failure
    const snapshot = services;
    setServices(prev => prev.filter(s => s.id !== id));
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/api/providers/services/${id}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setServices(snapshot);
        throw new Error(json.error ?? "Could not delete service");
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [services]);

  const toggleActive = useCallback(async (id: string, active: boolean): Promise<void> => {
    // Optimistic flip so the toggle switch feels instant.
    const snapshot = services;
    setServices(prev => prev.map(s => (s.id === id ? { ...s, active } : s)));
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/api/providers/services/${id}/toggle-active`, {
        method: "POST",
        headers,
        body: JSON.stringify({ active }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setServices(snapshot);
        throw new Error(json.error ?? "Could not toggle service");
      }
      const next = normalise(json.data);
      setServices(prev => prev.map(s => (s.id === id ? next : s)));
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      throw err;
    }
  }, [services]);

  return { services, loading, saving, error, create, update, remove, toggleActive, refresh };
}
