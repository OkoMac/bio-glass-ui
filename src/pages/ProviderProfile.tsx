import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import BookingSheet from "@/components/BookingSheet";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Share2, Star, MapPin, Clock, ChevronDown, Play, Lock, CreditCard, Shield } from "lucide-react";
import { getProviderImage, getProviderCover } from "@/lib/providerImages";

// Import real Pretoria data
import realData from "@/data/bion_pretoria_data.json";

// Generate real provider profiles from Pretoria data
const generateRealProviderData = () => {
  const data: Record<string, any> = {};
  const verticals = ["teal", "indigo", "coral", "amber"] as const;
  const distances = ["0.8 km", "1.2 km", "1.5 km", "2.1 km", "3.0 km"];
  const responseTimes = ["< 5 min", "< 10 min", "< 15 min", "< 30 min"];
  const slots = ["Today 3pm", "Today 5pm", "Tomorrow 9am", "Tomorrow 2pm", "Wed 7am", "Thu 9am"];
  
  // Use first 4 real providers for demo
  realData.providers.slice(0, 4).forEach((provider, index) => {
    const providerId = provider.id.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    data[providerId] = {
      name: provider.name,
      specialty: provider.service,
      vertical: verticals[index % verticals.length],
      rating: provider.rating,
      reviews: provider.reviewCount,
      distance: distances[index % distances.length],
      responseTime: responseTimes[index % responseTimes.length],
      experience: `${provider.experienceYears || 3 + index} years`,
      sessions: `${Math.floor(provider.reviewCount * 3.5)}`, // Estimate from reviews
      image: getProviderImage(provider.id),
      coverImage: getProviderCover(provider.id),
      bio: provider.description || `Professional ${provider.service} provider based in ${provider.location}. ${provider.specialization ? `Specializing in ${provider.specialization}.` : ''}`,
      services: [
        { 
          name: provider.service, 
          duration: provider.duration || "60 min", 
          price: provider.price 
        },
        ...(provider.servicesOffered?.slice(1, 3) || []).map((service, i) => ({
          name: service,
          duration: ["45 min", "60 min", "75 min"][i % 3],
          price: `R${Math.floor(parseInt(provider.price.replace('R', '').replace(',', '')) * (0.7 + i * 0.15))}`
        }))
      ],
      slots: slots.slice(index, index + 3),
      qualifications: provider.qualifications || [
        "Certified Professional",
        "First Aid Certified",
        ...(provider.languages || []).map(lang => `${lang} Speaking`)
      ],
      // Real contact info from data (will be hidden until signup)
      realContact: {
        email: provider.contact?.email,
        phone: provider.contact?.phone,
        website: provider.contact?.website,
        address: provider.address,
        location: provider.location
      }
    };
  });
  
  return data;
};

const providersData = generateRealProviderData();

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const provider = providersData[id || Object.keys(providersData)[0]];
  const [bookingOpen, setBookingOpen] = useState(false);
  
  const isSignedIn = !!user;
  const isDemoAccount = user?.email?.includes('demo') || user?.name?.includes('Demo') || false;

  if (!provider) {
    return <div className="min-h-screen bg-obsidian flex items-center justify-center text-foreground">Provider not found</div>;
  }

  return (
    <div className="min-h-screen bg-obsidian pb-24">
      {/* Hero Cover */}
      <div className="relative h-[350px] overflow-hidden">
        <motion.img
          src={provider.coverImage}
          alt={provider.name}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-obsidian/20" />

        {/* Nav buttons */}
        <div className="absolute top-12 left-4 right-4 md:left-8 md:right-8 xl:left-12 xl:right-12 flex justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="glass-2 rounded-full w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="glass-2 rounded-full w-10 h-10 flex items-center justify-center"
          >
            <Share2 className="w-5 h-5 text-foreground" />
          </motion.button>
        </div>

        {/* Identity */}
        <div className="absolute bottom-6 left-4 right-4 md:left-8 md:right-8 xl:left-12 xl:right-12 flex items-end gap-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
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

      <div className="px-4 space-y-4 mt-4 max-w-lg mx-auto">
        {/* Quick Stats */}
        <GlassCard className="flex divide-x divide-foreground/10">
          {[
            { label: "Response", value: provider.responseTime },
            { label: "Experience", value: provider.experience },
            { label: "Sessions", value: provider.sessions },
          ].map((stat) => (
            <div key={stat.label} className="flex-1 py-3 text-center">
              <p className="font-data text-base text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </GlassCard>

        {/* Next Available Slots */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Next Available</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {provider.slots.map((slot: string, i: number) => (
              <motion.button
                key={slot}
                whileTap={{ scale: 0.95 }}
                className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-medium ${
                  i === 0 ? "glass-accent-teal text-teal" : "glass-1 text-muted-foreground"
                }`}
              >
                {slot}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Book Now CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setBookingOpen(true)}
          className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
        >
          Book a Session
        </motion.button>

        {/* Services */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Services</h2>
          <div className="space-y-2">
            {provider.services.map((service: any) => (
              <GlassCard key={service.name} hover className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{service.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{service.duration}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-data text-sm ${service.price === "FREE" ? "text-amber" : "text-foreground"}`}>
                    {service.price}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Contact Details (Only shown when signed in) */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Contact Details</h2>
          <GlassCard className="p-4">
            {isSignedIn ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm text-foreground">{provider.realContact?.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm text-foreground">{provider.realContact?.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="text-sm text-foreground">{provider.realContact?.location || "Not provided"}</p>
                </div>
                {provider.realContact?.website && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Website</p>
                    <a 
                      href={provider.realContact.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-indigo hover:underline"
                    >
                      {provider.realContact.website}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Lock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Sign up to view contact details</h3>
                <p className="text-xs text-muted-foreground">
                  Create a free account to get contact information and book appointments
                </p>
                <button 
                  onClick={() => navigate('/onboarding/signup')}
                  className="mt-3 px-4 py-2 gradient-indigo rounded-pill text-sm font-medium text-white"
                >
                  Sign Up Free
                </button>
              </div>
            )}
          </GlassCard>
        </section>

        {/* Payment Encouragement */}
        <GlassCard variant="accent-indigo" className="p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-indigo shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Secure Advance Payment</h3>
              <p className="text-xs text-muted-foreground">
                Book with confidence by paying in advance. Your payment is held securely until your appointment is completed.
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

        {/* About */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{provider.bio}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {provider.qualifications.map((q: string) => (
              <span key={q} className="glass-1 rounded-pill px-3 py-1 text-xs text-muted-foreground">
                {q}
              </span>
            ))}
          </div>
        </section>

        {/* Gallery placeholder */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Gallery</h2>
          <div className="grid grid-cols-2 gap-2">
            {[provider.image, provider.coverImage].map((img, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>

        {/* Free Intro Banner */}
        {provider.services.some((s: any) => s.price === "FREE") && (
          <GlassCard variant="accent-amber" className="p-4">
            <p className="text-sm font-semibold text-amber">Get 1 Free Hour ◦</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a complimentary intro session — no commitment required.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="mt-3 rounded-pill px-4 py-2 text-xs font-semibold gradient-amber text-obsidian"
            >
              Book Free Session
            </motion.button>
          </GlassCard>
        )}
      </div>

      {/* Sticky bottom bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-20 left-4 right-4 md:left-8 md:right-8 xl:left-12 xl:right-12 z-40 glass-2 rounded-pill px-4 py-3 flex items-center justify-between"
      >
        <span className="text-sm text-muted-foreground">
          From <span className="font-data text-foreground">{provider.services[0]?.price}</span>
        </span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setBookingOpen(true)}
          className="rounded-pill px-5 py-2 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
        >
          Book Now
        </motion.button>
      </motion.div>

      <BookingSheet open={bookingOpen} onClose={() => setBookingOpen(false)} provider={provider} />
      <BottomNav />
    </div>
  );
};

export default ProviderProfile;
