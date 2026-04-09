import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type EventCategory = "fitness" | "medical" | "beauty" | "nutrition" | "medication" | "wellness" | "appointment" | "goal";

interface CalendarEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;
  time?: string;
  duration?: string;
  provider?: string;
  location?: string;
  notes?: string;
  completed: boolean;
  recurring?: "daily" | "weekly" | "monthly";
}

const LOCAL_KEY = "bion_calendar_events";

/**
 * Syncs calendar events between localStorage and Supabase.
 */
export function useCalendarSync() {
  const { user } = useAuth();
  const supabaseId = user?.id && !user.id.startsWith("demo_") ? user.id : null;

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]"); }
    catch { return []; }
  });
  const [loading, setLoading] = useState(true);

  // Load from Supabase
  useEffect(() => {
    if (!supabaseId) { setLoading(false); return; }
    const load = async () => {
      try {
        const { data } = await supabase
          .from("calendar_events" as any)
          .select("*")
          .eq("user_id", supabaseId)
          .order("date", { ascending: true });

        if (data && data.length > 0) {
          const mapped: CalendarEvent[] = (data as any[]).map(e => ({
            id: e.id,
            title: e.title,
            category: e.category,
            date: e.date,
            time: e.time,
            duration: e.duration,
            provider: e.provider,
            location: e.location,
            notes: e.notes,
            completed: e.completed,
            recurring: e.recurring,
          }));
          setEvents(mapped);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(mapped));
        }
      } catch { /* localStorage fallback */ }
      setLoading(false);
    };
    load();
  }, [supabaseId]);

  const saveEvents = useCallback((updated: CalendarEvent[]) => {
    setEvents(updated);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
  }, []);

  const addEvent = useCallback((event: CalendarEvent) => {
    const updated = [...events, event];
    saveEvents(updated);

    if (supabaseId) {
      supabase.from("calendar_events" as any).insert({
        id: event.id,
        user_id: supabaseId,
        title: event.title,
        category: event.category,
        date: event.date,
        time: event.time,
        duration: event.duration,
        provider: event.provider,
        location: event.location,
        notes: event.notes,
        completed: false,
        recurring: event.recurring,
      } as any).then(() => {});
    }
  }, [events, saveEvents, supabaseId]);

  const toggleComplete = useCallback((id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, completed: !e.completed } : e);
    saveEvents(updated);

    if (supabaseId) {
      const event = updated.find(e => e.id === id);
      if (event) {
        supabase.from("calendar_events" as any)
          .update({ completed: event.completed } as any)
          .eq("id", id).then(() => {});
      }
    }
  }, [events, saveEvents, supabaseId]);

  const deleteEvent = useCallback((id: string) => {
    const updated = events.filter(e => e.id !== id);
    saveEvents(updated);

    if (supabaseId) {
      supabase.from("calendar_events" as any).delete().eq("id", id).then(() => {});
    }
  }, [events, saveEvents, supabaseId]);

  return { events, addEvent, toggleComplete, deleteEvent, loading };
}
