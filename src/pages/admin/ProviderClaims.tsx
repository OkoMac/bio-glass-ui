import { useAdminToken } from "@/hooks/useAdminToken";
/**
 * /admin/provider-claims — review queue for "Claim this listing" requests
 * submitted from /provider/:id by directory providers who want to move from
 * a non-bookable listing to a verified BION provider.
 *
 * Data flow:
 *   GET  /api/providers/claims/admin/pending      — list pending claims
 *   POST /api/providers/claims/admin/:id/approve  — approve (optionally link profile)
 *   POST /api/providers/claims/admin/:id/reject   — reject with a reason
 *
 * Auth: X-Admin-Token header (same pattern as /admin/compliance, /admin/whatsapp).
 *       Token is stored in localStorage as `bion_admin_token`.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminNav from "@/components/AdminNav";
import GlassCard from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import {
  UserCheck, CheckCircle, XCircle, Loader2, AlertCircle, Clock,
  Phone, Mail, Briefcase, ShieldCheck, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Claim {
  id: string;
  external_provider_slug: string;
  external_provider_name: string;
  claimant_email: string;
  claimant_phone: string | null;
  claimant_name: string;
  proof_of_ownership: string | null;
  status: "pending" | "verified" | "rejected" | "linked";
  linked_profile_id: string | null;
  admin_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  elapsed_days: number;
}

interface ProviderOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default function AdminProviderClaims() {
  const { token, loading: tokenLoading } = useAdminToken();
  const [tokenDraft, setTokenDraft] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<Claim | null>(null);
  const [approveProfileId, setApproveProfileId] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [rejectModal, setRejectModal] = useState<Claim | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);

  /** Pull the pending claims queue. Backend is admin-token gated. */
  const load = async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API}/api/providers/claims/admin/pending`, {
        headers: { "X-Admin-Token": token },
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Failed to load claims");
      setClaims((j.claims ?? []) as Claim[]);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load claims");
    }
    setLoading(false);
  };

  /** Provider profiles dropdown for the approve-with-link path. */
  const loadProviders = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("is_active", true)
        .order("full_name", { ascending: true })
        .limit(500);
      setProviders((data ?? []) as ProviderOption[]);
    } catch {
      // non-fatal — the profile id input still works manually
    }
  };

  useEffect(() => { if (token) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);
  useEffect(() => { loadProviders(); }, []);

  const filteredProviders = useMemo(() => {
    if (!approveModal) return providers;
    const q = approveModal.external_provider_name.toLowerCase();
    // Put name-similar providers at the top — aids ops matching
    return [...providers].sort((a, b) => {
      const an = (a.full_name ?? "").toLowerCase();
      const bn = (b.full_name ?? "").toLowerCase();
      return Number(bn.includes(q)) - Number(an.includes(q));
    });
  }, [providers, approveModal]);

  const approve = async () => {
    if (!approveModal) return;
    setBusy(approveModal.id);
    try {
      const res = await fetch(`${API}/api/providers/claims/admin/${approveModal.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({
          link_profile_id: approveProfileId || undefined,
          admin_note: approveNote || undefined,
        }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Approve failed");
      toast.success(approveProfileId ? "Claim approved and linked to provider profile" : "Claim approved");
      setClaims(prev => prev.filter(c => c.id !== approveModal.id));
      setApproveModal(null);
      setApproveProfileId("");
      setApproveNote("");
    } catch (e: any) {
      toast.error(e.message ?? "Approve failed");
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      toast.error("Please share a reason for rejection");
      return;
    }
    setBusy(rejectModal.id);
    try {
      const res = await fetch(`${API}/api/providers/claims/admin/${rejectModal.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Reject failed");
      toast.success("Claim rejected — claimant notified");
      setClaims(prev => prev.filter(c => c.id !== rejectModal.id));
      setRejectModal(null);
      setRejectReason("");
    } catch (e: any) {
      toast.error(e.message ?? "Reject failed");
    } finally {
      setBusy(null);
    }
  };

  // ─── Token entry screen ────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
        <div className="mx-auto max-w-xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-coral" />
            <h1 className="text-2xl font-bold text-foreground">Provider Claims</h1>
          </div>
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-indigo shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Admin token required</p>
                <p className="text-xs text-muted-foreground">Paste the ADMIN_SETUP_TOKEN — stored in localStorage for this session.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenDraft}
                onChange={e => setTokenDraft(e.target.value)}
                placeholder="ADMIN_SETUP_TOKEN"
                className="flex-1 h-10 glass-1 rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none border border-white/[0.08] focus:border-indigo/40"
              />
              <button
                onClick={() => {
                  const v = tokenDraft.trim();
                  if (v) {
                    try { localStorage.setItem("bion_admin_token", v); } catch { /* ignore */ }
                    location.reload();
                  }
                }}
                className="px-4 py-2 gradient-indigo rounded-xl text-sm font-semibold text-white shadow-cta"
              >
                Unlock
              </button>
            </div>
          </GlassCard>
        </div>
        <AdminNav />
      </div>
    );
  }

  // ─── Main view ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-5xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-coral" />
              <h1 className="text-2xl font-bold text-foreground">Provider Claims</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Directory providers requesting to claim their listing and join BION.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="text-xs text-teal font-medium px-3 py-1.5 rounded-pill border border-teal/20 bg-teal/5 hover:bg-teal/10 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                try { localStorage.removeItem("bion_admin_token"); } catch { /* ignore */ }
                setToken("");
              }}
              className="text-xs text-muted-foreground font-medium px-3 py-1.5 rounded-pill border border-white/[0.08] hover:border-white/20 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Error banner */}
        {err && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-coral/30 bg-coral/10 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
            <p className="text-xs text-coral">{err}</p>
          </motion.div>
        )}

        {/* Summary pill */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-pill border border-amber/40 bg-amber/10 text-amber text-xs font-medium">
            <Clock className="w-3 h-3 inline mr-1" />
            {claims.length} pending
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : claims.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Sparkles className="w-10 h-10 text-teal/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">No pending claims</p>
            <p className="text-xs text-muted-foreground">
              All caught up — when a directory provider submits a claim from /provider/:id, it'll land here.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {claims.map(c => (
              <GlassCard key={c.id} className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-4">
                  {/* Left: claimant + business */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-indigo" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{c.external_provider_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">{c.external_provider_slug}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                        c.elapsed_days > 3
                          ? "bg-coral/10 border-coral/30 text-coral"
                          : c.elapsed_days > 1
                          ? "bg-amber/10 border-amber/30 text-amber"
                          : "bg-teal/10 border-teal/30 text-teal"
                      }`}>
                        {c.elapsed_days === 0 ? "Today" : `${c.elapsed_days}d ago`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="text-foreground font-medium">{c.claimant_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <a href={`mailto:${c.claimant_email}`} className="truncate hover:text-indigo transition-colors">
                          {c.claimant_email}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {c.claimant_phone
                          ? <a href={`tel:${c.claimant_phone}`} className="font-mono hover:text-indigo transition-colors">{c.claimant_phone}</a>
                          : <span className="italic">no phone</span>}
                      </div>
                    </div>

                    {c.proof_of_ownership && (
                      <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Ownership proof</p>
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {c.proof_of_ownership}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex lg:flex-col gap-2 lg:w-36 shrink-0">
                    <button
                      onClick={() => {
                        setApproveModal(c);
                        setApproveProfileId("");
                        setApproveNote("");
                      }}
                      disabled={busy === c.id}
                      className="flex-1 lg:flex-none px-3 py-2 rounded-xl bg-teal/10 border border-teal/30 text-teal hover:bg-teal/20 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setRejectModal(c);
                        setRejectReason("");
                      }}
                      disabled={busy === c.id}
                      className="flex-1 lg:flex-none px-3 py-2 rounded-xl bg-coral/10 border border-coral/30 text-coral hover:bg-coral/20 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* ── Approve modal ── */}
      <AnimatePresence>
        {approveModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => busy !== approveModal.id && setApproveModal(null)}
              className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-md mx-auto rounded-3xl p-6"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground">Approve claim</h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {approveModal.external_provider_name} · {approveModal.claimant_email}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                    Link to existing provider profile <span className="text-muted-foreground/50">(optional)</span>
                  </label>
                  <select
                    value={approveProfileId}
                    onChange={e => setApproveProfileId(e.target.value)}
                    className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08] focus:border-teal/40 transition-colors"
                  >
                    <option value="">— No link (sales team will set up) —</option>
                    {filteredProviders.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.full_name ?? "Unnamed"} {p.email ? `· ${p.email}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    Link only if the claimant already has a BION provider profile — this flips the claim to "linked".
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                    Note for claimant <span className="text-muted-foreground/50">(optional)</span>
                  </label>
                  <textarea
                    value={approveNote}
                    onChange={e => setApproveNote(e.target.value)}
                    rows={3}
                    placeholder="Anything the claimant should know before sales reaches out…"
                    className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-teal/40 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setApproveModal(null)}
                  disabled={busy === approveModal.id}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={approve}
                  disabled={busy === approveModal.id}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-teal to-emerald-500 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {busy === approveModal.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Reject modal ── */}
      <AnimatePresence>
        {rejectModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => busy !== rejectModal.id && setRejectModal(null)}
              className="fixed inset-0 bg-obsidian/70 z-[80]" />
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[90] max-w-md mx-auto rounded-3xl p-6"
              style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-coral" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground">Reject claim</h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {rejectModal.external_provider_name} · {rejectModal.claimant_email}
                  </p>
                </div>
              </div>

              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                Reason <span className="text-coral">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
                placeholder="e.g. We couldn't verify you as the owner of this business. Please reply with a CIPC / HPCSA registration or utility bill…"
                className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/[0.08] focus:border-coral/40 transition-colors resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                The claimant will receive this as an email explaining the rejection.
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setRejectModal(null)}
                  disabled={busy === rejectModal.id}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium border border-white/[0.08] bg-white/[0.02] text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={reject}
                  disabled={busy === rejectModal.id || !rejectReason.trim()}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-coral to-red-500 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {busy === rejectModal.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <XCircle className="w-3.5 h-3.5" />}
                  Confirm reject
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AdminNav />
    </div>
  );
}
