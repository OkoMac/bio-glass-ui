import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
const CACHE_KEY = "bion_terms_accepted_version";

interface TermsGateProps {
  children: ReactNode;
}

/**
 * TermsGate — wraps authenticated content and ensures the user has accepted
 * the latest Terms of Service version. Shows a blocking modal if not.
 *
 * Caches the accepted version in localStorage to avoid hitting the API on
 * every page load. Clears cache when a new version is detected.
 */
export default function TermsGate({ children }: TermsGateProps) {
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch {
      return localStorage.getItem("sb-access-token") ?? null;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setChecked(true);
      setAccepted(true); // no user = no gate
      return;
    }

    // Check localStorage cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      // Verify it's still the current version by checking /api/terms/current
      fetch(`${API}/api/terms/current`)
        .then(async r => {
          if (!r.ok) throw new Error('terms/current returned ' + r.status);
          return r.json();
        })
        .then(data => {
          if (data.ok && data.version === cached) {
            setAccepted(true);
            setCurrentVersion(data.version);
            setChecked(true);
          } else {
            // Version changed — clear cache and check properly
            localStorage.removeItem(CACHE_KEY);
            setCurrentVersion(data.version ?? null);
            checkAcceptance();
          }
        })
        .catch(() => {
          // Network error — allow through (don't block on API failure)
          setAccepted(true);
          setChecked(true);
        });
      return;
    }

    checkAcceptance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const location = useLocation();
  // Bypass TermsGate for legal pages — users must be able to read terms before accepting them
  if (location.pathname.startsWith('/legal/')) return <>{children}</>;

  const checkAcceptance = async () => {
    try {
      const token = await getToken();
      if (!token) {
        // Can't check without auth — allow through
        setAccepted(true);
        setChecked(true);
        return;
      }

      const res = await fetch(`${API}/api/terms/check`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.warn('[TermsGate] check failed:', res.status);
        // Allow through on error
        setAccepted(true);
        setChecked(true);
        return;
      }
      const data = await res.json();

      if (data.ok) {
        setAccepted(data.accepted);
        setCurrentVersion(data.currentVersion);
        if (data.accepted) {
          localStorage.setItem(CACHE_KEY, data.currentVersion);
        }
      } else {
        // API error — allow through
        setAccepted(true);
      }
    } catch {
      // Network error — allow through (don't block user on transient failure)
      setAccepted(true);
    } finally {
      setChecked(true);
    }
  };

  const handleAccept = async () => {
    if (!currentVersion) return;
    setAccepting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Please sign in again to accept.");
        setAccepting(false);
        return;
      }

      const res = await fetch(`${API}/api/terms/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ version: currentVersion }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('[TermsGate] accept failed:', res.status, text);
        setError(`Server error (${res.status}). Please try again.`);
        setAccepting(false);
        return;
      }
      const data = await res.json();

      if (data.ok) {
        setAccepted(true);
        localStorage.setItem(CACHE_KEY, currentVersion);
      } else {
        setError(data.error ?? "Failed to accept terms. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setAccepting(false);
    }
  };

  // While checking, show nothing (children will render via Suspense fallback)
  if (!checked) return null;

  // User has accepted — render children normally
  if (accepted) return <>{children}</>;

  // Show blocking modal
  return (
    <>
      {children}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-obsidian/90 backdrop-blur-xl p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Terms of Service update"
      >
        <div
          className="w-full max-w-md glass-2 rounded-2xl p-6 space-y-5 border border-white/[0.08]"
          onKeyDown={(e) => {
            // Prevent Escape from dismissing — must accept
            if (e.key === "Escape") e.stopPropagation();
          }}
        >
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-indigo/20 flex items-center justify-center mx-auto">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-indigo" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold text-foreground">
              We've updated our Terms of Service
            </h2>
            <p className="text-sm text-muted-foreground">
              Please review and accept to continue using BION.
            </p>
          </div>

          {/* Link to full terms */}
          <div className="text-center">
            <a
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo hover:text-indigo/80 underline underline-offset-2 transition-colors"
            >
              Read full Terms of Service
            </a>
          </div>

          {error && (
            <p className="text-xs text-coral text-center">{error}</p>
          )}

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-50 transition-opacity"
          >
            {accepting ? "Accepting..." : "I Accept"}
          </button>

          <p className="text-[10px] text-muted-foreground text-center">
            Version {currentVersion}
          </p>
        </div>
      </div>
    </>
  );
}
