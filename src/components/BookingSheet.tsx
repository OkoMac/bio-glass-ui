import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "./GlassCard";
import BioAvatar from "./BioAvatar";
import { X, ChevronLeft, CreditCard, Shield, Lock, AlertCircle, Check, Loader2 } from "lucide-react";
import BookingCelebration from "./BookingCelebration";
import { haptics } from "@/lib/haptics";
import StripePaymentForm from "./StripePaymentForm";
import { useBookings } from "@/contexts/BookingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRegisteredProvider } from "@/hooks/useRegisteredProvider";

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

  // Slug → BION profile UUID resolution. Shared with ProviderProfile
  // so the lookup happens once per slug; both surfaces converge on
  // the same profileId for provider notifications, marketing wallet
  // credit, payouts, and points attribution.
  const { profileId: registeredProviderId } = useRegisteredProvider(provider.id);

  const weekDates = getWeekDates();
  const [step, setStep]                   = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDay, setSelectedDay]     = useState(0);
  const [selectedTime, setSelectedTime]   = useState<string | null>(null);
  const [note, setNote]                   = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    price: string;
    fees: string;
    totalPaid: string;
  } | null>(null);
  const [stripePaymentId, setStripePaymentId] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Check authentication when sheet opens
  useEffect(() => {
    if (open && !user) {
      // Redirect to signup if not authenticated
      navigate('/welcome?login=true');
      onClose();
    }
  }, [open, user, navigate, onClose]);

  // Calculate fees (5% to business + 5% to client = 10% total)
  const calculateFees = () => {
    if (selectedService === null) return { servicePrice: 0, businessFee: 0, clientFee: 0, total: 0 };
    
    const svc = provider.services[selectedService];
    const priceStr = svc.price.replace('R', '').replace(',', '').replace('FREE', '0');
    const servicePrice = parseFloat(priceStr) || 0;
    
    const businessFee = servicePrice * 0.05; // 5% to business
    const clientFee = servicePrice * 0.05;   // 5% to client
    const total = servicePrice + clientFee;  // Client pays service price + their 5% fee
    
    return { servicePrice, businessFee, clientFee, total };
  };

  const handlePayment = async () => {
    if (selectedService === null || !selectedTime) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const svc = provider.services[selectedService];
      const fees = calculateFees();
      
      // Store payment details for celebration display
      setPaymentDetails({
        price: `R${fees.servicePrice.toFixed(0)}`,
        fees: `R${fees.clientFee.toFixed(0)} (5%)`,
        totalPaid: `R${fees.total.toFixed(0)}`,
      });
      
      addBooking({
      clientId:     user?.profileId ?? user?.email ?? "client",
      // Resolved BION profile UUID (when the provider has claimed +
      // verified their listing) so notifications, wallet credit, and
      // payout flows attach correctly. NULL for directory-only providers.
      providerId:   registeredProviderId ?? undefined,
        clientName:   user?.name  ?? "Guest",
        clientImage:  provider.image,
        providerName: provider.name,
        service:      svc.name,
        date:         weekDates[selectedDay].fullLabel,
        time:         selectedTime,
        duration:     svc.duration,
        price:        `R${fees.servicePrice.toFixed(0)}`,
        fees:         `R${fees.clientFee.toFixed(0)} (5%)`,
        totalPaid:    `R${fees.total.toFixed(0)}`,
        providerEarns: `R${(fees.servicePrice - fees.businessFee).toFixed(0)}`,
        note:         note || undefined,
        paymentStatus: 'paid',
      });
      
      setIsProcessing(false);
      setShowCelebration(true);
      haptics.success();
    }, 1500);
  };

  const handleConfirm = () => {
    // Old confirm function - now we go to payment step
    setStep(3); // Go to payment step
  };

  const handleStripePaymentSuccess = (paymentIntentId: string) => {
    if (selectedService === null || !selectedTime) return;
    
    const svc = provider.services[selectedService];
    const fees = calculateFees();
    
    // Store payment details for celebration display
    setPaymentDetails({
      price: `R${fees.servicePrice.toFixed(0)}`,
      fees: `R${fees.clientFee.toFixed(0)} (5%)`,
      totalPaid: `R${fees.total.toFixed(0)}`,
    });
    
    // Create booking with real payment
    addBooking({
      // Was user?.email — looks like an id but isn't one. Notifications
      // FK on profiles.id (UUID); cancel/refund flows pass clientId in
      // payloads. Email-as-id silently broke both. profileId is the
      // canonical reference.
      clientId:     user?.profileId ?? user?.email ?? "client",
      clientName:   user?.name  ?? "Guest",
      clientImage:  provider.image,
      providerName: provider.name,
      service:      svc.name,
      date:         weekDates[selectedDay].fullLabel,
      time:         selectedTime,
      duration:     svc.duration,
      price:        `R${fees.servicePrice.toFixed(0)}`,
      fees:         `R${fees.clientFee.toFixed(0)} (5%)`,
      totalPaid:    `R${fees.total.toFixed(0)}`,
      providerEarns: `R${(fees.servicePrice - fees.businessFee).toFixed(0)}`,
      note:         note || undefined,
      paymentStatus: 'paid',
      stripePaymentId: paymentIntentId,
    });
    
    setStripePaymentId(paymentIntentId);
    setShowCelebration(true);
    haptics.success();
  };

  const handleStripePaymentError = (error: string) => {
    setStripeError(error);
    setIsProcessing(false);
    haptics.error();
  };

  const handleCelebrationClose = (goToSchedule: boolean) => {
    setShowCelebration(false);
    setStep(1);
    setSelectedService(null);
    setSelectedTime(null);
    setNote("");
    setPaymentDetails(null);
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
        price={selectedServiceData.price}
        fees={paymentDetails?.fees}
        totalPaid={paymentDetails?.totalPaid}
        paymentStatus="paid"
      />
    );
  }

  const sheetHeight = step === 1 ? "55%" : step === 2 ? "80%" : step === 3 ? "90%" : "92%";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[60] bg-obsidian/60" />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="fixed bottom-0 left-0 right-0 z-[60] glass-2 rounded-t-[2rem] overflow-hidden"
            style={{ height: sheetHeight }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-8 h-1 rounded-full bg-foreground/20" />
            </div>
            <div className="px-5 pb-24 overflow-y-auto h-full">

              {/* ── Step 1: Select Service ── */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Select Service</h2>
                    <button onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-muted-foreground" /></button>
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
                    <button onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-muted-foreground" /></button>
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

              {/* ── Step 3: Payment & Confirm ── */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <h2 className="text-lg font-semibold text-foreground">Secure Payment</h2>
                    <button onClick={onClose} aria-label="Close"><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>
                  
                  {/* Booking Summary */}
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
                      
                      {/* Fee Breakdown */}
                      <div className="h-px bg-foreground/5 mt-3" />
                      {selectedServiceData?.price !== "FREE" && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Service fee</span>
                            <span className="text-foreground">{selectedServiceData?.price}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Platform fee (5%)
                            </span>
                            <span className="text-foreground">R{calculateFees().clientFee.toFixed(0)}</span>
                          </div>
                          <div className="h-px bg-foreground/5" />
                          <div className="flex justify-between text-sm font-semibold">
                            <span className="text-foreground">Total to pay</span>
                            <span className="text-indigo">R{calculateFees().total.toFixed(0)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Provider receives: R{(calculateFees().servicePrice - calculateFees().businessFee).toFixed(0)} (after 5% platform fee)
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </GlassCard>
                  
                  {/* Payment Section - Conditional based on service price */}
                  {selectedServiceData?.price === "FREE" ? (
                    <>
                      {/* Free Service - Simple confirmation */}
                      {/* Payment Method (simplified for free) */}
                      <div className="glass-1 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Free Service
                        </h3>
                        <div className="space-y-2">
                          <div className="w-full p-3 rounded-xl glass-accent-teal flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center">
                                <Check className="w-4 h-4 text-teal" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">No Payment Required</p>
                                <p className="text-xs text-muted-foreground">This is a free service</p>
                              </div>
                            </div>
                            <div className="w-5 h-5 rounded-full gradient-teal flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Note */}
                      <div className="glass-1 rounded-xl p-3">
                        <textarea value={note} onChange={e => setNote(e.target.value)}
                          placeholder="Add a note for your provider…"
                          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none h-16" />
                      </div>
                      
                      {/* Secure Booking Info */}
                      <div className="glass-1 rounded-xl p-3 flex items-start gap-2">
                        <Shield className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Secure Booking</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Your booking is confirmed instantly. Cancel 24h+ before: 10% fee, 90% refunded. Cancel &lt;24h: 50% fee, 50% refunded.
                          </p>
                        </div>
                      </div>
                      
                      {/* Confirm Button for Free Service */}
                      <motion.button 
                        whileTap={{ scale: isProcessing ? 1 : 0.97 }}
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full rounded-pill py-4 text-base font-semibold gradient-teal text-primary-foreground shadow-cta disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          "Confirm Free Booking"
                        )}
                      </motion.button>
                    </>
                  ) : (
                    <>
                      {/* Paid Service - Stripe Payment Integration */}
                      <div className="glass-1 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" /> Secure Payment
                        </h3>
                        
                        {stripeError && (
                          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            {stripeError}
                          </div>
                        )}
                        
                        <StripePaymentForm
                          amount={calculateFees().total}
                          currency="zar"
                          bookingDetails={{
                            providerId: provider.id || provider.name,
                            serviceId: selectedService?.toString() || "",
                            date: weekDates[selectedDay].fullLabel,
                            time: selectedTime || "",
                            note: note || undefined,
                          }}
                          onSuccess={handleStripePaymentSuccess}
                          onError={handleStripePaymentError}
                          onCancel={() => setStep(2)}
                        />
                      </div>
                      
                      {/* Note */}
                      <div className="glass-1 rounded-xl p-3">
                        <textarea value={note} onChange={e => setNote(e.target.value)}
                          placeholder="Add a note for your provider…"
                          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none h-16" />
                      </div>
                      
                      {/* Secure Payment Info */}
                      <div className="glass-1 rounded-xl p-3 flex items-start gap-2">
                        <Shield className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Secure Advance Payment</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Your payment is held securely until your appointment is completed. Cancel 24h+ before: 10% fee, 90% refunded. Cancel &lt;24h: 50% fee, 50% refunded.
                          </p>
                        </div>
                      </div>
                      
                      {/* Payment processing handled by StripePaymentForm */}
                    </>
                  )}
                  
                  {/* Terms */}
                  <p className="text-[10px] text-muted-foreground text-center px-4">
                    By booking, you agree to our Terms of Service and Privacy Policy.
                    Platform fees: 5% to business + 5% to client.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
