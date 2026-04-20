import { useEffect } from "react";
const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
export function usePageView() {
  useEffect(() => {
    fetch(`${API}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer || undefined }),
    }).catch(() => {});
  }, []);
}
