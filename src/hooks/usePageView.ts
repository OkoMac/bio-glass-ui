import { useEffect } from "react";
import { hasConsent } from "@/lib/cookieConsent";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export function usePageView() {
  useEffect(() => {
    // Only fire analytics pageview if the user has consented to analytics cookies
    if (!hasConsent("analytics")) return;

    fetch(`${API}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer || undefined }),
    }).catch(() => {});
  }, []);
}
