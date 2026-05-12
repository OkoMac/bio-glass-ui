import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Send, Inbox, CheckCircle, XCircle, Clock,
  Loader2, Search, AlertTriangle, Users, Plus, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

type Tab = "incoming" | "outgoing";

interface Referral {
  id: string;
  reason: string;
  notes: string | null;
  urgency: "routine" | "urgent" | "emergency";
  status: "pending" | "accepted" | "declined" | "completed";
  created_at: string;
  referring_provider?: { id: string; full_name: string; specialty?: string; avatar_url?: string };
  referred_to?: { id: string; full_name: string; specialty?: string; avatar_url?: string };
  client?: { id: string; full_name: string; phone?: string; avatar_url?: string };
}

interface ProviderSearchResult {
  id: string;
  full_name: string;
  specialty: string | null;
}

const URGENCY_COLORS = {
  routine: "text-teal bg-teal/10",
  urgent: "text-amber bg-amber/10",
  emergency: "text-coral bg-coral/10",
};

const STATUS_COLORS = {
  pending: "text-amber bg-amber/10",
  accepted: "text-teal bg-teal/10",
  declined: "text-coral bg-coral/10",
  completed: "text-indigo bg-indigo/10",
};

export default function Referrals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("incoming");
  const [incoming, setIncoming] = useState<Referral[]>([]);
  const [outgoing, setOutgoing] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // New referral form
  const [showForm, setShowForm] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ProviderSearchResult[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderSearchResult | null>(null);
  const [clientId, setClientId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "emergency">("routine");
  const [submitting, setSubmitting] = useState(false);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  };

  const fetchReferrals = useCallback(async () => {
    try {
      const token = await getToken();
      const [inRes, outRes] = await Promise.all([
        fetch(`${API}/api/provider-referrals/incoming`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/provider-referrals/outgoing`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const inJson = await inRes.json();
      const outJson = await outRes.json();
      if (inJson.ok) setIncoming(inJson.data ?? []);
      if (outJson.ok) setOutgoing(outJson.data ?? []);
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  // Search providers for referral
  useEffect(() => {
    if (providerSearch.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, specialty")
          .ilike("full_name", `%${providerSearch}%`)
          .limit(8);
        setSearchResults((data ?? []) as ProviderSearchResult[]);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [providerSearch]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const token = await getToken();
      await fetch(`${API}/api/provider-referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      await fetchReferrals();
    } catch (err) {
      console.error("Failed to update referral:", err);
    } finally {
      setUpdating(null);
    }
  };

  const submitReferral = async () => {
    if (!selectedProvider || !clientId || !reason) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/provider-referrals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientId,
          referredToProviderId: selectedProvider.id,
          reason,
          notes: notes || undefined,
          urgency,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setShowForm(false);
        setSelectedProvider(null);
        setClientId("");
        setReason("");
        setNotes("");
        setUrgency("routine");
        setProviderSearch("");
        setTab("outgoing");
        await fetchReferrals();
      }
    } catch (err) {
      console.error("Failed to submit referral:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  const referrals = tab === "incoming" ? incoming : outgoing;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Send className="w-6 h-6 text-indigo" /> Referrals
            </h1>
            <p className="text-xs text-muted-foreground">Refer clients to other providers on BION</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Refer Client
          </button>
        </div>

        {/* Tab bar */}
        <div className="glass-1 rounded-pill p-1 flex gap-1">
          {(["incoming", "outgoing"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium transition-all ${
                tab === t ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "incoming" ? <Inbox className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              {t === "incoming" ? `Incoming (${incoming.length})` : `Outgoing (${outgoing.length})`}
            </button>
          ))}
        </div>

        {/* Referral list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              No {tab} referrals yet.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {referrals.map(ref => (
              <GlassCard key={ref.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {ref.client?.full_name ?? "Unknown client"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {tab === "incoming"
                        ? `From: ${ref.referring_provider?.full_name ?? "Unknown"}`
                        : `To: ${ref.referred_to?.full_name ?? "Unknown"}`
                      }
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <span className={`text-[9px] px-2 py-0.5 rounded-pill font-medium ${URGENCY_COLORS[ref.urgency]}`}>
                      {ref.urgency}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-pill font-medium ${STATUS_COLORS[ref.status]}`}>
                      {ref.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-foreground/80 mb-1">
                  <span className="text-muted-foreground">Reason:</span> {ref.reason}
                </p>
                {ref.notes && (
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Notes: {ref.notes}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">{formatDate(ref.created_at)}</p>

                {/* Actions for incoming referrals */}
                {tab === "incoming" && ref.status === "pending" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => updateStatus(ref.id, "accepted")}
                      disabled={updating === ref.id}
                      className="flex-1 py-2 rounded-pill text-xs font-semibold bg-teal/20 text-teal flex items-center justify-center gap-1"
                    >
                      {updating === ref.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Accept
                    </button>
                    <button
                      onClick={() => updateStatus(ref.id, "declined")}
                      disabled={updating === ref.id}
                      className="flex-1 py-2 rounded-pill text-xs font-semibold bg-coral/20 text-coral flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Decline
                    </button>
                  </div>
                )}
                {ref.status === "accepted" && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => updateStatus(ref.id, "completed")}
                      disabled={updating === ref.id}
                      className="w-full py-2 rounded-pill text-xs font-semibold gradient-indigo text-primary-foreground flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Mark Completed
                    </button>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* ── New Referral Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-2 rounded-2xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Refer a Client</h2>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Client ID */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Client ID (profile UUID)</p>
                  <input
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    placeholder="Paste client profile ID"
                    className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                  />
                </div>

                {/* Provider search */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Refer to provider</p>
                  {selectedProvider ? (
                    <div className="flex items-center gap-2 glass-1 rounded-xl px-3 py-2">
                      <p className="text-sm text-foreground flex-1">{selectedProvider.full_name}</p>
                      <button onClick={() => { setSelectedProvider(null); setProviderSearch(""); }} className="text-muted-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <input
                        value={providerSearch}
                        onChange={e => setProviderSearch(e.target.value)}
                        placeholder="Search provider by name..."
                        className="w-full bg-white/5 text-foreground text-sm rounded-xl pl-9 pr-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute top-full mt-1 w-full glass-2 rounded-xl overflow-hidden z-10 max-h-40 overflow-y-auto">
                          {searchResults.map(p => (
                            <button
                              key={p.id}
                              onClick={() => { setSelectedProvider(p); setSearchResults([]); }}
                              className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors"
                            >
                              <p className="text-sm text-foreground">{p.full_name}</p>
                              {p.specialty && <p className="text-[10px] text-muted-foreground">{p.specialty}</p>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Reason for referral</p>
                  <input
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Specialist consultation for knee injury"
                    className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                  />
                </div>

                {/* Notes */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Notes (optional)</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors resize-none"
                  />
                </div>

                {/* Urgency */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">Urgency</p>
                  <div className="flex gap-2">
                    {(["routine", "urgent", "emergency"] as const).map(u => (
                      <button
                        key={u}
                        onClick={() => setUrgency(u)}
                        className={`flex-1 py-2 rounded-pill text-[11px] font-semibold transition-all capitalize ${
                          urgency === u ? URGENCY_COLORS[u] : "glass-1 text-muted-foreground"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={submitReferral}
                  disabled={submitting || !selectedProvider || !clientId || !reason}
                  className="w-full py-3 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Referral
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProviderNav />
    </div>
  );
}
