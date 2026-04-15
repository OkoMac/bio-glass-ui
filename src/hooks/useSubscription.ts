import { useAuth } from "@/contexts/AuthContext";
import { 
  Subscription, 
  UserType,
  ProviderSubscriptionTier,
  ClientSubscriptionTier,
  hasFeature, 
  isSubscriptionActive,
  getTrialDaysRemaining,
  getTierDisplayName,
  PROVIDER_TIER_FEATURES,
  CLIENT_TIER_FEATURES,
  PROVIDER_TIER_PRICING,
  CLIENT_TIER_PRICING
} from "@/lib/subscription";

export function useSubscription() {
  const { user } = useAuth();
  
  const subscription = user?.subscription;
  const isProvider = user?.role === 'provider';
  const isClient = user?.role === 'client';
  const userType: UserType = isProvider ? 'provider' : 'client';
  
  // Check if user has access to a specific feature
  const canAccess = (feature: keyof typeof PROVIDER_TIER_FEATURES.free): boolean => {
    if (!subscription) return false;
    return hasFeature(subscription, feature);
  };
  
  // Check if subscription is active (paid or in trial)
  const isActive = (): boolean => {
    if (!subscription) return false;
    return isSubscriptionActive(subscription);
  };
  
  // Get trial days remaining (if in trial)
  const trialDaysRemaining = (): number | null => {
    if (!subscription) return null;
    return getTrialDaysRemaining(subscription);
  };
  
  // Get tier display name — default to "Free" when no subscription is loaded
  // so demo users and logged-in users without an active sub see a consistent
  // label across the app (sidebar, billing, gated pages).
  const tierDisplayName = (): string => {
    if (!subscription) return 'Free';
    return getTierDisplayName(subscription.tier, userType);
  };
  
  // Check if user needs to upgrade for a specific feature
  const requiresUpgrade = (feature: keyof typeof PROVIDER_TIER_FEATURES.free): boolean => {
    if (!subscription) return false;
    return !canAccess(feature);
  };
  
  // Get upgrade URL based on current tier and user type
  const getUpgradeUrl = (): string => {
    if (!subscription) return '/pricing';
    
    const currentTier = subscription.tier;
    
    if (userType === 'provider') {
      switch (currentTier as ProviderSubscriptionTier) {
        case 'free':
          return '/provider/billing?upgrade=pro';
        case 'pro':
          return '/provider/billing?upgrade=elite';
        case 'elite':
          return '/provider/billing';
        default:
          return '/pricing';
      }
    } else {
      // Client upgrade path
      switch (currentTier as ClientSubscriptionTier) {
        case 'free':
          return '/billing?upgrade=premium';
        case 'premium':
          return '/billing';
        default:
          return '/pricing';
      }
    }
  };
  
  // Get features that require upgrade (simplified for now)
  const getFeaturesRequiringUpgrade = (): Array<{
    feature: string;
    name: string;
    description: string;
    availableIn: string[];
  }> => {
    if (!subscription) return [];
    
    // Return empty array for now - can be expanded later
    return [];
  };
  
  return {
    subscription,
    isProvider,
    isClient,
    userType,
    canAccess,
    isActive,
    trialDaysRemaining,
    tierDisplayName,
    requiresUpgrade,
    getUpgradeUrl,
    getFeaturesRequiringUpgrade,
    PROVIDER_TIER_FEATURES,
    CLIENT_TIER_FEATURES,
    PROVIDER_TIER_PRICING,
    CLIENT_TIER_PRICING
  };
}