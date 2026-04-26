/**
 * DeeperDive — Layer 3.
 * Shows ONCE on the user's second login (24hrs+ after first).
 * 3 billboard screens: BIONWallet → BIONPoints → Health Tools.
 * Tracked via profiles.layer3_complete in Supabase.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingState } from "@/hooks/useOnboardingState";

const SCREENS = [
  {
    icon: "💰",
    title: "Meet your BIONWallet",
    subtitle: "Load once. Book anywhere. Pay instantly.",
    items: [
      { icon: "🔒", text: "Money held safely until sessions complete" },
      { icon: "⚡", text: "Pay providers in one tap" },
      { icon: "↩️", text: "Cancel 24h+ early: 90% refund. Late: 50% refund." },
    ],
  },
  {
    icon: "🏆",
    title: "BIONPoints",
    subtitle: "Earn every time you book, move or refer.",
    items: [
      { icon: "📈", text: "Earn points on every booking" },
      { icon: "💸", text: "Redeem against future sessions" },
      { icon: "👫", text: "Refer a friend = 200 instant points" },
    ],
  },
  {
    icon: "📊",
    title: "Know your numbers",
    subtitle: "Professional health tools. Free forever.",
    items: [
      { icon: "⚖️", text: "BMI & body composition" },
      { icon: "🔥", text: "Calorie & macro tracker" },
      { icon: "💧", text: "Hydration & sleep scores" },
    ],
    incentive: "Complete 3 checks = +100 BIONPoints 🎁",
    cta: "Explore my tools →",
  },
];

export default function DeeperDive() {
  const { shouldShowLayer3, completeLayer } = useOnboardingState();
  const [step, setStep] = useState(0);

  if (!shouldShowLayer3) return null;

  const screen = SCREENS[step];
  const isLast = step === SCREENS.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeLayer(3);
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}>

      <div className="w-full max-w-sm px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="text-center space-y-5"
          >
            {/* Icon */}
            <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-5xl block">
              {screen.icon}
            </motion.span>

            {/* Title + subtitle */}
            <h2 className="text-2xl font-bold text-foreground">{screen.title}</h2>
            <p className="text-sm text-muted-foreground">{screen.subtitle}</p>

            {/* Items */}
            <div className="space-y-2.5 text-left pt-1">
              {screen.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 glass-1 rounded-xl px-4 py-3 border border-white/5"
                >
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <span className="text-sm text-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Incentive */}
            {screen.incentive && (
              <p className="text-xs font-semibold text-teal pt-1">{screen.incentive}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress + CTA */}
        <div className="mt-8 space-y-4">
          <div className="flex justify-center gap-2">
            {SCREENS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= step ? "w-6 bg-indigo" : "w-1.5 bg-foreground/15"}`} />
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            {isLast ? (screen.cta ?? "Done") : "Next →"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
