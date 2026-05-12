import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, CalendarDays, Clock, Users, MapPin, Filter,
  Loader2, Check, Share2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "fitness", label: "Fitness" },
  { key: "wellness", label: "Wellness" },
  { key: "medical", label: "Medical" },
  { key: "beauty", label: "Beauty" },
  { key: "mental", label: "Mental" },
  { key: "nutrition", label: "Nutrition" },
];

type GroupSession = {
  id: string;
  title: string;
  description: string | null;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  max_participants: number;
  current_participants: number;
  price_per_person: number;
  spots_remaining: number;
  status: string;
  provider?: { id: string; full_name: string; avatar_url: string | null; specialty: string };
  service?: { id: string; title: string; category: string; duration_minutes: number };
};

export default function GroupBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [category, setCategory] = useState("all");

  // Auto-join flow from share link
  const autoJoinId = searchParams.get("join");

  useEffect(() => {
    fetchSessions();
  }, [category]);

  async function fetchSessions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      const res = await fetch(`${API}/api/bookings/group/available?${params}`);
      const json = await res.json();
      if (json.ok) setSessions(json.data ?? []);
    } catch {
      toast.error("Failed to load group sessions");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(sessionId: string) {
    if (!user) {
      navigate("/welcome?login=true&redirect=/group-bookings");
      return;
    }

    setJoining(sessionId);
    try {
      const token = (await (window as any).__supabase?.auth.getSession())?.data?.session?.access_token;
      const res = await fetch(`${API}/api/bookings/group/${sessionId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("You're in! Session booked successfully.");
        fetchSessions();
      } else {
        toast.error(json.error ?? "Could not join session");
      }
    } catch {
      toast.error("Network error — try again");
    } finally {
      setJoining(null);
    }
  }

  function shareSession(session: GroupSession) {
    const url = `${window.location.origin}/group-bookings?join=${session.id}`;
    const text = `Join me for ${session.title} on ${session.booking_date} at ${session.booking_time}! R${session.price_per_person} per person. ${session.spots_remaining} spots left.`;
    if (navigator.share) {
      navigator.share({ title: session.title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Link copied!");
    }
  }

  // Auto-join on mount if share link
  useEffect(() => {
    if (autoJoinId && user && !loading) {
      handleJoin(autoJoinId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoJoinId, user, loading]);

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-20 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="glass-2 rounded-full w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Group Sessions</h1>
            <p className="text-xs text-muted-foreground">Yoga classes, workshops, group training and more</p>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
                category === c.key
                  ? "gradient-indigo text-primary-foreground"
                  : "glass-1 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Sparkles className="w-10 h-10 text-indigo/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No group sessions available right now.</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon or browse individual providers.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <GlassCard className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Category badge */}
                        {session.service?.category && (
                          <span className="inline-block text-[10px] glass-accent-indigo rounded-pill px-2 py-0.5 text-indigo capitalize mb-1.5">
                            {session.service.category}
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-foreground">{session.title}</h3>
                        {session.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{session.description}</p>
                        )}

                        {/* Provider */}
                        {session.provider && (
                          <button
                            onClick={() => navigate(`/provider/${session.provider!.id}`)}
                            className="text-[11px] text-indigo hover:underline mt-1"
                          >
                            {session.provider.full_name}
                          </button>
                        )}

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(session.booking_date)}
                          </span>
                          {session.booking_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.booking_time.slice(0, 5)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {session.spots_remaining} spot{session.spots_remaining !== 1 ? "s" : ""} left
                          </span>
                        </div>
                      </div>

                      {/* Right side: price + actions */}
                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <p className="font-data text-sm text-foreground">
                          {session.price_per_person === 0 ? "Free" : `R${session.price_per_person}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">per person</p>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => shareSession(session)}
                            className="w-8 h-8 glass-1 rounded-full flex items-center justify-center hover:bg-white/[0.06]"
                          >
                            <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            disabled={joining === session.id || session.spots_remaining <= 0}
                            onClick={() => handleJoin(session.id)}
                            className="rounded-pill px-4 py-2 gradient-indigo text-primary-foreground text-xs font-semibold shadow-cta disabled:opacity-50"
                          >
                            {joining === session.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : session.spots_remaining <= 0 ? (
                              "Full"
                            ) : (
                              "Join"
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Spots progress bar */}
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo to-violet transition-all"
                          style={{
                            width: `${(session.current_participants / session.max_participants) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {session.current_participants}/{session.max_participants} joined
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
