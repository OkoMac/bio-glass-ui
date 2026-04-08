import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SearchBar from "@/components/SearchBar";
import CategoryChip from "@/components/CategoryChip";
import BottomNav from "@/components/BottomNav";
import ServeAIChat from "@/components/ServeAIChat";
import { useAuth } from "@/contexts/AuthContext";
import GlassCard from "@/components/GlassCard";
import { Sparkles, MapPin, Star, Clock, Search as SearchIcon } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import realData from "@/data/bion_pretoria_data.json";
import { getProviderImage } from "@/lib/providerImages";

const categories = ["All", "Fitness", "Medical", "Beauty", "Professional", "Free Sessions", "Available Now"];

function categoryToVertical(cat: string): "indigo" | "teal" | "coral" | "amber" {
  const lower = cat.toLowerCase();
  if (["gym", "fitness center", "fitness studio", "yoga studio", "yoga instructor", "dance studio", "health club"].includes(lower)) return "teal";
  if (["gp", "doctor", "medical clinic", "dental clinic", "dentist", "optometrist", "eye care", "healthcare", "chiropractor", "chiropractic", "physiotherapy", "physical therapy"].includes(lower)) return "indigo";
  if (["beauty salon", "beauty clinic", "hair salon", "hairdresser", "barber", "hair stylist", "nail salon", "nail technician", "makeup artist", "bridal makeup", "spa", "day spa", "dog grooming"].includes(lower)) return "coral";
  return "amber";
}

const PROVIDERS = realData.providers
  .slice()
  .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  .slice(0, 6)
  .map(p => ({
    id: p.id,
    name: p.name,
    specialty: p.service ?? p.category ?? "",
    rating: p.rating ?? 0,
    distance: p.suburb ?? p.location ?? "",
    nextSlot: typeof p.availability === "string" ? p.availability : "Available",
    avatar: getProviderImage(p.id, p.name),
    vertical: categoryToVertical(p.category ?? ""),
  }));

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const { user } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-12 space-y-6">
        <SearchBar />

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[28px] md:text-3xl font-bold text-foreground"
        >
          {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"}
        </motion.h1>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          {geo.permitted ? (
            <span className="text-teal text-xs">Showing providers near you</span>
          ) : (
            <button onClick={geo.requestLocation} className="text-xs text-amber">
              Enable location for nearby providers
            </button>
          )}
        </div>

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

        {/* For You */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet" />
            <h2 className="text-lg font-semibold text-foreground">For You</h2>
          </div>
          {PROVIDERS.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <SearchIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No providers to show yet</p>
              <p className="text-xs text-muted-foreground">Browse the directory to find providers near you.</p>
              <button onClick={() => navigate("/directory")} className="mt-3 text-xs text-indigo-light font-medium">
                Browse directory →
              </button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {PROVIDERS.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  onClick={() => navigate(`/provider/${p.id}`)}
                  className="glass-1 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-white/[0.16] hover:shadow-hover transition-all border border-white/[0.08]"
                >
                  <img src={p.avatar} alt={p.name} className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{p.specialty}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 text-amber fill-amber" />
                        <span className="font-data text-foreground">{p.rating}</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {p.distance}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-teal">
                        <Clock className="w-3 h-3" /> {p.nextSlot}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ServeAI Advisory */}
        <GlassCard variant="accent-indigo" className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">ServeAI Insight</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on your goals, we recommend adding a yoga session to balance your training routine.
              </p>
              <button onClick={() => navigate("/directory")} className="text-xs text-indigo-light font-medium mt-2">
                Browse directory →
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      <BottomNav />
      <ServeAIChat />
    </div>
  );
};

export default Index;
