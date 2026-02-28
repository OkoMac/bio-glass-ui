import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

const views = ["Day", "Week", "Month"];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dates = [24, 25, 26, 27, 28, 1, 2];

const appointments = [
  { id: 1, time: "9:00am", endTime: "10:00am", provider: "Lisa Dlamini", service: "Personal Training", image: provider1, vertical: "teal" as const, status: "Confirmed" },
  { id: 2, time: "2:00pm", endTime: "3:00pm", provider: "Dr. Kagiso Sithole", service: "Rehab Session", image: provider2, vertical: "indigo" as const, status: "Confirmed" },
  { id: 3, time: "5:00pm", endTime: "6:15pm", provider: "Sarah Chen", service: "Signature Facial", image: provider3, vertical: "coral" as const, status: "Pending" },
];

const pastAppointments = [
  { id: 4, time: "10:00am", date: "Feb 20", provider: "Amir Patel", service: "Private Yoga", image: provider4, vertical: "amber" as const, reviewed: false },
  { id: 5, time: "3:00pm", date: "Feb 18", provider: "Lisa Dlamini", service: "Personal Training", image: provider1, vertical: "teal" as const, reviewed: true },
];

const timeSlots = ["6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm"];

const verticalColors: Record<string, string> = {
  teal: "border-l-teal",
  indigo: "border-l-indigo",
  coral: "border-l-coral",
  amber: "border-l-amber",
};

const Schedule = () => {
  const [activeView, setActiveView] = useState("Day");
  const [selectedDay, setSelectedDay] = useState(1); // Tuesday (index 1 = 25th)

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="mx-auto max-w-lg lg:max-w-none px-4 lg:px-8 xl:px-12 pt-12 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Schedule</h1>
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* View Toggle */}
        <div className="glass-1 rounded-pill p-1 flex">
          {views.map((v) => (
            <motion.button
              key={v}
              onClick={() => setActiveView(v)}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 rounded-pill py-2 text-sm font-medium transition-all ${
                activeView === v ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {v}
            </motion.button>
          ))}
        </div>

        {/* Week Strip */}
        <div className="flex items-center gap-2">
          <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 flex gap-1">
            {weekDays.map((day, i) => {
              const isToday = i === 1;
              const isSelected = selectedDay === i;
              const hasAppointment = i === 1 || i === 3;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(i)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                    isSelected ? "glass-accent-indigo" : ""
                  }`}
                >
                  <span className="text-[10px] text-muted-foreground">{day}</span>
                  <span className={`text-sm font-data ${isToday ? "text-indigo font-bold" : isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {dates[i]}
                  </span>
                  {hasAppointment && (
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-teal" />
                      <div className="w-1 h-1 rounded-full bg-indigo" />
                      {i === 1 && <div className="w-1 h-1 rounded-full bg-coral" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>

        {/* Day View Timeline */}
        {activeView === "Day" && (
          <div className="relative">
            {timeSlots.map((time, i) => {
              const appointment = appointments.find((a) => a.time.replace(":00", "").replace("am", "am").replace("pm", "pm") === time.replace("am", "am").replace("pm", "pm"));
              return (
                <div key={time} className="flex gap-3 min-h-[48px]">
                  <span className="w-10 text-xs font-data text-muted-foreground pt-1 shrink-0 text-right">{time}</span>
                  <div className="flex-1 border-t border-foreground/5 relative">
                    {appointment && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <GlassCard
                          hover
                          className={`p-3 my-1 border-l-2 ${verticalColors[appointment.vertical]}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <BioAvatar src={appointment.image} alt={appointment.provider} size="sm" verticalColor={appointment.vertical} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{appointment.service}</p>
                              <p className="text-[10px] text-muted-foreground">{appointment.provider}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] font-data text-foreground">{appointment.time}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-pill ${
                                appointment.status === "Confirmed" ? "glass-accent-teal text-teal" : "glass-accent-amber text-amber"
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Week View */}
        {activeView === "Week" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">February 24 – March 2</p>
            {appointments.map((apt, i) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard hover className={`p-4 border-l-2 ${verticalColors[apt.vertical]}`}>
                  <div className="flex items-center gap-3">
                    <BioAvatar src={apt.image} alt={apt.provider} size="md" verticalColor={apt.vertical} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{apt.service}</p>
                      <p className="text-xs text-muted-foreground">{apt.provider}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-data text-foreground">{apt.time}</p>
                      <p className="text-[10px] text-muted-foreground">Tue, 25 Feb</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Month View */}
        {activeView === "Month" && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground text-center">February 2026</p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDays.map((d) => (
                <span key={d} className="text-[10px] text-muted-foreground py-1">{d}</span>
              ))}
              {/* Empty cells for padding */}
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={`empty-${i}`} />
              ))}
              {Array.from({ length: 28 }).map((_, i) => {
                const day = i + 1;
                const hasEvent = [3, 7, 10, 14, 18, 20, 25].includes(day);
                const isToday = day === 25;
                return (
                  <button
                    key={day}
                    className={`py-2 rounded-lg text-xs transition-all ${
                      isToday ? "glass-accent-indigo text-indigo font-bold" : "text-foreground"
                    }`}
                  >
                    {day}
                    {hasEvent && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-indigo" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Appointments */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Past</h2>
          <div className="space-y-2">
            {pastAppointments.map((apt) => (
              <GlassCard key={apt.id} className={`p-3 border-l-2 ${verticalColors[apt.vertical]} opacity-60`}>
                <div className="flex items-center gap-3">
                  <BioAvatar src={apt.image} alt={apt.provider} size="sm" verticalColor={apt.vertical} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{apt.service}</p>
                    <p className="text-[10px] text-muted-foreground">{apt.provider} · {apt.date}</p>
                  </div>
                  {!apt.reviewed && (
                    <button className="text-[10px] text-indigo font-medium">Leave Review</button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Schedule;
