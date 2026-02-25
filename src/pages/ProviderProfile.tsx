import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import BookingSheet from "@/components/BookingSheet";
import { ArrowLeft, Share2, Star, MapPin, Clock, ChevronDown, Play } from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";
import heroCover1 from "@/assets/hero-cover-1.jpg";
import heroCover2 from "@/assets/hero-cover-2.jpg";

const providersData: Record<string, any> = {
  lisa: {
    name: "Lisa Dlamini",
    specialty: "Personal Trainer",
    vertical: "teal" as const,
    rating: 4.9,
    reviews: 128,
    distance: "0.8 km",
    responseTime: "< 5 min",
    experience: "6 years",
    sessions: "1,847",
    image: provider1,
    coverImage: heroCover1,
    bio: "NASM-certified personal trainer specializing in strength training and body transformation. I believe in sustainable fitness that fits your lifestyle.",
    services: [
      { name: "Personal Training", duration: "60 min", price: "R450" },
      { name: "Strength Assessment", duration: "45 min", price: "R350" },
      { name: "Nutrition Consultation", duration: "30 min", price: "R250" },
      { name: "Free Intro Session", duration: "60 min", price: "FREE" },
    ],
    slots: ["Today 3pm", "Today 5pm", "Tomorrow 9am", "Tomorrow 2pm", "Wed 7am"],
    qualifications: ["NASM CPT", "CrossFit L2", "Precision Nutrition"],
  },
  kagiso: {
    name: "Dr. Kagiso Sithole",
    specialty: "Biokineticist",
    vertical: "indigo" as const,
    rating: 4.8,
    reviews: 95,
    distance: "1.2 km",
    responseTime: "< 15 min",
    experience: "8 years",
    sessions: "2,341",
    image: provider2,
    coverImage: heroCover1,
    bio: "Registered biokineticist with a passion for rehabilitation and performance optimization. Working with athletes and post-surgery recovery patients.",
    services: [
      { name: "Assessment", duration: "60 min", price: "R600" },
      { name: "Rehab Session", duration: "45 min", price: "R500" },
      { name: "Sports Performance", duration: "60 min", price: "R550" },
    ],
    slots: ["Tomorrow 9am", "Tomorrow 11am", "Wed 2pm"],
    qualifications: ["BSc Biokinetics", "HPCSA Reg.", "Sports Science"],
  },
  sarah: {
    name: "Sarah Chen",
    specialty: "Skincare Specialist",
    vertical: "coral" as const,
    rating: 4.8,
    reviews: 203,
    distance: "1.5 km",
    responseTime: "< 10 min",
    experience: "5 years",
    sessions: "3,102",
    image: provider3,
    coverImage: heroCover2,
    bio: "Licensed esthetician specializing in advanced skincare treatments. From facials to chemical peels, I help you achieve your best skin.",
    services: [
      { name: "Signature Facial", duration: "75 min", price: "R750" },
      { name: "Chemical Peel", duration: "45 min", price: "R550" },
      { name: "Microdermabrasion", duration: "60 min", price: "R650" },
    ],
    slots: ["Today 5pm", "Tomorrow 10am", "Thu 3pm"],
    qualifications: ["CIDESCO", "Advanced Aesthetics", "Medical Skincare"],
  },
  amir: {
    name: "Amir Patel",
    specialty: "Yoga Instructor",
    vertical: "amber" as const,
    rating: 4.7,
    reviews: 67,
    distance: "2.1 km",
    responseTime: "< 30 min",
    experience: "10 years",
    sessions: "4,520",
    image: provider4,
    coverImage: heroCover2,
    bio: "RYT-500 certified yoga teacher with a decade of experience. Specializing in Vinyasa, Yin, and meditation for modern life balance.",
    services: [
      { name: "Private Yoga", duration: "60 min", price: "R400" },
      { name: "Meditation Session", duration: "30 min", price: "R200" },
      { name: "Group Class", duration: "75 min", price: "R150" },
    ],
    slots: ["Wed 7am", "Wed 5pm", "Thu 7am"],
    qualifications: ["RYT-500", "Yin Yoga Cert.", "Mindfulness Coach"],
  },
};

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const provider = providersData[id || "lisa"];
  const [bookingOpen, setBookingOpen] = useState(false);

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
        <div className="absolute top-12 left-4 right-4 flex justify-between">
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
        <div className="absolute bottom-6 left-4 right-4 flex items-end gap-4">
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
        className="fixed bottom-20 left-4 right-4 z-40 glass-2 rounded-pill px-4 py-3 flex items-center justify-between max-w-lg mx-auto"
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
