/**
 * Provider image URL map.
 * Previously contained 2,445 Google Maps Photo API URLs which cost $91/month.
 * Cleared on 25 April 2026. Providers upload their own photos via Settings.
 * The initials avatar system (providerImages.ts) handles the fallback beautifully.
 */
const providerImageUrls: Record<string, string> = {};
export default providerImageUrls;
