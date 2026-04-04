import {
  createContext, useContext, useState, useEffect,
  ReactNode, useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

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
}

// ── Mock fallback (used in demo mode — no real Supabase session) ───
const MOCK_BOOKINGS: Booking[] = [
  { id:"b1", clientId:"c1", clientName:"Mpho Sithole",    clientImage:provider1, providerName:"Lisa Dlamini", service:"Personal Training",   date:"Mon, 2 Mar", time:"07:00", duration:"60 min", price:"R450", status:"pending",   note:"First session back after holiday" },
  { id:"b2", clientId:"c2", clientName:"Thandi Khumalo",  clientImage:provider2, providerName:"Lisa Dlamini", service:"Strength Assessment", date:"Mon, 2 Mar", time:"09:00", duration:"45 min", price:"R350", status:"pending"   },
  { id:"b3", clientId:"c3", clientName:"Kobus Pretorius", clientImage:provider3, providerName:"Lisa Dlamini", service:"Personal Training",   date:"Tue, 3 Mar", time:"10:00", duration:"60 min", price:"R450", status:"confirmed" },
  { id:"b4", clientId:"c4", clientName:"Naledi Moyo",     clientImage:provider4, providerName:"Lisa Dlamini", service:"Personal Training",   date:"Wed, 4 Mar", time:"11:30", duration:"60 min", price:"R450", status:"confirmed" },
  { id:"b5", clientId:"c1", clientName:"Mpho Sithole",    clientImage:provider1, providerName:"Lisa Dlamini", service:"Free Intro",          date:"Thu, 5 Mar", time:"14:00", duration:"60 min", price:"FREE", status:"confirmed" },
  { id:"b6", clientId:"c5", clientName:"Amir K.",         clientImage:provider4, providerName:"Lisa Dlamini", service:"Personal Training",   date:"Feb 15",     time:"07:00", duration:"60 min", price:"R450", status:"completed" },
  { id:"b7", clientId:"c6", clientName:"Busisiwe M.",     clientImage:provider2, providerName:"Lisa Dlamini", service:"Personal Training",   date:"Feb 20",     time:"09:00", duration:"60 min", price:"R450", status:"no_show"   },
  { id:"b8", clientId:"c3", clientName:"Kobus Pretorius", clientImage:provider3, providerName:"Lisa Dlamini", service:"Strength Assessment", date:"Feb 22",     time:"10:00", duration:"45 min", price:"R350", status:"completed" },
];

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
    clientName: r.profiles?.full_name ?? "Client", clientImage: provider1,
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
  addBooking:   (booking: Omit<Booking, "id" | "status">) => void;
  getByStatus:  (status: BookingStatus | BookingStatus[]) => Booking[];
  getByClient:  (clientId: string) => Booking[];
}

const BookingsContext = createContext<BookingsContextType | null>(null);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);

  // ── Fetch real bookings + subscribe to Realtime ────────────────
  useEffect(() => {
    if (!user?.id) return; // demo mode — keep mock data

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
      .channel("bookings-realtime")
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

  const addBooking = useCallback(async (booking: Omit<Booking, "id" | "status">) => {
    const newBooking: Booking = { ...booking, id: `b${Date.now()}`, status: "pending" };
    setBookings(prev => [...prev, newBooking]);
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
  }, [user?.id, user?.role]);

  const getByStatus = useCallback((status: BookingStatus | BookingStatus[]) => {
    const statuses = Array.isArray(status) ? status : [status];
    return bookings.filter(b => statuses.includes(b.status));
  }, [bookings]);

  const getByClient = useCallback((clientId: string) =>
    bookings.filter(b => b.clientId === clientId),
  [bookings]);

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <BookingsContext.Provider value={{
      bookings, pendingCount,
      confirm, decline, markComplete, markNoShow, addBooking,
      getByStatus, getByClient,
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
