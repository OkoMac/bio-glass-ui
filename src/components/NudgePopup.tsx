/**
 * NudgePopup — Layer 4 contextual nudge.
 * Shows ONCE per user per feature. Dismissed state tracked in Supabase profiles.nudges_seen.
 * Billboard rule: one screen, one message, no scrolling.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useOnboardingState } from "@/hooks/useOnboardingState";

interface NudgeContent {
  icon: string;
  title: string;
  subtitle: string;
  bullets: { icon: string; text: string }[];
  cta?: { label: string; action: () => void };
  incentive?: string;
}

const NUDGE_CONTENT: Record<string, NudgeContent> = {
  bionwallet_book: {
    icon: "💰",
    title: "Meet your BIONWallet",
    subtitle: "Load once. Book anywhere. Pay instantly.",
    bullets: [
      { icon: "🔒", text: "Money held safely until sessions complete" },
      { icon: "⚡", text: "Pay providers in one tap" },
      { icon: "↩️", text: "Cancelled in time? Full refund automatically" },
    ],
  },
  bionpoints_earned: {
    icon: "🏆",
    title: "BIONPoints",
    subtitle: "Earn every time you book, move or refer.",
    bullets: [
      { icon: "📈", text: "Earn points on every booking" },
      { icon: "💸", text: "Redeem against future sessions" },
      { icon: "👫", text: "Refer a friend = 200 instant points" },
    ],
  },
  health_tools_first: {
    icon: "📊",
    title: "Know your numbers",
    subtitle: "Professional health tools. Free forever.",
    bullets: [
      { icon: "⚖️", text: "BMI & body composition" },
      { icon: "🔥", text: "Calorie & macro tracker" },
      { icon: "💧", text: "Hydration & sleep scores" },
    ],
    incentive: "Complete 3 checks = +100 BIONPoints 🎁",
  },
  whatsapp_connect: {
    icon: "💬",
    title: "Connect via WhatsApp",
    subtitle: "Get booking updates where you already are.",
    bullets: [
      { icon: "📅", text: "Booking confirmations & reminders" },
      { icon: "🔔", text: "Provider messages in one place" },
      { icon: "🤖", text: "Chat with B_ for instant help" },
    ],
  },
  provider_boost: {
    icon: "🚀",
    title: "Boost your listing",
    subtitle: "Get seen by more clients near you.",
    bullets: [
      { icon: "⭐", text: "Gold badge + priority placement" },
      { icon: "📊", text: "Advanced analytics & insights" },
      { icon: "💬", text: "Client CRM & messaging" },
    ],
  },
  corporate_points: {
    icon: "🏢",
    title: "Employee Wellness Budget",
    subtitle: "Allocate BIONPoints per employee.",
    bullets: [
      { icon: "💰", text: "Set monthly budgets by department" },
      { icon: "📊", text: "Track spend vs engagement" },
      { icon: "🔒", text: "Aggregate reports only — individual privacy protected" },
    ],
  },
  ranger_pipeline: {
    icon: "⚡",
    title: "Your Ranger Pipeline",
    subtitle: "Track leads, earn commissions.",
    bullets: [
      { icon: "📋", text: "Move leads through stages" },
      { icon: "💰", text: "20% of provider subscriptions — perpetual" },
      { icon: "📈", text: "2% of every booking by your providers" },
    ],
  },
};

interface NudgePopupProps {
  featureKey: string;
  onAction?: () => void;
}

export default function NudgePopup({ featureKey, onAction }: NudgePopupProps) {
  const { hasSeenNudge, markNudgeSeen } = useOnboardingState();
  const content = NUDGE_CONTENT[featureKey];

  if (!content || hasSeenNudge(featureKey)) return null;

  const dismiss = () => {
    markNudgeSeen(featureKey);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" onClick={dismiss} />

        {/* Card — billboard rule: no scrolling, one message */}
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm glass-2 rounded-2xl border border-white/10 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full glass-1 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8 text-center">
            <div className="text-4xl mb-3">{content.icon}</div>
            <h3 className="text-lg font-bold text-foreground mb-1">{content.title}</h3>
            <p className="text-sm text-muted-foreground mb-5">{content.subtitle}</p>

            {/* Bullets */}
            <div className="space-y-3 text-left mb-5">
              {content.bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base shrink-0 mt-0.5">{b.icon}</span>
                  <span className="text-sm text-foreground">{b.text}</span>
                </div>
              ))}
            </div>

            {/* Incentive */}
            {content.incentive && (
              <p className="text-xs font-semibold text-teal mb-4">{content.incentive}</p>
            )}

            {/* CTA */}
            <button
              onClick={() => {
                dismiss();
                content.cta?.action?.();
                onAction?.();
              }}
              className="w-full py-3 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
            >
              {content.cta?.label ?? "Got it"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to gate a nudge at any feature entry point.
 * Usage:
 *   const { show, dismiss } = useNudge('bionwallet_book');
 *   {show && <NudgePopup featureKey="bionwallet_book" onDismiss={dismiss} />}
 */
export function useNudge(featureKey: string) {
  const { hasSeenNudge, markNudgeSeen } = useOnboardingState();
  const show = !hasSeenNudge(featureKey);
  const dismiss = () => markNudgeSeen(featureKey);
  return { show, dismiss };
}
