import { useState } from "react";
import { motion } from "framer-motion";
import { X, Heart, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

const TIP_AMOUNTS = [20, 50, 100, 200];

interface Props {
  bookingId: string;
  providerName: string;
  providerProfileId?: string;
  onClose: () => void;
}

export default function TipJar({ bookingId, providerName, providerProfileId, onClose }: Props) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const finalAmount = amount ?? (customAmount ? parseInt(customAmount, 10) || 0 : 0);

  const handleSend = async () => {
    if (finalAmount < 10) {
      setError("Minimum tip is R10");
      return;
    }
    setSending(true);
    setError("");
    try {
      // Deduct from wallet (localStorage for now, Paystack integration would handle real payment)
      const walletKey = `bion_wallet_${user?.id}`;
      const current = parseInt(localStorage.getItem(walletKey) ?? "0", 10);
      if (current < finalAmount) {
        setError(`Insufficient wallet balance (R${current}). Top up first.`);
        setSending(false);
        return;
      }
      localStorage.setItem(walletKey, String(current - finalAmount));

      // Client pays: finalAmount (tip full amount)
      // Provider receives: finalAmount - 3.5% payment processing fee
      const processingFee = Math.round(finalAmount * 0.035 * 100) / 100;
      const providerReceives = Math.round((finalAmount - processingFee) * 100) / 100;

      // Log tip to backend (fire-and-forget)
      fetch(`${API}/api/wallet/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          providerProfileId,
          amount: finalAmount,            // Client paid this
          processingFee,                   // 3.5% deducted from provider
          providerReceives,                // Net to provider
          note: note.trim() || undefined,
          fromUserId: user?.profileId,
        }),
      }).catch(() => {});

      setSent(true);
      setTimeout(onClose, 2500);
    } catch {
      setError("Failed to send tip. Try again.");
    }
    setSending(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-obsidian/70 z-[80]"
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[90] max-w-lg mx-auto rounded-t-3xl p-6 space-y-4"
        style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-coral/20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 fill-coral text-coral" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Tip sent!</h3>
            <p className="text-sm text-muted-foreground">R{finalAmount} to {providerName}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-coral" />
                <h3 className="text-base font-bold text-foreground">Tip {providerName}</h3>
              </div>
              <button onClick={onClose} className="w-8 h-8 glass-1 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Show your appreciation. You pay the tip amount only — the provider covers the 3.5% payment processing fee.
            </p>

            {/* Preset amounts */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Amount</p>
              <div className="grid grid-cols-4 gap-2">
                {TIP_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setCustomAmount(""); }}
                    className={`py-3 rounded-xl text-sm font-bold transition-colors ${
                      amount === a ? "gradient-indigo text-white" : "glass-1 text-foreground"
                    }`}
                  >
                    R{a}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 glass-1 rounded-xl px-3 py-2">
                <span className="text-sm text-muted-foreground">R</span>
                <input
                  type="number"
                  min="10"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setAmount(null); }}
                  placeholder="Custom amount"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none"
                />
              </div>
            </div>

            {/* Optional note */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Note (optional)</p>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Thanks for a great session!"
                maxLength={100}
                className="w-full px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground outline-none border border-white/[0.08]"
              />
            </div>

            {error && <p className="text-xs text-coral">{error}</p>}

            {/* Fee breakdown */}
            {finalAmount >= 10 && (
              <div className="glass-1 rounded-2xl p-3 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">You pay</span>
                  <span className="text-foreground font-data">R{finalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Payment processing (3.5%, paid by provider)</span>
                  <span className="text-muted-foreground font-data">-R{(finalAmount * 0.035).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1.5 border-t border-white/[0.06]">
                  <span className="text-foreground font-medium">{providerName} receives</span>
                  <span className="text-teal font-data font-semibold">R{(finalAmount * 0.965).toFixed(2)}</span>
                </div>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSend}
              disabled={sending || finalAmount < 10}
              className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 fill-current" />}
              {sending ? "Sending..." : `Send R${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"} tip`}
            </motion.button>
          </>
        )}
      </motion.div>
    </>
  );
}
