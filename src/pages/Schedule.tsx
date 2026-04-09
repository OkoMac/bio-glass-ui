import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { Calendar, ChevronLeft, ChevronRight, Clock, Star } from "lucide-react";
import { useBookings } from "@/contexts/BookingsContext";

const verticalByService: Record<string, "teal" | "indigo" | "coral" | "amber"> = {
  "Personal Training": "teal",
  "Strength Assessment": "indigo",
  "Free Intro": "teal",
  "Free Intro Session": "teal",
  "Signature Facial": "coral",
  "Private Yoga": "amber",
  "Rehab Session": "indigo",
  "Nutrition Consultation": "teal",
};

const borderByVertical: Record<string, string> = {
  teal: "border-l-teal", indigo: "border-l-indigo",
  coral: "border-l-coral", amber: "border-l-amber",
};

const STATUS_CLS: Record<string, string> = {
  pending:   "glass-accent-amber text-amber",
  confirmed: "glass-accent-teal text-teal",
  completed: "glass-1 text-muted-foreground",
  declined:  "glass-accent-coral text-coral",
  no_show:   "glass-accent-coral text-coral",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed",
  completed: "Completed", declined: "Declined", no_show: "No Show",
};

function getWeekDates() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      day: d.toLocaleDateString("en-ZA", { weekday: "short" }),
      date: d.getDate(),
      month: d.toLocaleDateString("en-ZA", { month: "short" }),
      fullLabel: d.toLocaleDateString("en-ZA", {
        weekday: "short", day: "numeric", month: "short",
      }),
    };
  });
}

const Schedule = () => {
  const { getByStatus } = useBookings();
  const weekDates = getWeekDates();
  const [selectedDay, setSelectedDay] = useState(0);

  const upcoming = getByStatus(["pending", "confirmed"]);
  const past     = getByStatus(["completed", "no_show", "declined"]);

  const selectedLabel = weekDates[selectedDay].fullLabel;
  const dayBookings   = upcoming.filter(b => b.date === selectedLabel);

  // Mark which days in the strip have bookings
  const hasDot = weekDates.map(d => upcoming.some(b => b.date === d.fullLabel));

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-12 space-y-5">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Schedule</h1>
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Week strip */}
        <div className="flex items-center gap-2">
          <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 flex gap-1">
            {weekDates.map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  selectedDay === i ? "glass-accent-indigo" : ""
                }`}
              >
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
                <span className={`text-sm font-data ${
                  i === 0 ? "text-indigo font-bold" :
                  selectedDay === i ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {d.date}
                </span>
                {hasDot[i] && <div className="w-1 h-1 rounded-full bg-teal" />}
              </button>
            ))}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>

        {/* Selected day bookings */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {selectedLabel} — {dayBookings.length === 0 ? "No bookings" :
              `${dayBookings.length} booking${dayBookings.length > 1 ? "s" : ""}`}
          </h2>
          {dayBookings.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-sm text-muted-foreground">No bookings for this day</p>
              <p className="text-xs text-muted-foreground mt-1">Explore providers to book a session</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {dayBookings.map((b, i) => {
                const v = verticalByService[b.service] ?? "indigo";
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <GlassCard hover className={`p-4 border-l-2 ${borderByVertical[v]}`}>
                      <div className="flex items-center gap-3">
                        <img src={b.clientImage} alt={b.providerName ?? b.service}
                          className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{b.service}</p>
                          <p className="text-xs text-muted-foreground">{b.providerName ?? "Provider"}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{b.time} · {b.duration}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold font-data text-foreground">{b.price}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-pill mt-1 inline-block ${STATUS_CLS[b.status]}`}>
                            {STATUS_LABEL[b.status]}
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* All upcoming */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              All Upcoming ({upcoming.length})
            </h2>
            <div className="space-y-2">
              {upcoming.map((b, i) => {
                const v = verticalByService[b.service] ?? "indigo";
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <GlassCard hover className={`p-4 border-l-2 ${borderByVertical[v]}`}>
                      <div className="flex items-center gap-3">
                        <img src={b.clientImage} alt={b.providerName ?? b.service}
                          className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{b.service}</p>
                          <p className="text-xs text-muted-foreground">{b.providerName ?? "Provider"}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{b.date} · {b.time}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold font-data text-foreground">{b.price}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-pill mt-1 inline-block ${STATUS_CLS[b.status]}`}>
                            {STATUS_LABEL[b.status]}
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Past</h2>
            <div className="space-y-2">
              {past.map(b => {
                const v = verticalByService[b.service] ?? "indigo";
                return (
                  <GlassCard key={b.id} className={`p-3 border-l-2 ${borderByVertical[v]} opacity-60`}>
                    <div className="flex items-center gap-3">
                      <img src={b.clientImage} alt={b.service}
                        className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{b.service}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {b.providerName ?? "Provider"} · {b.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {b.status === "completed" && (
                          <button className="text-[10px] text-indigo font-medium flex items-center gap-0.5">
                            <Star className="w-3 h-3" /> Review
                          </button>
                        )}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-pill ${STATUS_CLS[b.status]}`}>
                          {STATUS_LABEL[b.status]}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
      <BionAssistant />
    </div>
  );
};

export default Schedule;
