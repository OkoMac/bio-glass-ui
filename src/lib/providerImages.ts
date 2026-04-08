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
  // Hair & Beauty
  hair_gentle_touch: "https://www.thegentletouchco.com/wp-content/uploads/2024/04/Logo_Design_Gentle_Touch-07-2.png",
  mon_gentle_touch: "https://www.thegentletouchco.com/wp-content/uploads/2024/04/Logo_Design_Gentle_Touch-07-2.png",

  // Skincare chains (all Placecol locations)
  beauty_placecol_brooklyn: "https://placecol.com/wp-content/uploads/2020/01/Placecol-Logo.png",
  b_placecol: "https://placecol.com/wp-content/uploads/2020/01/Placecol-Logo.png",

  // Medical centres
  intercare_tramshed: "https://www.intercare.co.za/assets/logo-intercare-color-910a7f26ab1f3e05ee740482e5f7d6431a2ca17a9d7f8cd84779a7498c6fd3bf.svg",
  hat_intercare_tramshed: "https://www.intercare.co.za/assets/logo-intercare-color-910a7f26ab1f3e05ee740482e5f7d6431a2ca17a9d7f8cd84779a7498c6fd3bf.svg",
  lyn_intercare_glen: "https://www.intercare.co.za/assets/logo-intercare-color-910a7f26ab1f3e05ee740482e5f7d6431a2ca17a9d7f8cd84779a7498c6fd3bf.svg",
  cen_intercare_centurion: "https://www.intercare.co.za/assets/logo-intercare-color-910a7f26ab1f3e05ee740482e5f7d6431a2ca17a9d7f8cd84779a7498c6fd3bf.svg",
  pretoria_medical: "https://pretoriamedical.co.za/assets/images/pnmc-logo-trinity-07-01-2017-web-optimized-1400x535-200dpi-png-24-1400x536.png",
  pn_pretoria_medical: "https://pretoriamedical.co.za/assets/images/pnmc-logo-trinity-07-01-2017-web-optimized-1400x535-200dpi-png-24-1400x536.png",
  gp_medihaven: "https://www.medihaven.co.za/sitepad-data/uploads/2022/01/Medi-2.jpg",
  gar_medihaven: "https://www.medihaven.co.za/sitepad-data/uploads/2022/01/Medi-2.jpg",

  // Gyms — Virgin Active (all locations)

  // Gyms — Planet Fitness (all locations)
  fit_pf_arcadia: "https://www.planetfitness.co.za/wp-content/uploads/2023/12/PF-no-icon.png",
  fit_pf_centurion: "https://www.planetfitness.co.za/wp-content/uploads/2023/12/PF-no-icon.png",
  fit_pf_lynnwood: "https://www.planetfitness.co.za/wp-content/uploads/2023/12/PF-no-icon.png",
  fit_pf_montana: "https://www.planetfitness.co.za/wp-content/uploads/2023/12/PF-no-icon.png",
  fit_pf_moreleta: "https://www.planetfitness.co.za/wp-content/uploads/2023/12/PF-no-icon.png",

  // Gyms — Curves (all locations)
  fit_curves_brooklyn: "https://www.curves.com/wp-content/uploads/2020/01/logo-curves.svg",
  fit_curves_olympus: "https://www.curves.com/wp-content/uploads/2020/01/logo-curves.svg",
  fit_curves_lynnwood: "https://www.curves.com/wp-content/uploads/2020/01/logo-curves.svg",
  fit_curves_silverlakes: "https://www.curves.com/wp-content/uploads/2020/01/logo-curves.svg",
  fit_curves_erasmuskloof: "https://www.curves.com/wp-content/uploads/2020/01/logo-curves.svg",

  // Gyms — CrossFit

  // Gyms — Other
  pt_f45_waterkloof: "https://f45training.com/wp-content/uploads/2026/01/F45_Logo_2023_Color-1.png",
  pt_bodytec_mont: "https://bodytec.co.za/wp-content/uploads/2025/05/bodytec-logo_emails.png",

  // Pharmacy chains — Clicks (all locations)

  // Pharmacy — Dischem
  ph_dischem_kol: "https://www.dischem.co.za/api/logo/stores/1/logo.png",

  // Spec Savers (all locations)
  opt_specsavers: "https://www.specsavers.co.za/img/SS-Logo.svg",

  // Sorbet Salon

  // Annique (all locations)
  cen_annique: "https://annique.com/images/thumbs/0000714_logowhite.png",
  mon_annique: "https://annique.com/images/thumbs/0000714_logowhite.png",
  gar_annique_beauty: "https://annique.com/images/thumbs/0000714_logowhite.png",

  // Peermed
  hat_peermed: "https://peermed.co.za/wp-content/uploads/2023/06/Peermed-Header2-2.png",
  gp_peermed: "https://peermed.co.za/wp-content/uploads/2023/06/Peermed-Header2-2.png",

  // Natural Life health shops
  ph_natural_life: "https://naturallife.co.za/cdn/shop/files/Natural_life_logo_300x300.png?v=1613716170",
  lyn_lynnwood_health: "https://naturallife.co.za/cdn/shop/files/Natural_life_logo_300x300.png?v=1613716170",

  // Mediclinic

  // RingPharm pharmacies (all locations)

  // Optometrists — Vision Works

  // Centuriomed medical centre

  // Viva Gym

  // Individual practitioner photos (scraped from their websites)
  dentist_ade_meyer: "https://images.squarespace-cdn.com/content/v1/5cc6bdcb809d8e4f8ac8a61f/1560423368271-GIX5V93AA6JNHOKOJRDD/Dr-Ade-Meyer.png",
  fg_dr_ade_dent: "https://images.squarespace-cdn.com/content/v1/5cc6bdcb809d8e4f8ac8a61f/1560423368271-GIX5V93AA6JNHOKOJRDD/Dr-Ade-Meyer.png",

  // Dr Trudi Nel — practice logo
  brk_trudi_psych: "https://trudinel.weebly.com/uploads/1/2/5/0/125046761/published/trudi-website-logo-2_6.png?1556093350",
  psych_trudi: "https://trudinel.weebly.com/uploads/1/2/5/0/125046761/published/trudi-website-logo-2_6.png?1556093350",

  // Visser & Ball Physio team photos
  sl_badenhorst_physio: "https://visserandball.co.za/wp-content/uploads/2025/04/Nadia-April2025-825x1024.jpg",
  physio_badenhorst: "https://visserandball.co.za/wp-content/uploads/2025/04/Nadia-April2025-825x1024.jpg",

  // Renee Badenhorst Physio
  physio_carla: "https://reneebadenhorstphysio.wordpress.com/wp-content/uploads/2014/11/cropped-renee-badenhorst-wordress-header.jpg",
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
