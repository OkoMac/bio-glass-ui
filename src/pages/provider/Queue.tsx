import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Users, Clock, Play, CheckCircle, XCircle,
  AlertTriangle, Loader2, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface QueueEntry {
  id: string;
  position: number;
  status: "waiting" | "in_progress" | "completed" | "no_show" | "cancelled";
  estimatedWaitMinutes: number;
  estimated_wait_minutes: number;
  joined_at: string;
  started_at: string | null;
  client: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

export default function Queue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!user?.profileId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API}/api/queue/${user.profileId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const json = await res.json();
      if (json.ok) setQueue(json.data ?? []);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.profileId]);

  useEffect(() => {
    fetchQueue();
    // Poll every 15 seconds for real-time updates
    const interval = setInterval(fetchQueue, 15_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const updateStatus = async (entryId: string, status: string) => {
    setUpdating(entryId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API}/api/queue/${entryId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.ok) {
        await fetchQueue();
      }
    } catch (err) {
      console.error("Failed to update queue:", err);
    } finally {
      setUpdating(null);
    }
  };

  const waitingCount = queue.filter(e => e.status === "waiting").length;
  const inProgressCount = queue.filter(e => e.status === "in_progress").length;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  };

  const timeSince = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.round(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button
        onClick={() => navigate(-1)}
        className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo" /> Waiting Room
            </h1>
            <p className="text-xs text-muted-foreground">Manage walk-in clients in your queue</p>
          </div>
          <button
            onClick={fetchQueue}
            className="glass-1 rounded-xl p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-3 text-center">
            <p className="text-xl font-bold font-data text-foreground">{waitingCount}</p>
            <p className="text-[10px] text-muted-foreground">Waiting</p>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <p className="text-xl font-bold font-data text-teal">{inProgressCount}</p>
            <p className="text-[10px] text-muted-foreground">In Session</p>
          </GlassCard>
          <GlassCard className="p-3 text-center">
            <p className="text-xl font-bold font-data text-foreground">
              ~{waitingCount * 30}m
            </p>
            <p className="text-[10px] text-muted-foreground">Est. Total Wait</p>
          </GlassCard>
        </div>

        {/* Queue list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo animate-spin" />
          </div>
        ) : queue.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No one in the queue right now.</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Clients can join your queue from your profile page.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {queue.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Position badge */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        entry.status === "in_progress"
                          ? "bg-teal/20 text-teal"
                          : "glass-2 text-foreground"
                      }`}>
                        {entry.status === "in_progress" ? (
                          <Play className="w-4 h-4" />
                        ) : (
                          `#${entry.position}`
                        )}
                      </div>

                      {/* Client info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {entry.client?.full_name ?? "Anonymous"}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Joined {formatTime(entry.joined_at)}</span>
                          <span className="opacity-40">|</span>
                          <span>{timeSince(entry.joined_at)}</span>
                        </div>
                        {entry.status === "waiting" && (
                          <p className="text-[10px] text-indigo mt-0.5">
                            Est. wait: ~{entry.estimatedWaitMinutes ?? entry.estimated_wait_minutes ?? 0} min
                          </p>
                        )}
                        {entry.status === "in_progress" && entry.started_at && (
                          <p className="text-[10px] text-teal mt-0.5">
                            In session for {timeSince(entry.started_at)}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5 shrink-0">
                        {entry.status === "waiting" && (
                          <button
                            onClick={() => updateStatus(entry.id, "in_progress")}
                            disabled={updating === entry.id}
                            className="px-3 py-1.5 rounded-pill text-[11px] font-semibold gradient-indigo text-primary-foreground flex items-center gap-1"
                          >
                            {updating === entry.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            Start
                          </button>
                        )}
                        {entry.status === "in_progress" && (
                          <>
                            <button
                              onClick={() => updateStatus(entry.id, "completed")}
                              disabled={updating === entry.id}
                              className="px-3 py-1.5 rounded-pill text-[11px] font-semibold bg-teal/20 text-teal flex items-center gap-1"
                            >
                              {updating === entry.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Done
                            </button>
                            <button
                              onClick={() => updateStatus(entry.id, "no_show")}
                              disabled={updating === entry.id}
                              className="px-2 py-1.5 rounded-pill text-[11px] font-semibold bg-coral/20 text-coral flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {entry.status === "waiting" && (
                          <button
                            onClick={() => updateStatus(entry.id, "no_show")}
                            disabled={updating === entry.id}
                            className="px-2 py-1.5 rounded-pill text-[11px] glass-1 text-muted-foreground"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ProviderNav />
    </div>
  );
}
