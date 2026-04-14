import { useEffect, useState, useCallback } from "react";

/**
 * Tracks recently-viewed providers in localStorage (max 20, deduped).
 * Call trackView(providerId) when a provider profile is opened.
 */

const STORAGE_KEY = "bion_recently_viewed_providers";
const MAX_ENTRIES = 20;

function getStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.filter((id: unknown) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function save(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ENTRIES)));
}

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(getStored);

  const trackView = useCallback((providerId: string) => {
    setIds(prev => {
      const next = [providerId, ...prev.filter(id => id !== providerId)].slice(0, MAX_ENTRIES);
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setIds(getStored());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { ids, trackView, clear };
}
