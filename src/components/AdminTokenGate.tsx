import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import GlassCard from "./GlassCard";
import AdminNav from "./AdminNav";

/**
 * Shared gate for admin pages that need the X-Admin-Token. Shows a
 * loader while useAdminToken is auto-resolving the token from the
 * backend, and only falls back to a manual-paste prompt if the
 * auto-resolve actually failed. Replaces the duplicated inline gate
 * in BInbox / Disputes / Rangers / Tickets / Outreach / Refunds /
 * WhatsApp / ProviderClaims.
 */
export default function AdminTokenGate({ tokenLoading }: { tokenLoading: boolean }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors" title="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…" aria-label="navigate(-1)} className='md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass…">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <AdminNav />
      <div className="max-w-md mx-auto pt-20 px-4">
        {tokenLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Resolving admin session…
          </div>
        ) : (
          <GlassCard className="p-6 space-y-4">
            <h1 className="text-xl font-bold text-foreground">Admin token required</h1>
            <p className="text-xs text-muted-foreground">
              Auto-resolution failed. Paste ADMIN_SETUP_TOKEN to continue, or
              refresh and check that your account has the admin role.
            </p>
            <input
              type="password"
              placeholder="ADMIN_SETUP_TOKEN"
              className="w-full h-10 glass-1 rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) { localStorage.setItem("bion_admin_token", v); location.reload(); }
                }
              }}
              autoFocus
            />
          </GlassCard>
        )}
      </div>
    </div>
  );
}
