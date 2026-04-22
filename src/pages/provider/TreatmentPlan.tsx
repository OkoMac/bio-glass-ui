import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, ClipboardList, Pill, Dumbbell,
  Apple, Brain, Sparkles, Loader2, ChevronDown, ChevronUp,
  Calendar, X, Check,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type PlanItem = {
  type: "exercise" | "medication" | "diet" | "therapy" | "custom";
  instruction: string;
  frequency: string;
  duration: string;
  notes: string;
};

type Plan = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  review_date: string | null;
  created_at: string;
  client: { id: string; full_name: string; avatar_url: string | null } | null;
  items: {
    id: string; type: string; instruction: string;
    frequency: string | null; duration: string | null; notes: string | null;
  }[];
};

const ITEM_TYPES = [
  { value: "exercise", label: "Exercise", icon: Dumbbell, color: "text-teal" },
  { value: "medication", label: "Medication", icon: Pill, color: "text-coral" },
  { value: "diet", label: "Diet", icon: Apple, color: "text-amber" },
  { value: "therapy", label: "Therapy", icon: Brain, color: "text-violet" },
  { value: "custom", label: "Custom", icon: Sparkles, color: "text-indigo" },
] as const;

const emptyItem: PlanItem = { type: "exercise", instruction: "", frequency: "daily", duration: "", notes: "" };

export default function TreatmentPlan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<{ id: string; full_name: string; avatar_url: string | null }[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [items, setItems] = useState<PlanItem[]>([{ ...emptyItem }]);

  // Load clients (from provider's bookings)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) return;

      // Get unique clients from bookings
      const { data: bookings } = await supabase
        .from("bookings" as any)
        .select("client_id, client:profiles!bookings_client_id_fkey(id, full_name, avatar_url)")
        .eq("provider_id", profile.id)
        .limit(200);

      if (bookings) {
        const seen = new Set<string>();
        const uniqueClients: any[] = [];
        for (const b of bookings as any[]) {
          if (b.client?.id && !seen.has(b.client.id)) {
            seen.add(b.client.id);
            uniqueClients.push(b.client);
          }
        }
        setClients(uniqueClients);
        if (uniqueClients.length > 0 && !selectedClient) {
          setSelectedClient(uniqueClients[0].id);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load plans for selected client
  useEffect(() => {
    if (!selectedClient || !user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`${API}/api/treatment-plans?clientId=${selectedClient}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (!cancelled && json.ok) setPlans(json.data ?? []);
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedClient, user]);

  const addItem = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, key: keyof PlanItem, value: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item));
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (items.some(it => !it.instruction.trim())) { toast.error("All items need instructions"); return; }
    if (!selectedClient) { toast.error("Select a client"); return; }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API}/api/treatment-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clientId: selectedClient,
          title: title.trim(),
          description: description.trim() || undefined,
          items,
          startDate,
          endDate: endDate || undefined,
          reviewDate: reviewDate || undefined,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Treatment plan created");
        setShowCreate(false);
        setTitle(""); setDescription(""); setItems([{ ...emptyItem }]);
        // Reload plans
        const plansRes = await fetch(`${API}/api/treatment-plans?clientId=${selectedClient}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const plansJson = await plansRes.json();
        if (plansJson.ok) setPlans(plansJson.data ?? []);
      } else {
        toast.error(json.error ?? "Failed to create plan");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Error creating plan");
    } finally {
      setCreating(false);
    }
  };

  const updatePlanStatus = async (planId: string, status: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`${API}/api/treatment-plans/${planId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      });
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, status } : p));
      toast.success(`Plan marked as ${status}`);
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const typeIcon = (type: string) => {
    const t = ITEM_TYPES.find(it => it.value === type);
    if (!t) return <Sparkles className="w-4 h-4 text-indigo" />;
    const Icon = t.icon;
    return <Icon className={`w-4 h-4 ${t.color}`} />;
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-12 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Treatment Plans</h1>
          </div>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-2 px-4 py-2 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground"
          >
            <Plus className="w-4 h-4" /> New Plan
          </button>
        </div>

        {/* Client selector */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Client</p>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c.id)}
                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-pill text-xs font-medium transition-colors ${
                  selectedClient === c.id ? "gradient-indigo text-white" : "glass-1 text-foreground"
                }`}
              >
                {c.avatar_url ? (
                  <img src={c.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo/20 flex items-center justify-center text-[9px] font-bold text-indigo">
                    {c.full_name?.charAt(0) ?? "?"}
                  </div>
                )}
                {c.full_name}
              </button>
            ))}
            {clients.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No clients yet — they appear after their first booking.</p>
            )}
          </div>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <GlassCard className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Create Treatment Plan</h3>
                  <button onClick={() => setShowCreate(false)} className="w-7 h-7 glass-1 rounded-full flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Plan title (e.g. Knee Rehab Program)"
                  className="w-full px-4 py-3 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40"
                />
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-4 py-3 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-indigo/40 resize-none"
                />

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Start Date</p>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground outline-none border border-white/[0.08] focus:border-indigo/40" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">End Date</p>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground outline-none border border-white/[0.08] focus:border-indigo/40" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Review Date</p>
                    <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)}
                      className="w-full px-3 py-2 glass-1 rounded-xl text-xs text-foreground outline-none border border-white/[0.08] focus:border-indigo/40" />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Plan Items</p>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="glass-1 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5 flex-wrap flex-1">
                            {ITEM_TYPES.map(t => (
                              <button key={t.value} onClick={() => updateItem(idx, "type", t.value)}
                                className={`px-2 py-1 rounded-pill text-[10px] font-medium transition-colors ${
                                  item.type === t.value ? "gradient-indigo text-white" : "glass-2 text-muted-foreground"
                                }`}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                          {items.length > 1 && (
                            <button onClick={() => removeItem(idx)} className="w-6 h-6 rounded-full glass-2 flex items-center justify-center">
                              <Trash2 className="w-3 h-3 text-coral" />
                            </button>
                          )}
                        </div>
                        <input
                          value={item.instruction}
                          onChange={e => updateItem(idx, "instruction", e.target.value)}
                          placeholder="Instruction (e.g. 30 min walk, 2x Ibuprofen)"
                          className="w-full px-3 py-2 glass-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={item.frequency}
                            onChange={e => updateItem(idx, "frequency", e.target.value)}
                            className="px-3 py-2 glass-2 rounded-lg text-xs text-foreground outline-none"
                          >
                            <option value="daily">Daily</option>
                            <option value="twice_daily">Twice Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="as_needed">As Needed</option>
                          </select>
                          <input
                            value={item.duration}
                            onChange={e => updateItem(idx, "duration", e.target.value)}
                            placeholder="Duration (e.g. 2 weeks)"
                            className="px-3 py-2 glass-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none"
                          />
                        </div>
                        <input
                          value={item.notes}
                          onChange={e => updateItem(idx, "notes", e.target.value)}
                          placeholder="Notes (optional)"
                          className="w-full px-3 py-2 glass-2 rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={addItem} className="mt-2 flex items-center gap-1.5 text-xs text-indigo font-medium">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full py-3 gradient-indigo rounded-pill text-sm font-semibold text-primary-foreground"
                >
                  {creating ? "Creating..." : "Create Treatment Plan"}
                </button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plans list */}
        {loading ? (
          <GlassCard className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-indigo animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading plans...</p>
          </GlassCard>
        ) : plans.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No treatment plans for this client yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Create one to guide their care journey.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => {
              const isExpanded = expandedPlan === plan.id;
              return (
                <GlassCard key={plan.id} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo/20 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5 text-indigo" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{plan.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {plan.items.length} items · Started {new Date(plan.start_date).toLocaleDateString("en-ZA")}
                      </p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-pill ${
                      plan.status === "active" ? "glass-accent-teal text-teal" :
                      plan.status === "paused" ? "glass-accent-amber text-amber" :
                      "glass-1 text-muted-foreground"
                    }`}>
                      {plan.status}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3">
                          {plan.description && (
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          )}

                          <div className="flex gap-4 text-[10px] text-muted-foreground">
                            {plan.end_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ends {new Date(plan.end_date).toLocaleDateString("en-ZA")}</span>}
                            {plan.review_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Review {new Date(plan.review_date).toLocaleDateString("en-ZA")}</span>}
                          </div>

                          <div className="space-y-2">
                            {plan.items.map((item, i) => (
                              <div key={item.id} className="glass-2 rounded-xl p-3 flex items-start gap-3">
                                {typeIcon(item.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground">{item.instruction}</p>
                                  <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                                    {item.frequency && <span>{item.frequency}</span>}
                                    {item.duration && <span>{item.duration}</span>}
                                  </div>
                                  {item.notes && <p className="text-[10px] text-muted-foreground mt-1">{item.notes}</p>}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-2">
                            {plan.status === "active" && (
                              <>
                                <button onClick={() => updatePlanStatus(plan.id, "paused")}
                                  className="flex-1 py-2 glass-1 rounded-pill text-xs font-medium text-amber">
                                  Pause
                                </button>
                                <button onClick={() => updatePlanStatus(plan.id, "completed")}
                                  className="flex-1 py-2 glass-1 rounded-pill text-xs font-medium text-teal">
                                  Mark Complete
                                </button>
                              </>
                            )}
                            {plan.status === "paused" && (
                              <button onClick={() => updatePlanStatus(plan.id, "active")}
                                className="flex-1 py-2 glass-1 rounded-pill text-xs font-medium text-indigo">
                                Resume
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
      <ProviderNav />
    </div>
  );
}
