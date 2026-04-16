/**
 * Programmatic SEO — the city × category combinations we generate landing
 * pages for. Each page lives at /s/<citySlug>/<categorySlug> and targets
 * long-tail Google queries like "GP in Sandton" or "physio in Lynnwood".
 *
 * Kept as a static config so the sitemap + internal-link graph + route
 * rendering all agree on the canonical set.
 */

export interface SeoCity {
  slug: string;
  label: string;
  /** Loose suburb strings that should be matched when filtering providers. */
  suburbs: string[];
}

export interface SeoCategory {
  slug: string;
  label: string;
  /** Case-insensitive keywords that appear in a provider's service / specialty. */
  keywords: string[];
  /** Short noun phrase used in H1 / meta ("a GP", "a physiotherapist"). */
  indefinite: string;
}

export const SEO_CITIES: SeoCity[] = [
  { slug: "pretoria", label: "Pretoria", suburbs: ["Pretoria", "Arcadia", "Brooklyn", "Hatfield", "Lynnwood", "Menlyn", "Menlo Park", "Waverley", "Queenswood", "Lynnwood Ridge"] },
  { slug: "centurion", label: "Centurion", suburbs: ["Centurion", "Lyttelton", "Eldoraigne", "Rooihuiskraal", "Wierda Park"] },
  { slug: "johannesburg", label: "Johannesburg", suburbs: ["Johannesburg", "Rosebank", "Parktown", "Braamfontein", "Melville", "Greenside"] },
  { slug: "sandton", label: "Sandton", suburbs: ["Sandton", "Morningside", "Rivonia", "Bryanston", "Hyde Park", "Benmore"] },
  { slug: "randburg", label: "Randburg", suburbs: ["Randburg", "Fourways", "Ferndale", "Cresta", "Blairgowrie"] },
  { slug: "cape-town", label: "Cape Town", suburbs: ["Cape Town", "Gardens", "Sea Point", "Claremont", "Rondebosch", "Newlands"] },
  { slug: "durban", label: "Durban", suburbs: ["Durban", "Umhlanga", "Morningside", "Berea", "Glenwood"] },
  { slug: "hatfield", label: "Hatfield", suburbs: ["Hatfield"] },
  { slug: "lynnwood", label: "Lynnwood", suburbs: ["Lynnwood", "Lynnwood Ridge", "Menlo Park"] },
  { slug: "waverley", label: "Waverley", suburbs: ["Waverley"] },
];

export const SEO_CATEGORIES: SeoCategory[] = [
  { slug: "gp", label: "GP", keywords: ["gp", "general practitioner", "doctor", "family physician", "medical"], indefinite: "a GP" },
  { slug: "physio", label: "Physio", keywords: ["physio", "physiotherap", "physical therapy"], indefinite: "a physio" },
  { slug: "dentist", label: "Dentist", keywords: ["dentist", "dental", "orthodont"], indefinite: "a dentist" },
  { slug: "chiropractor", label: "Chiropractor", keywords: ["chiropract"], indefinite: "a chiropractor" },
  { slug: "dermatologist", label: "Dermatologist", keywords: ["dermatolog", "skin clinic"], indefinite: "a dermatologist" },
  { slug: "optometrist", label: "Optometrist", keywords: ["optometr", "eye care", "vision"], indefinite: "an optometrist" },
  { slug: "psychologist", label: "Psychologist", keywords: ["psycholog", "psychiatr", "counsel", "mental health"], indefinite: "a psychologist" },
  { slug: "dietician", label: "Dietician", keywords: ["dietic", "nutrition", "dietit"], indefinite: "a dietician" },
  { slug: "hair-salon", label: "Hair Salon", keywords: ["hair salon", "hairdresser", "hair stylist", "hair design"], indefinite: "a hair salon" },
  { slug: "beauty-salon", label: "Beauty Salon", keywords: ["beauty salon", "beauty clinic", "day spa", "aesthetic"], indefinite: "a beauty salon" },
  { slug: "nail-salon", label: "Nail Salon", keywords: ["nail", "manicur", "pedicur"], indefinite: "a nail salon" },
  { slug: "massage", label: "Massage", keywords: ["massage", "bodywork", "reflexolog"], indefinite: "a massage therapist" },
  { slug: "day-spa", label: "Day Spa", keywords: ["spa", "day spa"], indefinite: "a day spa" },
  { slug: "personal-trainer", label: "Personal Trainer", keywords: ["personal train", "fitness coach", "pt "], indefinite: "a personal trainer" },
  { slug: "yoga-studio", label: "Yoga Studio", keywords: ["yoga"], indefinite: "a yoga studio" },
  { slug: "pilates", label: "Pilates", keywords: ["pilates"], indefinite: "a pilates studio" },
  { slug: "crossfit", label: "CrossFit", keywords: ["crossfit", "hiit", "functional fitness"], indefinite: "a CrossFit gym" },
];

export function findCity(slug: string): SeoCity | null {
  return SEO_CITIES.find(c => c.slug === slug) ?? null;
}

export function findCategory(slug: string): SeoCategory | null {
  return SEO_CATEGORIES.find(c => c.slug === slug) ?? null;
}

/** All (city, category) combinations — used for sitemap generation. */
export function allSeoCombinations(): Array<{ city: SeoCity; category: SeoCategory }> {
  const out: Array<{ city: SeoCity; category: SeoCategory }> = [];
  for (const city of SEO_CITIES) {
    for (const category of SEO_CATEGORIES) {
      out.push({ city, category });
    }
  }
  return out;
}
