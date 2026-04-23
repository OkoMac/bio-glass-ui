import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import ReviewForm from "@/components/ReviewForm";
import { Calendar, ChevronLeft, ChevronRight, Clock, Star, X, CalendarDays, RotateCcw, XCircle, FileText, Search, Mail, CheckCircle2, ArrowLeft, Video, CreditCard } from "lucide-react";
import { useBookings, type Booking } from "@/contexts/BookingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { downloadReceipt } from "@/lib/receipt";
import { toast } from "sonner";

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

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const Schedule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getByStatus, cancel, reschedule } = useBookings();
  const weekDates = getWeekDates();
  const [selectedDay, setSelectedDay] = useState(0);
  const [reviewBooking, setReviewBooking] = useState<{ id: string; providerName: string } | null>(null);
  // Booking IDs the user has already reviewed — drives whether the "Leave a review"
  // CTA still appears on completed bookings. We load this once on mount (and again
  // after a submission) rather than per-booking to avoid N queries on the list.
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:00");

  // Two-step cancel UX:
  //   1) Intent modal — offers Reschedule FIRST, then "Cancel anyway" secondary
  //   2) Success modal — "Book a different provider?" CTA
  // Refunds are NOT offered in-app. Users must email disputes@bionhealth.co.za.
  const [cancelIntent, setCancelIntent] = useState<Booking | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<{
    providerName: string | null;
    voucherRestored: boolean;
  } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

  const handleRetryPayment = async (bookingId: string) => {
    setRetryingPayment(bookingId);
    try {
      const res = await fetch(`${API}/api/bookings/${bookingId}/retry-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error ?? "Could not generate payment link");
      }
    } catch {
      toast.error("Network error — please try again");
    }
    setRetryingPayment(null);
  };

  // Load which of the signed-in user's bookings already have a review. This
  // avoids showing the "Leave a review" CTA on bookings the user has already
  // reviewed. Re-fetched when a review is successfully submitted.
  const loadReviewed = async () => {
    if (!user) {
      setReviewedBookingIds(new Set());
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile?.id) return;
    const { data } = await supabase
      .from("reviews" as any)
      .select("booking_id")
      .eq("client_id", profile.id);
    if (data) {
      setReviewedBookingIds(new Set((data as any[]).map((r) => r.booking_id)));
    }
  };

  useEffect(() => {
    void loadReviewed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleReschedule = () => {
    if (!rescheduleBooking || !newDate) return;
    reschedule(rescheduleBooking.id, newDate, newTime);
    setRescheduleBooking(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelIntent) return;
    setCancelling(true);
    const res = await cancel(cancelIntent.id);
    setCancelling(false);
    if (!res.ok) {
      toast.error(res.error ?? "Couldn't cancel booking");
      return;
    }
    const provider = cancelIntent.providerName ?? null;
    setCancelIntent(null);
    setCancelSuccess({
      providerName: provider,
      voucherRestored: !!res.voucher_restored,
    });
  };

  const openReschedule = (b: Booking) => {
    setNewDate(b.date);
    setNewTime(b.time);
    setRescheduleBooking(b);
  };

  const handleReceipt = (b: Booking) => {
    downloadReceipt({
      bookingRef: b.id,
      clientName: user?.name ?? "Client",
      providerName: b.providerName ?? "Provider",
      service: b.service,
      date: b.date,
      time: b.time,
      duration: b.duration,
      price: b.price,
      status: b.status,
    });
  };

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
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">My Schedule</h1>
          </div>
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
                        <img src={b.providerImage ?? b.clientImage} alt={b.providerName ?? b.service}
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
                      {/* Complete Payment button for unpaid bookings */}
                      {(b.paymentStatus === "pending" || b.paymentStatus === "failed") && b.status === "pending" && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                          <button
                            onClick={() => handleRetryPayment(b.id)}
                            disabled={retryingPayment === b.id}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-pill text-xs font-semibold glass-accent-amber text-amber disabled:opacity-50"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {retryingPayment === b.id ? "Loading..." : "Complete Payment"}
                          </button>
                        </div>
                      )}
                      {b.deliveryMode === "telehealth" && (b.status === "confirmed" || b.status === "pending") && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                          <button onClick={() => navigate(`/call/${b.id}`)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-pill text-xs font-semibold gradient-indigo text-primary-foreground">
                            <Video className="w-3.5 h-3.5" /> Join Video Call
                          </button>
                        </div>
                      )}
                      <div className={`flex gap-2 ${b.deliveryMode === "telehealth" && (b.status === "confirmed" || b.status === "pending") ? "mt-2" : "mt-3 pt-3 border-t border-white/[0.06]"}`}>
                        <button onClick={() => openReschedule(b)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 glass-1 rounded-pill text-xs font-medium text-indigo">
                          <RotateCcw className="w-3 h-3" /> Reschedule
                        </button>
                        <button onClick={() => handleReceipt(b)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 glass-1 rounded-pill text-xs font-medium text-foreground">
                          <FileText className="w-3 h-3" /> Receipt
                        </button>
                        <button onClick={() => setCancelIntent(b)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 glass-1 rounded-pill text-xs font-medium text-coral">
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
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
                        <img src={b.providerImage ?? b.clientImage} alt={b.providerName ?? b.service}
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
                      {/* Complete Payment button for unpaid bookings */}
                      {(b.paymentStatus === "pending" || b.paymentStatus === "failed") && b.status === "pending" && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                          <button
                            onClick={() => handleRetryPayment(b.id)}
                            disabled={retryingPayment === b.id}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-pill text-xs font-semibold glass-accent-amber text-amber disabled:opacity-50"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {retryingPayment === b.id ? "Loading..." : "Complete Payment"}
                          </button>
                        </div>
                      )}
                      {b.deliveryMode === "telehealth" && (b.status === "confirmed" || b.status === "pending") && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                          <button onClick={() => navigate(`/call/${b.id}`)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-pill text-xs font-semibold gradient-indigo text-primary-foreground">
                            <Video className="w-3.5 h-3.5" /> Join Video Call
                          </button>
                        </div>
                      )}
                      <div className={`flex gap-2 ${b.deliveryMode === "telehealth" && (b.status === "confirmed" || b.status === "pending") ? "mt-2" : "mt-3 pt-3 border-t border-white/[0.06]"}`}>
                        <button onClick={() => openReschedule(b)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 glass-1 rounded-pill text-xs font-medium text-indigo">
                          <RotateCcw className="w-3 h-3" /> Reschedule
                        </button>
                        <button onClick={() => handleReceipt(b)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 glass-1 rounded-pill text-xs font-medium text-foreground">
                          <FileText className="w-3 h-3" /> Receipt
                        </button>
                        <button onClick={() => setCancelIntent(b)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 glass-1 rounded-pill text-xs font-medium text-coral">
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
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
                      <img src={b.providerImage ?? b.clientImage} alt={b.service}
                        className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{b.service}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {b.providerName ?? "Provider"} · {b.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {b.status === "completed" && !reviewedBookingIds.has(b.id) && (
                          <button
                            onClick={() => setReviewBooking({ id: b.id, providerName: b.providerName ?? "Provider" })}
                            className="text-[10px] text-indigo font-medium flex items-center gap-0.5 hover:text-foreground transition-colors">
                            <Star className="w-3 h-3" /> Leave a review
                          </button>
                        )}
                        {b.status === "completed" && reviewedBookingIds.has(b.id) && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber text-amber" /> Reviewed
                          </span>
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

      {reviewBooking && (
        <ReviewForm
          bookingId={reviewBooking.id}
          providerName={reviewBooking.providerName}
          onClose={() => setReviewBooking(null)}
          onSubmitted={() => {
            // Optimistically flip the local set so the "Leave a review" CTA
            // disappears immediately; refresh from Supabase in the background
            // so stale entries (cross-device) eventually converge.
            setReviewedBookingIds((prev) => {
              const next = new Set(prev);
              next.add(reviewBooking.id);
              return next;
            });
            setReviewBooking(null);
            void loadReviewed();
          }}
        />
      )}

      {/* Reschedule modal */}
      <AnimatePresence>
        {rescheduleBooking && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRescheduleBooking(null)}
              className="fixed inset-0 bg-obsidian/70 z-[80]"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-5"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-indigo" />
                  <div>
                    <h3 className="text-base font-bold text-foreground">Reschedule</h3>
                    <p className="text-xs text-muted-foreground">{rescheduleBooking.service} with {rescheduleBooking.providerName}</p>
                  </div>
                </div>
                <button onClick={() => setRescheduleBooking(null)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">New Date</p>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-4 py-3 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
                />
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">New Time</p>
                <div className="grid grid-cols-5 gap-2">
                  {TIME_SLOTS.map(t => (
                    <button key={t} onClick={() => setNewTime(t)}
                      className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                        newTime === t ? "gradient-indigo text-white" : "glass-1 text-foreground"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleReschedule}
                className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta"
              >
                Confirm Reschedule
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Cancel intent modal — reschedule-first, cancel-as-secondary ── */}
      <AnimatePresence>
        {cancelIntent && !cancelSuccess && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !cancelling && setCancelIntent(null)}
              className="fixed inset-0 bg-obsidian/70 z-[80]"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-4"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Before you cancel…</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rescheduling is free (up to 3 times). Cancel 24h+ before: full refund to wallet. Cancel &lt;24h: 50% fee applies.
                  </p>
                </div>
                <button onClick={() => !cancelling && setCancelIntent(null)} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center shrink-0">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Your booking</p>
                <p className="text-sm font-semibold text-foreground">{cancelIntent.service} with {cancelIntent.providerName ?? "provider"}</p>
                <p className="text-[11px] text-muted-foreground">{cancelIntent.date} · {cancelIntent.time}</p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const b = cancelIntent;
                  setCancelIntent(null);
                  if (b) {
                    setNewDate(b.date);
                    setNewTime(b.time);
                    setRescheduleBooking(b);
                  }
                }}
                className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reschedule instead (free)
              </motion.button>

              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="w-full rounded-pill py-3 text-sm font-medium glass-1 text-coral disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel anyway"}
              </button>

              <div className="flex items-start gap-2 pt-2 text-[11px] text-muted-foreground">
                <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>
                  Cancellation refunds go to your BION Wallet automatically. For disputes, email <strong className="text-foreground">disputes@bionhealth.co.za</strong> with your booking reference.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Cancel success modal — book-another-provider CTA ── */}
      <AnimatePresence>
        {cancelSuccess && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCancelSuccess(null)}
              className="fixed inset-0 bg-obsidian/70 z-[80]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div className="max-w-sm w-full rounded-3xl p-6 space-y-4 text-center"
                style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="w-14 h-14 rounded-full bg-teal/15 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Booking cancelled</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cancelSuccess.voucherRestored
                      ? "Your acquisition voucher has been restored — use it with a different provider."
                      : "The provider's slot is now open."}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setCancelSuccess(null);
                    navigate("/home");
                  }}
                  className="w-full rounded-pill py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" /> Book a different provider
                </motion.button>
                <button
                  onClick={() => setCancelSuccess(null)}
                  className="w-full rounded-pill py-2.5 text-xs font-medium text-muted-foreground"
                >
                  Not now
                </button>
                {!cancelSuccess.voucherRestored && (
                  <p className="text-[11px] text-muted-foreground pt-2 border-t border-white/5">
                    Your refund has been credited to your BION Wallet. For disputes, email <strong className="text-foreground">disputes@bionhealth.co.za</strong>
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
      <BionAssistant />
    </div>
  );
};

export default Schedule;
