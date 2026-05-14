import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import AdminOpsStrip from "@/components/AdminOpsStrip";
import AdminAlertsPanel from "@/components/admin/AdminAlertsPanel";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/safeQuery";
import {
  Users, Briefcase, TrendingUp, AlertTriangle,
  CheckCircle, Clock, XCircle, ChevronRight, ShieldCheck,
  Mail, Phone, Calendar, FileText, UserPlus, Loader2, ArrowLeft,
} from "lucide-react";

interface BookingRequest {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  provider_name: string;
  provider_email: string | null;
  provider_phone: string | null;
  service_description: string;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface VerticalStat {
  label: string;
  count: number;
  pct: number;
  color: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [providerCount, setProviderCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [loadingKpis, setLoadingKpis] = useState(true);

  const [pendingProviders, setPendingProviders] = useState<{ id: string; full_name: string; specialty: string | null; created_at: string }[]>([]);
  const [approvals, setApprovals] = useState<Record<string, "approved" | "rejected" | null>>({});
  const [loadingPending, setLoadingPending] = useState(true);

  const [verticalStats, setVerticalStats] = useState<VerticalStat[]>([]);

  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    loadKpis();
    loadPendingProviders();
    loadBookingRequests();
    loadVerticalStats();
  }, []);

  const loadKpis = async () => {
    try {
      const [providers, clients, bookings] = await Promise.all([
        withTimeout(() => supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "provider"), 5000, { count: 0 } as any),
        withTimeout(() => supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "client"), 5000, { count: 0 } as any),
        withTimeout(() => supabase.from("bookings").select("id", { count: "exact", head: true }), 5000, { count: 0 } as any),
      ]);
      setProviderCount(providers.count ?? 0);
      setClientCount(clients.count ?? 0);
      setBookingCount(bookings.count ?? 0);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to load KPIs:", err);
    } finally {
      setLoadingKpis(false);
    }
  };

  const loadPendingProviders = async () => {
    try {
      // Multi-Role Step 3 — specialty now lives on provider_profiles.
      // Multi-Role Step 4 (2026-04-28) DROPPED profiles.specialty — the bare
      // column reference here was 400'ing the whole query. Read it only via
      // the joined provider_profiles relation.
      const { data } = await withTimeout(
        () => supabase.from("profiles")
          .select("id, full_name, created_at, provider_profiles(specialty)")
          .eq("is_active", false)
          .order("created_at", { ascending: false })
          .limit(10),
        5000,
        { data: null } as any,
      );
      const list = (data ?? []).map((p: any /* TODO(types) */) => ({
        id: p.id,
        full_name: p.full_name,
        specialty: p.provider_profiles?.specialty ?? p.specialty ?? null,
        created_at: p.created_at,
      }));
      setPendingProviders(list);
      setApprovals(Object.fromEntries(list.map((p: any /* TODO(types) */) => [p.id, null])));
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to load pending providers:", err);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadVerticalStats = async () => {
    try {
      // Read specialty from provider_profiles (source of truth post-Step 2)
      // and fall through to profiles.specialty for any row that hasn't
      // been backfilled (e.g. brand-new signups before slice 4 dual-write).
      const { data: ppData } = await supabase
        .from("provider_profiles")
        .select("specialty")
        .not("specialty", "is", null);
      const { data: legacyData } = await supabase
        .from("profiles")
        .select("user_id, specialty")
        .not("specialty", "is", null);
      const seen = new Set<string>();
      const merged: { specialty: string | null }[] = [];
      (ppData ?? []).forEach((p: any /* TODO(types) */) => merged.push({ specialty: p.specialty }));
      // Add legacy rows whose user_id isn't already represented in provider_profiles.
      // We can't dedupe perfectly here without joining, so just include both —
      // step 4 will drop legacy and the dupe risk goes away.
      (legacyData ?? []).forEach((p: any /* TODO(types) */) => {
        if (!seen.has(p.user_id)) merged.push({ specialty: p.specialty });
      });
      if (merged.length > 0) {
        const counts: Record<string, number> = {};
        merged.forEach(p => {
          const key = p.specialty || "Other";
          counts[key] = (counts[key] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const maxCount = sorted[0]?.[1] || 1;
        const VERTICAL_COLORS: Record<string, string> = {
          Fitness: "#2DD4BF", Medical: "#6366F1", Beauty: "#FB7185",
          Professional: "#FBBF24", Wellness: "#A78BFA",
        };
        setVerticalStats(sorted.map(([label, count]) => ({
          label,
          count,
          pct: Math.round((count / maxCount) * 100),
          color: VERTICAL_COLORS[label] || "#6B7280",
        })));
      } else {
        setVerticalStats([]);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to load vertical stats:", err);
    }
  };

  const loadBookingRequests = async () => {
    try {
      const { data } = await supabase
        .from("booking_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10) as { data: BookingRequest[] | null };
      setBookingRequests(data ?? []);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Failed to load booking requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const updateRequestStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("booking_requests").update({ status } as any).eq("id", id);
    if (error) { import("sonner").then(({ toast }) => toast.error("Failed to update request")); return; }
    setBookingRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const approveProvider = async (id: string) => {
    const { error } = await supabase.from("profiles").update({ is_active: true } as any).eq("id", id);
    if (error) { import("sonner").then(({ toast }) => toast.error("Failed to approve provider")); return; }
    // Slice 4 dual-write — mirror is_active to provider_profiles.
    try {
      const { data: row } = await supabase.from("profiles").select("user_id").eq("id", id).maybeSingle();
      const userId = (row as any)?.user_id;
      if (userId) {
        await supabase.from("provider_profiles" as any).update({ is_active: true }).eq("user_id", userId);
      }
    } catch { /* best-effort */ }
    setApprovals(a => ({ ...a, [id]: "approved" }));
  };

  const rejectProvider = async (id: string) => {
    setApprovals(a => ({ ...a, [id]: "rejected" }));
  };

  const pendingCount = bookingRequests.filter(r => r.status === "pending").length;

  const kpis = [
    { label: "Total Providers", value: loadingKpis ? "..." : String(providerCount), trend: loadingKpis ? "Loading..." : "From Supabase", icon: Briefcase, color: "#6366F1" },
    { label: "Active Clients", value: loadingKpis ? "..." : String(clientCount), trend: loadingKpis ? "Loading..." : "From Supabase", icon: Users, color: "#2DD4BF" },
    { label: "Bookings (Total)", value: loadingKpis ? "..." : String(bookingCount), trend: loadingKpis ? "Loading..." : "From Supabase", icon: TrendingUp, color: "#FBBF24" },
    { label: "Pending Requests", value: "—", trend: "Loading...", icon: AlertTriangle, color: "#FB7185" },
  ];

  const statusColor: Record<string, string> = {
    pending: "glass-accent-amber text-amber",
    contacted: "glass-accent-indigo text-indigo-light",
    booked: "glass-accent-teal text-teal",
    cancelled: "glass-accent-coral text-coral",
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="w-full px-4 md:px-8 xl:px-12 pt-24 pb-10 md:pt-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-coral" />
              <span className="text-xs text-coral font-semibold uppercase tracking-wider">Admin Console</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
            <p className="text-xs text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-pill glass-accent-coral text-coral">Admin</span>
        </div>

        {/* Live ops metrics — pulled from /api/admin/metrics every 60s */}
        <AdminOpsStrip />

        {/* Real-time operational alerts — disputes overdue, FICA aging, etc. */}
        <AdminAlertsPanel />

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-muted-foreground">{k.label}</p>
                  <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                </div>
                <p className="text-2xl font-bold font-data text-foreground">
                  {k.label === "Pending Requests" ? pendingCount : k.value}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {k.label === "Pending Requests" ? (pendingCount > 0 ? "Needs action" : "All clear") : k.trend}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Sales Pipeline — Booking Requests */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-coral" />
              <h2 className="text-base font-semibold text-foreground">Sales Pipeline — Booking Requests</h2>
              {pendingCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 glass-accent-coral text-coral rounded-pill animate-pulse-glow">
                  {pendingCount} new
                </span>
              )}
            </div>
          </div>

          {loadingRequests ? (
            <div className="glass-1 rounded-2xl p-8 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading requests...</p>
            </div>
          ) : bookingRequests.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No booking requests yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Requests from unregistered providers will appear here.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {bookingRequests.map((req, i) => (
                <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <GlassCard className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-pill ${statusColor[req.status] || "glass-1 text-muted-foreground"}`}>
                            {req.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Client</p>
                            <p className="text-sm font-semibold text-foreground">{req.client_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground">{req.client_email}</span>
                            </div>
                            {req.client_phone && (
                              <div className="flex items-center gap-2 mt-0.5">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[11px] text-muted-foreground">{req.client_phone}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Requested Provider</p>
                            <p className="text-sm font-semibold text-foreground">{req.provider_name}</p>
                            {req.provider_email && (
                              <div className="flex items-center gap-2 mt-1">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[11px] text-muted-foreground">{req.provider_email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {req.service_description}
                          </span>
                          {req.preferred_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {req.preferred_date} {req.preferred_time}
                            </span>
                          )}
                        </div>
                      </div>
                      {req.status === "pending" && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => updateRequestStatus(req.id, "contacted")}
                            className="px-3 py-2 rounded-xl text-xs font-medium glass-accent-indigo text-indigo-light hover:bg-indigo/20 transition-colors"
                          >
                            Mark Contacted
                          </button>
                          <button
                            onClick={() => updateRequestStatus(req.id, "booked")}
                            className="px-3 py-2 rounded-xl text-xs font-medium glass-accent-teal text-teal hover:bg-teal/20 transition-colors"
                          >
                            Mark Booked
                          </button>
                          <button
                            onClick={() => updateRequestStatus(req.id, "cancelled")}
                            className="px-3 py-2 rounded-xl text-xs font-medium glass-accent-coral text-coral hover:bg-coral/20 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pending verifications */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber" />
                <h2 className="text-base font-semibold text-foreground">Pending Verifications</h2>
                <span className="text-[10px] px-1.5 py-0.5 glass-accent-amber text-amber rounded-pill">
                  {Object.values(approvals).filter(v => !v).length}
                </span>
              </div>
              <button onClick={() => navigate("/admin/providers")} className="text-xs text-indigo">View all</button>
            </div>

            {loadingPending ? (
              <GlassCard className="p-8 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading pending verifications...</p>
              </GlassCard>
            ) : pendingProviders.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <CheckCircle className="w-6 h-6 text-teal mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending verifications</p>
                <p className="text-xs text-muted-foreground mt-1">All providers are verified.</p>
              </GlassCard>
            ) : (
              <div className="space-y-2">
                {pendingProviders.map((p, i) => {
                  const decision = approvals[p.id];
                  return (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                            {(p.full_name || "?").charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{p.full_name || "Unknown"}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-pill glass-1 text-muted-foreground">
                                {p.specialty || "No specialty"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(p.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {decision ? (
                            <span className={`text-[10px] px-2 py-1 rounded-pill ${
                              decision === "approved" ? "glass-accent-teal text-teal" : "glass-accent-coral text-coral"
                            }`}>
                              {decision === "approved" ? "Approved" : "Rejected"}
                            </span>
                          ) : (
                            <div className="flex gap-1.5">
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => approveProvider(p.id)} className="p-2 glass-accent-teal rounded-xl">
                                <CheckCircle className="w-4 h-4 text-teal" />
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => rejectProvider(p.id)} className="p-2 glass-accent-coral rounded-xl">
                                <XCircle className="w-4 h-4 text-coral" />
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right col */}
          <div className="space-y-4">
            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Providers by Vertical</p>
              {verticalStats.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {verticalStats.map(v => (
                    <div key={v.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{v.label}</span>
                        <span className="text-xs font-bold text-foreground">{v.count}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${v.pct}%` }} transition={{ delay: 0.3, duration: 0.8 }}
                          className="h-full rounded-full" style={{ background: v.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Manage Providers", path: "/admin/providers", icon: Briefcase, color: "#6366F1" },
            { label: "View Clients", path: "/admin/clients", icon: Users, color: "#2DD4BF" },
            { label: "Analytics", path: "/admin/analytics", icon: TrendingUp, color: "#FBBF24" },
            { label: "Add Provider", path: "/admin/providers", icon: UserPlus, color: "#A78BFA" },
            { label: "Settings", path: "/admin/settings", icon: AlertTriangle, color: "#FB7185" },
          ].map(a => (
            <GlassCard key={a.label} hover className="p-4 cursor-pointer" onClick={() => navigate(a.path)}>
              <a.icon className="w-5 h-5 mb-2" style={{ color: a.color }} />
              <p className="text-xs font-medium text-foreground">{a.label}</p>
              <ChevronRight className="w-3 h-3 text-muted-foreground mt-1" />
            </GlassCard>
          ))}
        </div>
      </div>
      <AdminNav />
    </div>
  );
}
