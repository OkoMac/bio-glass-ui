import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Dumbbell, Sparkles, Stethoscope, Hand, MapPin, Star,
  ChevronRight, Download, Loader2, Heart,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Provider {
  id: string;
  name: string;
  avatar: string | null;
  suburb: string;
  city: string;
  bio: string;
  category: string;
  rating: number;
  reviewCount: number;
}

interface LandingData {
  hostName: string;
  propertyName: string;
  propertyType: string;
  area: string;
  suburb: string;
  city: string;
  welcomeMessage: string;
  hostGreeting: string;
  providers: Provider[];
}

const QUICK_ACTIONS = [
  { label: "Find a Gym", icon: Dumbbell, category: "fitness", color: "from-indigo-500 to-violet-600" },
  { label: "Book a Spa", icon: Sparkles, category: "beauty", color: "from-pink-500 to-rose-600" },
  { label: "See a Doctor", icon: Stethoscope, category: "medical", color: "from-emerald-500 to-teal-600" },
  { label: "Get a Massage", icon: Hand, category: "wellness", color: "from-amber-500 to-orange-600" },
];

function categoryIcon(cat: string) {
  if (!cat) return null;
  const lower = cat.toLowerCase();
  if (lower.includes("fitness") || lower.includes("gym")) return "💪";
  if (lower.includes("beauty") || lower.includes("spa")) return "✨";
  if (lower.includes("medical") || lower.includes("doctor")) return "🩺";
  if (lower.includes("wellness") || lower.includes("massage")) return "🧘";
  if (lower.includes("vet")) return "🐾";
  return "🏥";
}

export default function GuestLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    fetch(`${API}/api/guest/landing/${code}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setData(res.data);
        else setError(res.error || "Not found");
      })
      .catch(() => setError("Could not load page"))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center text-white p-6">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold mb-2">Code not found</h1>
        <p className="text-white/60 text-center mb-6">This wellness link may have expired or is invalid.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-violet rounded-xl font-semibold"
        >
          Browse BION Directory
        </button>
      </div>
    );
  }

  const suburb = data.suburb || data.city || "";

  return (
    <div className="min-h-screen bg-obsidian text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet/30 via-indigo-900/40 to-obsidian" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMTM5LDkyLDI0NiwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMTM5LDkyLDI0NiwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] opacity-40" />
        <div className="relative px-5 pt-20 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* BION badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-indigo-600 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-wider text-white/80">BION</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
              {data.welcomeMessage}
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              {data.hostGreeting}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-5 -mt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.category}
              onClick={() => navigate(`/directory?category=${action.category}&suburb=${encodeURIComponent(suburb)}`)}
              className="group relative overflow-hidden rounded-2xl p-4 text-left transition-transform active:scale-95"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
              <div className="absolute inset-0 border border-white/10 rounded-2xl" />
              <div className="relative">
                <action.icon className="w-6 h-6 mb-3 text-white" />
                <span className="text-sm font-semibold">{action.label}</span>
              </div>
            </button>
          ))}
        </motion.div>
      </div>

      {/* Nearby Providers */}
      {data.providers.length > 0 && (
        <div className="px-5 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Top near you</h2>
            <button
              onClick={() => navigate(`/directory?suburb=${encodeURIComponent(suburb)}`)}
              className="text-xs text-violet flex items-center gap-1"
            >
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {data.providers.slice(0, 4).map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onClick={() => navigate(`/provider/${p.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-violet/30 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet/30 to-indigo-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">{categoryIcon(p.category)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                    {p.category && <span className="capitalize">{p.category}</span>}
                    {p.suburb && (
                      <>
                        <span className="text-white/20">|</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {p.suburb}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {p.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs flex-shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{p.rating.toFixed(1)}</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Install Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mx-5 mt-8 mb-6 p-5 rounded-2xl bg-gradient-to-br from-violet/20 to-indigo-900/20 border border-violet/20"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet/20 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-violet" />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1">Get the BION app</h3>
            <p className="text-xs text-white/50 mb-3 leading-relaxed">
              Track your wellness, earn BioPoints, and book sessions on the go.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-violet rounded-lg text-xs font-semibold"
            >
              Open BION
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center pb-8 text-[10px] text-white/30">
        Powered by BION &mdash; Africa's health &amp; wellness platform
      </div>
    </div>
  );
}
