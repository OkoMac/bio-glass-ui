import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Favorite providers system — localStorage-backed.
 * Provides add, remove, toggle, and check methods.
 */

const STORAGE_KEY = "bion_favorite_providers";

function getStoredFavorites(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveFavorites(userId: string, favs: Set<string>): void {
  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(Array.from(favs)));
}

export function useFavorites() {
  const { user } = useAuth();
  const userId = user?.id ?? user?.profileId ?? "guest";
  const [favorites, setFavorites] = useState<Set<string>>(() => getStoredFavorites(userId));

  // Sync on user change
  useEffect(() => {
    setFavorites(getStoredFavorites(userId));
  }, [userId]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEY}_${userId}`) {
        setFavorites(getStoredFavorites(userId));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [userId]);

  const toggle = useCallback((providerId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      saveFavorites(userId, next);
      return next;
    });
  }, [userId]);

  const add = useCallback((providerId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.add(providerId);
      saveFavorites(userId, next);
      return next;
    });
  }, [userId]);

  const remove = useCallback((providerId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(providerId);
      saveFavorites(userId, next);
      return next;
    });
  }, [userId]);

  const isFavorite = useCallback((providerId: string) => favorites.has(providerId), [favorites]);

  return { favorites, toggle, add, remove, isFavorite, count: favorites.size };
}
