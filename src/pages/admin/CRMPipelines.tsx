import { useState, useEffect, useMemo, useCallback } from "react";
import GlassCard from "@/components/GlassCard";
import AdminNav from "@/components/AdminNav";
import WhatsAppCRMTabs from "@/components/WhatsAppCRMTabs";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, KanbanSquare, Plus, X, MoreVertical, Trophy, XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Stage {
  id: string;
  pipeline_id: string;
  name: string;
  color: string;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
}
interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  stages: Stage[];
  summary: { open: number; won: number; lost: number; open_value: number };
}
interface Deal {
  id: string;
  pipeline_id: string;
  stage_id: string;
  contact_phone: string | null;
  title: string;
  description: string | null;
  value_rand: number | null;
  expected_close_date: string | null;
  status: "open" | "won" | "lost";
  closed_reason: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

function fmtRand(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return `R ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R ${(v / 1_000).toFixed(1)}k`;
  return `R ${v.toFixed(0)}`;
}

export default function AdminCRMPipelines() {
  const { session } = useAuth();
  const headers = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {};
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
  }, [session?.access_token]);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewDeal, setShowNewDeal] = useState<{ stageId: string } | null>(null);
  const [newDealForm, setNewDealForm] = useState({ title: "", value: "", phone: "" });
  const [savingDeal, setSavingDeal] = useState(false);

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const [pRes, dRes] = await Promise.all([
        fetch(`${API}/api/crm/pipelines`, { headers }),
        fetch(`${API}/api/crm/deals?limit=500`, { headers }),
      ]);
      const pJson = await pRes.json().catch(() => ({}));
      const dJson = await dRes.json().catch(() => ({}));
      const pipes = pJson?.data ?? [];
      setPipelines(pipes);
      setDeals(dJson?.data ?? []);
      if (!activePipelineId && pipes.length > 0) setActivePipelineId(pipes[0].id);
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't load pipelines", { duration: 8000 });
    } finally {
      setLoading(false);
    }
  }, [headers, session?.access_token, activePipelineId]);

  useEffect(() => { void load(); }, [load]);

  const activePipeline = useMemo(
    () => pipelines.find(p => p.id === activePipelineId) ?? null,
    [pipelines, activePipelineId],
  );

  const dealsByStage = useMemo(() => {
    const map = new Map<string, Deal[]>();
    if (!activePipeline) return map;
    for (const d of deals.filter(d => d.pipeline_id === activePipeline.id && d.status === "open")) {
      const arr = map.get(d.stage_id) ?? [];
      arr.push(d);
      map.set(d.stage_id, arr);
    }
    return map;
  }, [deals, activePipeline]);

  const moveStage = async (dealId: string, newStageId: string) => {
    try {
      const res = await fetch(`${API}/api/crm/deals/${dealId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ stage_id: newStageId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      // optimistic
      setDeals((prev) => prev.map(d => d.id === dealId ? { ...d, stage_id: newStageId } : d));
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't move deal", { duration: 8000 });
    }
  };

  const setStatus = async (dealId: string, status: "won" | "lost" | "open") => {
    try {
      const res = await fetch(`${API}/api/crm/deals/${dealId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      await load();
      toast.success(status === "won" ? "Marked as won 🏆" : status === "lost" ? "Marked as lost" : "Reopened");
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't update deal", { duration: 8000 });
    }
  };

  const deleteDeal = async (dealId: string) => {
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/api/crm/deals/${dealId}`, { method: "DELETE", headers });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      setDeals((prev) => prev.filter(d => d.id !== dealId));
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't delete deal", { duration: 8000 });
    }
  };

  const createDeal = async () => {
    if (!showNewDeal || !activePipeline) return;
    const title = newDealForm.title.trim();
    if (title.length < 2) { toast.error("Title is too short"); return; }
    setSavingDeal(true);
    try {
      const res = await fetch(`${API}/api/crm/deals`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline_id: activePipeline.id,
          stage_id: showNewDeal.stageId,
          title,
          value_rand: newDealForm.value ? Number(newDealForm.value) : undefined,
          contact_phone: newDealForm.phone || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error ?? `HTTP ${res.status}`);
      setDeals((prev) => [j.data, ...prev]);
      setShowNewDeal(null);
      setNewDealForm({ title: "", value: "", phone: "" });
      toast.success("Deal created");
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't create deal", { duration: 8000 });
    } finally {
      setSavingDeal(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminNav />
        <div className="md:ml-56 min-h-screen pt-16 md:pt-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-coral animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNav />
      <div className="md:ml-56 min-h-screen pt-16 md:pt-0 px-4 md:px-8 py-6 space-y-5">
        <WhatsAppCRMTabs />

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
            <KanbanSquare className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-foreground">Pipelines</h1>
            <p className="text-[11px] text-muted-foreground">
              Track leads from first contact to booking. Move a deal between stages with the {">"} button.
            </p>
          </div>
          {/* Pipeline selector */}
          {pipelines.length > 1 && (
            <select value={activePipelineId ?? ""} onChange={(e) => setActivePipelineId(e.target.value)}
              className="bg-white/[0.02] border border-white/[0.06] rounded-pill px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-coral/40">
              {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>

        {/* Headline counts */}
        {activePipeline && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Open deals</p>
              <p className="text-xl font-semibold text-foreground tabular-nums">{activePipeline.summary.open}</p>
            </div>
            <div className="p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Open value</p>
              <p className="text-xl font-semibold text-foreground tabular-nums">{fmtRand(activePipeline.summary.open_value)}</p>
            </div>
            <div className="p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Won</p>
              <p className="text-xl font-semibold text-teal-400 tabular-nums">{activePipeline.summary.won}</p>
            </div>
            <div className="p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Lost</p>
              <p className="text-xl font-semibold text-red-400 tabular-nums">{activePipeline.summary.lost}</p>
            </div>
          </div>
        )}

        {/* Kanban */}
        {!activePipeline ? (
          <GlassCard className="p-8 text-center">
            <p className="text-xs text-muted-foreground">
              No pipelines yet. Apply <code className="text-[10px] bg-white/[0.04] px-1 rounded">crm-pipelines.sql</code> to seed the default Sales pipeline.
            </p>
          </GlassCard>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-3 min-w-max pb-4">
              {activePipeline.stages.map((stage, idx) => {
                const stageDeals = dealsByStage.get(stage.id) ?? [];
                const totalValue = stageDeals.reduce((s, d) => s + Number(d.value_rand ?? 0), 0);
                const nextStage = activePipeline.stages.find(s => s.sort_order > stage.sort_order && !s.is_won && !s.is_lost);
                return (
                  <div key={stage.id} className="w-72 shrink-0">
                    {/* Column header */}
                    <div className="px-3 py-2 rounded-t-2xl border border-b-0 border-white/[0.06] bg-white/[0.02]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: stage.color }} />
                          <p className="text-xs font-semibold text-foreground truncate">{stage.name}</p>
                          {stage.is_won && <Trophy className="w-3 h-3 text-teal-400" />}
                          {stage.is_lost && <XCircle className="w-3 h-3 text-red-400" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums">{stageDeals.length}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">{fmtRand(totalValue)} total</p>
                    </div>

                    {/* Cards */}
                    <div className="p-2 space-y-2 rounded-b-2xl border border-t-0 border-white/[0.06] bg-white/[0.01] min-h-[200px]">
                      {stageDeals.map((deal) => (
                        <div key={deal.id} className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] space-y-1.5">
                          <div className="flex items-start gap-2">
                            <p className="flex-1 text-xs font-medium text-foreground line-clamp-2">{deal.title}</p>
                            <div className="relative group/menu shrink-0">
                              <button className="text-muted-foreground hover:text-foreground" aria-label="Deal actions">
                                <MoreVertical className="w-3 h-3" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 z-20 hidden group-hover/menu:block bg-obsidian border border-white/[0.08] rounded-xl shadow-lg p-1 w-32">
                                <button onClick={() => setStatus(deal.id, "won")}
                                  className="w-full text-left text-[10px] px-2 py-1 rounded hover:bg-white/[0.06] text-teal-400 flex items-center gap-1">
                                  <Trophy className="w-3 h-3" /> Mark won
                                </button>
                                <button onClick={() => setStatus(deal.id, "lost")}
                                  className="w-full text-left text-[10px] px-2 py-1 rounded hover:bg-white/[0.06] text-red-400 flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Mark lost
                                </button>
                                <button onClick={() => deleteDeal(deal.id)}
                                  className="w-full text-left text-[10px] px-2 py-1 rounded hover:bg-white/[0.06] text-muted-foreground">
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="tabular-nums">{fmtRand(deal.value_rand)}</span>
                            {deal.contact_phone && <span className="truncate ml-2">{deal.contact_phone}</span>}
                          </div>
                          {nextStage && !stage.is_won && !stage.is_lost && (
                            <button onClick={() => moveStage(deal.id, nextStage.id)}
                              className="w-full text-[10px] px-2 py-1 rounded-pill border border-white/[0.08] hover:bg-white/[0.04] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                              <ArrowRight className="w-3 h-3" /> Move to {nextStage.name}
                            </button>
                          )}
                          {(stage.is_won || stage.is_lost) && deal.status === "open" && (
                            <button onClick={() => setStatus(deal.id, stage.is_won ? "won" : "lost")}
                              className="w-full text-[10px] px-2 py-1 rounded-pill border border-white/[0.08] hover:bg-white/[0.04] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Close as {stage.is_won ? "won" : "lost"}
                            </button>
                          )}
                        </div>
                      ))}

                      {/* Add deal */}
                      {showNewDeal?.stageId === stage.id ? (
                        <div className="p-2 rounded-xl border border-white/[0.06] bg-white/[0.03] space-y-1.5">
                          <input value={newDealForm.title} onChange={(e) => setNewDealForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Deal title…" autoFocus
                            className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-coral/40" />
                          <div className="flex gap-1">
                            <input value={newDealForm.value} onChange={(e) => setNewDealForm(f => ({ ...f, value: e.target.value }))}
                              placeholder="Value (R)" type="number"
                              className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-coral/40" />
                            <input value={newDealForm.phone} onChange={(e) => setNewDealForm(f => ({ ...f, phone: e.target.value }))}
                              placeholder="Phone (opt)"
                              className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-coral/40" />
                          </div>
                          <div className="flex gap-1">
                            <button onClick={createDeal} disabled={savingDeal || newDealForm.title.length < 2}
                              className="flex-1 text-[10px] px-2 py-1 rounded-pill bg-coral/15 text-coral border border-coral/30 hover:bg-coral/25 disabled:opacity-50">
                              {savingDeal ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Save"}
                            </button>
                            <button onClick={() => { setShowNewDeal(null); setNewDealForm({ title: "", value: "", phone: "" }); }}
                              className="text-[10px] px-2 py-1 rounded-pill text-muted-foreground hover:text-foreground">
                              <X className="w-3 h-3 inline" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setShowNewDeal({ stageId: stage.id })}
                          className="w-full text-[10px] px-2 py-2 rounded-xl border border-dashed border-white/[0.08] hover:bg-white/[0.02] text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3" /> Add deal
                        </button>
                      )}
                    </div>

                    {/* Visual gap between columns */}
                    {idx < activePipeline.stages.length - 1 && <div className="h-1" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
