/**
 * Geolocation and suburb utilities.
 *
 * Fixes bug #18: after login, providers default to Pretoria because
 * lib/pretoriaSuburbs.ts is Pretoria-only. Non-PTA users get null
 * distance and fall back to default sort.
 *
 * Usage:
 *   import { getDefaultSuburb } from "@/utils/geo";
 *   const suburb = getDefaultSuburb(userProfile);
 */

import type { Profile } from "@/types";

/** Known SA suburb areas with coordinates. Expand as needed. */
const KNOWN_AREAS: Record<string, { lat: number; lng: number }> = {
  // Pretoria / Tshwane
  pretoria:           { lat: -25.7479, lng: 28.2293 },
  centurion:          { lat: -25.8589, lng: 28.1894 },
  hatfield:           { lat: -25.7473, lng: 28.2293 },
  lynnwood:           { lat: -25.7700, lng: 28.2800 },
  menlyn:             { lat: -25.7850, lng: 28.2850 },
  "silver lakes":     { lat: -25.7500, lng: 28.3500 },
  faerie:             { lat: -25.7800, lng: 28.2700 },
  waterkloof:         { lat: -25.7700, lng: 28.2400 },
  brooklyn:           { lat: -25.7650, lng: 28.2450 },
  // Johannesburg
  johannesburg:       { lat: -26.2041, lng: 28.0473 },
  sandton:            { lat: -26.1080, lng: 28.0510 },
  rosebank:           { lat: -26.1430, lng: 28.0410 },
  randburg:           { lat: -26.0930, lng: 28.0020 },
  midrand:            { lat: -25.9960, lng: 28.1260 },
  fourways:           { lat: -26.0240, lng: 28.0040 },
  // Cape Town
  "cape town":        { lat: -33.9249, lng: 18.4241 },
  stellenbosch:       { lat: -33.9375, lng: 18.8600 },
  durbanville:        { lat: -33.8330, lng: 18.6500 },
  // Durban
  durban:             { lat: -29.8587, lng: 31.0218 },
  umhlanga:           { lat: -29.7260, lng: 31.0860 },
  // Other SA cities
  bloemfontein:       { lat: -29.0852, lng: 26.1596 },
  port:               { lat: -33.9608, lng: 25.6020 }, // Port Elizabeth
  east:               { lat: -33.0140, lng: 27.9070 }, // East London
  nelspruit:          { lat: -25.4745, lng: 30.9703 },
  polokwane:          { lat: -23.8962, lng: 29.4486 },
  rustenburg:         { lat: -25.6676, lng: 27.2414 },
};

/** Resolve a user's suburb to coordinates. Returns null if unknown. */
export function resolveSuburb(suburb: string): { lat: number; lng: number } | null {
  const key = suburb.trim().toLowerCase();
  return KNOWN_AREAS[key] ?? null;
}

/**
 * Get the best default suburb for a user.
 * Priority: saved location > browser geolocation > first known area > null.
 */
export function getDefaultSuburb(profile?: Profile | null): string | null {
  // 1. User's saved suburb from profile
  if (profile?.suburb) return profile.suburb;
  if (profile?.city) return profile.city;

  // 2. Browser geolocation (async — caller should handle)
  // Not done here to keep it sync; caller can use navigator.geolocation separately.

  // 3. Fall back to null — let the UI show "Select your location"
  return null;
}

/**
 * Safely sort providers with null distances.
 * Non-PTA users won't get Pretoria as default anymore — they get null,
 * and the UI shows a location picker instead of defaulting incorrectly.
 */
export function sortProvidersByDistance<T extends { distance_km?: number | null }>(
  providers: T[],
): T[] {
  return [...providers].sort((a, b) => {
    if (a.distance_km == null && b.distance_km == null) return 0;
    if (a.distance_km == null) return 1;
    if (b.distance_km == null) return -1;
    return a.distance_km - b.distance_km;
  });
}
