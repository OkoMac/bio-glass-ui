import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function Terms() {
  const navigate = useNavigate();
  const updated = "22 April 2026";
  const version = "2026-04-22-v1";

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-20">
      <div className="mx-auto max-w-2xl px-4 pt-12 space-y-6">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-xs text-muted-foreground">Last updated: {updated} (version {version})</p>
          </div>
        </div>

        <GlassCard className="p-6 space-y-5 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Introduction</h2>
            <p>
              Welcome to BION. These Terms of Service ("Terms") govern your access to and use of the BION platform
              ("Platform"), operated by BION (Pty) Ltd ("we", "us", "our"), a company registered in the Republic of
              South Africa.
            </p>
            <p className="mt-2">
              By creating an account, accessing, or using the Platform in any way, you agree to be bound by these
              Terms. If you do not agree, you must not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Eligibility</h2>
            <p>
              You must be at least 18 years old to create an account. By using the Platform, you represent that you
              are of legal age and have the capacity to enter into a binding agreement. Minors may use the Platform
              only with verifiable parental or guardian consent.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and for all activities
              conducted under your account. You must immediately notify us of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Services</h2>
            <p>
              BION is a marketplace platform that connects clients with health, wellness, and beauty service providers.
              We do not provide medical advice, diagnoses, or treatments. Providers listed on the Platform are
              independent professionals, not employees or agents of BION.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Payments & Fees</h2>
            <p>
              All payments are processed through our authorized payment partners (Paystack / Stripe). BION charges a
              platform fee on transactions, as detailed in our fee schedule. Refunds are governed by our
              <a href="/legal/dispute-resolution" className="text-indigo hover:underline ml-1">Dispute Resolution Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Privacy & Data</h2>
            <p>
              Your personal data is handled in accordance with our
              <a href="/legal/privacy" className="text-indigo hover:underline ml-1">Privacy Policy</a> and the
              Protection of Personal Information Act (POPIA), Act 4 of 2013. You may request a copy of all data we
              hold about you at any time via your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Acceptable Use</h2>
            <p>
              Your use of the Platform is subject to our
              <a href="/legal/acceptable-use" className="text-indigo hover:underline ml-1">Acceptable Use Policy</a>.
              We reserve the right to suspend or terminate accounts that violate these Terms or the AUP.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by South African law, BION shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from or related to your use of the
              Platform, including but not limited to loss of profits, data, or goodwill.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">9. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. When we make material changes, we will notify you via the
              Platform and request your acceptance before you can continue using the service. Your continued use after
              accepting updated Terms constitutes agreement to the changes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be resolved in
              the courts of Pretoria, Gauteng, South Africa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">11. Contact</h2>
            <p>
              If you have questions about these Terms, contact us at
              <a href="mailto:legal@bionhealth.co.za" className="text-indigo hover:underline ml-1">legal@bionhealth.co.za</a>.
            </p>
          </section>
        </GlassCard>

        <p className="text-[10px] text-muted-foreground text-center pb-8">
          BION (Pty) Ltd &middot; Pretoria, South Africa &middot; Version {version}
        </p>
      </div>
    </div>
  );
}
