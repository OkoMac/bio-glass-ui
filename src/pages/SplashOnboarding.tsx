import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEMO_ACCOUNTS, BioUser, UserRole,
  signInWithEmail, signUpWithEmail, signInWithGoogle,
} from "@/lib/auth";
import { ShieldCheck, Briefcase, User, Building2, Eye, EyeOff, Loader2 } from "lucide-react";

type OnboardingStep = {
  type: "default" | "flow";
  headline: string;
  sub: string;
  emoji?: string;
  flow?: Array<{ icon: string; label: string; desc: string }>;
};

const onboardingSteps: OnboardingStep[] = [
  {
    type: "default",
    headline: "All your health &\nwellness needs.",
    sub: "Health. Beauty. Medical. Professional. All in one place — for individuals, teams, and providers.",
    emoji: "🌟",
  },
  {
    type: "flow",
    headline: "Companies fund\nyour wellness.",
    sub: "Your employer loads your BIONWallet. You choose where to spend it across any service on BION.",
    flow: [
      { icon: "🏢", label: "Corporate", desc: "Funds BIONWallet" },
      { icon: "👤", label: "Employee", desc: "Books services" },
      { icon: "🩺", label: "Provider", desc: "Delivers care" },
    ],
  },
  {
    type: "default",
    headline: "Book any certified\nwellness provider.",
    sub: "Doctors, trainers, therapists, nutritionists — browse, book, and track progress all in one place.",
    emoji: "🤝",
  },
  {
    type: "flow",
    headline: "One network.\nEveryone wins.",
    sub: "Providers grow their practice. Companies cut sick days. Employees thrive.",
    flow: [
      { icon: "🏢", label: "Corporate", desc: "Reduces sick days" },
      { icon: "👤", label: "Employee", desc: "Thrives & performs" },
      { icon: "🩺", label: "Provider", desc: "Grows practice" },
    ],
  },
];

type Phase = "splash" | "onboarding" | "role" | "auth";
type AuthMode = "signin" | "signup";

const ROLE_OPTIONS = [
  { role: "client"    as UserRole, label: "I'm a Client",       desc: "Discover and book health, beauty & wellness services",  icon: User,        color: "#6366F1" },
  { role: "provider"  as UserRole, label: "I'm a Provider",     desc: "Manage your bookings, clients and services",            icon: Briefcase,   color: "#2DD4BF" },
  { role: "corporate" as UserRole, label: "Corporate Wellness", desc: "Manage employee wellness budgets and track engagement", icon: Building2,   color: "#F59E0B" },
  { role: "admin"     as UserRole, label: "Platform Admin",     desc: "Manage providers, clients and platform settings",       icon: ShieldCheck, color: "#F05A28" },
];

const ROLE_HOME: Record<UserRole, string> = {
  client: "/", provider: "/pro/dashboard", admin: "/admin/dashboard", corporate: "/corporate/dashboard",
};

const ONBOARDING_ROUTES: Record<UserRole, string> = {
  client: "/onboarding/client",
  provider: "/onboarding/provider",
  corporate: "/onboarding/corporate",
  admin: "/onboarding/admin",
};

export default function SplashOnboarding() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phase, setPhase]               = useState<Phase>("splash");
  const [progress, setProgress]         = useState(0);
  const [currentStep, setCurrentStep]   = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode]         = useState<AuthMode>("signin");
  const [name,     setName]             = useState("");
  const [email,    setEmail]            = useState("");
  const [password, setPassword]         = useState("");
  const [showPw,   setShowPw]           = useState(false);
  const [error,    setError]            = useState("");
  const [busy,     setBusy]             = useState(false);

  // Splash loader
  useEffect(() => {
    if (phase !== "splash") return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setTimeout(() => setPhase("onboarding"), 300); return 100; }
        return p + 2.5;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Auth handlers ────────────────────────────────────────────────
  const handleAuth = async () => {
    if (!selectedRole) return;
    setError("");

    if (authMode === "signup" && !name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim() || !password.trim())     { setError("Please fill in all fields."); return; }

    setBusy(true);

    if (authMode === "signup") {
      const { user, error: err } = await signUpWithEmail(email.trim(), password, name.trim(), selectedRole);
      if (err || !user) { setError(err ?? "Signup failed"); setBusy(false); return; }
      login(user);
      navigate(ROLE_HOME[selectedRole], { replace: true });
    } else {
      const { user, error: err } = await signInWithEmail(email.trim(), password);
      if (err || !user) { setError(err ?? "Login failed"); setBusy(false); return; }
      login(user);
      navigate(ROLE_HOME[user.role], { replace: true });
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

  // ── Splash screen ────────────────────────────────────────────────
  if (phase === "splash") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center"
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(99,102,241,0.12) 0%, #0A0A0F 65%)" }}>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-7xl font-bold text-foreground tracking-tight">BION</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-base text-foreground/55 mt-3">Every Service. One Platform.</motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="w-32 h-0.5 bg-foreground/10 rounded-full mt-6 overflow-hidden">
          <div className="h-full gradient-indigo rounded-full transition-all" style={{ width: `${progress}%` }} />
        </motion.div>
      </div>
    );
  }

  // ── Onboarding slides ────────────────────────────────────────────
  if (phase === "onboarding") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.06) 0%, #0A0A0F 65%)" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <AnimatePresence mode="wait">
            {(() => {
              const step = onboardingSteps[currentStep];
              return (
                <motion.div key={currentStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="text-center space-y-6 w-full">
                  {step.type === "flow" && step.flow ? (
                    <>
                      <div className="flex items-start justify-center gap-1">
                        {step.flow.map((node, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <motion.div
                              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.12 }}
                              className="flex flex-col items-center gap-2 w-20"
                            >
                              <div className="w-14 h-14 glass-1 rounded-2xl flex items-center justify-center text-2xl border border-white/8">
                                {node.icon}
                              </div>
                              <p className="text-xs font-semibold text-foreground">{node.label}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{node.desc}</p>
                            </motion.div>
                            {i < step.flow!.length - 1 && (
                              <span className="text-indigo text-lg font-bold mt-4 px-0.5">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <h1 className="text-3xl font-bold text-foreground leading-tight whitespace-pre-line">
                        {step.headline}
                      </h1>
                      <p className="text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.sub}</p>
                    </>
                  ) : (
                    <>
                      <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-7xl block">
                        {step.emoji}
                      </motion.span>
                      <h1 className="text-3xl font-bold text-foreground leading-tight whitespace-pre-line">
                        {step.headline}
                      </h1>
                      <p className="text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.sub}</p>
                    </>
                  )}
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
        <div className="px-8 pb-12 space-y-6">
          <div className="flex justify-center gap-2">
            {onboardingSteps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= currentStep ? "w-6 bg-indigo" : "w-1.5 bg-foreground/15"}`} />
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => currentStep < 3 ? setCurrentStep(s => s + 1) : setPhase("role")}
            className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta">
            {currentStep < 3 ? "Continue" : "Get Started"}
          </motion.button>
          {currentStep < 3 && (
            <button onClick={() => setPhase("role")} className="w-full text-center text-sm text-muted-foreground">Skip</button>
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
            <h1 className="text-2xl font-bold text-foreground">Who are you?</h1>
            <p className="text-sm text-muted-foreground mt-1">Select your role to get the right experience</p>
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
          <motion.button whileTap={{ scale: 0.97 }} disabled={!selectedRole}
            onClick={() => selectedRole && setPhase("auth")}
            className="w-full rounded-pill py-4 text-base font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-40">
            Continue →
          </motion.button>
          <div>
            <p className="text-center text-[11px] text-muted-foreground mb-3">Or jump in with a demo account</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {DEMO_ACCOUNTS.map(acc => (
                <div key={acc.role} className="flex flex-col items-center gap-1">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDemoLogin(acc)}
                    className="px-3 py-1.5 glass-1 rounded-pill text-[10px] font-medium text-muted-foreground capitalize hover:text-foreground transition-colors">
                    {acc.role}
                  </motion.button>
                  <button onClick={() => handleDemoOnboarding(acc)}
                    className="text-[9px] text-indigo/60 hover:text-indigo transition-colors leading-none">
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

  // ── Auth form (sign in / sign up) ─────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-end justify-end"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, #0A0A0F 65%)" }}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="w-full glass-2 rounded-t-[2rem] p-6 space-y-4">
        <div className="flex justify-center"><div className="w-8 h-1 rounded-full bg-foreground/20" /></div>

        {/* Header + mode toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {authMode === "signup" ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {authMode === "signup"
                ? <>Joining as <span className="text-indigo font-medium capitalize">{selectedRole}</span></>
                : "Sign in to continue"
              }
            </p>
          </div>
          <button onClick={() => setPhase("role")} className="text-xs text-muted-foreground underline">
            Change role
          </button>
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

        {error && <p className="text-xs text-coral px-1">{error}</p>}

        <div className="space-y-3">
          {authMode === "signup" && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" type="text"
              className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5" />
          )}
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
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAuth} disabled={busy}
          className="w-full rounded-pill py-4 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center justify-center gap-2 disabled:opacity-60">
          {busy
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {authMode === "signup" ? "Creating account…" : "Signing in…"}</>
            : authMode === "signup" ? "Get Started" : "Sign In"
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

        {/* Demo shortcuts */}
        <div className="pt-1">
          <p className="text-center text-[11px] text-muted-foreground mb-3">Quick demo access</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {DEMO_ACCOUNTS.map(acc => (
              <div key={acc.role} className="flex flex-col items-center gap-1">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDemoLogin(acc)}
                  className="px-3 py-1.5 glass-1 rounded-pill text-[10px] font-medium text-muted-foreground capitalize hover:text-foreground transition-colors">
                  {acc.role}
                </motion.button>
                <button onClick={() => handleDemoOnboarding(acc)}
                  className="text-[9px] text-indigo/60 hover:text-indigo transition-colors leading-none">
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
