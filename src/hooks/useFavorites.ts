import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Favorite providers system — localStorage + Supabase backed.
 * localStorage is the fast cache; Supabase is the source of truth.
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

function saveFavoritesLocal(userId: string, favs: Set<string>): void {
  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(Array.from(favs)));
}

export function useFavorites() {
  const { user } = useAuth();
  const profileId = user?.profileId ?? "guest";
  const isReal = !!user?.profileId && !user.id?.startsWith("demo_");
  const [favorites, setFavorites] = useState<Set<string>>(() => getStoredFavorites(profileId));

  // Load from Supabase on mount (merge with localStorage)
  useEffect(() => {
    const local = getStoredFavorites(profileId);
    setFavorites(local);

    if (!isReal) return;
    supabase.from("favourites")
      .select("provider_id")
      .eq("profile_id", profileId)
      .then(({ data, error }) => {
        if (error) { console.error("[favorites] load failed:", error.message); return; }
        if (!data || data.length === 0) return;
        const merged = new Set(local);
        data.forEach((r: any) => { if (r.provider_id) merged.add(r.provider_id); });
        setFavorites(merged);
        saveFavoritesLocal(profileId, merged);
      });
  }, [profileId, isReal]);

  // Listen for changes from other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEY}_${profileId}`) {
        setFavorites(getStoredFavorites(profileId));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [profileId]);

  const toggle = useCallback((providerId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      const adding = !next.has(providerId);
      if (adding) next.add(providerId);
      else next.delete(providerId);
      saveFavoritesLocal(profileId, next);

      // Sync to Supabase (fire-and-forget — but log errors loud, was
      // a silent .then(() => {}) which would have hidden any schema or
      // RLS drift exactly like the favourites code did with sleep/water).
      if (isReal) {
        if (adding) {
          supabase.from("favourites").upsert(
            { profile_id: profileId, provider_id: providerId },
            { onConflict: "profile_id,provider_id" },
          ).then(({ error }) => { if (error) console.error("[favorites] add failed:", error.message); });
        } else {
          supabase.from("favourites")
            .delete()
            .eq("profile_id", profileId)
            .eq("provider_id", providerId)
            .then(({ error }) => { if (error) console.error("[favorites] remove failed:", error.message); });
        }
      }
      return next;
    });
  }, [profileId, isReal]);

  const add = useCallback((providerId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.add(providerId);
      saveFavoritesLocal(profileId, next);
      if (isReal) {
        supabase.from("favourites").upsert(
          { profile_id: profileId, provider_id: providerId },
          { onConflict: "profile_id,provider_id" },
        ).then(({ error }) => { if (error) console.error("[favorites] add failed:", error.message); });
      }
      return next;
    });
  }, [profileId, isReal]);

  const remove = useCallback((providerId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(providerId);
      saveFavoritesLocal(profileId, next);
      if (isReal) {
        supabase.from("favourites")
          .delete()
          .eq("profile_id", profileId)
          .eq("provider_id", providerId)
          .then(({ error }) => { if (error) console.error("[favorites] remove failed:", error.message); });
      }
      return next;
    });
  }, [profileId, isReal]);

  const isFavorite = useCallback((providerId: string) => favorites.has(providerId), [favorites]);

  return { favorites, toggle, add, remove, isFavorite, count: favorites.size };
}
