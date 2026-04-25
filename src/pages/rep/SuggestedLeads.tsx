import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import RepNav from "@/components/RepNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeaders } from "@/lib/authFetch";
import {
  ArrowLeft, Sparkles, MapPin, Star, Plus, Check,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface SuggestedProvider {
  id: string;
  name: string;
  category: string;
  rating?: number;
  location?: string;
  photo?: string;
}

async function authHeaders() {
  try {
    return await getAuthHeaders();
  } catch {
    window.location.href = "/welcome?login=true";
    return { "Content-Type": "application/json", Authorization: "" };
  }
}

const categoryColor: Record<string, string> = {
  Medical:    "text-coral",
  Beauty:     "text-violet",
  Fitness:    "text-teal",
  Wellness:   "text-amber",
  Veterinary: "text-indigo",
};

export default function SuggestedLeads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [providers, setProviders] = useState<SuggestedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch(`${API}/api/ranger-crm/suggested-leads`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setProviders(data);
        }
      } catch {
        // Fallback: try localStorage directory cache
        try {
          const raw = localStorage.getItem("bion_directory_providers");
          if (raw && !cancelled) {
            const all = JSON.parse(raw) as any[];
            // Show first 20 not already in pipeline
            const existingLeads = JSON.parse(localStorage.getItem("bion_crm_leads") ?? "[]") as any[];
            const existingPhones = new Set(existingLeads.map((l: any) => l.phone));
            const suggestions = all
              .filter((p: any) => !existingPhones.has(p.phone))
              .slice(0, 20)
              .map((p: any) => ({
                id: p.id,
                name: p.name || p.business_name,
                category: p.category || "Wellness",
                rating: p.rating,
                location: p.city || p.location,
                photo: p.photo || p.image,
              }));
            setProviders(suggestions);
          }
        } catch { /* empty */ }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function addToPipeline(provider: SuggestedProvider) {
    if (addedIds.has(provider.id)) return;

    const lead = {
      id: crypto.randomUUID(),
      business_name: provider.name,
      contact_name: provider.name,
      phone: "",
      category: provider.category,
      city: provider.location,
      stage: "new" as const,
      source: "Directory",
      notes: `Auto-added from suggested leads. Rating: ${provider.rating ?? "N/A"}`,
      created_at: new Date().toISOString(),
      provider_id: provider.id,
    };

    // Save locally
    try {
      const all = JSON.parse(localStorage.getItem("bion_crm_leads") ?? "[]");
      all.unshift(lead);
      localStorage.setItem("bion_crm_leads", JSON.stringify(all));
    } catch { /* empty */ }

    // Send to API
    try {
      const headers = await authHeaders();
      await fetch(`${API}/api/ranger-crm/leads`, {
        method: "POST",
        headers,
        body: JSON.stringify(lead),
      });
    } catch { /* offline */ }

    setAddedIds(prev => new Set(prev).add(provider.id));
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      <div className="mx-auto max-w-3xl px-4 pt-12 pb-28 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/rep/crm")}
            className="w-9 h-9 rounded-xl glass-1 flex items-center justify-center text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber" /> Suggested Leads
            </h1>
            <p className="text-xs text-muted-foreground">
              Providers from the BION directory you haven't contacted yet
            </p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-indigo border-t-transparent animate-spin" />
          </div>
        ) : providers.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Sparkles className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-base font-semibold text-foreground mb-1">No suggestions right now</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Check back later or add leads manually.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {providers.map((p, i) => {
              const isAdded = addedIds.has(p.id);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <GlassCard hover className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Photo / Avatar */}
                      {p.photo ? (
                        <img
                          src={p.photo}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo text-base font-bold shrink-0">
                          {p.name[0]}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-medium ${categoryColor[p.category] ?? "text-muted-foreground"}`}>
                            {p.category}
                          </span>
                          {p.rating != null && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber">
                              <Star className="w-3 h-3 fill-current" />
                              {p.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {p.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-muted-foreground/50" />
                            <span className="text-[10px] text-muted-foreground">{p.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Add button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => addToPipeline(p)}
                        disabled={isAdded}
                        className={`shrink-0 px-3 py-2 rounded-pill text-xs font-semibold flex items-center gap-1 ${
                          isAdded
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "gradient-indigo text-white"
                        }`}
                      >
                        {isAdded ? (
                          <><Check className="w-3 h-3" /> Added</>
                        ) : (
                          <><Plus className="w-3 h-3" /> Add</>
                        )}
                      </motion.button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <RepNav />
    </div>
  );
}
