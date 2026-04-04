import { ReactNode } from "react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders children only if the specified feature is enabled
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { isEnabled } = useFeatureFlags();
  
  if (isEnabled(feature)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

interface MultiFeatureGateProps {
  features: string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

/**
 * Component that renders children based on multiple feature flags
 */
export function MultiFeatureGate({ 
  features, 
  children, 
  fallback = null,
  requireAll = false 
}: MultiFeatureGateProps) {
  const { anyEnabled, allEnabled } = useFeatureFlags();
  
  const shouldShow = requireAll ? allEnabled(features) : anyEnabled(features);
  
  if (shouldShow) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}