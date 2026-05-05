import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { shouldShowFloatingChrome } from "@/lib/floatingChrome";
import Tooltip from "./Tooltip";

/**
 * Floating calendar shortcut button — top-left corner.
 * Mirrors the NotificationBell on the right.
 * Tap to open the user's calendar/schedule.
 * Shows a badge with upcoming booking count.
 */
import { getSASTDateKey } from "../utils/sastDate";

export default function CalendarButton() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookings } = useBookings();

  if (!user) return null;

  // Only show on pages that don't have their own top chrome.
  if (!shouldShowFloatingChrome(location.pathname)) return null;

  // Count upcoming bookings (today + future)
  const today = getSASTDateKey();
  const upcomingCount = bookings.filter(b =>
    (b.status === "pending" || b.status === "confirmed") &&
    b.date >= today
  ).length;

  // Route depends on role
  const targetRoute = user.role === "provider" ? "/pro/schedule" :
                      user.role === "client"   ? "/calendar" :
                      "/calendar";

  return (
    <div className="fixed left-4 z-[45]" style={{ top: "max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))" }}>
      <Tooltip text={upcomingCount > 0 ? `Calendar · ${upcomingCount} upcoming` : "Calendar"} side="bottom">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(targetRoute)}
          className="w-10 h-10 rounded-full glass-2 flex items-center justify-center shadow-card relative"
          aria-label={`Calendar${upcomingCount > 0 ? ` (${upcomingCount} upcoming)` : ""}`}
        >
          <CalendarDays className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          {upcomingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-teal text-white text-[9px] font-bold flex items-center justify-center border-2 border-obsidian px-0.5">
              {upcomingCount > 9 ? "9+" : upcomingCount}
            </span>
          )}
        </motion.button>
      </Tooltip>
    </div>
  );
}
