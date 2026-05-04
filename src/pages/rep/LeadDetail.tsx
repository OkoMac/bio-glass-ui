import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import RepNav from "@/components/RepNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeaders } from "@/lib/authFetch";
import {
  ArrowLeft, Phone, MessageCircle, Mail, Users as UsersIcon,
  Monitor, Clock, FileText, Save, ExternalLink, ChevronDown,
  Plus, X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

// ── Types ───────────────────────────────────────────────────────────
type Stage =
  | "new" | "contacted" | "demo_scheduled" | "demo_done"
  | "negotiating" | "signed_up" | "active" | "lost";

type ActivityType = "call" | "whatsapp" | "email" | "meeting" | "demo" | "follow_up" | "note";

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  email?: string;
  category: string;
  location?: string;
  suburb?: string;
  city?: string;
  stage: Stage;
  notes?: string;
  next_follow_up?: string;
  last_contacted?: string;
  provider_id?: string;
}

interface Activity {
  id: string;
  type: ActivityType;
  notes: string;
  outcome?: string;
  created_at: string;
}

// ── Stage config ────────────────────────────────────────────────────
const STAGES: { key: Stage; label: string }[] = [
  { key: "new",            label: "New" },
  { key: "contacted",      label: "Contacted" },
  { key: "demo_scheduled", label: "Demo Scheduled" },
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

const ACTIVITY_TYPES: { key: ActivityType; label: string; icon: typeof Phone; color: string }[] = [
  { key: "call",      label: "Call",      icon: Phone,          color: "text-indigo" },
  { key: "whatsapp",  label: "WhatsApp",  icon: MessageCircle,  color: "text-emerald-400" },
  { key: "email",     label: "Email",     icon: Mail,           color: "text-amber" },
  { key: "meeting",   label: "Meeting",   icon: UsersIcon,      color: "text-violet" },
  { key: "demo",      label: "Demo",      icon: Monitor,        color: "text-teal" },
  { key: "follow_up", label: "Follow-up", icon: Clock,          color: "text-coral" },
  { key: "note",      label: "Note",      icon: FileText,       color: "text-muted-foreground" },
];

function activityIcon(type: ActivityType) {
  const cfg = ACTIVITY_TYPES.find(t => t.key === type);
  if (!cfg) return { Icon: FileText, color: "text-muted-foreground" };
  return { Icon: cfg.icon, color: cfg.color };
}

// ── Helpers ─────────────────────────────────────────────────────────
async function authHeaders() {
  try {
    return await getAuthHeaders();
  } catch {
    window.location.href = "/welcome?login=true";
    return { "Content-Type": "application/json", Authorization: "" };
  }
}

// ── Component ───────────────────────────────────────────────────────
export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);

  // Editable fields
  const [notes, setNotes] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [stage, setStage] = useState<Stage>("new");

  // Activity form
  const [actType, setActType] = useState<ActivityType>("call");
  const [actNotes, setActNotes] = useState("");
  const [actOutcome, setActOutcome] = useState("");

  // ── Fetch lead + activities ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers = await authHeaders();
        const [leadRes, actRes] = await Promise.all([
          fetch(`${API}/api/ranger-crm/leads/${id}`, { headers }),
          fetch(`${API}/api/ranger-crm/leads/${id}/activities`, { headers }),
        ]);
        if (leadRes.ok) {
          const data = await leadRes.json();
          if (!cancelled) {
            setLead(data);
            setNotes(data.notes ?? "");
            setNextFollowUp(data.next_follow_up ?? "");
            setStage(data.stage);
          }
        }
        if (actRes.ok) {
          const data = await actRes.json();
          if (!cancelled) setActivities(data);
        }
      } catch {
        // Fallback: try localStorage
        try {
          const all = JSON.parse(localStorage.getItem("bion_crm_leads") ?? "[]") as Lead[];
          const found = all.find(l => l.id === id);
          if (found && !cancelled) {
            setLead(found);
            setNotes(found.notes ?? "");
            setNextFollowUp(found.next_follow_up ?? "");
            setStage(found.stage);
          }
          const acts = JSON.parse(localStorage.getItem(`bion_crm_activities_${id}`) ?? "[]");
          if (!cancelled) setActivities(acts);
        } catch { /* empty */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ── Save lead changes ──────────────────────────────────────────
  async function saveLead() {
    if (!lead) return;
    setSaving(true);
    const updated = { ...lead, notes, next_follow_up: nextFollowUp || null, stage };
    setLead(updated);

    // Update local cache
    try {
      const all = JSON.parse(localStorage.getItem("bion_crm_leads") ?? "[]") as Lead[];
      const idx = all.findIndex(l => l.id === id);
      if (idx >= 0) all[idx] = updated; else all.push(updated);
      localStorage.setItem("bion_crm_leads", JSON.stringify(all));
    } catch { /* empty */ }

    try {
      const headers = await authHeaders();
      await fetch(`${API}/api/ranger-crm/leads/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ notes, next_follow_up: nextFollowUp || null, stage }),
      });
    } catch { /* offline */ }
    setSaving(false);
  }

  // ── Log activity ───────────────────────────────────────────────
  async function logActivity() {
    if (!actNotes.trim()) return;
    const newAct: Activity = {
      id: crypto.randomUUID(),
      type: actType,
      notes: actNotes,
      outcome: actOutcome || undefined,
      created_at: new Date().toISOString(),
    };
    const updated = [newAct, ...activities];
    setActivities(updated);
    localStorage.setItem(`bion_crm_activities_${id}`, JSON.stringify(updated));

    // Update last_contacted
    if (lead) {
      const updatedLead = { ...lead, last_contacted: new Date().toISOString() };
      setLead(updatedLead);
      try {
        const all = JSON.parse(localStorage.getItem("bion_crm_leads") ?? "[]") as Lead[];
        const idx = all.findIndex(l => l.id === id);
        if (idx >= 0) all[idx] = updatedLead;
        localStorage.setItem("bion_crm_leads", JSON.stringify(all));
      } catch { /* empty */ }
    }

    try {
      const headers = await authHeaders();
      await fetch(`${API}/api/ranger-crm/leads/${id}/activities`, {
        method: "POST",
        headers,
        body: JSON.stringify({ type: actType, notes: actNotes, outcome: actOutcome || null }),
      });
    } catch { /* offline */ }

    setActNotes("");
    setActOutcome("");
    setShowActivityForm(false);
  }

  // ── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow">
        <div className="mx-auto max-w-3xl px-4 pt-20 pb-28">
          <GlassCard className="p-8 text-center">
            <p className="text-foreground font-semibold">Lead not found</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/rep/crm")}
              className="mt-4 px-5 py-2 rounded-pill text-sm font-semibold gradient-indigo text-white"
            >
              Back to CRM
            </motion.button>
          </GlassCard>
        </div>
        <RepNav />
      </div>
    );
  }

  const waLink = `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hi ${lead.contact_name}, this is ${user?.full_name ?? "your BION Ranger"}. I'd love to show you how BION can help grow ${lead.business_name}. When would be a good time to chat?`
  )}`;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      <div className="mx-auto max-w-3xl px-4 pt-20 pb-28 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/rep/crm")}
            className="w-9 h-9 rounded-xl glass-1 flex items-center justify-center text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{lead.business_name}</h1>
            <p className="text-xs text-muted-foreground">{lead.contact_name}</p>
          </div>
        </div>

        {/* Contact info card */}
        <GlassCard className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] text-muted-foreground">Phone</p>
              <p className="text-foreground font-medium">{lead.phone}</p>
            </div>
            {lead.email && (
              <div>
                <p className="text-[10px] text-muted-foreground">Email</p>
                <p className="text-foreground font-medium truncate">{lead.email}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-muted-foreground">Category</p>
              <span className="text-[10px] px-2 py-0.5 rounded-pill glass-1 text-foreground font-medium">{lead.category}</span>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Location</p>
              <p className="text-foreground font-medium text-xs">
                {[lead.suburb, lead.city, lead.location].filter(Boolean).join(", ") || "—"}
              </p>
            </div>
          </div>

          {/* Quick contact buttons */}
          <div className="flex gap-2 pt-2 border-t border-white/5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open(waLink, "_blank")}
              className="flex-1 py-2.5 rounded-pill text-xs font-semibold bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Send WhatsApp
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open(`tel:${lead.phone}`, "_self")}
              className="flex-1 py-2.5 rounded-pill text-xs font-semibold bg-indigo-500/20 text-indigo flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" /> Call
            </motion.button>
            {lead.email && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open(`mailto:${lead.email}`, "_self")}
                className="flex-1 py-2.5 rounded-pill text-xs font-semibold bg-amber-500/20 text-amber flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </motion.button>
            )}
          </div>
        </GlassCard>

        {/* Stage selector */}
        <GlassCard className="p-4">
          <p className="text-[10px] text-muted-foreground mb-2">Pipeline Stage</p>
          <div className="flex gap-1.5 flex-wrap">
            {STAGES.map(s => (
              <motion.button
                key={s.key}
                whileTap={{ scale: 0.9 }}
                onClick={() => setStage(s.key)}
                className={`text-[10px] px-2.5 py-1 rounded-pill font-medium transition-all ${
                  stage === s.key
                    ? stageBadge[s.key] + " ring-1 ring-white/20"
                    : "glass-1 text-muted-foreground"
                }`}
              >
                {s.label}
              </motion.button>
            ))}
          </div>
        </GlassCard>

        {/* Notes + Follow-up */}
        <GlassCard className="p-4 space-y-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this lead..."
              className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 resize-none"
            />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Next Follow-up</p>
            <input
              type="date"
              value={nextFollowUp ? nextFollowUp.slice(0, 10) : ""}
              onChange={e => setNextFollowUp(e.target.value)}
              className="glass-1 rounded-xl px-3 py-2 text-sm text-foreground outline-none border border-white/5 bg-transparent w-full"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={saveLead}
            disabled={saving}
            className="w-full py-2.5 rounded-pill text-sm font-semibold gradient-teal text-white flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </motion.button>
        </GlassCard>

        {/* Provider link */}
        {lead.provider_id && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/provider/${lead.provider_id}`)}
            className="w-full py-2.5 rounded-pill text-sm font-semibold glass-1 text-teal flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" /> View BION Profile
          </motion.button>
        )}

        {/* Activity timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Activity Timeline</h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowActivityForm(f => !f)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-semibold gradient-indigo text-white"
            >
              <Plus className="w-3 h-3" /> Log Activity
            </motion.button>
          </div>

          {/* Log Activity form */}
          <AnimatePresence>
            {showActivityForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <GlassCard variant="glass-2" className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">Log Activity</p>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowActivityForm(false)}>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  </div>

                  {/* Type selector */}
                  <div className="flex gap-1.5 flex-wrap">
                    {ACTIVITY_TYPES.map(t => (
                      <motion.button
                        key={t.key}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActType(t.key)}
                        className={`text-[10px] px-2.5 py-1 rounded-pill font-medium flex items-center gap-1 ${
                          actType === t.key
                            ? "ring-1 ring-white/20 glass-1 " + t.color
                            : "glass-1 text-muted-foreground"
                        }`}
                      >
                        <t.icon className="w-3 h-3" />
                        {t.label}
                      </motion.button>
                    ))}
                  </div>

                  <textarea
                    value={actNotes}
                    onChange={e => setActNotes(e.target.value)}
                    rows={2}
                    placeholder="What happened?"
                    className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 resize-none"
                  />

                  <input
                    value={actOutcome}
                    onChange={e => setActOutcome(e.target.value)}
                    placeholder="Outcome (optional)"
                    className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
                  />

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={logActivity}
                    className="w-full py-2.5 rounded-pill text-sm font-semibold gradient-indigo text-white"
                  >
                    Save Activity
                  </motion.button>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timeline */}
          {activities.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No activities logged yet</p>
            </GlassCard>
          ) : (
            <div className="relative pl-6 space-y-3">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />

              {activities.map((act, i) => {
                const { Icon, color } = activityIcon(act.type);
                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative"
                  >
                    {/* Dot */}
                    <div className={`absolute -left-6 top-1 w-[22px] h-[22px] rounded-full glass-1 flex items-center justify-center`}>
                      <Icon className={`w-3 h-3 ${color}`} />
                    </div>

                    <GlassCard className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-semibold ${color}`}>
                          {ACTIVITY_TYPES.find(t => t.key === act.type)?.label ?? act.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(act.created_at).toLocaleDateString("en-ZA", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground">{act.notes}</p>
                      {act.outcome && (
                        <p className="text-[10px] text-teal mt-1">Outcome: {act.outcome}</p>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <RepNav />
    </div>
  );
}
