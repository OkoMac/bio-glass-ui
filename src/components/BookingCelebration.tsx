import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import BioAvatar from "./BioAvatar";
import { Calendar, Clock, Share2 } from "lucide-react";

interface BookingCelebrationProps {
  provider: {
    name: string;
    image: string;
    vertical: "indigo" | "teal" | "coral" | "amber";
  };
  service: string;
  date: string;
  time: string;
  onClose: (goToSchedule: boolean) => void;
  // Optional payment details
  price?: string;
  fees?: string;
  totalPaid?: string;
  paymentStatus?: 'pending' | 'paid' | 'refunded' | 'failed';
}

const BookingCelebration = ({ provider, service, date, time, onClose }: BookingCelebrationProps) => {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.45 },
        colors: ["#6366F1", "#2DD4BF", "#FBBF24", "#FB7185", "#818CF8"],
        gravity: 0.8,
        ticks: 150,
      });
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] bg-obsidian flex flex-col items-center justify-center px-6"
    >
      {/* Avatar with ring */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 10, delay: 0.1 }}
        className="relative"
      >
        <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="rgba(99,102,241,0.3)"
            strokeWidth="3"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#6366F1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="283"
            className="animate-draw-ring"
            style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
          />
        </svg>
        <BioAvatar src={provider.image} alt={provider.name} size="xl" verticalColor={provider.vertical} verified />
      </motion.div>

      {/* Booked! text */}
      <motion.h1
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 10, delay: 0.9 }}
        className="text-5xl font-bold text-foreground mt-8"
      >
        Booked!
      </motion.h1>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="text-center mt-4 space-y-1"
      >
        <p className="text-base text-foreground font-medium">{provider.name}</p>
        <p className="text-sm text-muted-foreground">{service}</p>
        <p className="text-sm text-muted-foreground">{date} · {time}</p>
        
        {/* Payment confirmation */}
        {price && price !== "FREE" && totalPaid && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-3 p-3 rounded-xl glass-accent-indigo/30 border border-indigo/20"
          >
            <p className="text-xs text-muted-foreground mb-1">Payment Confirmed</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Service:</span>
              <span className="text-sm font-medium text-foreground">{price}</span>
            </div>
            {fees && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Platform fee:</span>
                <span className="text-xs text-muted-foreground">{fees}</span>
              </div>
            )}
            <div className="h-px bg-foreground/10 my-1" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Total paid:</span>
              <span className="text-sm font-bold text-indigo">{totalPaid}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              ✓ Payment secured. Provider will receive payment after your appointment.
            </p>
          </motion.div>
        )}
        
        {price === "FREE" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-3 p-3 rounded-xl glass-accent-amber/30 border border-amber/20"
          >
            <p className="text-xs text-amber font-medium">Free Session Booked</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              No payment required for this introductory session.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="flex gap-3 mt-8"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onClose(true)}
          className="rounded-pill px-5 py-3 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
        >
          <Calendar className="w-4 h-4 inline mr-1.5" />
          View in Schedule
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onClose(false)}
          className="rounded-pill px-5 py-3 text-sm font-medium glass-1 text-foreground"
        >
          Done
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="rounded-pill w-11 h-11 flex items-center justify-center glass-1"
        >
          <Share2 className="w-4 h-4 text-foreground" />
        </motion.button>
      </motion.div>

      {/* WhatsApp reminder */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="text-xs text-teal mt-6"
      >
        ✓ A reminder has been sent to your WhatsApp
      </motion.p>
    </motion.div>
  );
};

export default BookingCelebration;
