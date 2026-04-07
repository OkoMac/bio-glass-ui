import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CorporateNav from "@/components/CorporateNav";
import CoachAI from "@/components/CoachAI";
import {
  Search, Briefcase, MapPin, Star, Plus, X, Trash2, CheckCircle,
} from "lucide-react";

interface PreferredProvider {
  id: string;
  provider_id: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  vertical: string;
  image: string;
}

// Mock provider directory for search
const PROVIDER_DIRECTORY = [
  { id: "p1", name: "Dr. Nandi Mthembu",   specialty: "General Practitioner", location: "Cape Town",     rating: 4.9, vertical: "medical",      image: "https://api.dicebear.com/7.x/initials/svg?seed=NM" },
  { id: "p2", name: "Coach Thabo Mokoena",  specialty: "Personal Training",   location: "Johannesburg",  rating: 4.8, vertical: "fitness",      image: "https://api.dicebear.com/7.x/initials/svg?seed=TM" },
  { id: "p3", name: "Zinhle Beauty Studio", specialty: "Aesthetic Treatments", location: "Durban",        rating: 4.7, vertical: "beauty",       image: "https://api.dicebear.com/7.x/initials/svg?seed=ZB" },
  { id: "p4", name: "Dr. Amara Okafor",     specialty: "Physiotherapy",       location: "Pretoria",      rating: 4.9, vertical: "medical",      image: "https://api.dicebear.com/7.x/initials/svg?seed=AO" },
  { id: "p5", name: "FitLife Studios",       specialty: "Group Fitness",       location: "Sandton",       rating: 4.6, vertical: "fitness",      image: "https://api.dicebear.com/7.x/initials/svg?seed=FL" },
  { id: "p6", name: "Wellness Hub SA",       specialty: "Nutrition & Diet",    location: "Stellenbosch",  rating: 4.8, vertical: "professional", image: "https://api.dicebear.com/7.x/initials/svg?seed=WH" },
  { id: "p7", name: "Dr. Sipho Ndlovu",     specialty: "Veterinary Care",     location: "Bloemfontein",  rating: 4.7, vertical: "vet",          image: "https://api.dicebear.com/7.x/initials/svg?seed=SN" },
  { id: "p8", name: "Serenity Spa",          specialty: "Massage & Recovery",  location: "Cape Town",     rating: 4.9, vertical: "beauty",       image: "https://api.dicebear.com/7.x/initials/svg?seed=SS" },
];

const VERTICAL_COLORS: Record<string, string> = {
  fitness: "#0D9488",
  medical: "#1E1B4B",
  beauty: "#F05A28",
  professional: "#334155",
  vet: "#059669",
};

export default function CorporateProviders() {
  const [providers, setProviders] = useState<PreferredProvider[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("bion_corp_providers");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PreferredProvider[];
        setProviders(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  const persistProviders = (list: PreferredProvider[]) => {
    setProviders(list);
    localStorage.setItem("bion_corp_providers", JSON.stringify(list));
  };

  const addProvider = (dir: typeof PROVIDER_DIRECTORY[0]) => {
    if (providers.some(p => p.provider_id === dir.id)) return; // already added
    const newProv: PreferredProvider = {
      id: crypto.randomUUID(),
      provider_id: dir.id,
      name: dir.name,
      specialty: dir.specialty,
      location: dir.location,
      rating: dir.rating,
      vertical: dir.vertical,
      image: dir.image,
    };
    persistProviders([...providers, newProv]);
  };

  const removeProvider = (id: string) => {
    persistProviders(providers.filter(p => p.id !== id));
  };

  const isAdded = (providerId: string) => providers.some(p => p.provider_id === providerId);

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.specialty.toLowerCase().includes(filterQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const searchResults = PROVIDER_DIRECTORY.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-3xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Preferred Providers</h1>
            <p className="text-xs text-muted-foreground">
              {providers.length} provider{providers.length !== 1 ? "s" : ""} approved for your team
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1.5 rounded-pill px-3 py-2 gradient-indigo text-primary-foreground text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" /> Add Provider
          </motion.button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Providers", value: String(providers.length), icon: Briefcase, color: "#0D9488" },
            { label: "Verticals", value: String(new Set(providers.map(p => p.vertical)).size), icon: Star, color: "#6366F1" },
            { label: "Locations", value: String(new Set(providers.map(p => p.location)).size), icon: MapPin, color: "#F59E0B" },
          ].map(k => (
            <GlassCard key={k.label} className="p-3 text-center">
              <k.icon className="w-4 h-4 mx-auto mb-1" style={{ color: k.color }} />
              <p className="text-base font-bold font-data text-foreground">{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Filter */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={filterQuery} onChange={e => setFilterQuery(e.target.value)} placeholder="Search preferred providers..."
            className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none" />
        </div>

        {/* Provider list */}
        <div className="space-y-2">
          {filteredProviders.length === 0 && (
            <GlassCard className="p-8 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No preferred providers yet</p>
              <p className="text-xs text-muted-foreground">
                Add providers from the directory to create your approved list for employees.
              </p>
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setShowSearch(true)}
                className="mt-4 px-4 py-2 gradient-indigo rounded-pill text-xs font-semibold text-primary-foreground inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Browse Providers
              </motion.button>
            </GlassCard>
          )}
          {filteredProviders.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlassCard hover className="p-4">
                <div className="flex items-center gap-3">
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-pill font-medium"
                        style={{ background: `${VERTICAL_COLORS[p.vertical] || "#334155"}20`, color: VERTICAL_COLORS[p.vertical] || "#334155" }}>
                        {p.vertical}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{p.specialty}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{p.location}</span>
                      <Star className="w-3 h-3 text-amber ml-1" />
                      <span className="text-[10px] text-foreground font-data">{p.rating}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeProvider(p.id)}
                    className="p-2 rounded-xl hover:bg-coral/10 transition-all group shrink-0"
                    title="Remove provider"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-coral" />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Provider Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)} className="fixed inset-0 bg-obsidian/70 z-50" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden pb-safe"
              style={{ background: "rgba(14,14,22,0.97)", backdropFilter: "blur(60px)", maxHeight: "85vh" }}>
              <div className="overflow-y-auto" style={{ maxHeight: "85vh" }}>
                <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
                <div className="px-5 pb-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground">Add Provider</h3>
                    <button onClick={() => setShowSearch(false)} className="p-1 rounded-full hover:bg-white/5">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by name, specialty, or location..."
                      autoFocus
                      className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    {searchResults.map((p, i) => {
                      const added = isAdded(p.id);
                      return (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                          <GlassCard className="p-3">
                            <div className="flex items-center gap-3">
                              <img src={p.image} alt={p.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-semibold text-foreground">{p.name}</p>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-pill font-medium"
                                    style={{ background: `${VERTICAL_COLORS[p.vertical] || "#334155"}20`, color: VERTICAL_COLORS[p.vertical] || "#334155" }}>
                                    {p.vertical}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">{p.specialty} · {p.location}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Star className="w-3 h-3 text-amber" />
                                  <span className="text-[10px] text-foreground font-data">{p.rating}</span>
                                </div>
                              </div>
                              <motion.button whileTap={{ scale: 0.9 }}
                                onClick={() => addProvider(p)}
                                disabled={added}
                                className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all flex items-center gap-1 shrink-0 ${
                                  added
                                    ? "glass-accent-teal text-teal cursor-default"
                                    : "gradient-indigo text-primary-foreground"
                                }`}>
                                {added ? <><CheckCircle className="w-3 h-3" /> Added</> : <><Plus className="w-3 h-3" /> Add</>}
                              </motion.button>
                            </div>
                          </GlassCard>
                        </motion.div>
                      );
                    })}
                    {searchResults.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No providers found matching "{searchQuery}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CoachAI />
      <CorporateNav />
    </div>
  );
}
