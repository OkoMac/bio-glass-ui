// Hook that computes the set of bookable 30-minute time slots for a given
// provider on a given date. Combines the provider's published availability
// (weekly schedule + date overrides) with existing bookings to surface only
// the slots a client can actually pick in the booking modal.
//
// Flow:
//   1. Fetch `/api/providers/:providerId/availability` once per providerId
//      (public endpoint; returns { ok, weekly, overrides }).
//   2. For the target date, resolve the operating window by checking for
//      an override first, then falling back to the matching weekly entry.
//   3. Generate 30-minute slots across that window, stopping `duration`
//      minutes before end_time so the appointment fits.
//   4. Subtract any Supabase bookings (pending/confirmed) that overlap.
//
// Returns "HH:MM" strings. Reason codes let the UI explain empty states:
//   - "closed":              the day has no weekly slot / closed-override
//   - "no_hours_published":  provider has never saved a weekly schedule
//   - "fully_booked":        window exists but every slot already taken

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export interface WeeklyAvailability {
  day_of_week: number; // 0=Sun ... 6=Sat
  start_time: string;  // HH:MM or HH:MM:SS
  end_time: string;
  active?: boolean;
  timezone?: string;
}

export interface DateOverride {
  date: string;                   // YYYY-MM-DD
  start_time: string | null;
  end_time: string | null;
  reason?: string | null;
}

export type SlotReason = "closed" | "no_hours_published" | "fully_booked";

export interface UseProviderSlots {
  availableSlots: string[];
  loading: boolean;
  error: string | null;
  reason?: SlotReason;
}

// Normalises "HH:MM" / "HH:MM:SS" strings to absolute minutes-from-midnight
// so we can do arithmetic on them without dealing with Date timezone fuss.
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}

// Parse "60 min" / "45 minutes" / "1 hour" / "60" → minutes.
// Falls back to 60 when the shape is unfamiliar so we still produce useful
// slot boundaries for scraped directory listings without a duration field.
function parseDuration(raw?: string | number | null): number {
  if (raw == null) return 60;
  if (typeof raw === "number") return raw > 0 ? raw : 60;
  const s = String(raw).toLowerCase();
  const hourMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:h|hour|hr)/);
  if (hourMatch) return Math.round(parseFloat(hourMatch[1]) * 60);
  const minMatch = s.match(/(\d+)/);
  if (minMatch) return parseInt(minMatch[1], 10);
  return 60;
}

interface AvailabilityCacheEntry {
  weekly: WeeklyAvailability[];
  overrides: DateOverride[];
}

// Module-level cache — we only want to hit the availability endpoint once
// per providerId across date changes, and ideally across modal re-opens.
const availabilityCache = new Map<string, Promise<AvailabilityCacheEntry>>();

async function fetchAvailability(providerId: string): Promise<AvailabilityCacheEntry> {
  const cached = availabilityCache.get(providerId);
  if (cached) return cached;
  const p = (async () => {
    const res = await fetch(`${API}/api/providers/${providerId}/availability`);
    const json = await res.json();
    if (!res.ok || !json.ok) {
      throw new Error(json.error ?? "Failed to load availability");
    }
    return {
      weekly: (json.weekly ?? []) as WeeklyAvailability[],
      overrides: (json.overrides ?? []) as DateOverride[],
    };
  })();
  availabilityCache.set(providerId, p);
  // On error, drop the cache so the next call can retry.
  p.catch(() => availabilityCache.delete(providerId));
  return p;
}

export function useProviderSlots(
  providerId: string | null | undefined,
  date: string | null | undefined,
  durationMinutes: number = 60,
): UseProviderSlots {
  const [availability, setAvailability] = useState<AvailabilityCacheEntry | null>(null);
  const [bookings, setBookings] = useState<{ booking_time: string; duration_minutes: number | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  // Load availability whenever providerId changes.
  useEffect(() => {
    if (!providerId) { setAvailability(null); return; }
    let cancelled = false;
    setLoading(true);
    fetchAvailability(providerId)
      .then(a => { if (!cancelled) setAvailability(a); })
      .catch(e => { if (!cancelled) setError((e as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [providerId]);

  // Load existing bookings for (providerId, date). Re-run on date change.
  useEffect(() => {
    if (!providerId || !date) { setBookings([]); return; }
    // Directory provider IDs are slugs (e.g. "fg_specialized_dent"), not
    // UUIDs. Querying bookings.provider_id (uuid column) with a slug throws
    // a 400 "invalid input syntax for type uuid". Skip the query entirely
    // for non-UUID IDs — directory providers can't have bookings yet anyway.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId);
    if (!isUuid) { setBookings([]); return; }

    const myReq = ++reqId.current;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data, error: qErr } = await supabase
          .from("bookings")
          .select("booking_time, duration_minutes")
          .eq("provider_id", providerId)
          .eq("booking_date", date)
          .in("status", ["pending", "confirmed"]);
        if (qErr) throw qErr;
        if (reqId.current === myReq) {
          setBookings((data ?? []) as { booking_time: string; duration_minutes: number | null }[]);
        }
      } catch (e) {
        if (reqId.current === myReq) setError((e as Error).message);
      } finally {
        if (reqId.current === myReq) setLoading(false);
      }
    })();
  }, [providerId, date]);

  return useMemo<UseProviderSlots>(() => {
    if (!providerId || !date) {
      return { availableSlots: [], loading, error };
    }
    if (!availability) {
      return { availableSlots: [], loading, error };
    }

    const { weekly, overrides } = availability;

    // No schedule saved at all → we want the UI to fall back to a generic
    // "ask the provider" message rather than saying "closed".
    if (weekly.length === 0) {
      return { availableSlots: [], loading, error, reason: "no_hours_published" };
    }

    // Resolve the window for this date. Overrides fully replace the weekly
    // entry — a null start_time/end_time means "closed all day".
    const override = overrides.find(o => o.date === date);
    let startTime: string | null = null;
    let endTime: string | null = null;

    if (override) {
      if (!override.start_time || !override.end_time) {
        return { availableSlots: [], loading, error, reason: "closed" };
      }
      startTime = override.start_time;
      endTime = override.end_time;
    } else {
      // JS getDay() is already 0=Sun..6=Sat, matching our schema.
      // Parse as local date to avoid "YYYY-MM-DD" shifting a day in UTC.
      const [y, m, d] = date.split("-").map(Number);
      const dow = new Date(y, (m || 1) - 1, d || 1).getDay();
      const slot = weekly.find(s => s.day_of_week === dow && (s.active ?? true));
      if (!slot) {
        return { availableSlots: [], loading, error, reason: "closed" };
      }
      startTime = slot.start_time;
      endTime = slot.end_time;
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const duration = Math.max(15, durationMinutes || 60);
    const STEP = 30;

    // Build candidate slot starts. The last valid start is `end - duration`
    // so the session finishes inside the window.
    const candidates: number[] = [];
    for (let t = startMin; t + duration <= endMin; t += STEP) {
      candidates.push(t);
    }

    // Drop any candidate that overlaps an existing booking.
    const bookingIntervals = bookings.map(b => {
      const bStart = timeToMinutes(b.booking_time);
      const bDur = b.duration_minutes && b.duration_minutes > 0 ? b.duration_minutes : duration;
      return { start: bStart, end: bStart + bDur };
    });

    const free = candidates.filter(candStart => {
      const candEnd = candStart + duration;
      return !bookingIntervals.some(b => candStart < b.end && candEnd > b.start);
    });

    // Only guard against same-day past slots; future dates keep everything.
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const filtered = date === todayStr
      ? free.filter(t => t > now.getHours() * 60 + now.getMinutes())
      : free;

    const slots = filtered.map(minutesToTime);

    if (slots.length === 0 && candidates.length > 0) {
      return { availableSlots: [], loading, error, reason: "fully_booked" };
    }

    return { availableSlots: slots, loading, error };
  }, [providerId, date, availability, bookings, loading, error, durationMinutes]);
}

// Exposed so tests or callers can bust the cache (e.g. after a booking is
// created elsewhere in the app and we want fresh availability).
export function clearProviderSlotsCache(providerId?: string) {
  if (providerId) availabilityCache.delete(providerId);
  else availabilityCache.clear();
}

export { parseDuration };
