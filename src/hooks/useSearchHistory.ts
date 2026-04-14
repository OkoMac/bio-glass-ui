import { useState, useCallback, useEffect } from "react";

/**
 * Tracks recent search queries in localStorage (max 10, deduped).
 * Use in SearchBar and Directory search.
 */

const STORAGE_KEY = "bion_search_history";
const MAX_ENTRIES = 10;

function getStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((q: unknown) => typeof q === "string") : [];
  } catch {
    return [];
  }
}

function save(queries: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queries.slice(0, MAX_ENTRIES)));
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(getStored);

  const addSearch = useCallback((query: string) => {
    const q = query.trim();
    if (q.length < 2) return; // ignore too-short queries
    setHistory(prev => {
      const next = [q, ...prev.filter(p => p.toLowerCase() !== q.toLowerCase())].slice(0, MAX_ENTRIES);
      save(next);
      return next;
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    setHistory(prev => {
      const next = prev.filter(p => p !== query);
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setHistory(getStored());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { history, addSearch, removeSearch, clearAll };
}
