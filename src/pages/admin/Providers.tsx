import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import {
  Search, CheckCircle, XCircle, AlertTriangle, Star,
  Filter, ChevronRight, Eye, MessageSquare, Pause, Play,
} from "lucide-react";

import provider1 from "@/assets/provider-1.jpg";
import provider2 from "@/assets/provider-2.jpg";
import provider3 from "@/assets/provider-3.jpg";
import provider4 from "@/assets/provider-4.jpg";

type ProviderStatus = "active" | "pending" | "suspended" | "rejected";

interface AdminProvider {
  id: string;
  name: string;
  image: string;
  vertical: string;
  location: string;
  rating: number;
  sessions: number;
  revenue: string;
  joined: string;
  status: ProviderStatus;
  verified: boolean;
  flagCount: number;
}

const PROVIDERS: AdminProvider[] = [
  { id: "p1", name: "Lisa Dlamini",       image: provider1, vertical: "Fitness",     location: "Sandton",    rating: 4.9, sessions: 1847, revenue: "R83,115", joined: "Jan 2025", status: "active",    verified: true,  flagCount: 0 },
  { id: "p2", name: "Dr. Kagiso Sithole", image: provider2, vertical: "Medical",     location: "Rosebank",   rating: 4.8, sessions: 2341, revenue: "R140,460", joined: "Nov 2024", status: "active",    verified: true,  flagCount: 0 },
  { id: "p3", name: "Sarah Chen",         image: provider3, vertical: "Beauty",      location: "Parkhurst",  rating: 4.8, sessions: 3102, revenue: "R186,120", joined: "Sep 2024", status: "active",    verified: true,  flagCount: 1 },
  { id: "p4", name: "Amir Patel",         image: provider4, vertical: "Wellness",    location: "Midrand",    rating: 4.7, sessions: 4520, revenue: "R180,800", joined: "Aug 2024", status: "active",    verified: true,  flagCount: 0 },
  { id: "p5", name: "Dr. Zanele Dlamini", image: provider1, vertical: "Medical",     location: "Soweto",     rating: 0,   sessions: 0,    revenue: "R0",       joined: "Feb 2026", status: "pending",   verified: false, flagCount: 0 },
  { id: "p6", name: "Kagiso Sithole Jr.", image: provider2, vertical: "Fitness",     location: "Pretoria",   rating: 0,   sessions: 0,    revenue: "R0",       joined: "Jan 2026", status: "pending",   verified: false, flagCount: 0 },
  { id: "p7", name: "Thabo Mokoena",      image: provider3, vertical: "Professional", location: "Centurion", rating: 3.2, sessions: 45,   revenue: "R12,500",  joined: "Dec 2024", status: "suspended", verified: true,  flagCount: 3 },
];

const STATUS_META: Record<ProviderStatus, { label: string; cls: string }> = {
  active:    { label: "Active",    cls: "glass-accent-teal text-teal"   },
  pending:   { label: "Pending",   cls: "glass-accent-amber text-amber" },
  suspended: { label: "Suspended", cls: "glass-accent-coral text-coral" },
  rejected:  { label: "Rejected",  cls: "glass-1 text-muted-foreground" },
};

const VERTICALS = ["All", "Fitness", "Medical", "Beauty", "Wellness", "Professional"];
const STATUSES: ("all" | ProviderStatus)[] = ["all", "active", "pending", "suspended"];

export default function AdminProviders() {
  const [providers, setProviders] = useState<AdminProvider[]>(PROVIDERS);
  const [query, setQuery]         = useState("");
  const [vertical, setVertical]   = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | ProviderStatus>("all");
  const [selected, setSelected]   = useState<AdminProvider | null>(null);

  const filtered = providers.filter(p => {
    const matchName = p.name.toLowerCase().includes(query.toLowerCase());
    const matchVert = vertical === "All" || p.vertical === vertical;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchName && matchVert && matchStatus;
  });

  const updateStatus = (id: string, status: ProviderStatus) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-4xl px-4 pt-16 pb-10 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Providers</h1>
            <p className="text-xs text-muted-foreground">
              {providers.filter(p => p.status === "active").length} active · {providers.filter(p => p.status === "pending").length} pending review
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search providers…"
            className="w-full h-10 glass-1 rounded-pill pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium capitalize whitespace-nowrap transition-all ${
                  statusFilter === s ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                }`}>
                {s === "all" ? "All statuses" : s}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {VERTICALS.map(v => (
              <button key={v} onClick={() => setVertical(v)}
                className={`px-3 py-1 rounded-pill text-[10px] font-medium whitespace-nowrap transition-all ${
                  vertical === v ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                }`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Provider list */}
        <div className="space-y-2">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlassCard hover className="p-4 cursor-pointer" onClick={() => setSelected(p)}>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                    {p.verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full glass-accent-teal flex items-center justify-center">
                        <CheckCircle className="w-2.5 h-2.5 text-teal" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      {p.flagCount > 0 && <AlertTriangle className="w-3 h-3 text-coral" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{p.vertical} · {p.location}</p>
                    {p.rating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-2.5 h-2.5 text-amber fill-amber" />
                        <span className="text-[10px] text-muted-foreground">{p.rating} · {p.sessions} sessions · {p.revenue}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-pill ${STATUS_META[p.status].cls}`}>
                      {STATUS_META[p.status].label}
                    </span>
                    <p className="text-[10px] text-muted-foreground">Since {p.joined}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Provider detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 bg-obsidian/70 z-50" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden pb-safe"
              style={{ background: "rgba(14,14,22,0.97)", backdropFilter: "blur(60px)", maxHeight: "90vh" }}
            >
              <div className="overflow-y-auto" style={{ maxHeight: "90vh" }}>
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>
                <div className="px-5 pb-8 space-y-5">
                  {/* Identity */}
                  <div className="flex items-center gap-4 pt-2">
                    <img src={selected.image} alt={selected.name} className="w-16 h-16 rounded-2xl object-cover" />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
                      <p className="text-xs text-muted-foreground">{selected.vertical} · {selected.location}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-pill ${STATUS_META[selected.status].cls}`}>
                          {STATUS_META[selected.status].label}
                        </span>
                        {selected.verified && (
                          <span className="text-[10px] px-2 py-0.5 rounded-pill glass-accent-teal text-teal">Verified</span>
                        )}
                        {selected.flagCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-pill glass-accent-coral text-coral">{selected.flagCount} flags</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Rating",   value: selected.rating > 0 ? String(selected.rating) : "—" },
                      { label: "Sessions", value: selected.sessions > 0 ? String(selected.sessions) : "—" },
                      { label: "Revenue",  value: selected.revenue },
                    ].map(s => (
                      <GlassCard key={s.label} className="p-3 text-center">
                        <p className="text-sm font-bold font-data text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                      </GlassCard>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {selected.status === "pending" && (
                      <div className="flex gap-2">
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => updateStatus(selected.id, "active")}
                          className="flex-1 py-3 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => updateStatus(selected.id, "rejected")}
                          className="flex-1 py-3 glass-accent-coral rounded-pill text-sm font-medium text-coral flex items-center justify-center gap-2">
                          <XCircle className="w-4 h-4" /> Reject
                        </motion.button>
                      </div>
                    )}
                    {selected.status === "active" && (
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => updateStatus(selected.id, "suspended")}
                        className="w-full py-3 glass-accent-coral rounded-pill text-sm font-medium text-coral flex items-center justify-center gap-2">
                        <Pause className="w-4 h-4" /> Suspend Provider
                      </motion.button>
                    )}
                    {selected.status === "suspended" && (
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => updateStatus(selected.id, "active")}
                        className="w-full py-3 glass-accent-teal rounded-pill text-sm font-medium text-teal flex items-center justify-center gap-2">
                        <Play className="w-4 h-4" /> Reinstate Provider
                      </motion.button>
                    )}
                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 glass-1 rounded-pill text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> View profile
                      </button>
                      <button className="flex-1 py-2.5 glass-1 rounded-pill text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Contact
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AdminNav />
    </div>
  );
}
