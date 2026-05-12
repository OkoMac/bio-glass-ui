import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { useAuth } from "@/contexts/AuthContext";
import { getSASTDateKey } from "@/utils/sastDate";
import {
  ArrowLeft, Plus, Sparkles, Trash2, Edit3, Calendar,
  Loader2, Tag, MapPin, ChevronRight,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Campaign {
  id: string;
  title: string;
  description: string;
  type: string;
  start_date: string;
  end_date: string;
  discount_pct: number | null;
  discount_fixed: number | null;
  target_categories: string[];
  target_cities: string[];
  banner_image_url: string | null;
  cta_text: string;
  cta_url: string;
  status: string;
  created_at: string;
}

export default function AdminCampaigns() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "seasonal" as string,
    startDate: getSASTDateKey(),
    endDate: "",
    discountPct: "",
    discountFixed: "",
    targetCategories: "",
    targetCities: "",
    bannerImageUrl: "",
    ctaText: "Learn More",
    ctaUrl: "",
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/campaigns`, { headers });
      const data = await res.json();
      if (data.ok) setCampaigns(data.data ?? []);
    } catch {}
    setLoading(false);
  }

  async function createCampaign() {
    setSaving(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        type: form.type,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        discountPct: form.discountPct ? Number(form.discountPct) : undefined,
        discountFixed: form.discountFixed ? Number(form.discountFixed) : undefined,
        targetCategories: form.targetCategories ? form.targetCategories.split(",").map((s) => s.trim()) : [],
        targetCities: form.targetCities ? form.targetCities.split(",").map((s) => s.trim()) : [],
        bannerImageUrl: form.bannerImageUrl || null,
        ctaText: form.ctaText,
        ctaUrl: form.ctaUrl,
      };

      const res = await fetch(`${API}/api/campaigns`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setShowForm(false);
        setForm({
          title: "", description: "", type: "seasonal",
          startDate: getSASTDateKey(), endDate: "",
          discountPct: "", discountFixed: "", targetCategories: "",
          targetCities: "", bannerImageUrl: "", ctaText: "Learn More", ctaUrl: "",
        });
        loadCampaigns();
      }
    } catch {}
    setSaving(false);
  }

  async function deleteCampaign(id: string) {
    try {
      await fetch(`${API}/api/campaigns/${id}`, { method: "DELETE", headers });
      loadCampaigns();
    } catch {}
  }

  const isActive = (c: Campaign) => c.status === "active" && new Date(c.end_date) >= new Date() && new Date(c.start_date) <= new Date();

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <AdminNav />
      <div className="w-full px-4 md:px-8 xl:px-12 pt-24 md:pt-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/dashboard")} className="w-9 h-9 glass-2 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Campaigns</h1>
            <p className="text-xs text-muted-foreground">Seasonal promotions & flash sales</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            <Plus className="w-3.5 h-3.5" /> New Campaign
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <GlassCard className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Create Campaign</h3>

            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Campaign title"
              className="w-full px-3 py-2 rounded-xl glass-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              rows={2}
              className="w-full px-3 py-2 rounded-xl glass-1 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="px-3 py-2 rounded-xl glass-1 text-sm text-foreground outline-none bg-transparent"
              >
                <option value="seasonal">Seasonal</option>
                <option value="flash">Flash Sale</option>
                <option value="holiday">Holiday</option>
                <option value="custom">Custom</option>
              </select>
              <input
                type="number"
                value={form.discountPct}
                onChange={(e) => setForm({ ...form, discountPct: e.target.value })}
                placeholder="Discount %"
                className="px-3 py-2 rounded-xl glass-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-1 text-sm text-foreground outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-1 text-sm text-foreground outline-none"
                />
              </div>
            </div>

            <input
              value={form.ctaUrl}
              onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
              placeholder="CTA link URL"
              className="w-full px-3 py-2 rounded-xl glass-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />

            <input
              value={form.targetCities}
              onChange={(e) => setForm({ ...form, targetCities: e.target.value })}
              placeholder="Target cities (comma-separated)"
              className="w-full px-3 py-2 rounded-xl glass-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />

            <button
              onClick={createCampaign}
              disabled={saving || !form.title || !form.endDate}
              className="w-full py-2.5 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50"
             aria-label="Loading" title="Loading">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Campaign"}
            </button>
          </GlassCard>
        )}

        {/* Campaign list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo" />
          </div>
        ) : campaigns.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Sparkles className="w-8 h-8 text-amber mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No campaigns yet. Create your first one!</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <GlassCard key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground truncate">{c.title}</h4>
                      <span className={`px-1.5 py-0.5 rounded-pill text-[9px] font-bold ${
                        isActive(c)
                          ? "bg-teal/20 text-teal border border-teal/30"
                          : c.status === "inactive"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber/20 text-amber border border-amber/30"
                      }`}>
                        {isActive(c) ? "LIVE" : c.status === "inactive" ? "INACTIVE" : "SCHEDULED"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-pill text-[9px] glass-1 text-muted-foreground capitalize">
                        {c.type}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{c.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}
                      </span>
                      {c.discount_pct && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {c.discount_pct}% off
                        </span>
                      )}
                      {c.target_cities?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {c.target_cities.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCampaign(c.id)}
                    className="shrink-0 w-8 h-8 glass-2 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
