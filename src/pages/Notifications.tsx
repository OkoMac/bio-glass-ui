import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Bell, Calendar, MessageSquare, Flame,
  Gift, Zap, CheckCheck, Trash2, Settings, BellOff, Pill, Loader2,
} from "lucide-react";
import { getActiveReminders, dismissReminder, type Reminder } from "@/lib/reminders";

// ── Types ────────────────────────────────────────────────────────────

type NotifCategory = "booking" | "message" | "streak" | "reward" | "system" | "provider";

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
}

// Notifications loaded from backend
const INITIAL_NOTIFICATIONS: Notification[] = [];

// ── Category config ────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<NotifCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  booking:  { icon: <Calendar className="w-4 h-4" />, color: "text-indigo",      bg: "bg-indigo/10" },
  message:  { icon: <MessageSquare className="w-4 h-4" />, color: "text-teal",       bg: "bg-teal/10" },
  streak:   { icon: <Flame className="w-4 h-4" />, color: "text-amber",      bg: "bg-amber/10" },
  reward:   { icon: <Gift className="w-4 h-4" />, color: "text-emerald",    bg: "bg-emerald/10" },
  system:   { icon: <Zap className="w-4 h-4" />, color: "text-slate",      bg: "bg-slate/10" },
  provider: { icon: <Bell className="w-4 h-4" />, color: "text-purple",     bg: "bg-purple/10" },
};

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
      const today = new Date().toISOString().split("T")[0];

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
        const id = `booking_${b.id ?? i}_${b.status}`;
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
          list.push({
            id,
            category: "system",
            title: "Welcome to BION! 👋",
            body: "Browse the directory to book your first session and start your wellness journey.",
            time: "Today",
            createdAt: now - 60000,
            read: readIds.has(id),
            actionUrl: "/directory",
          });
        }
      }

      // 4) Real-time message notifications (only for authenticated users)
      const isDemo = user?.id?.startsWith("demo_") ?? false;
      if (user?.id && !isDemo) {
        try {
          const { data: unreadMsgs } = await supabase
            .from("messages")
            .select("id, sender_id, content, created_at")
            .eq("receiver_id", user.id)
            .eq("is_read", false)
            .order("created_at", { ascending: false })
            .limit(10);

          (unreadMsgs as any[] ?? []).forEach(msg => {
            const id = `message_${msg.id}`;
            if (dismissedIds.has(id)) return;

            list.push({
              id,
              category: "message",
              title: "New message",
              body: msg.content?.substring(0, 80) ?? "You have a new message",
              time: relativeTime(msg.created_at),
              createdAt: new Date(msg.created_at).getTime(),
              read: false,
              actionUrl: "/messages",
            });
          });
        } catch (err) {
          console.warn("[notifications] message fetch failed:", err);
        }
      }

      // Sort by createdAt (newest first)
      list.sort((a, b) => b.createdAt - a.createdAt);

      setNotifications(list);
      setLoading(false);
    };

    build();
  }, [user?.id, bookings, dismissedIds, readIds]);

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

  const filtered = filter === "all"
    ? notifications
    : notifications.filter(n => n.category === filter);

  const unreadCount = notifications.filter(n => !n.read).length;
  const providerNotifications = notifications.filter(n => n.category === "provider").length;
  const bookingNotifications = notifications.filter(n => n.category === "booking").length;

  const markAsRead = (id: string) => {
    setReadIds(prev => new Set([...prev, id]));
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setReadIds(prev => new Set([...prev, ...notifications.map(n => n.id)]));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setDismissedIds(prev => new Set([...prev, ...notifications.map(n => n.id)]));
    setNotifications([]);
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
      <div className="max-w-3xl mx-auto px-4 pt-12 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 glass-1 rounded-full">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Stay updated with your providers and activities
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
          {["all", "booking", "message", "provider", "reward", "streak", "system"].map(cat => (
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
          ))}
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
                  ? "Notifications from bookings, reminders, and messages will appear here."
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
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-sm text-muted-foreground">
                      Manage how you receive notifications from your connected providers.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 py-2.5 glass-1 rounded-xl text-sm font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setMuteAll(false);
                      setShowSettings(false);
                    }}
                    className="flex-1 py-2.5 gradient-indigo rounded-xl text-sm font-medium"
                  >
                    Save
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