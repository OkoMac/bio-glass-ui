import { useState, useEffect, useCallback } from "react";

interface GeoState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permitted: boolean;
  accuracy: number | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    permitted: false,
    accuracy: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation not supported", loading: false }));
      return;
    }
    setState(s => ({ ...s, loading: true }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          error: null,
          loading: false,
          permitted: true,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setState(s => ({
          ...s,
          error: err.message,
          loading: false,
          permitted: false,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();

    // Also watch for updates (mobile GPS refines over time)
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          error: null,
          loading: false,
          permitted: true,
          accuracy: pos.coords.accuracy,
        });
      },
      () => { /* ignore watch errors — we already have getCurrentPosition fallback */ },
      { enableHighAccuracy: true, maximumAge: 60000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [requestLocation]);

  return { ...state, requestLocation };
}
