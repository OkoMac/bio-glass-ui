import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Favorite providers system — localStorage + Supabase backed.
 * localStorage is the fast cache; Supabase is the source of truth.
 *
 * Optimistic updates are rolled back on server write failure so the user
 * sees a consistent state (the heart icon won't stay on if RLS rejects
 * the write).
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
  // Ref to capture the set before each optimistic mutation, so we can rollback
  const prevRef = useRef<Set<string> | null>(null);

  // Load from Supabase on mount (merge with localStorage)
  useEffect(() => {
    const local = getStoredFavorites(profileId);
    setFavorites(local);

    if (!isReal) return;
    supabase.from("favourites")
      .select("provider_id")
      .eq("profile_id", profileId)
      .then(({ data, error }: any) => {
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

  const rollback = useCallback((providerId: string) => {
    setFavorites(prev => {
      const restored = new Set(prev);
      // If the optimistic add put it in, remove it; if optimistic remove took it out, add it back
      if (prevRef.current) {
        const wasFav = prevRef.current.has(providerId);
        // prevRef.current is what it was before the optimistic update
        // So just restore to that snapshot
        return new Set(prevRef.current);
      }
      return prev;
    });
    saveFavoritesLocal(profileId, new Set(favorites));
  }, [profileId, favorites]);

  // Helper: sync a mutation to Supabase with rollback on failure
  const syncToSupabase = useCallback(async (
    providerId: string,
    action: "add" | "remove",
  ) => {
    if (!isReal) return;
    const { error } = action === "add"
      ? await supabase.from("favourites").upsert(
          { profile_id: profileId, provider_id: providerId },
          { onConflict: "profile_id,provider_id" },
        )
      : await supabase.from("favourites")
          .delete()
          .eq("profile_id", profileId)
          .eq("provider_id", providerId);

    if (error) {
      console.error(`[favorites] ${action} failed:`, error.message);
      // Rollback: restore the set to before the optimistic update
      setFavorites(prev => prevRef.current ? new Set(prevRef.current) : prev);
      saveFavoritesLocal(profileId, prevRef.current ?? favorites);
      toast.error(
        action === "add" ? "Couldn't add to favorites" : "Couldn't remove from favorites",
        { description: error.message },
      );
    }
  }, [profileId, isReal, favorites]);

  const toggle = useCallback((providerId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      const adding = !next.has(providerId);
      // Snapshot for rollback
      prevRef.current = new Set(prev);
      if (adding) next.add(providerId);
      else next.delete(providerId);
      saveFavoritesLocal(profileId, next);
      syncToSupabase(providerId, adding ? "add" : "remove");
      return next;
    });
  }, [profileId, isReal, syncToSupabase]);

  const add = useCallback((providerId: string) => {
    setFavorites(prev => {
      if (prev.has(providerId)) return prev; // already a favorite
      prevRef.current = new Set(prev);
      const next = new Set(prev);
      next.add(providerId);
      saveFavoritesLocal(profileId, next);
      syncToSupabase(providerId, "add");
      return next;
    });
  }, [profileId, isReal, syncToSupabase]);

  const remove = useCallback((providerId: string) => {
    setFavorites(prev => {
      if (!prev.has(providerId)) return prev; // not a favorite
      prevRef.current = new Set(prev);
      const next = new Set(prev);
      next.delete(providerId);
      saveFavoritesLocal(profileId, next);
      syncToSupabase(providerId, "remove");
      return next;
    });
  }, [profileId, isReal, syncToSupabase]);

  const isFavorite = useCallback((providerId: string) => favorites.has(providerId), [favorites]);

  return { favorites, toggle, add, remove, isFavorite, count: favorites.size };
}
