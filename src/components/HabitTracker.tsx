import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent, pathToCategory } from "@/lib/habits";

/**
 * Invisible side-effect component. Mount once near the app root; it subscribes
 * to route changes and logs a `page_view` event for every real navigation. The
 * tracker itself debounces, filters demo accounts, and is fire-and-forget so
 * there's zero UI cost.
 */
export default function HabitTracker() {
  const location = useLocation();

  useEffect(() => {
    trackEvent("page_view", {
      category: pathToCategory(location.pathname),
      metadata: { pathname: location.pathname },
    });
  }, [location.pathname]);

  return null;
}
