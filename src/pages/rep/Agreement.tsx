import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, CheckCircle2, Shield, ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    number: 1,
    title: "Appointment",
    items: [
      "🤝 BION appoints you as an independent Sales Representative (Ranger) to introduce and sign up health & wellness service providers to the BION platform — currently 13,300+ providers across Johannesburg, Pretoria, Cape Town & Durban.",
      "🎓 You must complete the Bicademy Ranger Training (13 courses) and pass the accreditation assessment before commission eligibility is activated.",
    ],
  },
  {
    number: 2,
    title: "Commission Structure",
    items: [
      "💰 20% of every provider subscription for providers you sign up, paid monthly while the subscription is active. That's R99.80/month on a Pro plan (R499) and R199.80/month on an Elite plan (R999).",
      "📊 2% of every completed booking processed by your signed-up providers, for as long as they remain on the platform. Paid from BION's platform share — never from the provider's payout.",
      "👥 20% of any Premium subscription (R29/month) from clients referred through your code — R5.80/month per active referral, paid while the client stays on Premium.",
      "⏳ Your commission on a provider's first month is waived (month 1 is the provider's free trial). Commissions begin month 2.",
      "🧮 All commissions are calculated on amounts actually settled through Paystack. Refunded transactions reduce the related commission in the following reconciliation.",
    ],
  },
  {
    number: 3,
    title: "Payment Terms",
    items: [
      "📅 Commissions reconcile on the 3rd business day of each calendar month and land in your Earnings account.",
      "💳 You can move earnings to your BION Wallet instantly with no fee, or withdraw to your South African bank account via Paystack Transfer.",
      "🏦 Withdrawals to bank carry a 10% cash-out fee (covers Paystack transfer cost, BION Paystack fees, and FICA compliance). Keeping funds in-wallet is free.",
      "📏 Minimum withdrawal: R200. Amounts below this accumulate.",
      "📝 You are responsible for declaring all commission income to SARS. BION does not withhold tax. An annual earnings export is available in your Earnings tab.",
      "🔍 If your annual commissions exceed R250,000, BION may request FICA documentation (certified ID, proof of address, bank confirmation) before further withdrawals.",
    ],
  },
  {
    number: 4,
    title: "Ranger Tools & Resources",
    items: [
      "📱 CRM with an 8-stage lead pipeline — track every provider from cold lead to signed and active.",
      "🤖 Auto-suggested leads from the BION provider network — B_ AI identifies unsigned providers near you.",
      "🎓 13 Bicademy training courses covering platform knowledge, sales techniques, objection handling and compliance.",
      "📣 Pitch providers on 15 dashboard tools (including queue management, telehealth, group bookings, intake forms, treatment plans, analytics and multi-location support).",
    ],
  },
  {
    number: 5,
    title: "Obligations",
    items: [
      "✅ Accurately represent BION's services, fee structure and current features to potential providers",
      "🚫 Not make false promises about earnings or guaranteed client volumes",
      "🎯 Maintain professional conduct when representing BION",
      "🔒 Comply with POPIA and handle personal information responsibly",
    ],
  },
  {
    number: 6,
    title: "Termination",
    items: [
      "📋 Either party may terminate this agreement with 30 days written notice",
      "💰 Outstanding commissions will be paid within 30 days of termination",
      "⚠️ BION reserves the right to immediately terminate for misconduct or misrepresentation",
    ],
  },
  {
    number: 7,
    title: "Independent Contractor",
    items: [
      "📄 You are an independent contractor, not an employee of BION",
      "🧾 You are responsible for your own tax obligations",
      "ℹ️ BION does not provide benefits, insurance, or employment protections",
    ],
  },
];

export default function RepAgreement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const today = new Date().toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleAccept = () => {
    if (!agreed || !user) return;

    const agreement = {
      accepted: true,
      date: new Date().toISOString(),
      name: user.name,
      email: user.email,
    };
    localStorage.setItem("bion_rep_agreement", JSON.stringify(agreement));
    // Mark onboarding complete so they don't see it again
    if (user.id) localStorage.setItem(`bion_onboarding_done_${user.id}`, "1");
    navigate("/rep/dashboard");
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow relative">
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="mx-auto max-w-2xl px-4 pt-10 pb-20 space-y-5">
        {/* Logo & Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <img
            src="/bion-logo-white-sm.png"
            alt="BION"
            className="h-32 w-auto mx-auto rounded-lg"
          />
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-indigo" />
            <h1 className="text-xl font-bold text-foreground">
              BION Sales Representative Agreement
            </h1>
          </div>
        </motion.div>

        {/* Date & Rep Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Date</p>
                <p className="font-medium text-foreground">{today}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">
                  Representative
                </p>
                <p className="font-medium text-foreground">
                  {user?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Email</p>
                <p className="font-medium text-foreground">
                  {user?.email ?? "—"}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Contract Sections */}
        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.number}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full gradient-indigo flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                  {section.number}
                </span>
                <h2 className="text-sm font-semibold text-foreground">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-[13px] text-muted-foreground leading-relaxed"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        ))}

        {/* Agreement Checkbox & Accept */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard variant="accent-indigo" className="p-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-white/20 bg-white/5 accent-indigo"
              />
              <span className="text-sm text-foreground leading-relaxed">
                I have read and agree to the terms of this agreement
              </span>
            </label>

            <motion.button
              whileTap={agreed ? { scale: 0.97 } : undefined}
              onClick={handleAccept}
              disabled={!agreed}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-pill text-sm font-semibold transition-all ${
                agreed
                  ? "gradient-indigo text-primary-foreground shadow-cta cursor-pointer"
                  : "glass-1 text-muted-foreground cursor-not-allowed opacity-50"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept & Continue
            </motion.button>

            <p className="text-[10px] text-muted-foreground/60 text-center">
              By accepting, you confirm that you understand and agree to all
              terms outlined in this Sales Representative Agreement.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
