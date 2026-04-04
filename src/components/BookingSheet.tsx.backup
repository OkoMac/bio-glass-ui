import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BioAvatar from "./BioAvatar";
import { X, ChevronLeft } from "lucide-react";
import BookingCelebration from "./BookingCelebration";
import { useBookings } from "@/contexts/BookingsContext";
import { useAuth } from "@/contexts/AuthContext";

interface BookingSheetProps {
  open: boolean;
  onClose: () => void;
  provider: {
    id?: string;
    name: string;
    specialty: string;
    image: string;
    vertical: "indigo" | "teal" | "coral" | "amber";
    services: { name: string; duration: string; price: string }[];
  };
}

const timeSlots = [
  "8:00am","9:00am","10:00am","11:00am",
  "12:00pm","1:00pm","2:00pm","3:00pm",
  "4:00pm","5:00pm","6:00pm",
];
const takenSlots = ["10:00am","1:00pm","4:00pm"];

function getWeekDates(): { day: string; date: number; month: string; fullLabel: string }[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      day: d.toLocaleDateString("en-ZA", { weekday: "short" }),
      date: d.getDate(),
      month: d.toLocaleDateString("en-ZA", { month: "short" }),
      fullLabel: d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" }),
    };
  });
}

export default function BookingSheet({ open, onClose, provider }: BookingSheetProps) {
  const navigate    = useNavigate();
  const { addBooking } = useBookings();
  const { user }    = useAuth();

  const weekDates = getWeekDates();
  const [step, setStep]                   = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDay, setSelectedDay]     = useState(0);
  const [selectedTime, setSelectedTime]   = useState<string | null>(null);
  const [note, setNote]                   = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  const handleConfirm = () => {
    if (selectedService === null || !selectedTime) return;
    const svc = provider.services[selectedService];
    addBooking({
      clientId:     user?.email ?? "client",
      clientName:   user?.name  ?? "Guest",
      clientImage:  provider.image,
      providerName: provider.name,
      service:      svc.name,
      date:         weekDates[selectedDay].fullLabel,
      time:         selectedTime,
      duration:     svc.duration,
      price:        svc.price,
      note:         note || undefined,
    });
    setShowCelebration(true);
  };

  const handleCelebrationClose = (goToSchedule: boolean) => {
    setShowCelebration(false);
    setStep(1);
    setSelectedService(null);
    setSelectedTime(null);
    setNote("");
    onClose();
    if (goToSchedule) navigate("/schedule");
  };

  const selectedServiceData = selectedService !== null ? provider.services[selectedService] : null;

  if (showCelebration && selectedServiceData) {
    return (
      <BookingCelebration
        provider={provider}
        service={selectedServiceData.name}
        date={weekDates[selectedDay].fullLabel}
        time={selectedTime ?? ""}
        onClose={handleCelebrationClose}
      />
    );
  }

  const sheetHeight = step === 1 ? "44%" : step === 2 ? "78%" : "88%";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-50 bg-obsidian/60" />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-2 rounded-t-[2rem] overflow-hidden"
            style={{ height: sheetHeight }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-8 h-1 rounded-full bg-foreground/20" />
            </div>
            <div className="px-5 pb-6 overflow-y-auto h-full">

              {/* ── Step 1: Select Service ── */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Select Service</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>
                  <div className="space-y-2">
                    {provider.services.map((svc, i) => (
                      <GlassCard key={svc.name}
                        className={`p-4 cursor-pointer transition-all ${selectedService === i ? "!border-indigo shadow-glow-indigo" : ""}`}
                        onClick={() => setSelectedService(i)} whileTap={{ scale: 0.98 }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{svc.name}</p>
                            <p className="text-xs text-muted-foreground">{svc.duration}</p>
                          </div>
                          <span className={`font-data text-sm ${svc.price === "FREE" ? "text-amber" : "text-foreground"}`}>
                            {svc.price}
                          </span>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} disabled={selectedService === null}
                    onClick={() => setStep(2)}
                    className="w-full rounded-pill py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-40">
                    Select Time →
                  </motion.button>
                </motion.div>
              )}

              {/* ── Step 2: Select Time ── */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <h2 className="text-lg font-semibold text-foreground">Select Time</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>
                  {/* Day strip */}
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {weekDates.map((d, i) => (
                      <button key={i} onClick={() => setSelectedDay(i)}
                        className={`flex flex-col items-center gap-0.5 py-2 px-2.5 rounded-xl transition-all shrink-0 ${
                          selectedDay === i ? "glass-accent-indigo" : ""
                        }`}>
                        <span className="text-[10px] text-muted-foreground">{d.day}</span>
                        <span className={`text-sm font-data font-bold ${selectedDay === i ? "text-indigo" : "text-foreground"}`}>{d.date}</span>
                        <span className="text-[9px] text-muted-foreground">{d.month}</span>
                      </button>
                    ))}
                  </div>
                  {/* Slots grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => {
                      const taken    = takenSlots.includes(slot);
                      const selected = selectedTime === slot;
                      return (
                        <motion.button key={slot} whileTap={!taken ? { scale: 0.95 } : undefined}
                          disabled={taken} onClick={() => setSelectedTime(slot)}
                          className={`rounded-pill py-2.5 text-xs font-data transition-all ${
                            taken    ? "glass-1 text-muted-foreground/40 line-through cursor-not-allowed" :
                            selected ? "gradient-indigo text-primary-foreground shadow-cta" :
                                       "glass-1 text-foreground"
                          }`}>
                          {slot}
                        </motion.button>
                      );
                    })}
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} disabled={!selectedTime}
                    onClick={() => setStep(3)}
                    className="w-full rounded-pill py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-40">
                    Continue →
                  </motion.button>
                </motion.div>
              )}

              {/* ── Step 3: Confirm ── */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <h2 className="text-lg font-semibold text-foreground">Confirm Booking</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>
                  <GlassCard className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <BioAvatar src={provider.image} alt={provider.name} size="lg" verticalColor={provider.vertical} verified />
                      <div>
                        <p className="text-base font-semibold text-foreground">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">{provider.specialty}</p>
                      </div>
                    </div>
                    <div className="h-px bg-foreground/5" />
                    <div className="space-y-2">
                      {[
                        { label: "Service",  value: selectedServiceData?.name ?? "" },
                        { label: "Duration", value: selectedServiceData?.duration ?? "" },
                        { label: "Date",     value: weekDates[selectedDay].fullLabel },
                        { label: "Time",     value: selectedTime ?? "" },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span className="text-foreground">{r.value}</span>
                        </div>
                      ))}
                      <div className="h-px bg-foreground/5" />
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-foreground">Total</span>
                        <span className={selectedServiceData?.price === "FREE" ? "text-amber" : "text-foreground"}>
                          {selectedServiceData?.price}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                  <div className="glass-1 rounded-xl p-3">
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Add a note for your provider…"
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none h-16" />
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm}
                    className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta">
                    {selectedServiceData?.price === "FREE" ? "Confirm Booking" : `Pay ${selectedServiceData?.price}`}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
