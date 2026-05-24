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

    const res = await fetch(`${apiBaseUrl}/api/directory/providers?${params}`);
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
