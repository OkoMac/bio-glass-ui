// Subscription types and utilities for BION platform

export type UserType = 'provider' | 'client';
export type ProviderSubscriptionTier = 'free' | 'pro' | 'elite';
export type ClientSubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'canceled' | 'expired';

export interface Subscription {
  userType: UserType;
  tier: ProviderSubscriptionTier | ClientSubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null; // When current billing period ends
  trialEnd: Date | null; // When trial period ends (if applicable)
  features: SubscriptionFeatures;
}

export interface SubscriptionFeatures {
  // Provider-specific features
  maxListings: number; // 0 = unlimited
  featuredListing: boolean;
  messaging: boolean;
  clientNotifications: boolean;
  advanceBooking: boolean;
  bookingManagement: boolean;
  calendarSync: boolean;
  basicAnalytics: boolean;
  advancedAnalytics: boolean;
  revenueReports: boolean;
  emailSupport: boolean;
  prioritySupport: boolean;
  dedicatedAccountManager: boolean;
  whiteLabel: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  
  // Client-specific features
  healthTracking: boolean;
  advancedMetrics: boolean;
  progressAnalytics: boolean;
  customHealthGoals: boolean;
  healthReportGeneration: boolean;
  wearableIntegration: boolean;
  premiumClientSupport: boolean;
  unlimitedHealthHistory: boolean;
  mealPlanTracking: boolean;
  workoutPlanTracking: boolean;
  biometricTracking: boolean;
  healthReminders: boolean;
}

// Provider feature sets for each tier
export const PROVIDER_TIER_FEATURES: Record<ProviderSubscriptionTier, SubscriptionFeatures> = {
  free: {
    maxListings: 1,
    featuredListing: false,
    messaging: false,
    clientNotifications: false,
    advanceBooking: false,
    bookingManagement: false,
    calendarSync: false,
    basicAnalytics: false,
    advancedAnalytics: false,
    revenueReports: false,
    emailSupport: false,
    prioritySupport: false,
    dedicatedAccountManager: false,
    whiteLabel: false,
    customBranding: false,
    apiAccess: false,
    // Client features (not applicable for providers, set to false)
    healthTracking: false,
    advancedMetrics: false,
    progressAnalytics: false,
    customHealthGoals: false,
    healthReportGeneration: false,
    wearableIntegration: false,
    premiumClientSupport: false,
    unlimitedHealthHistory: false,
    mealPlanTracking: false,
    workoutPlanTracking: false,
    biometricTracking: false,
    healthReminders: false,
  },
  pro: {
    maxListings: 5,
    featuredListing: true,
    messaging: true,
    clientNotifications: true,
    advanceBooking: true,
    bookingManagement: true,
    calendarSync: true,
    basicAnalytics: true,
    advancedAnalytics: false,
    revenueReports: false,
    emailSupport: true,
    prioritySupport: false,
    dedicatedAccountManager: false,
    whiteLabel: false,
    customBranding: false,
    apiAccess: false,
    // Client features (not applicable for providers, set to false)
    healthTracking: false,
    advancedMetrics: false,
    progressAnalytics: false,
    customHealthGoals: false,
    healthReportGeneration: false,
    wearableIntegration: false,
    premiumClientSupport: false,
    unlimitedHealthHistory: false,
    mealPlanTracking: false,
    workoutPlanTracking: false,
    biometricTracking: false,
    healthReminders: false,
  },
  elite: {
    maxListings: 0, // Unlimited
    featuredListing: true,
    messaging: true,
    clientNotifications: true,
    advanceBooking: true,
    bookingManagement: true,
    calendarSync: true,
    basicAnalytics: true,
    advancedAnalytics: true,
    revenueReports: true,
    emailSupport: true,
    prioritySupport: true,
    dedicatedAccountManager: true,
    whiteLabel: true,
    customBranding: true,
    apiAccess: true,
    // Client features (not applicable for providers, set to false)
    healthTracking: false,
    advancedMetrics: false,
    progressAnalytics: false,
    customHealthGoals: false,
    healthReportGeneration: false,
    wearableIntegration: false,
    premiumClientSupport: false,
    unlimitedHealthHistory: false,
    mealPlanTracking: false,
    workoutPlanTracking: false,
    biometricTracking: false,
    healthReminders: false,
  },
};

// Client feature sets for each tier
export const CLIENT_TIER_FEATURES: Record<ClientSubscriptionTier, SubscriptionFeatures> = {
  free: {
    // Provider features (not applicable for clients, set to false)
    maxListings: 0,
    featuredListing: false,
    messaging: false,
    clientNotifications: false,
    advanceBooking: false,
    bookingManagement: false,
    calendarSync: false,
    basicAnalytics: false,
    advancedAnalytics: false,
    revenueReports: false,
    emailSupport: false,
    prioritySupport: false,
    dedicatedAccountManager: false,
    whiteLabel: false,
    customBranding: false,
    apiAccess: false,
    // Client features - Basic health tracking is free
    healthTracking: true, // Basic health tracking is free
    advancedMetrics: false, // Advanced metrics require premium
    progressAnalytics: false, // Progress analytics require premium
    customHealthGoals: false, // Custom goals require premium
    healthReportGeneration: false, // Report generation requires premium
    wearableIntegration: false, // Wearable integration requires premium
    premiumClientSupport: false, // Premium support requires premium
    unlimitedHealthHistory: false, // Unlimited history requires premium
    mealPlanTracking: false, // Meal plan tracking requires premium
    workoutPlanTracking: false, // Workout plan tracking requires premium
    biometricTracking: false, // Biometric tracking requires premium
    healthReminders: false, // Health reminders require premium
  },
  premium: {
    // Provider features (not applicable for clients, set to false)
    maxListings: 0,
    featuredListing: false,
    messaging: false,
    clientNotifications: false,
    advanceBooking: false,
    bookingManagement: false,
    calendarSync: false,
    basicAnalytics: false,
    advancedAnalytics: false,
    revenueReports: false,
    emailSupport: false,
    prioritySupport: false,
    dedicatedAccountManager: false,
    whiteLabel: false,
    customBranding: false,
    apiAccess: false,
    // Client features - All health tracking features included
    healthTracking: true,
    advancedMetrics: true,
    progressAnalytics: true,
    customHealthGoals: true,
    healthReportGeneration: true,
    wearableIntegration: true,
    premiumClientSupport: true,
    unlimitedHealthHistory: true,
    mealPlanTracking: true,
    workoutPlanTracking: true,
    biometricTracking: true,
    healthReminders: true,
  },
};

// Provider pricing information
export const PROVIDER_TIER_PRICING: Record<ProviderSubscriptionTier, { monthly: number; yearly: number; description: string }> = {
  free: {
    monthly: 0,
    yearly: 0,
    description: 'Basic listing only'
  },
  pro: {
    monthly: 499, // R499/month
    yearly: 4799, // R4799/year (20% discount)
    description: 'Full platform access'
  },
  elite: {
    monthly: 999, // R999/month
    yearly: 9599, // R9599/year (20% discount)
    description: 'Enterprise features + white-label'
  },
};

// Client pricing information
export const CLIENT_TIER_PRICING: Record<ClientSubscriptionTier, { monthly: number; yearly: number; description: string }> = {
  free: {
    monthly: 0,
    yearly: 0,
    description: 'Free platform access + basic health tracking'
  },
  premium: {
    monthly: 100, // R100/month
    yearly: 999, // R999/year (17% discount)
    description: 'All advanced health tracking features'
  },
};

// Check if user has access to a specific feature
export function hasFeature(
  subscription: Subscription | null, 
  feature: keyof SubscriptionFeatures
): boolean {
  if (!subscription) return false;
  return subscription.features[feature];
}

// Get subscription tier name for display
export function getTierDisplayName(tier: ProviderSubscriptionTier | ClientSubscriptionTier, userType: UserType = 'provider'): string {
  if (userType === 'client') {
    const clientNames: Record<ClientSubscriptionTier, string> = {
      free: 'Free',
      premium: 'Premium'
    };
    return clientNames[tier as ClientSubscriptionTier];
  } else {
    const providerNames: Record<ProviderSubscriptionTier, string> = {
      free: 'Free',
      pro: 'Pro',
      elite: 'Elite'
    };
    return providerNames[tier as ProviderSubscriptionTier];
  }
}

// Check if subscription is active (paid or in trial)
export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  
  const now = new Date();
  
  // Check trial period
  if (subscription.status === 'trial' && subscription.trialEnd) {
    return subscription.trialEnd > now;
  }
  
  // Check active subscription
  return subscription.status === 'active' || subscription.status === 'trial';
}

// Get days remaining in trial
export function getTrialDaysRemaining(subscription: Subscription | null): number | null {
  if (!subscription || subscription.status !== 'trial' || !subscription.trialEnd) {
    return null;
  }
  
  const now = new Date();
  const trialEnd = new Date(subscription.trialEnd);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

// Create a default free subscription based on user type
export function createDefaultSubscription(userType: UserType = 'provider'): Subscription {
  if (userType === 'client') {
    return {
      userType: 'client',
      tier: 'free',
      status: 'active',
      currentPeriodEnd: null,
      trialEnd: null,
      features: CLIENT_TIER_FEATURES.free
    };
  } else {
    return {
      userType: 'provider',
      tier: 'free',
      status: 'active',
      currentPeriodEnd: null,
      trialEnd: null,
      features: PROVIDER_TIER_FEATURES.free
    };
  }
}

// Create a trial subscription
export function createTrialSubscription(
  userType: UserType = 'provider',
  tier: ProviderSubscriptionTier | ClientSubscriptionTier = 'pro',
  trialDays: number = 14
): Subscription {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + trialDays);
  
  if (userType === 'client') {
    return {
      userType: 'client',
      tier: tier as ClientSubscriptionTier,
      status: 'trial',
      currentPeriodEnd: trialEnd,
      trialEnd,
      features: CLIENT_TIER_FEATURES[tier as ClientSubscriptionTier]
    };
  } else {
    return {
      userType: 'provider',
      tier: tier as ProviderSubscriptionTier,
      status: 'trial',
      currentPeriodEnd: trialEnd,
      trialEnd,
      features: PROVIDER_TIER_FEATURES[tier as ProviderSubscriptionTier]
    };
  }
}