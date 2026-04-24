/**
 * Corporate Onboarding — Layer 2 Single Consent Screen (DPA)
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { Check, ExternalLink } from "lucide-react";

const TERMS = [
  "BION Data Processing Agreement (POPIA compliance)",
  "Aggregate data only — HR never sees individual sessions",
  "Employee participation is voluntary",
  "Billing terms — monthly budget per employee, closed-loop wallet",
];

export default function CorporateOnboarding() {
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
    if (user?.id) localStorage.setItem(`bion_onboarding_done_${user.id}`, "1");
    navigate("/corporate/dashboard", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(245,158,11,0.06) 0%, #0A0A0F 65%)" }}>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Data Processing Agreement</h1>
          <p className="text-sm text-muted-foreground mt-2">One tap. POPIA compliant.</p>
        </div>

        <div className="glass-1 rounded-2xl border border-white/8 p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">By continuing you agree:</p>
          {TERMS.map((term, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-amber shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{term}</p>
            </div>
          ))}
          <a href="/legal/terms" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo hover:underline">
            Read full terms <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setAgreed(!agreed)}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${agreed ? "bg-amber border-amber" : "border-white/20 bg-transparent"}`}>
            {agreed && <Check className="w-4 h-4 text-obsidian" />}
          </div>
          <span className="text-sm font-semibold text-foreground">I agree to all BION corporate terms</span>
        </label>

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleComplete} disabled={!agreed || saving}
          className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50">
          {saving ? "Setting up..." : "Launch programme →"}
        </motion.button>
      </motion.div>
    </div>
  );
}
