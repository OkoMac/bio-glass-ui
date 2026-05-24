import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X, Zap, Search, Plus, Settings, ChevronRight, Sparkles,
  Utensils, Droplets, Moon, HeartPulse, Brain, Activity, Dumbbell,
  CalendarDays, BarChart3, Trophy, Wallet, Bell, Heart, Pill, ArrowLeft,
  FileText,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import BookingSheet from "@/components/BookingSheet";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useUserPref } from "@/hooks/useUserPref";
import { useProviderData } from "@/data/useProviderData";
import { getProviderImage } from "@/lib/providerImages";

/* ── All available tools the user can pin ──────────── */
const ALL_TOOLS = [
  { id: "food",     icon: Utensils,    label: "Food Tracker",    path: "/food-tracker",    color: "text-teal" },
  { id: "water",    icon: Droplets,    label: "Water",           path: "/water-tracker",   color: "text-blue-400" },
  { id: "sleep",    icon: Moon,        label: "Sleep",           path: "/sleep-tracker",   color: "text-violet" },
  { id: "medcard",  icon: HeartPulse,  label: "Medical Card",    path: "/medical-card",    color: "text-coral" },
  { id: "coach",    icon: Brain,       label: "Life Coach",      path: "/life-coach",      color: "text-indigo" },
  { id: "calendar", icon: CalendarDays,label: "Calendar",        path: "/calendar",        color: "text-indigo" },
  { id: "insights", icon: BarChart3,   label: "Health Insights", path: "/health-insights", color: "text-violet" },
  { id: "routines", icon: Dumbbell,    label: "Routines",        path: "/routines",        color: "text-teal" },
  { id: "health",   icon: Activity,    label: "Health Profile",  path: "/health-profile",  color: "text-teal" },
  { id: "wallet",   icon: Wallet,      label: "BIONWallet",      path: "/wallet",          color: "text-amber" },
  { id: "challenges", icon: Trophy,    label: "Challenges",      path: "/challenges",      color: "text-amber" },
  { id: "notifs",   icon: Bell,        label: "Notifications",   path: "/notifications",   color: "text-coral" },
  { id: "schedule", icon: CalendarDays,label: "My Schedule",     path: "/schedule",        color: "text-indigo" },
  { id: "meds",     icon: Pill,        label: "Medication",      path: "/routines?create=medication", color: "text-indigo" },
  { id: "programs", icon: FileText,    label: "Programs",        path: "/my-programs",     color: "text-indigo" },
];

/* ── Default pinned tools (shown until user customizes) ── */
const DEFAULT_PINS = ["food", "water", "medcard", "coach", "calendar", "routines"];

// Legacy localStorage key — useUserPref reads it once during the first
// server fetch and migrates the value up so users who customised before
// this change don't start over. Safe to keep referenced; the hook
// rewrites it on every change so old code paths still see the value.
const STORAGE_KEY = "bion_quick_menu_tools";

export default function QuickBook() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings } = useBookings();
  const { favorites, toggle: toggleFavorite, isFavorite } = useFavorites();
  const { ids: recentIds } = useRecentlyViewed();

  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [showCustomize, setShowCustomize] = useState(false);

  // User's pinned tools — server-persisted via user_preferences. The hook
  // reads localStorage for instant first paint, then syncs from server,
  // and pushes any local-only value up on first read so existing users
  // (whose tools were localStorage-only) don't lose their list when
  // this rolls out. Survives PWA reinstall, cross-device sign-in, and
  // tab clears.
  const [pinnedTools, setPinnedTools] = useUserPref<string[]>("hub_pinned_tools", DEFAULT_PINS, { lsKey: STORAGE_KEY });

  // Was: static import of bion_pretoria_data.json (547KB chunk) used as
  // ptaProviders in 6 useMemo bodies below. Now fetched from the
  // directory API; first paint may have empty arrays until the request
  // settles. Each consumer below already handles the empty case.
  const { providers: ptaProviders } = useProviderData("pta", { all: true });

  /* ── Compute "Your Providers" from booking history + favorites ──
     Reported 2026-05-04 — Oko's home dashboard had a "Suggested for You"
     section with a confused empty state ("Book your first session to
     start building your favorites list") and a "+ Add" button that just
     pushed users to /directory with no explanation. The section ignored
     useFavorites entirely, so even a favorited provider didn't show up.
     This rebuild merges booking history AND favorites, dedupes by id,
     sorts favorites first then by recency. */
  const myProviders = useMemo(() => {
    const providerMap = new Map<string, { id: string; name: string; image: string; lastBooked: string; count: number; vertical: string; isFavorite: boolean }>();

    // 1. Booking history
    bookings.forEach(b => {
      const name = b.providerName ?? b.clientName ?? "Unknown";
      const id = b.providerId ?? name.replace(/\s/g, "_").toLowerCase();
      const existing = providerMap.get(id);
      if (existing) {
        existing.count++;
        if (b.date > existing.lastBooked) existing.lastBooked = b.date;
      } else {
        const realProvider = ptaProviders.find(p => p.name === name || p.id === id);
        providerMap.set(id, {
          id: realProvider?.id ?? id,
          name,
          image: realProvider ? getProviderImage(realProvider.id, name) : getProviderImage(id, name),
          lastBooked: b.date,
          count: 1,
          vertical: "teal",
          isFavorite: isFavorite(realProvider?.id ?? id),
        });
      }
    });

    // 2. Favorites that aren't already in the booking-history map
    favorites.forEach(favId => {
      if (providerMap.has(favId)) {
        providerMap.get(favId)!.isFavorite = true;
        return;
      }
      const realProvider = ptaProviders.find(p => p.id === favId);
      if (!realProvider) return;
      providerMap.set(favId, {
        id: favId,
        name: realProvider.name,
        image: getProviderImage(favId, realProvider.name),
        lastBooked: "—",
        count: 0,
        vertical: "teal",
        isFavorite: true,
      });
    });

    // Favorites first, then by booking count (descending)
    return Array.from(providerMap.values())
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return b.count - a.count;
      })
      .slice(0, 8);
  }, [bookings, favorites, isFavorite, ptaProviders]);

  /* ── Suggested providers (for users with no history) ── */
  const suggestedProviders = useMemo(() => {
    return ptaProviders
      .slice()
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        name: p.name,
        image: getProviderImage(p.id, p.name),
        specialty: p.service ?? (p as any).category ?? "",
        rating: p.rating ?? 0,
      }));
  }, [ptaProviders]);

  /* ── Favorite providers ── */
  const favoriteProviders = useMemo(() => {
    if (favorites.size === 0) return [];
    return ptaProviders
      .filter(p => favorites.has(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        image: getProviderImage(p.id, p.name),
        specialty: p.service ?? (p as any).category ?? "",
        rating: p.rating ?? 0,
      }));
  }, [favorites, ptaProviders]);

  /* ── Recently viewed providers ── */
  const recentlyViewed = useMemo(() => {
    if (recentIds.length === 0) return [];
    const byId = new Map(ptaProviders.map(p => [p.id, p]));
    return recentIds
      .map(id => byId.get(id))
      .filter(Boolean)
      .slice(0, 6)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        image: getProviderImage(p.id, p.name),
        specialty: p.service ?? p.category ?? "",
        rating: p.rating ?? 0,
      }));
  }, [recentIds, ptaProviders]);

  // Tool definitions for pinned ones
  const visibleTools = pinnedTools
    .map(id => ALL_TOOLS.find(t => t.id === id))
    .filter(Boolean) as typeof ALL_TOOLS;

  const toggleTool = (id: string) => {
    setPinnedTools(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  /* ── Filter providers by search ── */
  const filteredProviders = search.trim()
    ? myProviders.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : myProviders;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="max-w-lg md:max-w-3xl xl:max-w-7xl mx-auto px-4 pt-20 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo to-violet flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Your Hub</h1>
              </div>
              <p className="text-xs text-muted-foreground">Tools, providers, and quick actions — one tap away</p>
            </div>
          </div>
          <button onClick={() => setShowCustomize(true)}
            className="w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* B_ helper card — first time only */}
        {pinnedTools.length === DEFAULT_PINS.length && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-violet/20 bg-violet/5 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet to-indigo flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">B_</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Make this your own</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Pick the tools you use most so they're always one tap away. Tap the gear icon in the top right to customize.
              </p>
              <button onClick={() => setShowCustomize(true)}
                className="text-xs text-violet font-medium mt-2">
                Customize my menu →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Pinned Tools ───────────────────────────── */}
        <section>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Your Tools</p>
          <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {visibleTools.map(tool => {
              const Icon = tool.icon;
              return (
                <motion.button key={tool.id} whileTap={{ scale: 0.93 }}
                  onClick={() => navigate(tool.path)}
                  className="group rounded-2xl py-4 px-2 flex flex-col items-center gap-2 border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm hover:border-white/[0.16] hover:bg-white/[0.04] transition-all duration-200"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                  <span className={`${tool.color} transition-all group-hover:scale-110`} style={{ filter: "drop-shadow(0 0 6px currentColor)" }}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium tracking-wide text-center leading-tight">
                    {tool.label}
                  </span>
                </motion.button>
              );
            })}
            {/* Add tool button */}
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowCustomize(true)}
              className="group rounded-2xl py-4 px-2 flex flex-col items-center gap-2 border border-dashed border-white/[0.12] hover:border-teal/40 transition-all duration-200">
              <span className="text-muted-foreground group-hover:text-teal transition-colors">
                <Plus className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide text-center">Add tool</span>
            </motion.button>
          </div>
        </section>

        {/* ── Favorites ───────────────────────────── */}
        {favoriteProviders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Heart className="w-3 h-3 fill-coral text-coral" /> Favorites ({favoriteProviders.length})
              </p>
              <button onClick={() => navigate("/favorites")} className="text-xs text-coral font-medium">View all →</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {favoriteProviders.slice(0, 4).map(p => (
                <motion.button key={p.id} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/provider/${p.id}`)}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 flex items-center gap-3 hover:border-coral/40 transition-colors">
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-coral/20 shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.specialty}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} className="shrink-0">
                    <Heart className="w-4 h-4 fill-coral text-coral" />
                  </button>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* ── Recently Viewed ───────────────────────────── */}
        {recentlyViewed.length > 0 && (
          <section>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Recently Viewed</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {recentlyViewed.map(p => (
                <motion.button key={p.id} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/provider/${p.id}`)}
                  className="shrink-0 w-32 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 text-left hover:border-white/[0.16] transition-colors">
                  <img src={p.image} alt={p.name} className="w-full aspect-square rounded-xl object-cover mb-2" />
                  <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{p.specialty}</p>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* ── Your Providers (favorites + booking history) ─────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Your providers
            </p>
            <button onClick={() => navigate("/directory", { state: { from: "/book" } })}
              className="text-xs text-teal font-medium">
              {myProviders.length > 0 ? "+ Find more" : "Browse directory"}
            </button>
          </div>

          {/* Search providers */}
          {myProviders.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center gap-2 px-3 py-2 mb-3">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search your providers..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-muted-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Providers grid */}
          {myProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredProviders.map(p => (
                <motion.button key={p.id} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/provider/${p.id}`)}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 flex items-center gap-3 hover:border-white/[0.16] transition-colors"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/[0.08] shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.count} {p.count === 1 ? "session" : "sessions"} · last {p.lastBooked}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </motion.button>
              ))}
            </div>
          ) : (
            // Empty state with suggestions
            <div className="space-y-3">
              <GlassCard className="p-4 text-center">
                <Sparkles className="w-8 h-8 text-violet/60 mx-auto mb-2" />
                <p className="text-sm text-foreground font-medium mb-1">No providers yet</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Tap a heart on any provider in the directory to favorite them, or book a session to add them here.
                </p>
                <button
                  onClick={() => navigate("/directory", { state: { from: "/book" } })}
                  className="rounded-pill px-4 py-1.5 text-xs font-semibold gradient-indigo text-primary-foreground"
                >
                  Browse directory
                </button>
              </GlassCard>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 px-1">Top rated near you</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedProviders.map(p => (
                  <motion.button key={p.id} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/provider/${p.id}`)}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 flex items-center gap-3 hover:border-white/[0.16] transition-colors">
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/[0.08] shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{p.specialty}</p>
                    </div>
                    <span className="text-xs font-data text-amber shrink-0">★ {p.rating.toFixed(1)}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* B_ tip */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet to-indigo flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">B_</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-foreground">
              <span className="font-semibold">Tip:</span> Tap the gear icon to add or remove tools from this menu. I'll learn from your habits and suggest new pins over time.
            </p>
          </div>
        </div>
      </div>

      {/* ── Customize Tools Sheet ────────────────────── */}
      <AnimatePresence>
        {showCustomize && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCustomize(false)} className="fixed inset-0 bg-obsidian/60 z-[60]" />
            <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5 max-h-[80vh] overflow-y-auto"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Customize Quick Menu</h3>
                  <p className="text-xs text-muted-foreground">Tap to pin or unpin tools</p>
                </div>
                <button onClick={() => setShowCustomize(false)}
                  className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* B_ recommendation */}
              <div className="rounded-xl border border-violet/20 bg-violet/5 p-3 flex items-start gap-2.5 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet to-indigo flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-white">B_</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-medium">My recommendation:</span> Pin tools you use daily (water, food) and weekly (calendar, routines). Keep it under 8 for the cleanest menu.
                </p>
              </div>

              {/* Tools grid with toggle state */}
              <div className="grid grid-cols-3 gap-2.5">
                {ALL_TOOLS.map(tool => {
                  const Icon = tool.icon;
                  const pinned = pinnedTools.includes(tool.id);
                  return (
                    <motion.button key={tool.id} whileTap={{ scale: 0.93 }}
                      onClick={() => toggleTool(tool.id)}
                      className={`rounded-2xl py-4 px-2 flex flex-col items-center gap-2 border transition-all duration-200 relative ${
                        pinned
                          ? "border-teal/40 bg-teal/5"
                          : "border-white/[0.08] bg-white/[0.02]"
                      }`}>
                      <span className={`${tool.color} transition-all`} style={pinned ? { filter: "drop-shadow(0 0 6px currentColor)" } : {}}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium tracking-wide text-center leading-tight">
                        {tool.label}
                      </span>
                      {pinned && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-4">
                {pinnedTools.length} of {ALL_TOOLS.length} tools pinned
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Booking sheet (legacy — kept for compatibility) */}
      {selectedProvider && (
        <BookingSheet open={true} provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
      )}

      <BionAssistant />
      <BottomNav />
    </div>
  );
}
