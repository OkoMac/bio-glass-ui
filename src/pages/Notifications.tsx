import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { usePageView } from "@/hooks/usePageView";
import { getSASTDateKey } from "@/utils/sastDate";
import { useNotifications as useDbNotifications, type DbNotification } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Bell, BellRing, Calendar, MessageSquare, Flame,
  Gift, Zap, CheckCheck, Trash2, Settings, BellOff, DollarSign, Clock, Star, Loader2,
  ExternalLink,
} from "lucide-react";
import { getActiveReminders, dismissReminder, type Reminder } from "@/lib/reminders";

// ── Types ────────────────────────────────────────────────────────────

type NotifCategory = "booking" | "message" | "streak" | "reward" | "system" | "provider" | "payment" | "reminder" | "promotion" | "review";

interface Notification {
  id:         string;
  category:   NotifCategory;
  title:      string;
  body:       string;
  time:       string;       // display string
  createdAt:  number;       // for sorting
  read:       boolean;
  actionUrl?: string;
  providerId?: string;
  location?: string;
  dbId?:      string;       // if sourced from notifications table
}

// ── Category config ────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<NotifCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  booking:    { icon: <Calendar className="w-4 h-4" />,       color: "text-indigo",   bg: "bg-indigo/10" },
  message:    { icon: <MessageSquare className="w-4 h-4" />,  color: "text-teal",     bg: "bg-teal/10" },
  streak:     { icon: <Flame className="w-4 h-4" />,          color: "text-amber",    bg: "bg-amber/10" },
  reward:     { icon: <Gift className="w-4 h-4" />,           color: "text-emerald",  bg: "bg-emerald/10" },
  system:     { icon: <Zap className="w-4 h-4" />,            color: "text-slate",    bg: "bg-slate/10" },
  provider:   { icon: <Bell className="w-4 h-4" />,           color: "text-purple",   bg: "bg-purple/10" },
  payment:    { icon: <DollarSign className="w-4 h-4" />,     color: "text-emerald",  bg: "bg-emerald/10" },
  reminder:   { icon: <Clock className="w-4 h-4" />,          color: "text-amber",    bg: "bg-amber/10" },
  promotion:  { icon: <Gift className="w-4 h-4" />,           color: "text-purple",   bg: "bg-purple/10" },
  review:     { icon: <Star className="w-4 h-4" />,           color: "text-amber",    bg: "bg-amber/10" },
};

/** Map a DB notification type to a NotifCategory for rendering. */
function mapDbType(type: string): NotifCategory {
  if (type in CATEGORY_CONFIG) return type as NotifCategory;
  return "system";
}

// ── Helpers ────────────────────────────────────────────────────────

function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

// ── Main component ────────────────────────────────────────────────

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings } = useBookings();
  const role = user?.role ?? "client";
  const {
    notifications: dbNotifications,
    unreadCount: dbUnreadCount,
    markAsRead: dbMarkAsRead,
    markAllAsRead: dbMarkAllAsRead,
  } = useDbNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotifCategory | "all">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [muteAll, setMuteAll] = useState(() => {
    try { return localStorage.getItem("bion_notifs_muted") === "1"; }
    catch { return false; }
  });

  // Read dismissed notification IDs from localStorage
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("bion_dismissed_notifs");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });
  // Read read notification IDs from localStorage
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("bion_read_notifs");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  // ── Build real notifications from data sources ──
  useEffect(() => {
    const build = async () => {
      const list: Notification[] = [];
      const now = Date.now();
      const today = getSASTDateKey();

      // 1) B_ reminders (today's pending tasks)
      const reminders = getActiveReminders();
      reminders.forEach(r => {
        const id = `reminder_${r.id}`;
        if (dismissedIds.has(id)) return;
        list.push({
          id,
          category: r.type === "medication" ? "system" :
                    r.type === "workout" ? "streak" :
                    r.type === "appointment" ? "booking" :
                    r.type === "meal" ? "system" : "system",
          title: `B_ Reminder · ${r.title}`,
          body: r.body,
          time: r.time ?? "Today",
          createdAt: now,
          read: readIds.has(id),
          actionUrl: r.actionUrl,
        });
      });

      // 2) Booking events (last 30 days)
      const recentBookings = bookings
        .filter(b => {
          const bDate = new Date(b.date ?? "");
          return !isNaN(bDate.getTime()) && (now - bDate.getTime()) < 30 * 24 * 60 * 60 * 1000;
        })
        .slice(0, 20);

      recentBookings.forEach((b, i) => {
        const partnerName = b.providerName ?? b.clientName ?? "Provider";
        const isUpcoming = b.status === "confirmed" || b.status === "pending";
        const isCompleted = b.status === "completed";
        const id = `booking_${b.id ?? i}`;
        if (dismissedIds.has(id)) return;

        if (isUpcoming) {
          const isToday = b.date === today;
          list.push({
            id,
            category: "booking",
            title: isToday ? `Today: ${b.service ?? "Booking"}` : `Upcoming: ${b.service ?? "Booking"}`,
            body: `with ${partnerName}${b.time ? ` at ${b.time}` : ""}${b.date ? ` on ${b.date}` : ""}`,
            time: b.date ?? "",
            createdAt: new Date(b.date ?? Date.now()).getTime(),
            read: readIds.has(id),
            actionUrl: "/schedule",
          });
        } else if (isCompleted) {
          list.push({
            id,
            category: "booking",
            title: `Session completed`,
            body: `${b.service ?? "Booking"} with ${partnerName} — leave a review?`,
            time: b.date ?? "",
            createdAt: new Date(b.date ?? Date.now()).getTime() + 1000,
            read: readIds.has(id),
            actionUrl: "/schedule",
          });
        } else if (b.status === "declined") {
          list.push({
            id,
            category: "booking",
            title: `Booking declined`,
            body: `${partnerName} declined your ${b.service ?? "session"} request`,
            time: b.date ?? "",
            createdAt: new Date(b.date ?? Date.now()).getTime(),
            read: readIds.has(id),
            actionUrl: "/schedule",
          });
        }
      });

      // 3) Welcome notification for new users (no bookings yet)
      if (bookings.length === 0 && user?.id && !user.id.startsWith("demo_")) {
        const id = `welcome_${user.id}`;
        if (!dismissedIds.has(id)) {
          const welcomeData = {
            client: {
              title: "Welcome to BION! 👋",
              body: "Browse the directory to book your first session and start your wellness journey.",
              actionUrl: "/directory",
            },
            provider: {
              title: "Welcome to BION Pro! 👋",
              body: "Set up your services and availability to start receiving client bookings.",
              actionUrl: "/pro/services",
            },
            admin: {
              title: "Admin Dashboard 👋",
              body: "Manage users, providers, and system settings from the admin panel.",
              actionUrl: "/admin/dashboard",
            },
            sales_rep: {
              title: "Sales Rep Portal 👋",
              body: "Start adding leads and managing your provider partnerships.",
              actionUrl: "/rep/dashboard",
            },
            corporate: {
              title: "Corporate Dashboard 👋",
              body: "Manage employees, wellness programs, and provider partnerships.",
              actionUrl: "/corporate/dashboard",
            },
          }[role] ?? {
            title: "Welcome to BION! 👋",
            body: "Start exploring the platform to access wellness services.",
            actionUrl: "/",
          };
          list.push({
            id,
            category: "system",
            title: welcomeData.title,
            body: welcomeData.body,
            time: "Today",
            createdAt: now - 60000,
            read: readIds.has(id),
            actionUrl: welcomeData.actionUrl,
          });
        }
      }

      // 4) Merge DB notifications (from the useNotifications realtime hook).
      // These include messages, payment, booking, and other server-generated
      // notifications that arrive via Supabase Realtime.
      dbNotifications.forEach(dbN => {
        const id = `db_${dbN.id}`;
        if (dismissedIds.has(id)) return;
        list.push({
          id,
          dbId: dbN.id,
          category: mapDbType(dbN.type),
          title: dbN.title,
          body: dbN.body ?? "",
          time: relativeTime(dbN.created_at),
          createdAt: new Date(dbN.created_at).getTime(),
          read: dbN.read || readIds.has(id),
          actionUrl: dbN.action_url ?? undefined,
        });
      });

      // Sort by createdAt (newest first)
      list.sort((a, b) => b.createdAt - a.createdAt);

      setNotifications(list);
      setLoading(false);
    };

    build();
  }, [user?.id, bookings, dismissedIds, readIds, dbNotifications]);

  // Persist read/dismissed state
  useEffect(() => {
    localStorage.setItem("bion_read_notifs", JSON.stringify([...readIds]));
  }, [readIds]);
  useEffect(() => {
    localStorage.setItem("bion_dismissed_notifs", JSON.stringify([...dismissedIds]));
  }, [dismissedIds]);
  useEffect(() => {
    localStorage.setItem("bion_notifs_muted", muteAll ? "1" : "0");
  }, [muteAll]);

  const filtered = muteAll ? [] : filter === "all"
    ? notifications
    : notifications.filter(n => n.category === filter);

  const unreadCount = notifications.filter(n => !n.read).length;
  const providerNotifications = notifications.filter(n => n.category === "provider").length;
  const bookingNotifications = notifications.filter(n => n.category === "booking").length;

  const markAsRead = (id: string) => {
    setReadIds(prev => new Set([...prev, id]));
    setNotifications(prev => {
      // Find the notification in the current state (avoids stale closure)
      const notif = prev.find(n => n.id === id);
      if (notif?.dbId) dbMarkAsRead(notif.dbId);
      return prev.map(n => n.id === id ? { ...n, read: true } : n);
    });
  };

  const markAllAsRead = () => {
    setReadIds(prev => new Set([...prev, ...notifications.map(n => n.id)]));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Mark all DB notifications as read in Supabase
    dbMarkAllAsRead();
    // Also dismiss the B_ reminder engine items so the floating assistant badge
    // decrements in step with the user's "all caught up" intent.
    getActiveReminders().forEach(r => dismissReminder(r.id));
  };

  const deleteNotification = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    setNotifications(prev => prev.filter(n => n.id !== id));
    // If this notification maps to a B_ reminder, dismiss it too.
    if (id.startsWith("reminder_")) dismissReminder(id.replace(/^reminder_/, ""));
  };

  const clearAll = () => {
    setDismissedIds(prev => new Set([...prev, ...notifications.map(n => n.id)]));
    setNotifications([]);
    // Clearing everything implies dismissing all active reminders too.
    getActiveReminders().forEach(r => dismissReminder(r.id));
  };

  // Get unique providers mentioned in notifications
  const mentionedProviders = Array.from(
    new Set(notifications.filter(n => n.providerId).map(n => n.providerId))
  ).length;

  // Get unique locations mentioned
  const mentionedLocations = Array.from(
    new Set(notifications.filter(n => n.location).map(n => n.location))
  );

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="max-w-3xl mx-auto px-4 pt-20 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 glass-1 rounded-full">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {role === "provider"
                  ? "Stay updated with client bookings, reviews, and activity"
                  : role === "admin"
                    ? "System notifications and alerts"
                    : role === "sales_rep"
                      ? "Lead updates and referral activity"
                      : "Stay updated with your providers and activities"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 glass-1 rounded-full"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1.5 gradient-indigo rounded-full text-sm font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Stats card — only show when there are notifications */}
        {notifications.length > 0 && (
          <GlassCard className="p-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{unreadCount}</div>
                <div className="text-xs text-muted-foreground">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{notifications.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{mentionedProviders}</div>
                <div className="text-xs text-muted-foreground">Providers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{mentionedLocations.length}</div>
                <div className="text-xs text-muted-foreground">Locations</div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Filter bar */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {(() => {
            // Role-specific filter categories
            const roleCategories: Record<string, string[]> = {
              client:     ["all", "booking", "message", "payment", "reminder", "review", "promotion", "system"],
              provider:   ["all", "booking", "message", "payment", "review", "system"],
              admin:      ["all", "system", "payment", "message"],
              sales_rep:  ["all", "message", "system", "promotion"],
              corporate:  ["all", "system", "payment", "message"],
            };
            return (roleCategories[role] ?? roleCategories.client).map(cat => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(cat as any)}
                className={`px-4 py-2 rounded-pill text-sm font-medium whitespace-nowrap ${
                  filter === cat ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                }`}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </motion.button>
            ));
          })()}
        </div>

        {/* Notifications list */}
        <div className="space-y-3">
          {loading ? (
            <GlassCard className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading notifications...</p>
            </GlassCard>
          ) : filtered.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No notifications yet</h3>
              <p className="text-sm text-muted-foreground">
                {filter === "all"
                  ? role === "provider"
                    ? "Client bookings, reviews, and messages will appear here once you start receiving them."
                    : role === "admin"
                      ? "System alerts and admin notifications will appear here."
                      : role === "sales_rep"
                        ? "Lead updates and referral notifications will appear here."
                        : "Notifications from bookings, reminders, and messages will appear here."
                  : `No ${filter} notifications`}
              </p>
            </GlassCard>
          ) : (
            filtered.map(notif => {
              const config = CATEGORY_CONFIG[notif.category];
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-1 rounded-2xl p-4 cursor-pointer transition-all ${
                    !notif.read ? "border-l-4 border-indigo" : ""
                  }`}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.actionUrl) navigate(notif.actionUrl);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Category icon */}
                    <div className={`p-2 rounded-full ${config.bg} ${config.color} flex-shrink-0`}>
                      {config.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-foreground">{notif.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{notif.time}</span>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-indigo" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.body}</p>
                      
                      {/* Provider/location info */}
                      {(notif.providerId || notif.location) && (
                        <div className="flex items-center gap-2 mt-2">
                          {notif.location && (
                            <span className="px-2 py-0.5 bg-slate-500/10 text-slate-300 rounded-full text-xs">
                              {notif.location}
                            </span>
                          )}
                          {notif.providerId && (
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full text-xs">
                              Provider Update
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Clear all button */}
        {notifications.length > 0 && (
          <div className="text-center">
            <button
              onClick={clearAll}
              className="px-4 py-2 glass-1 rounded-full text-sm font-medium text-muted-foreground"
            >
              Clear all notifications
            </button>
          </div>
        )}

        {/* Settings modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-2 rounded-3xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-foreground mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">Mute all notifications</div>
                      <div className="text-sm text-muted-foreground">Temporarily pause all notifications</div>
                    </div>
                    <button
                      onClick={() => setMuteAll(!muteAll)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        muteAll ? "bg-indigo" : "bg-slate-700"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                        muteAll ? "translate-x-7" : "translate-x-1"
                      }`} />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Choose which channels (WhatsApp, Email, Push) and categories you receive notifications for.
                    </p>
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        navigate("/settings?tab=notifications");
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-indigo text-primary-foreground text-sm font-semibold"
                    >
                      <BellRing className="w-4 h-4" />
                      Manage notification channels
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex mt-6">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full py-2.5 glass-1 rounded-xl text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom navigation */}
        <BottomNav />
      </div>

      {/* Coach AI */}
      <BionAssistant
        context={`Notifications page. ${unreadCount} unread notifications. Filter: ${filter}.`}
        suggestions={[
          "How can I manage notification overload from multiple providers?",
          "What's the best way to stay updated with my favorite Pretoria providers?",
          "How do I customize notification preferences for different service types?",
          "Are there quiet hours for notifications?"
        ]}
      />
    </div>
  );
}