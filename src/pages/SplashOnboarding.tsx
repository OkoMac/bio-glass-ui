import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePageView } from "@/hooks/usePageView";
import { supabase } from "@/integrations/supabase/client";
import {
  capturePendingReferralCode, recordReferralSignup,
  getStoredRefCode, setStoredRefCode, clearStoredRefCode,
} from "@/lib/referral";
import {
  getStoredCrefCode, setStoredCrefCode, clearStoredCrefCode,
} from "@/lib/clientReferral";
import {
  DEMO_ACCOUNTS, BioUser, UserRole,
  signInWithEmail, signUpWithEmail, signInWithGoogle,
} from "@/lib/auth";
import { Briefcase, User, Building2, TrendingUp, Eye, EyeOff, Loader2 } from "lucide-react";

type OnboardingStep = {
  type: "default" | "flow";
  headline: string;
  sub: string;
  emoji?: string;
  flow?: Array<{ icon: string; label: string; desc: string }>;
};

// Billboard screens — 3 screens, no scrolling, one message each (per Master Spec)
const onboardingSteps: OnboardingStep[] = [
  {
    type: "default",
    headline: "Your health.\nYour wellness.\nYour way.",
    sub: "Book providers. Track your body. Earn as you go.",
    emoji: "🌟",
    flow: [
      { icon: "🏋", label: "Fitness & gyms", desc: "" },
      { icon: "💆", label: "Beauty & wellness", desc: "" },
      { icon: "🩺", label: "Medical & health", desc: "" },
      { icon: "🧘", label: "Mental wellness", desc: "" },
    ],
  },
  {
    type: "default",
    headline: "We're not a directory.",
    sub: "We're a full wellness platform.",
    emoji: "🚀",
    flow: [
      { icon: "💰", label: "BIONWallet", desc: "pay once, use anywhere on BION" },
      { icon: "🏆", label: "BIONPoints", desc: "earn rewards on every session" },
      { icon: "📊", label: "Free health tools", desc: "BMI, calories, sleep, more" },
    ],
  },
  {
    type: "default",
    headline: "Free wellness tools.\nPowered by BION.",
    sub: "BMI calculator. Calorie tracker. Sleep & water logs. Sign up to start tracking — it's free.",
    emoji: "🧰",
    flow: [
      { icon: "📐", label: "BMI Calculator", desc: "check your body mass index instantly" },
      { icon: "🍎", label: "Calorie Tracker", desc: "log meals with AI photo recognition" },
      { icon: "💧", label: "Water Intake", desc: "stay hydrated, build streaks" },
      { icon: "🌙", label: "Sleep Quality", desc: "monitor patterns & improve rest" },
    ],
  },
];

type Phase = "splash" | "onboarding" | "role" | "auth" | "terms" | "email-sent" | "forgot-password" | "forgot-password-sent";
type AuthMode = "signin" | "signup" | "login";

const ROLE_OPTIONS = [
  { role: "client"    as UserRole, label: "I'm looking for services",    desc: "Book health, beauty & wellness providers",              icon: User,        color: "#6366F1" },
  { role: "provider"  as UserRole, label: "I'm a service provider",     desc: "Manage your bookings, clients and services",            icon: Briefcase,   color: "#2DD4BF" },
  { role: "corporate" as UserRole, label: "I'm setting up for my company", desc: "Manage employee wellness budgets and track engagement", icon: Building2, color: "#F59E0B" },
  { role: "sales_rep" as UserRole, label: "I'm a BION Ranger",          desc: "Earn commissions by signing up providers (invite only)", icon: TrendingUp,  color: "#10B981" },
];

const ROLE_HOME: Record<UserRole, string> = {
  client: "/home", provider: "/pro/dashboard", admin: "/admin/dashboard", corporate: "/corporate/dashboard", sales_rep: "/rep/dashboard",
};

const ONBOARDING_ROUTES: Record<UserRole, string> = {
  client: "/onboarding/client",
  provider: "/onboarding/provider",
  corporate: "/onboarding/corporate",
  admin: "/onboarding/admin",
  sales_rep: "/rep/agreement",
};

export default function SplashOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  usePageView();

  // Ranger share-link state — populated from the ?ref=<CODE> query param
  // and persisted to localStorage so it survives OAuth redirects + tab
  // switches. Badge is shown above the signup form when resolved.
  const [rangerRef, setRangerRef] = useState<{
    code: string;
    name: string | null;
    resolved: boolean;
  } | null>(() => {
    const stored = getStoredRefCode();
    return stored ? { code: stored, name: null, resolved: false } : null;
  });

  // Client-to-client referral (the R5.80/mo Premium commission flow) lives
  // on ?cref=<CODE> and is completely independent of the Ranger ?ref= link.
  const [clientRef, setClientRef] = useState<{
    code: string;
    firstName: string | null;
    resolved: boolean;
  } | null>(() => {
    const stored = getStoredCrefCode();
    return stored ? { code: stored, firstName: null, resolved: false } : null;
  });

  // Returning visitors skip the splash + onboarding carousel and land directly
  // on the role/auth picker. Flag is set as soon as the splash animation
  // completes for the first time — no user action required.
  const hasSeenIntro = (() => {
    try { return localStorage.getItem("bion_seen_intro") === "1"; } catch { return false; }
  })();

  // If the user is already signed in, /welcome is a dead-end — send them
  // straight to their role home. Wait for auth to resolve first so we don't
  // fire a premature redirect during an OAuth return handshake.
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const home =
        user.role === "admin"     ? "/admin/dashboard"     :
        user.role === "provider"  ? "/pro/dashboard"       :
        user.role === "corporate" ? "/corporate/dashboard" :
        user.role === "sales_rep" ? "/rep/dashboard"       :
        "/home";
      navigate(home, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // ── Ranger share-link capture ───────────────────────────────────────
  // Read ?ref=<CODE> from the URL. If present:
  //   1. Persist to localStorage (survives OAuth + tab switches)
  //   2. Fire a single /api/referrals/click (guarded by sessionStorage
  //      so React StrictMode double-mounts don't duplicate rows)
  //   3. Resolve the Ranger's name for the signup badge
  useEffect(() => {
    const urlCode = (searchParams.get("ref") ?? "").trim().toUpperCase();
    const utmSource = searchParams.get("utm_source") ?? undefined;
    const code = urlCode || getStoredRefCode();
    if (!code) return;

    // Persist new codes. If an existing stored code is overwritten by a
    // fresh URL param, the fresh one wins — the user just clicked it.
    if (urlCode) setStoredRefCode(urlCode);

    setRangerRef(prev => prev && prev.code === code ? prev : { code, name: null, resolved: false });

    const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

    // Click logging — de-dupe via sessionStorage so StrictMode's double
    // effect fire can't double-insert. Keyed by code so a Ranger hopping
    // between share links still gets each hit logged once per session.
    const clickKey = `bion_ref_clicked_${code}`;
    if (urlCode && typeof window !== "undefined" && !sessionStorage.getItem(clickKey)) {
      sessionStorage.setItem(clickKey, "1");
      fetch(`${API}/api/referrals/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, utm_source: utmSource }),
      }).catch(() => {/* best-effort */});
    }

    // Resolve Ranger name for the badge
    fetch(`${API}/api/referrals/resolve?code=${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then(data => {
        if (data?.ok && data.ranger) {
          setRangerRef({ code, name: data.ranger.name ?? null, resolved: true });
          // Pre-fill the manual referral code field too, so the legacy
          // user-to-user flow still awards points when the ref'er is a
          // regular user rather than a Ranger.
          setReferralCode(code);
        } else {
          setRangerRef({ code, name: null, resolved: true });
        }
      })
      .catch(() => setRangerRef({ code, name: null, resolved: true }));

    // ── Client-to-client share-link capture (separate ?cref param) ──
    const urlCref = (searchParams.get("cref") ?? "").trim().toUpperCase();
    const crefCode = urlCref || getStoredCrefCode();
    if (crefCode) {
      if (urlCref) setStoredCrefCode(urlCref);
      setClientRef(prev => prev && prev.code === crefCode
        ? prev
        : { code: crefCode, firstName: null, resolved: false });

      const crefClickKey = `bion_cref_clicked_${crefCode}`;
      if (urlCref && typeof window !== "undefined" && !sessionStorage.getItem(crefClickKey)) {
        sessionStorage.setItem(crefClickKey, "1");
        fetch(`${API}/api/referrals/client/click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: crefCode, utm_source: utmSource }),
        }).catch(() => {/* best-effort */});
      }

      fetch(`${API}/api/referrals/client/resolve?code=${encodeURIComponent(crefCode)}`)
        .then(r => r.json())
        .then(data => {
          if (data?.ok && data.referrer) {
            setClientRef({ code: crefCode, firstName: data.referrer.first_name ?? null, resolved: true });
          } else {
            setClientRef({ code: crefCode, firstName: null, resolved: true });
          }
        })
        .catch(() => setClientRef({ code: crefCode, firstName: null, resolved: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginDirect = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("login") === "true";
  // Returning users (redirected from auth guard or password reset) skip straight to auth
  const [phase, setPhase]               = useState<Phase>(loginDirect ? "auth" : hasSeenIntro ? "role" : "splash");
  const [progress, setProgress]         = useState(0);
  const [currentStep, setCurrentStep]   = useState(0);
  // Onboarding analytics — track phase transitions
  const trackOnboarding = (step: string) => {
    const API_URL = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
    fetch(`${API_URL}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: `/_onboarding/${step}`, device_type: window.innerWidth < 768 ? "mobile" : "desktop" }),
    }).catch(() => {});
  };

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode]         = useState<AuthMode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email,    setEmail]            = useState("");
  const [password, setPassword]         = useState("");
  const [referralCode, setReferralCode] = useState(() => capturePendingReferralCode() ?? "");
  const [showPw,   setShowPw]           = useState(false);
  const [error,    setError]            = useState("");
  const [busy,     setBusy]             = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // KYC gate state — only used for signup
  const [phone, setPhone] = useState("");
  const [otpStep, setOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [otpChannel, setOtpChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [otpCode, setOtpCode] = useState("");
  // 2026-05-06 KYC at signup — DOB + country are required so new users
  // never hit the ProfileCompletionGate. Existing users still flow
  // through the gate (which captures the same fields post-hoc).
  // ageVerified is now derived from a valid 18+ DOB rather than a checkbox.
  // DOB stored as YYYY-MM-DD for backend compat, composed from three selects
  // so users pick a year directly instead of tapping the month-arrow 40+ times
  // in iOS Safari's calendar picker. Same pattern as ProfileCompletionGate.
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const dob =
    dobYear && dobMonth && dobDay
      ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`
      : "";
  const [country, setCountry] = useState("ZA");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

  // Splash loader — hard-coded timeout keeps users unblocked even if interval stalls
  useEffect(() => {
    if (phase !== "splash") return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 2.5;
      });
    }, 20);
    // Bulletproof fallback: move past the splash after 1.5s no matter what.
    // Set `bion_seen_intro` here too — if the user reaches this point once,
    // they should never see the intro carousel again on any future visit.
    const fallback = setTimeout(() => {
      try { localStorage.setItem("bion_seen_intro", "1"); } catch {}
      trackOnboarding("screen1_view");
      setPhase("onboarding");
    }, 1500);
    return () => { clearInterval(interval); clearTimeout(fallback); };
  }, [phase]);

  // ── Auth handlers ────────────────────────────────────────────────

  /** Normalise a user-entered SA phone to the E.164 format we store. */
  const normalizePhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("27") && digits.length === 11) return "+" + digits;
    if (digits.startsWith("0")  && digits.length === 10) return "+27" + digits.slice(1);
    if (digits.length === 9)                              return "+27" + digits;
    return raw.startsWith("+") ? raw : "+" + digits;
  };

  /** Step 1 of signup: precheck (duplicate block) + send OTP. */
  const startSignup = async () => {
    setError("");
    if (!selectedRole) { setError("Please go back and select how you'll use BION."); return; }
    if (!firstName.trim() || firstName.trim().length < 2)  { setError("Please enter your first name (at least 2 characters)."); return; }
    if (!lastName.trim() || lastName.trim().length < 2)   { setError("Please enter your last name (at least 2 characters)."); return; }
    if (!email.trim())    { setError("Please enter your email."); return; }
    if (!password.trim() || password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!phone.trim())    { setError("Please enter your mobile number — we'll send a verification code."); return; }
    // KYC at signup — DOB + country are required (2026-05-06).
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) { setError("Please enter your date of birth."); return; }
    {
      const dobDate = new Date(dob + "T00:00:00Z");
      const cutoff = new Date();
      cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
      if (Number.isNaN(dobDate.getTime()) || dobDate.getTime() > cutoff.getTime()) {
        setError("You must be at least 18 years old to use BION.");
        return;
      }
    }
    if (!/^[A-Z]{2}$/.test(country)) { setError("Please pick your country."); return; }
    const normPhone = normalizePhone(phone.trim());
    if (!/^\+27[0-9]{9}$/.test(normPhone)) { setError("Enter a valid SA mobile number (e.g. 072 688 4826)."); return; }

    setBusy(true);
    try {
      // Gate 1: duplicate phone/email block
      const pcRes = await fetch(`${API}/api/kyc/signup/precheck`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normPhone, email: email.trim().toLowerCase() }),
      });
      const pc = await pcRes.json();
      if (!pc.ok) {
        if (pc.duplicatePhone) setError("This mobile number already has an account. Try signing in instead.");
        else if (pc.duplicateEmail) setError("This email already has an account. Try signing in instead.");
        else setError(pc.error ?? "Couldn't verify your details.");
        setBusy(false);
        return;
      }

      // Gate 2: send OTP to the phone
      const otpRes = await fetch(`${API}/api/kyc/phone/send-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normPhone, email: email.trim(), purpose: "signup" }),
      });
      const otp = await otpRes.json();
      if (!otp.ok) { setError(otp.error ?? "Couldn't send verification code."); setBusy(false); return; }
      setOtpChannel(otp.channel ?? "whatsapp");
      setOtpStep("sent");
    } catch (err: any) {
      setError(err.message ?? "Network error.");
    }
    setBusy(false);
  };

  /** Step 2 of signup: verify OTP → create the actual Supabase auth user. */
  const completeSignup = async () => {
    setError("");
    if (!selectedRole) return;
    if (!otpCode.trim() || otpCode.trim().length !== 6) { setError("Enter the 6-digit code we sent."); return; }

    setBusy(true);
    try {
      const normPhone = normalizePhone(phone.trim());
      const vRes = await fetch(`${API}/api/kyc/phone/verify-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normPhone, code: otpCode.trim() }),
      });
      const v = await vRes.json();
      if (!v.ok) { setError(v.error ?? "Invalid code."); setBusy(false); return; }

      // OTP verified — NOW create the Supabase account (email pre-confirmed via backend)
      const { user, error: err } = await signUpWithEmail(
        email.trim(), password,
        `${firstName.trim()} ${lastName.trim()}`.trim(),
        selectedRole, phone.trim(), true,  // ageVerified=true — confirmed via DOB cutoff above
        dob, country,
      );
      if (err || !user) { setError(err ?? "Signup failed"); setBusy(false); return; }

      // Attach the verified phone + DOB + country to the profile.
      // Server-side signup also writes DOB/country, but we run a defensive
      // update here in case the user later changes them in Settings.
      try {
        await supabase.from("profiles").update({
          phone: normPhone,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
          date_of_birth: dob,
          country,
          age_verified: true,
          profile_completed_at: new Date().toISOString(),
        }).eq("user_id", user.id!);
      } catch {/* non-fatal */}

      if (referralCode.trim() && user.profileId && selectedRole === "client") {
        recordReferralSignup(referralCode.trim().toUpperCase(), user.profileId).catch(() => {});
      }

      // Ranger attribution — best-effort, never blocks signup completion.
      // Backend enforces idempotency, role check, and self-referral guard.
      const storedRef = getStoredRefCode();
      if (storedRef && user.profileId) {
        fetch(`${API}/api/referrals/attribute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: storedRef, profileId: user.profileId }),
        })
          .then(r => r.json())
          .then(() => clearStoredRefCode())
          .catch(() => {/* keep the code around; retry next time */});
      }

      // Client-to-client referral attribution (?cref). Runs alongside the
      // Ranger attribution — both can fire for the same signup.
      const storedCref = getStoredCrefCode();
      if (storedCref && user.profileId) {
        fetch(`${API}/api/referrals/client/attribute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: storedCref, profileId: user.profileId }),
        })
          .then(r => r.json())
          .then(() => clearStoredCrefCode())
          .catch(() => {/* best-effort */});
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("");
        setBusy(false);
        setPhase("email-sent");
        return;
      }
      trackOnboarding(`signup_complete_${selectedRole}`);
      login({ ...user, phone: normPhone, phoneVerified: true } as any);
      navigate(ROLE_HOME[selectedRole], { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Couldn't complete signup.");
    }
    setBusy(false);
  };

  const handleAuth = async () => {
    if (authMode === "signup") {
      if (otpStep === "idle")   return startSignup();
      if (otpStep === "sent")   return completeSignup();
      return;
    }
    // Sign in path — no OTP required for existing users.
    // Role selection is NOT required for sign-in — the DB has the real role.
    setError("");
    if (!email.trim() && !password.trim()) { setError("Enter your email and password to sign in."); return; }
    if (!email.trim())    { setError("Enter the email you signed up with."); return; }
    if (!password.trim()) { setError("Enter your password."); return; }
    setBusy(true);
    try {
      const { user: signedInUser, error: err } = await signInWithEmail(email.trim(), password);
      if (err || !signedInUser) {
        // Map Supabase / backend error strings to actionable messages.
        // Generic "Login failed" doesn't help the user fix it — they need
        // to know specifically what's wrong AND what to do about it
        // (verify email, reset password, sign up).
        const raw = (err ?? "").toLowerCase();
        let friendly = "Couldn't sign you in. Please try again or contact support@bionhealth.co.za.";
        if (/invalid login|invalid credentials|incorrect|wrong password/.test(raw)) {
          friendly = "Email or password is incorrect. Double-check, or tap 'Forgot password' below.";
        } else if (/not confirmed|email not verified|email_not_confirmed|verify.*email/.test(raw)) {
          friendly = "Your email isn't verified yet. Check your inbox for the verification link — or tap 'Resend' below.";
        } else if (/user not found|no user|no account/.test(raw)) {
          friendly = "We don't have an account with that email. Tap 'Sign Up' above to create one.";
        } else if (/rate limit|too many|429/.test(raw)) {
          friendly = "Too many attempts. Wait a minute and try again.";
        } else if (/network|fetch|connection|timeout|offline/.test(raw)) {
          friendly = "Connection problem. Check your internet and try again.";
        } else if (err) {
          // Last-resort: surface the raw message so the user can copy
          // it into a support ticket instead of seeing a black box.
          friendly = `Couldn't sign you in: ${err}`;
        }
        setError(friendly);
        setBusy(false);
        return;
      }
      login(signedInUser);
      navigate(ROLE_HOME[signedInUser.role], { replace: true });
    } catch (e: any) {
      setError(`Something went wrong: ${e?.message ?? "unknown error"}. Please try again or email support@bionhealth.co.za.`);
    }
    setBusy(false);
  };

  const handleDemoLogin = (account: BioUser) => {
    login(account);
    navigate(ROLE_HOME[account.role], { replace: true });
  };

  const handleDemoOnboarding = (account: BioUser) => {
    login(account);
    navigate(ONBOARDING_ROUTES[account.role], { replace: true });
  };

  const handleForgotPassword = async () => {
    setForgotError("");
    if (!forgotEmail.trim()) { setForgotError("Please enter your email address."); return; }
    setForgotBusy(true);
    try {
      const res = await fetch(`${API}/api/account/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (json.ok) {
        setPhase("forgot-password-sent");
      } else {
        setForgotError(json.error ?? "Could not send reset link.");
      }
    } catch {
      setForgotError("Network error. Please try again.");
    }
    setForgotBusy(false);
  };

  // ── Splash screen ────────────────────────────────────────────────
  if (phase === "splash") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center"
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(99,102,241,0.12) 0%, #0A0A0F 65%)" }}>
        {/* Plain img + animated-via-CSS so the splash can never get stuck
            waiting on framer-motion to kick off. */}
        <img src="/bion-logo-white.png" alt="BION"
          className="h-32 md:h-48 w-auto animate-[fadeInUp_0.5s_ease-out_forwards]" />
        <p className="text-base text-foreground/55 mt-3 opacity-0 animate-[fadeIn_0.5s_ease-out_0.3s_forwards]">
          Commit to yourself.
        </p>
        <div className="w-32 h-0.5 bg-foreground/10 rounded-full mt-6 overflow-hidden opacity-0 animate-[fadeIn_0.5s_ease-out_0.6s_forwards]">
          <div className="h-full gradient-indigo rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ── Onboarding slides ────────────────────────────────────────────
  if (phase === "onboarding") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.06) 0%, #0A0A0F 65%)" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8">
          <AnimatePresence mode="wait">
            {(() => {
              const step = onboardingSteps[currentStep];
              return (
                <motion.div key={currentStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="text-center space-y-5 w-full max-w-sm mx-auto">
                  {/* Billboard: emoji/icon → headline → subtitle → category pills */}
                  <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-5xl block">
                    {step.emoji}
                  </motion.span>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight whitespace-pre-line">
                    {step.headline}
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.sub}</p>
                  {step.flow && (
                    <div className="space-y-2.5 text-left pt-2">
                      {step.flow.map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3 glass-1 rounded-xl px-4 py-3 border border-white/5">
                          <span className="text-xl shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{item.label}</p>
                            {item.desc && <p className="text-xs text-muted-foreground">{item.desc}</p>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
        <div className="px-4 md:px-8 pb-12 space-y-6">
          <div className="flex justify-center gap-2">
            {onboardingSteps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= currentStep ? "w-6 bg-indigo" : "w-1.5 bg-foreground/15"}`} />
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (currentStep < onboardingSteps.length - 1) {
                trackOnboarding(`screen${currentStep + 2}_view`);
                setCurrentStep(s => s + 1);
                return;
              }
              trackOnboarding("role_selector_view");
              try { localStorage.setItem("bion_seen_intro", "1"); } catch {}
              setPhase("role");
            }}
            className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta">
            {currentStep < onboardingSteps.length - 1 ? "Next →" : "Let's go →"}
          </motion.button>
          {currentStep < onboardingSteps.length - 1 && (
            <button
              onClick={() => {
                try { localStorage.setItem("bion_seen_intro", "1"); } catch {}
                setPhase("role");
              }}
              className="w-full text-center text-sm text-muted-foreground"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Role selection ────────────────────────────────────────────────
  if (phase === "role") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center px-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">How are you using BION?</h1>
            <p className="text-sm text-muted-foreground mt-1">Choose your path.</p>
          </div>
          <div className="space-y-3">
            {ROLE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <motion.button key={opt.role} whileTap={{ scale: 0.97 }} onClick={() => setSelectedRole(opt.role)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                    selectedRole === opt.role ? "border-indigo/40 bg-indigo/8" : "border-white/5 glass-1"
                  }`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${opt.color}20`, color: opt.color }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                  </div>
                  {selectedRole === opt.role && (
                    <div className="w-5 h-5 rounded-full gradient-indigo flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Tools preview — showcase what's behind the signup */}

          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">
              Free tools included with your account
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "BMI Calculator", desc: "Check your body mass index", color: "from-indigo-500/20 to-violet-500/10", icon: "📐" },
                { label: "Calorie Tracker", desc: "Log meals with AI photos", color: "from-emerald-500/20 to-teal-500/10", icon: "🍎" },
                { label: "Water Intake", desc: "Track hydration & streaks", color: "from-blue-500/20 to-cyan-500/10", icon: "💧" },
                { label: "Sleep Quality", desc: "Monitor sleep patterns", color: "from-purple-500/20 to-pink-500/10", icon: "🌙" },
              ].map((tool) => (
                <div key={tool.label} className={`rounded-xl p-3 text-center bg-gradient-to-br ${tool.color} border border-white/5`}>
                  <span className="text-xl block mb-1">{tool.icon}</span>
                  <p className="text-xs font-semibold text-foreground">{tool.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} disabled={!selectedRole}
            onClick={() => { if (selectedRole) { trackOnboarding(`role_selected_${selectedRole}`); setPhase("auth"); } }}
            className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-40">
            Continue →
          </motion.button>
          <div>
            <p className="text-center text-[11px] text-muted-foreground mb-3">Or jump in with a demo account</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {DEMO_ACCOUNTS.map(acc => (
                <div key={acc.role} className="flex flex-col items-center gap-1">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDemoLogin(acc)}
                    className="px-3 py-2.5 glass-1 rounded-pill text-[11px] md:text-xs font-medium text-muted-foreground capitalize hover:text-foreground transition-colors">
                    {acc.role.replace(/_/g, " ")}
                  </motion.button>
                  <button onClick={() => handleDemoOnboarding(acc)}
                    className="text-[10px] text-indigo/60 hover:text-indigo transition-colors leading-none py-1">
                    ↗ onboarding
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Terms of Service ───────────────────────────────────────────────
  if (phase === "terms") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 md:px-8 py-12 space-y-6">
          <button onClick={() => setPhase("auth")} className="text-sm text-muted-foreground py-2">← Back to signup</button>
          <img src="/bion-logo-white-sm.png" alt="BION" className="h-8 md:h-12 w-auto" />
          <h1 className="text-2xl font-bold text-foreground">Terms of Service & Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: April 2026</p>

          {[
            { title: "1. Introduction & Acceptance", text: "These Terms of Service ('Terms') constitute a legally binding agreement between you and BION (Pty) Ltd ('BION', 'we', 'us') governing your use of the BION platform, mobile application, and related services. By creating an account, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you may not access or use the platform. These Terms are governed by the laws of the Republic of South Africa." },
            { title: "2. Electronic Communications & Transactions Act (ECTA)", text: "In compliance with the Electronic Communications and Transactions Act 25 of 2002 (ECTA), Section 43: BION (Pty) Ltd is a South African registered entity. The platform is accessible at bionhealth.co.za. For queries, contact support@bion.app. All electronic transactions conducted through the platform are legally valid and binding in terms of ECTA. You consent to receiving communications electronically, including confirmations, invoices, and notices." },
            { title: "3. Platform Description & Disclaimer", text: "BION is a digital marketplace connecting clients with 13,300+ independent health, beauty, and wellness service providers across Johannesburg, Pretoria, Cape Town and Durban. Features include 1-on-1 bookings, group classes & workshops, recurring sessions, package deals, gift vouchers (R250-R1,000+), telehealth video consultations (Jitsi Meet), walk-in queue management, calorie photo analysis, medical card, BioPoints loyalty, affiliate programme and corporate wellness budgets. BION acts solely as an intermediary facilitator. BION does NOT provide healthcare, medical advice, beauty treatments, fitness training, or any direct services. BION does NOT employ, control, or supervise service providers listed on the platform. Each provider is an independent contractor solely responsible for their services, qualifications, licensing, and compliance with applicable laws." },
            { title: "4. User Eligibility & Accounts", text: "You must be at least 18 years of age and legally capable of entering into binding contracts under South African law. You must provide accurate, current, and complete information during registration. You are solely responsible for maintaining the confidentiality of your account credentials. You are liable for all activity conducted under your account. BION reserves the right to suspend or terminate accounts at any time for any violation of these Terms." },
            { title: "5. Fees, Payments & Financial Terms", text: "Client Booking Fee: 5% of the service price is charged to clients on each booking — applies to 1-on-1, group bookings, packages, gift vouchers, telehealth and walk-in sessions (3.5% for Premium subscribers at R29/month). Provider Platform Fee: 5% of the service price is deducted from provider earnings. A further 5% is ring-fenced as an acquisition-marketing contribution to the provider's own voucher pool. Provider net payout: 90% of the bill. Wallet Cash-out: 10% fee, minimum R200. Cancellation Policy: client cancels 24h+ before = full refund to wallet; client cancels <24h = 50% fee; provider cancels = full client refund + 10% fee from provider wallet + cancellation strike. Reschedule free up to 3 times. Subscriptions: Client Premium R29/month, Provider Pro R499/month, Provider Elite R999/month. Featured Listing / Spotlight: R199-R599 for enhanced visibility. All payments are processed through Paystack (PCI DSS Level 1), a licensed payment service provider. BION does not hold client or provider funds — Paystack manages settlement. All prices are in South African Rand (ZAR) and inclusive of VAT where applicable." },
            { title: "6. Indemnification", text: "You agree to indemnify, defend, and hold harmless BION, its directors, officers, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including legal fees) arising out of or relating to: (a) your use of or inability to use the platform; (b) any services received from providers through the platform; (c) any violation of these Terms; (d) any violation of applicable law; (e) any dispute between you and a service provider. This indemnification obligation survives termination of your account and these Terms." },
            { title: "7. Limitation of Liability", text: "TO THE MAXIMUM EXTENT PERMITTED BY SOUTH AFRICAN LAW: BION shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, goodwill, or business opportunities. BION's total aggregate liability shall not exceed the total fees paid by you to BION in the twelve (12) months preceding the claim. BION is not liable for: the quality, safety, or legality of any services provided by providers; the truth or accuracy of provider listings; the ability of providers to perform services; any injury, illness, death, or damage resulting from services booked through the platform; any loss or damage to personal property; service provider cancellations, no-shows, or delays." },
            { title: "8. Assumption of Risk", text: "You acknowledge that health, beauty, fitness, and wellness services carry inherent risks including but not limited to physical injury, allergic reactions, and adverse outcomes. You voluntarily assume all risks associated with using services booked through BION. You acknowledge that BION has no obligation to verify provider qualifications (though we endeavour to do so) and that you should independently verify provider credentials before receiving services, particularly medical services." },
            { title: "9. Privacy & Data Protection (POPIA)", text: "BION complies with the Protection of Personal Information Act 4 of 2013 (POPIA). We act as the 'responsible party' for platform data and as an 'operator' when processing data on behalf of providers. We collect and process personal information solely for: providing platform services, processing payments, improving user experience, and communicating with you. Your rights under POPIA include: the right to access your personal information (POPIA data export), the right to correction of inaccurate information, the right to deletion of your information, the right to object to processing, the right to lodge a complaint with the Information Regulator. Security measures: AES-256 encryption for health data at rest, OTP brute-force protection, rate limiting on all endpoints, admin 2FA, admin audit trail, terms versioning. We do not sell personal information to third parties. Data may be shared with Supabase (database), Paystack (payments), Google (authentication, Places API), Jitsi Meet/8x8 (telehealth video — end-to-end encrypted, no recordings stored), and OpenAI (B_ AI assistant — minimum context, no model training) as necessary service providers. Food images submitted for calorie estimation are processed by OpenAI and are not stored — images are analysed and immediately discarded. Health data including routines, medication schedules, biometrics from Health Connect / Apple HealthKit, telehealth session metadata and treatment plan check-ins are classified as special personal information under POPIA Section 26 and are processed only with your explicit consent." },
            { title: "10. Provider Obligations", text: "Providers listed on BION represent and warrant that: they hold all necessary licences, permits, and professional registrations required by South African law; medical providers comply with HPCSA/SANC registration requirements; they carry appropriate professional indemnity insurance where required; all information provided is accurate and current; they comply with the Consumer Protection Act 68 of 2008; they will not discriminate against clients. Failure to comply may result in immediate account suspension or termination." },
            { title: "11. Dispute Resolution", text: "Any dispute arising from these Terms or use of the platform shall first be submitted to informal negotiation between the parties. If unresolved within 30 days, disputes shall be submitted to mediation in Pretoria, Gauteng. If mediation fails, disputes shall be resolved by arbitration under the Arbitration Act 42 of 1965. The language of all proceedings shall be English. Nothing in this clause prevents either party from seeking urgent interim relief from a court of competent jurisdiction." },
            { title: "12. Intellectual Property", text: "The BION name, logo, design, software, and all associated intellectual property are owned by BION (Pty) Ltd. You may not copy, modify, distribute, or create derivative works based on BION's intellectual property without prior written consent. User-generated content (reviews, profile information) remains your property, but you grant BION a non-exclusive, worldwide licence to use it for platform purposes." },
            { title: "13. Termination", text: "Either party may terminate the account relationship at any time. BION may immediately suspend or terminate your account for violation of these Terms, fraudulent activity, or harmful conduct. Upon termination: outstanding payments will be processed; provider payouts for completed sessions will be honoured; your personal data will be handled in accordance with POPIA; you may request data export before account deletion." },
            { title: "14. Consumer Protection Act", text: "In compliance with the Consumer Protection Act 68 of 2008: you have the right to fair and honest dealing; you have the right to adequate disclosure of information; cooling-off periods may apply to certain electronic transactions; unfair contract terms may be declared void by a court." },
            { title: "15. Force Majeure", text: "BION shall not be liable for any failure or delay in performing obligations due to circumstances beyond its reasonable control, including but not limited to: natural disasters, pandemics, government actions, internet or telecommunications failures, power outages, or cyberattacks." },
            { title: "16. Amendments", text: "BION reserves the right to modify these Terms at any time. Material changes will be communicated via email or in-app notification at least 14 days before taking effect. Continued use of the platform after the effective date constitutes acceptance of the updated Terms. If you disagree with any changes, you must discontinue use of the platform." },
            { title: "17. Severability", text: "If any provision of these Terms is found to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect." },
            { title: "18. Entire Agreement", text: "These Terms, together with the Privacy Policy and any applicable service-specific terms (Provider Agreement, Sales Representative Agreement, Corporate Wellness Agreement), constitute the entire agreement between you and BION." },
          ].map((section) => (
            <div key={section.title} className="glass-1 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">{section.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{section.text}</p>
            </div>
          ))}

          <div className="glass-1 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Contact</h3>
            <p className="text-xs text-muted-foreground">For questions about these terms, contact support@bion.app</p>
          </div>

          <button onClick={() => { setAcceptedTerms(true); setPhase("auth"); }}
            className="w-full rounded-pill py-4 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta">
            I Accept — Continue to Sign Up
          </button>
        </div>
      </div>
    );
  }

  // ── Email confirmation sent ──────────────────────────────────────
  if (phase === "email-sent") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex items-center justify-center px-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-2 rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">📧</div>
          <h2 className="text-xl font-bold text-foreground">Check your email</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
            Click the link to activate your account, then come back here to sign in.
          </p>
          <button
            onClick={() => { setAuthMode("signin"); setPhase("auth" as Phase); }}
            className="w-full rounded-pill py-3 text-sm font-semibold gradient-indigo text-primary-foreground"
          >
            I've confirmed — Sign In
          </button>
          <button
            onClick={() => setPhase("auth" as Phase)}
            className="text-xs text-muted-foreground underline"
          >
            Back to login
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Forgot password form ──────────────────────────────────────────
  if (phase === "forgot-password") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex items-center justify-center px-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-2 rounded-3xl p-8 max-w-sm w-full space-y-4">
          <h2 className="text-xl font-bold text-foreground">Reset your password</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enter the email address you signed up with and we'll send you a link to reset your password.
          </p>
          {forgotError && <p className="text-xs text-coral">{forgotError}</p>}
          <input
            value={forgotEmail}
            onChange={e => setForgotEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
            className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleForgotPassword}
            disabled={forgotBusy}
            className="w-full rounded-pill py-4 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {forgotBusy
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              : "Send reset link"
            }
          </motion.button>
          <button
            onClick={() => { setForgotError(""); setPhase("auth"); }}
            className="w-full text-center text-xs text-muted-foreground underline"
          >
            Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Forgot password confirmation ────────────────────────────────
  if (phase === "forgot-password-sent") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex items-center justify-center px-6"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-2 rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">✉️</div>
          <h2 className="text-xl font-bold text-foreground">Check your email</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If an account exists for <strong className="text-foreground">{forgotEmail}</strong>,
            we've sent a password reset link. Click the link in the email to set a new password.
          </p>
          <button
            onClick={() => { setAuthMode("signin"); setPhase("auth"); }}
            className="w-full rounded-pill py-3 text-sm font-semibold gradient-indigo text-primary-foreground"
          >
            Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Auth form (sign in / sign up) ─────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-end justify-end overflow-y-auto"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="w-full glass-2 rounded-t-[2rem] p-6 space-y-4 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-center"><div className="w-8 h-1 rounded-full bg-foreground/20" /></div>

        {/* Header + mode toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {authMode === "signup" ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {authMode === "signup"
                ? selectedRole
                  ? <>Joining as <span className="text-indigo font-medium capitalize">{selectedRole.replace(/_/g, " ")}</span></>
                  : "Choose a role to get started"
                : "Sign in to continue"
              }
            </p>
          </div>
          {authMode === "signup" && (
            <button onClick={() => setPhase("role")} className="text-xs text-muted-foreground underline">
              Change role
            </button>
          )}
        </div>

        {/* Sign in / Sign up toggle */}
        <div className="glass-1 rounded-pill p-1 flex">
          {(["signin", "signup"] as AuthMode[]).map(m => (
            <button key={m} onClick={() => { setAuthMode(m); setError(""); }}
              className={`flex-1 rounded-pill py-2 text-sm font-medium transition-all ${
                authMode === m ? "gradient-indigo text-primary-foreground" : "text-muted-foreground"
              }`}>
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Ranger referral badge — shown when arriving via ?ref=<CODE>.
            We display it for both signup and signin so the user knows
            their link worked, but attribution only runs on signup. */}
        {rangerRef && authMode === "signup" && (
          <div className="glass-1 border border-emerald-400/20 rounded-xl px-3 py-2.5">
            <p className="text-xs text-foreground leading-relaxed">
              <span className="text-emerald-400 font-semibold">🤝 </span>
              {rangerRef.name
                ? <>You're joining via <span className="font-semibold text-foreground">{rangerRef.name}</span>'s link — they'll receive a commission on your subscription. You pay nothing extra.</>
                : rangerRef.resolved
                  ? <>Referral code <span className="font-mono text-emerald-400">{rangerRef.code}</span> applied.</>
                  : <>Checking referral code <span className="font-mono text-emerald-400">{rangerRef.code}</span>…</>
              }
            </p>
          </div>
        )}

        {/* Client-to-client referral badge — separate from the Ranger one. */}
        {clientRef && authMode === "signup" && (
          <div className="glass-1 border border-teal/30 rounded-xl px-3 py-2.5">
            <p className="text-xs text-foreground leading-relaxed">
              <span className="text-teal font-semibold">👋 </span>
              {clientRef.firstName
                ? <>Invited by <span className="font-semibold text-foreground">{clientRef.firstName}</span> — they'll earn R5.80/month when you go Premium.</>
                : clientRef.resolved
                  ? <>Friend code <span className="font-mono text-teal">{clientRef.code}</span> applied.</>
                  : <>Checking friend code <span className="font-mono text-teal">{clientRef.code}</span>…</>
              }
            </p>
          </div>
        )}

        {error && <p className="text-xs text-coral px-1">{error}</p>}

        <div className="space-y-3">
          {authMode === "signup" && otpStep === "idle" && (
            <>
              <div className="flex gap-3">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" type="text"
                  className="flex-1 glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5" />
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" type="text"
                  className="flex-1 glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5" />
              </div>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email"
                className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5" />
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password (8+ chars)" type={showPw ? "text" : "password"}
                  onKeyDown={e => e.key === "Enter" && handleAuth()}
                  className="w-full glass-1 rounded-xl px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password.length > 0 && (() => {
                const s = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 3
                  : password.length >= 8 && (/[A-Z]/.test(password) || /[0-9]/.test(password)) ? 2
                  : password.length >= 8 ? 1 : 0;
                const labels = ["Too short", "Weak", "Good", "Strong"];
                const colors = ["bg-red-500", "bg-amber", "bg-teal", "bg-teal"];
                return (
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${colors[s]}`} style={{ width: `${((s + 1) / 4) * 100}%` }} />
                    </div>
                    <span className={`text-[10px] ${s >= 2 ? "text-teal" : s === 1 ? "text-amber" : "text-red-400"}`}>{labels[s]}</span>
                  </div>
                );
              })()}
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Mobile number (e.g. 072 123 4567)" type="tel"
                className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5" />
              <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
                We'll send a 6-digit verification code via WhatsApp. Used for account recovery and booking confirmations.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] text-muted-foreground px-1 mb-1">Date of birth</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      aria-label="Day"
                      value={dobDay}
                      onChange={(e) => setDobDay(e.target.value)}
                      className="glass-1 rounded-xl px-2 py-3 text-sm text-foreground outline-none border border-white/5"
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
                      className="glass-1 rounded-xl px-2 py-3 text-sm text-foreground outline-none border border-white/5"
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
                      className="glass-1 rounded-xl px-2 py-3 text-sm text-foreground outline-none border border-white/5"
                    >
                      <option value="">Year</option>
                      {(() => {
                        const now = new Date().getUTCFullYear();
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
                <div className="flex-1">
                  <label className="block text-[10px] text-muted-foreground px-1 mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground outline-none border border-white/5"
                  >
                    <option value="ZA">South Africa</option>
                    <option value="ZW">Zimbabwe</option>
                    <option value="BW">Botswana</option>
                    <option value="NA">Namibia</option>
                    <option value="MZ">Mozambique</option>
                    <option value="LS">Lesotho</option>
                    <option value="SZ">Eswatini</option>
                    <option value="KE">Kenya</option>
                    <option value="NG">Nigeria</option>
                    <option value="GH">Ghana</option>
                    <option value="EG">Egypt</option>
                    <option value="MA">Morocco</option>
                    <option value="TZ">Tanzania</option>
                    <option value="UG">Uganda</option>
                    <option value="RW">Rwanda</option>
                    <option value="ET">Ethiopia</option>
                    <option value="GB">United Kingdom</option>
                    <option value="US">United States</option>
                    <option value="AU">Australia</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/80 px-1 leading-relaxed">
                You must be at least 18 years old. POPIA &amp; FICA require this for payouts and identity.
              </p>
              {selectedRole === "client" && (
                <div>
                  <input value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Referral code (optional)" type="text" maxLength={20}
                    className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5" />
                  {referralCode && (
                    <p className="text-[10px] text-teal mt-1 px-1">✓ You'll get 50 BION points on signup</p>
                  )}
                </div>
              )}
            </>
          )}
          {authMode === "signup" && otpStep === "sent" && (
            <>
              <div className="glass-1 rounded-xl px-4 py-3 text-xs text-muted-foreground">
                {otpChannel === "email" ? (
                  <>We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span> (via email). Check your inbox and spam folder.</>
                ) : (
                  <>We sent a 6-digit code to <span className="text-foreground font-medium">{normalizePhone(phone)}</span> via WhatsApp. Enter it below to finish.</>
                )}
              </div>
              <input value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code" inputMode="numeric" maxLength={6}
                onKeyDown={e => e.key === "Enter" && handleAuth()}
                className="w-full glass-1 rounded-xl px-4 py-3 text-center text-lg font-data tracking-widest text-foreground placeholder:text-muted-foreground outline-none border border-white/5" />
              <div className="flex justify-center gap-4">
                <button type="button"
                  onClick={() => { setOtpStep("idle"); setOtpCode(""); setError(""); startSignup(); }}
                  className="text-[11px] text-indigo underline">
                  Resend code
                </button>
                <button type="button"
                  onClick={() => { setOtpStep("idle"); setOtpCode(""); setError(""); }}
                  className="text-[11px] text-muted-foreground underline">
                  Use a different number
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">Code sent via WhatsApp or email. Check both.</p>
            </>
          )}
          {authMode === "signin" && (
            <>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email"
                className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5" />
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password" type={showPw ? "text" : "password"}
                  onKeyDown={e => e.key === "Enter" && handleAuth()}
                  className="w-full glass-1 rounded-xl px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setForgotEmail(email); setForgotError(""); setPhase("forgot-password"); }}
                  className="text-xs text-indigo hover:text-indigo/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}
        </div>

        {/* Terms acceptance — signup only */}
        {authMode === "signup" && (
          <label className="flex items-start gap-2.5 cursor-pointer px-1">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-indigo"
            />
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              I agree to BION's{" "}
              <button type="button" onClick={() => setPhase("terms")} className="text-indigo underline">
                Terms of Service
              </button>{" "}
              and{" "}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo underline">
                Privacy Policy
              </a>
              . I understand that BION processes my data in accordance with POPIA.
            </span>
          </label>
        )}

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAuth} disabled={busy || (authMode === "signup" && (!acceptedTerms || !firstName.trim() || firstName.trim().length < 2 || !lastName.trim() || lastName.trim().length < 2 || !email.trim() || password.length < 8 || !phone.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || !/^[A-Z]{2}$/.test(country))) || (authMode === "login" && (!email.trim() || !password.trim()))}
          className="w-full rounded-pill py-4 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center justify-center gap-2 disabled:opacity-60">
          {busy
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {
                authMode === "signup"
                  ? (otpStep === "idle" ? "Sending code…" : "Verifying & creating account…")
                  : "Signing in…"
              }</>
            : authMode === "signup"
              ? (otpStep === "idle" ? "Send verification code" : "Verify & create account")
              : "Sign In"
          }
        </motion.button>

        {/* Google sign-in */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[11px] text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => signInWithGoogle()}
          className="w-full rounded-pill py-3 text-sm font-medium glass-1 border border-white/10 text-foreground flex items-center justify-center gap-2.5 hover:border-white/20 transition-colors"
        >
          {/* Google "G" logo */}
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </motion.button>

        {/* WhatsApp onboarding — alternative to email signup */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[11px] text-muted-foreground">or onboard via WhatsApp</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>
        <a
          href="https://wa.me/27647432005?text=Hi%20B_%2C%20I%20want%20to%20join%20BION"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-pill py-3 text-sm font-medium glass-1 border border-emerald-400/30 text-foreground flex items-center justify-center gap-2.5 hover:border-emerald-400/60 transition-colors"
        >
          {/* WhatsApp icon inline */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor"/>
          </svg>
          Onboard via WhatsApp
        </a>

        {/* Demo shortcuts */}
        <div className="pt-1">
          <p className="text-center text-[11px] text-muted-foreground mb-3">Quick demo access</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {DEMO_ACCOUNTS.map(acc => (
              <div key={acc.role} className="flex flex-col items-center gap-1">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDemoLogin(acc)}
                  className="px-3 py-2.5 glass-1 rounded-pill text-[11px] md:text-xs font-medium text-muted-foreground capitalize hover:text-foreground transition-colors">
                  {acc.role}
                </motion.button>
                <button onClick={() => handleDemoOnboarding(acc)}
                  className="text-[10px] text-indigo/60 hover:text-indigo transition-colors leading-none py-1">
                  ↗ onboarding
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-1">
          POPIA compliant · Your data is protected · South Africa
        </p>
      </motion.div>
    </div>
  );
}
