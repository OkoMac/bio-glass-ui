import { useState } from "react";
import { motion } from "framer-motion";
import SearchBar from "@/components/SearchBar";
import CategoryChip from "@/components/CategoryChip";
import HeroProviderCard from "@/components/HeroProviderCard";
import ProviderCard from "@/components/ProviderCard";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/GlassCard";
import { Sparkles } from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";
import heroCover1 from "@/assets/hero-cover-1.jpg";
import heroCover2 from "@/assets/hero-cover-2.jpg";

const categories = ["All", "Fitness", "Medical", "Beauty", "Professional", "Free Sessions", "Available Now"];

const heroProviders = [
  {
    id: "lisa",
    name: "Lisa Dlamini",
    specialty: "Personal Trainer",
    rating: 4.9,
    distance: "0.8 km",
    image: provider1,
    coverImage: heroCover1,
    vertical: "teal" as const,
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    specialty: "Beauty & Skincare",
    rating: 4.8,
    distance: "1.5 km",
    image: provider3,
    coverImage: heroCover2,
    vertical: "coral" as const,
  },
];

const forYouProviders = [
  { id: "lisa", name: "Lisa Dlamini", specialty: "Personal Trainer", rating: 4.9, reviews: 128, distance: "0.8 km", nextSlot: "Today 3pm", image: provider1, vertical: "teal" as const },
  { id: "kagiso", name: "Dr. Kagiso Sithole", specialty: "Biokineticist", rating: 4.8, reviews: 95, distance: "1.2 km", nextSlot: "Tomorrow 9am", image: provider2, vertical: "indigo" as const },
  { id: "sarah", name: "Sarah Chen", specialty: "Skincare Specialist", rating: 4.8, reviews: 203, distance: "1.5 km", nextSlot: "Today 5pm", image: provider3, vertical: "coral" as const },
  { id: "amir", name: "Amir Patel", specialty: "Yoga Instructor", rating: 4.7, reviews: 67, distance: "2.1 km", nextSlot: "Wed 7am", image: provider4, vertical: "amber" as const },
];

const freeProviders = [
  { id: "kagiso", name: "Dr. Kagiso Sithole", specialty: "Free Intro — Biokineticist", rating: 4.8, reviews: 95, distance: "1.2 km", nextSlot: "Tomorrow 9am", image: provider2, vertical: "teal" as const, isFree: true },
  { id: "amir", name: "Amir Patel", specialty: "Free Intro — Yoga", rating: 4.7, reviews: 67, distance: "2.1 km", nextSlot: "Wed 7am", image: provider4, vertical: "amber" as const, isFree: true },
  { id: "lisa", name: "Lisa Dlamini", specialty: "Free Intro — PT", rating: 4.9, reviews: 128, distance: "0.8 km", nextSlot: "Thu 4pm", image: provider1, vertical: "teal" as const, isFree: true },
];

const stagger = {
  container: { transition: { staggerChildren: 0.05 } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [heroIndex, setHeroIndex] = useState(0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="mx-auto max-w-lg px-4 pt-12 space-y-6">
        {/* Search */}
        <SearchBar />

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[28px] font-bold text-foreground"
        >
          {getGreeting()}, Oko ☀️
        </motion.h1>

        {/* Category Chips */}
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

        {/* Hero Carousel */}
        <div className="relative -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory">
            {heroProviders.map((provider) => (
              <div key={provider.id} className="snap-center shrink-0 w-[85%]">
                <HeroProviderCard {...provider} />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {heroProviders.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === heroIndex ? "bg-indigo w-4" : "bg-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ServeAI For You */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet" />
            <h2 className="text-lg font-semibold text-foreground">For You</h2>
            <span className="text-xs text-violet">✦</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
            {forYouProviders.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <ProviderCard {...p} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Free Sessions */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Free Sessions Near You</h2>
            <span className="text-xs text-teal">◦</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
            {freeProviders.map((p, i) => (
              <motion.div
                key={`${p.id}-free`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <ProviderCard {...p} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ServeAI Advisory Card */}
        <GlassCard variant="accent-indigo" className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">ServeAI Insight ✦</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on your goals, we recommend adding a yoga session to balance your training routine.
              </p>
              <button className="text-xs text-indigo-light font-medium mt-2">Explore →</button>
            </div>
          </div>
        </GlassCard>

        {/* Available Today */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Open Today</h2>
            <span className="text-xs text-muted-foreground">→</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
            {forYouProviders.filter(p => p.nextSlot?.includes("Today")).map((p, i) => (
              <motion.div
                key={`${p.id}-today`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <ProviderCard {...p} />
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
