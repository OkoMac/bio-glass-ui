// Alternative way to load provider data to avoid JSON import issues

// Import the JSON file
import rawData from './bion_pretoria_data.json';

// Type definition for provider
export interface Provider {
  id: string;
  name: string;
  service: string;
  rating: number;
  reviewCount: number;
  location: string;
  price: string;
  availability: string[];
  [key: string]: any; // Allow additional properties
}

// Extract providers from the data structure
export const providers: Provider[] = Array.isArray(rawData.providers) 
  ? (rawData.providers as Provider[] as any)
  : [];

// Helper to categorize providers. Now optionally takes the provider
// name so pet-grooming / kennel businesses with `service: "Beauty"`
// (e.g. Paw Buddies Mobile Grooming, reported 2026-04-28) don't land
// under human beauticians. Pet check runs FIRST so a "Beauty" service
// label can't shadow it.
export function categorize(service: string, name?: string): string {
  const s = (service ?? "").toLowerCase();
  const haystack = `${(name ?? "").toLowerCase()} ${s}`;
  if (/\bpaw\b|\bpet[s]?\b|\b(dog|cat|kitten|puppy)\b|kennel|cattery|grooming.*pet|pet.*grooming|mobile grooming|pet salon/i.test(haystack)) return "veterinary";
  if (/personal training|gym|fitness center|fitness training|fitness assessment|cardio|strength/i.test(s)) return "fitness";
  if (/group fitness|zumba|spin|boxing|martial arts|class/i.test(s)) return "fitness";
  if (/yoga|pilates|meditation|flexibility/i.test(s)) return "yoga";
  if (/crossfit|hiit|sports performance|sports training|senior fitness/i.test(s)) return "fitness";
  if (/hair|barber|stylist|color/i.test(s)) return "hair";
  if (/nail|manicur|pedicur/i.test(s)) return "beauty";
  if (/skin|facial|esthetician|dermatology/i.test(s)) return "beauty";
  if (/makeup|cosmetic|lash|brow|waxing|spa|beauty/i.test(s)) return "beauty";
  if (/doctor|physician|medical|health screening|clinical/i.test(s)) return "medical";
  if (/dentist|dental|teeth/i.test(s)) return "dental";
  if (/physio|physical therapy|posture correction/i.test(s)) return "physio";
  if (/rehabilitation|rehab|sports rehabilitation/i.test(s)) return "rehabilitation";
  if (/chiropractor|dietician|nutrition|weight management|optometry/i.test(s)) return "nutrition";
  if (/massage|bodywork/i.test(s)) return "massage";
  if (/wellness|holistic|therapeutic|preventive/i.test(s)) return "wellness";
  if (/psychology|mental|counsel/i.test(s)) return "mental-health";
  if (/vet|veterinary|animal/i.test(s)) return "veterinary";
  if (/pharmacy|pill/i.test(s)) return "pharmacy";
  if (/maternity|fertility|baby/i.test(s)) return "maternity";
  return "wellness";
}

// Get all providers formatted for the Directory component
export function getAllProviders() {
  return providers.map((p) => ({
    id: p.id,
    name: p.name,
    specialty: p.service,
    category: categorize(p.service),
    rating: typeof p.rating === "string" ? parseFloat(p.rating) || 0 : p.rating,
    reviews: p.reviewCount,
    location: p.location,
    price: p.price,
    availability: p.availability,
    // avatar will be handled by getProviderImage elsewhere
  }));
}

// Get category counts
export function getCategoryCounts() {
  const providers = getAllProviders();
  return providers.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
}

// Get total provider count
export const totalProviders = providers.length;