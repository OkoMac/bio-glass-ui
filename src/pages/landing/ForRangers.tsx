import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp, Banknote, Infinity as InfinityIcon, Repeat, Zap,
  Copy, Check, ArrowRight, Target, DollarSign, HandCoins, LinkIcon,
} from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import { LandingFooter } from "./ForProviders";

/**
 * Public marketing landing page for Rangers (BION sales representatives).
 *
 * Entry point from share links of the form ?ref=<CODE>. We preserve the
 * incoming ref code through the CTA so it survives the hop to /welcome.
 */
export default function ForRangers() {
  const [searchParams] = useSearchParams();
  const incomingRef = (searchParams.get("ref") ?? "").trim().toUpperCase();
  const joinHref = incomingRef
    ? `/welcome?role=sales_rep&ref=${encodeURIComponent(incomingRef)}`
    : "/welcome?role=sales_rep";

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Earn passive income signing up providers | BION Rangers";

    const makeMeta = (attr: "name" | "property", key: string, value: string) => {
      const m = document.createElement("meta");
      m.setAttribute(attr, key);
      m.content = value;
      document.head.appendChild(m);
      return m;
    };

    const nodes = [
      makeMeta("name", "description",
        "BION Rangers earn 20% of subscription + 2% of every booking of every provider they sign up. R5.80/month per Premium client referral. No cap, no contracts."),
      makeMeta("property", "og:title",       "Sign up providers. Get paid forever."),
      makeMeta("property", "og:description", "BION Rangers earn on every subscription and every booking of every provider they sign up. Uncapped."),
      makeMeta("property", "og:type",        "website"),
      makeMeta("property", "og:url",         "https://bionhealth.co.za/for-rangers"),
    ];

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      name: "BION Rangers",
      provider: { "@type": "Organization", name: "BION", url: "https://bionhealth.co.za" },
      areaServed: { "@type": "Country", name: "South Africa" },
      description: "Sales representative programme. 20% of provider subscription, 2% of every booking by referred providers, R5.80/month per Premium client referral — perpetual.",
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
          <div className="absolute left-1/2 top-[-15%] -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-amber/10 blur-3xl" />
          <div className="absolute right-[10%] top-[30%] w-[400px] h-[400px] rounded-full bg-coral/10 blur-3xl" />
          <div className="absolute left-[10%] top-[50%] w-[400px] h-[400px] rounded-full bg-indigo/10 blur-3xl" />
        </motion.div>

        <div className="relative w-full max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-16 md:pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass-accent-amber rounded-pill px-4 py-1.5 text-xs font-medium text-amber mb-6"
          >
            <TrendingUp className="w-3.5 h-3.5" /> BION Rangers
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05]"
          >
            Sign up providers.<br />
            <span className="text-gradient-amber">Get paid forever.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            You're not pushing listings — you're selling an AI-powered ecosystem that runs wellness practices.
            Sign up 50 providers — earn <span className="font-data text-foreground font-semibold">R6,000+/month</span> in recurring commissions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to={joinHref}
              className="rounded-pill px-8 py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta inline-flex items-center gap-2"
            >
              Become a Ranger <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#calculator" className="rounded-pill px-8 py-3.5 text-sm font-semibold glass-2 text-foreground hover:bg-white/[0.08] transition-colors">
              See the math
            </a>
          </motion.div>

          {incomingRef && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 inline-flex items-center gap-2 glass-accent-indigo rounded-pill px-4 py-2 text-xs text-indigo-light"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Invited by Ranger code <span className="font-mono font-semibold">{incomingRef}</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── The earnings stack ─────────────────────────────── */}
      <Section>
        <SectionHeader
          eyebrow="The earnings stack"
          title="Four revenue lines. One sign-up."
          sub="Every provider you sign up pays you on four separate tracks — perpetually, while they stay on BION."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <EarningCard
            icon={<DollarSign className="w-5 h-5" />}
            title="20% of monthly subscription"
            headline="R99.80 / month per Pro"
            sub="R199.80 / month per Elite · perpetual while they stay subscribed"
          />
          <EarningCard
            icon={<Banknote className="w-5 h-5" />}
            title="2% of every completed booking"
            headline="On every R100 they bill"
            sub="Comes from BION's share — never from the provider's payout"
          />
          <EarningCard
            icon={<Repeat className="w-5 h-5" />}
            title="R5.80 / month per Premium client referral"
            headline="20% of R29"
            sub="Paid every month as long as the client stays on Premium"
          />
          <EarningCard
            icon={<InfinityIcon className="w-5 h-5" />}
            title="Uncapped stack"
            headline="Compound it"
            sub="No ceiling on providers, clients or bookings — the stack grows while you sleep"
          />
        </div>
      </Section>

      {/* ── Calculator ─────────────────────────────────────── */}
      <Section id="calculator">
        <SectionHeader
          eyebrow="Earnings calculator"
          title="Run your own numbers."
          sub="Slide the knobs. We'll do the math. Figures update live."
        />
        <EarningsCalculator />
      </Section>

      {/* ── Why this works ─────────────────────────────────── */}
      <Section>
        <SectionHeader eyebrow="Why this works" title="Clean split of work." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PitchCard
            icon={<Zap className="w-5 h-5" />}
            title="We do the tech"
            body="Bookings, payments, KYC, Paystack splits, dispute mediation, support — all handled by BION. You don't build, maintain or operate anything."
          />
          <PitchCard
            icon={<Target className="w-5 h-5" />}
            title="You do the hustle"
            body="You know providers. Coaches. Medics. Salon owners. Gyms. Use the pitch kit, share your link, walk them through onboarding."
          />
          <PitchCard
            icon={<HandCoins className="w-5 h-5" />}
            title="Nobody else gets between you and the commission"
            body="No middle-managers. No split-with-upline. Your signups, your commission. Paid monthly direct into your BION earnings account."
          />
        </div>
      </Section>

      {/* ── How to get paid ────────────────────────────────── */}
      <Section>
        <SectionHeader eyebrow="How to get paid" title="Simple payout rhythm." />
        <div className="glass-1 rounded-3xl p-6 md:p-10 max-w-4xl mx-auto">
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-4 list-none">
            <PayoutStep n={1} title="Accrue monthly"
              body="Commissions accrue on the 3rd business day of each month." />
            <PayoutStep n={2} title="Hit R200 minimum"
              body="Withdraw once your BION earnings account is at R200 or above." />
            <PayoutStep n={3} title="Cash out to your SA bank"
              body="Paystack Transfer to any SA bank account. Usually within 1 business day." />
            <PayoutStep n={4} title="10% cash-out fee"
              body="Covers Paystack + BION + FICA. Same flat rate as everyone else on the platform." />
          </ol>
        </div>
      </Section>

      {/* ── Pitch kit ──────────────────────────────────────── */}
      <Section>
        <SectionHeader
          eyebrow="Ready-made pitch"
          title="The lines you'll use."
          sub="Copy, paste, send. One tap per bullet."
        />
        <div className="max-w-3xl mx-auto space-y-3">
          <PitchLine text="BION pays providers R90 of every R100 they bill. Zero lock-in, zero monthly minimum on the Free tier." />
          <PitchLine text="5% of every booking is ring-fenced to YOUR own acquisition pool — BION mints R500 vouchers from it to get you new clients. That's not BION revenue, that's yours." />
          <PitchLine text="Zero setup cost. The provider signs up in 5 minutes, uploads their HPCSA / SANC / trade licence, and they're live the same day." />
          <PitchLine text="No contracts. Cancel any time. Pro is R499/month, Elite is R999/month — but Free works for a practitioner just taking bookings." />
          <PitchLine text="Already have clients? Bring them in free. They book through BION, you get CRM + reminders + payments, they get Activity Points and Expenditure Rewards." />
        </div>
      </Section>

      {/* ── Share link preview ─────────────────────────────── */}
      <Section>
        <SectionHeader
          eyebrow="Your share link"
          title="What you'll send."
          sub="Every sign-up via this link is tagged to you — perpetually."
        />
        <div className="glass-1 rounded-3xl p-6 md:p-10 max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Share link format</div>
          <div className="glass-2 rounded-2xl p-4 flex items-center gap-3 overflow-x-auto">
            <LinkIcon className="w-4 h-4 text-indigo-light shrink-0" />
            <code className="font-mono text-sm text-foreground whitespace-nowrap">
              https://bionhealth.co.za/welcome?ref=<span className="text-amber">{incomingRef || "XXXXX"}</span>
            </code>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Your unique Ranger code is generated when you complete the Ranger onboarding (takes about 3 minutes,
            includes the Ranger agreement + a quick quiz). Once live, every click on your link is tracked and
            every sign-up is attributed for life.
          </p>
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <Section>
        <div className="glass-accent-amber rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto">
          <TrendingUp className="w-10 h-10 text-amber mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Start earning today.</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Signup takes 3 minutes. Your link is live the moment your agreement is signed.
          </p>
          <Link
            to={joinHref}
            className="mt-6 inline-flex items-center gap-2 rounded-pill px-8 py-3.5 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta"
          >
            Become a Ranger <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Section>

      <LandingFooter />
    </div>
  );
}

// ── Earnings calculator ──────────────────────────────────────

/**
 * Live calculator mapping sliders to monthly recurring income.
 *
 * Numbers come from backend/src/knowledge/bion-platform.ts (the Ranger
 * section). Do not edit these without updating the KB.
 */
function EarningsCalculator() {
  const [providers, setProviders] = useState(25);
  const [bookingsPerProvider, setBookingsPerProvider] = useState(40);
  const [avgBookingRand, setAvgBookingRand] = useState(300);
  const [mix, setMix] = useState<"pro" | "elite" | "mixed">("mixed");

  const subPerProvider =
    mix === "pro"   ? 99.80  :
    mix === "elite" ? 199.80 : 149.80; // 50/50 average

  const {
    subscriptionIncome,
    bookingIncome,
    monthlyTotal,
  } = useMemo(() => {
    const subscriptionIncome = providers * subPerProvider;
    const bookingIncome = providers * bookingsPerProvider * avgBookingRand * 0.02;
    return {
      subscriptionIncome,
      bookingIncome,
      monthlyTotal: subscriptionIncome + bookingIncome,
    };
  }, [providers, bookingsPerProvider, avgBookingRand, subPerProvider]);

  return (
    <div className="glass-1 rounded-3xl p-6 md:p-10 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sliders */}
        <div className="space-y-6">
          <Slider
            label="Providers you sign up"
            value={providers}
            min={1} max={200} step={1}
            display={`${providers}`}
            onChange={setProviders}
          />
          <Slider
            label="Bookings per provider / month"
            value={bookingsPerProvider}
            min={0} max={200} step={1}
            display={`${bookingsPerProvider}`}
            onChange={setBookingsPerProvider}
          />
          <Slider
            label="Average booking value"
            value={avgBookingRand}
            min={50} max={2000} step={10}
            display={`R${avgBookingRand}`}
            onChange={setAvgBookingRand}
          />
          <div>
            <div className="text-xs text-muted-foreground mb-2">Subscription mix</div>
            <div className="flex gap-2">
              {(["pro", "elite", "mixed"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMix(m)}
                  className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors ${
                    mix === m ? "gradient-indigo text-primary-foreground shadow-cta"
                              : "glass-2 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "pro" ? "100% Pro" : m === "elite" ? "100% Elite" : "50 / 50 mix"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="glass-accent-amber rounded-2xl p-6 flex flex-col justify-center">
          <div className="text-xs uppercase tracking-widest text-amber mb-2">Monthly recurring income</div>
          <div className="font-data text-5xl md:text-6xl font-bold text-foreground mb-6">
            R{monthlyTotal.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
          </div>
          <CalcRow label="Subscription commissions (20%)" value={subscriptionIncome} />
          <CalcRow label="Booking commissions (2%)" value={bookingIncome} />
          <div className="mt-5 text-[11px] text-muted-foreground leading-relaxed">
            Excludes R5.80/mo per Premium client referral — that's a separate stack on top.
            Estimate based on published Ranger rates; actual commissions depend on verified bookings.
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, display, onChange }:
  { label: string; value: number; min: number; max: number; step: number; display: string;
    onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-data text-sm font-semibold text-foreground">{display}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-pill bg-white/[0.08] appearance-none cursor-pointer accent-indigo"
      />
    </div>
  );
}

function CalcRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-t border-white/[0.08]">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-data text-sm font-semibold text-foreground">
        R{value.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}

// ── Shared subcomponents ─────────────────────────────────────

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
      {eyebrow && <div className="text-xs uppercase tracking-[0.18em] text-amber mb-3">{eyebrow}</div>}
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">{sub}</p>}
    </motion.div>
  );
}

function EarningCard({ icon, title, headline, sub }:
  { icon: React.ReactNode; title: string; headline: string; sub: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="glass-1 rounded-2xl p-6"
    >
      <div className="w-10 h-10 rounded-xl gradient-amber flex items-center justify-center text-obsidian mb-4">
        {icon}
      </div>
      <div className="text-[11px] uppercase tracking-widest text-amber mb-2">{title}</div>
      <div className="text-lg font-semibold mb-1.5">{headline}</div>
      <div className="text-xs text-muted-foreground leading-relaxed">{sub}</div>
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

function PayoutStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="relative">
      <div className="w-9 h-9 rounded-full gradient-indigo flex items-center justify-center text-primary-foreground text-sm font-bold mb-3 font-data">
        {n}
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </li>
  );
}

function PitchLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {/* no-op */}
  };
  return (
    <div className="glass-1 rounded-2xl p-4 flex items-start gap-3">
      <p className="text-sm text-foreground/90 flex-1 leading-relaxed">{text}</p>
      <button
        type="button"
        onClick={copy}
        className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
          copied ? "glass-accent-teal text-teal" : "glass-2 text-muted-foreground hover:text-foreground"
        }`}
      >
        {copied ? (<><Check className="w-3 h-3" /> Copied</>) : (<><Copy className="w-3 h-3" /> Copy</>)}
      </button>
    </div>
  );
}
