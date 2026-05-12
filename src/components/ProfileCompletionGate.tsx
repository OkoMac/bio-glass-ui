import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

// Mark per-session that we've already decremented the grace counter so a
// React re-mount doesn't burn through the budget. Cleared on signout.
const SESSION_KEY = "bion_completion_grace_decremented_at";

interface Props {
  children: ReactNode;
}

interface CompletenessData {
  complete: boolean;
  missing: string[];
  gracesRemaining: number;
  hardBlocked: boolean;
}

const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: "ZA", name: "South Africa" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "BW", name: "Botswana" },
  { code: "NA", name: "Namibia" },
  { code: "MZ", name: "Mozambique" },
  { code: "LS", name: "Lesotho" },
  { code: "SZ", name: "Eswatini" },
  { code: "KE", name: "Kenya" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "TZ", name: "Tanzania" },
  { code: "UG", name: "Uganda" },
  { code: "RW", name: "Rwanda" },
  { code: "ET", name: "Ethiopia" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "AU", name: "Australia" },
  { code: "OTHER", name: "Other" },
];

const NAME_REGEX = /^\p{L}[\p{L}\s'-]{1,59}$/u;

const SKIP_PATHS = [
  "/welcome",
  "/login",
  "/logout",
  "/signout",
  "/legal/",
  "/onboarding/",
  "/reset-password",
];

/**
 * ProfileCompletionGate — KYC fallback. If a user signed up before the
 * stricter signup schema (or via OAuth without a name) they may be
 * sitting in the app with garbage / missing legal name, no DOB, and no
 * country. This gate enforces the rule:
 *   • Soft block: first 3 logins after the gate ships, modal is
 *     dismissable but warns "X logins left before you must complete".
 *   • Hard block: after the soft window expires, modal can't be closed
 *     until the user posts a passing /me/complete.
 * Once the user submits, the backend stamps profile_completed_at and the
 * gate stops firing for them.
 */
export default function ProfileCompletionGate({ children }: Props) {
  const { user, updateProfileFields } = useAuth();
  const location = useLocation();

  const [checked, setChecked]   = useState(false);
  const [data, setData]         = useState<CompletenessData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  // DOB stored as YYYY-MM-DD for backend compat, composed from three
  // separate selects so the user picks a year directly instead of
  // tapping the month-arrow 40+ times in iOS Safari's calendar picker.
  const [dobDay, setDobDay]       = useState("");
  const [dobMonth, setDobMonth]   = useState("");
  const [dobYear, setDobYear]     = useState("");
  const dob =
    dobYear && dobMonth && dobDay
      ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`
      : "";
  const [country, setCountry]     = useState("ZA");

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch {
      return localStorage.getItem("sb-access-token") ?? null;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setChecked(true);
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        setChecked(true);
        return;
      }
      const res = await fetch(`${API}/api/profiles/me/completeness`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok && json.data) {
        const d: CompletenessData = json.data;
        setData(d);
        if (!d.complete) {
          // Decrement grace once per session if still in soft window.
          // Stamp sessionStorage BEFORE the fetch — React StrictMode +
          // dev HMR + iOS Safari background-tab can fire this effect
          // twice in parallel, which without the pre-stamp would burn
          // 2 grace per page load (Oko hit grace=0 in 2 visits).
          const sessionStamp = sessionStorage.getItem(SESSION_KEY);
          if (!sessionStamp && d.gracesRemaining > 0 && !d.hardBlocked) {
            sessionStorage.setItem(SESSION_KEY, String(Date.now()));
            fetch(`/_proxy/api/profiles/me/decrement-grace`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {/* swallow — gate still works */});
          }
          setOpen(true);
        }
      }
    } catch {
      // Network error — fail open; we'd rather not lock users out on a blip
    } finally {
      setChecked(true);
    }
  }, [user, getToken]);

  useEffect(() => { refresh(); }, [refresh]);

  // Pre-fill what we already have so users only fill gaps.
  useEffect(() => {
    if (!user) return;
    const existingName = (user.name ?? "").trim();
    if (existingName && NAME_REGEX.test(existingName)) {
      const [first, ...rest] = existingName.split(/\s+/);
      setFirstName(first ?? "");
      setLastName(rest.join(" "));
    }
  }, [user]);

  const skipPath = SKIP_PATHS.some(p => location.pathname.startsWith(p));

  if (!user || skipPath || !checked) return <>{children}</>;
  if (!data || data.complete) return <>{children}</>;

  // Soft-block (dismissable) until grace runs out.
  const hardBlock = data.hardBlocked;
  if (!hardBlock && dismissed) return <>{children}</>;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!NAME_REGEX.test(fn)) {
      setError("First name: use letters, spaces, hyphens, or apostrophes only — no digits or symbols.");
      return;
    }
    if (!NAME_REGEX.test(ln)) {
      setError("Last name: use letters, spaces, hyphens, or apostrophes only — no digits or symbols.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setError("Please enter your date of birth (YYYY-MM-DD).");
      return;
    }
    const dobDate = new Date(dob + "T00:00:00Z");
    const cutoff = new Date();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
    if (Number.isNaN(dobDate.getTime()) || dobDate.getTime() > cutoff.getTime()) {
      setError("You must be at least 18 years old to use BION.");
      return;
    }
    if (!/^[A-Z]{2}$/.test(country)) {
      setError("Please pick a country.");
      return;
    }

    setSubmitting(true);
    // 15s safety timeout — if the iOS Safari fetch silently hangs (a
    // known quirk on cellular + cross-origin POSTs) the user gets a
    // real error message instead of an indefinite "Saving…".
    const ctrl = new AbortController();
    const timeoutHandle = setTimeout(() => ctrl.abort(), 15_000);
    try {
      const token = await getToken();
      if (!token) {
        setError("Please sign in again.");
        return;
      }
      // iOS Safari hangs on this cross-origin POST roughly 1 in 5 attempts —
      // the request never leaves the device, no preflight is logged backend-side.
      // Lee Grant burned through 3 grace logins on it (2026-05-08). Routing the
      // same call through the same-origin Vercel rewrite (/api/relay/...) avoids
      // the cross-origin path entirely on the browser side; Vercel's edge does
      // the cross-origin hop server-side where the bug doesn't manifest.
      const res = await fetch(`/_proxy/api/profiles/me/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: fn,
          lastName: ln,
          dateOfBirth: dob,
          country,
        }),
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        // Sync the AuthContext cached user.name immediately. Without
        // this, the header / settings / dashboard kept showing the
        // old (or empty) name until the next visibility-change refetch
        // — which made the user think the save didn't take.
        const fullName = `${fn} ${ln}`.trim();
        try { await updateProfileFields({ name: fullName }); } catch { /* */ }
        setData({ complete: true, missing: [], gracesRemaining: 0, hardBlocked: false });
        setOpen(false);
      } else {
        // Surface the actual server error + status code — silent
        // "Saving…" was hiding real backend rejections (e.g. invalid
        // payload, expired session, validation failures).
        setError(json.error ?? `Server returned ${res.status}. Please try again.`);
      }
    } catch (err: any) {
      // Print to console so support can ask the user to share devtools
      // output; show the user a concrete message rather than a generic
      // "network error" so they know whether to retry, refresh, or
      // contact support.
      // eslint-disable-next-line no-console
      console.error("[ProfileCompletionGate] save failed:", err);
      const reason =
        err?.name === "AbortError" ? "Request timed out after 15s. Please check your connection and try again." :
        err?.message               ? `Network error: ${err.message}` :
                                     "Network error. Please check your connection and try again.";
      setError(reason);
    } finally {
      clearTimeout(timeoutHandle);
      setSubmitting(false);
    }
  };

  return (
    <>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-obsidian/90 backdrop-blur-xl p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Complete your profile"
          onKeyDown={(e) => { if (hardBlock && e.key === "Escape") e.stopPropagation(); }}
        >
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md glass-2 rounded-2xl p-6 space-y-4 border border-white/[0.08] max-h-[90vh] overflow-y-auto"
          >
            <div className="w-14 h-14 rounded-full bg-indigo/20 flex items-center justify-center mx-auto">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-indigo" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-foreground">
                {hardBlock ? "Please complete your profile" : "Finish setting up your account"}
              </h2>
              <p className="text-sm text-muted-foreground">
                BION needs your legal name, date of birth, and country to comply with KYC and POPIA.
              </p>
              {!hardBlock && (
                <p className="text-xs text-amber-400/90">
                  You have <strong>{data.gracesRemaining}</strong> {data.gracesRemaining === 1 ? "login" : "logins"} left before this becomes required.
                </p>
              )}
              {hardBlock && (
                <p className="text-xs text-rose-400/90">
                  Your soft-block window has ended. You'll need to complete this to continue.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="pcg-first">Legal first name</label>
                <input
                  id="pcg-first"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/10 focus:border-indigo/50 outline-none"
                  placeholder="As it appears on your ID"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="pcg-last">Legal last name</label>
                <input
                  id="pcg-last"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/10 focus:border-indigo/50 outline-none"
                  placeholder="As it appears on your ID"
                  autoComplete="family-name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="pcg-dob-day">Date of birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    id="pcg-dob-day"
                    aria-label="Day"
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value)}
                    className="glass-1 rounded-lg px-2 py-2 text-sm text-foreground border border-white/10 focus:border-indigo/50 outline-none"
                    required
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d)}>{d}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Month"
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    className="glass-1 rounded-lg px-2 py-2 text-sm text-foreground border border-white/10 focus:border-indigo/50 outline-none"
                    required
                  >
                    <option value="">Month</option>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                      <option key={m} value={String(i + 1)}>{m}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Year"
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    className="glass-1 rounded-lg px-2 py-2 text-sm text-foreground border border-white/10 focus:border-indigo/50 outline-none"
                    required
                  >
                    <option value="">Year</option>
                    {(() => {
                      const now = new Date().getUTCFullYear();
                      // 18+ required (validated below); show 13+ to keep
                      // the same control reusable if minimum age ever drops.
                      const max = now - 13;
                      const min = now - 100;
                      const years: number[] = [];
                      for (let y = max; y >= min; y--) years.push(y);
                      return years.map((y) => (
                        <option key={y} value={String(y)}>{y}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1" htmlFor="pcg-country">Country</label>
                <select
                  id="pcg-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full glass-1 rounded-lg px-3 py-2 text-sm text-foreground border border-white/10 focus:border-indigo/50 outline-none"
                  required
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-400 px-2 py-2 rounded bg-rose-500/10 border border-rose-500/20">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {!hardBlock && (
                <button
                  type="button"
                  onClick={() => { setDismissed(true); setOpen(false); }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 transition-colors disabled:opacity-50"
                 title="Remind me later" aria-label="Remind me later">
                  Remind me later
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo text-white hover:bg-indigo/90 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save and continue"}
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground/70 text-center pt-1">
              POPIA §27(1)(b): we keep this information confidential and only use it for identity, payouts, and compliance.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
