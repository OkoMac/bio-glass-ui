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

type NotifCategory = "booking" | "message" | "streak" | "reward" | "system";

interface Notification {
  id:         string;
  category:   NotifCategory;
  title:      string;
  body:       string;
  time:       string;       // display string
  createdAt:  number;       // for sorting
  read:       boolean;
  actionUrl?: string;
}

// ── Mock seed data ────────────────────────────────────────────────────

const now = Date.now();
const mins = (n: number) => now - n * 60 * 1000;
const hrs  = (n: number) => now - n * 60 * 60 * 1000;
const days = (n: number) => now - n * 24 * 60 * 60 * 1000;

const MOCK_NOTIFS: Notification[] = [
  {
    id: "n1", category: "booking", read: false, createdAt: mins(5),
    title: "Booking Confirmed",
    body:  "Lisa Dlamini confirmed your PT session for tomorrow at 08:00.",
    time:  "5m ago", actionUrl: "/schedule",
  },
  {
    id: "n2", category: "message", read: false, createdAt: mins(12),
    title: "New message from Lisa D.",
    body:  "Great progress today! Remember to stretch before our session tomorrow 💪",
    time:  "12m ago", actionUrl: "/messages",
  },
  {
    id: "n3", category: "streak", read: false, createdAt: hrs(1),
    title: "🔥 14-Day Streak!",
    body:  "You've kept your booking streak alive for 14 days. Keep going for a bonus 500 pts!",
    time:  "1h ago",
  },
  {
    id: "n4", category: "reward", read: true, createdAt: hrs(3),
    title: "BIOPoints Earned",
    body:  "You earned 150 BIOPoints from your session with Sarah Chen.",
    time:  "3h ago", actionUrl: "/profile",
  },
  {
    id: "n5", category: "booking", read: true, createdAt: hrs(5),
    title: "Upcoming Session Reminder",
    body:  "You have a Facial with Sarah Chen in 2 hours. Check in from the app.",
    time:  "5h ago", actionUrl: "/schedule",
  },
  {
    id: "n6", category: "system", read: true, createdAt: days(1),
    title: "New Feature: BIOWallet",
    body:  "Top up your BIOWallet and pay for sessions seamlessly — no card needed at checkout.",
    time:  "Yesterday", actionUrl: "/wallet",
  },
  {
    id: "n7", category: "message", read: true, createdAt: days(1),
    title: "New routine from Dr. Kagiso S.",
    body:  "Your rehab plan has been updated. A new week-3 protocol is ready in Routines.",
    time:  "Yesterday", actionUrl: "/routines",
  },
  {
    id: "n8", category: "reward", read: true, createdAt: days(2),
    title: "Challenge Complete!",
    body:  "You completed the 'Book 3 Verticals' challenge and earned 500 bonus BIOPoints.",
    time:  "2 days ago", actionUrl: "/challenges",
  },
  {
    id: "n9", category: "booking", read: true, createdAt: days(3),
    title: "Session Recap",
    body:  "Session with Amir Patel is done. Leave a review to earn 50 BIOPoints.",
    time:  "3 days ago",
  },
  {
    id: "n10", category: "system", read: true, createdAt: days(5),
    title: "POPIA reminder",
    body:  "Review your privacy settings and data sharing preferences in Settings.",
    time:  "5 days ago", actionUrl: "/settings?tab=privacy",
  },
];

// ── Category config ────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<NotifCategory, {
  label: string; icon: React.ElementType; color: string; bg: string;
}> = {
  booking: { label: "Bookings",  icon: Calendar,       color: "text-indigo", bg: "glass-accent-indigo" },
  message: { label: "Messages",  icon: MessageSquare,  color: "text-teal",   bg: "glass-accent-teal"   },
  streak:  { label: "Streaks",   icon: Flame,          color: "text-amber",  bg: "glass-accent-amber"  },
  reward:  { label: "Rewards",   icon: Gift,           color: "text-amber",  bg: "glass-accent-amber"  },
  system:  { label: "System",    icon: Zap,            color: "text-muted-foreground", bg: "glass-1" },
};

function timeSince(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)         return "Just now";
  if (s < 3600)       return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)      return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7)  return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

// ── Notification card ─────────────────────────────────────────────────

function NotifCard({
  notif,
  onRead,
  onDelete,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const cfg = CATEGORY_CONFIG[notif.category];

  const handleTap = () => {
    onRead(notif.id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <GlassCard
        hover
        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
          !notif.read ? "border-l-2 border-indigo" : ""
        }`}
        onClick={handleTap}
      >
        {/* Category icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
          <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-semibold ${notif.read ? "text-muted-foreground" : "text-foreground"}`}>
              {notif.title}
            </p>
            <span className="text-[9px] text-muted-foreground shrink-0 mt-0.5">{timeSince(notif.createdAt)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
        </div>

        {!notif.read && (
          <div className="w-2 h-2 rounded-full bg-indigo shrink-0 mt-1" />
        )}
      </GlassCard>

      {/* Swipe-style action — delete button on long hover */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 focus:opacity-100 w-7 h-7 glass-1 rounded-full flex items-center justify-center transition-opacity"
      >
        <Trash2 className="w-3.5 h-3.5 text-coral" />
      </motion.button>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

const FILTERS: { key: NotifCategory | "all"; label: string }[] = [
  { key: "all",     label: "All"      },
  { key: "booking", label: "Bookings" },
  { key: "message", label: "Messages" },
  { key: "streak",  label: "Streaks"  },
  { key: "reward",  label: "Rewards"  },
];

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifs, setNotifs]     = useState<Notification[]>(MOCK_NOTIFS);
  const [filter, setFilter]     = useState<NotifCategory | "all">("all");
  const [showRead, setShowRead] = useState(true);

  // Real-time: subscribe to bookings/messages for live notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("notif-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings", filter: `client_id=eq.${user.id}` },
        payload => {
          const row = payload.new as { id: string; status: string; service: string };
          if (row.status === "confirmed") {
            setNotifs(prev => [{
              id:        `rt-${row.id}`,
              category:  "booking",
              title:     "Booking Confirmed",
              body:      `Your booking for "${row.service}" has been confirmed.`,
              time:      "Just now",
              createdAt: Date.now(),
              read:      false,
              actionUrl: "/schedule",
            }, ...prev]);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT", schema: "public", table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        payload => {
          const row = payload.new as { id: string; content: string; sender_id: string };
          setNotifs(prev => [{
            id:        `rt-msg-${row.id}`,
            category:  "message",
            title:     "New message",
            body:      row.content.slice(0, 80),
            time:      "Just now",
            createdAt: Date.now(),
            read:      false,
            actionUrl: "/messages",
          }, ...prev]);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAll = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const del = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));
  const clearAll = () => setNotifs([]);

  const visible = notifs
    .filter(n => filter === "all" || n.category === filter)
    .filter(n => showRead || !n.read)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="mx-auto max-w-lg px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={markAll}
                className="flex items-center gap-1 rounded-pill px-2.5 py-1.5 glass-1 text-xs text-muted-foreground"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/settings?tab=notifications")}
              className="w-8 h-8 glass-1 rounded-full flex items-center justify-center"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-pill px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-all ${
                filter === f.key ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
              }`}
            >
              {f.label}
              {f.key !== "all" && notifs.filter(n => n.category === f.key && !n.read).length > 0 && (
                <span className="ml-1 w-3.5 h-3.5 inline-flex items-center justify-center rounded-full bg-white/20 text-[9px] font-bold">
                  {notifs.filter(n => n.category === f.key && !n.read).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Show unread only toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{visible.length} notification{visible.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRead(o => !o)}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                !showRead ? "text-indigo" : "text-muted-foreground"
              }`}
            >
              <BellOff className="w-3.5 h-3.5" />
              {showRead ? "Unread only" : "Show all"}
            </button>
            {visible.length > 0 && (
              <button onClick={clearAll} className="text-[11px] text-coral/60 hover:text-coral transition-colors">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {visible.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 glass-1 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground/60">You're all caught up!</p>
              </motion.div>
            ) : (
              visible.map(n => (
                <NotifCard
                  key={n.id}
                  notif={n}
                  onRead={markRead}
                  onDelete={del}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <CoachAI />
      <BottomNav />
    </div>
  );
}
