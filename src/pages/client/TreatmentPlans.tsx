import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, ClipboardList, Pill, Dumbbell, Apple, Brain,
  Sparkles, Loader2, ChevronDown, ChevronUp, Calendar,
  CheckCircle, Circle, TrendingUp,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type PlanItem = {
  id: string; type: string; instruction: string;
  frequency: string | null; duration: string | null; notes: string | null;
};

type Plan = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  review_date: string | null;
  provider: { id: string; full_name: string; avatar_url: string | null; specialty: string | null } | null;
  items: PlanItem[];
};

const ITEM_ICONS: Record<string, { icon: typeof Dumbbell; color: string }> = {
  exercise: { icon: Dumbbell, color: "text-teal" },
  medication: { icon: Pill, color: "text-coral" },
  diet: { icon: Apple, color: "text-amber" },
  therapy: { icon: Brain, color: "text-violet" },
  custom: { icon: Sparkles, color: "text-indigo" },
};

export default function ClientTreatmentPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [todayCheckins, setTodayCheckins] = useState<Set<string>>(new Set()); // item IDs checked today
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`${API}/api/treatment-plans/my`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.ok) {
          setPlans(json.data ?? []);
          const checkedItems = new Set<string>();
          (json.todayCheckins ?? []).forEach((c: any) => checkedItems.add(c.item_id));
          setTodayCheckins(checkedItems);
          // Auto-expand first plan
          if (json.data?.length > 0) setExpandedPlan(json.data[0].id);
        }
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const handleCheckIn = async (planId: string, itemId: string) => {
    setCheckingIn(itemId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API}/api/treatment-plans/${planId}/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ itemId }),
      });
      const json = await res.json();
      if (json.ok) {
        setTodayCheckins(prev => {
          const next = new Set(prev);
          if (json.data.checked) {
            next.add(itemId);
            toast.success("Checked in!");
          } else {
            next.delete(itemId);
          }
          return next;
        });
      }
    } catch {
      toast.error("Could not check in");
    } finally {
      setCheckingIn(null);
    }
  };

  const getProgress = (plan: Plan) => {
    if (plan.items.length === 0) return 0;
    const checked = plan.items.filter(it => todayCheckins.has(it.id)).length;
    return Math.round((checked / plan.items.length) * 100);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-24">
      <div className="w-full px-4 md:px-8 xl:px-12 pt-20 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">My Treatment Plans</h1>
        </div>

        {loading ? (
          <GlassCard className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-indigo animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading your plans...</p>
          </GlassCard>
        ) : plans.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No treatment plans yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Your provider will create one during your consultation.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {plans.map(plan => {
              const isExpanded = expandedPlan === plan.id;
              const progress = getProgress(plan);
              const iconData = ITEM_ICONS;

              return (
                <GlassCard key={plan.id} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo/20 flex items-center justify-center shrink-0 relative">
                      <ClipboardList className="w-6 h-6 text-indigo" />
                      {progress > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal flex items-center justify-center">
                          <span className="text-[8px] font-bold text-obsidian">{progress}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{plan.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        by {plan.provider?.full_name ?? "Provider"} · {plan.items.length} items
                      </p>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full mt-2">
                        <div
                          className="h-full bg-teal rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
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
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Started {new Date(plan.start_date).toLocaleDateString("en-ZA")}
                            </span>
                            {plan.review_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Review {new Date(plan.review_date).toLocaleDateString("en-ZA")}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Daily Checklist</p>

                          <div className="space-y-2">
                            {plan.items.map(item => {
                              const checked = todayCheckins.has(item.id);
                              const isLoading = checkingIn === item.id;
                              const iconInfo = iconData[item.type] ?? iconData.custom;
                              const Icon = iconInfo.icon;

                              return (
                                <motion.button
                                  key={item.id}
                                  onClick={() => handleCheckIn(plan.id, item.id)}
                                  disabled={isLoading}
                                  whileTap={{ scale: 0.97 }}
                                  className={`w-full rounded-xl p-3 flex items-center gap-3 text-left transition-all border ${
                                    checked
                                      ? "bg-teal/10 border-teal/30"
                                      : "glass-2 border-white/[0.06]"
                                  }`}
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-5 h-5 text-indigo animate-spin shrink-0" />
                                  ) : checked ? (
                                    <CheckCircle className="w-5 h-5 text-teal shrink-0" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                                  )}
                                  <Icon className={`w-4 h-4 ${iconInfo.color} shrink-0`} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium ${checked ? "text-teal line-through" : "text-foreground"}`}>
                                      {item.instruction}
                                    </p>
                                    <div className="flex gap-3 mt-0.5 text-[10px] text-muted-foreground">
                                      {item.frequency && <span>{item.frequency}</span>}
                                      {item.duration && <span>{item.duration}</span>}
                                    </div>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>

                          {/* Today's summary */}
                          {plan.items.length > 0 && (
                            <div className="glass-1 rounded-xl p-3 flex items-center gap-3">
                              <TrendingUp className={`w-5 h-5 ${progress === 100 ? "text-teal" : "text-muted-foreground"}`} />
                              <p className="text-xs text-foreground">
                                {progress === 100
                                  ? "All done for today! Great work."
                                  : `${plan.items.filter(it => todayCheckins.has(it.id)).length} of ${plan.items.length} items completed today`}
                              </p>
                            </div>
                          )}
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
      <BottomNav />
    </div>
  );
}
