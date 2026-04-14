import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Share2, Star, MapPin, Clock, Lock, CreditCard, Shield, Mail, Phone, Globe, Building, Check, X, CalendarDays, Heart } from "lucide-react";
import { getProviderImage, getProviderCover } from "@/lib/providerImages";
import { useBookings } from "@/contexts/BookingsContext";
import { useVerifiedProviders } from "@/hooks/useVerifiedProviders";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { getProviderShareUrl, getBookingShareUrl, openWhatsApp } from "@/lib/whatsapp";
import realData from "@/data/bion_pretoria_data.json";

// ── Build lookup from ALL scraped providers ─────────
const PROVIDERS: Record<string, any> = {};
const verticals = ["teal", "indigo", "coral", "amber"] as const;

realData.providers.forEach((p: any, i: number) => {
  PROVIDERS[p.id] = {
    id: p.id,
    name: p.name,
    specialty: p.service,
    specialization: p.specialization,
    vertical: verticals[i % verticals.length],
    rating: typeof p.rating === "string" ? parseFloat(p.rating) || 0 : p.rating,
    reviews: p.reviewCount,
    location: p.location,
    address: p.address,
    experience: p.experienceYears ? `${p.experienceYears} years` : "Experienced",
    image: getProviderImage(p.id, p.name),
    coverImage: getProviderCover(p.id),
    bio: p.description || `Professional ${p.service} provider based in ${p.location}.`,
    price: p.price,
    duration: p.duration || "60 min",
    availability: p.availability,
    qualifications: p.qualifications || [],
    languages: p.languages || [],
    servicesOffered: p.servicesOffered || [p.service],
    contact: {
      email: p.contact?.email,
      phone: p.contact?.phone,
      website: p.contact?.website,
    },
  };
});

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addBooking } = useBookings();
  const verifiedProviders = useVerifiedProviders();
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { trackView } = useRecentlyViewed();
  const [showAllServices, setShowAllServices] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [bookingTime, setBookingTime] = useState("10:00");
  const [selectedService, setSelectedService] = useState(0);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const provider = PROVIDERS[id ?? ""];
  const isSignedIn = !!user;

  const handleBook = () => {
    if (!provider) return;
    const service = provider.servicesOffered[selectedService] ?? provider.specialty;
    addBooking({
      clientId: user?.profileId ?? user?.id ?? "guest",
      clientName: user?.name ?? "Guest",
      clientImage: user?.avatar ?? "",
      providerName: provider.name,
      service,
      date: bookingDate,
      time: bookingTime,
      duration: provider.duration ?? "60 min",
      price: provider.price ?? "R0",
    });
    setBookingConfirmed(true);
    setTimeout(() => {
      setShowBooking(false);
      setBookingConfirmed(false);
      navigate("/schedule");
    }, 2000);
  };

  const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  // SEO: dynamic page title + meta tags for this provider
  useEffect(() => {
    if (!provider) return;
    document.title = `${provider.name} — ${provider.specialty} | BION`;
    const setMeta = (attr: string, name: string, content: string) => {
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attr, name); document.head.appendChild(tag); }
      tag.content = content;
    };
    const desc = `Book ${provider.specialty} with ${provider.name} in ${provider.location}. ${provider.rating > 0 ? `Rated ${provider.rating}/5. ` : ""}Commit to yourself.`;
    setMeta("name", "description", desc);
    setMeta("property", "og:title", `${provider.name} — ${provider.specialty} | BION`);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", `https://bionhealth.co.za/provider/${provider.id}`);
    setMeta("property", "og:image", provider.image.startsWith("http") ? provider.image : `https://bionhealth.co.za${provider.image}`);
    setMeta("property", "og:type", "profile");
    setMeta("name", "twitter:title", `${provider.name} — ${provider.specialty} | BION`);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", provider.image.startsWith("http") ? provider.image : `https://bionhealth.co.za${provider.image}`);
    // Track recently viewed
    if (provider.id) trackView(provider.id);
    return () => { document.title = "BION — Commit to Yourself"; };
  }, [provider, trackView]);

  const shareProvider = () => {
    const url = `https://bionhealth.co.za/provider/${provider.id}`;
    if (navigator.share) {
      navigator.share({ title: provider.name, text: `${provider.specialty} in ${provider.location}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!provider) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center text-foreground gap-4">
        <p className="text-lg font-semibold">Provider not found</p>
        <button onClick={() => navigate("/")} className="text-sm text-indigo">Back to directory</button>
      </div>
    );
  }

  const displayServices = showAllServices
    ? provider.servicesOffered
    : provider.servicesOffered.slice(0, 3);

  return (
    <div className="min-h-screen bg-obsidian pb-40">
      {/* Hero Cover */}
      <div className="relative h-[240px] md:h-[320px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `url(${provider.coverImage}) center/cover` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 to-obsidian/20" />

        {/* Nav */}
        <div className="absolute top-8 md:top-12 left-4 right-4 flex justify-between">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="glass-2 rounded-full w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => toggleFavorite(provider.id)}
              className={`glass-2 rounded-full w-10 h-10 flex items-center justify-center ${isFavorite(provider.id) ? "bg-coral/20" : ""}`}
              aria-label={isFavorite(provider.id) ? "Remove from favorites" : "Add to favorites"}>
              <Heart className={`w-5 h-5 ${isFavorite(provider.id) ? "fill-coral text-coral" : "text-foreground"}`} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => openWhatsApp(getProviderShareUrl(provider.name, provider.id, provider.specialty))}
              className="glass-2 rounded-full w-10 h-10 flex items-center justify-center bg-[#25D366]/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.657-6.363-1.795l-.444-.267-3.072 1.03 1.03-3.072-.267-.444A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={shareProvider} className="glass-2 rounded-full w-10 h-10 flex items-center justify-center">
              {copied ? <Check className="w-5 h-5 text-teal" /> : <Share2 className="w-5 h-5 text-foreground" />}
            </motion.button>
          </div>
        </div>

        {/* Identity */}
        <div className="absolute bottom-6 left-4 right-4 flex items-end gap-4">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <BioAvatar src={provider.image} alt={provider.name} size="xl" verticalColor={provider.vertical} verified={verifiedProviders.has(provider.id)} />
          </motion.div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold text-foreground">{provider.name}</h1>
            <p className="text-sm text-muted-foreground">{provider.specialty}</p>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-4 h-4 text-amber fill-amber" />
              <span className="font-data text-sm text-foreground">{provider.rating}</span>
              <span className="text-xs text-muted-foreground">({provider.reviews} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 space-y-4 mt-4 max-w-2xl mx-auto">
        {/* Quick Stats */}
        <GlassCard className="flex divide-x divide-foreground/10">
          {[
            { label: "Experience", value: provider.experience },
            { label: "Location", value: provider.location.split(",")[0] },
            { label: "Price", value: provider.price },
          ].map((stat) => (
            <div key={stat.label} className="flex-1 py-3 text-center">
              <p className="font-data text-sm text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </GlassCard>

        {/* Availability */}
        {provider.availability && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-teal" />
            <span className="text-muted-foreground">{provider.availability}</span>
          </div>
        )}

        {/* CTA — sign up or book */}
        {isSignedIn ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowBooking(true)}
            className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Book a Session — {provider.price}
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/welcome")}
            className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Sign Up to Book
          </motion.button>
        )}

        {/* Services */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Services Offered</h2>
          <div className="space-y-2">
            {displayServices.map((service: string, i: number) => (
              <GlassCard key={i} className="p-3 flex items-center justify-between">
                <p className="text-sm text-foreground">{service}</p>
                <span className="text-xs text-muted-foreground">{provider.duration}</span>
              </GlassCard>
            ))}
            {provider.servicesOffered.length > 3 && !showAllServices && (
              <button onClick={() => setShowAllServices(true)} className="text-xs text-indigo font-medium mt-1">
                Show all {provider.servicesOffered.length} services
              </button>
            )}
          </div>
        </section>

        {/* Contact Details — gated */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Contact Information</h2>
          <GlassCard className="p-4">
            {isSignedIn ? (
              <div className="space-y-3">
                {provider.contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{provider.contact.email}</span>
                  </div>
                )}
                {provider.contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{provider.contact.phone}</span>
                  </div>
                )}
                {provider.contact.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={provider.contact.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo hover:underline truncate">
                      {provider.contact.website}
                    </a>
                  </div>
                )}
                {provider.address && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{provider.address}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Lock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Sign up to view contact details</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Create a free account to see contact information and make bookings.
                </p>
                <button
                  onClick={() => navigate("/welcome")}
                  className="px-5 py-2.5 gradient-indigo rounded-pill text-sm font-medium text-white shadow-cta"
                >
                  Sign Up Free
                </button>
              </div>
            )}
          </GlassCard>
        </section>

        {/* About */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{provider.bio}</p>
        </section>

        {/* Qualifications */}
        {provider.qualifications.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Qualifications</h2>
            <div className="flex flex-wrap gap-2">
              {provider.qualifications.map((q: string) => (
                <span key={q} className="glass-1 rounded-pill px-3 py-1.5 text-xs text-muted-foreground">{q}</span>
              ))}
            </div>
          </section>
        )}

        {/* Languages */}
        {provider.languages.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {provider.languages.map((lang: string) => (
                <span key={lang} className="glass-1 rounded-pill px-3 py-1.5 text-xs text-foreground">{lang}</span>
              ))}
            </div>
          </section>
        )}

        {/* Payment info */}
        <GlassCard variant="accent-indigo" className="p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-indigo shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Secure Advance Payment</h3>
              <p className="text-xs text-muted-foreground">
                Book with confidence. Your payment is held securely until your appointment is completed.
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-teal" />
                  <span className="text-muted-foreground">5% platform fee</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-coral" />
                  <span className="text-muted-foreground">Secure escrow</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Sticky bottom bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-obsidian/90 backdrop-blur-xl border-t border-white/[0.06] px-4 md:px-8 py-3 flex items-center justify-between"
      >
        <span className="text-sm text-muted-foreground">
          From <span className="font-data text-foreground">{provider.price}</span>
        </span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => isSignedIn ? setShowBooking(true) : navigate("/welcome")}
          className="rounded-pill px-6 py-3 text-[13px] md:text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
        >
          {isSignedIn ? "Book Now" : "Sign Up to Book"}
        </motion.button>
      </motion.div>

      {/* ── Booking Sheet ── */}
      {showBooking && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !bookingConfirmed && setShowBooking(false)}
            className="fixed inset-0 bg-obsidian/70 z-[80]"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-5"
            style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {bookingConfirmed ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-teal/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-teal" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Booking Confirmed!</h3>
                <p className="text-sm text-muted-foreground mb-4">Redirecting to your schedule...</p>
                <button
                  onClick={() => openWhatsApp(getBookingShareUrl(provider.name, provider.servicesOffered[selectedService], bookingDate))}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-[#25D366] text-white text-xs font-semibold"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.657-6.363-1.795l-.444-.267-3.072 1.03 1.03-3.072-.267-.444A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  Share on WhatsApp
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-indigo" />
                    <h3 className="text-base font-bold text-foreground">Book with {provider.name}</h3>
                  </div>
                  <button onClick={() => setShowBooking(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Service selection */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Service</p>
                  <div className="flex flex-wrap gap-2">
                    {provider.servicesOffered.map((s: string, i: number) => (
                      <button key={i} onClick={() => setSelectedService(i)}
                        className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
                          selectedService === i ? "gradient-indigo text-white" : "glass-1 text-foreground"
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Date</p>
                  <input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full px-4 py-3 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
                  />
                </div>

                {/* Time slots */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Time</p>
                  <div className="grid grid-cols-5 gap-2">
                    {TIME_SLOTS.map(t => (
                      <button key={t} onClick={() => setBookingTime(t)}
                        className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                          bookingTime === t ? "gradient-indigo text-white" : "glass-1 text-foreground"
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary + confirm */}
                <div className="glass-1 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="text-foreground font-medium">{provider.servicesOffered[selectedService]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span className="text-foreground font-medium">{bookingDate} at {bookingTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-foreground font-medium">{provider.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                    <span className="text-muted-foreground">Price</span>
                    <span className="text-foreground font-bold">{provider.price}</span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBook}
                  className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
                >
                  Confirm Booking
                </motion.button>
              </>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
