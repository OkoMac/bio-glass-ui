import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SearchBar from "@/components/SearchBar";
import CategoryChip from "@/components/CategoryChip";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import GlassCard from "@/components/GlassCard";
import {
  Sparkles, MapPin, Star, Clock, Search as SearchIcon,
  Utensils, Calendar as CalendarIcon, BarChart3, Dumbbell,
  Droplets, Moon, HeartPulse, Activity
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import realData from "@/data/bion_pretoria_data.json";
import { getProviderImage, hasCustomImage } from "@/lib/providerImages";

const categories = ["All", "Fitness", "Medical", "Beauty", "Professional", "Free Sessions", "Available Now"];

function categoryToVertical(cat: string): "indigo" | "teal" | "coral" | "amber" {
  const lower = cat.toLowerCase();
  if (["gym", "fitness center", "fitness studio", "yoga studio", "yoga instructor", "dance studio", "health club"].includes(lower)) return "teal";
  if (["gp", "doctor", "medical clinic", "dental clinic", "dentist", "optometrist", "eye care", "healthcare", "chiropractor", "chiropractic", "physiotherapy", "physical therapy"].includes(lower)) return "indigo";
  if (["beauty salon", "beauty clinic", "hair salon", "hairdresser", "barber", "hair stylist", "nail salon", "nail technician", "makeup artist", "bridal makeup", "spa", "day spa", "dog grooming"].includes(lower)) return "coral";
  return "amber";
}

function categorizeService(service: string): string {
  const s = service.toLowerCase();
  if (/fitness|train|gym|yoga|pilates|crossfit|boot camp|spinning|zumba|dance|martial|ems|f45/i.test(s)) return "Fitness";
  if (/doctor|physician|medical|gp|general pract|centre|center|hospital|nursing|paediatrician/i.test(s)) return "Medical";
  if (/hair|beauty|nail|skin|facial|laser|aesthetic|spa|massage|lash|brow|waxing/i.test(s)) return "Beauty";
  if (/dentist|dental|teeth|smile/i.test(s)) return "Medical";
  if (/physio|chiro|rehab|biokin/i.test(s)) return "Medical";
  if (/psycho|mental|counsel|therapy|coach/i.test(s)) return "Professional";
  if (/nutrition|diet|weight|slim/i.test(s)) return "Professional";
  if (/pharmacy|apteek|health shop|optom|optic|eye|vision/i.test(s)) return "Medical";
  if (/vet|animal/i.test(s)) return "Professional";
  return "Professional";
}

const ALL_HOME_PROVIDERS = realData.providers
  .slice()
  .sort((a, b) => {
    const aLogo = hasCustomImage(a.id) ? 1 : 0;
    const bLogo = hasCustomImage(b.id) ? 1 : 0;
    if (bLogo !== aLogo) return bLogo - aLogo;
    return (b.rating ?? 0) - (a.rating ?? 0);
  })
  .map(p => ({
    id: p.id,
    name: p.name,
    specialty: p.service ?? (p as any).category ?? "",
    rating: p.rating ?? 0,
    distance: (p as any).suburb ?? p.location ?? "",
    nextSlot: typeof p.availability === "string" ? p.availability : "Available",
    avatar: getProviderImage(p.id, p.name),
    vertical: categoryToVertical((p as any).category ?? ""),
    serviceCategory: categorizeService(p.service ?? ""),
    price: p.price ?? "",
    availability: typeof p.availability === "string" ? p.availability : "",
  }));

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const { user } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();

  const filteredProviders = useMemo(() => {
    let list = ALL_HOME_PROVIDERS;

    if (activeCategory === "Free Sessions") {
      list = list.filter(p => /free|r0|R0/i.test(p.price));
    } else if (activeCategory === "Available Now") {
      list = list.filter(p => /weekday|daily|today|by appointment/i.test(p.availability));
    } else if (activeCategory !== "All") {
      list = list.filter(p => p.serviceCategory === activeCategory);
    }

    return list.slice(0, 12);
  }, [activeCategory]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
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
          {filteredProviders.length === 0 ? (
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
              {filteredProviders.map((p, i) => (
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

        {/* Calendar preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Today</h2>
            <button onClick={() => navigate("/calendar")} className="text-xs text-teal font-medium">View Calendar →</button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
            {(() => {
              try {
                const events = JSON.parse(localStorage.getItem("bion_calendar_events") ?? "[]");
                const today = new Date().toISOString().split("T")[0];
                const todayEvents = events.filter((e: any) => e.date === today && !e.completed).slice(0, 4);
                if (todayEvents.length === 0) return (
                  <div className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                    <p className="text-xs text-muted-foreground">No events today</p>
                  </div>
                );
                return todayEvents.map((evt: any) => (
                  <div key={evt.id} onClick={() => navigate("/calendar")}
                    className="min-w-[140px] rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-3 cursor-pointer hover:border-teal/20 transition-colors shrink-0">
                    <p className="text-[10px] text-teal font-medium">{evt.time ?? "All day"}</p>
                    <p className="text-xs text-foreground font-medium mt-0.5 truncate">{evt.title}</p>
                    {evt.provider && <p className="text-[10px] text-muted-foreground truncate">{evt.provider}</p>}
                  </div>
                ));
              } catch { return null; }
            })()}
          </div>
        </section>

        {/* Your Tools — ITSON glass-card grid */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Your Tools</h2>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { icon: <Utensils className="w-5 h-5" />,     label: "Food",      path: "/food-tracker",    color: "text-teal" },
              { icon: <CalendarIcon className="w-5 h-5" />,  label: "Calendar",  path: "/calendar",        color: "text-indigo" },
              { icon: <BarChart3 className="w-5 h-5" />,     label: "Insights",  path: "/health-insights", color: "text-violet" },
              { icon: <Dumbbell className="w-5 h-5" />,      label: "Routines",  path: "/routines",        color: "text-teal" },
              { icon: <Droplets className="w-5 h-5" />,      label: "Water",     path: "/water-tracker",   color: "text-blue-400" },
              { icon: <Moon className="w-5 h-5" />,          label: "Sleep",     path: "/sleep-tracker",   color: "text-violet" },
              { icon: <HeartPulse className="w-5 h-5" />,    label: "Med Card",  path: "/medical-card",    color: "text-coral" },
              { icon: <Activity className="w-5 h-5" />,      label: "Health",    path: "/health-profile",  color: "text-teal" },
            ].map(tool => (
              <motion.button key={tool.path} whileTap={{ scale: 0.93 }}
                onClick={() => navigate(tool.path)}
                className="group rounded-2xl py-4 flex flex-col items-center gap-2 border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm hover:border-white/[0.16] hover:bg-white/[0.04] transition-all duration-200"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                <span className={`${tool.color} drop-shadow-[0_0_6px_currentColor] transition-all group-hover:scale-110`} style={{ filter: "drop-shadow(0 0 6px currentColor)" }}>
                  {tool.icon}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-wide">{tool.label}</span>
              </motion.button>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
      <BionAssistant />
    </div>
  );
};

export default Index;
