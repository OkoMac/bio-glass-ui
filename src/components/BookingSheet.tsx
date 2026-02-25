import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "./GlassCard";
import BioAvatar from "./BioAvatar";
import { X, Check, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import BookingCelebration from "./BookingCelebration";

interface BookingSheetProps {
  open: boolean;
  onClose: () => void;
  provider: {
    name: string;
    specialty: string;
    image: string;
    vertical: "indigo" | "teal" | "coral" | "amber";
    services: { name: string; duration: string; price: string }[];
  };
}

const timeSlots = [
  "8:00am", "9:00am", "10:00am", "11:00am",
  "12:00pm", "1:00pm", "2:00pm", "3:00pm",
  "4:00pm", "5:00pm", "6:00pm",
];
const takenSlots = ["10:00am", "1:00pm", "4:00pm"];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dates = [24, 25, 26, 27, 28, 1, 2];

const BookingSheet = ({ open, onClose, provider }: BookingSheetProps) => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleConfirm = () => {
    setShowCelebration(true);
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setStep(1);
    setSelectedService(null);
    setSelectedTime(null);
    onClose();
  };

  const selectedServiceData = selectedService !== null ? provider.services[selectedService] : null;
  const selectedDayLabel = `${weekDays[selectedDay]}, ${dates[selectedDay]} Feb`;

  if (showCelebration) {
    return (
      <BookingCelebration
        provider={provider}
        service={selectedServiceData?.name || ""}
        date={selectedDayLabel}
        time={selectedTime || ""}
        onClose={handleCelebrationClose}
      />
    );
  }

  const sheetHeight = step === 1 ? "40%" : step === 2 ? "75%" : "85%";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-obsidian/60"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="fixed bottom-0 left-0 right-0 z-50 glass-2 rounded-t-[2rem] overflow-hidden"
            style={{ height: sheetHeight }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-8 h-1 rounded-full bg-foreground/20" />
            </div>

            <div className="px-5 pb-6 overflow-y-auto h-full">
              {/* Step 1: Select Service */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Select Service</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>
                  <div className="space-y-2">
                    {provider.services.map((service, i) => (
                      <GlassCard
                        key={service.name}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedService === i ? "!border-indigo shadow-glow-indigo" : ""
                        }`}
                        onClick={() => setSelectedService(i)}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.duration}</p>
                          </div>
                          <span className={`font-data text-sm ${service.price === "FREE" ? "text-amber" : "text-foreground"}`}>
                            {service.price}
                          </span>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={selectedService === null}
                    onClick={() => setStep(2)}
                    className="w-full rounded-pill py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-40"
                  >
                    Select Time →
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2: Select Time */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <h2 className="text-lg font-semibold text-foreground">Select Time</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>

                  {/* Week strip */}
                  <div className="flex gap-2">
                    {weekDays.map((day, i) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(i)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all text-center ${
                          selectedDay === i ? "glass-accent-indigo" : ""
                        }`}
                      >
                        <span className="text-[10px] text-muted-foreground">{day}</span>
                        <span className={`text-sm font-data ${selectedDay === i ? "text-indigo" : "text-foreground"}`}>
                          {dates[i]}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Time slots grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => {
                      const taken = takenSlots.includes(slot);
                      const selected = selectedTime === slot;
                      return (
                        <motion.button
                          key={slot}
                          whileTap={!taken ? { scale: 0.95 } : undefined}
                          disabled={taken}
                          onClick={() => setSelectedTime(slot)}
                          className={`rounded-pill py-2.5 text-xs font-data transition-all ${
                            taken
                              ? "glass-1 text-muted-foreground/40 line-through cursor-not-allowed"
                              : selected
                              ? "gradient-indigo text-primary-foreground shadow-cta"
                              : "glass-1 text-foreground hover:border-indigo/30"
                          }`}
                        >
                          {slot}
                        </motion.button>
                      );
                    })}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={!selectedTime}
                    onClick={() => setStep(3)}
                    className="w-full rounded-pill py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-40"
                  >
                    Continue →
                  </motion.button>
                </motion.div>
              )}

              {/* Step 3: Review & Confirm */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
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
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service</span>
                        <span className="text-foreground">{selectedServiceData?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="text-foreground">{selectedServiceData?.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date</span>
                        <span className="text-foreground">{selectedDayLabel}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-data text-foreground">{selectedTime}</span>
                      </div>
                      <div className="h-px bg-foreground/5" />
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-foreground">Total</span>
                        <span className={selectedServiceData?.price === "FREE" ? "text-amber" : "text-foreground"}>
                          {selectedServiceData?.price}
                        </span>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Note field */}
                  <div className="glass-1 rounded-xl p-3">
                    <textarea
                      placeholder="Add a note for your provider..."
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none h-16"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirm}
                    className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
                  >
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
};

export default BookingSheet;
