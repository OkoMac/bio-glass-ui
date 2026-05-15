import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);

  // Supabase sets a session when the user clicks the reset link.
  // We need to wait for the auth state change event to confirm the session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any /* TODO(types) */) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
      }
    });

    // Also check if we already have a session
    supabase.auth.getSession().then(({ data: { session } }: any /* TODO(types) */) => {
      if (session) setSessionReady(true);
    });

    // If no session after 8 seconds, the link is expired or invalid
    const timeout = setTimeout(() => {
      setSessionReady(prev => {
        if (!prev) setLinkExpired(true);
        return prev;
      });
    }, 8000);

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleReset = async () => {
    setError("");
    if (!password.trim() || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(updateErr.message);
      } else {
        setSuccess(true);
        // Sign out after password change so old sessions are invalidated
        setTimeout(() => {
          supabase.auth.signOut().catch((err) => console.warn("[ResetPassword] signOut failed:", err?.message));
        }, 1500);
      }
    } catch (err: any /* TODO(types) */) {
      setError(err?.message ?? "Could not update password.");
    }
    setBusy(false);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex items-center justify-center px-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-2 rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-teal" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Password updated</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your password has been changed successfully. Sign in with your new password.
          </p>
          <button
            onClick={() => navigate("/welcome?login=true", { replace: true })}
            className="w-full rounded-pill py-3 text-sm font-semibold gradient-indigo text-primary-foreground"
          >
            Sign in
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian flex items-center justify-center px-6"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-2 rounded-3xl p-8 max-w-sm w-full space-y-4">
        <img src="/bion-logo-white-sm.png" alt="BION" className="h-8 w-auto" />
        <h2 className="text-xl font-bold text-foreground">Set a new password</h2>
        <p className="text-sm text-muted-foreground">
          {sessionReady
            ? "Choose a new password for your BION account."
            : linkExpired
              ? "This reset link has expired or is invalid."
              : "Verifying your reset link..."}
        </p>

        {!sessionReady && !linkExpired && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-indigo" />
          </div>
        )}

        {linkExpired && (
          <div className="space-y-3 text-center">
            <p className="text-xs text-coral">
              Please request a new password reset link from the sign-in page.
            </p>
            <button
              onClick={() => navigate("/welcome?login=true")}
              className="w-full rounded-pill py-3 text-sm font-semibold gradient-indigo text-primary-foreground"
            >
              Back to sign in
            </button>
          </div>
        )}

        {sessionReady && (
          <>
            {error && <p className="text-xs text-coral">{error}</p>}
            <div className="relative">
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password (8+ chars)"
                type={showPw ? "text" : "password"}
                className="w-full glass-1 rounded-xl px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <input
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Confirm new password"
              type={showPw ? "text" : "password"}
              onKeyDown={e => e.key === "Enter" && handleReset()}
              className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleReset}
              disabled={busy}
              className="w-full rounded-pill py-4 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                : "Update password"
              }
            </motion.button>
          </>
        )}

        <button
          onClick={() => navigate("/welcome?login=true")}
          className="w-full text-center text-xs text-muted-foreground underline"
        >
          Back to sign in
        </button>
      </motion.div>
    </div>
  );
}
