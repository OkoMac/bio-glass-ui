import { useState, useEffect, useCallback } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeolocationState {
  coordinates: Coordinates | null;
  error: string | null;
  isLoading: boolean;
  accuracy: number | null;
  timestamp: number | null;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * React hook for accessing the user's geolocation
 * Provides coordinates, error state, and loading status
 */
export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    isLoading: true,
    accuracy: null,
    timestamp: null,
  });

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
  } = options;

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState({
      coordinates: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      error: null,
      isLoading: false,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Unable to retrieve your location';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location services.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        isLoading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, handleError]);

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return () => {};
    }

    const watchId = navigator.geolocation.watchPosition(
      updatePosition,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, handleError]);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const refreshLocation = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    ...state,
    refreshLocation,
    watchLocation,
    hasCoordinates: !!state.coordinates,
  };
}

/**
 * Calculate distance between two coordinates in kilometers
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters}m`;
  }
  return `${km}km`;
}

/**
 * Get approximate coordinates for a city in South Africa
 * Used as fallback when exact coordinates aren't available
 */
export function getCityCoordinates(city: string): Coordinates | null {
  const cityCoordinates: Record<string, Coordinates> = {
    'pretoria': { latitude: -25.7479, longitude: 28.2293 },
    'johannesburg': { latitude: -26.2041, longitude: 28.0473 },
    'cape town': { latitude: -33.9249, longitude: 18.4241 },
    'durban': { latitude: -29.8587, longitude: 31.0218 },
    'bloemfontein': { latitude: -29.0852, longitude: 26.1596 },
    'port elizabeth': { latitude: -33.9608, longitude: 25.6022 },
    'east london': { latitude: -33.0292, longitude: 27.8546 },
    'kimberley': { latitude: -28.7282, longitude: 24.7499 },
    'polokwane': { latitude: -23.9045, longitude: 29.4689 },
    'nelspruit': { latitude: -25.4745, longitude: 30.9703 },
    'arcadia': { latitude: -25.7439, longitude: 28.2100 }, // Pretoria suburb
    'sandton': { latitude: -26.1076, longitude: 28.0567 }, // Johannesburg suburb
    'stellenbosch': { latitude: -33.9321, longitude: 18.8602 },
  };

  const normalizedCity = city.toLowerCase().trim();
  return cityCoordinates[normalizedCity] || null;
}