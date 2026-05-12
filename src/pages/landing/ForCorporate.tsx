import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Heart, Shield, Users, BarChart3, Wallet, Lock,
  ArrowRight, Check, X, CheckCircle2, AlertCircle,
} from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import { LandingFooter } from "./ForProviders";

const API_URL = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

/**
 * Public marketing landing page for HR / founders of SA companies with
 * 50–2000 employees. Pitches Corporate Wallet + employee wellness bookings
 * from BION's 900+ verified provider network.
 *
 * Contact form POSTs to /api/corporate/demo-request which emails sales@.
 */
export default function ForCorporate() {
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Corporate wellness for SA teams | BION Corporate";

    const makeMeta = (attr: "name" | "property", key: string, value: string) => {
      const m = document.createElement("meta");
      m.setAttribute(attr, key);
      m.content = value;
      document.head.appendChild(m);
      return m;
    };

    const nodes = [
      makeMeta("name", "description",
        "Give your team wellness as a benefit. BION Corporate: 900+ verified providers, one corporate wallet, pay-per-use. POPIA-compliant, BEE-scorecard friendly."),
      makeMeta("property", "og:title",       "Corporate wellness that actually reaches your team"),
      makeMeta("property", "og:description", "One corporate wallet. 900+ verified providers. Pay per booking. R0 setup."),
      makeMeta("property", "og:type",        "website"),
      makeMeta("property", "og:url",         "https://bionhealth.co.za/for-corporate"),
    ];

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "BION Corporate",
      provider: { "@type": "Organization", name: "BION", url: "https://bionhealth.co.za" },
      areaServed: { "@type": "Country", name: "South Africa" },
      description: "Corporate wellness platform — companies fund employee bookings via a non-refundable Corporate Wallet. 5% flat service fee per booking. No seat fees, no minimums.",
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      [...nodes, ld].forEach((n) => { try { document.head.removeChild(n); } catch {} });
    };
  }, []);

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow text-foreground">
      <LandingHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute left-[55%] top-[-10%] w-[800px] h-[800px] rounded-full bg-teal/15 blur-3xl" />
          <div className="absolute left-[10%] top-[30%] w-[400px] h-[400px] rounded-full bg-indigo/10 blur-3xl" />
        </motion.div>

        <div className="relative w-full max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-16 md:pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass-accent-teal rounded-pill px-4 py-1.5 text-xs font-medium text-teal mb-6"
          >
            <Building2 className="w-3.5 h-3.5" /> BION Corporate
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05]"
          >
            Wellness infrastructure<br />
            <span className="text-gradient-teal">not vouchers in a drawer.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Give your team AI wellness coaching, free health tools, and access to 13,300+ verified
            professionals — all tracked in one privacy-first dashboard. R150/employee/month.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="rounded-pill px-8 py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta inline-flex items-center gap-2"
            >
              Request a demo <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/welcome?role=corporate"
              className="rounded-pill px-8 py-3.5 text-sm font-semibold glass-2 text-foreground hover:bg-white/[0.08] transition-colors"
            >
              Get started
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto"
          >
            <HeroStat value="R0" label="setup" accent="teal" />
            <HeroStat value="Pay per" label="booking — no seat fees" accent="indigo" />
            <HeroStat value="5%" label="flat service fee" accent="amber" />
          </motion.div>
        </div>
      </section>

      {/* ── Why it works ───────────────────────────────────── */}
      <Section>
        <SectionHeader
          eyebrow="Why it works"
          title="Wellness budgets that actually get used."
          sub="Gym memberships sit unused. Voucher schemes get gamed. A flexible wallet meets people where they already are."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PitchCard
            icon={<Heart className="w-5 h-5" />}
            title="Higher engagement than gym memberships"
            body="Employees pick their own providers — GP, physio, personal trainer, beautician, therapist — across 900+ verified options. Relevance drives adoption."
            accent="coral"
          />
          <PitchCard
            icon={<BarChart3 className="w-5 h-5" />}
            title="Full visibility into employee spend"
            body="Live dashboard of what was booked, by whom, in which category. Department and per-employee analytics. Monthly invoices."
            accent="indigo"
          />
          <PitchCard
            icon={<Wallet className="w-5 h-5" />}
            title="No unused allowance waste"
            body="Employees spend what they use. You fund the wallet. Unspent credit stays in the wallet — never expires, no rollover admin."
            accent="teal"
          />
        </div>
      </Section>

      {/* ── How it works ───────────────────────────────────── */}
      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="Four steps, ten minutes."
          sub="Your Corporate account is live the moment the first employee is invited."
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <StepCard n={1} title="Register as Corporate"
            body="Sign up with your company details — name, registration number, UBO info where applicable." />
          <StepCard n={2} title="Load your wallet"
            body="Top up via Paystack card, EFT or invoice. Non-refundable but never expires." />
          <StepCard n={3} title="Add employees & budgets"
            body="Invite by email. Set monthly per-employee caps. Mix it with department-wide pools." />
          <StepCard n={4} title="Track usage + ROI"
            body="See bookings, categories, spend and savings in your Analytics dashboard." />
        </div>
      </Section>

      {/* ── Compliance ─────────────────────────────────────── */}
      <Section>
        <SectionHeader
          eyebrow="Compliance + controls"
          title="Built for South African HR &amp; finance."
          sub="POPIA, FICA, BEE — we know the checklist."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <FeatureCard icon={<Lock className="w-5 h-5" />}    title="POPIA-compliant"
            body="Employee bookings, medical notes and payment data are processed per POPIA. Data export and deletion on 30-day response." />
          <FeatureCard icon={<Shield className="w-5 h-5" />}  title="FICA for high-value spend"
            body="KYB identity verification on Corporate accounts. Beneficial-ownership capture in the dashboard." />
          <FeatureCard icon={<Users className="w-5 h-5" />}   title="Per-employee monthly caps"
            body="Set a Rand limit per person per month. Employees see their remaining balance in-app." />
          <FeatureCard icon={<BarChart3 className="w-5 h-5" />} title="Department analytics"
            body="Spend by department, cost centre or category. Exportable CSV for finance reporting." />
          <FeatureCard icon={<Building2 className="w-5 h-5" />} title="Beneficial-ownership support"
            body="UBO registration captured up-front for regulated industries. Update any time from Settings." />
          <FeatureCard icon={<Wallet className="w-5 h-5" />}  title="Paystack-backed"
            body="All payments processed by Paystack (PCI DSS Level 1, 3D Secure). Cards, instant EFT and wallet top-ups." />
        </div>
      </Section>

      {/* ── Pricing ────────────────────────────────────────── */}
      <Section>
        <SectionHeader eyebrow="Pricing" title="Pay for what your team uses. That's it." />
        <div className="glass-accent-indigo rounded-3xl p-8 md:p-12 max-w-3xl mx-auto text-center">
          <div className="font-data text-5xl md:text-6xl font-bold text-foreground">5%</div>
          <div className="text-sm uppercase tracking-widest text-muted-foreground mt-2">Flat service fee on employee bookings</div>
          <div className="h-px bg-white/[0.08] my-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <PricingRow label="Setup" value="R0" />
            <PricingRow label="Seat fees" value="None" />
            <PricingRow label="Monthly minimum" value="None" />
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Corporate Wallet is non-refundable (funds employee bookings only) and never expires.
            5% service fee is the same flat rate that applies to all BION bookings.
          </p>
        </div>
      </Section>

      {/* ── Who uses ────────────────────────────────────── */}
      <Section>
        <SectionHeader eyebrow="Built for SA teams" title="Who uses BION Corporate" />
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
          {["Law firms", "Tech startups", "Mining", "Hospitality", "Finance", "Manufacturing"].map((b) => (
            <div key={b} className="glass-1 rounded-pill px-5 py-2.5 text-sm text-foreground/80">
              {b}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Demo / contact form ────────────────────────────── */}
      <Section id="contact">
        <SectionHeader
          eyebrow="Talk to sales"
          title="Want a walkthrough?"
          sub="Tell us about your team. We'll get back within one business day with pricing, a tailored demo and a live Corporate trial."
        />
        <div className="max-w-2xl mx-auto">
          <DemoForm />
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <Section>
        <div className="glass-accent-teal rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto">
          <Building2 className="w-10 h-10 text-teal mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Start with a R0 wallet.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Add funds when you're ready. No contracts. Cancel any time by zeroing out the wallet.
          </p>
          <Link
            to="/welcome?role=corporate"
            className="mt-6 inline-flex items-center gap-2 rounded-pill px-8 py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Create a Corporate account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>

      <LandingFooter />

      {/* Demo modal */}
      <AnimatePresence>
        {demoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDemoOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg glass-2 rounded-3xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setDemoOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full glass-1 flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-2xl font-bold mb-1">Request a demo</h3>
              <p className="text-sm text-muted-foreground mb-5">We'll come back within one business day.</p>
              <DemoForm />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────

type DemoFormState = {
  name: string; company: string; email: string; phone: string;
  team_size: string; message: string;
};

function DemoForm() {
  const [form, setForm] = useState<DemoFormState>({
    name: "", company: "", email: "", phone: "", team_size: "50-200", message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const set = <K extends keyof DemoFormState>(k: K, v: DemoFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrMsg("");
    try {
      const r = await fetch(`${API_URL}/api/corporate/demo-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) throw new Error(data?.error || "Failed to submit");
      setStatus("ok");
      setForm({ name: "", company: "", email: "", phone: "", team_size: "50-200", message: "" });
    } catch (err: any) {
      setStatus("error");
      setErrMsg(err?.message ?? "Something went wrong.");
    }
  };

  if (status === "ok") {
    return (
      <div className="glass-accent-teal rounded-2xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-teal mx-auto mb-3" />
        <h4 className="text-lg font-semibold mb-1">Thanks — we've got it.</h4>
        <p className="text-sm text-muted-foreground">
          Our sales team will be in touch within one business day at the email you provided.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-xs text-indigo-light underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-1 rounded-2xl p-5 md:p-6 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Full name"
          input={<input required value={form.name} onChange={(e) => set("name", e.target.value)}
            className={inputCls} placeholder="Jane Dlamini" />} />
        <Field label="Company"
          input={<input required value={form.company} onChange={(e) => set("company", e.target.value)}
            className={inputCls} placeholder="Acme (Pty) Ltd" />} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Work email"
          input={<input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
            className={inputCls} placeholder="jane@acme.co.za" />} />
        <Field label="Phone"
          input={<input required value={form.phone} onChange={(e) => set("phone", e.target.value)}
            className={inputCls} placeholder="+27 82 ..." />} />
      </div>
      <Field label="Team size"
        input={
          <select value={form.team_size} onChange={(e) => set("team_size", e.target.value)} className={inputCls}>
            <option value="10-50">10 – 50</option>
            <option value="50-200">50 – 200</option>
            <option value="200-500">200 – 500</option>
            <option value="500+">500+</option>
          </select>
        } />
      <Field label="Anything we should know?"
        input={<textarea value={form.message} onChange={(e) => set("message", e.target.value)}
          rows={3} className={inputCls} placeholder="Industry, challenges, BEE considerations, timelines..." />} />

      {status === "error" && (
        <div className="glass-accent-coral rounded-xl px-4 py-2.5 text-xs text-coral flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errMsg || "Something went wrong. Please try again."}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-pill py-3 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Request a demo"}
      </button>
      <p className="text-[11px] text-muted-foreground text-center">
        By submitting you agree BION can email you about your demo request.
      </p>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-indigo/50";

function Field({ label, input }: { label: string; input: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground mb-1.5 block">{label}</span>
      {input}
    </label>
  );
}

function HeroStat({ value, label, accent }: { value: string; label: string; accent: "indigo" | "teal" | "amber" }) {
  const glassClass =
    accent === "indigo" ? "glass-accent-indigo" :
    accent === "teal"   ? "glass-accent-teal"   : "glass-accent-amber";
  return (
    <div className={`${glassClass} rounded-2xl px-5 py-4 text-left`}>
      <div className="font-data text-2xl md:text-3xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="w-full max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20">
      {children}
    </section>
  );
}

function SectionHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="text-center mb-10 md:mb-14"
    >
      {eyebrow && <div className="text-xs uppercase tracking-[0.18em] text-teal mb-3">{eyebrow}</div>}
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{sub}</p>}
    </motion.div>
  );
}

function PitchCard({ icon, title, body, accent = "indigo" }:
  { icon: React.ReactNode; title: string; body: string; accent?: "indigo" | "teal" | "coral" }) {
  const iconBg = accent === "teal" ? "gradient-teal" : accent === "coral" ? "gradient-coral" : "gradient-indigo";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="glass-1 rounded-2xl p-6"
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-obsidian mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </motion.div>
  );
}

function StepCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: n * 0.05 }}
      className="glass-1 rounded-2xl p-5"
    >
      <div className="w-9 h-9 rounded-full gradient-indigo flex items-center justify-center text-primary-foreground text-sm font-bold mb-3 font-data">
        {n}
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </motion.div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="glass-1 rounded-2xl p-5"
    >
      <div className="w-10 h-10 rounded-xl glass-accent-teal flex items-center justify-center text-teal mb-3">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </motion.div>
  );
}

function PricingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-1 rounded-2xl px-4 py-3 flex items-center justify-between">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-data text-base font-semibold text-foreground flex items-center gap-1.5">
        <Check className="w-3.5 h-3.5 text-teal" />
        {value}
      </span>
    </div>
  );
}
