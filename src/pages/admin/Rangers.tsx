import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminToken } from "@/hooks/useAdminToken";
import AdminNav from "@/components/AdminNav";
import AdminTokenGate from "@/components/AdminTokenGate";
import GlassCard from "@/components/GlassCard";
import {
  Target, Users, TrendingUp, Search, ChevronDown, ChevronRight,
  Phone, Mail, MapPin, Calendar, Award, AlertTriangle, Loader2,
ArrowLeft, } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Ranger {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  referral_code: string;
}

interface RangerWithStats extends Ranger {
  stats: {
    total_leads: number;
    by_stage: Record<string, number>;
    conversion_rate: number;
    this_month: { leads_added: number; demos_done: number; signups: number };
  };
  leads: any[];
}

const STAGE_COLORS: Record<string, string> = {
  new: "glass-1 text-muted-foreground",
  contacted: "bg-indigo/20 text-indigo",
  demo_scheduled: "bg-amber/20 text-amber",
  demo_done: "bg-violet/20 text-violet",
  negotiating: "bg-blue/20 text-blue",
  signed_up: "bg-teal/20 text-teal",
  active: "bg-emerald/20 text-emerald",
  lost: "bg-coral/20 text-coral",
};

export default function AdminRangers() {
  const navigate = useNavigate();
  const { token, loading: tokenLoading } = useAdminToken();
  const [rangers, setRangers] = useState<RangerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRanger, setExpandedRanger] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    loadRangers();
  }, [token]);

  async function loadRangers() {
    setLoading(true);
    try {
      // Fetch all rangers (profiles with sales_rep role)
      const res = await fetch(`${API}/api/ranger-crm/admin/overview`, {
        headers: { "X-Admin-Token": token },
      });
      const j = await res.json();
      if (j.ok) {
        setRangers(j.rangers ?? []);
      }
    } catch { /* */ }
    setLoading(false);
  }

  const filtered = search.trim()
    ? rangers.filter(r =>
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase()) ||
        r.city?.toLowerCase().includes(search.toLowerCase())
      )
    : rangers;

  // Totals across all rangers
  const totalLeads = rangers.reduce((s, r) => s + (r.stats?.total_leads ?? 0), 0);
  const totalSignups = rangers.reduce((s, r) => s + (r.stats?.this_month?.signups ?? 0), 0);
  const totalDemos = rangers.reduce((s, r) => s + (r.stats?.this_month?.demos_done ?? 0), 0);
  const avgConversion = rangers.length > 0
    ? Math.round(rangers.reduce((s, r) => s + (r.stats?.conversion_rate ?? 0), 0) / rangers.length)
    : 0;

  if (!token) return <AdminTokenGate tokenLoading={tokenLoading} />;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <AdminNav />
      <div className="max-w-6xl mx-auto pt-20 md:pt-8 pb-20 px-4 space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-teal" /> Rangers CRM
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Bird's-eye view of all sales reps — pipelines, performance, and leads
          </p>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold font-data text-foreground">{rangers.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rangers</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold font-data text-teal">{totalLeads}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Leads</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold font-data text-indigo">{totalSignups}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signups This Month</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold font-data text-amber">{avgConversion}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Conversion</p>
          </GlassCard>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 glass-1 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rangers by name, email, or city..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-indigo animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No rangers found</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filtered.map(ranger => {
              const expanded = expandedRanger === ranger.id;
              const s = ranger.stats;
              return (
                <GlassCard key={ranger.id} className="overflow-hidden">
                  {/* Ranger header — click to expand */}
                  <button
                    onClick={() => setExpandedRanger(expanded ? null : ranger.id)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-emerald flex items-center justify-center text-sm font-bold text-obsidian shrink-0">
                      {ranger.full_name?.[0]?.toUpperCase() ?? "R"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{ranger.full_name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <Mail className="w-3 h-3" /> {ranger.email}
                        {ranger.city && <><MapPin className="w-3 h-3 ml-1" /> {ranger.city}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <p className="text-sm font-bold font-data text-foreground">{s?.total_leads ?? 0}</p>
                        <p className="text-[9px] text-muted-foreground">Leads</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold font-data text-teal">{s?.this_month?.signups ?? 0}</p>
                        <p className="text-[9px] text-muted-foreground">Signups</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold font-data text-amber">{s?.conversion_rate ?? 0}%</p>
                        <p className="text-[9px] text-muted-foreground">Conv.</p>
                      </div>
                      {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded: pipeline + leads */}
                  {expanded && (
                    <div className="border-t border-white/[0.06] p-4 space-y-4">
                      {/* Pipeline stages */}
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(s?.by_stage ?? {}).map(([stage, count]) => (
                          <span key={stage} className={`text-[10px] font-semibold px-2 py-1 rounded-pill ${STAGE_COLORS[stage] ?? "glass-1 text-muted-foreground"}`}>
                            {stage.replace(/_/g, " ")}: {count as number}
                          </span>
                        ))}
                      </div>

                      {/* This month */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="glass-1 rounded-xl p-2 text-center">
                          <p className="text-xs font-bold font-data text-foreground">{s?.this_month?.leads_added ?? 0}</p>
                          <p className="text-[9px] text-muted-foreground">Leads Added</p>
                        </div>
                        <div className="glass-1 rounded-xl p-2 text-center">
                          <p className="text-xs font-bold font-data text-foreground">{s?.this_month?.demos_done ?? 0}</p>
                          <p className="text-[9px] text-muted-foreground">Demos Done</p>
                        </div>
                        <div className="glass-1 rounded-xl p-2 text-center">
                          <p className="text-xs font-bold font-data text-foreground">{s?.this_month?.signups ?? 0}</p>
                          <p className="text-[9px] text-muted-foreground">Signups</p>
                        </div>
                      </div>

                      {/* Recent leads */}
                      {ranger.leads?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Leads</p>
                          <div className="space-y-1">
                            {ranger.leads.slice(0, 10).map((lead: any) => (
                              <div key={lead.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02]">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-pill ${STAGE_COLORS[lead.stage] ?? "glass-1"}`}>
                                  {lead.stage?.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs text-foreground flex-1 truncate">{lead.business_name}</span>
                                <span className="text-[10px] text-muted-foreground">{lead.category}</span>
                                <span className="text-[10px] text-muted-foreground">{lead.city}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contact info */}
                      <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
                        {ranger.phone && (
                          <a href={`tel:${ranger.phone}`} className="text-[10px] text-teal flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                        )}
                        {ranger.phone && (
                          <a href={`https://wa.me/${ranger.phone.replace(/\D/g, "")}`} target="_blank" className="text-[10px] text-emerald flex items-center gap-1">
                            <Phone className="w-3 h-3" /> WhatsApp
                          </a>
                        )}
                        {ranger.email && (
                          <a href={`mailto:${ranger.email}`} className="text-[10px] text-indigo flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Email
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
