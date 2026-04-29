import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Plus, Send, Clock, CheckCircle, Users,
  Loader2, MessageSquare, BarChart3, AlertTriangle,
} from "lucide-react";
import { AdminMfaProvider, useAdminMfa } from "@/hooks/useAdminMfa";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Broadcast {
  id: string;
  message: string;
  target_audience: string;
  target_city: string | null;
  target_category: string | null;
  scheduled_at: string;
  status: string;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  created_at: string;
  sent_at: string | null;
}

const AUDIENCE_LABELS: Record<string, string> = {
  all_clients: "All Clients",
  my_clients: "My Clients",
  inactive_30d: "Inactive (30 days)",
  new_this_month: "New This Month",
  by_city: "By City",
  by_category: "By Category",
};

export default function AdminBroadcasts() {
  return (
    <AdminMfaProvider>
      <AdminBroadcastsInner />
    </AdminMfaProvider>
  );
}

function AdminBroadcastsInner() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { mfaProtectedFetch } = useAdminMfa();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const [form, setForm] = useState({
    message: "",
    targetAudience: "all_clients",
    targetCity: "",
    targetCategory: "",
    scheduledAt: "",
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };

  useEffect(() => { loadBroadcasts(); }, []);

  async function loadBroadcasts() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/broadcasts`, { headers });
      const data = await res.json();
      if (data.ok) setBroadcasts(data.data ?? []);
    } catch {}
    setLoading(false);
  }

  async function createBroadcast() {
    setSaving(true);
    try {
      const body: any = {
        message: form.message,
        targetAudience: form.targetAudience,
      };
      if (form.targetCity) body.targetCity = form.targetCity;
      if (form.targetCategory) body.targetCategory = form.targetCategory;
      if (form.scheduledAt) body.scheduledAt = new Date(form.scheduledAt).toISOString();

      const res = await fetch(`${API}/api/broadcasts`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setShowForm(false);
        setForm({ message: "", targetAudience: "all_clients", targetCity: "", targetCategory: "", scheduledAt: "" });
        loadBroadcasts();
      }
    } catch {}
    setSaving(false);
  }

  async function triggerSend(id: string) {
    setSending(id);
    try {
      // mfaProtectedFetch handles the 401 mfa_required round-trip when
      // sending an all_clients broadcast (admin step-up MFA gate).
      const res = await mfaProtectedFetch(`${API}/api/broadcasts/${id}/send`, { method: "POST", headers });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Send failed (${res.status})`);
      }
      loadBroadcasts();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send broadcast");
    }
    setSending(null);
  }

  const charCount = form.message.length;
  const charLimit = 4096;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <AdminNav />
      <div className="w-full px-4 md:px-8 xl:px-12 pt-24 md:pt-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/dashboard")} className="w-9 h-9 glass-2 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">WhatsApp Broadcasts</h1>
            <p className="text-xs text-muted-foreground">Marketing messages via WhatsApp</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-pill text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            <Plus className="w-3.5 h-3.5" /> New Broadcast
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <GlassCard className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Create Broadcast</h3>

            <div>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Type your WhatsApp broadcast message..."
                rows={4}
                maxLength={charLimit}
                className="w-full px-3 py-2 rounded-xl glass-1 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
              />
              <div className={`text-right text-[10px] ${charCount > 3900 ? "text-coral" : "text-muted-foreground"}`}>
                {charCount}/{charLimit}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Target Audience</label>
                <select
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-1 text-sm text-foreground outline-none bg-transparent"
                >
                  {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-1 text-sm text-foreground outline-none"
                />
              </div>
            </div>

            {form.targetAudience === "by_city" && (
              <input
                value={form.targetCity}
                onChange={(e) => setForm({ ...form, targetCity: e.target.value })}
                placeholder="City name (e.g., Pretoria)"
                className="w-full px-3 py-2 rounded-xl glass-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            )}

            <button
              onClick={createBroadcast}
              disabled={saving || !form.message}
              className="w-full py-2.5 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : form.scheduledAt ? "Schedule Broadcast" : "Create & Send Now"}
            </button>
          </GlassCard>
        )}

        {/* Broadcast list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo" />
          </div>
        ) : broadcasts.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <MessageSquare className="w-8 h-8 text-teal mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No broadcasts yet. Create your first one!</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <GlassCard key={b.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded-pill text-[9px] font-bold ${
                        b.status === "sent"
                          ? "bg-teal/20 text-teal border border-teal/30"
                          : b.status === "sending"
                          ? "bg-amber/20 text-amber border border-amber/30"
                          : b.status === "queued"
                          ? "bg-indigo/20 text-indigo border border-indigo/30"
                          : "bg-white/10 text-muted-foreground"
                      }`}>
                        {b.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {AUDIENCE_LABELS[b.target_audience] || b.target_audience}
                      </span>
                      {b.target_city && (
                        <span className="text-[10px] text-muted-foreground">({b.target_city})</span>
                      )}
                    </div>

                    <p className="text-xs text-foreground line-clamp-2 mb-2">{b.message}</p>

                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Send className="w-3 h-3" /> Sent: {b.sent_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Delivered: {b.delivered_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> Read: {b.read_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(b.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {(b.status === "queued" || b.status === "pending_send") && (
                    <button
                      onClick={() => triggerSend(b.id)}
                      disabled={sending === b.id}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-pill text-[11px] font-semibold gradient-teal text-primary-foreground"
                    >
                      {sending === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Send
                    </button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
