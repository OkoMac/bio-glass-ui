/**
 * Directory provider loader (API-backed).
 *
 * Previously this module also offered a "JSON mode" that dynamically imported
 * bion_pretoria_data.json (547 KB) and bion_johannesburg_data.json (5.5 MB).
 * That mode caused Vite to emit two giant chunks (data-jhb-*.js at 3.8 MB
 * minified) — every visitor to a directory page paid for them.
 *
 * As of 2026-05-24 the directory API (`GET /api/directory/providers`) is the
 * single source of truth. The dynamic JSON imports were removed so Vite no
 * longer produces the chunks at all. Callers that pinned `useApi: true`
 * before are unaffected; everyone else now goes through the same path.
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Full shape of a directory provider record as served by
 * GET /api/directory/providers and the single-provider endpoint.
 * Optional fields are present on the Google-Places-scraped subset of the
 * directory and absent on the manually-entered subset. Pages that
 * previously cast `(p as any).field` should reference these fields by
 * name instead.
 */
export interface RawProvider {
  // Core identity
  id: string;
  name: string;
  service: string;
  rating: number | string;
  reviewCount?: number;
  review_count?: number;
  location: string;
  price: string;
  availability: string | string[];
  enhanced_category?: string;
  category?: string;
  suburb?: string;
  city?: string;
  // Contact (scraped from Google Places where available)
  phone?: string;
  email?: string;
  website?: string;
  contact?: { email?: string; phone?: string; website?: string };
  address?: string;
  google_place_id?: string;
  business_status?: string;
  opening_hours?: string[];
  // Geocode
  lat?: number;
  lng?: number;
  // Profile detail
  specialization?: string;
  description?: string;
  duration?: string;
  experienceYears?: number;
  qualifications?: string[];
  languages?: string[];
  servicesOffered?: string[];
  imageUrl?: string;
  min_price?: number;
  // UI hint — featured on the home page above the fold
  callout?: boolean;
  // Catch-all so unknown fields don't break callers that index dynamically
  [key: string]: unknown;
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
  /** Legacy flag — API mode is now the only mode. Ignored. */
  useApi?: boolean;
  limit?: number;
  apiBaseUrl?: string;
  /** When true, request the full directory in one response (server still gzips). */
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

// Module-level promise cache for the "fetch all providers" case. Multiple
// pages (Favorites, Index, Routines, etc) call useProviderData("pta", { all:
// true }) — without this cache each mount would trigger its own ~744KB
// gzipped fetch. The cache is keyed on the request URL so cities can be
// requested independently.
const _allFetchCache = new Map<string, Promise<ApiResponse>>();

/**
 * React hook — returns directory providers from the API with loading state.
 * @param city "pta" | "jhb" | "all" (default "all")
 * @param opts Optional pagination config
 */
export function useProviderData(
  city: "pta" | "jhb" | "all" = "all",
  opts?: PaginationOptions,
): ProviderDataState {
  const pageLimit = opts?.limit ?? 50;
  const apiBaseUrl = opts?.apiBaseUrl ?? API;
  const allMode = opts?.all ?? false;

  const [providers, setProviders] = useState<RawProvider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentPageRef = useRef(0);
  const totalPagesRef = useRef(0);

  const fetchApiPage = useCallback(async (page: number): Promise<ApiResponse> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageLimit),
      city,
    });
    if (allMode) params.set("all", "1");

    const url = `${apiBaseUrl}/api/directory/providers?${params}`;

    // For the "all providers" first-page case, share the in-flight request
    // across every mounted component that asks for the same URL. Browser
    // HTTP caching helps repeat requests; this helps the first paint when
    // 3 pages mount at once.
    if (allMode && page === 1) {
      let pending = _allFetchCache.get(url);
      if (!pending) {
        pending = (async () => {
          const res = await fetch(url);
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Directory API error ${res.status}: ${text}`);
          }
          const json = (await res.json()) as ApiResponse;
          if (!json.ok) throw new Error("Directory API returned not ok");
          return json;
        })();
        _allFetchCache.set(url, pending);
        // Drop from cache on failure so the next caller retries.
        pending.catch(() => _allFetchCache.delete(url));
      }
      return pending;
    }

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Directory API error ${res.status}: ${text}`);
    }
    const json = (await res.json()) as ApiResponse;
    if (!json.ok) throw new Error("Directory API returned not ok");
    return json;
  }, [city, pageLimit, apiBaseUrl, allMode]);

  const loadRef = useRef(0);

  useEffect(() => {
    const loadId = ++loadRef.current;
    let cancelled = false;

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
        setProviders([]);
        setTotal(0);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled && loadId === loadRef.current) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [fetchApiPage]);

  const loadMore = useCallback(async () => {
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
  }, [fetchApiPage]);

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

export type { PaginationOptions };
