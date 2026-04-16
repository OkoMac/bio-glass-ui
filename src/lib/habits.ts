/**
 * User habits tracker — writes an event to public.user_habits and later reads
 * the aggregated user_habit_profile row for personalisation.
 *
 * Call `trackEvent(type, { category?, metadata? })` from anywhere. It's fully
 * fire-and-forget — failures are silent so tracking never breaks the UI.
 */

import { supabase } from "@/integrations/supabase/client";
import { hasConsent } from "./cookieConsent";

type EventType =
  | "page_view"
  | "provider_view"
  | "provider_favorite"
  | "search"
  | "booking_started"
  | "booking_completed"
  | "tool_use"
  | "message_sent"
  | "article_read"
  | "nudge_accepted"
  | "nudge_dismissed"
  | "routine_logged"
  | "streak_day";

interface TrackArgs {
  category?: string;
  metadata?: Record<string, any>;
}

// Debounce page_view tracking so scroll-triggered re-renders don't spam the DB.
const recentEvents = new Map<string, number>();
const DEBOUNCE_MS = 5000;

export async function trackEvent(event: EventType, args: TrackArgs = {}): Promise<void> {
  try {
    // POPIA / GDPR — never write to user_habits without explicit analytics consent.
    // Pre-consent (or after the user rejected), this short-circuits so no tracking
    // data leaves the device. Re-enables automatically once the user opts in.
    if (!hasConsent("analytics")) return;

    // Skip for demo accounts — no real profile row to attribute to
    const stored = localStorage.getItem("bio_user");
    if (!stored) return;
    const user = JSON.parse(stored);
    if (!user?.profileId) return;
    if (String(user.id).startsWith("demo_")) return;

    // Debounce identical events within a short window
    const signature = `${event}:${args.category ?? ""}:${JSON.stringify(args.metadata ?? {})}`;
    const now = Date.now();
    const last = recentEvents.get(signature) ?? 0;
    if (now - last < DEBOUNCE_MS) return;
    recentEvents.set(signature, now);

    // Fire the insert but don't await — keep the UI snappy
    void supabase.from("user_habits").insert({
      profile_id: user.profileId,
      event_type: event,
      category: args.category ?? null,
      metadata: args.metadata ?? {},
    }).then(() => { /* success */ }, () => { /* swallow */ });
  } catch {
    /* swallow — tracking must never break the app */
  }
}

/** Convenience — map a URL path to a high-level category for better aggregation. */
export function pathToCategory(pathname: string): string | undefined {
  if (pathname.startsWith("/water") || pathname.startsWith("/food") || pathname.startsWith("/sleep")) return "wellness_tracking";
  if (pathname.startsWith("/medical-card")) return "medical";
  if (pathname.startsWith("/pro/"))      return "provider";
  if (pathname.startsWith("/corporate/"))return "corporate";
  if (pathname.startsWith("/admin/"))    return "admin";
  if (pathname.startsWith("/legal/"))    return "legal";
  if (pathname.startsWith("/provider/")) return "browse";
  if (pathname.startsWith("/directory")) return "browse";
  if (pathname.startsWith("/schedule"))  return "bookings";
  if (pathname.startsWith("/wallet"))    return "money";
  if (pathname.startsWith("/messages"))  return "messaging";
  if (pathname.startsWith("/bicademy"))   return "education";
  if (pathname.startsWith("/challenges"))return "challenges";
  return undefined;
}
