import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SearchBar from "@/components/SearchBar";
import CategoryChip from "@/components/CategoryChip";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import EnablePushCard from "@/components/EnablePushCard";
import OnboardingChecklistCard from "@/components/OnboardingChecklistCard";
import BionTips from "@/components/BionTips";
import { getSASTDateKey } from "@/utils/sastDate";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { useFeatureDiscovery } from "@/hooks/useFeatureDiscovery";
import GlassCard from "@/components/GlassCard";
import {
  Sparkles, MapPin, Star, Clock, Search as SearchIcon, Flame, Camera,
  Utensils, Calendar as CalendarIcon, BarChart3, Dumbbell,
  Droplets, Moon, HeartPulse, Activity, Bot
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useHabitProfile } from "@/hooks/useHabits";
import { useVerifiedProviders } from "@/hooks/useVerifiedProviders";
import { useImageUpload } from "@/hooks/useUpload";
import { toast } from "sonner";
import { distanceToSuburb } from "@/lib/pretoriaSuburbs";
import BiometricsDashboard from "@/components/BiometricsDashboard";
import TodaySummaryCard from "@/components/TodaySummaryCard";
import PendingRatingsBanner from "@/components/PendingRatingsBanner";
import ExpenditureRewardsStrip from "@/components/ExpenditureRewardsStrip";
import realData from "@/data/bion_pretoria_data.json";
import { getSASTDateKey } from "@/utils/sastDate";
import { getProviderImage, hasCustomImage } from "@/lib/providerImages";
import { getSastGreeting } from "@/lib/greeting";
import CampaignBanner from "@/components/CampaignBanner";
import InstallButton from "@/components/InstallButton";
import { supabase } from "@/integrations/supabase/client";

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

/** Slim banner that nudges unverified users to verify their email. */
function EmailVerifyBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("bion_email_verify_dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (!user || user.id?.startsWith("demo_") || dismissed) return;
    supabase.from("profiles")
      .select("email_verified")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => setVerified(data?.email_verified ?? false))
      .catch(() => {});
  }, [user?.id, dismissed]);

  if (verified !== false || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-3 flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center shrink-0">
        <Activity className="w-4 h-4 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">Verify your email</p>
        <p className="text-[10px] text-muted-foreground">Secure your account and enable password recovery</p>
      </div>
      <button
        onClick={() => navigate("/settings?tab=account")}
        className="shrink-0 px-3 py-1.5 rounded-pill text-[10px] font-semibold gradient-indigo text-primary-foreground"
      >
        Verify
      </button>
      <button
        onClick={() => { setDismissed(true); try { sessionStorage.setItem("bion_email_verify_dismissed", "1"); } catch {} }}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <span className="sr-only">Dismiss</span>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </motion.div>
  );
}

const ALL_HOME_PROVIDERS = realData.providers
  .slice()
  .sort((a, b) => {
    const aLogo = !!(a as any).imageUrl ? 1 : 0;
    const bLogo = !!(b as any).imageUrl ? 1 : 0;
    if (bLogo !== aLogo) return bLogo - aLogo;
    return (b.rating ?? 0) - (a.rating ?? 0);
  })
  .map(p => ({
    id: p.id,
    name: p.name,
    specialty: p.service ?? p.category ?? "",
    rating: p.rating ?? 0,
    distance: p.suburb ?? p.location ?? "",
    nextSlot: typeof p.availability === "string" ? p.availability : "Available",
    avatar: (p as any).imageUrl || getProviderImage(p.id, p.name),
    vertical: categoryToVertical(p.category ?? ""),
    serviceCategory: categorizeService(p.service ?? ""),
    price: p.price ?? "",
    availability: typeof p.availability === "string" ? p.availability : "",
    // Verified badge only for providers who completed document verification in Supabase
    // (scraped data `verified` field is not sufficient — must have approved documents)
    verified: false,
  }));

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVersion, setFilterVersion] = useState(0); // bumped when filters change
  const { user, updateAvatar, updateCoverImage } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();
  const verifiedProviders = useVerifiedProviders();
  const { profile: habitProfile } = useHabitProfile();
  const { bookings } = useBookings();
  const { showTip } = useFeatureDiscovery();

  // Feature discovery toast — first visit only
  useEffect(() => {
    showTip("home", "Welcome to BION! Explore the tools below to start your wellness journey.");
  }, [showTip]);

  // Only invite push opt-in for new clients with no bookings yet, and only if
  // the browser hasn't already locked permission in either direction (granted
  // means there's no remaining prompt to show; denied means the OS/browser
  // has blocked us).
  const showPushCta = bookings.length === 0
    && typeof window !== "undefined"
    && "Notification" in window
    && Notification.permission === "default";

  // Hide category chips that would yield zero providers. Recomputed whenever
  // the source list changes (it's static seed data today, but verifiedProviders
  // could extend it later). Previously users saw dead chips like "Free Sessions"
  // that produced an empty list when tapped.
  const availableCategories = useMemo(() => {
    return categories.filter(c => {
      if (c === "All") return true;
      if (c === "Free Sessions") return ALL_HOME_PROVIDERS.some(p => /free|r0|R0/i.test(p.price));
      if (c === "Available Now") return ALL_HOME_PROVIDERS.some(p => /weekday|daily|today|by appointment/i.test(p.availability));
      return ALL_HOME_PROVIDERS.some(p => p.serviceCategory === c);
    });
  }, []);

  const filteredProviders = useMemo(() => {
    let list = ALL_HOME_PROVIDERS;

    // Read filters from localStorage (set by SearchBar filter sheet)
    let filters: any = {};
    try { filters = JSON.parse(localStorage.getItem("bion_search_filters") ?? "{}"); } catch {}

    // Search query — split into words, match ANY word against ANY field
    if (searchQuery.trim()) {
      const words = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 1);
      if (words.length > 0) {
        const scored = list.map(p => {
          const haystack = `${p.name} ${p.specialty} ${p.distance} ${p.serviceCategory}`.toLowerCase();
          let score = 0;
          for (const w of words) {
            if (haystack.includes(w)) score++;
            if (p.name.toLowerCase().includes(w)) score += 2;
          }
          return { p, score };
        });
        list = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.p);
      }
    }

    // Category from chips OR from filter sheet
    const cat = activeCategory !== "All" ? activeCategory : (filters.category && filters.category !== "All" ? filters.category : null);
    if (cat === "Free Sessions" || filters.freeOnly) {
      list = list.filter(p => /free|r0|R0/i.test(p.price));
    }
    if (cat === "Available Now" || filters.availableNow) {
      list = list.filter(p => /weekday|daily|today|by appointment/i.test(p.availability));
    }
    if (cat && cat !== "Free Sessions" && cat !== "Available Now") {
      list = list.filter(p => p.serviceCategory === cat);
    }

    // Min rating
    if (filters.minRating > 0) {
      list = list.filter(p => p.rating >= filters.minRating);
    }

    // Sort by distance if user location available and "Nearby" selected
    if (cat === "Nearby" || activeCategory === "Nearby") {
      if (geo.latitude && geo.longitude) {
        list = list
          .map(p => ({ ...p, _dist: distanceToSuburb(geo.latitude!, geo.longitude!, p.distance) }))
          .filter(p => p._dist !== null)
          .sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999));
      }
    }

    // ── Personalise by the user's top engaged categories (from habits) ──
    // When the user hasn't explicitly picked a category chip, re-rank the list
    // so providers whose specialty matches one of the user's top categories
    // surface first. No-op for new users with no habit signal yet.
    if (!cat && habitProfile?.top_categories?.length) {
      const catWeight: Record<string, number> = {};
      habitProfile.top_categories.forEach((c, idx) => {
        catWeight[c.category.toLowerCase()] = (5 - idx) * c.count;
      });
      const score = (p: typeof list[number]) => {
        const hay = `${p.specialty ?? ""} ${p.serviceCategory ?? ""}`.toLowerCase();
        let s = (p.rating ?? 0);
        for (const [key, weight] of Object.entries(catWeight)) {
          if (hay.includes(key)) s += weight;
        }
        return s;
      };
      list = [...list].sort((a, b) => score(b) - score(a));
    }

    return list.slice(0, 12);
  }, [activeCategory, searchQuery, filterVersion, geo.latitude, geo.longitude, habitProfile]);

  const getGreeting = getSastGreeting;

  // Cover banner image — single source of truth: profiles.cover_image_url,
  // exposed by AuthContext as user.coverImage. Same source as Profile.tsx
  // so the two pages can never disagree.
  // Pre-fix: Index read from localStorage["bion_cover_<id>"] while Profile
  // wrote to profiles.cover_image_url — the food / smartwatch ghost-photo
  // mystery on /me was a stale base64 from the old upload code that
  // never made it past the legacy localStorage key.
  const coverImage = user?.coverImage ?? null;

  const avatarUploader = useImageUpload({ folder: "avatars", maxMB: 5 });
  const coverUploader = useImageUpload({ folder: "covers", maxMB: 8 });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    try {
      const url = await coverUploader.upload(file);
      await updateCoverImage(url);
      toast.success("Cover photo updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Cover upload failed", { duration: 8000 });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await avatarUploader.upload(file);
      await updateAvatar(url);
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Avatar upload failed", { duration: 8000 });
    }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-20 space-y-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onFiltersChange={() => setFilterVersion(v => v + 1)}
        />

        {/* ── Active Campaign Banner ── */}
        <CampaignBanner />

        {/* ── Email verification banner ── */}
        <EmailVerifyBanner />

        {/* ── Cover banner — full height with avatar on top ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="relative h-56 md:h-72 xl:h-80 rounded-3xl overflow-hidden border border-white/[0.08] group"
          style={{
            ...(coverImage
              ? { backgroundImage: `url(${coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(13,148,136,0.4), rgba(139,92,246,0.5))" }),
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}>
          {!coverImage && (
            <>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-teal/20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo/20 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-violet/10 blur-3xl" />
            </>
          )}

          {/* Cover upload button */}
          <label className="absolute top-3 right-3 w-10 h-10 rounded-full bg-obsidian/60 backdrop-blur-md border border-white/[0.12] flex items-center justify-center cursor-pointer hover:bg-obsidian/80 transition-colors z-10">
            <Camera className="w-4 h-4 text-white" />
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          </label>

          {/* Avatar centered on banner */}
          <div className="absolute bottom-4 left-4 md:bottom-5 md:left-5">
            <div className="relative w-24 h-24 md:w-28 md:h-28 group/avatar">
              {/* Avatar image */}
              <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-obsidian bg-obsidian shadow-2xl">
                <img
                  src={user?.avatar ?? getProviderImage(user?.id ?? "user", user?.name ?? "User")}
                  alt={user?.name ?? "User"}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Tiny camera button — bottom-right corner, only visible on hover (desktop) */}
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-obsidian border-2 border-white/[0.08] flex items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 hover:bg-white/[0.04] transition-opacity z-10">
                <Camera className="w-3 h-3 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>
        </motion.div>

        {/* ── Hero info card (greeting, name, stats) ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-teal font-medium tracking-widest uppercase mb-1">{getGreeting()}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{user?.name ?? "Welcome"}</h1>
          <p className="text-xs text-muted-foreground mt-1">Commit to yourself. You've got this.</p>

          {/* Name prompt for Google OAuth users who landed with a fallback name */}
          {user?.name === "BION User" && (
            <div className="mt-3 p-3 rounded-xl border border-amber-400/20 bg-amber-400/5">
              <p className="text-[11px] text-amber leading-relaxed">
                Your display name isn't set yet.{" "}
                <button onClick={() => navigate("/profile")} className="underline font-medium">
                  Set your name
                </button>
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs">
              <Flame className="w-3.5 h-3.5 text-amber" style={{ filter: "drop-shadow(0 0 4px #F59E0B)" }} />
              <span className="text-foreground font-data">{(() => { try { return JSON.parse(localStorage.getItem("bion_routines") ?? "[]").length; } catch { return 0; } })()} routines</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Droplets className="w-3.5 h-3.5 text-blue-400" style={{ filter: "drop-shadow(0 0 4px #60A5FA)" }} />
              <span className="text-foreground font-data">{(() => { try { return localStorage.getItem(`bion_water_${getSASTDateKey()}`) ?? "0"; } catch { return "0"; } })()} glasses</span>
            </div>
          </div>
        </motion.div>

        {/* ── Today rollup (water + food + sleep + sessions) ── */}
        <TodaySummaryCard />

        {/* ── Biometrics dashboard (compact) ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Today's Vitals</p>
            <button onClick={() => navigate("/health-insights")} className="text-xs text-teal font-medium">View all →</button>
          </div>
          <BiometricsDashboard compact />
        </section>

        {/* Pending ratings — prompt user to rate completed bookings */}
        <PendingRatingsBanner />

        {/* Onboarding checklist — nudges clients to fill missing profile signals */}
        {user?.role === "client" && <OnboardingChecklistCard role="client" />}

        {/* B_ contextual tips — proactive nudges based on user state */}
        <BionTips context="home" />

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

        {/* Expenditure Rewards — acquisition vouchers from nearby providers user has never visited */}
        <ExpenditureRewardsStrip />

        {/* Push opt-in — only for new clients who haven't booked yet (see showPushCta guard) */}
        {showPushCta && (
          <EnablePushCard role="client" profileId={user?.profileId ?? null} />
        )}

        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
          {availableCategories.map((cat) => (
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
              <p className="text-xs text-muted-foreground">Explore the provider network to find professionals near you.</p>
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
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/provider/${p.id}`); } }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${p.name} — ${p.specialty}`}
                  className="glass-1 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-white/[0.16] hover:shadow-hover transition-all border border-white/[0.08]"
                >
                  <img src={p.avatar} alt={`${p.name} — ${p.specialty}`} className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
                      {p.name}
                      {verifiedProviders.has(p.id) && (
                        <span title="Verified — qualifications and registration confirmed">
                          <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0 fill-teal"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                        </span>
                      )}
                    </h3>
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
                const today = getSASTDateKey();
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
              { icon: <Activity className="w-5 h-5" />,      label: "BMI",       path: "/tools/bmi-calculator", color: "text-amber" },
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

        {/* Install BION as an app */}
        <InstallButton variant="card" />
      </div>

      <BottomNav />
      <BionAssistant />
    </div>
  );
};

export default Index;
