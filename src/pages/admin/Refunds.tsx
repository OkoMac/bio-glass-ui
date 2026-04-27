import { useAdminToken } from "@/hooks/useAdminToken";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import AdminTokenGate from "@/components/AdminTokenGate";
import GlassCard from "@/components/GlassCard";
import {
  Search, Loader2, AlertTriangle, CheckCircle2, DollarSign, Mail, Calendar,
ArrowLeft, } from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface BookingRow {
  id: string;
  client_id: string;
  provider_id: string;
  booking_date: string;
  booking_time: string | null;
  total_price: number | null;
  status: string;
  payment_status: string | null;
  paystack_reference: string | null;
  notes: string | null;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
  provider_name: string | null;
  provider_email: string | null;
}

export default function AdminRefunds() {
  const navigate = useNavigate();
  const { token, loading: tokenLoading } = useAdminToken();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<BookingRow[]>([]);
  const [selected, setSelected] = useState<BookingRow | null>(null);
  const [channel, setChannel] = useState<"wallet" | "bank">("wallet");
  const [refundPct, setRefundPct] = useState(100);
  const [waiveBionFee, setWaiveBionFee] = useState(false);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastBreakdown, setLastBreakdown] = useState<any>(null);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const url = `${API}/api/compliance/admin/booking-lookup?q=${encodeURIComponent(query.trim())}`;
      const res = await fetch(url, { headers: { "X-Admin-Token": token } });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Search failed");
      setResults(j.bookings ?? []);
    } catch (err: any) {
      toast.error(err.message ?? "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const process = async () => {
    if (!selected) return;
    setProcessing(true);
    setLastBreakdown(null);
    try {
      const res = await fetch(`${API}/api/compliance/admin/manual-refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({
          bookingId: selected.id,
          channel,
          refundPct,
          waiveBionFee,
          note: note.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Refund failed");
      setLastBreakdown(j.breakdown);
      toast.success(`Refund processed: R${Number(j.breakdown.client_refund_rand).toFixed(2)} to ${channel}`);
      // Remove from results so it can't be double-processed from this session
      setResults(prev => prev.filter(r => r.id !== selected.id));
      setSelected(null);
      setNote("");
    } catch (err: any) {
      toast.error(err.message ?? "Refund failed");
    } finally {
      setProcessing(false);
    }
  };

  // Compute preview of what the refund will be
  const [preview, setPreview] = useState<{
    client_refund_rand: number;
    provider_payout_rand: number;
    bion_refund_fee_rand: number;
    paystack_fee_rand: number;
    bion_absorbed_rand: number;
  } | null>(null);

  useEffect(() => {
    if (!selected) { setPreview(null); return; }
    const bill = Math.round(Number(selected.total_price ?? 0) * 1.05 * 100) / 100;
    const pct = refundPct / 100;
    const paystackFee = Math.round(bill * 0.035 * 100) / 100;
    const servicePart = Math.round((Number(selected.total_price ?? 0) * pct) * 100) / 100;
    const feePart     = Math.round((Number(selected.total_price ?? 0) * 0.05 * pct) * 100) / 100;
    const baseRefund  = Math.round((servicePart + feePart) * 100) / 100;
    const grossRefund = channel === "wallet" ? baseRefund : Math.round((baseRefund - paystackFee * pct) * 100) / 100;
    const bionFee     = waiveBionFee ? 0 : Math.round(grossRefund * 0.10 * 100) / 100;
    const clientRefund = Math.round((grossRefund - bionFee) * 100) / 100;
    const providerPayout = Math.round((Number(selected.total_price ?? 0) * 0.9 * (1 - pct)) * 100) / 100;
    setPreview({
      client_refund_rand: clientRefund,
      provider_payout_rand: providerPayout,
      bion_refund_fee_rand: bionFee,
      paystack_fee_rand: paystackFee,
      bion_absorbed_rand: channel === "wallet" ? Math.round(paystackFee * pct * 100) / 100 : 0,
    });
  }, [selected, refundPct, channel, waiveBionFee]);

  if (!token) return <AdminTokenGate tokenLoading={tokenLoading} />;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <AdminNav />
      <div className="max-w-5xl mx-auto pt-24 md:pt-8 pb-20 px-4 space-y-5">
        <header>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo" /> Manual Refunds
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Process refunds requested via disputes@bionhealth.co.za. Uses the canonical 10% BION fee + Paystack accounting engine.
          </p>
        </header>

        {/* Search */}
        <GlassCard className="p-4 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Find a booking</label>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="Booking ID, paystack reference, or client/provider email"
              className="flex-1 h-10 glass-1 rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
            />
            <button
              onClick={search}
              disabled={searching || !query.trim()}
              className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50 flex items-center gap-1.5"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Search
            </button>
          </div>
        </GlassCard>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{results.length} result{results.length === 1 ? "" : "s"}</p>
            {results.map(r => (
              <GlassCard key={r.id}
                className={`p-4 cursor-pointer transition-all ${selected?.id === r.id ? "border border-indigo" : "hover:bg-white/[0.02]"}`}
                onClick={() => setSelected(r)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{r.client_name ?? "(Unknown client)"}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{r.client_email ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {r.booking_date} {r.booking_time ?? ""} · with {r.provider_name ?? "(unknown)"}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 font-data mt-0.5">Ref: {r.paystack_reference ?? "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-data text-foreground">R{Number(r.total_price ?? 0).toFixed(0)}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-pill inline-block mt-1 ${
                      r.payment_status === "paid" ? "glass-accent-teal text-teal" :
                      r.payment_status === "refunded" ? "glass-accent-coral text-coral" :
                      "glass-1 text-muted-foreground"
                    }`}>
                      {r.payment_status ?? "—"}
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Refund form */}
        {selected && (
          <GlassCard className="p-5 space-y-4 border border-indigo/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber" />
              <h2 className="text-sm font-semibold text-foreground">Process refund for this booking</h2>
            </div>

            {/* Channel */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Refund channel</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(["wallet", "bank"] as const).map(c => (
                  <button key={c} onClick={() => setChannel(c)}
                    className={`py-2.5 rounded-xl text-xs font-semibold ${
                      channel === c ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                    }`}>
                    {c === "wallet" ? "BION Wallet (instant)" : "Bank (5-10 days)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Percentage */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Refund percentage · {refundPct}%
              </label>
              <input
                type="range" min={0} max={100} step={10}
                value={refundPct}
                onChange={e => setRefundPct(Number(e.target.value))}
                className="w-full mt-2 accent-indigo"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0% (no refund)</span>
                <span>50%</span>
                <span>100% (full)</span>
              </div>
            </div>

            {/* Waive 10% BION fee */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={waiveBionFee}
                onChange={e => setWaiveBionFee(e.target.checked)}
                className="w-4 h-4 accent-teal"
              />
              <span className="text-xs text-foreground">Waive the 10% BION refund fee</span>
              <span className="text-[10px] text-muted-foreground ml-auto">(use when provider was clearly at fault)</span>
            </label>

            {/* Note */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Admin note (optional)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="e.g. provider no-show per client email, reason code X"
                className="w-full mt-1 glass-1 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="glass-1 rounded-xl p-3 space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Preview</p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Client will receive</span>
                  <span className="text-teal font-bold font-data">R{preview.client_refund_rand.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Provider keeps</span>
                  <span className="text-foreground font-data">R{preview.provider_payout_rand.toFixed(2)}</span>
                </div>
                {preview.bion_refund_fee_rand > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">BION refund fee (10%)</span>
                    <span className="text-foreground font-data">R{preview.bion_refund_fee_rand.toFixed(2)}</span>
                  </div>
                )}
                {channel === "wallet" && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Paystack fee absorbed by BION</span>
                    <span className="text-coral font-data">R{preview.bion_absorbed_rand.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setSelected(null); setNote(""); setLastBreakdown(null); }}
                className="flex-1 rounded-pill py-3 text-xs font-medium glass-1 text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={process}
                disabled={processing || refundPct === 0}
                className="flex-1 rounded-pill py-3 text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50"
              >
                {processing ? "Processing…" : "Process refund"}
              </button>
            </div>
          </GlassCard>
        )}

        {lastBreakdown && (
          <GlassCard variant="accent-teal" className="p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Refund complete</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                R{Number(lastBreakdown.client_refund_rand).toFixed(2)} issued · client emailed · audit logged to compliance_events
              </p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
