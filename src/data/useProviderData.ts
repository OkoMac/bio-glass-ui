/**
 * Dynamic provider data loader.
 *
 * The two JSON files (Pretoria 622KB + Johannesburg 3MB) are the single biggest
 * contributors to main-chunk size. This module loads them via dynamic import so
 * they split into their own chunks and are only fetched when actually needed.
 *
 * NEW: API-based pagination mode. When enabled, calls GET /api/directory/providers
 * instead of loading the JSON files. Keeps the JSON import as fallback.
 *
 * Usage:
 *   const { providers, loading } = useProviderData();        // both cities (JSON mode)
 *   const { providers, loading } = useProviderData("pta");   // pretoria only
 *
 * For paginated API mode:
 *   const { providers, loading, total, hasMore, loadMore } = useProviderData("all", { useApi: true, limit: 50 });
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface RawProvider {
  id: string;
  name: string;
  service: string;
  rating: number | string;
  reviewCount?: number;
  review_count?: number;
  location: string;
  price: string;
  availability: string[];
  enhanced_category?: string;
  category?: string;
  [key: string]: any;
}

export interface ProviderDataState {
  providers: RawProvider[];
  loading: boolean;
  total: number;
  hasMore: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  error: string | null;
}

interface PaginationOptions {
  useApi?: boolean;
  limit?: number;
  apiBaseUrl?: string;
  all?: boolean;
}

interface ApiResponse {
  ok: boolean;
  data: RawProvider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

// Module-level cache so we only import once
let _ptaProviders: RawProvider[] | null = null;
let _jhbProviders: RawProvider[] | null = null;
let _ptaPromise: Promise<RawProvider[]> | null = null;
let _jhbPromise: Promise<RawProvider[]> | null = null;

export function loadPretoriaData(): Promise<RawProvider[]> {
  if (_ptaProviders) return Promise.resolve(_ptaProviders);
  if (!_ptaPromise) {
    _ptaPromise = import("./bion_pretoria_data.json").then((m) => {
      _ptaProviders = (m.default as any).providers ?? [];
      return _ptaProviders!;
    });
  }
  return _ptaPromise;
}

export function loadJohannesburgData(): Promise<RawProvider[]> {
  if (_jhbProviders) return Promise.resolve(_jhbProviders);
  if (!_jhbPromise) {
    _jhbPromise = import("./bion_johannesburg_data.json").then((m) => {
      _jhbProviders = (m.default as any).providers ?? [];
      return _jhbProviders!;
    });
  }
  return _jhbPromise;
}

export function loadAllProviders(): Promise<RawProvider[]> {
  return Promise.all([loadPretoriaData(), loadJohannesburgData()]).then(
    ([pta, jhb]) => [...pta, ...jhb]
  );
}

/**
 * React hook — returns merged provider data with loading state.
 * @param city "pta" | "jhb" | "all" (default "all")
 * @param opts Optional pagination config
 *
 * In JSON mode (default): returns all providers at once.
 * In API mode (opts.useApi=true): fetches paginated results with loadMore().
 *
 * Uses a single unified state machine so React's Rules of Hooks are never
 * violated by conditional early returns.
 */
export function useProviderData(
  city: "pta" | "jhb" | "all" = "all",
  opts?: PaginationOptions,
): ProviderDataState {
  const useApi = opts?.useApi ?? false;
  const pageLimit = opts?.limit ?? 50;
  const apiBaseUrl = opts?.apiBaseUrl ?? API;
  const allMode = opts?.all ?? false;

  // ── State shared by both modes ──────────────────────
  const [providers, setProviders] = useState<RawProvider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentPageRef = useRef(0);
  const totalPagesRef = useRef(0);

  // ── Fetch function for API mode ─────────────────────
  const fetchApiPage = useCallback(async (page: number) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageLimit),
      city,
    });
    if (allMode) params.set("all", "1");

    const res = await fetch(`${apiBaseUrl}/api/directory/providers?${params}`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Directory API error ${res.status}: ${text}`);
    }

    const json: ApiResponse = await res.json();
    if (!json.ok) {
      throw new Error("Directory API returned not ok");
    }

    return json;
  }, [city, pageLimit, apiBaseUrl, allMode]);

  // ── Load logic ─────────────────────────────────────
  const loadRef = useRef(0);

  useEffect(() => {
    const loadId = ++loadRef.current;
    let cancelled = false;

    if (useApi) {
      // API pagination mode
      setLoading(true);
      setError(null);

      fetchApiPage(1)
        .then((json) => {
          if (cancelled || loadId !== loadRef.current) return;
          setProviders(json.data);
          setTotal(json.total);
          currentPageRef.current = json.page;
          totalPagesRef.current = json.totalPages;
          setHasMore(json.page < json.totalPages);
        })
        .catch((err) => {
          if (cancelled || loadId !== loadRef.current) return;
          setError(err?.message ?? String(err));
          // Fallback: try JSON import on API failure
          loadAllProviders().then((data) => {
            if (cancelled || loadId !== loadRef.current) return;
            setProviders(data);
            setTotal(data.length);
            setHasMore(false);
            setError(null);
            setLoading(false);
          }).catch(() => setLoading(false));
        })
        .finally(() => {
          if (!cancelled && loadId === loadRef.current) setLoading(false);
        });
    } else {
      // Legacy JSON import mode
      const loader =
        city === "pta" ? loadPretoriaData() :
        city === "jhb" ? loadJohannesburgData() :
        loadAllProviders();

      loader.then((data) => {
        if (cancelled || loadId !== loadRef.current) return;
        setProviders(data);
        setTotal(data.length);
        setHasMore(false);
        setLoading(false);
      });
    }

    return () => { cancelled = true; };
  }, [useApi, city, fetchApiPage]);

  // ── loadMore for API mode ──────────────────────────
  const loadMore = useCallback(async () => {
    if (!useApi) return;
    const nextPage = currentPageRef.current + 1;
    if (nextPage > totalPagesRef.current) return;

    setLoadingMore(true);
    try {
      const json = await fetchApiPage(nextPage);
      setProviders((prev) => [...prev, ...json.data]);
      currentPageRef.current = json.page;
      setHasMore(json.page < json.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }, [useApi, fetchApiPage]);

  return {
    providers,
    loading,
    total,
    hasMore,
    loadMore,
    loadingMore,
    error,
  };
}

/**
 * Synchronous access for contexts that already triggered the load.
 * Returns empty array if data hasn't loaded yet.
 */
export function getCachedPretoriaProviders(): RawProvider[] {
  return _ptaProviders ?? [];
}

export function getCachedAllProviders(): RawProvider[] {
  if (_ptaProviders && _jhbProviders) return [..._ptaProviders, ..._jhbProviders];
  return _ptaProviders ?? [];
}

// Re-export for type convenience
export type { PaginationOptions };
