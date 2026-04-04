import { useAuth } from "@/contexts/AuthContext";
import { 
  isFeatureEnabled, 
  getEnabledFeatures,
  FEATURE_FLAGS,
  type FeatureFlag 
} from "@/lib/featureFlags";

export function useFeatureFlags() {
  const { user } = useAuth();
  const userRole = user?.role as 'client' | 'provider' | 'admin' | 'corporate' | undefined;
  
  // Check if a specific feature is enabled
  const isEnabled = (featureName: string): boolean => {
    return isFeatureEnabled(featureName, userRole);
  };
  
  // Get all enabled features for current user
  const enabledFeatures = (): string[] => {
    return getEnabledFeatures(userRole);
  };
  
  // Check if any of multiple features are enabled
  const anyEnabled = (featureNames: string[]): boolean => {
    return featureNames.some(featureName => isEnabled(featureName));
  };
  
  // Check if all of multiple features are enabled
  const allEnabled = (featureNames: string[]): boolean => {
    return featureNames.every(featureName => isEnabled(featureName));
  };
  
  // Get feature flag configuration
  const getFeatureConfig = (featureName: string): FeatureFlag | null => {
    return FEATURE_FLAGS[featureName] || null;
  };
  
  return {
    isEnabled,
    enabledFeatures,
    anyEnabled,
    allEnabled,
    getFeatureConfig,
    userRole,
    FEATURE_FLAGS
  };
}