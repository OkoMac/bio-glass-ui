import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Briefcase, TrendingUp, AlertTriangle,
  CheckCircle, Clock, XCircle, ChevronRight, ShieldCheck,
  Mail, Phone, Calendar, FileText, UserPlus,
} from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";

const pendingVerifications = [
  { id: "pv1", name: "Dr. Zanele Dlamini", vertical: "Medical", submitted: "1 Feb", image: provider1, docs: 3 },
  { id: "pv2", name: "Kagiso Sithole", vertical: "Fitness", submitted: "28 Jan", image: provider2, docs: 2 },
  { id: "pv3", name: "Aisha Patel", vertical: "Beauty", submitted: "25 Jan", image: provider3, docs: 4 },
];

const kpis = [
  { label: "Total Providers", value: "284", trend: "+12 this week", icon: Briefcase, color: "#6366F1" },
  { label: "Active Clients", value: "4,810", trend: "+138 this week", icon: Users, color: "#2DD4BF" },
  { label: "Bookings (MTD)", value: "12,340", trend: "+22%", icon: TrendingUp, color: "#FBBF24" },
  { label: "Pending Requests", value: "—", trend: "Loading...", icon: AlertTriangle, color: "#FB7185" },
];

const verticalStats = [
  { label: "Fitness", count: 112, pct: 100, color: "#2DD4BF" },
  { label: "Medical", count: 68, pct: 61, color: "#6366F1" },
  { label: "Beauty", count: 54, pct: 48, color: "#FB7185" },
  { label: "Professional", count: 32, pct: 29, color: "#FBBF24" },
  { label: "Wellness", count: 18, pct: 16, color: "#A78BFA" },
];

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<Record<string, "approved" | "rejected" | null>>(
    Object.fromEntries(pendingVerifications.map(p => [p.id, null]))
  );
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    loadBookingRequests();
  }, []);

  const loadBookingRequests = async () => {
    const { data } = await supabase
      .from("booking_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10) as { data: BookingRequest[] | null };
    setBookingRequests(data ?? []);
    setLoadingRequests(false);
  };

  const updateRequestStatus = async (id: string, status: string) => {
    await supabase.from("booking_requests").update({ status } as any).eq("id", id);
    setBookingRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const pendingCount = bookingRequests.filter(r => r.status === "pending").length;

  const verticalColor: Record<string, string> = {
    Medical: "text-indigo glass-accent-indigo",
    Fitness: "text-teal glass-accent-teal",
    Beauty: "text-coral glass-accent-coral",
    Wellness: "text-violet glass-accent-indigo",
  };

  const statusColor: Record<string, string> = {
    pending: "glass-accent-amber text-amber",
    contacted: "glass-accent-indigo text-indigo-light",
    booked: "glass-accent-teal text-teal",
    cancelled: "glass-accent-coral text-coral",
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-16 pb-10 md:pt-8 space-y-6">
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
              <button onClick={() => navigate("/admin/providers")} className="text-xs text-indigo">View all →</button>
            </div>
            <div className="space-y-2">
              {pendingVerifications.map((p, i) => {
                const decision = approvals[p.id];
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <GlassCard className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-pill ${verticalColor[p.vertical] || "glass-1 text-muted-foreground"}`}>
                              {p.vertical}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{p.docs} docs · {p.submitted}</span>
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
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setApprovals(a => ({ ...a, [p.id]: "approved" }))} className="p-2 glass-accent-teal rounded-xl">
                              <CheckCircle className="w-4 h-4 text-teal" />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setApprovals(a => ({ ...a, [p.id]: "rejected" }))} className="p-2 glass-accent-coral rounded-xl">
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
          </div>

          {/* Right col */}
          <div className="space-y-4">
            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Providers by Vertical</p>
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
