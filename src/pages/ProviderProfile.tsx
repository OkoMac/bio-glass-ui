import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Share2, Star, MapPin, Clock, Lock, CreditCard, Shield, Mail, Phone, Globe, Building } from "lucide-react";
import { getProviderImage, getProviderCover } from "@/lib/providerImages";
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
  const [showAllServices, setShowAllServices] = useState(false);

  const provider = PROVIDERS[id ?? ""];
  const isSignedIn = !!user;

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
    <div className="min-h-screen bg-obsidian pb-28">
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
          <motion.button whileTap={{ scale: 0.9 }} className="glass-2 rounded-full w-10 h-10 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-foreground" />
          </motion.button>
        </div>

        {/* Identity */}
        <div className="absolute bottom-6 left-4 right-4 flex items-end gap-4">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <BioAvatar src={provider.image} alt={provider.name} size="xl" verticalColor={provider.vertical} verified />
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
            onClick={() => navigate("/quick-book")}
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
          onClick={() => isSignedIn ? navigate("/quick-book") : navigate("/welcome")}
          className="rounded-pill px-6 py-3 text-[13px] md:text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
        >
          {isSignedIn ? "Book Now" : "Sign Up to Book"}
        </motion.button>
      </motion.div>
    </div>
  );
}
