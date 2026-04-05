import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, SlidersHorizontal, Navigation, Star, Clock, ChevronRight, X } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import ServiceCategoryBlock, { SERVICE_CATEGORIES, type ServiceCategory } from "@/components/ServiceCategoryBlock";
import { useAuth } from "@/contexts/AuthContext";

// Mock nearby providers for demo — will be replaced by DB data
const MOCK_PROVIDERS = [
  { id: "1", name: "Dr. Nkosi Mabena", specialty: "General Practitioner", category: "medical", rating: 4.9, reviews: 312, distance: 0.4, nextSlot: "Today 2pm", avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop" },
  { id: "2", name: "Lisa Dlamini", specialty: "Personal Trainer", category: "fitness", rating: 4.9, reviews: 128, distance: 0.8, nextSlot: "Today 3pm", avatar: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=120&h=120&fit=crop" },
  { id: "3", name: "Sarah Chen", specialty: "Skincare Specialist", category: "beauty", rating: 4.8, reviews: 203, distance: 1.5, nextSlot: "Today 5pm", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop" },
  { id: "4", name: "Dr. Kagiso Sithole", specialty: "Biokineticist", category: "physio", rating: 4.8, reviews: 95, distance: 1.2, nextSlot: "Tomorrow 9am", avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&h=120&fit=crop" },
  { id: "5", name: "Amir Patel", specialty: "Yoga Instructor", category: "yoga", rating: 4.7, reviews: 67, distance: 2.1, nextSlot: "Wed 7am", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop" },
  { id: "6", name: "Thandi Mokoena", specialty: "Hair Stylist", category: "hair", rating: 4.9, reviews: 456, distance: 0.6, nextSlot: "Today 4pm", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop" },
  { id: "7", name: "Dr. Priya Naidoo", specialty: "Psychologist", category: "mental-health", rating: 4.9, reviews: 178, distance: 1.8, nextSlot: "Thu 10am", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop" },
  { id: "8", name: "John Botha", specialty: "Sports Massage", category: "massage", rating: 4.6, reviews: 89, distance: 3.2, nextSlot: "Today 6pm", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop" },
  { id: "9", name: "Dr. Zara Mahomed", specialty: "Dentist", category: "dental", rating: 4.8, reviews: 267, distance: 2.5, nextSlot: "Fri 8am", avatar: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=120&h=120&fit=crop" },
  { id: "10", name: "Naledi Khumalo", specialty: "Nutritionist", category: "nutrition", rating: 4.7, reviews: 134, distance: 1.9, nextSlot: "Tomorrow 2pm", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop" },
];

const FILTER_TABS = ["All", "Nearby", "Top Rated", "Available Now", "Free Intro"];

export default function Directory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const geo = useGeolocation();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return SERVICE_CATEGORIES;
    const q = search.toLowerCase();
    return SERVICE_CATEGORIES.filter(c => c.name.toLowerCase().includes(q));
  }, [search]);

  const categoryProviders = useMemo(() => {
    if (!selectedCategory) return [];
    let providers = MOCK_PROVIDERS.filter(p => p.category === selectedCategory.id);
    if (activeFilter === "Nearby") providers = [...providers].sort((a, b) => a.distance - b.distance);
    if (activeFilter === "Top Rated") providers = [...providers].sort((a, b) => b.rating - a.rating);
    if (activeFilter === "Available Now") providers = providers.filter(p => p.nextSlot?.includes("Today"));
    return providers;
  }, [selectedCategory, activeFilter]);

  const handleCategoryClick = (cat: ServiceCategory) => {
    setSelectedCategory(cat);
    setActiveFilter("All");
  };

  const handleProviderClick = (providerId: string) => {
    if (user) {
      navigate(`/provider/${providerId}`);
    } else {
      navigate("/welcome");
    }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-obsidian/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="w-full px-4 md:px-8 xl:px-12 py-4">
          <div className="flex items-center justify-between mb-4">
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
            >
              BION
            </motion.h1>
            <div className="flex items-center gap-3">
              {geo.permitted && (
                <div className="flex items-center gap-1.5 text-xs text-teal">
                  <Navigation className="w-3 h-3" />
                  <span className="font-data">Pretoria</span>
                </div>
              )}
              {user ? (
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 rounded-pill text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate("/welcome")}
                  className="px-4 py-2 rounded-pill text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta"
                >
                  Sign Up Free
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="glass-1 rounded-pill flex items-center gap-3 px-4 py-3">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services, providers, or specialties..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <div className="w-px h-4 bg-foreground/10" />
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden md:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 xl:px-12 py-6 space-y-8">
        <AnimatePresence mode="wait">
          {selectedCategory ? (
            /* ── Provider Listing for selected category ── */
            <motion.div
              key="providers"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              {/* Back + header */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="glass-1 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-foreground rotate-180" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedCategory.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {categoryProviders.length} providers near you
                  </p>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`shrink-0 rounded-pill px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categoryProviders.map((provider, i) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleProviderClick(provider.id)}
                    className="glass-1 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-white/[0.16] hover:shadow-hover transition-all border border-white/[0.08] group"
                  >
                    <img
                      src={provider.avatar}
                      alt={provider.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{provider.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{provider.specialty}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-amber fill-amber" />
                          <span className="font-data text-foreground">{provider.rating}</span>
                          <span className="text-muted-foreground">({provider.reviews})</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {provider.distance} km
                        </span>
                      </div>
                      {provider.nextSlot && (
                        <div className="flex items-center gap-1 text-xs text-teal mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{provider.nextSlot}</span>
                        </div>
                      )}
                    </div>
                    {!user && (
                      <div className="shrink-0">
                        <span className="text-[10px] text-indigo-light font-medium glass-1 rounded-pill px-2 py-1">
                          Sign up to book
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}

                {categoryProviders.length === 0 && (
                  <div className="col-span-full text-center py-16">
                    <p className="text-muted-foreground text-sm">No providers found for this filter.</p>
                    <button onClick={() => setActiveFilter("All")} className="text-indigo text-sm mt-2">
                      Show all →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ── Category Grid (landing view) ── */
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Hero tagline */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center md:text-left space-y-2"
              >
                <h2 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">
                  Service Provider Directory
                </h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                  <span className="text-teal font-semibold">CURATED.</span>{" "}
                  <span className="text-indigo-light font-semibold">LOCAL.</span>{" "}
                  <span className="text-amber font-semibold">TRUSTED.</span>
                  <span className="ml-2">Browse verified wellness & health professionals near you.</span>
                </p>
              </motion.div>

              {/* GPS prompt */}
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
                    <p className="text-xs text-muted-foreground">
                      Allow GPS to find service providers closest to you
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Category blocks grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-3 md:gap-4">
                {filteredCategories.map((cat, i) => (
                  <ServiceCategoryBlock
                    key={cat.id}
                    category={cat}
                    index={i}
                    onClick={handleCategoryClick}
                  />
                ))}
              </div>

              {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No categories match "{search}"</p>
                </div>
              )}

              {/* Nearby highlights section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal" />
                    <h3 className="text-lg font-semibold text-foreground">Top Rated Near You</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">Pretoria, GP</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {MOCK_PROVIDERS.slice(0, 6).map((provider, i) => (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      onClick={() => handleProviderClick(provider.id)}
                      className="glass-1 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-white/[0.16] hover:shadow-hover transition-all border border-white/[0.08]"
                    >
                      <img
                        src={provider.avatar}
                        alt={provider.name}
                        className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{provider.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{provider.specialty}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-xs">
                            <Star className="w-3 h-3 text-amber fill-amber" />
                            <span className="font-data text-foreground">{provider.rating}</span>
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {provider.distance} km
                          </span>
                          {provider.nextSlot && (
                            <span className="flex items-center gap-1 text-xs text-teal">
                              <Clock className="w-3 h-3" />
                              {provider.nextSlot}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* CTA for signup */}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
