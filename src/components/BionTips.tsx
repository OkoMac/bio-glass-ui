import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, ChevronRight } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useNavigate } from "react-router-dom";

/* ─── Tip definition ─────────────────────────────────────────────── */

interface Tip {
  id: string;
  message: string;
  /** Optional route to navigate to when the user taps the tip */
  action?: string;
  /** Condition key checked against user state */
  condition: string;
}

/* ─── Tip banks per context ──────────────────────────────────────── */

const HOME_TIPS: Tip[] = [
  { id: "home-food",      condition: "no_food",      message: "Track what you eat — I can analyse a photo of your meal and count calories instantly.",  action: "/food-tracker" },
  { id: "home-water",     condition: "no_water",     message: "Staying hydrated? Tap Water to track your daily intake.",                                action: "/water-tracker" },
  { id: "home-sleep",     condition: "no_sleep",     message: "Log your sleep to unlock weekly patterns and insights from me.",                          action: "/sleep-tracker" },
  { id: "home-booking",   condition: "no_bookings",  message: "Explore 13,300+ professionals near you — I'll help you find the right fit for your goals.",    action: "/directory" },
  { id: "home-location",  condition: "no_location",  message: "Set your location so I can show you providers nearest to you.",                           action: "/settings" },
  { id: "home-medcard",   condition: "no_medcard",   message: "Your digital medical card is ready — fill it in so providers have your info on hand.",   action: "/medical-card" },
  { id: "home-bmi",       condition: "no_bmi",       message: "Check your BMI — it takes 10 seconds and helps track your wellness journey.",            action: "/tools/bmi-calculator" },
];

const PROVIDER_TIPS: Tip[] = [
  { id: "prov-services",  condition: "no_services",  message: "Add your first service so clients can book you.",                                        action: "/pro/services" },
  { id: "prov-avail",     condition: "no_avail",     message: "Set your weekly hours — clients can only book when you're available.",                    action: "/pro/settings?tab=profile" },
  { id: "prov-bank",      condition: "no_bank",      message: "Connect your bank account to receive payouts.",                                          action: "/pro/settings?tab=billing" },
  { id: "prov-photo",     condition: "no_photo",     message: "Providers with photos get 3x more bookings — upload yours now.",                         action: "/pro/settings?tab=profile" },
  { id: "prov-verify",    condition: "no_verify",    message: "Upload your documents to get the verified badge.",                                       action: "/pro/verification" },
];

const DIRECTORY_TIPS: Tip[] = [
  { id: "dir-callouts",   condition: "always",       message: "Did you know? Use the Callouts filter to find providers who come to you." },
  { id: "dir-favorites",  condition: "always",       message: "Tap the heart on any provider to save them to your Favorites." },
];

/* ─── State readers ──────────────────────────────────────────────── */

function readLS(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function readLSJson(key: string): any {
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
}

/** Check which conditions are met (i.e. user has NOT done the thing) */
function evaluateConditions(): Set<string> {
  const met = new Set<string>();
  const today = new Date().toISOString().slice(0, 10);

  // Food
  const foodEntries = readLSJson("bion_food_entries");
  if (!foodEntries || (Array.isArray(foodEntries) && foodEntries.length === 0)) met.add("no_food");

  // Water
  const water = parseInt(readLS(`bion_water_${today}`) ?? "0", 10);
  if (water === 0) met.add("no_water");

  // Sleep
  const sleepData = readLSJson("bion_sleep_tracker");
  if (!sleepData || (typeof sleepData === "object" && Object.keys(sleepData).length === 0)) met.add("no_sleep");

  // Bookings
  const bookings = readLSJson("bion_bookings");
  if (!bookings || (Array.isArray(bookings) && bookings.length === 0)) met.add("no_bookings");

  // Location
  const geo = readLS("bion_geo_permitted");
  if (geo !== "1" && geo !== "true") met.add("no_location");

  // Medical card
  const medcard = readLSJson("bion_medical_card");
  if (!medcard || (typeof medcard === "object" && Object.keys(medcard).length === 0)) met.add("no_medcard");

  // BMI
  const bmi = readLS("bion_bmi_result");
  if (!bmi) met.add("no_bmi");

  // Provider signals
  const services = readLSJson("bion_provider_services");
  if (!services || (Array.isArray(services) && services.length === 0)) met.add("no_services");

  const avail = readLSJson("bion_provider_availability");
  if (!avail || (Array.isArray(avail) && avail.length === 0)) met.add("no_avail");

  const bank = readLS("bion_provider_bank");
  if (!bank) met.add("no_bank");

  const photo = readLS("bion_provider_photo");
  if (!photo) met.add("no_photo");

  const verify = readLS("bion_provider_verified");
  if (verify !== "1" && verify !== "true") met.add("no_verify");

  // Always-show conditions
  met.add("always");

  return met;
}

function isDismissed(tipId: string): boolean {
  try { return localStorage.getItem(`bion_tips_dismissed_${tipId}`) === "1"; } catch { return false; }
}

function dismissTip(tipId: string) {
  try { localStorage.setItem(`bion_tips_dismissed_${tipId}`, "1"); } catch { /* ignore */ }
}

/* ─── Props ──────────────────────────────────────────────────────── */

export type BionTipsContext = "home" | "provider" | "directory";

interface BionTipsProps {
  context: BionTipsContext;
  className?: string;
}

/* ─── Component ──────────────────────────────────────────────────── */

export default function BionTips({ context, className }: BionTipsProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [conditions, setConditions] = useState<Set<string>>(new Set());

  // Evaluate conditions on mount
  useEffect(() => {
    setConditions(evaluateConditions());
  }, []);

  // Pick the tip bank
  const tipBank = useMemo(() => {
    if (context === "home")      return HOME_TIPS;
    if (context === "provider")  return PROVIDER_TIPS;
    if (context === "directory") return DIRECTORY_TIPS;
    return [];
  }, [context]);

  // Filter to tips whose conditions are met and that haven't been dismissed
  const availableTips = useMemo(() => {
    return tipBank.filter(
      t => conditions.has(t.condition) && !isDismissed(t.id) && !dismissed.has(t.id)
    );
  }, [tipBank, conditions, dismissed]);

  // Show only the first available tip (max 1 per page)
  const currentTip = availableTips[0] ?? null;

  const handleDismiss = (tipId: string) => {
    dismissTip(tipId);
    setDismissed(prev => new Set([...prev, tipId]));
  };

  if (!currentTip) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentTip.id}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className={className}
      >
        <GlassCard variant="glass-2" className="p-4 rounded-2xl relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-teal/10 blur-2xl pointer-events-none" />

          <div className="flex items-start gap-3">
            {/* B_ avatar */}
            <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-teal/20 to-indigo/20 border border-white/[0.08] flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-teal" style={{ filter: "drop-shadow(0 0 4px rgba(13,148,136,0.5))" }} />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <p className="text-[11px] text-teal font-semibold tracking-wide uppercase mb-1">
                B_ says
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                {currentTip.message}
              </p>

              {currentTip.action && (
                <button
                  onClick={() => navigate(currentTip.action!)}
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-indigo hover:text-indigo/80 transition-colors"
                >
                  Let's go
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => handleDismiss(currentTip.id)}
              aria-label="Dismiss tip"
              className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
