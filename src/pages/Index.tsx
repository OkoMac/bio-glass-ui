import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SearchBar from "@/components/SearchBar";
import CategoryChip from "@/components/CategoryChip";
import HeroProviderCard from "@/components/HeroProviderCard";
import ProviderCard from "@/components/ProviderCard";
import BottomNav from "@/components/BottomNav";
import ServeAIChat from "@/components/ServeAIChat";
import { useAuth } from "@/contexts/AuthContext";
import GlassCard from "@/components/GlassCard";
import { Sparkles, MapPin, Navigation, Loader2, AlertCircle } from "lucide-react";
import { getProviderImage, getProviderCover } from "@/lib/providerImages";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useProviderDistance } from "@/hooks/useProviderDistance";

// Import real Pretoria data
import realData from "@/data/bion_pretoria_data.json";

const categories = ["All", "Fitness", "Medical", "Beauty", "Professional", "Free Sessions", "Available Now"];

// Convert real provider data to UI format with addresses for geolocation
const generateRealProviders = () => {
  // Use first 12 real providers for the public directory
  const realProviders = realData.providers.slice(0, 12);
  
  // Map real providers to the UI format with addresses for geolocation
  return realProviders.map((provider, index) => {
    const verticals = ["teal", "indigo", "coral", "amber"] as const;
    
    // Generate next slots (simulated for now)
    const nextSlots = ["Today 3pm", "Tomorrow 9am", "Today 5pm", "Wed 7am", "Thu 4pm", "Fri 10am"];
    
    return {
      id: provider.id,
      name: provider.name,
      specialty: provider.service,
      rating: provider.rating,
      reviews: provider.reviewCount,
      // Distance will be calculated by useProviderDistance hook
      distance: "Calculating...",
      nextSlot: nextSlots[index % nextSlots.length],
      image: getProviderImage(provider.id),
      vertical: verticals[index % verticals.length],
      // Additional fields needed for geolocation
      address: provider.address,
      location: provider.location,
      service: provider.service,
      price: provider.price,
      isFree: provider.price?.includes("Free") || false,
    };
  });
};

const allRealProviders = generateRealProviders();

// Filter providers for different sections
const getHeroProviders = (providers: any[]) => providers.slice(0, 2).map((provider) => ({
  ...provider,
  coverImage: getProviderCover(provider.id),
}));

const getForYouProviders = (providers: any[]) => providers.slice(2, 6);

const getFreeProviders = (providers: any[]) => providers.slice(4, 7).map(provider => ({
  ...provider,
  specialty: `Free Intro — ${provider.specialty}`,
  isFree: true,
}));

const getTodayProviders = (providers: any[]) => providers.filter(p => p.nextSlot?.includes("Today"));

const stagger = {
  container: { transition: { staggerChildren: 0.05 } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const { user } = useAuth();
  const [heroIndex, setHeroIndex] = useState(0);
  
  // Use geolocation hook
  const { coordinates, error: locationError, isLoading: locationLoading } = useGeolocation();
  
  // Use provider distance hook with all providers
  const {
    providers: providersWithDistance,
    isLoading: distanceLoading,
    error: distanceError,
    stats,
    refresh: refreshDistances
  } = useProviderDistance(allRealProviders, {
    radiusKm: 50,
    maxResults: 12,
    autoSort: true,
    userLocation: coordinates || undefined
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Show loading state while getting location or calculating distances
  const isLoading = locationLoading || distanceLoading;
  const hasError = locationError || distanceError;
  
  // Transform providers for ProviderCard component
  // ProviderCard expects distance as string, but geolocation returns distanceFormatted
  const transformProviderForCard = (provider: any) => {
    // If provider has distanceFormatted from geolocation, use it
    if (provider.distanceFormatted && typeof provider.distanceFormatted === 'string') {
      return {
        ...provider,
        distance: provider.distanceFormatted,
      };
    }
    // Otherwise use as-is (with simulated distance string)
    return provider;
  };

  // Use providers with real distances if available, otherwise use simulated
  const displayProviders = providersWithDistance.length > 0 ? 
    providersWithDistance.map(transformProviderForCard) : 
    allRealProviders;
  
  // Get provider lists for different sections
  const heroProviders = getHeroProviders(displayProviders);
  const forYouProviders = getForYouProviders(displayProviders);
  const freeProviders = getFreeProviders(displayProviders);
  const todayProviders = getTodayProviders(displayProviders);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-12 space-y-6">
        {/* Search */}
        <SearchBar />

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[28px] font-bold text-foreground"
        >
          {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"} ☀️
        </motion.h1>

        {/* Location Status */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          {isLoading ? (
            <span className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Finding your location...
            </span>
          ) : hasError ? (
            <span className="text-amber flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Location unavailable - showing Pretoria providers
            </span>
          ) : coordinates ? (
            <span className="text-teal flex items-center gap-2">
              <Navigation className="w-3 h-3" />
              Showing providers near you
              {stats?.nearestDistance && (
                <span className="text-xs text-muted-foreground">
                  (closest: {stats.nearestDistance})
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Enable location for nearby providers
            </span>
          )}
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>

        {/* Hero Carousel */}
        <div className="relative -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory">
            {heroProviders.map((provider) => (
              <div key={provider.id} className="snap-center shrink-0 w-[85%]">
                <HeroProviderCard {...provider} />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {heroProviders.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === heroIndex ? "bg-indigo w-4" : "bg-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ServeAI For You */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet" />
            <h2 className="text-lg font-semibold text-foreground">For You</h2>
            <span className="text-xs text-violet">✦</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
            {forYouProviders.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <ProviderCard {...p} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Free Sessions */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Free Sessions Near You</h2>
            <span className="text-xs text-teal">◦</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
            {freeProviders.map((p, i) => (
              <motion.div
                key={`${p.id}-free`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <ProviderCard {...p} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ServeAI Advisory Card */}
        <GlassCard variant="accent-indigo" className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">ServeAI Insight ✦</p>
              <p className="text-xs text-muted-foreground mt-1">
                {coordinates ? (
                  `Based on your location, we found ${stats?.totalProviders || 0} providers within ${stats?.radiusKm || 50}km.`
                ) : (
                  "Enable location services to see providers near you."
                )}
              </p>
              {hasError && (
                <button 
                  onClick={refreshDistances}
                  className="text-xs text-indigo-light font-medium mt-2"
                >
                  Retry location →
                </button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Available Today */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Open Today</h2>
            <span className="text-xs text-muted-foreground">→</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
            {todayProviders.map((p, i) => (
              <motion.div
                key={`${p.id}-today`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <ProviderCard {...p} />
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
      <ServeAIChat />
    </div>
  );
};

export default Index;