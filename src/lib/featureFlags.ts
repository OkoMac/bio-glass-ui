// Feature Flag System for Safe Incremental Development
// This allows us to enable/disable features without breaking existing functionality

export type FeatureFlag = {
  name: string;
  description: string;
  enabled: boolean;
  targetUsers: 'all' | 'providers' | 'clients' | 'admins' | 'beta-testers';
  rolloutPercentage: number; // 0-100
  dependencies?: string[]; // Other features this depends on
};

// Current feature flags - ALWAYS start with false for new features
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Core features (always enabled - these are our foundation)
  subscriptionSystem: {
    name: 'subscriptionSystem',
    description: 'Provider and client subscription management',
    enabled: true,
    targetUsers: 'all',
    rolloutPercentage: 100
  },
  bookingPayment: {
    name: 'bookingPayment',
    description: 'Booking and payment flow with 5%+5% fees',
    enabled: true,
    targetUsers: 'all',
    rolloutPercentage: 100
  },
  publicDirectory: {
    name: 'publicDirectory',
    description: 'Public provider directory browsing',
    enabled: true,
    targetUsers: 'all',
    rolloutPercentage: 100
  },
  
  // Phase 1: Gym Provider Tools (NEW - start disabled)
  providerDashboardV2: {
    name: 'providerDashboardV2',
    description: 'Enhanced provider dashboard with client CRM',
    enabled: true, // ENABLED FOR TESTING
    targetUsers: 'providers',
    rolloutPercentage:   100, // 10% rollout for testing
    dependencies: ['subscriptionSystem']
  },
  sessionManagement: {
    name: 'sessionManagement',
    description: 'Session and class management for gym providers',
    enabled: true, // ENABLED FOR TESTING
    targetUsers: 'providers',
    rolloutPercentage:   100 // 10% rollout for testing
  },
  progressTracking: {
    name: 'progressTracking',
    description: 'Client progress tracking and photo galleries',
    enabled: true, // ENABLED FOR TESTING
    targetUsers: 'providers',
    rolloutPercentage:   100 // 10% rollout for testing
  },
  packageBuilder: {
    name: 'packageBuilder',
    description: 'Package and bundle sales system',
    enabled: true, // ENABLED - ALL FEATURES ACTIVE
    targetUsers: 'providers',
    rolloutPercentage: 100,
    dependencies: ['subscriptionSystem', 'bookingPayment']
  },
  
  // Phase 2: Beauty Vertical (NEW - start disabled)
  beautyVertical: {
    name: 'beautyVertical',
    description: 'Beauty and personal care provider tools',
    enabled: true,
    targetUsers: 'providers',
    rolloutPercentage: 100
  },
  
  // Phase 3: Medical Vertical (NEW - start disabled)
  medicalVertical: {
    name: 'medicalVertical',
    description: 'Medical and allied health provider tools',
    enabled: true,
    targetUsers: 'providers',
    rolloutPercentage: 100
  },
  
  // Viral Features (NEW - start disabled)
  shareableProgressCards: {
    name: 'shareableProgressCards',
    description: 'Shareable progress cards for social media',
    enabled: true,
    targetUsers: 'clients',
    rolloutPercentage: 100
  },
  wellnessChallenges: {
    name: 'wellnessChallenges',
    description: '30-day community wellness challenges',
    enabled: true,
    targetUsers: 'all',
    rolloutPercentage: 100
  }
};

// Check if a feature is enabled for a specific user
export function isFeatureEnabled(
  featureName: string, 
  userRole?: 'client' | 'provider' | 'admin' | 'corporate'
): boolean {
  const flag = FEATURE_FLAGS[featureName];
  
  if (!flag) {
    console.warn(`Feature flag "${featureName}" not found. Defaulting to disabled for safety.`);
    return false; // Safe default: if flag doesn't exist, feature is disabled
  }
  
  // Check if feature is globally enabled
  if (!flag.enabled) {
    return false;
  }
  
  // Check rollout percentage (simple random check)
  if (flag.rolloutPercentage < 100) {
    const random = Math.random() * 100;
    if (random > flag.rolloutPercentage) {
      return false;
    }
  }
  
  // Check user targeting
  if (flag.targetUsers === 'all') {
    return true;
  }
  
  if (!userRole) {
    return false;
  }
  
  switch (flag.targetUsers) {
    case 'providers':
      return userRole === 'provider';
    case 'clients':
      return userRole === 'client';
    case 'admins':
      return userRole === 'admin';
    case 'beta-testers':
      // For now, treat as providers - can be enhanced later
      return userRole === 'provider';
    default:
      return false;
  }
}

// Enable a feature (safe method - checks dependencies)
export function enableFeature(featureName: string): boolean {
  const flag = FEATURE_FLAGS[featureName];
  
  if (!flag) {
    console.error(`Cannot enable: Feature "${featureName}" not found`);
    return false;
  }
  
  // Check dependencies
  if (flag.dependencies) {
    const missingDeps = flag.dependencies.filter(dep => !isFeatureEnabled(dep));
    if (missingDeps.length > 0) {
      console.error(`Cannot enable "${featureName}": Missing dependencies: ${missingDeps.join(', ')}`);
      return false;
    }
  }
  
  flag.enabled = true;
  return true;
}

// Disable a feature (safe - can be re-enabled later)
export function disableFeature(featureName: string): boolean {
  const flag = FEATURE_FLAGS[featureName];
  
  if (!flag) {
    console.error(`Cannot disable: Feature "${featureName}" not found`);
    return false;
  }
  
  flag.enabled = false;
  return true;
}

// Set rollout percentage
export function setRolloutPercentage(featureName: string, percentage: number): boolean {
  const flag = FEATURE_FLAGS[featureName];
  
  if (!flag) {
    console.error(`Cannot set rollout: Feature "${featureName}" not found`);
    return false;
  }
  
  if (percentage < 0 || percentage > 100) {
    console.error(`Rollout percentage must be between 0 and 100`);
    return false;
  }
  
  flag.rolloutPercentage = percentage;
  return true;
}

// Get all enabled features for a user
export function getEnabledFeatures(userRole?: 'client' | 'provider' | 'admin' | 'corporate'): string[] {
  return Object.keys(FEATURE_FLAGS).filter(featureName => 
    isFeatureEnabled(featureName, userRole)
  );
}

// Export feature flag configuration for UI/admin panel
export function getFeatureFlags() {
  return { ...FEATURE_FLAGS };
}