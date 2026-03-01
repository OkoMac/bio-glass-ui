import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Zap, Clock, MapPin } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import BookingSheet from "@/components/BookingSheet";
import GlassCard from "@/components/GlassCard";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

const AVAILABLE_NOW = [
  {
    id: "lisa",
    name: "Lisa Dlamini",
    specialty: "Personal Trainer",
    nextSlot: "Today 3:00 pm",
    distance: "0.8 km",
    rating: 4.9,
    image: provider1,
    vertical: "teal" as const,
    services: [
      { name: "Personal Training Session", duration: "60 min", price: "R400" },
      { name: "Free Intro Session",         duration: "30 min", price: "Free" },
      { name: "Strength Assessment",        duration: "45 min", price: "R300" },
    ],
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    specialty: "Skincare Specialist",
    nextSlot: "Today 5:00 pm",
    distance: "1.5 km",
    rating: 4.8,
    image: provider3,
    vertical: "coral" as const,
    services: [
      { name: "Facial Treatment",  duration: "75 min", price: "R650" },
      { name: "Express Facial",    duration: "30 min", price: "R350" },
      { name: "Skin Consultation", duration: "20 min", price: "Free" },
    ],
  },
  {
    id: "kagiso",
    name: "Dr. Kagiso Sithole",
    specialty: "Biokineticist",
    nextSlot: "Today 4:30 pm",
    distance: "1.2 km",
    rating: 4.8,
    image: provider2,
    vertical: "indigo" as const,
    services: [
      { name: "Bio Assessment",      duration: "60 min", price: "R550" },
      { name: "Free Intro Consult",  duration: "30 min", price: "Free" },
      { name: "Rehab Session",       duration: "45 min", price: "R400" },
    ],
  },
  {
    id: "amir",
    name: "Amir Patel",
    specialty: "Yoga Instructor",
    nextSlot: "Today 6:00 pm",
    distance: "2.1 km",
    rating: 4.7,
    image: provider4,
    vertical: "amber" as const,
    services: [
      { name: "Vinyasa Flow",     duration: "60 min", price: "R280" },
      { name: "Free Intro Class", duration: "30 min", price: "Free" },
      { name: "Private Session",  duration: "60 min", price: "R380" },
    ],
  },
];

const VERTICAL_ACCENT: Record<string, string> = {
  teal:   "bg-[rgba(13,148,136,0.12)] text-teal  border-teal/20",
  coral:  "bg-[rgba(240,90,40,0.12)]  text-coral border-coral/20",
  indigo: "bg-[rgba(99,102,241,0.12)] text-indigo border-indigo/20",
  amber:  "bg-[rgba(245,158,11,0.12)] text-amber  border-amber/20",
};

export default function QuickBook() {
  const [selectedProvider, setSelectedProvider] = useState<typeof AVAILABLE_NOW[number] | null>(null);
  const [prompt, setPrompt] = useState("");

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="max-w-lg mx-auto px-4 pt-12 space-y-5">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full gradient-indigo flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white"/>
            </div>
            <h1 className="text-[22px] font-bold text-foreground">Quick Book</h1>
          </div>
          <p className="text-xs text-muted-foreground">Available providers right now · Book in 30 seconds</p>
        </div>

        {/* ServeAI prompt */}
        <GlassCard className="p-3 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-violet shrink-0"/>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder='Try "yoga near me" or "facial today"…'
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {prompt && (
            <button onClick={() => setPrompt("")} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5"/>
            </button>
          )}
        </GlassCard>

        {/* Available now list */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse"/>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Today</p>
          </div>

          <motion.div className="space-y-2.5" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 }}}}>
            {AVAILABLE_NOW.map(provider => (
              <motion.div
                key={provider.id}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                whileTap={{ scale: 0.98 }}
              >
                <GlassCard
                  className="p-3.5 cursor-pointer hover:border-white/10 transition-all"
                  onClick={() => setSelectedProvider(provider)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{provider.name}</p>
                          <p className="text-xs text-muted-foreground">{provider.specialty}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${VERTICAL_ACCENT[provider.vertical]}`}>
                          ⭐ {provider.rating}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[11px] text-teal">
                          <Clock className="w-2.5 h-2.5"/>{provider.nextSlot}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="w-2.5 h-2.5"/>{provider.distance}
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold gradient-teal text-white"
                    >
                      Book
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* BookingSheet */}
      <AnimatePresence>
        {selectedProvider && (
          <BookingSheet
            open={true}
            onClose={() => setSelectedProvider(null)}
            provider={selectedProvider}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
