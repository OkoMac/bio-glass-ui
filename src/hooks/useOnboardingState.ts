/**
 * useOnboardingState — reads/writes onboarding progress via the /api/onboarding
 * backend endpoints. Replaces direct Supabase profile column access.
 *
 * The backend stores data in two tables:
 *   - user_onboarding_progress (layer1-4 completion)
 *   - user_nudge_seen (feature nudges)
 *
 * Backwards compat: localStorage is kept as fallback during transition.
 */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export interface OnboardingState {
  layer1Complete: boolean;
  layer2Complete: boolean;
  layer3Complete: boolean;
  nudgesSeen: string[];
  loginCount: number;
  loading: boolean;
}

/** Parse a layer key from the API response into a boolean status */
function layerIsComplete(
  layers: Record<string, { completed_at: string | null; data: Record<string, unknown> }>,
  layer: string,
): boolean {
  return !!layers[layer]?.completed_at;
}

export function useOnboardingState() {
  const { user } = useAuth();
  const profileId = user?.profileId;
  const isDemo = user?.id?.startsWith("demo_") ?? false;

  const [state, setState] = useState<OnboardingState>({
    layer1Complete: isDemo,
    layer2Complete: isDemo,
    layer3Complete: isDemo,
    nudgesSeen: [],
    loginCount: 0,
    loading: !isDemo,
  });

  /** Get auth token from the Supabase session */
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  }, []);

  // Load from backend API on mount
  useEffect(() => {
    if (!profileId || isDemo) return;

    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        const res = await fetch(`${API_URL}/api/onboarding/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        const json = await res.json();
        const data = json?.data;
        if (!data) {
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        const layers = data.layers ?? {};

        setState({
          layer1Complete: layerIsComplete(layers, "layer1"),
          layer2Complete: layerIsComplete(layers, "layer2"),
          layer3Complete: layerIsComplete(layers, "layer3"),
          nudgesSeen: data.nudgesSeen ?? [],
          loginCount: 0, // login_count is no longer tracked in these tables
          loading: false,
        });
      } catch {
        setState(prev => ({ ...prev, loading: false }));
      }
    })();
  }, [profileId, isDemo, getToken]);

  /** Mark a layer as complete */
  const completeLayer = useCallback(async (layer: 1 | 2 | 3) => {
    const layerKey = `layer${layer}`;

    // Optimistic local update
    setState(prev => ({ ...prev, [`layer${layer}Complete` as keyof OnboardingState]: true } as any));

    // Persist server-side
    if (profileId && !isDemo) {
      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_URL}/api/onboarding/progress/${layerKey}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: {} }),
          });
        }
      } catch { /* non-fatal */ }
    }

    // Also set localStorage for backwards compat during migration
    if (user?.id) localStorage.setItem(`bion_onboarding_done_${user.id}`, "1");
  }, [profileId, isDemo, user?.id, getToken]);

  /** Mark a nudge as seen (never show again).
   *  Always updates local state first so the modal dismisses immediately,
   *  even for demo users / sessions where profileId hasn't loaded yet —
   *  previous early-return left users trapped on the BIONWallet popup
   *  with no way to close it (reported 2026-04-28). Persistence is
   *  best-effort and only fires when we have a profile id. */
  const markNudgeSeen = useCallback(async (featureKey: string) => {
    setState(prev => (
      prev.nudgesSeen.includes(featureKey)
        ? prev
        : { ...prev, nudgesSeen: [...prev.nudgesSeen, featureKey] }
    ));

    if (profileId && !isDemo) {
      try {
        const token = await getToken();
        if (token) {
          await fetch(`${API_URL}/api/onboarding/nudge/${encodeURIComponent(featureKey)}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ dismissed: false }),
          });
        }
      } catch { /* non-fatal */ }
    }
  }, [profileId, isDemo, getToken]);

  /** Increment login count + check if Layer 3 should trigger.
   *  Note: login_count is no longer managed by these onboarding tables;
   *  this is a no-op placeholder for backwards compat. If you need login
   *  tracking, consider the profiles.login_count column or auth events. */
  const incrementLogin = useCallback(async (): Promise<number> => {
    // This would need the profiles table or auth events — kept as placeholder
    return 0;
  }, []);

  /** Check if a specific nudge has been seen */
  const hasSeenNudge = useCallback((featureKey: string): boolean => {
    return state.nudgesSeen.includes(featureKey);
  }, [state.nudgesSeen]);

  /** Should Layer 3 deeper dive show? (second login, not yet completed) */
  const shouldShowLayer3 = state.loginCount >= 2 && !state.layer3Complete;

  return {
    ...state,
    completeLayer,
    markNudgeSeen,
    incrementLogin,
    hasSeenNudge,
    shouldShowLayer3,
  };
}
