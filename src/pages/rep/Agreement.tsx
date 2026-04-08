import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, CheckCircle2, Shield } from "lucide-react";

const SECTIONS = [
  {
    number: 1,
    title: "Appointment",
    items: [
      "BION appoints you as an independent Sales Representative to introduce and sign up health & wellness service providers to the BION platform.",
    ],
  },
  {
    number: 2,
    title: "Commission Structure",
    items: [
      "2% of all transaction fees from providers you sign up (standard tier)",
      "1% of transaction fees when your providers are on the Elite tier (R999/mo)",
      "20% of all subscription fees from providers you sign up",
      "You earn commission on every booking made with providers you signed up",
      "Commissions are calculated on the total transaction amount processed through Paystack",
    ],
  },
  {
    number: 3,
    title: "Payment Terms",
    items: [
      "Commissions accumulate monthly",
      "Payouts are processed on the 1st of each month via Paystack transfer to your linked bank account",
      "Minimum payout threshold: R50",
      "You must have a verified South African bank account linked to receive payouts",
    ],
  },
  {
    number: 4,
    title: "Obligations",
    items: [
      "Accurately represent BION's services and fee structure to potential providers",
      "Not make false promises about earnings or guaranteed client volumes",
      "Maintain professional conduct when representing BION",
      "Comply with POPIA and handle personal information responsibly",
    ],
  },
  {
    number: 5,
    title: "Termination",
    items: [
      "Either party may terminate this agreement with 30 days written notice",
      "Outstanding commissions will be paid within 30 days of termination",
      "BION reserves the right to immediately terminate for misconduct or misrepresentation",
    ],
  },
  {
    number: 6,
    title: "Independent Contractor",
    items: [
      "You are an independent contractor, not an employee of BION",
      "You are responsible for your own tax obligations",
      "BION does not provide benefits, insurance, or employment protections",
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
    navigate("/rep/dashboard");
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
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
