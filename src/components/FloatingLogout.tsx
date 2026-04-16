import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Small always-visible sign-out helper. Shows a pill "Sign out" button in the
 * top-right of every authenticated page so users never get stuck in an
 * account they can't escape from. Hidden on public landing / auth screens.
 */
const HIDDEN_ROUTES = ["/welcome", "/logout", "/signout", "/for-providers", "/for-corporate", "/for-rangers"];

export default function FloatingLogout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Only show when signed in AND not on public pages
  if (!user) return null;
  if (HIDDEN_ROUTES.includes(location.pathname)) return null;
  if (location.pathname.startsWith("/legal")) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await logout(); } catch { /* still redirect */ }
    navigate("/welcome", { replace: true });
  };

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => setConfirmOpen(true)}
        className="fixed top-3 right-3 z-[55] flex items-center gap-1.5 px-3 py-1.5 rounded-pill glass-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors shadow-card"
        aria-label="Sign out of BION"
      >
        <LogOut className="w-3 h-3" />
        <span className="hidden sm:inline">Sign out</span>
      </motion.button>

      <AnimatePresence>
        {confirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !signingOut && setConfirmOpen(false)}
              className="fixed inset-0 bg-obsidian/70 z-[80]"
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div
                className="max-w-sm w-full rounded-3xl p-6 space-y-4 text-center"
                style={{
                  background: "rgba(12,12,20,0.97)",
                  backdropFilter: "blur(60px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <button
                  onClick={() => !signingOut && setConfirmOpen(false)}
                  className="absolute top-4 right-4 w-7 h-7 glass-1 rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <div className="w-14 h-14 rounded-full bg-indigo/15 mx-auto flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-indigo" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Sign out of BION?</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll be returned to the welcome screen.
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full rounded-pill py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50"
                >
                  {signingOut ? "Signing out…" : "Yes, sign me out"}
                </motion.button>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="w-full rounded-pill py-2.5 text-xs font-medium text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
