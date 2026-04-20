import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, SlidersHorizontal, Navigation, Star, Clock, ChevronRight, X, Plus, Lock } from "lucide-react";
import BookingRequestForm from "@/components/BookingRequestForm";
import { useGeolocation } from "@/hooks/useGeolocation";
import ServiceCategoryBlock, { SERVICE_CATEGORIES, type ServiceCategory } from "@/components/ServiceCategoryBlock";
import { useAuth } from "@/contexts/AuthContext";
import AdBanner from "@/components/AdBanner";
import { useHabitProfile } from "@/hooks/useHabits";
import { getProviderImage, hasCustomImage } from "@/lib/providerImages";
import realData from "@/data/bion_pretoria_data.json";
import jhbData from "@/data/bion_johannesburg_data.json";

// ── Map scraped providers to categories ─────────────
function categorize(service: string): string {
  const s = service.toLowerCase();
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

// ── Build provider list from real scraped data (Pretoria + Johannesburg) ──────
const mergedProviders = [...realData.providers, ...(jhbData as any).providers];
const ALL_PROVIDERS = mergedProviders
  .map((p: any) => ({
    id: p.id,
    name: p.name,
    specialty: p.service,
    category: p.enhanced_category || p.category || categorize(p.service),
    rating: typeof p.rating === "string" ? parseFloat(p.rating) || 0 : p.rating,
    reviews: p.reviewCount || p.review_count || 0,
    location: p.location,
    suburb: p.suburb || p.enhanced_suburb || "",
    city: p.city || p.enhanced_city || "",
    price: p.price,
    availability: p.availability,
    avatar: (p as any).imageUrl || getProviderImage(p.id, p.name),
    hasLogo: !!(p as any).imageUrl || hasCustomImage(p.id),
    lat: p.lat ?? null,
    lng: p.lng ?? null,
  }));

// ── Add counts to categories ────────────────────────
const catCounts = ALL_PROVIDERS.reduce<Record<string, number>>((acc, p) => {
  acc[p.category] = (acc[p.category] ?? 0) + 1;
  return acc;
}, {});

const CATEGORIES_WITH_COUNTS = SERVICE_CATEGORIES.map((c) => ({
  ...c,
  count: catCounts[c.id] ?? 0,
}));

const FILTER_TABS = ["All", "Top Rated", "Nearby", "Available Now"];

/** Haversine distance in km between two GPS points. */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get unique suburbs sorted alphabetically. */
const ALL_SUBURBS = [...new Set(ALL_PROVIDERS.map(p => p.suburb).filter(Boolean))].sort();
const ALL_CITIES = [...new Set(ALL_PROVIDERS.map(p => p.city).filter(Boolean))].sort();

/** Reverse geocode GPS coordinates via OpenStreetMap Nominatim (free). */
function useReverseGeo(lat: number | null, lng: number | null) {
  const [label, setLabel] = useState<string>("");
  useEffect(() => {
    if (!lat || !lng) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`, {
      headers: { "User-Agent": "BION Health bionhealth.co.za" },
    })
      .then(r => r.json())
      .then(d => {
        const addr = d?.address ?? {};
        setLabel(addr.suburb || addr.city_district || addr.city || addr.town || "Near you");
      })
      .catch(() => setLabel("Near you"));
  }, [lat, lng]);
  return label;
}

export default function Directory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const geo = useGeolocation();
  const userSuburb = useReverseGeo(geo.latitude, geo.longitude);

  // Auto-snap to suburb center when GPS resolves
  const hasSnapped = useRef(false);
  useEffect(() => {
    if (hasSnapped.current || manualLocation || !userSuburb || !geo.latitude) return;
    const match = ALL_PROVIDERS.find(p => p.suburb === userSuburb && p.lat && p.lng);
    if (match) {
      hasSnapped.current = true;
      const loc = { lat: match.lat!, lng: match.lng!, name: userSuburb };
      setManualLocation(loc);
      try { localStorage.setItem("bion_user_location", JSON.stringify(loc)); } catch {}
    }
  }, [userSuburb, geo.latitude]); // eslint-disable-line react-hooks/exhaustive-deps
  const { profile: habitProfile } = useHabitProfile();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Nearby");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSuburb, setSelectedSuburb] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState<{lat:number;lng:number;name:string}|null>(() => {
    try {
      const saved = localStorage.getItem("bion_user_location");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    const withProviders = CATEGORIES_WITH_COUNTS.filter(c => (c.count ?? 0) > 0);
    if (!search.trim()) return withProviders;
    const q = search.toLowerCase();
    return withProviders.filter(c => c.name.toLowerCase().includes(q));
  }, [search]);

  // Filter + sort providers based on selected category, filter tab, suburb, city
  const filteredProviders = useMemo(() => {
    let list = selectedCategoryId
      ? ALL_PROVIDERS.filter((p) => p.category === selectedCategoryId)
      : ALL_PROVIDERS;

    // Suburb filter
    if (selectedSuburb) {
      list = list.filter((p) => p.suburb === selectedSuburb);
    }
    // City filter
    if (selectedCity) {
      list = list.filter((p) => p.city === selectedCity);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.specialty.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || (p.suburb || "").toLowerCase().includes(q),
      );
    }

    // Tab filter
    if (activeFilter === "Top Rated") {
      list = [...list].sort((a, b) => b.rating - a.rating);
    } else if (activeFilter === "Available Now") {
      list = list.filter((p) => /weekday|daily|today/i.test(p.availability ?? ""));
    } else if (activeFilter === "Nearby" || activeFilter === "All") {
      const uLat = manualLocation?.lat ?? geo.latitude;
      const uLng = manualLocation?.lng ?? geo.longitude;
      if (uLat && uLng) {
        // Sort by distance, then by hasPhoto within same distance band (5km buckets)
        list = [...list].sort((a, b) => {
          const distA = a.lat && a.lng ? distanceKm(uLat, uLng, a.lat, a.lng) : 9999;
          const distB = b.lat && b.lng ? distanceKm(uLat, uLng, b.lat, b.lng) : 9999;
          // Group into 5km bands — within each band, photos first
          const bandA = Math.floor(distA / 5);
          const bandB = Math.floor(distB / 5);
          if (bandA !== bandB) return bandA - bandB;
          // Same distance band: photos first, then by rating
          if (a.hasLogo !== b.hasLogo) return b.hasLogo ? 1 : -1;
          return b.rating - a.rating;
        });
      } else {
        // No location — photos first, then by rating
        list = [...list].sort((a, b) => {
          if (a.hasLogo !== b.hasLogo) return b.hasLogo ? 1 : -1;
          return b.rating - a.rating;
        });
      }
    }

    // Personalise by the user's top engaged categories (from habits). When the
    // user hasn't picked a specific category, boost providers that match their
    // most-used verticals. No-op for new users with no habit signal.
    if (!selectedCategoryId && habitProfile?.top_categories?.length) {
      const catWeight: Record<string, number> = {};
      habitProfile.top_categories.forEach((c: any, idx: number) => {
        catWeight[c.category.toLowerCase()] = (5 - idx) * (c.count ?? 1);
      });
      const score = (p: typeof list[number]) => {
        const hay = `${p.specialty ?? ""} ${p.category ?? ""}`.toLowerCase();
        let s = p.rating;
        for (const [key, weight] of Object.entries(catWeight)) {
          if (hay.includes(key)) s += weight;
        }
        return s;
      };
      list = [...list].sort((a, b) => score(b) - score(a));
    }

    return list;
  }, [selectedCategoryId, search, activeFilter, habitProfile, selectedSuburb, selectedCity, geo.latitude, geo.longitude, manualLocation]);

  const displayProviders = useMemo(() => filteredProviders.slice(0, visibleCount), [filteredProviders, visibleCount]);
  const hasMore = visibleCount < filteredProviders.length;

  const selectedCat = CATEGORIES_WITH_COUNTS.find((c) => c.id === selectedCategoryId);

  const handleCategoryClick = (cat: ServiceCategory) => {
    setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id);
    setActiveFilter("All");
    setVisibleCount(12);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleProviderClick = (providerId: string) => {
    navigate(`/provider/${providerId}`);
  };

  // SEO: structured data for local business directory
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Health, Wellness & Beauty Providers in South Africa",
      description: "Browse 853+ verified providers on BION — South Africa's health and wellness marketplace.",
      numberOfItems: ALL_PROVIDERS.length,
      itemListElement: ALL_PROVIDERS.slice(0, 10).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LocalBusiness",
          name: p.name,
          description: `${p.service} in ${p.location}`,
          address: { "@type": "PostalAddress", addressLocality: p.location, addressCountry: "ZA" },
          aggregateRating: p.rating > 0 ? { "@type": "AggregateRating", ratingValue: p.rating, ratingCount: p.reviewCount || 1, bestRating: 5 } : undefined,
          url: `https://bionhealth.co.za/provider/${p.id}`,
        },
      })),
    });
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [ALL_PROVIDERS]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      {/* ── Sticky header ────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-obsidian/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="w-full px-4 md:px-8 xl:px-12 py-3">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <img src="/bion-logo-white-sm.png" alt="BION" className="h-14 md:h-20 w-auto" />
            </motion.div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="flex items-center gap-1.5 text-xs text-teal hover:text-teal/80 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                <span className="font-data">{manualLocation?.name || "Near you"}</span>
                <span className="text-[9px] text-muted-foreground underline">change</span>
              </button>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Hi, {user.name?.split(" ")[0]}</span>
                  <button onClick={() => navigate("/home")} className="px-3 py-1.5 md:px-4 md:py-2 rounded-pill text-[11px] md:text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta">
                    Dashboard
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => navigate("/welcome")} className="px-2.5 py-1 rounded-pill text-[10px] font-medium glass-2 text-foreground hover:bg-white/[0.08] transition-colors">
                    Log In
                  </button>
                  <button onClick={() => navigate("/welcome")} className="px-2.5 py-1 rounded-pill text-[10px] font-semibold gradient-indigo text-primary-foreground shadow-cta">
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Location picker — prominent on first visit */}
          <AnimatePresence>
            {showLocationPicker && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                <div className={`rounded-2xl p-4 mt-2 space-y-3 ${!manualLocation ? "border-2 border-teal/40 bg-teal/5" : "glass-1"}`}>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal" /> {manualLocation ? "Change your location" : "Set your location for better results"}
                  </p>
                  <div className="flex items-center gap-2 glass-1 rounded-pill px-3 py-2">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Type your suburb name..."
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      autoFocus
                    />
                    {manualLocation && (
                      <button onClick={() => { setManualLocation(null); setShowLocationPicker(false); setLocationSearch(""); try { localStorage.removeItem("bion_user_location"); } catch {} }} className="text-[10px] text-coral">
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto scrollbar-none">
                    {ALL_SUBURBS
                      .filter(s => !locationSearch || s.toLowerCase().includes(locationSearch.toLowerCase()))
                      .slice(0, 40)
                      .map(suburb => {
                        const provider = ALL_PROVIDERS.find(p => p.suburb === suburb && p.lat && p.lng);
                        return (
                          <button
                            key={suburb}
                            onClick={() => {
                              if (provider) {
                                const loc = { lat: provider.lat!, lng: provider.lng!, name: suburb };
                                setManualLocation(loc);
                                try { localStorage.setItem("bion_user_location", JSON.stringify(loc)); } catch {}
                              }
                              setShowLocationPicker(false);
                              setLocationSearch("");
                              setActiveFilter("Nearby");
                              setVisibleCount(12);
                            }}
                            className={`rounded-pill px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                              manualLocation?.name === suburb ? "border-teal/40 bg-teal/20 text-teal" : "border-white/[0.06] text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {suburb}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search bar */}
          <div className="glass-1 rounded-pill flex items-center gap-3 px-4 py-3">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services, providers, or specialties..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <div className="w-px h-4 bg-foreground/10" />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${showFilters || selectedSuburb || selectedCity ? "text-indigo font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden md:inline">Filters</span>
              {(selectedSuburb || selectedCity) && <span className="w-1.5 h-1.5 rounded-full bg-indigo" />}
            </button>
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-1 rounded-2xl p-4 space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">Filter by location</p>
                    {(selectedSuburb || selectedCity) && (
                      <button onClick={() => { setSelectedSuburb(null); setSelectedCity(null); }} className="text-[10px] text-indigo">
                        Clear filters
                      </button>
                    )}
                  </div>

                  {/* City filter */}
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">City</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_CITIES.map(city => (
                        <button
                          key={city}
                          onClick={() => { setSelectedCity(selectedCity === city ? null : city); setSelectedSuburb(null); setVisibleCount(12); }}
                          className={`rounded-pill px-3 py-1 text-[11px] font-medium border transition-colors ${
                            selectedCity === city ? "border-indigo/40 bg-indigo/20 text-indigo" : "border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suburb filter — shows suburbs for selected city, or all */}
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Suburb {selectedCity ? `in ${selectedCity}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-none">
                      {ALL_SUBURBS
                        .filter(s => !selectedCity || ALL_PROVIDERS.some(p => p.suburb === s && p.city === selectedCity))
                        .map(suburb => (
                          <button
                            key={suburb}
                            onClick={() => { setSelectedSuburb(selectedSuburb === suburb ? null : suburb); setVisibleCount(12); }}
                            className={`rounded-pill px-2.5 py-0.5 text-[10px] font-medium border transition-colors ${
                              selectedSuburb === suburb ? "border-teal/40 bg-teal/20 text-teal" : "border-white/[0.06] bg-white/[0.02] text-muted-foreground"
                            }`}
                          >
                            {suburb}
                          </button>
                        ))}
                    </div>
                  </div>

                  {geo.latitude && (
                    <p className="text-[10px] text-teal flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> GPS active — "Nearby" tab sorts by distance from you
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 xl:px-12">
        <AdBanner slot="directory-top" format="horizontal" />
      </div>

      {/* ── Hero Banner ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full h-[280px] md:h-[360px] overflow-hidden"
      >
        <img
          src="/banner-wellness.jpg"
          alt="Beauty Health & Wellness"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight"
            style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
          >
            Beauty, Health<br />& Wellness
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm md:text-base text-white/80 mt-4 max-w-md"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
          >
            {ALL_PROVIDERS.length} verified professionals near you
          </motion.p>
        </div>
      </motion.div>

      <div className="w-full px-4 md:px-8 xl:px-12 py-6 space-y-8">

        {/* ── GPS prompt ─────────────────────────────── */}
        {!geo.permitted && !geo.loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-accent-teal rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
            onClick={geo.requestLocation}
          >
            <div className="w-10 h-10 rounded-xl gradient-teal flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 text-obsidian" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Enable location</p>
              <p className="text-xs text-muted-foreground">Allow GPS to find service providers closest to you</p>
            </div>
          </motion.div>
        )}

        {/* ── Provider List (top — filters by category click) ── */}
        <section ref={listRef}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber fill-amber" />
              <h3 className="text-lg font-semibold text-foreground">
                {selectedCat ? selectedCat.name : "Top Rated Near You"}
              </h3>
              {selectedCat && (
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className="ml-2 text-xs text-muted-foreground glass-1 rounded-pill px-2 py-0.5 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{displayProviders.length} providers</span>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`shrink-0 rounded-pill px-3 py-2.5 md:py-1.5 text-[11px] md:text-xs font-medium transition-all whitespace-nowrap ${
                  activeFilter === tab
                    ? "gradient-indigo text-primary-foreground shadow-cta"
                    : "glass-1 text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Provider cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategoryId}-${activeFilter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
            >
              {displayProviders.map((provider, i) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleProviderClick(provider.id)}
                  className="glass-1 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:border-white/[0.16] hover:shadow-hover transition-all border border-white/[0.08]"
                >
                  <img
                    src={provider.avatar}
                    alt={provider.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10 shrink-0 bg-white/5"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = getProviderImage("fallback_" + provider.id, provider.name); }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{provider.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{provider.specialty}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 text-amber fill-amber" />
                        <span className="font-data text-foreground">{provider.rating}</span>
                        <span className="text-muted-foreground">({provider.reviews})</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{provider.location}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{provider.price}</p>
                    <span className="text-[10px] text-teal mt-0.5">View profile →</span>
                  </div>
                </motion.div>
              ))}

              {displayProviders.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-sm">No providers found.</p>
                  <button onClick={() => { setSelectedCategoryId(null); setSearch(""); setVisibleCount(12); }} className="text-indigo text-sm mt-2">
                    Clear filters →
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setVisibleCount((c) => c + 12)}
                className="px-8 py-3 rounded-pill glass-2 text-sm font-medium text-foreground hover:bg-white/[0.08] transition-all"
              >
                Load more ({filteredProviders.length - visibleCount} remaining)
              </motion.button>
            </div>
          )}

          {!hasMore && displayProviders.length > 0 && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              Showing all {filteredProviders.length} providers
              {!user && " · Sign up to view contact details and book"}
            </p>
          )}
        </section>

        {/* ── Category Blocks Grid ───────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-foreground">Browse Services</h3>
            <span className="text-xs text-muted-foreground">({ALL_PROVIDERS.length} providers)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 md:gap-3">
            {filteredCategories.map((cat, i) => (
              <ServiceCategoryBlock
                key={cat.id}
                category={cat}
                index={i}
                onClick={handleCategoryClick}
              />
            ))}
          </div>
        </section>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories match "{search}"</p>
          </div>
        )}

        {/* ── Browse by city (SEO internal links) ───── */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3">Popular searches</h3>
          <div className="flex flex-wrap gap-2">
            {[
              ["pretoria", "gp", "GP in Pretoria"],
              ["sandton", "physio", "Physio in Sandton"],
              ["centurion", "dentist", "Dentist in Centurion"],
              ["randburg", "personal-trainer", "PT in Randburg"],
              ["johannesburg", "dermatologist", "Dermatologist in Joburg"],
              ["cape-town", "yoga-studio", "Yoga in Cape Town"],
              ["durban", "beauty-salon", "Beauty Salon in Durban"],
              ["hatfield", "psychologist", "Psychologist in Hatfield"],
              ["lynnwood", "dietician", "Dietician in Lynnwood"],
              ["waverley", "gp", "GP in Waverley"],
              ["pretoria", "massage", "Massage in Pretoria"],
              ["sandton", "pilates", "Pilates in Sandton"],
            ].map(([city, cat, label]) => (
              <a key={`${city}-${cat}`} href={`/s/${city}/${cat}`}
                className="glass-1 rounded-pill px-3 py-1.5 text-[11px] text-foreground hover:bg-white/[0.06] transition-colors">
                {label}
              </a>
            ))}
          </div>
        </section>

        {/* ── CTA for signup ─────────────────────────── */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-accent-indigo rounded-2xl p-6 text-center space-y-3"
          >
            <h3 className="text-lg font-bold text-foreground">Ready to book?</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Sign up for free to view booking details, compare providers, and book your first session.
            </p>
            <button
              onClick={() => navigate("/welcome")}
              className="rounded-pill px-8 py-3 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
            >
              Get Started — It's Free
            </button>
          </motion.div>
        )}
      </div>

      {/* Floating "Can't find provider?" button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowBookingForm(true)}
        className="fixed bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 px-4 md:px-5 py-3 rounded-pill gradient-indigo text-primary-foreground shadow-cta text-[11px] md:text-sm font-semibold"
      >
        <Plus className="w-4 h-4" />
        Can't find your provider?
      </motion.button>

      {/* Booking request form modal */}
      <AnimatePresence>
        {showBookingForm && (
          <BookingRequestForm onClose={() => setShowBookingForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
