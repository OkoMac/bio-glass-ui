/**
 * Admin step-up MFA frontend (QA audit A2-11, 2026-04-29).
 *
 * Sensitive admin endpoints now respond 401 { code: "mfa_required" } when
 * the caller hasn't completed an MFA challenge in the last 15 min. This
 * hook provides a wrapper fetch (`mfaProtectedFetch`) that:
 *   1. Calls the URL.
 *   2. If response is 401 with code "mfa_required" → renders the MFA
 *      modal, requests a fresh code (delivered via WhatsApp / email),
 *      collects the 6-digit OTP, verifies, and retries the original
 *      call once on success.
 *   3. Returns the final response (after retry) to the caller. Callers
 *      treat it as a normal fetch.
 *
 * Wrap your admin page in <AdminMfaProvider> and call useAdminMfa().mfaProtectedFetch
 * instead of fetch.
 */

import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

interface AdminMfaContext {
  mfaProtectedFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}
const Ctx = createContext<AdminMfaContext | null>(null);

export function useAdminMfa() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminMfa must be used inside <AdminMfaProvider>");
  return ctx;
}

export function AdminMfaProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"sending" | "enter" | "verifying">("sending");
  const [channel, setChannel] = useState<"whatsapp" | "email" | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Resolver for the in-flight retry promise — set when the wrapper
  // detects an mfa_required response, called when the user finishes
  // verifying so the wrapper knows to retry.
  const [resolver, setResolver] = useState<((ok: boolean) => void) | null>(null);

  const fetchAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }, []);

  const requestCode = useCallback(async () => {
    setStage("sending");
    setError(null);
    try {
      const auth = await fetchAuthHeaders();
      const res = await fetch(`${API}/api/admin/mfa/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Could not start MFA");
      setChannel(j.channel);
      setStage("enter");
    } catch (err: any) {
      setError(err.message ?? "Could not send code");
      setStage("enter");
    }
  }, [fetchAuthHeaders]);

  const verify = useCallback(async () => {
    if (!code.trim() || code.trim().length < 4) { setError("Enter the 6-digit code"); return; }
    setStage("verifying");
    setError(null);
    try {
      const auth = await fetchAuthHeaders();
      const res = await fetch(`${API}/api/admin/mfa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ code: code.trim() }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error ?? "Verification failed");
      // Success — close modal, resolve the pending retry.
      setOpen(false);
      setCode("");
      resolver?.(true);
      setResolver(null);
    } catch (err: any) {
      setError(err.message ?? "Verification failed");
      setStage("enter");
    }
  }, [code, fetchAuthHeaders, resolver]);

  const cancel = useCallback(() => {
    setOpen(false);
    setCode("");
    setError(null);
    resolver?.(false);
    setResolver(null);
  }, [resolver]);

  // Auto-request a code as soon as the modal opens.
  useEffect(() => {
    if (open && stage === "sending") {
      void requestCode();
    }
  }, [open, stage, requestCode]);

  const mfaProtectedFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      // First attempt — caller's headers untouched.
      const first = await fetch(input, init);
      if (first.status !== 401) return first;
      let body: any = null;
      try { body = await first.clone().json(); } catch { /* */ }
      if (body?.code !== "mfa_required") return first;

      // Open modal, wait for verification.
      setStage("sending");
      setError(null);
      setOpen(true);
      const verified = await new Promise<boolean>((resolve) => setResolver(() => resolve));
      if (!verified) {
        toast.error("MFA cancelled — action not completed.");
        return first;
      }
      // Retry once with the same headers — backend now sees a fresh
      // verified_at on admin_mfa_challenges and lets it through.
      return fetch(input, init);
    },
    [],
  );

  return (
    <Ctx.Provider value={{ mfaProtectedFetch }}>
      {children}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={cancel} className="fixed inset-0 bg-obsidian/80 z-[200]" />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto w-full max-w-sm rounded-3xl p-6"
                style={{ background: "rgba(12,12,20,0.97)", backdropFilter: "blur(60px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-teal" />
                    <h3 className="text-lg font-bold text-foreground">Admin verification</h3>
                  </div>
                  <button onClick={cancel} aria-label="Cancel"
                    className="w-8 h-8 glass-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {stage === "sending" && (
                  <div className="py-6 text-center">
                    <Loader2 className="w-6 h-6 text-teal mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-muted-foreground">Sending verification code…</p>
                  </div>
                )}

                {stage === "enter" && (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">
                      A 6-digit code was sent to your verified {channel === "email" ? "email" : "phone (WhatsApp)"}.
                      Enter it to authorise this action.
                    </p>
                    <input
                      autoFocus
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onKeyDown={e => { if (e.key === "Enter") void verify(); }}
                      placeholder="000000"
                      className="w-full px-4 py-3 glass-1 rounded-xl text-2xl text-center font-data tracking-[0.4em] text-foreground placeholder:text-muted-foreground/40 outline-none border border-white/08 focus:border-teal/40 transition-colors mb-3"
                    />
                    {error && <p className="text-xs text-coral mb-3 text-center">{error}</p>}
                    <div className="flex gap-2">
                      <button onClick={cancel}
                        className="flex-1 py-2.5 rounded-pill glass-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                        Cancel
                      </button>
                      <button onClick={() => void verify()} disabled={code.length < 6}
                        className="flex-1 py-2.5 rounded-pill text-xs font-semibold text-white bg-gradient-to-r from-teal to-emerald-400 disabled:opacity-40">
                        Verify
                      </button>
                    </div>
                    <button onClick={() => void requestCode()}
                      className="w-full mt-3 text-[10px] text-muted-foreground hover:text-teal">
                      Resend code
                    </button>
                  </>
                )}

                {stage === "verifying" && (
                  <div className="py-6 text-center">
                    <Loader2 className="w-6 h-6 text-teal mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-muted-foreground">Verifying…</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
