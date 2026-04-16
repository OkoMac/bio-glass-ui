import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Mail, ExternalLink } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function Privacy() {
  const navigate = useNavigate();
  const updated = "16 April 2026";

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-20">
      <div className="mx-auto max-w-2xl px-4 pt-12 space-y-6">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal" />
              <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              POPIA-compliant · Last updated: {updated}
            </p>
          </div>
        </div>

        <GlassCard className="p-6 space-y-5 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Who we are</h2>
            <p>
              BION (Pty) Ltd ("BION", "we", "us", "our") operates the BION platform
              at <span className="text-teal">bionhealth.co.za</span>, a health and
              wellness marketplace connecting clients with service providers across
              South Africa. This policy explains how we collect, use, share and
              protect your personal information under the{" "}
              <strong className="text-foreground">
                Protection of Personal Information Act, 2013 (POPIA)
              </strong>
              .
            </p>
            <p className="mt-2">
              <strong className="text-foreground">Information Officer:</strong>{" "}
              <span className="text-teal">support@bionhealth.co.za</span>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. What data we collect</h2>
            <p className="mb-2">We collect only what we need to deliver our service:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                <strong className="text-foreground">Account data</strong> — name,
                email, phone, city, profile photo, role (client/provider/corporate).
              </li>
              <li>
                <strong className="text-foreground">Identity & compliance data</strong>{" "}
                — SA ID number (providers only), professional registration
                numbers, SARS tax number, FICA acknowledgement, bank details
                (for payouts).
              </li>
              <li>
                <strong className="text-foreground">Health data</strong> — weight,
                body fat, sleep, steps, heart rate, food logs, nutrition,
                conditions, allergies, medications. This is{" "}
                <em>special personal information</em> under POPIA and receives
                enhanced protection.
              </li>
              <li>
                <strong className="text-foreground">Service data</strong> —
                bookings, messages with providers, reviews, photos uploaded for
                disputes.
              </li>
              <li>
                <strong className="text-foreground">Financial data</strong> —
                wallet transactions, payment references (tokenised; we never
                store full card numbers), invoices.
              </li>
              <li>
                <strong className="text-foreground">Technical data</strong> —
                device type, IP address, browser, approximate location, app
                version, session timestamps.
              </li>
              <li>
                <strong className="text-foreground">Usage data</strong> —
                page views, search queries, providers viewed, features used.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. How we use your data</h2>
            <p className="mb-2">
              We use your data to deliver and improve BION. We do{" "}
              <strong className="text-foreground">not sell</strong> personal information to third parties.
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Provide the booking, messaging, wallet, and health-tracking features you use.</li>
              <li>Match clients to suitable providers (personalisation).</li>
              <li>Process payments, payouts and refunds through Paystack.</li>
              <li>Verify provider identity and qualifications (KYC).</li>
              <li>Detect fraud, abuse, and breaches of our Acceptable Use Policy.</li>
              <li>Send service notifications (booking confirmations, receipts, disputes).</li>
              <li>Comply with South African law (FICA, tax, consumer protection).</li>
              <li>With your separate opt-in: marketing updates and product tips.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Legal basis</h2>
            <p>
              We rely on the lawful grounds set out in Section 11 of POPIA —
              primarily performance of the contract between you and BION, legal
              obligations (FICA, tax, healthcare regulation), and your explicit
              consent for health data and marketing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Third-party processors</h2>
            <p className="mb-2">
              We share data with vetted operators who process it on our behalf
              under written data-processing agreements:
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                <strong className="text-foreground">Paystack</strong> — payment
                processing. POPIA-compliant; PCI-DSS Level 1 certified. Receives
                tokenised card data + transaction metadata.
              </li>
              <li>
                <strong className="text-foreground">Supabase</strong> — database,
                authentication, file storage. Data hosted in the EU
                (eu-west-2), transferred under standard contractual clauses
                compatible with POPIA's cross-border rules.
              </li>
              <li>
                <strong className="text-foreground">Meta / WhatsApp Business</strong>{" "}
                — message delivery when you opt into WhatsApp notifications.
                Governed by Meta's DPA.
              </li>
              <li>
                <strong className="text-foreground">OpenAI</strong> — powers our
                B_ AI assistant. We pass only the minimum context needed and
                never send special personal information without your consent.
                OpenAI processes data under its Enterprise DPA; we do not allow
                your data to be used for model training.
              </li>
              <li>
                <strong className="text-foreground">Render + Vercel</strong> —
                application hosting. Data in transit only; no durable storage
                of PII.
              </li>
              <li>
                <strong className="text-foreground">Providers you book with</strong>{" "}
                — we share only what they need to deliver the service (name,
                booking details, messages, and any health data you've explicitly chosen
                to share with them in Settings → Privacy).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Data retention</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                <strong className="text-foreground">Profile + health data</strong> — while your
                account is active. Deleted within 30 days of a valid deletion request
                (7-day grace period + processing).
              </li>
              <li>
                <strong className="text-foreground">Financial records</strong> —
                retained for 5 years after account deletion, as required by the
                South African Reserve Bank (SARB) and SARS. The records are
                anonymised so they no longer identify you.
              </li>
              <li>
                <strong className="text-foreground">FICA records (providers)</strong> — retained for
                5 years per the Financial Intelligence Centre Act.
              </li>
              <li>
                <strong className="text-foreground">Support emails + disputes</strong> — retained
                for 3 years to honour warranty and quality-of-service obligations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Your rights under POPIA</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                <strong className="text-foreground">Access</strong> — request a
                copy of your data (Settings → Privacy → Export my data).
              </li>
              <li>
                <strong className="text-foreground">Correct</strong> — update
                inaccuracies at any time in your profile, or email us.
              </li>
              <li>
                <strong className="text-foreground">Delete</strong> — request
                deletion of your personal data (Settings → Privacy → Delete my
                account). Financial records are anonymised rather than deleted.
              </li>
              <li>
                <strong className="text-foreground">Portability</strong> — your
                export is in machine-readable JSON, which you can carry to
                another service.
              </li>
              <li>
                <strong className="text-foreground">Object</strong> to
                processing for marketing, profiling, or direct marketing at any
                time.
              </li>
              <li>
                <strong className="text-foreground">Withdraw consent</strong> —
                for any processing that relies on your consent.
              </li>
              <li>
                <strong className="text-foreground">Complain</strong> to the
                Information Regulator (see Section 10).
              </li>
            </ul>
            <p className="mt-2">
              We respond to all data-subject requests within 30 days as required by POPIA Regulation 4.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Security</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>All traffic is encrypted in transit (TLS 1.3).</li>
              <li>Data at rest is encrypted at the database + storage layer.</li>
              <li>Row-level security isolates each user's data by default.</li>
              <li>Two-factor authentication available (Settings → Privacy).</li>
              <li>Payment details are tokenised by Paystack — we never see full card numbers.</li>
              <li>Security incidents are reported to the Information Regulator within 72 hours where required.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">9. Cross-border transfer</h2>
            <p>
              Some of our processors store data outside South Africa (EU, US).
              These transfers are covered by Standard Contractual Clauses and
              are compatible with Section 72 of POPIA. You consent to these
              transfers by using BION.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">10. Contact & complaints</h2>
            <div className="space-y-2">
              <p>
                <strong className="text-foreground">Information Officer:</strong>
                <br />
                <Mail className="inline w-3 h-3 mr-1" />
                <a href="mailto:support@bionhealth.co.za" className="text-teal">
                  support@bionhealth.co.za
                </a>
                <br />
                BION (Pty) Ltd · Pretoria, South Africa
              </p>
              <p>
                <strong className="text-foreground">Unresolved concerns?</strong> You may escalate to the Information Regulator (South Africa):
                <br />
                <a
                  href="https://inforegulator.org.za/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal inline-flex items-center gap-1"
                >
                  inforegulator.org.za <ExternalLink className="w-3 h-3" />
                </a>
                <br />
                Tel: +27 (0) 10 023 5200 · Email: POPIAComplaints@inforegulator.org.za
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">11. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material
              changes (new processors, new data types, new cross-border
              transfers) will be communicated by email or in-app notification
              at least 14 days before they take effect.
            </p>
          </section>

          <div className="pt-4 border-t border-white/5 text-xs text-muted-foreground">
            <p>BION (Pty) Ltd · Pretoria, South Africa</p>
            <p>Information Officer: support@bionhealth.co.za</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
