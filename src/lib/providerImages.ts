/**
 * Provider Image System
 * Generates SVG initials avatars for providers without photos.
 * When real images are uploaded to Supabase Storage, add URLs to PROVIDER_IMAGE_URLS.
 */

// Accent colors from the BION design system
const AVATAR_COLORS = [
  { bg: "#6366F1", fg: "#fff" }, // indigo
  { bg: "#2DD4BF", fg: "#0A0A0F" }, // teal
  { bg: "#FB7185", fg: "#fff" }, // coral
  { bg: "#FBBF24", fg: "#0A0A0F" }, // amber
  { bg: "#A78BFA", fg: "#fff" }, // violet
  { bg: "#10B981", fg: "#fff" }, // emerald
  { bg: "#F43F5E", fg: "#fff" }, // rose
  { bg: "#3B82F6", fg: "#fff" }, // blue
];

// Real provider logos/images scraped from their websites
const PROVIDER_IMAGE_URLS: Record<string, string> = {
  hair_gentle_touch: "https://www.thegentletouchco.com/wp-content/uploads/2024/04/Logo_Design_Gentle_Touch-07-2.png",
  intercare_tramshed: "https://www.intercare.co.za/assets/logo-intercare-color-910a7f26ab1f3e05ee740482e5f7d6431a2ca17a9d7f8cd84779a7498c6fd3bf.svg",
  pretoria_medical: "https://pretoriamedical.co.za/assets/images/pnmc-logo-trinity-07-01-2017-web-optimized-1400x535-200dpi-png-24-1400x536.png",
  beauty_placecol_brooklyn: "https://placecol.com/wp-content/uploads/2020/01/Placecol-Logo.png",
  gp_medihaven: "https://www.medihaven.co.za/sitepad-data/uploads/2022/01/Medi-2.jpg",
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] || "?").toUpperCase();
}

function generateInitialsAvatar(name: string, id: string): string {
  const initials = getInitials(name);
  const colorIdx = hashString(id) % AVATAR_COLORS.length;
  const { bg, fg } = AVATAR_COLORS[colorIdx];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="24" fill="${bg}"/>
    <text x="60" y="60" text-anchor="middle" dominant-baseline="central" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="600" font-size="42" fill="${fg}">${initials}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Get provider avatar — real URL if uploaded, otherwise initials SVG
 */
export function getProviderImage(providerId: string, providerName?: string): string {
  if (PROVIDER_IMAGE_URLS[providerId]) {
    return PROVIDER_IMAGE_URLS[providerId];
  }
  return generateInitialsAvatar(providerName ?? providerId, providerId);
}

/**
 * Get provider cover image — gradient fallback
 */
export function getProviderCover(providerId: string): string {
  const colorIdx = hashString(providerId) % AVATAR_COLORS.length;
  const { bg } = AVATAR_COLORS[colorIdx];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg}" stop-opacity="0.6"/><stop offset="100%" stop-color="#0A0A0F"/></linearGradient></defs>
    <rect width="800" height="400" fill="url(#g)"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function setProviderImage(providerId: string, imageUrl: string): void {
  PROVIDER_IMAGE_URLS[providerId] = imageUrl;
}

export function hasCustomImage(providerId: string): boolean {
  return !!PROVIDER_IMAGE_URLS[providerId];
}
