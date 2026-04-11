import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveReminders } from "@/lib/reminders";
import Tooltip from "./Tooltip";

/**
 * Floating notification bell — visible on ALL pages for logged-in users.
 * Shows reminder count badge. Tapping navigates to /notifications.
 * Hides on the notifications page itself and on auth/onboarding pages.
 */
export default function NotificationBell() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show if not logged in
  if (!user) return null;

  // Hide on notifications page, onboarding, welcome, and legal pages
  const hidden = ["/notifications", "/welcome", "/onboarding", "/legal"].some(
    p => location.pathname.startsWith(p)
  );
  if (hidden) return null;

  const reminderCount = getActiveReminders().length;
  // Also count unread from bookings context if needed (future)
  const totalCount = reminderCount;

  return (
    <div className="fixed top-4 right-4 z-[45]">
      <Tooltip text={totalCount > 0 ? `Notifications · ${totalCount} unread` : "Notifications"} side="bottom">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/notifications")}
          className="w-10 h-10 rounded-full glass-2 flex items-center justify-center shadow-card relative"
          aria-label={`Notifications${totalCount > 0 ? ` (${totalCount})` : ""}`}
        >
          <Bell className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-coral text-white text-[9px] font-bold flex items-center justify-center border-2 border-obsidian px-0.5">
              {totalCount > 9 ? "9+" : totalCount}
            </span>
          )}
        </motion.button>
      </Tooltip>
    </div>
  );
}
