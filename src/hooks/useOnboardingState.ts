/**
 * useOnboardingState — reads/writes onboarding progress from Supabase profiles table.
 * Replaces all localStorage-based onboarding tracking.
 *
 * Columns used:
 *   layer1_complete, layer2_complete, layer3_complete,
 *   nudges_seen (jsonb[]), login_count, last_login_at
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OnboardingState {
  layer1Complete: boolean;
  layer2Complete: boolean;
  layer3Complete: boolean;
  nudgesSeen: string[];
  loginCount: number;
  loading: boolean;
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

  // Load from Supabase on mount
  useEffect(() => {
    if (!profileId || isDemo) return;

    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("layer1_complete, layer2_complete, layer3_complete, nudges_seen, login_count")
          .eq("id", profileId)
          .maybeSingle();

        if (data) {
          setState({
            layer1Complete: data.layer1_complete ?? false,
            layer2Complete: data.layer2_complete ?? false,
            layer3Complete: data.layer3_complete ?? false,
            nudgesSeen: (data.nudges_seen as string[]) ?? [],
            loginCount: data.login_count ?? 0,
            loading: false,
          });
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, loading: false }));
      }
    })();
  }, [profileId, isDemo]);

  /** Mark a layer as complete */
  const completeLayer = useCallback(async (layer: 1 | 2 | 3) => {
    if (!profileId || isDemo) return;
    const col = `layer${layer}_complete` as const;
    setState(prev => ({ ...prev, [`layer${layer}Complete`]: true }));
    await supabase.from("profiles").update({ [col]: true } as any).eq("id", profileId).catch(() => {});

    // Also set localStorage for backwards compat during migration
    if (user?.id) localStorage.setItem(`bion_onboarding_done_${user.id}`, "1");
  }, [profileId, isDemo, user?.id]);

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

    if (!profileId || isDemo) return;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("nudges_seen")
        .eq("id", profileId)
        .maybeSingle();
      const current = (data?.nudges_seen as string[]) ?? [];
      if (!current.includes(featureKey)) {
        await supabase
          .from("profiles")
          .update({ nudges_seen: [...current, featureKey] } as any)
          .eq("id", profileId);
      }
    } catch { /* non-fatal */ }
  }, [profileId, isDemo]);

  /** Increment login count + check if Layer 3 should trigger */
  const incrementLogin = useCallback(async (): Promise<number> => {
    if (!profileId || isDemo) return 0;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("login_count")
        .eq("id", profileId)
        .maybeSingle();
      const newCount = ((data?.login_count as number) ?? 0) + 1;
      await supabase
        .from("profiles")
        .update({ login_count: newCount, last_login_at: new Date().toISOString() } as any)
        .eq("id", profileId);
      setState(prev => ({ ...prev, loginCount: newCount }));
      return newCount;
    } catch {
      return 0;
    }
  }, [profileId, isDemo]);

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
