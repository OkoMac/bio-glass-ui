import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import CoachAI from "@/components/CoachAI";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Bell, Calendar, MessageSquare, Flame,
  Gift, Zap, CheckCheck, Trash2, Settings, BellOff,
} from "lucide-react";

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

// ── Main component ────────────────────────────────────────────────

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<NotifCategory | "all">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [muteAll, setMuteAll] = useState(false);

  // Fetch real notifications from Supabase when user is logged in
  useEffect(() => {
    if (!user?.id) return; // demo mode — keep real seed data

    const fetchNotifications = async () => {
      // In a real app, you would fetch notifications from Supabase
      // For now, we keep the real seed data
    };

    fetchNotifications();
  }, [user?.id]);

  const filtered = filter === "all"
    ? notifications
    : notifications.filter(n => n.category === filter);

  const unreadCount = notifications.filter(n => !n.read).length;
  const providerNotifications = notifications.filter(n => n.category === "provider").length;
  const bookingNotifications = notifications.filter(n => n.category === "booking").length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
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
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
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
          {filtered.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No notifications yet</h3>
              <p className="text-sm text-muted-foreground">
                {filter === "all"
                  ? "Notifications from bookings, providers, and rewards will appear here."
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
      <CoachAI
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