import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Zap, Clock, MapPin, Search } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import BookingSheet from "@/components/BookingSheet";
import GlassCard from "@/components/GlassCard";
import realData from "@/data/bion_pretoria_data.json";
import { getProviderImage } from "@/lib/providerImages";

function categoryToVertical(cat: string): "teal" | "coral" | "indigo" | "amber" {
  const lower = cat.toLowerCase();
  if (["gym", "fitness center", "fitness studio", "yoga studio", "yoga instructor", "dance studio", "health club"].includes(lower)) return "teal";
  if (["gp", "doctor", "medical clinic", "dental clinic", "dentist", "optometrist", "eye care", "healthcare", "chiropractor", "chiropractic", "physiotherapy", "physical therapy"].includes(lower)) return "indigo";
  if (["beauty salon", "beauty clinic", "hair salon", "hairdresser", "barber", "hair stylist", "nail salon", "nail technician", "makeup artist", "bridal makeup", "spa", "day spa", "dog grooming"].includes(lower)) return "coral";
  return "amber";
}

const ALL_AVAILABLE = realData.providers
  .filter(p => {
    const avail = typeof p.availability === "string" ? p.availability : "";
    return /weekday|weekend|daily|by appointment/i.test(avail);
  })
  .map(p => ({
    id: p.id,
    name: p.name,
    specialty: p.service ?? (p as any).category ?? "",
    nextSlot: typeof p.availability === "string" ? p.availability : "Available",
    distance: (p as any).suburb ?? p.location ?? "",
    rating: p.rating ?? 0,
    image: getProviderImage(p.id, p.name),
    vertical: categoryToVertical(p.category ?? ""),
    services: (p.servicesOffered ?? []).map(s => ({
      name: s,
      duration: p.duration ?? "60 min",
      price: p.price ?? "Contact",
    })),
  }));

const VERTICAL_ACCENT: Record<string, string> = {
  teal:   "bg-[rgba(13,148,136,0.12)] text-teal  border-teal/20",
  coral:  "bg-[rgba(240,90,40,0.12)]  text-coral border-coral/20",
  indigo: "bg-[rgba(99,102,241,0.12)] text-indigo border-indigo/20",
  amber:  "bg-[rgba(245,158,11,0.12)] text-amber  border-amber/20",
};

export default function QuickBook() {
  const [selectedProvider, setSelectedProvider] = useState<typeof ALL_AVAILABLE[number] | null>(null);
  const [prompt, setPrompt] = useState("");
  const [search, setSearch] = useState("");

  const AVAILABLE_NOW = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? ALL_AVAILABLE.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.specialty.toLowerCase().includes(q) ||
          p.services.some(s => s.name.toLowerCase().includes(q))
        )
      : ALL_AVAILABLE;
    return filtered.slice(0, 20);
  }, [search]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="max-w-lg mx-auto px-4 pt-12 space-y-5">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full gradient-indigo flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white"/>
            </div>
            <h1 className="text-[22px] font-bold text-foreground">Quick Book</h1>
          </div>
          <p className="text-xs text-muted-foreground">Available providers right now · Book in 30 seconds</p>
        </div>

        {/* ServeAI prompt */}
        <GlassCard className="p-3 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-violet shrink-0"/>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder='Try "yoga near me" or "facial today"…'
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {prompt && (
            <button onClick={() => setPrompt("")} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5"/>
            </button>
          )}
        </GlassCard>

        {/* Search filter */}
        <div className="glass-1 rounded-full px-4 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or service..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5"/>
            </button>
          )}
        </div>

        {/* Available now list */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse"/>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Today</p>
          </div>

          {AVAILABLE_NOW.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No providers available right now</p>
              <p className="text-xs text-muted-foreground">
                Search for providers in the directory to find and book sessions.
              </p>
            </GlassCard>
          ) : (
            <motion.div className="space-y-2.5" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 }}}}>
              {AVAILABLE_NOW.map(provider => (
                <motion.div
                  key={provider.id}
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GlassCard
                    className="p-3.5 cursor-pointer hover:border-white/10 transition-all"
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{provider.name}</p>
                            <p className="text-xs text-muted-foreground">{provider.specialty}</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${VERTICAL_ACCENT[provider.vertical]}`}>
                            {provider.rating}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-teal">
                            <Clock className="w-2.5 h-2.5"/>{provider.nextSlot}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="w-2.5 h-2.5"/>{provider.distance}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold gradient-teal text-white"
                      >
                        Book
                      </motion.button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* BookingSheet */}
      <AnimatePresence>
        {selectedProvider && (
          <BookingSheet
            open={true}
            onClose={() => setSelectedProvider(null)}
            provider={selectedProvider}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
