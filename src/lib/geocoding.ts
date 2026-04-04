/**
 * Geocoding Service for BION
 * Provides address-to-coordinates conversion using OpenStreetMap Nominatim API
 * No API key required, free to use
 */

export interface ProviderCoordinates {
  providerId: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  accuracy: 'rooftop' | 'range_interpolated' | 'geometric_center' | 'approximate';
  cachedAt: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    county?: string;
  };
  importance: number;
}

interface CachedCoordinates {
  [key: string]: ProviderCoordinates;
}

class GeocodingService {
  private nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  private cache: CachedCoordinates = {};
  private cacheVersion = 1;
  private cacheDuration = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    this.loadCache();
  }

  /**
   * Geocode an address to get coordinates
   * Returns cached result if available and not expired
   */
  async geocodeAddress(
    address: string,
    city: string,
    providerId?: string
  ): Promise<ProviderCoordinates | null> {
    const cacheKey = `${address}|${city}`;

    // Check cache first
    const cached = this.cache[cacheKey];
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    try {
      // Add city to make search more specific
      const searchQuery = `${address}, ${city}, South Africa`;
      
      const response = await fetch(
        `${this.nominatimUrl}?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'BION-Provider-App/1.0'
          }
        }
      );

      if (!response.ok) {
        console.error(`Geocoding API error: ${response.status}`);
        return null;
      }

      const results: NominatimResult[] = await response.json();
      if (results.length === 0) {
        console.warn(`No geocoding results for: ${searchQuery}`);
        return null;
      }

      const result = results[0];
      const coordinates: ProviderCoordinates = {
        providerId: providerId || `${address}|${city}`,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: address,
        city: city,
        country: 'South Africa',
        accuracy: this.getAccuracy(result),
        cachedAt: Date.now(),
      };

      // Cache the result
      this.cache[cacheKey] = coordinates;
      this.saveCache();

      return coordinates;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Batch geocode multiple addresses
   */
  async geocodeBatch(
    addresses: Array<{ address: string; city: string; providerId: string }>
  ): Promise<ProviderCoordinates[]> {
    const results = await Promise.all(
      addresses.map(item =>
        this.geocodeAddress(item.address, item.city, item.providerId)
      )
    );
    return results.filter((r): r is ProviderCoordinates => r !== null);
  }

  /**
   * Get coordinates from cache without API call
   */
  getCachedCoordinates(address: string, city: string): ProviderCoordinates | null {
    const cacheKey = `${address}|${city}`;
    const cached = this.cache[cacheKey];
    
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }
    
    return null;
  }

  /**
   * Get all cached coordinates
   */
  getAllCachedCoordinates(): ProviderCoordinates[] {
    return Object.values(this.cache).filter(item => this.isCacheValid(item));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
    localStorage.removeItem('geocodingCache');
  }

  /**
   * Get accuracy level based on OSM result
   */
  private getAccuracy(result: NominatimResult): 'rooftop' | 'range_interpolated' | 'geometric_center' | 'approximate' {
    // OSM importance values: higher = more precise
    const importance = result.importance || 0;
    
    if (importance > 0.8) return 'rooftop';
    if (importance > 0.6) return 'range_interpolated';
    if (importance > 0.4) return 'geometric_center';
    return 'approximate';
  }

  /**
   * Check if cached entry is still valid
   */
  private isCacheValid(entry: ProviderCoordinates): boolean {
    const age = Date.now() - entry.cachedAt;
    return age < this.cacheDuration;
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    try {
      const cacheData = {
        version: this.cacheVersion,
        data: this.cache,
        timestamp: Date.now(),
      };
      localStorage.setItem('geocodingCache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save geocoding cache:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    try {
      const stored = localStorage.getItem('geocodingCache');
      if (!stored) return;

      const cacheData = JSON.parse(stored);
      
      if (cacheData.version !== this.cacheVersion) {
        console.warn('Cache version mismatch, clearing cache');
        return;
      }

      this.cache = cacheData.data || {};
    } catch (error) {
      console.warn('Failed to load geocoding cache:', error);
    }
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();

/**
 * Hook to use geocoding service
 */
export function useGeocoding() {
  return {
    geocodeAddress: geocodingService.geocodeAddress.bind(geocodingService),
    geocodeBatch: geocodingService.geocodeBatch.bind(geocodingService),
    getCachedCoordinates: geocodingService.getCachedCoordinates.bind(geocodingService),
    getAllCachedCoordinates: geocodingService.getAllCachedCoordinates.bind(geocodingService),
    clearCache: geocodingService.clearCache.bind(geocodingService),
  };
}