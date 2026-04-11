import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { useBookings } from "@/contexts/BookingsContext";
import { getProviderImage } from "@/lib/providerImages";
import { ChevronLeft, ChevronRight, Clock, User, MessageSquare, X, Plus, Calendar } from "lucide-react";

interface Booking {
  id: string;
  client: string;
  image: string;
  service: string;
  start: string; // "HH:MM"
  end: string;
  color: string;
  status: "confirmed" | "pending" | "completed";
}

// Generate week starting from a given monday offset
function getWeekDates(offsetWeeks: number) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 06:00 - 19:00

function timeToTop(time: string, hourH: number): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return (h - 6) * hourH + ((m || 0) / 60) * hourH;
}

function durationToHeight(start: string, end: string, hourH: number): number {
  if (!start || !end) return hourH;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
  return Math.max((mins / 60) * hourH, hourH * 0.5);
}

function addMinutes(time: string, mins: number): string {
  if (!time) return "10:00";
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + (m || 0) + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function statusToColor(status: string): string {
  if (status === "confirmed") return "teal";
  if (status === "completed") return "indigo";
  if (status === "pending")   return "amber";
  return "coral";
}

const HOUR_H = 56; // px per hour

export default function ProviderSchedule() {
  const { bookings: allBookings } = useBookings();
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewDay, setViewDay]       = useState(0); // index 0-6 within week
  const [mode, setMode]             = useState<"week" | "day">("week");
  const [detail, setDetail]         = useState<Booking | null>(null);

  const weekDates = getWeekDates(weekOffset);
  const today     = new Date();

  // Build scheduleData from real bookings, grouped by day-of-week within current viewing week
  const scheduleData = useMemo<Record<number, Booking[]>>(() => {
    const grouped: Record<number, Booking[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const weekStart = new Date(weekDates[0]);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekDates[6]);
    weekEnd.setHours(23, 59, 59, 999);

    allBookings
      .filter(b => b.status === "pending" || b.status === "confirmed" || b.status === "completed")
      .forEach(b => {
        if (!b.date) return;
        const bDate = new Date(b.date);
        if (isNaN(bDate.getTime())) return;
        if (bDate < weekStart || bDate > weekEnd) return;

        const dayOfWeek = bDate.getDay();
        const dayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0..Sun=6

        const start = b.time ?? "09:00";
        const durationMins = parseInt(b.duration ?? "60") || 60;
        const end = addMinutes(start, durationMins);

        grouped[dayIdx].push({
          id: b.id,
          client: b.clientName ?? "Client",
          image: getProviderImage(b.clientId ?? b.id, b.clientName ?? "Client"),
          service: b.service,
          start,
          end,
          color: statusToColor(b.status),
          status: b.status === "completed" ? "completed" : b.status === "confirmed" ? "confirmed" : "pending",
        });
      });
    return grouped;
  }, [allBookings, weekOffset]);

  const dayBookings = (dayIdx: number) => scheduleData[dayIdx] ?? [];

  const currentDayBookings = scheduleData[viewDay] ?? [];

  const totalH = HOURS.length * HOUR_H;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
            <p className="text-xs text-muted-foreground">
              {weekDates[0].toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} –{" "}
              {weekDates[6].toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your schedule will populate as clients book with you.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="glass-1 rounded-pill p-1 flex">
              {(["week", "day"] as const).map(v => (
                <motion.button
                  key={v}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMode(v)}
                  className={`px-3 py-1 rounded-pill text-xs font-medium transition-all capitalize ${
                    mode === v ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {v}
                </motion.button>
              ))}
            </div>
            {/* Week nav */}
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 glass-1 rounded-full">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 glass-1 rounded-full">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Day strip */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {weekDates.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            const isSelected = mode === "day" && i === viewDay;
            const dayBookingsCount = (scheduleData[weekOffset === 0 ? i : 99] ?? []).length;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setViewDay(i); setMode("day"); }}
                className={`flex flex-col items-center rounded-2xl px-3 py-2 min-w-[52px] transition-all ${
                  isSelected ? "gradient-indigo" : isToday ? "glass-accent-teal" : "glass-1"
                }`}
              >
                <span className={`text-[10px] font-medium ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                  {DAY_LABELS[i]}
                </span>
                <span className={`text-base font-bold ${isSelected ? "text-white" : isToday ? "text-teal" : "text-foreground"}`}>
                  {d.getDate()}
                </span>
                {/* dot if has bookings */}
                {dayBookingsCount > 0 && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-white/60" : "bg-indigo"}`} />
                )}
                {/* booking count badge */}
                {dayBookingsCount > 0 && (
                  <span className={`text-[8px] mt-0.5 ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                    {dayBookingsCount} booking{dayBookingsCount !== 1 ? 's' : ''}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Week view */}
        {mode === "week" && (
          <div className="glass-1 rounded-3xl p-4">
            <div className="grid grid-cols-8 gap-1">
              {/* Time column */}
              <div className="pt-6">
                {HOURS.map(h => (
                  <div key={h} className="h-14 flex items-start justify-end pr-2">
                    <span className="text-xs text-muted-foreground">{h}:00</span>
                  </div>
                ))}
              </div>
              {/* Day columns */}
              {DAY_LABELS.map((label, di) => (
                <div key={di} className="relative">
                  <div className="text-center text-xs font-medium text-muted-foreground pb-2">
                    {label}
                  </div>
                  <div className="relative border-l border-white/5" style={{ height: totalH }}>
                    {/* Hour lines */}
                    {HOURS.map(h => (
                      <div key={h} className="absolute w-full border-t border-white/5" style={{ top: (h - 6) * HOUR_H }} />
                    ))}
                    {/* Bookings */}
                    {dayBookings(di).map(b => {
                      const top = timeToTop(b.start, HOUR_H);
                      const height = durationToHeight(b.start, b.end, HOUR_H);
                      return (
                        <motion.div
                          key={b.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setDetail(b)}
                          className="absolute left-1 right-1 rounded-xl p-2 cursor-pointer shadow-lg"
                          style={{
                            top,
                            height,
                            background: b.color,
                          }}
                        >
                          <div className="flex items-start gap-2 h-full">
                            <img src={b.image} className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt="" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-white truncate">{b.client}</div>
                              <div className="text-[10px] text-white/80 truncate">{b.service}</div>
                              <div className="text-[10px] text-white/70 mt-0.5">
                                {b.start} – {b.end}
                              </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${
                              b.status === "confirmed" ? "bg-emerald-300" :
                              b.status === "pending" ? "bg-amber-300" : "bg-slate-300"
                            }`} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day view */}
        {mode === "day" && (
          <div className="glass-1 rounded-3xl p-4">
            <div className="grid grid-cols-12 gap-1">
              {/* Time column */}
              <div className="col-span-1 pt-6">
                {HOURS.map(h => (
                  <div key={h} className="h-14 flex items-start justify-end pr-2">
                    <span className="text-xs text-muted-foreground">{h}:00</span>
                  </div>
                ))}
              </div>
              {/* Schedule column */}
              <div className="col-span-11 relative border-l border-white/5" style={{ height: totalH }}>
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} className="absolute w-full border-t border-white/5" style={{ top: (h - 6) * HOUR_H }} />
                ))}
                {/* Bookings */}
                {currentDayBookings.map(b => {
                  const top = timeToTop(b.start, HOUR_H);
                  const height = durationToHeight(b.start, b.end, HOUR_H);
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setDetail(b)}
                      className="absolute left-2 right-2 rounded-xl p-3 cursor-pointer shadow-lg"
                      style={{
                        top,
                        height,
                        background: b.color,
                      }}
                    >
                      <div className="flex items-start gap-3 h-full">
                        <img src={b.image} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{b.client}</div>
                          <div className="text-xs text-white/80 truncate">{b.service}</div>
                          <div className="text-xs text-white/70 mt-1">
                            {b.start} – {b.end}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              b.status === "confirmed" ? "bg-emerald-800/30 text-emerald-300" :
                              b.status === "pending" ? "bg-amber-800/30 text-amber-300" : "bg-slate-800/30 text-slate-300"
                            }`}>
                              {b.status}
                            </div>
                            <Clock className="w-3 h-3 text-white/60" />
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // In a real app, this would open chat
                          }}
                          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                        >
                          <MessageSquare className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            {/* No bookings message */}
            {currentDayBookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <div className="text-sm font-medium text-foreground mb-1">No bookings scheduled</div>
                <div className="text-xs text-muted-foreground mb-3">Your schedule will populate as clients book with you.</div>
                <button className="px-4 py-2 gradient-indigo rounded-full text-sm font-medium">
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Availability
                </button>
              </div>
            )}
          </div>
        )}

        {/* Booking detail modal */}
        <AnimatePresence>
          {detail && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setDetail(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-2 rounded-3xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={detail.image} className="w-12 h-12 rounded-full object-cover" alt="" />
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{detail.client}</h3>
                      <div className="text-sm text-muted-foreground">{detail.service}</div>
                    </div>
                  </div>
                  <button onClick={() => setDetail(null)} className="p-1.5 rounded-full hover:bg-white/10">
                    <X className="w-5 h-5 text-foreground" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Time</div>
                    <div className="font-medium">{detail.start} – {detail.end}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      detail.status === "confirmed" ? "bg-emerald-500/20 text-emerald-300" :
                      detail.status === "pending" ? "bg-amber-500/20 text-amber-300" : "bg-slate-500/20 text-slate-300"
                    }`}>
                      {detail.status}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium">
                      {Math.round(durationToHeight(detail.start, detail.end, 60))} minutes
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button className="flex-1 py-2.5 glass-1 rounded-xl text-sm font-medium">
                    Reschedule
                  </button>
                  <button className="flex-1 py-2.5 gradient-indigo rounded-xl text-sm font-medium">
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom navigation */}
        <ProviderNav active="schedule" />
      </div>

      {/* Coach AI */}
      <BionAssistant
        context={`Provider schedule view. ${
          currentDayBookings.length > 0 
            ? `Showing ${currentDayBookings.length} bookings for ${DAY_LABELS[viewDay]}.`
            : "No bookings scheduled for today."
        }`}
        suggestions={[
          "How can I optimize my schedule for better client retention?",
          "What's the best way to handle last-minute cancellations?",
          "How do I price my services competitively in Pretoria?",
          "Tips for managing multiple clients efficiently"
        ]}
      />
    </div>
  );
}