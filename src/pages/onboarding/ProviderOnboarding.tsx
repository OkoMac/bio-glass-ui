/**
 * Provider Onboarding — Layer 2 Single Consent Screen
 *
 * Per Onboarding Master Spec: one screen, grouped terms, master checkbox.
 * Replaces the old 9-step flow. Feature education moves to Layer 3 + 4 nudges.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { Check, ExternalLink } from "lucide-react";

const TERMS = [
  "BION's fee structure (5% platform + 5% marketing = 90% net payout)",
  "POPIA data processing terms",
  "Cancellation policy & payout terms",
  "Verification & code of conduct",
];

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { completeLayer } = useOnboardingState();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (!agreed) return;
    setSaving(true);
    await completeLayer(1);
    await completeLayer(2);
    // Set localStorage flag for backwards compat
    if (user?.id) localStorage.setItem(`bion_onboarding_done_${user.id}`, "1");
    navigate("/pro/dashboard", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(13,148,136,0.06) 0%, #0A0A0F 65%)" }}>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Before we go live — quick legals.</h1>
          <p className="text-sm text-muted-foreground mt-2">One tap. Fully POPIA compliant.</p>
        </div>

        {/* Grouped terms */}
        <div className="glass-1 rounded-2xl border border-white/8 p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">By continuing you agree:</p>

          {TERMS.map((term, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-teal shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{term}</p>
            </div>
          ))}

          <a
            href="/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo hover:underline"
          >
            Read full terms <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Master checkbox */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setAgreed(!agreed)}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              agreed ? "bg-teal border-teal" : "border-white/20 bg-transparent"
            }`}
          >
            {agreed && <Check className="w-4 h-4 text-obsidian" />}
          </div>
          <span className="text-sm font-semibold text-foreground">I agree to all BION provider terms</span>
        </label>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleComplete}
          disabled={!agreed || saving}
          className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50"
        >
          {saving ? "Setting up..." : "Start using BION →"}
        </motion.button>
      </motion.div>
    </div>
  );
}
