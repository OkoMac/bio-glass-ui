import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarCheck, CreditCard, Users, Sparkles, Store, Gift,
  ShieldCheck, TrendingUp, Zap, ChevronDown, Check, ArrowRight,
} from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import HelpVideo from "@/components/HelpVideo";

/**
 * Public marketing landing page targeting health, wellness & beauty
 * practitioners (GPs, physios, PTs, salons, therapists, coaches).
 *
 * CTAs hand off to /welcome?role=provider to drop the user into the
 * role-preselected signup flow. All copy & numbers come from
 * backend/src/knowledge/bion-platform.ts — don't invent new ones.
 */
export default function ForProviders() {
  // ── SEO ─────────────────────────────────────────────────
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Run your wellness practice on BION | BION for Providers";

    const makeMeta = (attr: "name" | "property", key: string, value: string) => {
      const m = document.createElement("meta");
      m.setAttribute(attr, key);
      m.content = value;
      document.head.appendChild(m);
      return m;
    };

    const meta = makeMeta("name", "description",
      "The operating system for health, wellness & beauty professionals in South Africa. Keep 90% of every booking. Free client acquisition vouchers. CRM, payments, bookings in one place.");
    const og: HTMLMetaElement[] = [
      makeMeta("property", "og:title",       "Run your wellness practice on BION"),
      makeMeta("property", "og:description", "Bookings, payments, CRM, client acquisition — one platform for SA practitioners."),
      makeMeta("property", "og:type",        "website"),
      makeMeta("property", "og:url",         "https://bionhealth.co.za/for-providers"),
    ];

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "BION for Providers",
      provider: { "@type": "Organization", name: "BION", url: "https://bionhealth.co.za" },
      areaServed: { "@type": "Country", name: "South Africa" },
      description: "Operating system for health, wellness & beauty professionals. Bookings, CRM, payments, acquisition vouchers.",
      offers: [
        { "@type": "Offer", name: "Free",  price: "0",   priceCurrency: "ZAR" },
        { "@type": "Offer", name: "Pro",   price: "499", priceCurrency: "ZAR" },
        { "@type": "Offer", name: "Elite", price: "999", priceCurrency: "ZAR" },
      ],
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      [meta, ld, ...og].forEach((n) => { try { document.head.removeChild(n); } catch (e: any) { console.warn('[ForProviders.tsx] silent catch:', e?.message ?? String(e)); } });
    };
  }, []);

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow text-foreground">
      <LandingHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Animated gradient halo */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute left-1/2 top-[-20%] -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-indigo/20 blur-3xl" />
          <div className="absolute left-[10%] top-[40%] w-[400px] h-[400px] rounded-full bg-violet/10 blur-3xl" />
          <div className="absolute right-[5%] top-[10%] w-[380px] h-[380px] rounded-full bg-teal/10 blur-3xl" />
        </motion.div>

        <div className="relative w-full max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-16 md:pb-24 text-center">
          <div className="flex justify-center mb-4">
            <HelpVideo lessonRef="PROVIDER:1" label="Watch 1-min intro" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass-accent-indigo rounded-pill px-4 py-1.5 text-xs font-medium text-indigo-light mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" /> BION for Providers
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05]"
          >
            We don't list you.<br />
            <span className="text-gradient-indigo">We run your business.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            BION is an AI-powered operating system for your practice — we bring you clients,
            process payments, automate your admin, and grow your business while you focus on what you do best.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/welcome?role=provider"
              className="rounded-pill px-8 py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta inline-flex items-center gap-2"
            >
              Start with BION Pro — R499/mo <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={scrollToFeatures}
              className="rounded-pill px-8 py-3.5 text-sm font-semibold glass-2 text-foreground hover:bg-white/[0.08] transition-colors"
            >
              See how it works
            </button>
          </motion.div>

          {/* Hero stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mx-auto"
          >
            <HeroStat value="13,300+" label="providers live" accent="indigo" />
            <HeroStat value="R90" label="kept on every R100" accent="teal" />
            <HeroStat value="5%" label="ring-fenced to your own client acquisition" accent="amber" />
          </motion.div>
        </div>
      </section>

      {/* ── Pitch ──────────────────────────────────────────── */}
      <Section>
        <SectionHeader
          eyebrow="Why providers pick BION"
          title="Keep more. Earn more. Do less admin."
          sub="We built BION the way a practitioner actually wants to run their business — not the way tech bros think you should."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PitchCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Keep more revenue"
            body="R90 of every R100 is yours. 5% BION platform fee. 5% funds your own acquisition pool. No hidden cuts."
          />
          <PitchCard
            icon={<Users className="w-5 h-5" />}
            title="Get new clients — without spending on ads"
            body="5% of every booking funds your own voucher pool. BION mints R500 vouchers from it and drops them into new clients' feeds in your area."
          />
          <PitchCard
            icon={<Zap className="w-5 h-5" />}
            title="Run the whole practice in one app"
            body="Bookings, Paystack-split payments, client CRM, programme builder and a storefront — one login, one dashboard."
          />
        </div>
      </Section>

      {/* ── Fee model ──────────────────────────────────────── */}
      <Section>
        <SectionHeader
          eyebrow="The R100 split"
          title="Every Rand accounted for."
          sub="Transparent, flat percentages. Never compounded."
        />
        <div className="glass-1 rounded-3xl p-6 md:p-10 max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">A R100 service</div>
          <div className="font-data text-3xl font-bold text-foreground mb-6">Client pays R105 <span className="text-sm text-muted-foreground font-normal">(incl. 5% client service fee)</span></div>

          <FeeBar color="gradient-teal"   label="You keep" amount="R90" pct={90} caption="90% of the bill — to your BION Wallet on session completion" />
          <FeeBar color="gradient-indigo" label="BION platform fee" amount="R5"  pct={5}  caption="Covers platform, Paystack split, hosting, support" />
          <FeeBar color="gradient-amber"  label="YOUR acquisition pool" amount="R5"  pct={5}  caption="Not BION revenue. Ring-fenced to fund R500 vouchers for new clients to try you" highlight />

          <div className="mt-6 glass-accent-amber rounded-2xl p-4 text-xs md:text-sm text-foreground/90 flex items-start gap-3">
            <Gift className="w-5 h-5 text-amber shrink-0 mt-0.5" />
            <span>
              <b>The acquisition pool is yours.</b> BION mints R500 face-value vouchers from it
              and drops them into the Discovery feeds of clients who've never booked you. When
              a new client redeems, the voucher pays you from your own pool. You can also
              top it up voluntarily to mint more.
            </span>
          </div>
        </div>
      </Section>

      {/* ── What you get ───────────────────────────────────── */}
      <Section id="features">
        <SectionHeader
          eyebrow="Everything you need"
          title="Built for a working practice."
          sub="No bolt-on SaaS stack. No API glue. Everything under one dashboard."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <FeatureCard icon={<CalendarCheck className="w-5 h-5" />} title="Booking calendar"
            body="Day / week / month view. Weekly hours, breaks, blocked dates. Auto-decline after 24h." />
          <FeatureCard icon={<CreditCard className="w-5 h-5" />} title="Paystack-split payments"
            body="Client pays Paystack, your 90% lands in your BION Wallet on session completion. Withdraw to your SA bank, R200 min." />
          <FeatureCard icon={<Users className="w-5 h-5" />} title="Client CRM"
            body="Each client: Sessions / Tasks / Notes / Rewards. Search, filter, 1:1 chat." />
          <FeatureCard icon={<Sparkles className="w-5 h-5" />} title="Programme builder"
            body="Workout, meal or care plans assigned to specific clients. Track progress." />
          <FeatureCard icon={<Store className="w-5 h-5" />} title="Digital storefront"
            body="Sell physical and digital products alongside sessions. Orders + catalogs included." />
          <FeatureCard icon={<Gift className="w-5 h-5" />} title="Acquisition vouchers"
            body="R500 face-value vouchers from your own pool. Drop into new clients' feeds. 5% transaction fee." />
        </div>
      </Section>

      {/* ── Tiers ──────────────────────────────────────────── */}
      <Section>
        <SectionHeader
          eyebrow="Subscription tiers"
          title="Start free. Upgrade when it pays for itself."
          sub="Month-to-month. Cancel any time, benefits run out at the end of your cycle."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <TierCard
            name="Free"
            price="R0"
            tagline="Get listed. Take bookings."
            features={[
              "Public provider profile",
              "Booking calendar & requests",
              "Paystack-split payouts",
              "Basic messaging",
              "Access to your voucher pool",
            ]}
          />
          <TierCard
            name="Pro"
            price="R499"
            featured
            tagline="Run it like a business."
            features={[
              "Everything in Free",
              "Full client CRM + notes",
              "Programme builder",
              "Analytics (revenue, retention)",
              "Priority messaging",
              "Digital storefront",
            ]}
          />
          <TierCard
            name="Elite"
            price="R999"
            tagline="Multi-practitioner & advanced."
            features={[
              "Everything in Pro",
              "Advanced analytics",
              "White-label branding",
              "API access",
              "Reduced 3.5% fee on Premium clients",
              "Catalog builder",
            ]}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          All tiers include the standard 5% platform fee + 5% acquisition pool on every booking.
        </p>
      </Section>

      {/* ── Social proof ───────────────────────────────────── */}
      <Section>
        <SectionHeader
          eyebrow="In their words"
          title="Example practitioners on BION."
          sub="We're rolling out real testimonials as providers go live. Here's how current Pro users describe it."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TestimonialCard
            quote="My weekends used to be paperwork. Now it's just — tap, tap, client booked, session done, wallet credited."
            name="Thandiwe M."
            role="Physiotherapist, Pretoria East"
            tag="Example · Pro tier"
          />
          <TestimonialCard
            quote="The acquisition vouchers pulled in four new clients in my first month. Zero ad spend. They rebooked."
            name="Naledi K."
            role="Salon owner, Centurion"
            tag="Example · Pro tier"
          />
          <TestimonialCard
            quote="I stopped chasing WhatsApp messages. Everything lives in BION — calendar, client notes, payments, the lot."
            name="Jaco v. R."
            role="Personal trainer, Menlyn"
            tag="Example · Elite tier"
          />
        </div>
      </Section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <Section>
        <SectionHeader eyebrow="FAQ" title="Answers to the usual questions." />
        <div className="max-w-3xl mx-auto space-y-3">
          <FAQ q="How do I get verified?"
            a="Medical & allied-health providers (GP, physio, psychologist, dietician, pharmacist, nurse) upload their HPCSA / SANC / SAPC / AHPCSA registration — BION checks it against the regulator automatically. Beauty, fitness and wellness providers upload their ID and trade licence. B_ AI pre-checks the documents and a BION admin gives final approval." />
          <FAQ q="How are payouts made?"
            a="Earnings land in your BION Wallet on session completion. Withdraw to your South African bank account via Paystack Transfer any time. R200 minimum, 10% cash-out fee (covers Paystack + BION + FICA). No fee when you spend your wallet balance inside BION." />
          <FAQ q="Can I bring my existing clients?"
            a="Yes. Import them, invite them by email or WhatsApp. They sign up free. If you bring existing clients, their bookings run through the same fee structure — but you keep full control of your schedule and pricing." />
          <FAQ q="What's the commitment?"
            a="None. Free tier is forever free. Pro and Elite are month-to-month — cancel any time, benefits continue through the end of your current billing period. No lock-ins." />
          <FAQ q="How long does verification take?"
            a="Medical regulator checks are automated and usually resolve in minutes. Document uploads are reviewed by a BION admin — target turnaround is one business day." />
          <FAQ q="Can I cancel Pro any time?"
            a="Yes. Month-to-month, no notice period. You'll drop back to Free on the next billing date. Your listing, clients, bookings and wallet balance all stay intact." />
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <Section>
        <div className="glass-accent-indigo rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto">
          <ShieldCheck className="w-10 h-10 text-indigo-light mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Get listed today.</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Takes 5 minutes. No card needed on the Free tier. You can upload verification docs during onboarding or later.
          </p>
          <Link
            to="/welcome?role=provider"
            className="mt-6 inline-flex items-center gap-2 rounded-pill px-8 py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            List my practice free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>

      <LandingFooter />
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────

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
      {eyebrow && <div className="text-xs uppercase tracking-[0.18em] text-indigo-light mb-3">{eyebrow}</div>}
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{sub}</p>}
    </motion.div>
  );
}

function PitchCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="glass-1 rounded-2xl p-6"
    >
      <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center text-primary-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </motion.div>
  );
}

function FeeBar({ color, label, amount, pct, caption, highlight }:
  { color: string; label: string; amount: string; pct: number; caption: string; highlight?: boolean }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className={`text-sm font-medium ${highlight ? "text-amber" : "text-foreground"}`}>{label}</div>
        <div className="font-data text-sm font-bold text-foreground">{amount}</div>
      </div>
      <div className="h-3 w-full rounded-pill bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color} rounded-pill`}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1.5">{caption}</div>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="glass-1 rounded-2xl p-5 hover:border-white/[0.16] transition-colors"
    >
      <div className="w-10 h-10 rounded-xl glass-accent-indigo flex items-center justify-center text-indigo-light mb-3">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </motion.div>
  );
}

function TierCard({ name, price, tagline, features, featured }:
  { name: string; price: string; tagline: string; features: string[]; featured?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-3xl p-6 flex flex-col ${
        featured ? "glass-accent-indigo shadow-hover" : "glass-1"
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill gradient-indigo px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground shadow-cta">
          Recommended
        </div>
      )}
      <div className="text-sm uppercase tracking-widest text-muted-foreground mb-2">{name}</div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-data text-4xl font-bold text-foreground">{price}</span>
        {price !== "R0" && <span className="text-sm text-muted-foreground">/month</span>}
      </div>
      <div className="text-sm text-muted-foreground mb-5">{tagline}</div>
      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className="w-4 h-4 text-teal shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/welcome?role=provider"
        className={`block text-center rounded-pill px-4 py-3 text-sm font-semibold ${
          featured ? "gradient-indigo text-primary-foreground shadow-cta"
                   : "glass-2 text-foreground hover:bg-white/[0.08]"
        }`}
      >
        Choose {name}
      </Link>
    </motion.div>
  );
}

function TestimonialCard({ quote, name, role, tag }:
  { quote: string; name: string; role: string; tag: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="glass-1 rounded-2xl p-6"
    >
      <div className="text-xs font-medium text-amber mb-3">{tag}</div>
      <p className="text-sm text-foreground/90 leading-relaxed mb-4">"{quote}"</p>
      <div className="text-sm font-semibold text-foreground">{name}</div>
      <div className="text-xs text-muted-foreground">{role}</div>
    </motion.div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-1 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
      >
        <span className="text-sm md:text-base font-medium text-foreground">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed"
        >
          {a}
        </motion.div>
      )}
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] mt-10">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/bion-logo-white-sm.png" alt="BION" className="h-8 w-auto opacity-80" />
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BION. Africa's health &amp; wellness OS.
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/for-providers"  className="hover:text-foreground">Providers</Link>
          <Link to="/for-corporate"  className="hover:text-foreground">Corporates</Link>
          <Link to="/for-rangers"    className="hover:text-foreground">Rangers</Link>
          <Link to="/legal/payment-flow"       className="hover:text-foreground">Payments</Link>
          <Link to="/legal/dispute-resolution" className="hover:text-foreground">Disputes</Link>
          <Link to="/legal/acceptable-use"     className="hover:text-foreground">Acceptable Use</Link>
          <Link to="/legal/privacy"            className="hover:text-foreground">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
