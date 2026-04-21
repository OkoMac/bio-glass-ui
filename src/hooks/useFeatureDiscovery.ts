import { useCallback, useRef } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "bion_features_seen";

function getSeenFeatures(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markSeen(featureId: string) {
  try {
    const seen = getSeenFeatures();
    seen.add(featureId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

/**
 * Feature discovery hook — shows a one-time toast the first time
 * a user visits a page / encounters a feature.
 *
 * Usage:
 *   const { showTip } = useFeatureDiscovery();
 *   useEffect(() => { showTip("food-tracker", "Tip: Take a photo..."); }, []);
 */
export function useFeatureDiscovery() {
  // Prevent duplicate toasts within the same mount cycle
  const shownRef = useRef<Set<string>>(new Set());

  const showTip = useCallback((featureId: string, message: string) => {
    if (shownRef.current.has(featureId)) return;
    const seen = getSeenFeatures();
    if (seen.has(featureId)) return;

    shownRef.current.add(featureId);
    markSeen(featureId);

    toast(message, {
      duration: 5000,
      icon: "🤖",
      position: "top-center",
    });
  }, []);

  return { showTip };
}
