import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { HelpCircle, MessageSquare, Mail, Phone, Send, Loader2, Check, ChevronDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

const FAQS: Array<{ q: string; a: string }> = [
  { q: "How do I cancel a booking?",
    a: "Open /schedule, tap the booking, tap Cancel. Cancellation policy is symmetric — the canceller pays the fee. Cancel 24h+ before booking: 10% fee, 90% refunded to wallet. Cancel <24h before booking: 50% fee, 50% refunded to wallet. Voucher bookings: voucher auto-restored, no fee. Rescheduling is free (up to 3 times) — always cheaper than cancelling." },
  { q: "How are refunds processed?",
    a: "Cancellation refunds go automatically to your BION Wallet immediately. Cancel 24h+ early = 90% back. Cancel late = 50% back. If a PROVIDER cancels, you receive a 100% refund to wallet and the provider's wallet is debited the cancellation fee (10% if 24h+ early, 50% if late) plus a strike on their record. For disputes (service quality, no-show etc.), email disputes@bionhealth.co.za — admin handles those with a 10% BION refund fee (waivable when provider at fault)." },
  { q: "How do provider payouts work?",
    a: "Providers keep 90% of every booking. Earnings land in your BION Wallet instantly on payment. Withdraw to your SA bank via Paystack Transfer with a 10% cash-out fee (minimum R200)." },
  { q: "What do Premium / Pro / Elite give me?",
    a: "Premium (R29/mo) — clients get reduced 3.5% service fee + Expenditure Rewards. Pro (R499/mo) — providers get CRM, analytics, programmes. Elite (R999/mo) — providers get white-label + API + reduced fee on Premium clients." },
  { q: "How do I get verified as a provider?",
    a: "Go to /pro/verification. Upload your SA ID, professional registration (HPCSA / SANC / SAPC / AHPCSA for medical), and qualifications. B_ AI pre-checks; admin approves within 1 business day." },
  { q: "What are Activity Points?",
    a: "Rewards for logging wellness activity (water, food, sleep, check-ins). 50 pts = R1 of in-app store credit. Capped at 250,000 pts / R5,000 per year. Expire after 18 months of inactivity." },
  { q: "How do BION Rangers earn?",
    a: "Rangers earn 20% of the monthly subscription of every provider they sign up (perpetual) + 2% of every completed booking + R5.80/mo per Premium client referral. See /for-rangers." },
  { q: "Is my data safe under POPIA?",
    a: "Yes. We're POPIA-compliant. All health data is AES-256 encrypted. Export your data any time from /settings → Privacy. You can also request account deletion. We retain financial records for 5 years per SARB rules; everything else is purged." },
  { q: "How do group bookings work?",
    a: "Providers can list group classes and workshops (e.g. yoga, HIIT, cooking). Clients book individual spots — the provider sets capacity and the session runs once enough participants join. Group bookings follow the same 5% client fee and cancellation policy as 1-on-1 sessions." },
  { q: "How do gift vouchers work?",
    a: "Buy a BION gift voucher (R250, R500, R750 or R1,000+) from the Gift Vouchers page. Send it to anyone via WhatsApp or email. The recipient redeems it as wallet credit and can book any provider on the platform." },
  { q: "What are package deals?",
    a: "Providers can offer session packages — for example, buy 10 sessions and get 2 free. You pay upfront at a discounted rate and sessions are deducted as you book. Packages appear on the provider's profile page." },
  { q: "How does telehealth / video consultation work?",
    a: "Providers who offer telehealth list it as a service type. When you book, you'll receive a Jitsi Meet video link via WhatsApp and email. Join at your appointment time — no app download required, it runs in your browser." },
  { q: "What is queue management / walk-in?",
    a: "Providers with walk-in availability can enable queue management. Clients join the virtual queue from the provider's profile — you'll see your position, estimated wait time and get a WhatsApp notification when it's your turn." },
  { q: "How does the affiliate programme work?",
    a: "Refer friends to BION and earn R5.80/month for every one who upgrades to Premium (R29/mo). Progress through Bronze, Silver and Gold tiers for bonus rewards. Your unique referral code is in your profile. 100 active Premium referrals qualifies you for a Ranger invitation." },
  { q: "Does BION work with medical aid?",
    a: "BION is not currently a medical aid scheme and does not process medical aid claims directly. However, you can pay with your BION Wallet (funded by your employer's corporate wellness budget) or card, and request a detailed invoice from the provider for manual submission to your medical aid." },
  { q: "How does the calorie tracker / photo analysis work?",
    a: "Take a photo of your meal in the Food Tracker. B_ AI analyses the image and estimates calories, protein, carbs and fat. You can adjust the values manually before logging. All food data is stored as special personal information under POPIA." },
];

export default function Help() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail]       = useState(user?.email ?? "");
  const [name, setName]         = useState(user?.name ?? "");
  const [phone, setPhone]       = useState("");
  const [category, setCategory] = useState("technical");
  const [priority, setPriority] = useState("normal");
  const [subject, setSubject]   = useState("");
  const [body, setBody]         = useState("");

  const submitTicket = async () => {
    if (!email.trim() || !subject.trim() || !body.trim()) {
      toast.error("Email, subject and details are required");
      return;
    }
    setSubmitting(true);
    try {
      // Pass the user's JWT if available so the ticket links to their profile
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      } catch { /* anon fallback */ }

      const res = await fetch(`${API}/api/support/tickets`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: email.trim(), name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          category, priority,
          subject: subject.trim(), body: body.trim(),
        }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Could not raise ticket");
      setSubmitted(true);
      setShowTicketForm(false);
      toast.success(`Ticket #${j.ticketNumber ?? "created"} raised — we'll email you shortly.`);
      setSubject(""); setBody(""); setPhone("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-20">
      <div className="mx-auto max-w-3xl px-4 pt-16 space-y-6">

        {/* Hero */}
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="shrink-0 w-9 h-9 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <HelpCircle className="w-6 h-6 text-indigo" />
            <h1 className="text-3xl font-bold text-foreground">How can we help?</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Browse the FAQs below, raise a ticket, or reach us directly.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setShowTicketForm(true)}
              className="rounded-pill px-4 py-2 text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Raise a ticket
            </button>
            {user && (
              <button
                onClick={() => navigate("/my-tickets")}
                className="rounded-pill px-4 py-2 text-xs font-medium glass-1 text-foreground"
              >
                My tickets
              </button>
            )}
          </div>
        </header>

        {/* Contact cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <GlassCard className="p-4">
            <Mail className="w-5 h-5 text-indigo mb-2" />
            <p className="text-xs font-semibold text-foreground">Email support</p>
            <a href="mailto:support@bionhealth.co.za" className="text-xs text-teal">support@bionhealth.co.za</a>
          </GlassCard>
          <GlassCard className="p-4">
            <Mail className="w-5 h-5 text-coral mb-2" />
            <p className="text-xs font-semibold text-foreground">Refunds</p>
            <a href="mailto:disputes@bionhealth.co.za" className="text-xs text-teal">disputes@bionhealth.co.za</a>
          </GlassCard>
          <GlassCard className="p-4">
            <Phone className="w-5 h-5 text-teal mb-2" />
            <p className="text-xs font-semibold text-foreground">WhatsApp B_</p>
            <a href="https://wa.me/27647432005" className="text-xs text-teal">+27 64 743 2005</a>
          </GlassCard>
        </div>

        {/* Ticket form */}
        <AnimatePresence>
          {showTicketForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <GlassCard className="p-5 space-y-3 border border-indigo/30">
                <h2 className="text-sm font-semibold text-foreground">Raise a ticket</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email *"
                    className="h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none" />
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                    className="h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none" />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)"
                    className="h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none" />
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none">
                    {["billing","booking","account","technical","provider","dispute","other"].map(c =>
                      <option key={c} value={c} className="bg-obsidian">{c}</option>)}
                  </select>
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject *"
                    className="h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none md:col-span-2" />
                  <select value={priority} onChange={e => setPriority(e.target.value)}
                    className="h-10 glass-1 rounded-xl px-3 text-sm text-foreground bg-transparent outline-none md:col-span-2">
                    {["low","normal","high","urgent"].map(p =>
                      <option key={p} value={p} className="bg-obsidian">{p} priority</option>)}
                  </select>
                </div>
                <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Describe the issue in detail… *"
                  rows={5}
                  className="w-full glass-1 rounded-xl px-3 py-2.5 text-sm text-foreground bg-transparent outline-none" />
                <div className="flex gap-2">
                  <button onClick={() => setShowTicketForm(false)} disabled={submitting}
                    className="flex-1 rounded-pill py-2.5 text-xs font-medium glass-1 text-muted-foreground">
                    Cancel
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={submitTicket} disabled={submitting}
                    className="flex-1 rounded-pill py-2.5 text-xs font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…</> : <><Send className="w-3.5 h-3.5" /> Submit ticket</>}
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {submitted && !showTicketForm && (
          <GlassCard variant="accent-teal" className="p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-teal" />
            <div>
              <p className="text-sm font-semibold text-foreground">Ticket raised</p>
              <p className="text-xs text-muted-foreground">Check your email for the confirmation. We reply within 1 business day.</p>
            </div>
          </GlassCard>
        )}

        {/* FAQs */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Common questions</h2>
          {FAQS.map((f, i) => (
            <GlassCard key={i} className="p-0 overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <p className="text-sm font-medium text-foreground pr-3">{f.q}</p>
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {expandedFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          ))}
        </section>
      </div>
    </div>
  );
}
