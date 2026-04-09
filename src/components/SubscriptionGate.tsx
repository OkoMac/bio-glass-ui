import { motion } from "framer-motion";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { useSubscription } from "@/hooks/useSubscription";
import type { SubscriptionFeatures } from "@/lib/subscription";

interface SubscriptionGateProps {
  feature: keyof SubscriptionFeatures;
  featureName: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Wraps content that requires a subscription feature.
 * If the user has access, renders children normally.
 * If not, shows an upgrade prompt instead.
 *
 * Usage:
 *   <SubscriptionGate feature="messaging" featureName="Messaging">
 *     <MessagingPage />
 *   </SubscriptionGate>
 */
export default function SubscriptionGate({ feature, featureName, description, children }: SubscriptionGateProps) {
  const { canAccess, tierDisplayName, getUpgradeUrl, isProvider } = useSubscription();
  const navigate = useNavigate();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  const currentTier = tierDisplayName();
  const upgradeUrl = getUpgradeUrl();
  const nextTier = isProvider
    ? currentTier === "Free" ? "Pro (R499/month)" : "Elite (R999/month)"
    : "Premium (R99/month)";

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <GlassCard className="max-w-sm w-full p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo to-violet flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">{featureName}</h2>
        <p className="text-sm text-muted-foreground mb-1">
          {description ?? `This feature requires a subscription upgrade.`}
        </p>
        <p className="text-xs text-muted-foreground mb-5">
          You're on the <span className="text-foreground font-medium">{currentTier}</span> plan.
          Upgrade to <span className="text-teal font-medium">{nextTier}</span> to unlock.
        </p>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => navigate(upgradeUrl)}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo to-violet flex items-center justify-center gap-2">
          <Crown className="w-4 h-4" /> Upgrade Now <ArrowRight className="w-4 h-4" />
        </motion.button>
        {isProvider && (
          <p className="text-[10px] text-muted-foreground mt-3">
            Bookings are always free. Upgrade to access analytics, messaging, programmes, and more.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
