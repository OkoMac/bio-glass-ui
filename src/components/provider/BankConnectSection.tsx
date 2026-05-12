import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/authFetch";
import {
  Building2, CheckCircle, Loader2, AlertCircle, Shield, ArrowRight,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface Bank { name: string; code: string; slug?: string; }
interface LinkedBank {
  paystack_subaccount_code: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
}

async function authHeaders(): Promise<Record<string, string>> {
  try {
    return await getAuthHeaders();
  } catch {
    window.location.href = "/welcome?login=true";
    return { "Content-Type": "application/json" };
  }
}

/**
 * Payout Bank Connection — wires the provider's SA bank to Paystack so that
 * when a client pays, their 90% cut routes directly to them via the subaccount
 * split. Uses /api/paystack/banks for the bank list, /resolve-account to
 * confirm the account holder's name, and /provider/setup-bank to persist.
 */
export default function BankConnectSection() {
  const { user } = useAuth();
  const [linked, setLinked]             = useState<LinkedBank | null>(null);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState(false);

  const [banks, setBanks]               = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankCode, setBankCode]         = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [businessName, setBusinessName]   = useState("");

  const [resolving, setResolving]       = useState(false);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [submitting, setSubmitting]     = useState(false);

  // Load current linked bank
  useEffect(() => {
    (async () => {
      try {
        const h = await authHeaders();
        const res = await fetch(`${API}/api/paystack/provider/bank-details`, { headers: h });
        const j = await res.json();
        if (j.ok && j.data) setLinked(j.data as LinkedBank);
      } catch {
        /* best-effort */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load banks when the editor opens
  useEffect(() => {
    if (!editing || banks.length) return;
    setBanksLoading(true);
    fetch(`${API}/api/paystack/banks`)
      .then(r => r.json())
      .then(j => { if (j.ok && Array.isArray(j.data)) setBanks(j.data); })
      .catch(() => toast.error("Couldn't load bank list — try again shortly"))
      .finally(() => setBanksLoading(false));
  }, [editing, banks.length]);

  // Auto-resolve account holder name when we have a bank + 10-digit account
  useEffect(() => {
    setResolvedName(null);
    setResolveError(null);
    if (!bankCode || !/^\d{6,}$/.test(accountNumber)) return;
    let cancelled = false;
    setResolving(true);
    (async () => {
      try {
        const h = await authHeaders();
        const qs = `?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;
        const res = await fetch(`${API}/api/paystack/resolve-account${qs}`, { headers: h });
        const j = await res.json();
        if (cancelled) return;
        if (j.ok && j.data?.account_name) {
          setResolvedName(j.data.account_name);
          if (!businessName) setBusinessName(j.data.account_name);
        } else {
          setResolveError(j.error ?? "Couldn't verify this account");
        }
      } catch {
        if (!cancelled) setResolveError("Verification timed out");
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bankCode, accountNumber, businessName]);

  const saveBank = async () => {
    if (!bankCode || !accountNumber || !businessName.trim()) {
      toast.error("Bank, account number and business name are required");
      return;
    }
    if (!resolvedName) {
      toast.error("Wait for account verification, then retry");
      return;
    }
    setSubmitting(true);
    try {
      const h = await authHeaders();
      const res = await fetch(`${API}/api/paystack/provider/setup-bank`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          bank_code: bankCode,
          account_number: accountNumber,
          business_name: businessName.trim(),
        }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Couldn't link bank account");
      toast.success("Bank connected — you're ready for payouts");
      setLinked({
        paystack_subaccount_code: j.data?.subaccount_code ?? null,
        bank_name: j.data?.bank ?? banks.find(b => b.code === bankCode)?.name ?? null,
        bank_account_number: accountNumber,
        bank_account_name: j.data?.account_name ?? resolvedName,
      });
      setEditing(false);
      setBankCode(""); setAccountNumber(""); setBusinessName(""); setResolvedName(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't link bank account");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        <p className="text-xs text-muted-foreground">Checking payout bank…</p>
      </GlassCard>
    );
  }

  const hasLinked = !!linked?.paystack_subaccount_code;

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          hasLinked ? "bg-teal/15" : "bg-amber/15"
        }`}>
          {hasLinked
            ? <CheckCircle className="w-5 h-5 text-teal" />
            : <Building2 className="w-5 h-5 text-amber" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Payout Bank</p>
          {hasLinked ? (
            <>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paid via <strong className="text-foreground">{linked?.bank_name ?? "SA bank"}</strong>
                {" · "}
                <span className="font-data">
                  ••••{linked?.bank_account_number?.slice(-4) ?? ""}
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {linked?.bank_account_name}
              </p>
            </>
          ) : (
            <p className="text-xs text-amber mt-0.5">
              Connect a bank so clients can pay you directly via Paystack. Until this is set, payouts hold in your BION Wallet.
            </p>
          )}
        </div>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setBusinessName(user?.name ?? ""); }}
            className="text-xs text-indigo font-medium px-3 py-1.5 rounded-pill glass-1 hover:bg-white/[0.06] transition-colors shrink-0"
           title="} className='text-xs text-indigo font-medium px-3 py-1.5 rounded-pill glass-1…" aria-label="} className='text-xs text-indigo font-medium px-3 py-1.5 rounded-pill glass-1…">
            {hasLinked ? "Change" : "Connect"}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 pt-3 space-y-3">
              {/* Bank */}
              <label className="block">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bank</span>
                <select
                  value={bankCode}
                  onChange={e => setBankCode(e.target.value)}
                  disabled={banksLoading}
                  className="w-full mt-1 h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors"
                >
                  <option value="">{banksLoading ? "Loading banks…" : "Select your bank"}</option>
                  {banks.map(b => (
                    <option key={b.code} value={b.code} className="bg-obsidian text-foreground">
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Account number */}
              <label className="block">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Account number</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 1234567890"
                  className="w-full mt-1 h-10 glass-1 rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors font-data"
                />
              </label>

              {/* Auto-verification status */}
              <div className="min-h-[28px]">
                {resolving && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Verifying account with bank…
                  </div>
                )}
                {!resolving && resolvedName && (
                  <div className="flex items-center gap-2 text-xs text-teal">
                    <CheckCircle className="w-3 h-3" /> Account holder: <strong>{resolvedName}</strong>
                  </div>
                )}
                {!resolving && resolveError && (
                  <div className="flex items-center gap-2 text-xs text-coral">
                    <AlertCircle className="w-3 h-3" /> {resolveError}
                  </div>
                )}
              </div>

              {/* Business / trading name */}
              <label className="block">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Business / trading name
                </span>
                <input
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Thandi's Wellness Practice"
                  className="w-full mt-1 h-10 glass-1 rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none border border-white/[0.08] focus:border-indigo/40 transition-colors"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Shown on your client's bank statement as the payee.
                </span>
              </label>

              {/* Security copy */}
              <div className="flex items-start gap-2 rounded-xl bg-white/[0.03] border border-white/[0.05] p-2.5">
                <Shield className="w-3.5 h-3.5 text-indigo mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Bank details are stored with Paystack — BION never sees your full account number. Changes take effect on your next booking.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setEditing(false); setResolvedName(null); setResolveError(null); }}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-pill glass-1 text-xs text-muted-foreground font-medium"
                 title="} disabled= className='flex-1 py-2.5 rounded-pill glass-1 text-xs text-muted-…" aria-label="} disabled= className='flex-1 py-2.5 rounded-pill glass-1 text-xs text-muted-…">
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={saveBank}
                  disabled={submitting || !resolvedName || !bankCode || !accountNumber || !businessName.trim()}
                  className="flex-1 py-2.5 rounded-pill gradient-indigo text-primary-foreground text-xs font-semibold shadow-cta disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Linking…</>
                  ) : (
                    <>{hasLinked ? "Update bank" : "Connect bank"} <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
