import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";

/**
 * Floating calendar shortcut button — top-left corner.
 * Mirrors the NotificationBell on the right.
 * Tap to open the user's calendar/schedule.
 * Shows a badge with upcoming booking count.
 */
export default function CalendarButton() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookings } = useBookings();

  if (!user) return null;

  // Hide on calendar/schedule/onboarding/legal pages
  const hidden = ["/calendar", "/schedule", "/welcome", "/onboarding", "/legal"].some(p => location.pathname.startsWith(p));
  if (hidden) return null;

  // Count upcoming bookings (today + future)
  const today = new Date().toISOString().split("T")[0];
  const upcomingCount = bookings.filter(b =>
    (b.status === "pending" || b.status === "confirmed") &&
    b.date >= today
  ).length;

  // Route depends on role
  const targetRoute = user.role === "provider" ? "/pro/schedule" :
                      user.role === "client"   ? "/calendar" :
                      "/calendar";

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate(targetRoute)}
      className="fixed top-4 left-4 z-[45] w-10 h-10 rounded-full glass-2 flex items-center justify-center shadow-card"
      aria-label={`Calendar${upcomingCount > 0 ? ` (${upcomingCount} upcoming)` : ""}`}
    >
      <CalendarDays className="w-4 h-4 text-foreground" strokeWidth={1.5} />
      {upcomingCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-teal text-white text-[9px] font-bold flex items-center justify-center border-2 border-obsidian px-0.5">
          {upcomingCount > 9 ? "9+" : upcomingCount}
        </span>
      )}
    </motion.button>
  );
}
