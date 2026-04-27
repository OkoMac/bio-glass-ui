import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Users, TrendingUp, AlertTriangle, Loader2, RefreshCw, ArrowLeft, } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Metrics {
  active_counts: { premium: number; pro: number; elite: number };
  total_active: number;
  mrr_rand: number;
  mtd_collected_rand: number;
  churn_this_month: number;
}

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const adminToken = localStorage.getItem("bion_admin_token") ?? "";
      if (!token && !adminToken) throw new Error("Not authenticated — paste your ADMIN_SETUP_TOKEN on /admin/compliance first");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (adminToken) headers["X-Admin-Token"] = adminToken;
      const res = await fetch(`${API}/api/paystack/admin/subscription-metrics`, { headers });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error ?? "Failed to load metrics");
      setMetrics(json.data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const bootstrapPlans = async () => {
    setBootstrapping(true);
    setError(null);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const adminToken = localStorage.getItem("bion_admin_token") ?? "";
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (adminToken) headers["X-Admin-Token"] = adminToken;
      const res = await fetch(`${API}/api/paystack/subscription/bootstrap-plans`, {
        method: "POST",
        headers,
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error ?? "Failed to bootstrap plans");
      window.alert(`Plans ready:\n${JSON.stringify(json.data, null, 2)}`);
    } catch (err: any) {
      setError(err?.message ?? "Bootstrap failed");
    } finally {
      setBootstrapping(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-28 md:pb-8 md:pt-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
            <p className="text-xs text-muted-foreground">MRR, active subscribers, and churn across all tiers</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-2 rounded-pill text-xs font-medium glass-1 text-foreground flex items-center gap-1.5 disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              onClick={bootstrapPlans}
              disabled={bootstrapping}
              className="px-3 py-2 rounded-pill text-xs font-medium glass-accent-indigo text-indigo disabled:opacity-40"
            >
              {bootstrapping ? "Bootstrapping..." : "Bootstrap Paystack Plans"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl glass-accent-coral p-3 text-sm text-coral flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile
            icon={<DollarSign className="w-4 h-4 text-teal" />}
            label="MRR"
            value={metrics ? `R${metrics.mrr_rand.toLocaleString("en-ZA")}` : "—"}
            loading={loading}
          />
          <KpiTile
            icon={<TrendingUp className="w-4 h-4 text-indigo" />}
            label="MTD collected"
            value={metrics ? `R${metrics.mtd_collected_rand.toLocaleString("en-ZA")}` : "—"}
            loading={loading}
          />
          <KpiTile
            icon={<Users className="w-4 h-4 text-amber" />}
            label="Active subs"
            value={metrics ? String(metrics.total_active) : "—"}
            loading={loading}
          />
          <KpiTile
            icon={<AlertTriangle className="w-4 h-4 text-coral" />}
            label="Churn MTD"
            value={metrics ? String(metrics.churn_this_month) : "—"}
            loading={loading}
          />
        </div>

        {/* Active by tier */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Active subscribers by tier</h2>
          {loading && !metrics ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <TierRow label="Client Premium" value={metrics?.active_counts.premium ?? 0} price={29} colour="text-teal" />
              <TierRow label="Provider Pro"   value={metrics?.active_counts.pro     ?? 0} price={499} colour="text-indigo" />
              <TierRow label="Provider Elite" value={metrics?.active_counts.elite   ?? 0} price={999} colour="text-amber" />
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">Ranger commission split</h2>
          <p className="text-xs text-muted-foreground">
            20% of every Pro (R99.80) and Elite (R199.80) subscription is credited to the Ranger who
            signed the provider up — perpetually, paid on the 1st of each month.
          </p>
        </GlassCard>
      </div>
      <AdminNav />
    </div>
  );
}

function KpiTile({
  icon, label, value, loading,
}: { icon: React.ReactNode; label: string; value: string; loading: boolean }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-[11px] text-muted-foreground">{label}</span></div>
      <p className="text-xl font-bold text-foreground font-data">
        {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : value}
      </p>
    </GlassCard>
  );
}

function TierRow({ label, value, price, colour }: { label: string; value: number; price: number; colour: string }) {
  return (
    <div className="glass-1 rounded-xl p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold font-data mt-1 ${colour}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">@ R{price}/mo = R{(value * price).toLocaleString("en-ZA")}/mo</p>
    </div>
  );
}
