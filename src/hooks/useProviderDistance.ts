import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from './useGeolocation';
import {
  Provider,
  ProviderWithDistance,
  enrichProvidersWithDistance,
  getNearestProviders,
  getDistanceStatistics,
} from '@/lib/providerGeolocation';

interface UseProviderDistanceOptions {
  radiusKm?: number;
  maxResults?: number;
  autoSort?: boolean;
}

interface UseProviderDistanceResult {
  providers: ProviderWithDistance[];
  isLoading: boolean;
  error: string | null;
  stats: {
    nearestProvider: ProviderWithDistance | null;
    averageDistance: number;
    providersCount: number;
  } | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get providers sorted by user's current location distance
 * Handles geolocation, distance calculations, and sorting
 */
export function useProviderDistance(
  providers: Provider[],
  options: UseProviderDistanceOptions = {}
): UseProviderDistanceResult {
  const { radiusKm = 50, maxResults = 10, autoSort = true } = options;
  const geolocation = useGeolocation();
  const [processedProviders, setProcessedProviders] = useState<ProviderWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const processProviders = useCallback(async () => {
    if (!geolocation.hasCoordinates || !geolocation.coordinates) {
      setProcessedProviders([]);
      setError('Location services not available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (autoSort) {
        // Get nearest providers with distance info
        const nearest = await getNearestProviders(
          providers,
          geolocation.coordinates,
          radiusKm,
          maxResults
        );
        setProcessedProviders(nearest);

        // Get statistics
        const statistics = await getDistanceStatistics(providers, geolocation.coordinates);
        setStats(statistics);
      } else {
        // Just enrich with distance data without filtering/sorting
        const enriched = await enrichProvidersWithDistance(providers, geolocation.coordinates);
        setProcessedProviders(enriched);

        const statistics = await getDistanceStatistics(providers, geolocation.coordinates);
        setStats(statistics);
      }
    } catch (err) {
      console.error('Error processing providers:', err);
      setError('Failed to calculate distances');
    } finally {
      setIsLoading(false);
    }
  }, [providers, geolocation.hasCoordinates, geolocation.coordinates, radiusKm, maxResults, autoSort]);

  // Process when location or providers change
  useEffect(() => {
    if (geolocation.hasCoordinates && providers.length > 0) {
      processProviders();
    }
  }, [geolocation.hasCoordinates, providers.length, processProviders]);

  const refresh = useCallback(async () => {
    geolocation.refreshLocation();
    // Wait a bit for location to refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    await processProviders();
  }, [geolocation, processProviders]);

  return {
    providers: processedProviders,
    isLoading: isLoading || geolocation.isLoading,
    error: error || geolocation.error,
    stats,
    refresh,
  };
}