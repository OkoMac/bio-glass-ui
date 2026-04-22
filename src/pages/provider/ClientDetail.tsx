import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { supabase } from "@/integrations/supabase/client";
import { getProviderImage } from "@/lib/providerImages";
import {
  ArrowLeft, MessageSquare, Calendar, Star, AlertTriangle,
  CheckCircle, Plus, Send, Award, Flame, ClipboardList,
  TrendingUp, Activity, FileText, Gift, ChevronRight,
  Clock, Target, Edit3, Trash2, X, Users, Loader2
} from "lucide-react";

/* ── Client CRM data types ─────────── */
interface ClientData {
  id: string; name: string; image: string; vertical: string;
  email: string; phone: string; goal: string; risk: string;
  sessions: number; totalSpend: number; nextBooking: string;
  joinedAt: string; lastVisit: string; wellnessScore: number;
  streak: number; bioPoints: number; tags: string[];
  location: string;
  providerType: string;
  sessionHistory: { date: string; service: string; notes: string; rating: number }[];
  activeTasks: { id: string; label: string; due: string; done: boolean; type: string }[];
  providerNotes: { id: string; text: string; date: string; pinned: boolean }[];
  prescriptions: { id: string; title: string; type: string; progress: number }[];
  rewardsGiven: { label: string; points: number; date: string }[];
}

// ── Main component ──────────────────────────────────────────────
export default function ClientDetail() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings } = useBookings();
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "tasks" | "notes">("overview");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [pinned, setPinned] = useState(false);
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  /* Build client data from real bookings + Supabase profile */
  useEffect(() => {
    if (!clientId) { setLoading(false); return; }

    const buildClient = async () => {
      // 1) Find all bookings for this client (provider's view)
      const clientBookings = bookings.filter(b =>
        b.clientId === clientId ||
        b.id === clientId ||
        (b.clientName && b.clientName.replace(/\s/g, "_").toLowerCase() === clientId)
      );

      // 2) Try to fetch the client's profile from Supabase
      let profile: any = null;
      let notesData: any[] = [];
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", clientId)
          .single();
        profile = profileData;

        // Fetch provider notes if any
        if (user?.id) {
          const { data: notesResult } = await supabase
            .from("client_notes")
            .select("*")
            .eq("client_id", clientId)
            .eq("provider_id", user.id)
            .order("created_at", { ascending: false });
          notesData = notesResult ?? [];
        }
      } catch (err) {
        // No profile in Supabase (demo or new client) — derive from bookings
      }

      // 3) Build client object
      const firstBooking = clientBookings[0];
      const clientName = profile?.full_name ?? firstBooking?.clientName ?? "Client";
      const image = profile?.avatar_url ?? getProviderImage(clientId, clientName);

      const sessionHistory = clientBookings
        .filter(b => b.status === "completed")
        .map(b => ({
          date: b.date ?? "",
          service: b.service ?? "Session",
          notes: b.notes ?? "",
          rating: 5,
        }));

      const totalSpend = clientBookings
        .filter(b => b.status === "completed" && b.price)
        .reduce((sum, b) => {
          const num = parseInt((b.price ?? "0").replace(/[^0-9]/g, ""));
          return sum + (isNaN(num) ? 0 : num);
        }, 0);

      const nextBooking = clientBookings
        .filter(b => b.status === "confirmed" || b.status === "pending")
        .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))[0]?.date ?? "—";

      const lastVisit = sessionHistory[0]?.date ?? "—";
      const joinedAt = clientBookings[clientBookings.length - 1]?.date ?? "—";

      // Risk: high if no booking in 30+ days, medium if 14-30 days
      const daysSinceLastVisit = lastVisit !== "—"
        ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const risk = daysSinceLastVisit > 30 ? "high" : daysSinceLastVisit > 14 ? "medium" : "low";

      const builtClient: ClientData = {
        id: clientId,
        name: clientName,
        image,
        vertical: "teal",
        email: profile?.email ?? "",
        phone: profile?.phone ?? "",
        goal: profile?.goal ?? "",
        risk,
        sessions: sessionHistory.length,
        totalSpend,
        nextBooking,
        joinedAt,
        lastVisit,
        wellnessScore: 0,
        streak: 0,
        bioPoints: 0,
        tags: [],
        location: profile?.location ?? "Pretoria",
        providerType: "",
        sessionHistory,
        activeTasks: [],
        providerNotes: notesData.map((n: any) => ({
          id: n.id,
          text: n.note ?? n.text ?? "",
          date: new Date(n.created_at).toLocaleDateString("en-ZA"),
          pinned: n.pinned ?? false,
        })),
        prescriptions: [],
        rewardsGiven: [],
      };

      setClient(builtClient);
      setLoading(false);
    };

    buildClient();
  }, [clientId, bookings, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8">
          <GlassCard className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading client data...</p>
          </GlassCard>
        </div>
        <BionAssistant />
        <ProviderNav />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <div className="mx-auto max-w-3xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8">
          <GlassCard className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-foreground mb-2">Client not found</h1>
            <p className="text-xs text-muted-foreground mb-4">This client does not exist or has not booked with you yet.</p>
            <button onClick={() => navigate("/pro/clients")} className="px-4 py-2 gradient-indigo rounded-full text-sm font-medium">
              Back to Clients
            </button>
          </GlassCard>
        </div>
        <BionAssistant />
        <ProviderNav />
      </div>
    );
  }

  const addNote = async () => {
    if (!newNote.trim() || !client || !user?.id) return;
    const text = newNote.trim();
    const isDemo = user.id.startsWith("demo_");

    // Optimistic UI update
    const tempNote = {
      id: `temp_${Date.now()}`,
      text,
      date: new Date().toLocaleDateString("en-ZA"),
      pinned,
    };
    setClient(prev => prev ? { ...prev, providerNotes: [tempNote, ...prev.providerNotes] } : prev);
    setShowNoteForm(false);
    setNewNote("");
    setPinned(false);

    // Save to Supabase (skip for demo)
    if (!isDemo) {
      try {
        await supabase.from("client_notes").insert({
          client_id: client.id,
          provider_id: user.id,
          note: text,
          pinned,
        });
      } catch (err) {
        if (import.meta.env.DEV) console.warn("[client notes] save failed:", err);
      }
    }
  };

  const markTaskDone = (taskId: string) => {
    // In a real app, this would update the database
  };

  // Calculate client statistics
  const clientStats = {
    totalSessions: client.sessions,
    totalValue: client.totalSpend,
    avgRating: client.sessionHistory.length > 0 
      ? (client.sessionHistory.reduce((sum, session) => sum + session.rating, 0) / client.sessionHistory.length).toFixed(1)
      : "0.0",
    completionRate: client.activeTasks.length > 0
      ? Math.round((client.activeTasks.filter(t => t.done).length / client.activeTasks.length) * 100)
      : 0
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-5xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/pro/clients")} className="p-1.5 glass-1 rounded-full">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{client.location}, Pretoria</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  client.risk === "low" ? "bg-emerald-500/20 text-emerald-300" :
                  client.risk === "medium" ? "bg-amber-500/20 text-amber-300" :
                  "bg-rose-500/20 text-rose-300"
                }`}>
                  {client.risk} risk
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/pro/messages")} className="px-4 py-2 glass-1 rounded-full text-sm font-medium">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Message
            </button>
            <button onClick={() => navigate("/pro/bookings")} className="px-4 py-2 gradient-indigo rounded-full text-sm font-medium">
              <Calendar className="w-4 h-4 inline mr-1" />
              Book Session
            </button>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-foreground">{clientStats.totalSessions}</div>
            <div className="text-xs text-muted-foreground">Total Sessions</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-foreground">R{clientStats.totalValue}</div>
            <div className="text-xs text-muted-foreground">Total Value</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-foreground">{clientStats.avgRating}/5</div>
            <div className="text-xs text-muted-foreground">Avg Rating</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-foreground">{clientStats.completionRate}%</div>
            <div className="text-xs text-muted-foreground">Task Completion</div>
          </GlassCard>
        </div>

        {/* Client info card */}
        <GlassCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Client Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Service Type</span>
                  <span className="font-medium">{client.providerType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Primary Goal</span>
                  <span className="font-medium">{client.goal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Wellness Score</span>
                  <span className="font-medium">{client.wellnessScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Streak</span>
                  <span className="font-medium">{client.streak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">BIO Points</span>
                  <span className="font-medium">{client.bioPoints}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact & Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="font-medium">{client.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="font-medium">{client.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Joined</span>
                  <span className="font-medium">{client.joinedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Visit</span>
                  <span className="font-medium">{client.lastVisit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Next Booking</span>
                  <span className="font-medium">{client.nextBooking}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tags */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex flex-wrap gap-2">
              {client.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-slate-500/10 text-slate-300 rounded-full text-xs">
                  {tag}
                </span>
              ))}
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full text-xs">
                {client.location}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Tab navigation */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(["overview", "history", "tasks", "notes"] as const).map(tab => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-pill text-sm font-medium whitespace-nowrap ${
                activeTab === tab ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {/* Session History */}
          {activeTab === "history" && (
            <GlassCard className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Session History</h3>
              {client.sessionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No session history yet.</p>
                </div>
              ) : (
              <div className="space-y-4">
                {client.sessionHistory.map((session, idx) => (
                  <div key={idx} className="flex items-start justify-between p-4 glass-1 rounded-2xl">
                    <div>
                      <div className="font-medium text-foreground">{session.service}</div>
                      <div className="text-sm text-muted-foreground mt-1">{session.notes}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{session.date}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < session.rating ? "text-amber fill-amber" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => alert("Session notes will open here.")} className="p-2 rounded-full hover:bg-white/10">
                      <FileText className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
              )}
            </GlassCard>
          )}

          {/* Active Tasks */}
          {activeTab === "tasks" && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Active Tasks</h3>
                <button onClick={() => alert("Task creation coming soon.")} className="px-3 py-1.5 gradient-indigo rounded-full text-xs font-medium">
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add Task
                </button>
              </div>
              {client.activeTasks.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active tasks yet.</p>
                </div>
              ) : (
              <div className="space-y-3">
                {client.activeTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 glass-1 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => markTaskDone(task.id)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          task.done ? "bg-emerald border-emerald" : "border-muted-foreground"
                        }`}
                      >
                        {task.done && <CheckCircle className="w-3 h-3 text-white" />}
                      </button>
                      <div>
                        <div className={`font-medium ${task.done ? "text-foreground/60 line-through" : "text-foreground"}`}>
                          {task.label}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">Due: {task.due}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            task.type === "workout" ? "bg-indigo-500/10 text-indigo-300" :
                            task.type === "nutrition" ? "bg-emerald-500/10 text-emerald-300" :
                            "bg-amber-500/10 text-amber-300"
                          }`}>
                            {task.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => alert("Task editing coming soon.")} className="p-2 rounded-full hover:bg-white/10">
                      <Edit3 className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
              )}
            </GlassCard>
          )}

          {/* Provider Notes */}
          {activeTab === "notes" && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Provider Notes</h3>
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="px-3 py-1.5 gradient-indigo rounded-full text-xs font-medium"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add Note
                </button>
              </div>
              
              {/* Note form */}
              <AnimatePresence>
                {showNoteForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="glass-1 rounded-2xl p-4">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note about this client..."
                        className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground min-h-[100px]"
                      />
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPinned(!pinned)}
                            className={`p-1.5 rounded-full ${pinned ? "bg-amber/20 text-amber" : "glass-1 text-muted-foreground"}`}
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-muted-foreground">
                            {pinned ? "Pinned note" : "Pin this note"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowNoteForm(false);
                              setNewNote("");
                              setPinned(false);
                            }}
                            className="px-3 py-1.5 glass-1 rounded-full text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={addNote}
                            disabled={!newNote.trim()}
                            className="px-3 py-1.5 gradient-indigo rounded-full text-xs font-medium"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes list */}
              {client.providerNotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notes yet. Add a note to track client information.</p>
                </div>
              ) : (
              <div className="space-y-4">
                {client.providerNotes.map(note => (
                  <div key={note.id} className={`p-4 rounded-2xl ${note.pinned ? "glass-accent-amber" : "glass-1"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-foreground">{note.text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">{note.date}</span>
                          {note.pinned && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded-full text-xs">
                              Pinned
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {note.pinned && (
                          <Award className="w-4 h-4 text-amber" />
                        )}
                        <button onClick={() => alert("Note editing coming soon.")} className="p-1.5 rounded-full hover:bg-white/10">
                          <Edit3 className="w-4 h-4 text-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </GlassCard>
          )}

          {/* Overview (default) */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prescriptions/Programs */}
              <GlassCard className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Active Programs</h3>
                {client.prescriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No active programs yet.</p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {client.prescriptions.map(prescription => (
                    <div key={prescription.id} className="p-4 glass-1 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-foreground">{prescription.title}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          prescription.type === "workout" ? "bg-indigo-500/10 text-indigo-300" :
                          "bg-emerald-500/10 text-emerald-300"
                        }`}>
                          {prescription.type}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{prescription.progress}%</span>
                        </div>
                        <div className="h-2 glass-2 rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-indigo rounded-full"
                            style={{ width: `${prescription.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </GlassCard>

              {/* Rewards & Recognition */}
              <GlassCard className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Rewards & Recognition</h3>
                <div className="space-y-4">
                  {client.rewardsGiven.length > 0 ? (
                    client.rewardsGiven.map((reward, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 glass-1 rounded-2xl">
                        <div>
                          <div className="font-medium text-foreground">{reward.label}</div>
                          <div className="text-sm text-muted-foreground mt-1">{reward.points} points • {reward.date}</div>
                        </div>
                        <Gift className="w-5 h-5 text-amber" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No rewards yet</p>
                      <button onClick={() => alert("Points awarded! (Coming soon)")} className="mt-3 px-4 py-2 gradient-indigo rounded-full text-sm font-medium">
                        <Award className="w-4 h-4 inline mr-1" />
                        Award Points
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <ProviderNav active="clients" />
      </div>

      {/* Coach AI */}
      <BionAssistant
        context={`Client detail view: ${client.name}. ${client.sessions} sessions, ${client.wellnessScore} wellness score, ${client.risk} risk. Based in ${client.location}, Pretoria.`}
        suggestions={[
          `How can I better support ${client.name}'s ${client.goal} goals?`,
          `What strategies work best for ${client.risk} risk clients?`,
          `How do I improve engagement with clients from ${client.location}?`,
          `What metrics should I track for ${client.providerType} clients?`
        ]}
      />
    </div>
  );
}