/**
 * /settings/data-sharing — B1-0 Phase 4
 *
 * Spec: backend/docs/B1-0-data-sharing-design.md (v3, §6.2 + §6.3 + §13).
 *
 * Two surfaces, both state-first per the events-vs-states canon (§13):
 *   1. Per-provider page (default tab) — list of providers I've shared
 *      with, each card shows active scopes with toggles.
 *   2. Privacy Summary matrix — providers × scopes grid.
 *
 * Audit log is reachable behind a "View full read history" affordance,
 * never as the default view.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Check, X, Info, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Grant {
  id: string;
  scope: string;
  grant_type: string;
  granted_via: string;
  granted_at: string;
  expires_at: string | null;
  booking_id: string | null;
  notes: string | null;
}

interface ProviderCard {
  provider_id: string;
  provider_name: string;
  provider_specialty: string | null;
  provider_avatar_url: string | null;
  granted_scopes: string[];
  last_read_at: string | null;
  grants: Grant[];
}

interface ReadGroup {
  reader_profile_id: string;
  reader_role: string;
  scope: string;
  count: number;
  first_read_at: string;
  last_read_at: string;
  has_admin_read: boolean;
}

const SCOPE_LABELS: Record<string, string> = {
  meals: "Meals & nutrition",
  routines: "Workout / coaching routines",
  sleep: "Sleep",
  hydration: "Hydration",
  steps_activity: "Steps & activity",
  body_composition: "Body composition",
  vitals: "Vitals (BP, HR, glucose)",
  pain_logs: "Pain & injury logs",
  allergies: "Allergies",
  conditions: "Conditions & injuries",
  family_history: "Family medical history",
  medications: "Medications",
  mental_health: "Mental health",
  reproductive_health: "Reproductive & sexual health",
  prior_treatments: "Prior aesthetic / surgical treatments",
  medical_aid_card: "Medical aid card",
  kyc_id: "Government ID",
};
const ALL_SCOPES = Object.keys(SCOPE_LABELS);

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export default function DataSharing() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"providers" | "matrix" | "audit">("providers");
  const [providers, setProviders] = useState<ProviderCard[]>([]);
  const [reads, setReads] = useState<ReadGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyScope, setBusyScope] = useState<string | null>(null);

  async function authHeader(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  async function refreshProviders() {
    setLoading(true);
    try {
      const headers = await authHeader();
      const res = await fetch(`${API}/api/data-grants/me`, { headers });
      const json = await res.json();
      if (json.ok && json.data) {
        setProviders((json.data.providers ?? []) as ProviderCard[]);
      }
    } catch {
      toast.error("Couldn't load your data-sharing settings.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshReads() {
    try {
      const headers = await authHeader();
      const res = await fetch(`${API}/api/data-grants/me/reads`, { headers });
      const json = await res.json();
      if (json.ok && json.data?.mode === "summary") {
        setReads((json.data.groups ?? []) as ReadGroup[]);
      }
    } catch {
      // best-effort — audit log isn't critical
    }
  }

  useEffect(() => {
    refreshProviders();
    refreshReads();
  }, []);

  // Toggle a single scope on a provider:
  //   if active → soft-revoke that grant
  //   if not active → seed a new relationship grant for just that scope
  async function toggleScope(card: ProviderCard, scope: string) {
    if (busyScope) return;
    setBusyScope(`${card.provider_id}:${scope}`);
    try {
      const headers = { ...(await authHeader()), "Content-Type": "application/json" };
      const existing = card.grants.find(g => g.scope === scope && !g.booking_id);
      if (existing) {
        const res = await fetch(`${API}/api/data-grants/${existing.id}`, { method: "DELETE", headers });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? "Couldn't revoke");
      } else {
        const res = await fetch(`${API}/api/data-grants/seed-defaults`, {
          method: "POST", headers,
          body: JSON.stringify({
            provider_id: card.provider_id,
            scopes: [scope],
            grant_type: "relationship",
            granted_via: "user_settings",
          }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error ?? "Couldn't grant");
      }
      await refreshProviders();
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't update");
    } finally {
      setBusyScope(null);
    }
  }

  async function revokeAll(card: ProviderCard) {
    if (!confirm(`Revoke all data sharing with ${card.provider_name}?`)) return;
    setBusyScope(card.provider_id);
    try {
      const headers = await authHeader();
      // Revoke each active grant. Could be a bulk endpoint later; for v1
      // the per-grant DELETE is fine — handful of rows max.
      await Promise.all(
        card.grants
          .filter(g => !g.booking_id)
          .map(g => fetch(`${API}/api/data-grants/${g.id}`, { method: "DELETE", headers })),
      );
      await refreshProviders();
      toast.success(`All sharing revoked with ${card.provider_name}.`);
    } catch {
      toast.error("Couldn't revoke all grants.");
    } finally {
      setBusyScope(null);
    }
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-5xl px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Data sharing</h1>
            <p className="text-xs text-muted-foreground">Who can see what — adjust anytime.</p>
          </div>
          <Shield className="w-5 h-5 text-teal" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([
            { k: "providers", label: "Per provider" },
            { k: "matrix",    label: "Privacy Summary" },
            { k: "audit",     label: "Read log" },
          ] as const).map(({ k, label }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-1.5 rounded-pill text-xs font-medium transition-colors ${
                tab === k ? "gradient-indigo text-white" : "glass-1 text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        )}

        {/* ── Per-provider tab ── */}
        {!loading && tab === "providers" && (
          <div className="space-y-4">
            {providers.length === 0 ? (
              <GlassCard className="p-6 text-center">
                <Info className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground">You haven't shared data with any provider yet.</p>
                <p className="text-[11px] text-muted-foreground mt-1">When you book a session, you'll choose what to share before paying.</p>
              </GlassCard>
            ) : providers.map(card => {
              const reverseLabel = card.last_read_at
                ? `Last read: ${new Date(card.last_read_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`
                : "No reads recorded yet";
              return (
                <GlassCard key={card.provider_id} className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    {card.provider_avatar_url ? (
                      <img src={card.provider_avatar_url} alt={card.provider_name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-white">{card.provider_name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{card.provider_name}</p>
                      <p className="text-[10px] text-muted-foreground">{card.provider_specialty ?? "Provider"} · {reverseLabel}</p>
                    </div>
                    <button
                      onClick={() => revokeAll(card)}
                      disabled={busyScope === card.provider_id}
                      className="text-[11px] text-coral hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Revoke all
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {ALL_SCOPES.map(scope => {
                      const active = card.granted_scopes.includes(scope);
                      const busy = busyScope === `${card.provider_id}:${scope}`;
                      return (
                        <label key={scope} className={`flex items-center gap-2.5 py-1 ${busy ? "opacity-50" : "cursor-pointer"}`}>
                          <div
                            onClick={(e) => { e.preventDefault(); if (!busy) toggleScope(card, scope); }}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              active ? "bg-indigo border-indigo" : "border-white/30"
                            }`}
                          >
                            {active && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>
                            {SCOPE_LABELS[scope] ?? scope}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* ── Privacy Summary matrix ── */}
        {!loading && tab === "matrix" && (
          <GlassCard className="p-4">
            {providers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nothing to summarise yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-muted-foreground font-normal pb-2 pr-2 sticky left-0 bg-obsidian">Scope</th>
                      {providers.map(p => (
                        <th key={p.provider_id} className="text-left text-foreground font-medium pb-2 px-2 whitespace-nowrap">
                          {p.provider_name.split(" ").slice(0, 2).join(" ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_SCOPES.map(scope => (
                      <tr key={scope} className="border-t border-white/5">
                        <td className="py-1.5 pr-2 text-muted-foreground sticky left-0 bg-obsidian">{SCOPE_LABELS[scope]}</td>
                        {providers.map(p => (
                          <td key={`${p.provider_id}-${scope}`} className="py-1.5 px-2">
                            {p.granted_scopes.includes(scope) ? (
                              <Check className="w-3.5 h-3.5 text-teal" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-muted-foreground/30" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
              State-first view (current grants). For event-level history, see the Read log tab.
            </p>
          </GlassCard>
        )}

        {/* ── Audit log (state-grouped, full event history hidden behind affordance) ── */}
        {!loading && tab === "audit" && (
          <div className="space-y-3">
            {reads.length === 0 ? (
              <GlassCard className="p-6 text-center">
                <Info className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground">No reads recorded yet.</p>
                <p className="text-[11px] text-muted-foreground mt-1">When a provider opens your shared data, it'll appear here.</p>
              </GlassCard>
            ) : reads.map(group => {
              const provider = providers.find(p => p.provider_id === group.reader_profile_id);
              const name = provider?.provider_name ?? `${group.reader_role.replace(/_/g, " ")}`;
              const range = group.first_read_at === group.last_read_at
                ? new Date(group.first_read_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                : `${new Date(group.first_read_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} – ${new Date(group.last_read_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`;
              return (
                <GlassCard key={`${group.reader_profile_id}:${group.scope}`} className="p-4 flex items-center gap-3">
                  <Shield className={`w-4 h-4 shrink-0 ${group.has_admin_read ? "text-amber" : "text-teal"}`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{name}</span>
                      {group.has_admin_read && <span className="ml-1.5 text-[10px] text-amber">(admin read)</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {SCOPE_LABELS[group.scope] ?? group.scope} · {group.count} read{group.count === 1 ? "" : "s"} · {range}
                    </p>
                  </div>
                </GlassCard>
              );
            })}
            <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
              Reads are grouped per provider per scope. Full event timestamps available on request via support@bionhealth.co.za.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
