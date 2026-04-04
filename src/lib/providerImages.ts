// Provider Image Mapping System
// Maps provider IDs to image URLs or indices
// This system allows for easy addition of real provider photos later via Supabase Storage

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";
import heroCover1 from "@/assets/hero-cover-1.jpg";
import heroCover2 from "@/assets/hero-cover-2.jpg";

// Placeholder images available
const PLACEHOLDER_IMAGES = [provider1, provider2, provider3, provider4];
const PLACEHOLDER_COVERS = [heroCover1, heroCover2];

// Provider image URL mapping - can be populated with real Supabase URLs
// Format: { "provider_id": "https://url-to-image" }
const PROVIDER_IMAGE_URLS: Record<string, string> = {
  // Example: "provider_arcadia_1": "https://supabase-url/provider-arcadia-1.jpg"
  // Add real provider images here as they're uploaded
};

const PROVIDER_COVER_URLS: Record<string, string> = {
  // Example: "provider_arcadia_1": "https://supabase-url/cover-arcadia-1.jpg"
};

/**
 * Get provider avatar image
 * Returns custom image URL if available, otherwise placeholder
 */
export function getProviderImage(providerId: string): string {
  // Check if custom image URL exists
  if (PROVIDER_IMAGE_URLS[providerId]) {
    return PROVIDER_IMAGE_URLS[providerId];
  }
  
  // Fall back to placeholder based on provider ID hash
  const hashCode = providerId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a; // Convert to 32bit integer
  }, 0);
  
  const imageIndex = Math.abs(hashCode) % PLACEHOLDER_IMAGES.length;
  return PLACEHOLDER_IMAGES[imageIndex];
}

/**
 * Get provider cover/hero image
 * Returns custom image URL if available, otherwise placeholder
 */
export function getProviderCover(providerId: string): string {
  // Check if custom cover URL exists
  if (PROVIDER_COVER_URLS[providerId]) {
    return PROVIDER_COVER_URLS[providerId];
  }
  
  // Fall back to placeholder based on provider ID
  const hashCode = providerId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const coverIndex = Math.abs(hashCode) % PLACEHOLDER_COVERS.length;
  return PLACEHOLDER_COVERS[coverIndex];
}

/**
 * Set provider image URL (for admin/provider profile updates)
 * This would be called when uploading new provider photos
 */
export function setProviderImage(providerId: string, imageUrl: string): void {
  PROVIDER_IMAGE_URLS[providerId] = imageUrl;
}

/**
 * Set provider cover image URL
 */
export function setProviderCover(providerId: string, coverUrl: string): void {
  PROVIDER_COVER_URLS[providerId] = coverUrl;
}

/**
 * Get all placeholder images available
 * Useful for UI previews or testing
 */
export function getPlaceholderImages(): string[] {
  return PLACEHOLDER_IMAGES;
}

/**
 * Check if provider has custom image
 */
export function hasCustomImage(providerId: string): boolean {
  return !!PROVIDER_IMAGE_URLS[providerId];
}

/**
 * Check if provider has custom cover
 */
export function hasCustomCover(providerId: string): boolean {
  return !!PROVIDER_COVER_URLS[providerId];
}

/**
 * Get image statistics (useful for admin dashboard)
 */
export function getImageStats() {
  return {
    totalCustomImages: Object.keys(PROVIDER_IMAGE_URLS).length,
    totalCustomCovers: Object.keys(PROVIDER_COVER_URLS).length,
    totalPlaceholders: PLACEHOLDER_IMAGES.length,
    totalCoverPlaceholders: PLACEHOLDER_COVERS.length,
  };
}
