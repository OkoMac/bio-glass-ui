import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Universal sign-out escape hatch. Browse to /logout from anywhere and we'll
 * clear your session and send you to the welcome page. Useful when you're
 * stuck in a demo account or can't find the Sign Out button.
 */
export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    (async () => {
      try { await logout(); } catch { /* still redirect */ }
      // Small delay so the loader is visible rather than a jarring flash.
      setTimeout(() => navigate("/welcome", { replace: true }), 400);
    })();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo/10 flex items-center justify-center">
          <LogOut className="w-7 h-7 text-indigo" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Signing you out…</h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Taking you back to BION
          </p>
        </div>
      </motion.div>
    </div>
  );
}
