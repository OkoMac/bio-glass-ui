/**
 * Pretoria suburb approximate coordinates for distance-based sorting.
 * Covers the main suburbs where BION providers are located.
 */

const SUBURBS: Record<string, [number, number]> = {
  // [latitude, longitude]
  "arcadia": [-25.7461, 28.2125],
  "brooklyn": [-25.7698, 28.2340],
  "centurion": [-25.8603, 28.1894],
  "clubview": [-25.8491, 28.1832],
  "garsfontein": [-25.7945, 28.2960],
  "groenkloof": [-25.7830, 28.2098],
  "hatfield": [-25.7521, 28.2370],
  "irene": [-25.8792, 28.2199],
  "lyttelton": [-25.8350, 28.2008],
  "lynnwood": [-25.7650, 28.2730],
  "menlo park": [-25.7763, 28.2620],
  "montana": [-25.7015, 28.2420],
  "moreleta park": [-25.8236, 28.3186],
  "muckleneuk": [-25.7640, 28.2250],
  "newlands": [-25.7470, 28.2360],
  "pretoria central": [-25.7479, 28.2293],
  "pretoria east": [-25.7850, 28.2950],
  "pretoria north": [-25.7050, 28.2050],
  "pretoria west": [-25.7500, 28.1750],
  "rietondale": [-25.7320, 28.2320],
  "riviera": [-25.7350, 28.2250],
  "sandton": [-26.1076, 28.0567],
  "sinoville": [-25.6980, 28.2320],
  "sunnyside": [-25.7530, 28.2200],
  "the willows": [-25.7370, 28.3050],
  "waterkloof": [-25.7850, 28.2460],
  "waverley": [-25.7630, 28.2530],
  "wonderboom": [-25.6800, 28.2050],
};

/** Haversine distance in km between two lat/lng points */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get approximate distance in km from user to a suburb. Returns null if suburb unknown. */
export function distanceToSuburb(
  userLat: number,
  userLng: number,
  suburbOrLocation: string,
): number | null {
  const key = suburbOrLocation.toLowerCase()
    .replace(/,?\s*pretoria.*$/i, "")
    .replace(/,?\s*gauteng.*$/i, "")
    .trim();

  const coords = SUBURBS[key];
  if (!coords) return null;
  return Math.round(haversineKm(userLat, userLng, coords[0], coords[1]) * 10) / 10;
}
