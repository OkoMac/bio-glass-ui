import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, Star, MapPin } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/GlassCard";
import { useFavorites } from "@/hooks/useFavorites";
import realData from "@/data/bion_pretoria_data.json";
import { getProviderImage } from "@/lib/providerImages";

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, toggle, count } = useFavorites();

  const providers = useMemo(() => {
    return realData.providers
      .filter(p => favorites.has(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        image: getProviderImage(p.id, p.name),
        specialty: p.service ?? (p as any).category ?? "",
        rating: typeof p.rating === "string" ? parseFloat(p.rating) || 0 : (p.rating ?? 0),
        location: (p as any).suburb ?? p.location ?? "",
        price: p.price ?? "",
      }));
  }, [favorites]);

  return (
    <div className="min-h-screen bg-obsidian pb-32">
      <div className="max-w-3xl xl:max-w-7xl mx-auto px-4 md:px-8 pt-12 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="glass-2 rounded-full w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Heart className="w-6 h-6 fill-coral text-coral" /> Favorites
            </h1>
            <p className="text-xs text-muted-foreground">{count} provider{count !== 1 ? "s" : ""} saved</p>
          </div>
        </div>

        {providers.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-base font-semibold text-foreground mb-1">No favorites yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tap the heart on any provider profile to save them here for quick access.
            </p>
            <button onClick={() => navigate("/home")}
              className="rounded-pill px-6 py-2.5 gradient-indigo text-sm font-semibold text-primary-foreground">
              Discover providers
            </button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {providers.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard hover className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/provider/${p.id}`)}>
                  <img src={p.image} alt={p.name} className="w-14 h-14 rounded-xl object-cover ring-2 ring-coral/20 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.specialty}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {p.rating > 0 && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Star className="w-3 h-3 text-amber fill-amber" />
                          <span className="text-foreground font-data">{p.rating.toFixed(1)}</span>
                        </span>
                      )}
                      {p.location && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="w-3 h-3" />{p.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
                    className="p-2 glass-1 rounded-full shrink-0"
                    aria-label="Remove from favorites"
                  >
                    <Heart className="w-4 h-4 fill-coral text-coral" />
                  </button>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
