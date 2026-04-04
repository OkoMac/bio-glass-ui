/**
 * Provider Geolocation System for BION
 * Handles distance calculations and location-based provider filtering
 */

import { calculateDistance, formatDistance, getCityCoordinates } from '@/hooks/useGeolocation';
import { geocodingService, ProviderCoordinates } from './geocoding';

export interface Provider {
  id: string;
  name: string;
  location: string;
  address: string;
  service: string;
  rating: number;
  reviewCount: number;
  price: string;
  [key: string]: any;
}

export interface ProviderWithDistance extends Provider {
  distance: number; // in km
  distanceFormatted: string;
  coordinates?: ProviderCoordinates;
}

export interface LocationFilter {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

/**
 * Get provider coordinates - tries exact geocoding, falls back to city coordinates
 */
export async function getProviderCoordinates(
  provider: Provider
): Promise<ProviderCoordinates | null> {
  // Try to get exact address coordinates
  const exactCoords = await geocodingService.geocodeAddress(
    provider.address,
    provider.location,
    provider.id
  );

  if (exactCoords) {
    return exactCoords;
  }

  // Fall back to city center coordinates
  const cityCoords = getCityCoordinates(provider.location);
  if (cityCoords) {
    return {
      providerId: provider.id,
      latitude: cityCoords.latitude,
      longitude: cityCoords.longitude,
      address: provider.address,
      city: provider.location,
      country: 'South Africa',
      accuracy: 'approximate',
      cachedAt: Date.now(),
    };
  }

  return null;
}

/**
 * Calculate distance from user to provider
 */
export async function calculateProviderDistance(
  provider: Provider,
  userLocation: { latitude: number; longitude: number }
): Promise<number | null> {
  const providerCoords = await getProviderCoordinates(provider);
  
  if (!providerCoords) {
    return null;
  }

  return calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    providerCoords.latitude,
    providerCoords.longitude
  );
}

/**
 * Add distance information to providers
 */
export async function enrichProvidersWithDistance(
  providers: Provider[],
  userLocation: { latitude: number; longitude: number }
): Promise<ProviderWithDistance[]> {
  const enriched = await Promise.all(
    providers.map(async (provider) => {
      const distance = await calculateProviderDistance(provider, userLocation);
      
      return {
        ...provider,
        distance: distance ?? 999, // Default to high distance if calculation fails
        distanceFormatted: distance !== null ? formatDistance(distance) : 'Distance unavailable',
      };
    })
  );

  return enriched;
}

/**
 * Filter providers by distance radius
 */
export async function filterProvidersByDistance(
  providers: Provider[],
  userLocation: { latitude: number; longitude: number },
  radiusKm: number = 50
): Promise<ProviderWithDistance[]> {
  const enriched = await enrichProvidersWithDistance(providers, userLocation);
  return enriched.filter(p => p.distance <= radiusKm);
}

/**
 * Sort providers by distance (closest first)
 */
export function sortProvidersByDistance(
  providers: ProviderWithDistance[]
): ProviderWithDistance[] {
  return [...providers].sort((a, b) => a.distance - b.distance);
}

/**
 * Combine filtering and sorting
 */
export async function getNearestProviders(
  providers: Provider[],
  userLocation: { latitude: number; longitude: number },
  radiusKm: number = 50,
  maxResults: number = 10
): Promise<ProviderWithDistance[]> {
  const filtered = await filterProvidersByDistance(providers, userLocation, radiusKm);
  const sorted = sortProvidersByDistance(filtered);
  return sorted.slice(0, maxResults);
}

/**
 * Get provider statistics by distance
 */
export async function getDistanceStatistics(
  providers: Provider[],
  userLocation: { latitude: number; longitude: number }
): Promise<{
  nearestProvider: ProviderWithDistance | null;
  averageDistance: number;
  providersCount: number;
}> {
  const enriched = await enrichProvidersWithDistance(providers, userLocation);
  
  if (enriched.length === 0) {
    return {
      nearestProvider: null,
      averageDistance: 0,
      providersCount: 0,
    };
  }

  const sorted = sortProvidersByDistance(enriched);
  const totalDistance = enriched.reduce((sum, p) => sum + p.distance, 0);

  return {
    nearestProvider: sorted[0],
    averageDistance: Math.round((totalDistance / enriched.length) * 10) / 10,
    providersCount: enriched.length,
  };
}

/**
 * Preload provider coordinates in background
 * Useful for improving performance on initial load
 */
export async function preloadProviderCoordinates(providers: Provider[]): Promise<void> {
  const addresses = providers.map(p => ({
    address: p.address,
    city: p.location,
    providerId: p.id,
  }));

  try {
    await geocodingService.geocodeBatch(addresses);
    console.log(`Preloaded coordinates for ${providers.length} providers`);
  } catch (error) {
    console.error('Error preloading provider coordinates:', error);
  }
}