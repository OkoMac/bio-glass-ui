import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Star, MapPin } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface SpotlightProvider {
  id: string;
  provider_id: string;
  position: string;
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    suburb: string | null;
    city: string | null;
    specialty: string | null;
  };
}

export default function SpotlightSection() {
  const navigate = useNavigate();
  const [spotlights, setSpotlights] = useState<SpotlightProvider[]>([]);

  useEffect(() => {
    fetch(`${API}/api/spotlight/active`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.data?.length > 0) {
          setSpotlights(res.data.slice(0, 5));
        }
      })
      .catch((err) => console.warn("[SpotlightSection] <unknown> failed:", err?.message));
  }, []);

  if (spotlights.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber" />
        <h3 className="text-sm font-semibold text-foreground">Featured Providers</h3>
        <span className="px-1.5 py-0.5 rounded-pill text-[9px] font-bold bg-amber/20 text-amber border border-amber/30">
          SPOTLIGHT
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {spotlights.map((s, i) => {
          const profile = s.profiles;
          const name = profile?.full_name ?? "Featured Provider";
          const avatar = profile?.avatar_url;
          const location = profile?.suburb || profile?.city || "";

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/provider/${s.provider_id}`)}
              className="shrink-0 w-48 cursor-pointer rounded-2xl border-2 border-amber/30 bg-gradient-to-br from-amber/5 to-amber/10 p-3 hover:border-amber/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover ring-2 ring-amber/30" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber/20 flex items-center justify-center ring-2 ring-amber/30">
                    <Star className="w-4 h-4 text-amber" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                  {location && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                      <MapPin className="w-2.5 h-2.5 shrink-0" /> {location}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded-pill text-[9px] font-bold bg-amber/20 text-amber">
                  Featured
                </span>
                {profile?.specialty && (
                  <span className="text-[9px] text-muted-foreground truncate">
                    {profile.specialty}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
