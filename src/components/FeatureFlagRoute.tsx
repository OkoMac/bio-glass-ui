import { ReactNode } from "react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface FeatureFlagRouteProps {
  feature: string;
  enabledComponent: ReactNode;
  disabledComponent?: ReactNode;
  fallbackComponent?: ReactNode;
}

/**
 * A route wrapper that shows different components based on feature flag status
 * This allows us to safely test new features without breaking existing functionality
 */
export default function FeatureFlagRoute({
  feature,
  enabledComponent,
  disabledComponent,
  fallbackComponent
}: FeatureFlagRouteProps) {
  const { isEnabled } = useFeatureFlags();
  
  if (isEnabled(feature)) {
    return <>{enabledComponent}</>;
  }
  
  // Show disabled component if provided
  if (disabledComponent) {
    return <>{disabledComponent}</>;
  }
  
  // Default fallback (can be customized)
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }
  
  // Default fallback message
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <h2 className="text-xl font-bold text-foreground mb-2">Feature Unavailable</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This feature is currently disabled or under development.
        </p>
        <p className="text-xs text-muted-foreground">
          Check back soon or contact support for access.
        </p>
      </div>
    </div>
  );
}