import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import CoachAI from "@/components/CoachAI";
import { ChevronLeft, ChevronRight, Clock, User, MessageSquare, X, Plus } from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

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
  const now = new Date(2026, 1, 23); // Monday Feb 23
  const monday = new Date(now);
  monday.setDate(now.getDate() + offsetWeeks * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 06:00 – 19:00

const mockBookings: Record<number, Booking[]> = {
  0: [
    { id: "b1", client: "Mpho Sithole",    image: provider1, service: "Personal Training", start: "07:00", end: "08:00", color: "#6366F1", status: "confirmed"  },
    { id: "b2", client: "Thandi Khumalo",  image: provider2, service: "Strength Assessment", start: "09:00", end: "09:30", color: "#2DD4BF", status: "confirmed"  },
    { id: "b3", client: "Kobus Pretorius", image: provider3, service: "Personal Training", start: "10:00", end: "11:00", color: "#6366F1", status: "pending"    },
    { id: "b4", client: "Naledi Moyo",     image: provider4, service: "Personal Training", start: "11:30", end: "12:30", color: "#6366F1", status: "confirmed"  },
    { id: "b5", client: "Mpho Sithole",    image: provider1, service: "Personal Training", start: "14:00", end: "15:00", color: "#6366F1", status: "confirmed"  },
  ],
  1: [
    { id: "b6", client: "Thandi Khumalo",  image: provider2, service: "Personal Training", start: "07:30", end: "08:30", color: "#6366F1", status: "confirmed"  },
    { id: "b7", client: "Naledi Moyo",     image: provider4, service: "Free Intro",        start: "10:00", end: "10:30", color: "#A78BFA", status: "confirmed"  },
  ],
  2: [
    { id: "b8", client: "Kobus Pretorius", image: provider3, service: "Personal Training", start: "08:00", end: "09:00", color: "#6366F1", status: "confirmed"  },
  ],
};

function timeToTop(time: string, hourH: number): number {
  const [h, m] = time.split(":").map(Number);
  return (h - 6) * hourH + (m / 60) * hourH;
}

function durationToHeight(start: string, end: string, hourH: number): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return (mins / 60) * hourH;
}

const HOUR_H = 56; // px per hour

export default function ProviderSchedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewDay, setViewDay]       = useState(0); // index 0-6 within week
  const [mode, setMode]             = useState<"week" | "day">("week");
  const [detail, setDetail]         = useState<Booking | null>(null);

  const weekDates = getWeekDates(weekOffset);
  const today     = new Date();

  const dayBookings = (dayIdx: number) =>
    (mockBookings[weekOffset === 0 ? dayIdx : 99] ?? []).filter((_, i) => dayIdx === 0 || i < 1);

  const currentDayBookings = mockBookings[weekOffset === 0 ? viewDay : 99] ?? [];

  const totalH = HOURS.length * HOUR_H;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-3xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
            <p className="text-xs text-muted-foreground">
              {weekDates[0].toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} –{" "}
              {weekDates[6].toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
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
                {(mockBookings[weekOffset === 0 ? i : 99] ?? []).length > 0 && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-white/60" : "bg-indigo"}`} />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Calendar grid */}
        <GlassCard className="p-0 overflow-hidden">
          {mode === "week" ? (
            /* Week view */
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                {/* Day headers */}
                <div className="grid grid-cols-8 border-b border-white/5">
                  <div className="p-2" /> {/* time gutter */}
                  {weekDates.map((d, i) => (
                    <div key={i} className={`p-2 text-center border-l border-white/5 ${
                      d.toDateString() === today.toDateString() ? "bg-white/[0.03]" : ""
                    }`}>
                      <p className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</p>
                      <p className={`text-sm font-bold ${d.toDateString() === today.toDateString() ? "text-teal" : "text-foreground"}`}>
                        {d.getDate()}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Time grid */}
                <div className="relative" style={{ height: `${totalH}px` }}>
                  {/* Hour lines */}
                  {HOURS.map((h, hi) => (
                    <div key={h} className="absolute left-0 right-0 flex" style={{ top: `${hi * HOUR_H}px` }}>
                      <div className="w-12 pr-2 shrink-0 text-right">
                        <span className="text-[9px] text-muted-foreground">{String(h).padStart(2,"0")}:00</span>
                      </div>
                      <div className="flex-1 border-t border-white/[0.04]" />
                    </div>
                  ))}
                  {/* Booking blocks — only day 0 for demo */}
                  <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                    <div /> {/* gutter */}
                    {weekDates.map((_, di) => (
                      <div key={di} className="relative border-l border-white/[0.04]">
                        {(mockBookings[weekOffset === 0 ? di : 99] ?? []).map(b => (
                          <div
                            key={b.id}
                            onClick={() => setDetail(b)}
                            className="absolute left-0.5 right-0.5 rounded-lg px-1 py-0.5 cursor-pointer pointer-events-auto overflow-hidden"
                            style={{
                              top:    `${timeToTop(b.start, HOUR_H)}px`,
                              height: `${Math.max(durationToHeight(b.start, b.end, HOUR_H) - 2, 20)}px`,
                              background: `${b.color}30`,
                              borderLeft: `2px solid ${b.color}`,
                            }}
                          >
                            <p className="text-[9px] font-semibold leading-tight truncate" style={{ color: b.color }}>
                              {b.client.split(" ")[0]}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Day view */
            <div className="relative" style={{ height: `${totalH}px`, overflow: "auto" }}>
              {HOURS.map((h, hi) => (
                <div key={h} className="absolute left-0 right-0 flex" style={{ top: `${hi * HOUR_H}px` }}>
                  <div className="w-12 pr-2 shrink-0 text-right pt-0.5">
                    <span className="text-[9px] text-muted-foreground">{String(h).padStart(2,"0")}:00</span>
                  </div>
                  <div className="flex-1 border-t border-white/[0.05]" />
                </div>
              ))}
              <div className="absolute left-14 right-2 top-0 bottom-0">
                {currentDayBookings.map(b => (
                  <div
                    key={b.id}
                    onClick={() => setDetail(b)}
                    className="absolute left-0 right-0 rounded-xl px-3 py-2 cursor-pointer"
                    style={{
                      top:    `${timeToTop(b.start, HOUR_H)}px`,
                      height: `${Math.max(durationToHeight(b.start, b.end, HOUR_H) - 4, 32)}px`,
                      background: `${b.color}22`,
                      borderLeft: `3px solid ${b.color}`,
                    }}
                  >
                    <p className="text-xs font-semibold" style={{ color: b.color }}>{b.client}</p>
                    <p className="text-[10px] text-muted-foreground">{b.service} · {b.start}–{b.end}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Add session FAB */}
        <div className="flex justify-end">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 gradient-indigo rounded-pill px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg"
          >
            <Plus className="w-4 h-4" /> Block time
          </motion.button>
        </div>
      </div>

      {/* Booking detail modal */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetail(null)}
              className="fixed inset-0 bg-obsidian/70 z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden pb-safe"
              style={{ background: "rgba(14,14,22,0.97)", backdropFilter: "blur(60px)" }}
            >
              <div className="px-5 py-6 space-y-4">
                <div className="flex justify-center mb-1">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>
                <div className="flex items-center gap-4">
                  <img src={detail.image} alt={detail.client} className="w-14 h-14 rounded-2xl object-cover" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{detail.client}</h2>
                    <p className="text-xs text-muted-foreground">{detail.service}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-pill mt-1 inline-block ${
                      detail.status === "confirmed" ? "glass-accent-teal text-teal" :
                      detail.status === "pending"   ? "glass-accent-amber text-amber" :
                      "glass-1 text-muted-foreground"
                    }`}>
                      {detail.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="w-4 h-4 text-indigo" />
                  {detail.start} – {detail.end}
                </div>
                <div className="flex gap-2 pt-2">
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setDetail(null)}
                    className="flex-1 py-3 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2">
                    <User className="w-4 h-4" /> View client
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setDetail(null)}
                    className="flex-1 py-3 glass-1 rounded-pill text-sm font-medium text-foreground flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo" /> Message
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setDetail(null)}
                    className="p-3 glass-1 rounded-pill text-muted-foreground">
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CoachAI />
      <ProviderNav />
    </div>
  );
}
