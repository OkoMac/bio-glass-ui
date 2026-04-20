/**
 * Dynamic provider data loader.
 *
 * The two JSON files (Pretoria 622KB + Johannesburg 3MB) are the single biggest
 * contributors to main-chunk size. This module loads them via dynamic import so
 * they split into their own chunks and are only fetched when actually needed.
 *
 * Usage:
 *   const { providers, loading } = useProviderData();        // both cities
 *   const { providers, loading } = useProviderData("pta");   // pretoria only
 */

import { useState, useEffect } from "react";

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

interface ProviderDataState {
  providers: RawProvider[];
  loading: boolean;
}

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
 */
export function useProviderData(city: "pta" | "jhb" | "all" = "all"): ProviderDataState {
  const [providers, setProviders] = useState<RawProvider[]>(
    // Return cached data synchronously if available
    city === "pta" ? (_ptaProviders ?? []) :
    city === "jhb" ? (_jhbProviders ?? []) :
    (_ptaProviders && _jhbProviders ? [..._ptaProviders, ..._jhbProviders] : [])
  );
  const [loading, setLoading] = useState(providers.length === 0);

  useEffect(() => {
    let cancelled = false;
    const loader =
      city === "pta" ? loadPretoriaData() :
      city === "jhb" ? loadJohannesburgData() :
      loadAllProviders();

    loader.then((data) => {
      if (!cancelled) {
        setProviders(data);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [city]);

  return { providers, loading };
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
