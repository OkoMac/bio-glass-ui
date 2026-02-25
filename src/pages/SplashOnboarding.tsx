import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const onboardingSteps = [
  {
    headline: "Every service you need.",
    sub: "Health. Beauty. Medical. Professional. All in one place.",
    emoji: "🌍",
  },
  {
    headline: "Starts in WhatsApp.",
    sub: "Book anything, anywhere. No app required — unless you want it.",
    emoji: "💬",
  },
  {
    headline: "Your providers, in your pocket.",
    sub: "Routines, meal plans, reminders, progress. All connected.",
    emoji: "🤝",
  },
  {
    headline: "One profile. Every provider.",
    sub: "Your BIO Passport travels with you — across health, beauty, and beyond.",
    emoji: "🛂",
  },
];

const SplashOnboarding = () => {
  const [phase, setPhase] = useState<"splash" | "onboarding" | "auth">("splash");
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  // Splash progress
  useEffect(() => {
    if (phase !== "splash") return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setPhase("onboarding"), 400);
          return 100;
        }
        return p + 2;
      });
    }, 24);
    return () => clearInterval(interval);
  }, [phase]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    } else {
      setPhase("auth");
    }
  };

  const handleAuth = (method: string) => {
    navigate("/");
  };

  // Splash Screen
  if (phase === "splash") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center"
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(99,102,241,0.12) 0%, #0A0A0F 65%)" }}
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-7xl font-bold text-foreground tracking-tight"
        >
          BIO
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-base text-foreground/55 mt-3"
        >
          Every Service. One Platform.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-32 h-0.5 bg-foreground/10 rounded-full mt-6 overflow-hidden"
        >
          <motion.div
            className="h-full gradient-indigo rounded-full"
            style={{ width: `${progress}%` }}
          />
        </motion.div>
      </div>
    );
  }

  // Auth Sheet
  if (phase === "auth") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-end justify-end"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          className="w-full glass-2 rounded-t-[2rem] p-6 space-y-5"
        >
          <div className="flex justify-center">
            <div className="w-8 h-1 rounded-full bg-foreground/20" />
          </div>
          <h2 className="text-xl font-bold text-foreground text-center">Join BIO</h2>
          <p className="text-sm text-muted-foreground text-center">Choose how you'd like to get started</p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAuth("whatsapp")}
            className="w-full rounded-pill py-4 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2"
            style={{ background: "#25D366" }}
          >
            <span>💬</span> Join via WhatsApp
          </motion.button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-foreground/10" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-foreground/10" />
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full name"
              className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-indigo/30"
            />
            <input
              type="email"
              placeholder="Email address"
              className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAuth("email")}
            className="w-full rounded-pill py-4 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Onboarding Steps
  return (
    <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.06) 0%, #0A0A0F 65%)" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-6"
          >
            <motion.span
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-7xl block"
            >
              {onboardingSteps[currentStep].emoji}
            </motion.span>
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              {onboardingSteps[currentStep].headline}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {onboardingSteps[currentStep].sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress + CTA */}
      <div className="px-8 pb-12 space-y-6">
        <div className="flex justify-center gap-2">
          {onboardingSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i <= currentStep ? "w-6 bg-indigo" : "w-1.5 bg-foreground/15"
              }`}
            />
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
        >
          {currentStep < 3 ? "Continue" : "Get Started"}
        </motion.button>

        {currentStep < 3 && (
          <button
            onClick={() => { setCurrentStep(3); setTimeout(() => setPhase("auth"), 0); }}
            className="w-full text-center text-sm text-muted-foreground"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

export default SplashOnboarding;
