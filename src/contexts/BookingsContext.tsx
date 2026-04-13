import {
  createContext, useContext, useState, useEffect,
  ReactNode, useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { getProviderImage } from "@/lib/providerImages";

// Import real data scraped from Pretoria service providers
import realData from "@/data/bion_pretoria_data.json";

export type BookingStatus = "pending" | "confirmed" | "declined" | "completed" | "no_show";

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientImage: string;
  providerName?: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  status: BookingStatus;
  note?: string;
  // Payment fields
  fees?: string;
  totalPaid?: string;
  providerEarns?: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded' | 'failed';
  stripePaymentId?: string;
}

// ── Real data from Pretoria service providers (scraped/replaced mock data) ───
// Using real data scraped from Pretoria suburbs with at least 10 providers per suburb
const REAL_BOOKINGS: Booking[] = (realData.bookings ?? []).map((booking: any) => ({
  id: booking.id,
  clientId: booking.clientId,
  clientName: booking.clientName,
  clientImage: booking.clientImage,
  providerName: booking.providerName,
  service: booking.service,
  date: booking.date,
  time: booking.time,
  duration: booking.duration,
  price: booking.price,
  status: booking.status as BookingStatus,
  note: booking.note
}));

// Additional real providers data for reference
export interface ServiceProvider {
  id: string;
  name: string;
  service: string;
  specialization: string;
  location: string;
  address: string;
  contact: {
    email: string;
    phone: string;
    website: string;
  };
  rating: number;
  reviewCount: number;
  price: string;
  duration: string;
  availability: string;
  description: string;
  qualifications: string[];
  languages: string[];
  experienceYears: number;
  servicesOffered: string[];
  // Fields from scraped Pretoria data
  suburb?: string;
  city?: string;
  category?: string;
  verified?: boolean;
  years_in_business?: number;
  min_price?: string;
  max_price?: string;
}

export const REAL_PROVIDERS: ServiceProvider[] = realData.providers.map((p: any) => ({
  ...p,
  contact: {
    email: p.contact?.email ?? "",
    phone: p.contact?.phone ?? "",
    website: p.contact?.website ?? "",
  },
  rating: typeof p.rating === "string" ? parseFloat(p.rating) || 0 : (p.rating ?? 0),
}));

type SupaRow = {
  id: string; client_id: string; provider_id: string;
  booking_date: string; booking_time: string;
  duration_minutes: number; total_price: number | null;
  status: string; notes: string | null;
  profiles?: { full_name?: string } | null;
  services?: { title?: string } | null;
};

function mapRow(r: SupaRow): Booking {
  return {
    id: r.id, clientId: r.client_id,
    clientName: r.profiles?.full_name ?? "Client", clientImage: getProviderImage(r.client_id, r.profiles?.full_name ?? "Client"),
    service: r.services?.title ?? "Session",
    date: r.booking_date, time: r.booking_time,
    duration: `${r.duration_minutes} min`,
    price: r.total_price ? `R${r.total_price}` : "R0",
    status: r.status as BookingStatus,
    note: r.notes ?? undefined,
  };
}

interface BookingsContextType {
  bookings: Booking[];
  pendingCount: number;
  confirm:      (id: string) => void;
  decline:      (id: string) => void;
  markComplete: (id: string) => void;
  markNoShow:   (id: string) => void;
  reschedule:   (id: string, newDate: string, newTime: string) => void;
  addBooking:   (booking: Omit<Booking, "id" | "status">) => void;
  getByStatus:  (status: BookingStatus | BookingStatus[]) => Booking[];
  getByClient:  (clientId: string) => Booking[];
  // Added real providers data
  providers: ServiceProvider[];
  getProvidersBySuburb: (suburb: string) => ServiceProvider[];
  getProvidersByService: (service: string) => ServiceProvider[];
}

const BookingsContext = createContext<BookingsContextType | null>(null);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>(REAL_BOOKINGS);
  const [providers] = useState<ServiceProvider[]>(REAL_PROVIDERS);

  // ── Fetch real bookings + subscribe to Realtime ────────────────
  useEffect(() => {
    if (!user?.id) return; // demo mode — keep real scraped data

    const fetchBookings = async () => {
      // No manual role filter needed — RLS policies on bookings restrict rows
      // to those where the auth user's profiles.id matches client_id or provider_id
      const { data, error } = await supabase
        .from("bookings")
        .select("*, profiles!bookings_client_id_fkey(full_name), services(title)")
        .order("booking_date", { ascending: true });
      if (!error && data && data.length > 0) {
        setBookings((data as unknown as SupaRow[]).map(mapRow));
      }
    };

    fetchBookings();

    // Live updates via Supabase Realtime
    const channel = supabase
      .channel(`bookings-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setBookings(prev => [...prev, mapRow(payload.new as unknown as SupaRow)]);
        } else if (payload.eventType === "UPDATE") {
          setBookings(prev =>
            prev.map(b => b.id === payload.new.id ? { ...b, status: payload.new.status as BookingStatus } : b),
          );
        } else if (payload.eventType === "DELETE") {
          setBookings(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, user?.role]);

  // ── Status updates: optimistic local + DB write ─────────────────
  const updateStatus = useCallback(async (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (user?.id) await supabase.from("bookings").update({ status }).eq("id", id);
  }, [user?.id]);

  const confirm      = useCallback((id: string) => updateStatus(id, "confirmed"),  [updateStatus]);
  const decline      = useCallback((id: string) => updateStatus(id, "declined"),   [updateStatus]);
  const markComplete = useCallback((id: string) => updateStatus(id, "completed"),  [updateStatus]);
  const markNoShow   = useCallback((id: string) => updateStatus(id, "no_show"),    [updateStatus]);

  const reschedule = useCallback(async (id: string, newDate: string, newTime: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, date: newDate, time: newTime, status: "pending" as BookingStatus } : b));
    if (user?.id) {
      await supabase.from("bookings").update({ booking_date: newDate, booking_time: newTime, status: "pending" }).eq("id", id);
    }
  }, [user?.id]);

  const addBooking = useCallback(async (booking: Omit<Booking, "id" | "status">) => {
    const newBooking: Booking = { ...booking, id: `b${Date.now()}`, status: "pending" };
    setBookings(prev => [...prev, newBooking]);

    // Trigger streak checkIn (listened by useStreaks via custom event)
    window.dispatchEvent(new CustomEvent("bion:booking-created"));

    // ── Sync to BION Calendar (auto-add as appointment event) ──
    try {
      const calendarEvent = {
        id: `booking_${newBooking.id}`,
        title: booking.service ?? "Booking",
        category: "appointment" as const,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        provider: booking.providerName ?? booking.clientName ?? "",
        location: "",
        notes: booking.note ?? "",
        completed: false,
        recurring: undefined,
      };

      // Write to localStorage so the calendar page picks it up immediately
      const existing = JSON.parse(localStorage.getItem("bion_calendar_events") ?? "[]");
      // Avoid duplicates if user re-books same id
      const filtered = existing.filter((e: any) => e.id !== calendarEvent.id);
      localStorage.setItem("bion_calendar_events", JSON.stringify([...filtered, calendarEvent]));

      // Calendar sync — localStorage only for now (calendar_events table not yet in schema)
    } catch (err) {
      console.warn("[booking → calendar sync] failed:", err);
    }

    // Only insert when we have a real session with a resolved profile ID
    if (user?.profileId) {
      await supabase.from("bookings").insert({
        // profiles.id is the FK — use profileId, not the auth user id
        client_id:        booking.clientId || user.profileId,
        provider_id:      user.role === "provider" ? user.profileId : "00000000-0000-0000-0000-000000000000",
        booking_date:     booking.date,
        booking_time:     booking.time,
        duration_minutes: parseInt(booking.duration) || 60,
        status:           "pending",
        notes:            booking.note ?? null,
      });
    }

    // ── Auto-send booking confirmation via email + WhatsApp ──
    const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
    const clientEmail = user?.email;
    const providerName = booking.providerName ?? booking.clientName ?? "Provider";
    const bookingRef = newBooking.id;

    // Email confirmation (best-effort with logging)
    if (clientEmail) {
      fetch(`${API}/api/email/booking-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clientEmail,
          clientName: user?.name ?? "Client",
          providerName,
          service: booking.service,
          date: booking.date,
          time: booking.time,
          price: booking.price,
          bookingRef,
        }),
      }).catch((err) => {
        if (import.meta.env.DEV) console.warn("[booking] email confirmation failed:", err);
      });
    }

    // WhatsApp confirmation (best-effort — only if phone stored in profile)
    try {
      const profileData = localStorage.getItem(`bion_profile_${user?.id}`);
      const phone = profileData ? JSON.parse(profileData).phone : null;
      if (phone) {
        fetch(`${API}/api/whatsapp/booking-confirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: phone.replace(/\s/g, ""),
            clientName: user?.name ?? "Client",
            providerName,
            service: booking.service,
            date: booking.date,
            time: booking.time,
            price: booking.price,
          }),
        }).catch((err) => {
          if (import.meta.env.DEV) console.warn("[booking] WhatsApp confirmation failed:", err);
        });
      }
    } catch { /* localStorage parse failure — non-critical */ }
  }, [user?.id, user?.role, user?.profileId, user?.email, user?.name]);

  const getByStatus = useCallback((status: BookingStatus | BookingStatus[]) => {
    const statuses = Array.isArray(status) ? status : [status];
    return bookings.filter(b => statuses.includes(b.status));
  }, [bookings]);

  const getByClient = useCallback((clientId: string) =>
    bookings.filter(b => b.clientId === clientId),
  [bookings]);

  const getProvidersBySuburb = useCallback((suburb: string) => {
    return providers.filter(p => p.location.toLowerCase().includes(suburb.toLowerCase()));
  }, [providers]);

  const getProvidersByService = useCallback((service: string) => {
    return providers.filter(p => 
      p.service.toLowerCase().includes(service.toLowerCase()) ||
      p.servicesOffered.some(s => s.toLowerCase().includes(service.toLowerCase()))
    );
  }, [providers]);

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <BookingsContext.Provider value={{
      bookings, pendingCount, providers,
      confirm, decline, markComplete, markNoShow, reschedule, addBooking,
      getByStatus, getByClient, getProvidersBySuburb, getProvidersByService,
    }}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used within BookingsProvider");
  return ctx;
}