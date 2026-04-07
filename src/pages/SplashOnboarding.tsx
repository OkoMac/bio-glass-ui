import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEMO_ACCOUNTS, BioUser, UserRole,
  signInWithEmail, signUpWithEmail, signInWithGoogle,
} from "@/lib/auth";
import { ShieldCheck, Briefcase, User, Building2, TrendingUp, Eye, EyeOff, Loader2 } from "lucide-react";

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

type Phase = "splash" | "onboarding" | "role" | "auth" | "terms";
type AuthMode = "signin" | "signup";

const ROLE_OPTIONS = [
  { role: "client"    as UserRole, label: "I'm a Client",       desc: "Discover and book health, beauty & wellness services",  icon: User,        color: "#6366F1" },
  { role: "provider"  as UserRole, label: "I'm a Provider",     desc: "Manage your bookings, clients and services",            icon: Briefcase,   color: "#2DD4BF" },
  { role: "corporate" as UserRole, label: "Corporate Wellness", desc: "Manage employee wellness budgets and track engagement", icon: Building2,   color: "#F59E0B" },
  { role: "sales_rep" as UserRole, label: "Sales Representative", desc: "Earn commissions by signing up providers to BION",      icon: TrendingUp, color: "#10B981" },
];

const ROLE_HOME: Record<UserRole, string> = {
  client: "/home", provider: "/pro/dashboard", admin: "/admin/dashboard", corporate: "/corporate/dashboard", sales_rep: "/rep/dashboard",
};

const ONBOARDING_ROUTES: Record<UserRole, string> = {
  client: "/onboarding/client",
  provider: "/onboarding/provider",
  corporate: "/onboarding/corporate",
  admin: "/onboarding/admin",
  sales_rep: "/onboarding/client",
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
        <motion.img src="/bion-logo-color.jpg" alt="BION" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="h-16 md:h-20 w-auto" />
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

  // ── Terms of Service ───────────────────────────────────────────────
  if (phase === "terms") {
    return (
      <div className="fixed inset-0 z-[100] bg-obsidian overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-12 space-y-6">
          <button onClick={() => setPhase("auth")} className="text-sm text-muted-foreground">← Back to signup</button>
          <img src="/bion-logo-color.jpg" alt="BION" className="h-8 w-auto" />
          <h1 className="text-2xl font-bold text-foreground">Terms of Service & Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: April 2026</p>

          {[
            { title: "1. Introduction & Acceptance", text: "These Terms of Service ('Terms') constitute a legally binding agreement between you and BION (Pty) Ltd ('BION', 'we', 'us') governing your use of the BION platform, mobile application, and related services. By creating an account, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you may not access or use the platform. These Terms are governed by the laws of the Republic of South Africa." },
            { title: "2. Electronic Communications & Transactions Act (ECTA)", text: "In compliance with the Electronic Communications and Transactions Act 25 of 2002 (ECTA), Section 43: BION (Pty) Ltd is a South African registered entity. The platform is accessible at bion-app.vercel.app. For queries, contact support@bion.app. All electronic transactions conducted through the platform are legally valid and binding in terms of ECTA. You consent to receiving communications electronically, including confirmations, invoices, and notices." },
            { title: "3. Platform Description & Disclaimer", text: "BION is a digital marketplace that connects clients with independent health, beauty, and wellness service providers. BION acts solely as an intermediary facilitator. BION does NOT provide healthcare, medical advice, beauty treatments, fitness training, or any direct services. BION does NOT employ, control, or supervise service providers listed on the platform. Each provider is an independent contractor solely responsible for their services, qualifications, licensing, and compliance with applicable laws." },
            { title: "4. User Eligibility & Accounts", text: "You must be at least 18 years of age and legally capable of entering into binding contracts under South African law. You must provide accurate, current, and complete information during registration. You are solely responsible for maintaining the confidentiality of your account credentials. You are liable for all activity conducted under your account. BION reserves the right to suspend or terminate accounts at any time for any violation of these Terms." },
            { title: "5. Fees, Payments & Financial Terms", text: "Client Booking Fee: 5% of the service price is charged to clients on each booking. Provider Platform Fee: 5% of the service price is deducted from provider earnings. Reduced Fees: Clients on the Premium plan (R99/month) and providers on the Elite plan (R999/month) may qualify for reduced fees of 3.5%. All payments are processed through Paystack, a licensed payment service provider. Providers receive payments directly to their verified bank accounts via Paystack split payments. BION does not hold client or provider funds — Paystack manages settlement. All prices are in South African Rand (ZAR) and inclusive of VAT where applicable." },
            { title: "6. Indemnification", text: "You agree to indemnify, defend, and hold harmless BION, its directors, officers, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including legal fees) arising out of or relating to: (a) your use of or inability to use the platform; (b) any services received from providers through the platform; (c) any violation of these Terms; (d) any violation of applicable law; (e) any dispute between you and a service provider. This indemnification obligation survives termination of your account and these Terms." },
            { title: "7. Limitation of Liability", text: "TO THE MAXIMUM EXTENT PERMITTED BY SOUTH AFRICAN LAW: BION shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, goodwill, or business opportunities. BION's total aggregate liability shall not exceed the total fees paid by you to BION in the twelve (12) months preceding the claim. BION is not liable for: the quality, safety, or legality of any services provided by providers; the truth or accuracy of provider listings; the ability of providers to perform services; any injury, illness, death, or damage resulting from services booked through the platform; any loss or damage to personal property; service provider cancellations, no-shows, or delays." },
            { title: "8. Assumption of Risk", text: "You acknowledge that health, beauty, fitness, and wellness services carry inherent risks including but not limited to physical injury, allergic reactions, and adverse outcomes. You voluntarily assume all risks associated with using services booked through BION. You acknowledge that BION has no obligation to verify provider qualifications (though we endeavour to do so) and that you should independently verify provider credentials before receiving services, particularly medical services." },
            { title: "9. Privacy & Data Protection (POPIA)", text: "BION complies with the Protection of Personal Information Act 4 of 2013 (POPIA). We act as the 'responsible party' for platform data and as an 'operator' when processing data on behalf of providers. We collect and process personal information solely for: providing platform services, processing payments, improving user experience, and communicating with you. Your rights under POPIA include: the right to access your personal information, the right to correction of inaccurate information, the right to deletion of your information, the right to object to processing, the right to lodge a complaint with the Information Regulator. We implement appropriate technical and organisational security measures. We do not sell personal information to third parties. Data may be shared with Supabase (database), Paystack (payments), and Google (authentication) as necessary service providers." },
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
              <button type="button" onClick={() => setPhase("terms")} className="text-indigo underline">
                Privacy Policy
              </button>
              . I understand that BION processes my data in accordance with POPIA.
            </span>
          </label>
        )}

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAuth} disabled={busy || (authMode === "signup" && !acceptedTerms)}
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
