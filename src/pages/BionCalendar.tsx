import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useProviderData } from "@/data/useProviderData";
import { getSASTDateKey } from "@/utils/sastDate";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, X, Calendar,
  Dumbbell, Apple, Pill, Heart, Stethoscope, Sparkles, Eye,
  Clock, Target, MapPin, Check
} from "lucide-react";

/* ── Types ──────────────────────────────────────────── */
type EventCategory = "fitness" | "medical" | "beauty" | "nutrition" | "medication" | "wellness" | "appointment" | "goal";

interface CalendarEvent {
  id: string;
  title: string;
  category: EventCategory;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:mm
  duration?: string;
  provider?: string;
  location?: string;
  notes?: string;
  completed: boolean;
  recurring?: "daily" | "weekly" | "monthly";
}

const CATEGORY_CONFIG: Record<EventCategory, { icon: typeof Heart; color: string; bg: string; label: string }> = {
  fitness:     { icon: Dumbbell,    color: "text-teal",   bg: "bg-teal/10",   label: "Fitness" },
  medical:     { icon: Stethoscope, color: "text-indigo", bg: "bg-indigo/10", label: "Medical" },
  beauty:      { icon: Sparkles,    color: "text-coral",  bg: "bg-coral/10",  label: "Beauty" },
  nutrition:   { icon: Apple,       color: "text-amber",  bg: "bg-amber/10",  label: "Nutrition" },
  medication:  { icon: Pill,        color: "text-violet", bg: "bg-violet/10", label: "Medication" },
  wellness:    { icon: Heart,       color: "text-teal",   bg: "bg-teal/10",   label: "Wellness" },
  appointment: { icon: Calendar,    color: "text-indigo", bg: "bg-indigo/10", label: "Appointment" },
  goal:        { icon: Target,      color: "text-amber",  bg: "bg-amber/10",  label: "Goal" },
};

/* ── Sample events ──────────────────────────────────── */
function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

function fmt(d: Date): string { return getSASTDateKey(d); }

function buildSampleEvents(): CalendarEvent[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  const events: CalendarEvent[] = [];

  // Fitness — recurring strength training
  [1, 3, 5].forEach(dayOffset => {
    for (let w = 0; w < 4; w++) {
      const date = new Date(y, m, d + dayOffset + w * 7);
      events.push({
        id: `fit_${fmt(date)}`,
        title: "Strength & Conditioning",
        category: "fitness",
        date: fmt(date),
        time: "17:00",
        duration: "60 min",
        provider: "Bodydynamics PT",
        completed: date < today,
        recurring: "weekly",
      });
    }
  });

  // Recovery — Tue/Thu/Sat
  [2, 4, 6].forEach(dayOffset => {
    for (let w = 0; w < 2; w++) {
      const date = new Date(y, m, d + dayOffset + w * 7);
      events.push({
        id: `rehab_${fmt(date)}`,
        title: "Recovery Routine",
        category: "medical",
        date: fmt(date),
        time: "07:00",
        duration: "30 min",
        provider: "The Chiropractors",
        completed: date < today,
        recurring: "weekly",
      });
    }
  });

  // Beauty — weekly facial
  for (let w = 0; w < 4; w++) {
    const date = new Date(y, m, d + 6 + w * 7);
    events.push({
      id: `beauty_${fmt(date)}`,
      title: "Skincare Routine",
      category: "beauty",
      date: fmt(date),
      time: "20:00",
      duration: "20 min",
      provider: "Annique Beauty",
      completed: date < today,
      recurring: "weekly",
    });
  }

  // Medication — daily
  for (let i = 0; i < 14; i++) {
    const date = new Date(y, m, d + i);
    events.push({
      id: `med_am_${fmt(date)}`,
      title: "Morning Supplements",
      category: "medication",
      date: fmt(date),
      time: "08:00",
      duration: "5 min",
      notes: "Multivitamin, Omega-3, Vitamin D3",
      completed: date < today,
      recurring: "daily",
    });
    events.push({
      id: `med_pm_${fmt(date)}`,
      title: "Evening Supplements",
      category: "medication",
      date: fmt(date),
      time: "21:00",
      duration: "5 min",
      notes: "Magnesium, Probiotic",
      completed: date < today,
      recurring: "daily",
    });
  }

  // Wellness
  for (let i = 0; i < 7; i++) {
    const date = new Date(y, m, d + i);
    events.push({
      id: `well_${fmt(date)}`,
      title: "Morning Meditation",
      category: "wellness",
      date: fmt(date),
      time: "06:30",
      duration: "15 min",
      notes: "Breathing exercise + gratitude journaling",
      completed: date < today,
      recurring: "daily",
    });
  }

  // Nutrition — meal prep days
  [0, 7].forEach(dayOffset => {
    const date = new Date(y, m, d + dayOffset);
    events.push({
      id: `nutr_${fmt(date)}`,
      title: "Meal Prep Sunday",
      category: "nutrition",
      date: fmt(date),
      time: "10:00",
      duration: "2 hours",
      notes: "Prep chicken, rice, veggies for the week",
      completed: date < today,
      recurring: "weekly",
    });
  });

  // Appointments
  events.push({
    id: "apt_chiro",
    title: "Chiropractic Session",
    category: "appointment",
    date: fmt(new Date(y, m, d + 4)),
    time: "15:00",
    duration: "45 min",
    provider: "Dr Vicki Ferreira",
    location: "Centurion",
    completed: false,
  });
  events.push({
    id: "apt_facial",
    title: "Deep Cleansing Facial",
    category: "appointment",
    date: fmt(new Date(y, m, d + 6)),
    time: "10:00",
    duration: "60 min",
    provider: "Annique Beauty Salon",
    location: "Centurion Mall",
    completed: false,
  });
  events.push({
    id: "apt_gp",
    title: "Annual Health Check",
    category: "appointment",
    date: fmt(new Date(y, m, d + 14)),
    time: "09:00",
    duration: "30 min",
    provider: "Centuriomed",
    location: "Centurion",
    completed: false,
  });

  // Goals
  events.push({
    id: "goal_72kg",
    title: "Goal: Reach 72kg",
    category: "goal",
    date: fmt(new Date(y, m + 1, 1)),
    notes: "Current: 74.2kg — 2.2kg to go",
    completed: false,
  });

  return events;
}

const STORAGE_KEY = "bion_calendar_events";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Component ──────────────────────────────────────── */
export default function BionCalendar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isDemo = user?.id?.startsWith("demo_") ?? false;
  const { events, addEvent: syncAddEvent, toggleComplete: syncToggleComplete, deleteEvent: syncDeleteEvent } = useCalendarSync();

  // Seed demo accounts with sample events if empty
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (isDemo && events.length === 0 && !seeded) {
      buildSampleEvents().forEach(e => syncAddEvent(e));
      setSeeded(true);
    }
  }, [isDemo, events.length, seeded]);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(fmt(today));
  const [showAdd, setShowAdd] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">("all");
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({ category: "fitness", date: fmt(today) });
  // Provider typeahead — resolves real BION providers as the user types
  // in the Provider field. Free-form is still allowed (user might book
  // a provider not on BION yet); picking from the list just fills the
  // name verbatim. Lazy-loaded so the calendar doesn't pull the 3MB
  // JHB JSON until the picker is opened.
  const [providerPickerOpen, setProviderPickerOpen] = useState(false);
  const { providers: allProviders } = useProviderData(showAdd ? "all" : "pta");
  const providerSuggestions = useMemo(() => {
    const q = (newEvent.provider ?? "").trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return allProviders
      .filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.service?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [newEvent.provider, allProviders]);

  const monthDays = getMonthDays(currentYear, currentMonth);
  const firstDayOfWeek = monthDays[0].getDay();
  const todayStr = fmt(today);

  const eventsForDate = (date: string) => events.filter(e => e.date === date);

  const selectedEvents = useMemo(() => {
    const dayEvents = eventsForDate(selectedDate);
    if (categoryFilter === "all") return dayEvents;
    return dayEvents.filter(e => e.category === categoryFilter);
  }, [selectedDate, categoryFilter, events]);

  const toggleComplete = (id: string) => syncToggleComplete(id);

  const addEvent = () => {
    if (!newEvent.title?.trim()) return;
    const dateStr = newEvent.date ?? selectedDate;
    const category = newEvent.category ?? "fitness";

    // Past-date guard. The user reported (2026-04-28) that the calendar
    // accepted an 08:00 appointment for "today" at 23:07 silently —
    // appointments in the past are almost always a typo. Block hard for
    // category=appointment, soft confirm for everything else (some users
    // log routines / medication retroactively).
    const eventDateTime = newEvent.time
      ? new Date(`${dateStr}T${newEvent.time}`)
      : new Date(`${dateStr}T23:59`); // end-of-day if time omitted
    const isPast = eventDateTime.getTime() < Date.now();

    if (isPast) {
      if (category === "appointment") {
        import("sonner").then(({ toast }) => toast.error(
          "That appointment time is in the past. Pick a future date and time, or log it as a 'wellness' / 'goal' entry instead.",
          { duration: 5000 },
        ));
        return;
      }
      // Soft confirm for past entries in non-appointment categories.
      const ok = window.confirm(
        `This entry is in the past (${eventDateTime.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}). ` +
        `Add it anyway? (e.g. logging a workout or medication you already took)`,
      );
      if (!ok) return;
    }

    const event: CalendarEvent = {
      id: `custom_${Date.now()}`,
      title: newEvent.title!.trim(),
      category,
      date: dateStr,
      time: newEvent.time,
      duration: newEvent.duration,
      provider: newEvent.provider,
      location: newEvent.location,
      notes: newEvent.notes,
      completed: false,
    };
    syncAddEvent(event);
    setNewEvent({ category: "fitness", date: selectedDate });
    setShowAdd(false);
  };

  // Confirm before deleting — the X button is small and easily mis-tapped
  // (user reported 2026-04-28 that an accidental tap silently removed
  // an entry). Skip the confirm for events the user has already toggled
  // to completed since those are explicitly logged-and-done.
  const deleteEvent = (id: string) => {
    const ev = events.find(e => e.id === id);
    const label = ev?.title ? `"${ev.title}"` : "this entry";
    const ok = window.confirm(`Delete ${label}? This can't be undone.`);
    if (!ok) return;
    syncDeleteEvent(id);
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString("en", { month: "long", year: "numeric" });

  // Count events per day for dots
  const eventCountByDate = useMemo(() => {
    const map: Record<string, Set<EventCategory>> = {};
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = new Set();
      map[e.date].add(e.category);
    });
    return map;
  }, [events]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-20 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">BION Calendar</h1>
            <p className="text-xs text-muted-foreground">All your health, beauty & wellness activities</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-emerald-400 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </motion.button>
        </div>

        {/* Month navigation */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center" aria-label="Previous" title="Previous">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <h2 className="text-sm font-bold text-foreground">{monthName}</h2>
            <button onClick={nextMonth} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center" aria-label="Next" title="Next">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[10px] text-muted-foreground font-medium">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {monthDays.map(day => {
              const dateStr = fmt(day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayCategories = eventCountByDate[dateStr];

              return (
                <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                    isSelected ? "bg-gradient-to-br from-indigo to-violet text-white" :
                    isToday ? "border border-teal/40 text-teal" : "text-foreground hover:bg-white/[0.03]"
                  }`}>
                  <span className="text-xs font-medium">{day.getDate()}</span>
                  {dayCategories && (
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from(dayCategories).slice(0, 3).map(cat => (
                        <span key={cat} className={`w-1 h-1 rounded-full ${
                          cat === "fitness" ? "bg-teal" : cat === "medical" ? "bg-indigo" :
                          cat === "beauty" ? "bg-coral" : cat === "medication" ? "bg-violet" :
                          cat === "nutrition" ? "bg-amber" : "bg-teal"
                        }`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
          <button onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-pill text-xs font-medium border whitespace-nowrap transition-all ${
              categoryFilter === "all" ? "border-teal/40 bg-teal/10 text-teal" : "border-white/08 text-muted-foreground"
            }`}>All</button>
          {(Object.keys(CATEGORY_CONFIG) as EventCategory[]).map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium border whitespace-nowrap transition-all flex items-center gap-1 ${
                  categoryFilter === cat ? `border-current ${cfg.color} bg-white/5` : "border-white/08 text-muted-foreground"
                }`}>
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Events for selected date */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedDate === todayStr ? "Today" : new Date(selectedDate + "T12:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "short" })}
            </p>
            <span className="text-xs text-muted-foreground">{selectedEvents.length} events</span>
          </div>

          {selectedEvents.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-foreground mb-1">No events</p>
              <p className="text-xs text-muted-foreground mb-3">Nothing scheduled for this day</p>
              <button onClick={() => setShowAdd(true)}
                className="text-xs text-teal font-medium"><Plus className="w-3 h-3 inline mr-1" />Add event</button>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {selectedEvents.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")).map(event => {
                const cfg = CATEGORY_CONFIG[event.category];
                const Icon = cfg.icon;
                return (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <GlassCard className={`p-3.5 ${event.completed ? "opacity-60" : ""}`}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleComplete(event.id)}
                          className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          {event.completed ? <Check className={`w-4 h-4 ${cfg.color}`} /> : <Icon className={`w-4 h-4 ${cfg.color}`} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${event.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {event.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {event.time && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="w-2.5 h-2.5" /> {event.time}
                              </span>
                            )}
                            {event.duration && (
                              <span className="text-[10px] text-muted-foreground">{event.duration}</span>
                            )}
                            {event.provider && (
                              <span className={`text-[10px] ${cfg.color}`}>{event.provider}</span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <MapPin className="w-2.5 h-2.5" /> {event.location}
                              </span>
                            )}
                          </div>
                          {event.notes && (
                            <p className="text-[10px] text-muted-foreground mt-1">{event.notes}</p>
                          )}
                        </div>
                        <button onClick={() => deleteEvent(event.id)} className="text-muted-foreground hover:text-coral text-xs shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${cfg.bg.replace("/10", "")}`} style={{ backgroundColor: key === "fitness" ? "#0D9488" : key === "medical" ? "#6366F1" : key === "beauty" ? "#F05A28" : key === "nutrition" ? "#F59E0B" : key === "medication" ? "#8B5CF6" : key === "wellness" ? "#0D9488" : key === "appointment" ? "#6366F1" : "#F59E0B" }} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Add Event Sheet ────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div key="add-ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)} className="fixed inset-0 bg-obsidian/60 z-[60]" />
            <motion.div key="add-sheet"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] p-5 max-h-[80vh] overflow-y-auto"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Add Event</h3>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Title *</label>
                  <input value={newEvent.title ?? ""} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Gym session, Take medication"
                    className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-teal/40 transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(([key, cfg]) => (
                      <button key={key} onClick={() => setNewEvent(p => ({ ...p, category: key }))}
                        className={`px-2.5 py-1.5 rounded-pill text-[10px] font-medium border transition-all ${
                          newEvent.category === key ? `border-current ${cfg.color} bg-white/5` : "border-white/08 text-muted-foreground"
                        }`}>{cfg.label}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Date</label>
                    <input type="date" value={newEvent.date ?? selectedDate}
                      onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/08" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Time</label>
                    <input type="time" value={newEvent.time ?? ""}
                      onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))}
                      className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/08" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Duration</label>
                    <input value={newEvent.duration ?? ""} onChange={e => setNewEvent(p => ({ ...p, duration: e.target.value }))}
                      placeholder="e.g. 60 min"
                      className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08" />
                  </div>
                  <div className="relative">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Provider</label>
                    <input
                      value={newEvent.provider ?? ""}
                      onChange={e => { setNewEvent(p => ({ ...p, provider: e.target.value })); setProviderPickerOpen(true); }}
                      onFocus={() => setProviderPickerOpen(true)}
                      onBlur={() => setTimeout(() => setProviderPickerOpen(false), 150)}
                      placeholder="Search BION providers (optional)"
                      className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08"
                    />
                    {providerPickerOpen && providerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 z-20 glass-2 rounded-xl border border-white/[0.08] overflow-hidden shadow-card max-h-64 overflow-y-auto">
                        {providerSuggestions.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); setNewEvent(prev => ({ ...prev, provider: p.name })); setProviderPickerOpen(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0"
                          >
                            <p className="text-sm text-foreground truncate">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.service} · {p.location}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Notes</label>
                  <input value={newEvent.notes ?? ""} onChange={e => setNewEvent(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Any additional details"
                    className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08" />
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={addEvent}
                disabled={!newEvent.title?.trim()}
                className="w-full mt-4 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-teal to-emerald-400 disabled:opacity-40">
                Add to Calendar
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BionAssistant />
      <BottomNav />
    </div>
  );
}
