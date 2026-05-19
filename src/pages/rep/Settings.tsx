import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import GlassCard from "@/components/GlassCard";
import RepNav from "@/components/RepNav";
import MyRolesSection from "@/components/MyRolesSection";
import { User, Mail, Phone, LogOut, Shield, Copy, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { signOutSupabase } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

export default function RepSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("—");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch(`${API}/api/rep/agreement/referral-code`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body?.referral_code) {
          setReferralCode(body.referral_code);
        }
      } catch {
        // fallback to localStorage if API is unavailable
        if (!cancelled) {
          const stored = localStorage.getItem("bion_rep_referral");
          if (stored) setReferralCode(stored);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await signOutSupabase();
    localStorage.removeItem("bio_user");
    navigate("/welcome");
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28 relative">
      <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="max-w-lg mx-auto pt-8 px-4 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal mx-auto flex items-center justify-center text-2xl font-bold text-obsidian">
            {(user?.name ?? "R")[0].toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-foreground">{user?.name ?? "Sales Rep"}</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-pill bg-emerald-500/20 text-emerald-400 font-semibold">Sales Representative</span>
        </div>

        {/* My roles — self-service add another role to this account */}
        <MyRolesSection />

        {/* Info */}
        <GlassCard className="divide-y divide-white/[0.06]">
          <div className="flex items-center gap-3 p-4">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="text-sm text-foreground truncate">{user?.email ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p>
              <p className="text-sm text-foreground">Verified</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={handleCopyCode}>
            <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Referral Code</p>
              <p className="text-sm text-foreground font-data">{referralCode}</p>
            </div>
            {copied ? <Check className="w-4 h-4 text-teal" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </div>
        </GlassCard>

        {/* Actions */}
        <GlassCard className="divide-y divide-white/[0.06]">
          <button
            onClick={() => navigate("/rep/agreement")}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
          >
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">View Agreement</span>
          </button>
          <button
            onClick={() => navigate("/bicademy")}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
          >
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Ranger Training</span>
          </button>
        </GlassCard>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full rounded-2xl py-3 text-sm font-medium text-coral glass-1 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
      <RepNav />
    </div>
  );
}
