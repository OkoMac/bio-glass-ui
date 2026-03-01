import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import GlassCard from "@/components/GlassCard";
import BioAvatar from "@/components/BioAvatar";
import { supabase } from "@/integrations/supabase/client";
import {
  Home, Calendar, Users, MessageCircle, BarChart3,
  Bell, Settings, TrendingUp, Clock, Plus, ChevronRight, Sparkles,
} from "lucide-react";

const tabs = [
  { icon: Home, label: "Dashboard", key: "dashboard" },
  { icon: Calendar, label: "Calendar", key: "calendar" },
  { icon: Users, label: "Clients", key: "clients" },
  { icon: MessageCircle, label: "Messages", key: "messages" },
  { icon: BarChart3, label: "Analytics", key: "analytics" },
];

// Mock stats for now
const todayStats = { revenue: "R2,450", sessions: 4, newClients: 1, unreadMessages: 3 };

const ProviderDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bookings, setBookings] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    // Fetch provider's bookings
    supabase.from("bookings").select("*, client:profiles!bookings_client_id_fkey(full_name, avatar_url, vertical), service:services(title, duration_minutes, price)")
      .eq("provider_id", profile.id)
      .order("booking_date", { ascending: true })
      .limit(20)
      .then(({ data }) => setBookings(data || []));

    // Fetch unique clients
    supabase.from("bookings").select("client:profiles!bookings_client_id_fkey(id, full_name, avatar_url, email, vertical)")
      .eq("provider_id", profile.id)
      .then(({ data }) => {
        const unique = new Map();
        (data || []).forEach((b: any) => { if (b.client) unique.set(b.client.id, b.client); });
        setClients(Array.from(unique.values()));
      });
  }, [profile]);

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar (desktop) / Bottom nav (mobile) */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen glass-1 border-r border-foreground/5 p-4">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-xl font-bold text-foreground">BIO</span>
            <span className="text-xs text-indigo font-medium">Provider</span>
          </div>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 w-full text-left ${
                activeTab === t.key ? "glass-accent-indigo text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
          <div className="mt-auto space-y-1">
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground w-full">
              <Settings className="w-4 h-4" />Settings
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-5xl mx-auto w-full">
          {activeTab === "dashboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{getGreeting()}, {profile?.full_name?.split(" ")[0] || "Provider"}</h1>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}</p>
                </div>
                <div className="flex gap-2">
                  <button className="glass-1 rounded-full w-10 h-10 flex items-center justify-center relative">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full gradient-indigo text-[9px] font-bold text-primary-foreground flex items-center justify-center">3</span>
                  </button>
                </div>
              </div>

              {/* Revenue Hero */}
              <GlassCard variant="accent-indigo" className="p-5">
                <p className="text-xs text-muted-foreground">Today's Revenue</p>
                <div className="flex items-end justify-between mt-1">
                  <p className="text-4xl font-bold font-data text-foreground">{todayStats.revenue}</p>
                  <div className="flex items-center gap-1 text-teal text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />+12% vs last week
                  </div>
                </div>
              </GlassCard>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Sessions Today", value: todayStats.sessions, icon: Calendar },
                  { label: "New Clients", value: todayStats.newClients, icon: Users },
                  { label: "Unread", value: todayStats.unreadMessages, icon: MessageCircle },
                ].map((s) => (
                  <GlassCard key={s.label} className="p-3 text-center">
                    <s.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold font-data text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </GlassCard>
                ))}
              </div>

              {/* Profile Strength */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Profile Strength</p>
                  <span className="text-xs font-data text-indigo">65%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-foreground/5">
                  <div className="h-full rounded-full gradient-indigo" style={{ width: "65%" }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Add a video intro to increase bookings by 25%</p>
              </GlassCard>

              {/* Today's Schedule */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground">Today's Schedule</h2>
                  <button onClick={() => setActiveTab("calendar")} className="text-xs text-indigo">View all →</button>
                </div>
                {bookings.length === 0 ? (
                  <GlassCard className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No bookings today</p>
                    <p className="text-xs text-muted-foreground mt-1">Share your profile link to get more bookings</p>
                  </GlassCard>
                ) : (
                  <div className="space-y-2">
                    {bookings.slice(0, 5).map((b) => (
                      <GlassCard key={b.id} hover className="p-3 flex items-center gap-3">
                        <div className="w-1 h-10 rounded-full bg-indigo" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{b.service?.title || "Session"}</p>
                          <p className="text-[10px] text-muted-foreground">{b.client?.full_name || "Client"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-data text-foreground">{b.booking_time}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-pill ${
                            b.status === "confirmed" ? "glass-accent-teal text-teal" : "glass-accent-amber text-amber"
                          }`}>{b.status}</span>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </div>

              {/* ServeAI Card */}
              <GlassCard variant="accent-indigo" className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">ServeAI Insight ✦</p>
                    <p className="text-xs text-muted-foreground mt-1">Adding Thursday evening slots could increase bookings by 18%</p>
                    <button className="text-xs text-indigo-light font-medium mt-2">Apply →</button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "calendar" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                <motion.button whileTap={{ scale: 0.95 }} className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground">
                  <Plus className="w-3 h-3 inline mr-1" />Add Availability
                </motion.button>
              </div>
              <GlassCard className="p-6 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Calendar view coming soon</p>
                <p className="text-xs text-muted-foreground mt-1">Set your availability to start receiving bookings</p>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "clients" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Clients</h1>
                <span className="text-xs text-muted-foreground">{clients.length} total</span>
              </div>
              {/* Search */}
              <div className="glass-1 rounded-pill flex items-center gap-3 px-4 py-2.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search clients..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              </div>

              {clients.length === 0 ? (
                <GlassCard className="p-6 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No clients yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Clients will appear here once they book a session with you</p>
                </GlassCard>
              ) : (
                <div className="space-y-2">
                  {clients.map((c) => (
                    <GlassCard key={c.id} hover className="p-3.5 flex items-center gap-3">
                      <BioAvatar src={c.avatar_url || "/placeholder.svg"} alt={c.full_name} size="md" verticalColor={(c.vertical || "indigo") as any} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </GlassCard>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "messages" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h1 className="text-2xl font-bold text-foreground">Messages</h1>
              <GlassCard className="p-6 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              {/* Period Toggle */}
              <div className="flex gap-2">
                {["7D", "30D", "90D", "12M"].map((p, i) => (
                  <button key={p} className={`rounded-pill px-3 py-1.5 text-xs font-medium ${i === 0 ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"}`}>{p}</button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold font-data text-foreground mt-1">R12,450</p>
                  <div className="flex items-center gap-1 text-teal text-xs mt-1"><TrendingUp className="w-3 h-3" />+8%</div>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold font-data text-foreground mt-1">34</p>
                  <div className="flex items-center gap-1 text-teal text-xs mt-1"><TrendingUp className="w-3 h-3" />+15%</div>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground">Retention Rate</p>
                  <p className="text-2xl font-bold font-data text-foreground mt-1">78%</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground">Avg. Rating</p>
                  <p className="text-2xl font-bold font-data text-foreground mt-1">4.8 ⭐</p>
                </GlassCard>
              </div>

              <GlassCard variant="accent-indigo" className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">ServeAI Advisory ✦</p>
                    <p className="text-xs text-muted-foreground mt-1">You have 3 clients at churn risk. Re-engaging them could recover R4,200/month.</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-3 left-4 right-4 z-50 glass-2 rounded-pill px-2 py-2 shadow-card">
        <div className="flex items-center justify-around">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex flex-col items-center gap-1 py-1 px-2">
              <t.icon className={`w-5 h-5 ${activeTab === t.key ? "text-indigo" : "text-muted-foreground"}`} strokeWidth={activeTab === t.key ? 2.5 : 1.5} />
              <span className={`text-[9px] font-medium ${activeTab === t.key ? "text-indigo" : "text-muted-foreground"}`}>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default ProviderDashboard;
