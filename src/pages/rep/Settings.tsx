import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import GlassCard from "@/components/GlassCard";
import RepNav from "@/components/RepNav";
import { User, Mail, Phone, MapPin, LogOut, Shield, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { signOutSupabase } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

export default function RepSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const referralCode = localStorage.getItem("bion_rep_referral") ?? "—";

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
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-28">
      <div className="max-w-lg mx-auto pt-8 px-4 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal mx-auto flex items-center justify-center text-2xl font-bold text-obsidian">
            {(user?.name ?? "R")[0].toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-foreground">{user?.name ?? "Sales Rep"}</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-pill bg-emerald-500/20 text-emerald-400 font-semibold">Sales Representative</span>
        </div>

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
