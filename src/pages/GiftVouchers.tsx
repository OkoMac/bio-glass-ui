import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Gift, Heart, Send, Check, Loader2, CreditCard,
  Copy, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

const PRESET_AMOUNTS = [250, 500, 1000, 2000];

type Voucher = {
  id: string;
  code: string;
  amount_rand: number;
  remaining_rand: number;
  sender_name: string;
  recipient_name: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  message: string | null;
  status: string;
  purchased_at: string;
};

export default function GiftVouchers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"buy" | "my">("buy");

  // Buy form state
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCode, setSentCode] = useState("");

  // My vouchers state
  const [myVouchers, setMyVouchers] = useState<{ sent: Voucher[]; received: Voucher[] }>({ sent: [], received: [] });
  const [loadingMy, setLoadingMy] = useState(false);

  // Redeem check
  const [redeemCode, setRedeemCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [redeemResult, setRedeemResult] = useState<any>(null);

  useEffect(() => {
    if (tab === "my" && user) fetchMyVouchers();
  }, [tab, user]);

  async function getToken() {
    return (await (window as any).__supabase?.auth.getSession())?.data?.session?.access_token;
  }

  async function fetchMyVouchers() {
    setLoadingMy(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/gift-vouchers/my`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.ok) setMyVouchers(json.data);
    } catch {
      toast.error("Failed to load vouchers");
    } finally {
      setLoadingMy(false);
    }
  }

  async function handleSend() {
    if (!user) {
      navigate("/welcome?redirect=/gift-vouchers");
      return;
    }

    const finalAmount = isCustom ? Number(customAmount) : amount;
    if (!finalAmount || finalAmount < 50) {
      toast.error("Minimum voucher amount is R50");
      return;
    }
    if (!recipientName.trim()) {
      toast.error("Recipient name is required");
      return;
    }
    if (!recipientEmail && !recipientPhone) {
      toast.error("Please provide recipient email or phone");
      return;
    }
    if (!senderName.trim()) {
      toast.error("Your name is required");
      return;
    }

    setSending(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/gift-vouchers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: finalAmount,
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim() || undefined,
          recipientPhone: recipientPhone.trim() || undefined,
          message: message.trim() || undefined,
          senderName: senderName.trim(),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSent(true);
        setSentCode(json.data.code);
        toast.success("Gift voucher sent!");
      } else {
        toast.error(json.error ?? "Failed to create voucher");
      }
    } catch {
      toast.error("Network error — try again");
    } finally {
      setSending(false);
    }
  }

  async function handleCheckVoucher() {
    if (!redeemCode.trim()) return;
    setChecking(true);
    setRedeemResult(null);
    try {
      const res = await fetch(`${API}/api/gift-vouchers/redeem?code=${encodeURIComponent(redeemCode.trim())}`);
      const json = await res.json();
      if (json.ok) {
        setRedeemResult(json.voucher);
      } else {
        toast.error(json.error ?? "Voucher not found");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setChecking(false);
    }
  }

  function resetForm() {
    setSent(false);
    setSentCode("");
    setRecipientName("");
    setRecipientEmail("");
    setRecipientPhone("");
    setMessage("");
    setAmount(500);
    setCustomAmount("");
    setIsCustom(false);
  }

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-32">
      <div className="max-w-xl mx-auto px-4 md:px-8 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="glass-2 rounded-full w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gift Vouchers</h1>
            <p className="text-xs text-muted-foreground">Give the gift of wellness</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["buy", "my"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-pill px-4 py-2 text-xs font-medium transition-colors ${
                tab === t
                  ? "gradient-indigo text-primary-foreground"
                  : "glass-1 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "buy" ? "Send a Gift" : "My Vouchers"}
            </button>
          ))}
        </div>

        {/* Buy tab */}
        {tab === "buy" && !sent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Voucher preview card */}
            <div className="relative overflow-hidden rounded-2xl p-6 text-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)" }}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }}
              />
              <Gift className="w-8 h-8 text-white/60 mx-auto mb-2" />
              <p className="text-white/70 text-xs mb-1">BION Gift Voucher</p>
              <p className="text-white text-4xl font-bold font-data">
                R{isCustom ? (Number(customAmount) || 0) : amount}
              </p>
              {recipientName && (
                <p className="text-white/80 text-sm mt-2">for {recipientName}</p>
              )}
              {message && (
                <p className="text-white/60 text-xs mt-1 italic">"{message}"</p>
              )}
            </div>

            {/* Amount selector */}
            <GlassCard className="p-4 space-y-3">
              <label className="text-xs font-medium text-foreground">Amount</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setIsCustom(false); }}
                    className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                      !isCustom && amount === a
                        ? "gradient-indigo text-primary-foreground shadow-cta"
                        : "glass-1 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    R{a}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCustom(true)}
                  className={`rounded-xl py-2 px-3 text-xs font-medium transition-colors ${
                    isCustom ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
                  }`}
                >
                  Custom
                </button>
                {isCustom && (
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo/50"
                  />
                )}
              </div>
            </GlassCard>

            {/* Recipient details */}
            <GlassCard className="p-4 space-y-3">
              <label className="text-xs font-medium text-foreground">Recipient details</label>
              <input
                placeholder="Recipient's name *"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo/50"
              />
              <input
                placeholder="Email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo/50"
              />
              <input
                placeholder="Phone (WhatsApp)"
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo/50"
              />
              <textarea
                placeholder="Personal message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo/50 resize-none"
              />
            </GlassCard>

            {/* Sender name */}
            <GlassCard className="p-4 space-y-3">
              <label className="text-xs font-medium text-foreground">Your name</label>
              <input
                placeholder="Your name *"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo/50"
              />
            </GlassCard>

            {/* Send button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={sending}
              onClick={handleSend}
              className="w-full rounded-pill py-3.5 gradient-indigo text-primary-foreground text-sm font-semibold shadow-cta flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Gift — R{isCustom ? (Number(customAmount) || 0) : amount}
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Sent confirmation */}
        {tab === "buy" && sent && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <GlassCard className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">Gift Sent!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Your R{isCustom ? customAmount : amount} voucher for {recipientName} has been sent.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <p className="text-[10px] text-muted-foreground mb-1">Voucher Code</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xl font-bold font-data text-indigo tracking-wider">{sentCode}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(sentCode); toast.success("Copied!"); }}
                    className="w-7 h-7 glass-1 rounded-full flex items-center justify-center"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="rounded-pill px-6 py-2.5 gradient-indigo text-primary-foreground text-xs font-semibold"
              >
                Send Another Gift
              </button>
            </GlassCard>
          </motion.div>
        )}

        {/* My Vouchers tab */}
        {tab === "my" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Redeem checker */}
            <GlassCard className="p-4 space-y-3">
              <label className="text-xs font-medium text-foreground">Check / Redeem a Voucher</label>
              <div className="flex gap-2">
                <input
                  placeholder="Enter voucher code"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo/50 font-mono tracking-wider"
                />
                <button
                  onClick={handleCheckVoucher}
                  disabled={checking || !redeemCode.trim()}
                  className="rounded-xl px-4 py-2.5 gradient-indigo text-primary-foreground text-xs font-semibold disabled:opacity-50"
                >
                  {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Check"}
                </button>
              </div>
              {redeemResult && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-xs">
                  <p className="text-green-400 font-semibold">Valid Voucher</p>
                  <p className="text-muted-foreground mt-1">
                    From: {redeemResult.sender_name} | Remaining: R{redeemResult.remaining}
                  </p>
                </div>
              )}
            </GlassCard>

            {!user ? (
              <GlassCard className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">Sign in to see your vouchers</p>
                <button
                  onClick={() => navigate("/welcome?redirect=/gift-vouchers")}
                  className="rounded-pill px-5 py-2 gradient-indigo text-primary-foreground text-xs font-semibold"
                >
                  Sign in
                </button>
              </GlassCard>
            ) : loadingMy ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-indigo animate-spin" />
              </div>
            ) : (
              <>
                {/* Sent */}
                {myVouchers.sent.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Sent</h3>
                    <div className="space-y-2">
                      {myVouchers.sent.map((v) => (
                        <VoucherCard key={v.id} voucher={v} type="sent" />
                      ))}
                    </div>
                  </section>
                )}

                {/* Received */}
                {myVouchers.received.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Received</h3>
                    <div className="space-y-2">
                      {myVouchers.received.map((v) => (
                        <VoucherCard key={v.id} voucher={v} type="received" />
                      ))}
                    </div>
                  </section>
                )}

                {myVouchers.sent.length === 0 && myVouchers.received.length === 0 && (
                  <GlassCard className="p-8 text-center">
                    <Gift className="w-10 h-10 text-indigo/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No vouchers yet</p>
                    <button
                      onClick={() => setTab("buy")}
                      className="mt-3 rounded-pill px-5 py-2 gradient-indigo text-primary-foreground text-xs font-semibold"
                    >
                      Send your first gift
                    </button>
                  </GlassCard>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function VoucherCard({ voucher, type }: { voucher: Voucher; type: "sent" | "received" }) {
  const statusColors: Record<string, string> = {
    active: "text-green-400 bg-green-500/10",
    redeemed: "text-amber bg-amber/10",
    expired: "text-red-400 bg-red-500/10",
  };

  return (
    <GlassCard className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] rounded-pill px-2 py-0.5 font-medium ${statusColors[voucher.status] ?? "text-muted-foreground bg-white/5"}`}>
              {voucher.status}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">{voucher.code}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {type === "sent" ? `To: ${voucher.recipient_name}` : `From: ${voucher.sender_name}`}
          </p>
          {voucher.message && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic line-clamp-1">"{voucher.message}"</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-data text-sm text-foreground">R{voucher.amount_rand}</p>
          {voucher.remaining_rand < voucher.amount_rand && (
            <p className="text-[10px] text-muted-foreground">R{voucher.remaining_rand} left</p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
