import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { Heart, Sparkles, Search, Calendar, BarChart3, MessageCircle, ArrowRight } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export default function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [inviter, setInviter] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (!code) return;
    // Resolve the referral code to get the inviter's name
    fetch(`${API}/api/referrals/resolve?code=${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then(d => {
        if (d?.ok && d.ranger) setInviter({ name: d.ranger.name });
        else if (d?.ok && d.name) setInviter({ name: d.name });
      })
      .catch(() => {});
    // Store referral code for attribution on signup
    try { localStorage.setItem("bion_ref_code", code); } catch {}
  }, [code]);

  const firstName = inviter?.name?.split(" ")[0] ?? "Someone";

  const options = [
    {
      emoji: "🔍",
      title: "Browse providers near me",
      desc: "Find gyms, spas, doctors & more",
      action: () => navigate("/directory"),
    },
    {
      emoji: "💼",
      title: "I'm a provider — grow my business",
      desc: "Get bookings, manage clients, earn more",
      action: () => navigate(`/welcome?ref=${code}`),
    },
    {
      emoji: "📱",
      title: "Sign up and explore",
      desc: "Free account, no commitment",
      action: () => navigate(`/welcome?ref=${code}`),
    },
  ];

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6 text-center"
      >
        <img src="/bion-logo-white-sm.png" alt="BION" className="h-16 mx-auto" />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {inviter ? `${firstName} invited you!` : "You've been invited!"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {inviter
              ? `${firstName} thinks you'd love BION — Africa's health, wellness & beauty marketplace.`
              : "Join BION — Africa's health, wellness & beauty marketplace."}
          </p>
        </div>

        {/* What is BION */}
        <GlassCard className="p-5 text-left space-y-3">
          <h2 className="text-sm font-semibold text-teal">What is BION?</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            BION connects you with 5,000+ verified health, beauty & wellness providers.
            Book sessions, track your health, earn rewards — all in one place.
            Commit to yourself.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { icon: Search, label: "5,000+ providers" },
              { icon: Calendar, label: "Instant booking" },
              { icon: Heart, label: "Health tracking" },
              { icon: Sparkles, label: "AI-powered B_" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <f.icon className="w-3 h-3 text-indigo" />
                {f.label}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Options */}
        <div className="space-y-2">
          {options.map((opt, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={opt.action}
              className="w-full glass-1 rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-2xl">{opt.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{opt.title}</p>
                <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        {/* WhatsApp B_ */}
        <a
          href="https://wa.me/27647432005?text=Hi%20B_%2C%20I%20was%20invited%20to%20BION.%20Tell%20me%20more!"
          target="_blank"
          className="block w-full rounded-pill py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" /> Chat with B_ on WhatsApp
        </a>

        <p className="text-[10px] text-muted-foreground">
          POPIA compliant · Your data is protected · South Africa
        </p>
      </motion.div>
    </div>
  );
}
