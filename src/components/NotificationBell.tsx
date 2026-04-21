import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Calendar, DollarSign, Clock, Gift, Star,
  CheckCheck, ChevronRight, X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, type DbNotification } from "@/hooks/useNotifications";
import { getActiveReminders } from "@/lib/reminders";
import Tooltip from "./Tooltip";

// ── Notification type → icon mapping ────────────────────────────────
const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  booking:    { icon: <Calendar className="w-4 h-4" />,    color: "text-indigo",   bg: "bg-indigo/10" },
  payment:    { icon: <DollarSign className="w-4 h-4" />,  color: "text-emerald",  bg: "bg-emerald/10" },
  reminder:   { icon: <Clock className="w-4 h-4" />,       color: "text-amber",    bg: "bg-amber/10" },
  system:     { icon: <Bell className="w-4 h-4" />,        color: "text-slate",    bg: "bg-slate/10" },
  promotion:  { icon: <Gift className="w-4 h-4" />,        color: "text-purple",   bg: "bg-purple/10" },
  review:     { icon: <Star className="w-4 h-4" />,        color: "text-amber",    bg: "bg-amber/10" },
  message:    { icon: <Bell className="w-4 h-4" />,        color: "text-teal",     bg: "bg-teal/10" },
};

function getTypeConfig(type: string) {
  return TYPE_ICON[type] ?? TYPE_ICON.system;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

/**
 * Floating notification bell — visible on ALL pages for logged-in users.
 * Shows a badge count and, when clicked, opens a dropdown panel with
 * recent notifications. Tapping "View all" navigates to /notifications.
 * Hides on the notifications page itself and on auth/onboarding pages.
 */
export default function NotificationBell() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount: dbUnread, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Don't show if not logged in
  if (!user) return null;

  // Hide on notifications page, onboarding, welcome, and legal pages
  const hidden = ["/notifications", "/welcome", "/onboarding", "/legal"].some(
    p => location.pathname.startsWith(p)
  );
  if (hidden) return null;

  const reminderCount = getActiveReminders().length;
  const totalCount = reminderCount + dbUnread;

  // Close panel when clicking outside
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close panel on route change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleNotificationClick = (notif: DbNotification) => {
    markAsRead(notif.id);
    if (notif.action_url) {
      setOpen(false);
      navigate(notif.action_url);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  // Show up to 8 recent notifications in the dropdown
  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="fixed top-4 right-4 z-[45]">
      <Tooltip text={totalCount > 0 ? `Notifications · ${totalCount} unread` : "Notifications"} side="bottom">
        <motion.button
          ref={bellRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(prev => !prev)}
          className="w-10 h-10 rounded-full glass-2 flex items-center justify-center shadow-card relative"
          aria-label={`Notifications${totalCount > 0 ? ` (${totalCount})` : ""}`}
        >
          <Bell className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          {totalCount > 0 && (
            <motion.span
              key={totalCount}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-coral text-white text-[9px] font-bold flex items-center justify-center border-2 border-obsidian px-0.5"
            >
              {totalCount > 9 ? "9+" : totalCount}
            </motion.span>
          )}
        </motion.button>
      </Tooltip>

      {/* Notification dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 right-0 w-80 max-h-[70vh] rounded-2xl glass-2 shadow-card overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {dbUnread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo hover:text-indigo/80 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-indigo rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading...</p>
                </div>
              ) : recentNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Booking confirmations, messages, and updates will appear here.
                  </p>
                </div>
              ) : (
                <div>
                  {recentNotifications.map((notif) => {
                    const config = getTypeConfig(notif.type);
                    return (
                      <motion.button
                        key={notif.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-white/[0.03] transition-colors ${
                          !notif.read ? "bg-indigo/[0.03]" : ""
                        }`}
                      >
                        {/* Icon */}
                        <div className={`p-1.5 rounded-full ${config.bg} ${config.color} flex-shrink-0 mt-0.5`}>
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-semibold truncate ${
                              notif.read ? "text-muted-foreground" : "text-foreground"
                            }`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          {notif.body && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                              {notif.body}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {relativeTime(notif.created_at)}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <button
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="px-4 py-2.5 text-center text-xs font-medium text-indigo hover:text-indigo/80 border-t border-white/5 flex items-center justify-center gap-1"
            >
              View all notifications
              <ChevronRight className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
