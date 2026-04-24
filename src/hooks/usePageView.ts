import { useEffect } from "react";
import { hasConsent } from "@/lib/cookieConsent";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

/** Generate or retrieve a persistent anonymous visitor ID (marketing cookie). */
function getVisitorId(): string | null {
  if (!hasConsent("marketing")) return null;
  const key = "bion_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = "v_" + crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Detect device type from viewport width. */
function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/** Extract marketing context from the current URL. */
function extractContext(path: string) {
  const ctx: Record<string, string | undefined> = {};

  // Provider profile: /provider/gp_f9bcf2bf25
  const providerMatch = path.match(/\/provider\/([a-zA-Z0-9_-]+)/);
  if (providerMatch) ctx.provider_name = providerMatch[1];

  // SEO page: /s/centurion/dentist
  const seoMatch = path.match(/\/s\/([^/]+)\/([^/]+)/);
  if (seoMatch) {
    ctx.suburb = seoMatch[1];
    ctx.category = seoMatch[2];
  }

  // Directory search: /directory?q=dentist
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (q) ctx.search_query = q;

  // UTM parameters
  const utm_source = params.get("utm_source");
  if (utm_source) ctx.referrer = `utm:${utm_source}`;

  return ctx;
}

export function usePageView() {
  useEffect(() => {
    // Fire on analytics OR marketing consent
    if (!hasConsent("analytics") && !hasConsent("marketing")) return;

    const path = window.location.pathname;
    const ctx = extractContext(path);

    fetch(`${API}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        referrer: document.referrer || undefined,
        visitor_id: getVisitorId(),
        device_type: getDeviceType(),
        ...ctx,
      }),
    }).catch(() => {});
  }, []);
}

/** Track a specific marketing event (search, provider view, booking start). */
export function trackEvent(event: string, data?: Record<string, string>) {
  if (!hasConsent("marketing")) return;

  fetch(`${API}/api/analytics/pageview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: `/_event/${event}`,
      visitor_id: getVisitorId(),
      device_type: getDeviceType(),
      ...data,
    }),
  }).catch(() => {});
}
