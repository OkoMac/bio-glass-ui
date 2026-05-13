/**
 * Provider Image System
 * Generates SVG initials avatars for providers without photos.
 * The large PROVIDER_IMAGE_URLS map (~1MB) is loaded lazily on first call.
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

// ── Lazy-loaded URL map ──────────────────────────────────────────────────────
// The actual URL data (~1MB) lives in providerImageUrlsData.ts and is loaded
// asynchronously. Until it resolves, getProviderImage returns initials avatars.
let _urlMap: Record<string, string> | null = null;
let _urlMapPromise: Promise<Record<string, string>> | null = null;

function loadUrlMap(): Promise<Record<string, string>> {
  if (_urlMap) return Promise.resolve(_urlMap) as any;
  if (!_urlMapPromise) {
    _urlMapPromise = import("./providerImageUrlsData").then((m: any) => {
      _urlMap = m.PROVIDER_IMAGE_URLS;
      return _urlMap;
    }) as any;
  }
  return _urlMapPromise as any;
}

// Kick off the load immediately (non-blocking) so it's likely ready by the time
// the first component renders provider cards.
loadUrlMap();

// ── Utility functions ────────────────────────────────────────────────────────

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  // Strip emoji and non-ASCII symbols to avoid lone surrogates that break encodeURIComponent
  const clean = name.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u200D\uFE0F]/gu, "").trim();
  const parts = (clean || name).trim().split(/\s+/).filter(p => p.length > 0);
  if (parts.length >= 2) {
    const first = parts[0][0] ?? "?";
    const last = parts[parts.length - 1][0] ?? "?";
    // Guard against lone surrogates
    if (first.charCodeAt(0) > 0xD7FF || last.charCodeAt(0) > 0xD7FF) return "??";
    return (first + last).toUpperCase();
  }
  const ch = parts[0]?.[0] ?? "?";
  if (ch.charCodeAt(0) > 0xD7FF) return "?";
  return ch.toUpperCase();
}

function generateInitialsAvatar(name: string, id: string): string {
  const initials = getInitials(name);
  const colorIdx = hashString(id) % AVATAR_COLORS.length;
  const { bg, fg } = AVATAR_COLORS[colorIdx];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="24" fill="${bg}"/>
    <text x="60" y="60" text-anchor="middle" dominant-baseline="central" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-weight="600" font-size="42" fill="${fg}">${initials}</text>
  </svg>`;

  try {
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  } catch {
    // Fallback for any remaining encoding issues
    return `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="24" fill="${bg}"/><text x="60" y="60" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-weight="600" font-size="42" fill="${fg}">?</text></svg>')}`;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Get provider avatar — real URL if available (after async load), otherwise initials SVG.
 * This is synchronous so it always returns a valid image string.
 */
export function getProviderImage(providerId: string, providerName?: string): string {
  if (_urlMap && _urlMap[providerId]) {
    return _urlMap[providerId];
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
  try {
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  } catch {
    return `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="#0A0A0F"/></svg>')}`;
  }
}

export function setProviderImage(providerId: string, imageUrl: string): void {
  if (!_urlMap) _urlMap = {};
  _urlMap[providerId] = imageUrl;
}

export function hasCustomImage(providerId: string): boolean {
  return !!(_urlMap && _urlMap[providerId]);
}

/**
 * Ensure the URL map is loaded. Call this in components that need accurate
 * hasCustomImage checks (e.g., Directory hero images).
 */
export function ensureImageMapLoaded(): Promise<Record<string, string>> {
  return loadUrlMap();
}
