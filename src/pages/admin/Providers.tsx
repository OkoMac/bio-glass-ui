import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { supabase } from "@/integrations/supabase/client";
import ServiceCategoryBlock, { SERVICE_CATEGORIES, type ServiceCategory } from "@/components/ServiceCategoryBlock";
import { getProviderImage, hasCustomImage } from "@/lib/providerImages";
import {
  Search, Star, MapPin, CheckCircle, XCircle, Eye, Pause, Play,
  MessageSquare, Plus, ChevronRight, X, Settings, Lock, Phone, Mail,
  SlidersHorizontal, UserPlus, ArrowLeft, Globe, ExternalLink,
} from "lucide-react";

import realData from "@/data/bion_pretoria_data.json";

// ── Build provider list from ALL real scraped data ──
function categorize(s: string, name?: string): string {
  const l = (s ?? "").toLowerCase();
  const haystack = `${(name ?? "").toLowerCase()} ${l}`;
  // Pet / grooming check FIRST — pet groomers with service:"Beauty"
  // were landing under human beauticians (Paw Buddies, 2026-04-28).
  if (/\bpaw\b|\bpet[s]?\b|\b(dog|cat|kitten|puppy)\b|kennel|cattery|grooming.*pet|pet.*grooming|mobile grooming|pet salon/i.test(haystack)) return "veterinary";
  if (/hair|barber|stylist|color|bridal/.test(l)) return "hair";
  if (/nail|manicur|pedicur|gel nail|sculpture/.test(l)) return "nails";
  if (/skin|facial|laser|aesthetic|contour|pmu/.test(l)) return "skincare";
  if (/spa|beauty|makeup|lash|brow|waxing|hydro|thai beauty|medical spa|day spa/.test(l)) return "beautyspa";
  if (/doctor|physician|medical|gp|general pract|centre|center|hospital|nursing|paediatrician/.test(l)) return "medical";
  if (/dentist|dental|teeth|smile|denture/.test(l)) return "dental";
  if (/physio|biokin|podiatry/.test(l)) return "physio";
  if (/psycho|mental|counsel|clinical psych|educational psych|crisis|industrial psych|addiction|hypnotherapy|marriage counsel|life coaching|trauma/.test(l)) return "mental-health";
  if (/massage|bodywork|shiatsu|thai massage|thai spa|healing massage|mobile massage|aromatherapy|body therapy|sports massage|lymph|reflexology & massage|sports recovery|corporate massage/.test(l)) return "massage";
  if (/wellness|holistic|reiki|reflexology|natural|iridol|energy|sanctuary|functional medicine/.test(l)) return "wellness";
  if (/chiro/.test(l)) return "chiro";
  if (/nutrition|diet|weight|slim|health food|anti-ageing/.test(l)) return "nutrition";
  if (/vet|animal|diere|24hr vet/.test(l)) return "veterinary";
  if (/gym|personal train|crossfit|fitness|pilates|yoga|spinning|boot camp|martial|dance|zumba|pole/.test(l)) return "fitness";
  if (/pharmacy|apteek|health shop|dispensing|clicks|dischem/.test(l)) return "pharmacy";
  if (/optom|optic|eye|ophth|vision|spectacle|specsaver/.test(l)) return "optometry";
  return "other";
}

const ALL_PROVIDERS = realData.providers.map((p: any) => ({
  id: p.id,
  name: p.name,
  service: p.service,
  specialization: p.specialization ?? p.service,
  location: p.location,
  address: p.address,
  phone: (p as any).phone ?? p.contact?.phone ?? "",
  email: (p as any).email ?? p.contact?.email ?? "",
  website: (p as any).website ?? p.contact?.website ?? "",
  googlePlaceId: (p as any).google_place_id ?? "",
  openingHours: (p as any).opening_hours ?? [],
  businessStatus: (p as any).business_status ?? "",
  rating: typeof p.rating === "string" ? parseFloat(p.rating) || 0 : (p.rating ?? 0),
  reviews: p.reviewCount ?? 0,
  price: p.price ?? "Price on request",
  availability: p.availability ?? "",
  category: categorize(p.service, p.name),
  image: (p as any).imageUrl || getProviderImage(p.id, p.name),
  hasLogo: !!(p as any).imageUrl || hasCustomImage(p.id),
  qualifications: p.qualifications ?? [],
  languages: p.languages ?? ["English"],
  experienceYears: p.experienceYears ?? 0,
  status: "active" as const,
})).sort((a, b) => (b.hasLogo ? 1 : 0) - (a.hasLogo ? 1 : 0));

// Category counts
const catCounts = ALL_PROVIDERS.reduce<Record<string, number>>((acc, p) => {
  acc[p.category] = (acc[p.category] ?? 0) + 1;
  return acc;
}, {});

const CATEGORIES_WITH_COUNTS = SERVICE_CATEGORIES.map((c) => ({
  ...c,
  count: catCounts[c.id] ?? 0,
}));

const FILTER_TABS = ["All", "Top Rated", "Recently Added", "Needs Review"];

export default function AdminProviders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedProvider, setSelectedProvider] = useState<typeof ALL_PROVIDERS[0] | null>(null);

  const filteredProviders = useMemo(() => {
    let list = selectedCategoryId
      ? ALL_PROVIDERS.filter((p) => p.category === selectedCategoryId)
      : ALL_PROVIDERS;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.service.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.phone.includes(q),
      );
    }

    if (activeFilter === "Top Rated") {
      list = [...list].sort((a, b) => b.rating - a.rating);
    } else if (activeFilter === "Recently Added") {
      // Most-recent additions live at the end of the providers dataset.
      list = [...list].reverse();
    } else if (activeFilter === "Needs Review") {
      // Providers without qualifications OR without any reviews are flagged
      // for admin vetting. Matches the vetting signal used elsewhere in the
      // Admin Verification page.
      list = list.filter(p => (p.qualifications?.length ?? 0) === 0 || p.reviews === 0);
    }

    return list;
  }, [selectedCategoryId, search, activeFilter]);

  const displayProviders = filteredProviders.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProviders.length;
  const selectedCat = CATEGORIES_WITH_COUNTS.find((c) => c.id === selectedCategoryId);

  const handleCategoryClick = (cat: ServiceCategory) => {
    setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id);
    setVisibleCount(20);
    setActiveFilter("All");
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-5xl xl:max-w-7xl px-4 md:px-8 pt-24 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Search or Add Provider</h1>
            <p className="text-xs text-muted-foreground">
              {ALL_PROVIDERS.length} providers · {Object.keys(catCounts).length} categories
            </p>
          </div>
          <button
            onClick={() => navigate("/welcome")}
            className="flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-pill text-[11px] md:text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta"
           title="navigate('/welcome')} className='flex items-center gap-2 px-3 md:px-4 py-2.5 …" aria-label="navigate('/welcome')} className='flex items-center gap-2 px-3 md:px-4 py-2.5 …">
            <UserPlus className="w-3.5 h-3.5" />
            Add Provider
          </button>
        </div>

        {/* Search */}
        <div className="glass-1 rounded-pill flex items-center gap-3 px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(20); }}
            placeholder="Search by name, service, location, or phone..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} title="setSearch('')}>" aria-label="setSearch('')}>">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveFilter(tab); setVisibleCount(20); }}
              className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === tab
                  ? "gradient-indigo text-primary-foreground shadow-cta"
                  : "glass-1 text-muted-foreground hover:text-foreground"
              }`}
             title="} className= `} >" aria-label="} className= `} >">
              {tab}
            </button>
          ))}
          {selectedCat && (
            <button
              onClick={() => setSelectedCategoryId(null)}
              className="shrink-0 rounded-pill px-3 py-1.5 text-xs font-medium glass-accent-teal text-teal flex items-center gap-1"
             title="setSelectedCategoryId(null)} className='shrink-0 rounded-pill px-3 py-1.5 tex…" aria-label="setSelectedCategoryId(null)} className='shrink-0 rounded-pill px-3 py-1.5 tex…">
              {selectedCat.name} <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Provider count */}
        <p className="text-xs text-muted-foreground">
          Showing {displayProviders.length} of {filteredProviders.length} providers
        </p>

        {/* Provider List */}
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategoryId}-${activeFilter}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {displayProviders.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                >
                  <GlassCard hover className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <img src={p.image} alt={p.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/10 shrink-0" loading="lazy" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">{p.name}</h3>
                          {p.rating >= 4.5 && <CheckCircle className="w-3.5 h-3.5 text-teal shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{p.service} · {p.location}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs">
                            <Star className="w-3 h-3 text-amber fill-amber" />
                            <span className="font-data text-foreground">{p.rating}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">{p.price}</span>
                          {p.phone && <span className="text-xs text-muted-foreground hidden sm:inline">{p.phone}</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedProvider(selectedProvider?.id === p.id ? null : p)}
                          className="p-2 rounded-xl glass-1 hover:bg-white/[0.08] transition-colors"
                          title="Details"
                         aria-label="setSelectedProvider(selectedProvider?.id === p.id ? null : p)} className='p-2…">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => navigate(`/provider/${p.id}`)}
                          className="p-2 rounded-xl glass-1 hover:bg-white/[0.08] transition-colors"
                          title="View Profile"
                         aria-label="navigate(`/provider/$ `)} className='p-2 rounded-xl glass-1 hover:bg-white/[0…">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    <AnimatePresence>
                      {selectedProvider?.id === p.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/[0.06] mt-3 pt-3 space-y-3">
                            {/* Contact */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {p.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="w-3 h-3" /> {p.phone}
                                </div>
                              )}
                              {p.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="w-3 h-3" /> {p.email}
                                </div>
                              )}
                              {p.website && (
                                <a
                                  href={p.website.startsWith("http") ? p.website : `https://${p.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-teal hover:underline col-span-full"
                                >
                                  <Globe className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{p.website}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                                </a>
                              )}
                              {p.address && (
                                <div className="flex items-center gap-2 text-muted-foreground col-span-full">
                                  <MapPin className="w-3 h-3 shrink-0" /> {p.address}
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex flex-wrap gap-1.5">
                              {p.qualifications.slice(0, 3).map((q: string) => (
                                <span key={q} className="glass-1 rounded-pill px-2 py-0.5 text-[10px] text-muted-foreground">{q}</span>
                              ))}
                              {p.languages.map((l: string) => (
                                <span key={l} className="glass-1 rounded-pill px-2 py-0.5 text-[10px] text-teal">{l}</span>
                              ))}
                              {p.experienceYears > 0 && (
                                <span className="glass-1 rounded-pill px-2 py-0.5 text-[10px] text-amber">{p.experienceYears} yrs exp</span>
                              )}
                            </div>

                            {/* Admin actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/provider/${p.id}`)}
                                className="px-3 py-1.5 text-xs glass-accent-teal rounded-pill text-teal flex items-center gap-1"
                               title="navigate(`/provider/$ `)} className='px-3 py-1.5 text-xs glass-accent-teal ro…" aria-label="navigate(`/provider/$ `)} className='px-3 py-1.5 text-xs glass-accent-teal ro…">
                                <Eye className="w-3 h-3" /> Full Profile
                              </button>
                              <button
                                onClick={async () => {
                                  const { error } = await supabase.from("profiles").update({ provider_status: "suspended" } as any).eq("id", p.id);
                                  // Slice 4 dual-write — mirror to provider_profiles.
                                  try {
                                    const { data: row } = await supabase.from("profiles").select("user_id").eq("id", p.id).maybeSingle();
                                    const userId = (row as any)?.user_id;
                                    if (userId) {
                                      await supabase.from("provider_profiles" as any).update({ provider_status: "suspended" }).eq("user_id", userId);
                                    }
                                  } catch { /* best-effort */ }
                                  if (error) { import("sonner").then(({ toast }) => toast.error("Failed to suspend")); }
                                  else { import("sonner").then(({ toast }) => toast.success("Provider suspended")); }
                                }}
                                className="px-3 py-1.5 text-xs glass-accent-amber rounded-pill text-amber flex items-center gap-1"
                               title="= await supabase.from('profiles').update( as any).eq('id', p.id); // Slice 4 …" aria-label="= await supabase.from('profiles').update( as any).eq('id', p.id); // Slice 4 …">
                                <Pause className="w-3 h-3" /> Suspend
                              </button>
                              <button
                                onClick={() => navigate("/admin/b-inbox")}
                                className="px-3 py-1.5 text-xs glass-1 rounded-pill text-muted-foreground flex items-center gap-1"
                               title="navigate('/admin/b-inbox')} className='px-3 py-1.5 text-xs glass-1 rounded-pi…" aria-label="navigate('/admin/b-inbox')} className='px-3 py-1.5 text-xs glass-1 rounded-pi…">
                                <MessageSquare className="w-3 h-3" /> Message
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-3">
              <button
                onClick={() => setVisibleCount((c) => c + 20)}
                className="px-8 py-3 rounded-pill glass-2 text-sm font-medium text-foreground hover:bg-white/[0.08] transition-all"
               title="setVisibleCount((c) => c + 20)} className='px-8 py-3 rounded-pill glass-2 tex…" aria-label="setVisibleCount((c) => c + 20)} className='px-8 py-3 rounded-pill glass-2 tex…">
                Load more ({filteredProviders.length - visibleCount} remaining)
              </button>
            </div>
          )}

          {!hasMore && displayProviders.length > 0 && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              Showing all {filteredProviders.length} providers
            </p>
          )}

          {displayProviders.length === 0 && (
            <GlassCard className="p-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No providers found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
              <button onClick={() => { setSearch(""); setSelectedCategoryId(null); setActiveFilter("All"); }} className="text-xs text-indigo mt-2" title="} className='text-xs text-indigo mt-2'> Clear all filters" aria-label="} className='text-xs text-indigo mt-2'> Clear all filters">
                Clear all filters
              </button>
            </GlassCard>
          )}
        </div>

        {/* Category Blocks Grid */}
        <section>
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">Browse by Category</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 md:gap-3">
            {CATEGORIES_WITH_COUNTS.map((cat, i) => (
              <ServiceCategoryBlock
                key={cat.id}
                category={cat}
                index={i}
                onClick={handleCategoryClick}
              />
            ))}
          </div>
        </section>
      </div>
      <AdminNav />
    </div>
  );
}
