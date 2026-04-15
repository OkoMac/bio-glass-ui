/**
 * /admin/compliance — ops-facing review queue for FICA holds (Ranger
 * withdrawals above R250k) and corporate beneficial-ownership submissions.
 *
 * Reads from the admin metrics queues endpoint (/api/admin/metrics/queues).
 * Approve / reject actions update Supabase directly using the service-role
 * surface via dedicated backend endpoints (coming soon) — for now the admin
 * can at least SEE what's pending and contact the user.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/AdminNav";
import GlassCard from "@/components/GlassCard";
import {
  AlertTriangle, ShieldCheck, Loader2, CheckCircle, XCircle,
  FileText, Users as UsersIcon, Clock,
} from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface FicaHold {
  id: string;
  profile_id: string;
  amount_rand: number;
  ytd_after: number;
  created_at: string;
  status: string;
  // joined (we fetch profile name client-side)
  profile_name?: string;
  profile_email?: string;
}

interface BoSubmission {
  id: string;
  company_name: string;
  monthly_budget_rand: number;
  beneficial_owners: Array<{ full_name: string; id_number: string; ownership_pct: number; position?: string }>;
  bo_status: string;
  bo_submitted_at: string;
}

type Tab = "fica" | "bo";

export default function AdminCompliance() {
  const [tab, setTab] = useState<Tab>("fica");
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem("bion_admin_token") ?? ""; } catch { return ""; }
  });
  const [ficaHolds, setFicaHolds] = useState<FicaHold[]>([]);
  const [boSubmissions, setBoSubmissions] = useState<BoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/metrics/queues`, {
        headers: { "X-Admin-Token": token },
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load");

      const ficaRaw = (j.queues?.fica_holds ?? []) as FicaHold[];
      // Enrich with profile names
      if (ficaRaw.length) {
        const ids = [...new Set(ficaRaw.map(f => f.profile_id))];
        const { data: profiles } = await supabase.from("profiles")
          .select("id, full_name, email").in("id", ids);
        const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
        setFicaHolds(ficaRaw.map(f => ({
          ...f,
          profile_name: (map.get(f.profile_id) as any)?.full_name,
          profile_email: (map.get(f.profile_id) as any)?.email,
        })));
      } else {
        setFicaHolds([]);
      }
      setBoSubmissions((j.queues?.bo_submissions ?? []) as BoSubmission[]);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load compliance queue");
    }
    setLoading(false);
  };

  useEffect(() => { if (token) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

  const releaseFicaHold = async (f: FicaHold) => {
    setBusy(f.id);
    try {
      // Flip withdrawal to approved + increment ytd on the profile
      const { error: wdErr } = await supabase.from("ranger_withdrawals" as any).update({
        status: "approved", reviewed_at: new Date().toISOString(),
      }).eq("id", f.id);
      if (wdErr) throw wdErr;
      await supabase.from("profiles").update({
        ytd_withdrawals_rand: f.ytd_after,
      }).eq("id", f.profile_id);
      toast.success(`Released R${f.amount_rand.toLocaleString("en-ZA")} for ${f.profile_name ?? "ranger"}`);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Could not release");
    }
    setBusy(null);
  };

  const rejectFicaHold = async (f: FicaHold) => {
    setBusy(f.id);
    try {
      const { error } = await supabase.from("ranger_withdrawals" as any).update({
        status: "rejected", reviewed_at: new Date().toISOString(),
      }).eq("id", f.id);
      if (error) throw error;
      toast.success("Withdrawal rejected");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Could not reject");
    }
    setBusy(null);
  };

  const approveBo = async (bo: BoSubmission) => {
    setBusy(bo.id);
    try {
      const { error } = await supabase.from("corporate_accounts" as any).update({
        bo_status: "approved", bo_reviewed_at: new Date().toISOString(),
      }).eq("id", bo.id);
      if (error) throw error;
      toast.success(`${bo.company_name} approved`);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Could not approve");
    }
    setBusy(null);
  };

  const rejectBo = async (bo: BoSubmission) => {
    setBusy(bo.id);
    try {
      const { error } = await supabase.from("corporate_accounts" as any).update({
        bo_status: "rejected", bo_reviewed_at: new Date().toISOString(),
      }).eq("id", bo.id);
      if (error) throw error;
      toast.success(`${bo.company_name} rejected`);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Could not reject");
    }
    setBusy(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <AdminNav />
        <div className="max-w-md mx-auto pt-20 px-4">
          <GlassCard className="p-6 space-y-4">
            <h1 className="text-xl font-bold text-foreground">Admin token required</h1>
            <p className="text-sm text-muted-foreground">Paste your ADMIN_SETUP_TOKEN to view the compliance queue.</p>
            <input
              type="password"
              placeholder="ADMIN_SETUP_TOKEN"
              className="w-full h-10 glass-1 rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) { localStorage.setItem("bion_admin_token", v); setToken(v); }
                }
              }}
              autoFocus
            />
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <AdminNav />
      <div className="max-w-5xl mx-auto pt-8 pb-20 px-4 space-y-5">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo" /> Compliance Queue
            </h1>
            <p className="text-xs text-muted-foreground">FICA holds + Corporate Beneficial-Ownership submissions</p>
          </div>
          <button onClick={load} className="px-3 py-1.5 glass-1 rounded-full text-xs text-foreground">Refresh</button>
        </header>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("fica")}
            className={`px-4 py-2 rounded-pill text-sm font-medium ${tab === "fica" ? "gradient-indigo text-primary-foreground" : "glass-1 text-foreground"}`}
          >
            FICA holds · {ficaHolds.length}
          </button>
          <button
            onClick={() => setTab("bo")}
            className={`px-4 py-2 rounded-pill text-sm font-medium ${tab === "bo" ? "gradient-indigo text-primary-foreground" : "glass-1 text-foreground"}`}
          >
            BO submissions · {boSubmissions.length}
          </button>
        </div>

        {loading ? (
          <GlassCard className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </GlassCard>
        ) : tab === "fica" ? (
          ficaHolds.length === 0 ? (
            <GlassCard className="p-10 text-center">
              <CheckCircle className="w-8 h-8 text-teal mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No FICA holds pending</p>
              <p className="text-xs text-muted-foreground mt-1">Ranger withdrawals above the R250,000 annual threshold appear here for review.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {ficaHolds.map(f => (
                <GlassCard key={f.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{f.profile_name ?? f.profile_id}</p>
                      <p className="text-xs text-muted-foreground">{f.profile_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold font-data text-foreground">R{Number(f.amount_rand).toLocaleString("en-ZA")}</p>
                      <p className="text-[10px] text-muted-foreground">YTD after: R{Number(f.ytd_after).toLocaleString("en-ZA")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={busy === f.id}
                      onClick={() => releaseFicaHold(f)}
                      className="flex-1 py-2 rounded-pill bg-teal/20 text-teal text-xs font-semibold disabled:opacity-50"
                    >
                      {busy === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Release payout"}
                    </button>
                    <button
                      disabled={busy === f.id}
                      onClick={() => rejectFicaHold(f)}
                      className="flex-1 py-2 rounded-pill bg-coral/20 text-coral text-xs font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        ) : (
          // BO tab
          boSubmissions.length === 0 ? (
            <GlassCard className="p-10 text-center">
              <UsersIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No BO submissions pending</p>
              <p className="text-xs text-muted-foreground mt-1">Corporate accounts with monthly budgets above R50,000 must declare beneficial owners here.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {boSubmissions.map(bo => (
                <GlassCard key={bo.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-indigo" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{bo.company_name}</p>
                      <p className="text-xs text-muted-foreground">Monthly budget R{Number(bo.monthly_budget_rand ?? 0).toLocaleString("en-ZA")} · submitted {bo.bo_submitted_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {(bo.beneficial_owners ?? []).map((b, i) => (
                      <div key={i} className="text-xs text-foreground flex items-center justify-between glass-1 rounded-xl px-3 py-2">
                        <span>
                          <strong>{b.full_name}</strong>
                          {b.position ? ` · ${b.position}` : ""}
                        </span>
                        <span className="text-muted-foreground font-data">ID {b.id_number} · {b.ownership_pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={busy === bo.id}
                      onClick={() => approveBo(bo)}
                      className="flex-1 py-2 rounded-pill bg-teal/20 text-teal text-xs font-semibold disabled:opacity-50"
                    >
                      {busy === bo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Approve"}
                    </button>
                    <button
                      disabled={busy === bo.id}
                      onClick={() => rejectBo(bo)}
                      className="flex-1 py-2 rounded-pill bg-coral/20 text-coral text-xs font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
