import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import NudgePopup from "@/components/NudgePopup";
import GlassCard from "@/components/GlassCard";
import RepNav from "@/components/RepNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeaders } from "@/lib/authFetch";
import {
  Search, Plus, Phone, MessageCircle, FileText, ChevronRight,
  ArrowLeft, Filter, Users, Sparkles, X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

// ── Types ───────────────────────────────────────────────────────────
type Stage =
  | "new" | "contacted" | "demo_scheduled" | "demo_done"
  | "negotiating" | "signed_up" | "active" | "lost";

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  email?: string;
  category: string;
  city?: string;
  stage: Stage;
  last_contacted?: string;
  next_follow_up?: string;
  notes?: string;
}

// ── Stage config ────────────────────────────────────────────────────
const STAGES: { key: Stage; label: string }[] = [
  { key: "new",            label: "New" },
  { key: "contacted",      label: "Contacted" },
  { key: "demo_scheduled", label: "Demo Sched." },
  { key: "demo_done",      label: "Demo Done" },
  { key: "negotiating",    label: "Negotiating" },
  { key: "signed_up",      label: "Signed Up" },
  { key: "active",         label: "Active" },
  { key: "lost",           label: "Lost" },
];

const stageBadge: Record<Stage, string> = {
  new:            "glass-1 text-muted-foreground",
  contacted:      "bg-indigo-500/20 text-indigo",
  demo_scheduled: "bg-amber-500/20 text-amber",
  demo_done:      "bg-violet-500/20 text-violet",
  negotiating:    "bg-blue-500/20 text-blue-400",
  signed_up:      "bg-teal-500/20 text-teal",
  active:         "bg-emerald-500/20 text-emerald-400",
  lost:           "bg-red-500/20 text-coral",
};

const CATEGORIES = ["Medical", "Beauty", "Fitness", "Wellness", "Veterinary"];

// ── Helpers ─────────────────────────────────────────────────────────
async function authHeaders() {
  try {
    return await getAuthHeaders();
  } catch {
    window.location.href = "/welcome?login=true";
    return { "Content-Type": "application/json", Authorization: "" };
  }
}

function relativeDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function followUpIndicator(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { label: "Overdue", cls: "text-coral" };
  if (diff === 0) return { label: "Today", cls: "text-amber" };
  if (diff === 1) return { label: "Tomorrow", cls: "text-teal" };
  return { label: d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" }), cls: "text-muted-foreground" };
}

// ── Component ───────────────────────────────────────────────────────
export default function CRM() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch leads ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch(`${API}/api/ranger-crm/leads`, { headers });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (!cancelled) setLeads(data);
      } catch {
        // Fallback: load from localStorage for offline / dev
        try {
          const raw = localStorage.getItem("bion_crm_leads");
          if (raw && !cancelled) setLeads(JSON.parse(raw));
        } catch { /* empty */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist locally for offline
  useEffect(() => {
    if (leads.length) localStorage.setItem("bion_crm_leads", JSON.stringify(leads));
  }, [leads]);

  // ── Derived data ───────────────────────────────────────────────
  const cities = useMemo(() => {
    const set = new Set(leads.map(l => l.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    let list = leads;
    if (stageFilter !== "all") list = list.filter(l => l.stage === stageFilter);
    if (categoryFilter !== "all") list = list.filter(l => l.category === categoryFilter);
    if (cityFilter !== "all") list = list.filter(l => l.city === cityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.business_name.toLowerCase().includes(q) ||
        l.contact_name.toLowerCase().includes(q) ||
        l.phone.includes(q)
      );
    }
    return list;
  }, [leads, stageFilter, categoryFilter, cityFilter, search]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STAGES) counts[s.key] = leads.filter(l => l.stage === s.key).length;
    return counts;
  }, [leads]);

  // ── Quick actions ──────────────────────────────────────────────
  async function changeStage(id: string, stage: Stage) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API}/api/ranger-crm/leads/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) {
        toast.error("Failed to update stage");
        setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: l.stage } : l)); // revert
      }
    } catch {
      toast.error("Offline — change saved locally");
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow relative">
      {/* Layer 4 nudge — Ranger pipeline education on first CRM visit */}
      <NudgePopup featureKey="ranger_pipeline" />
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded…" aria-label="navigate(-1)} className='absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded…">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-3xl px-4 pt-20 pb-28 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">CRM Pipeline</h1>
            <p className="text-xs text-muted-foreground">
              {leads.length} lead{leads.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/rep/crm/suggested")}
              className="w-9 h-9 rounded-xl glass-1 flex items-center justify-center text-amber"
              title="Suggested Leads"
            >
              <Sparkles className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/rep/providers")}
              className="w-9 h-9 rounded-xl glass-1 flex items-center justify-center text-teal"
              title="Signed-up Providers"
            >
              <Users className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Pipeline summary cards */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {STAGES.map(s => (
            <motion.button
              key={s.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStageFilter(f => f === s.key ? "all" : s.key)}
              className={`shrink-0 px-3 py-2 rounded-xl text-center min-w-[80px] transition-all ${
                stageFilter === s.key
                  ? "ring-1 ring-white/20 " + stageBadge[s.key]
                  : "glass-1"
              }`}
            >
              <p className={`text-lg font-bold font-data ${stageFilter === s.key ? "" : "text-foreground"}`}>
                {stageCounts[s.key] ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground whitespace-nowrap">{s.label}</p>
            </motion.button>
          ))}
        </div>

        {/* Search + filter toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-full glass-1 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilters(f => !f)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              showFilters ? "gradient-indigo text-white" : "glass-1 text-muted-foreground"
            }`}
          >
            <Filter className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Filter bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="glass-1 rounded-xl px-3 py-2 text-xs text-foreground outline-none border border-white/5 bg-transparent"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  className="glass-1 rounded-xl px-3 py-2 text-xs text-foreground outline-none border border-white/5 bg-transparent"
                >
                  <option value="all">All Cities</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {(categoryFilter !== "all" || cityFilter !== "all" || stageFilter !== "all") && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setStageFilter("all"); setCategoryFilter("all"); setCityFilter("all"); }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-coral glass-1"
                  >
                    <X className="w-3 h-3" /> Clear
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lead list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-indigo border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-8 text-center">
              <Users className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
              <h2 className="text-base font-semibold text-foreground mb-1">
                {search || stageFilter !== "all" ? "No leads match" : "No leads yet"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {search || stageFilter !== "all"
                  ? "Try different filters or search terms."
                  : "Tap the + button to add your first lead."}
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead, i) => {
              const fu = followUpIndicator(lead.next_follow_up);
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <GlassCard hover className="p-4" onClick={() => navigate(`/rep/crm/${lead.id}`)}>
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo text-sm font-bold shrink-0">
                        {lead.business_name[0]}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{lead.business_name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-pill font-medium shrink-0 ${stageBadge[lead.stage]}`}>
                            {STAGES.find(s => s.key === lead.stage)?.label ?? lead.stage}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{lead.contact_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded glass-1 text-muted-foreground">{lead.category}</span>
                          {lead.city && (
                            <span className="text-[10px] text-muted-foreground">{lead.city}</span>
                          )}
                        </div>

                        {/* Bottom row */}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              Last: {relativeDate(lead.last_contacted)}
                            </span>
                            {fu && (
                              <span className={`text-[10px] ml-2 font-medium ${fu.cls}`}>
                                Follow-up: {fu.label}
                              </span>
                            )}
                          </div>

                          {/* Quick actions */}
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={e => { e.stopPropagation(); window.open(`https://wa.me/${lead.phone.replace(/\D/g, "")}`, "_blank"); }}
                              className="w-7 h-7 rounded-lg glass-1 flex items-center justify-center"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={e => { e.stopPropagation(); window.open(`tel:${lead.phone}`, "_self"); }}
                              className="w-7 h-7 rounded-lg glass-1 flex items-center justify-center"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5 text-indigo" />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={e => { e.stopPropagation(); navigate(`/rep/crm/${lead.id}`); }}
                              className="w-7 h-7 rounded-lg glass-1 flex items-center justify-center"
                              title="Details"
                            >
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Add Lead button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => navigate("/rep/crm/add")}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full gradient-indigo shadow-cta flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      <RepNav />
    </div>
  );
}
