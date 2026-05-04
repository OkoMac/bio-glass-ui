import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function AcceptableUse() {
  const navigate = useNavigate();
  const updated = "9 April 2026";

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-20">
      <div className="mx-auto max-w-2xl px-4 pt-20 space-y-6">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Acceptable Use Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: {updated}</p>
          </div>
        </div>

        <GlassCard className="p-6 space-y-5 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Overview</h2>
            <p>This Acceptable Use Policy ("AUP") governs the use of the BION platform ("Platform") operated by BION (Pty) Ltd ("we", "us", "our"). By accessing or using the Platform, all users — including clients, service providers, corporate accounts, and sales representatives — agree to comply with this policy.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Permitted Use</h2>
            <p>The Platform may only be used for:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Browsing and booking legitimate health, wellness, beauty, fitness, and medical services</li>
              <li>Listing and providing verified professional services (providers)</li>
              <li>Managing corporate employee wellness programmes (corporate accounts)</li>
              <li>Tracking personal health, nutrition, fitness, and wellness data</li>
              <li>Communicating between clients and providers regarding booked services</li>
              <li>Processing payments for services rendered through the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Prohibited Activities</h2>
            <p>Users must NOT:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Provide false identity information, fraudulent credentials, or misrepresent qualifications</li>
              <li>List services that are illegal, unlicensed, or not within the user's professional scope</li>
              <li>Use the Platform to harass, threaten, or discriminate against any user</li>
              <li>Attempt to circumvent the payment system, processing fees, or commission structures</li>
              <li>Collect or harvest personal data of other users without consent</li>
              <li>Upload malicious content, malware, or spam</li>
              <li>Create multiple accounts to manipulate reviews, ratings, or referral programmes</li>
              <li>Use the Platform for money laundering, terrorist financing, or any illegal financial activity</li>
              <li>Resell, sublicense, or commercially exploit Platform access without written permission</li>
              <li>Engage in any activity that violates South African law, including POPIA, ECTA, CPA, or FICA</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Provider-Specific Requirements</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>All providers must hold valid, current professional registration where required (e.g., HPCSA, SANC, SAPC)</li>
              <li>Medical providers must maintain professional indemnity insurance</li>
              <li>Providers must only offer services within their registered scope of practice</li>
              <li>Providers must maintain accurate availability, pricing, and service descriptions</li>
              <li>Providers must comply with industry-specific codes of conduct and ethical standards</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Payment & Financial Conduct</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>All service payments must be processed through the Platform's payment system (Paystack)</li>
              <li>Users must not arrange off-platform payments to avoid service fees</li>
              <li>Chargebacks and refund requests must follow the Platform's dispute resolution process</li>
              <li>Corporate wallet credits are non-transferable and must be used for wellness services only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Data & Privacy</h2>
            <p>All users must respect the privacy of others and comply with the Protection of Personal Information Act (POPIA). Health data shared on the Platform is treated as special personal information under POPIA and receives enhanced protection. Users control which providers can access their health data through the Platform's privacy settings.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Content Standards</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>Profile photos must be professional and appropriate</li>
              <li>Reviews must be honest, factual, and based on genuine service experiences</li>
              <li>Messages must be professional and relevant to services</li>
              <li>No hate speech, explicit content, or discriminatory language</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Enforcement</h2>
            <p>Violations of this AUP may result in:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Warning and notice to comply</li>
              <li>Temporary suspension of account access</li>
              <li>Permanent account termination</li>
              <li>Withholding of pending payouts</li>
              <li>Reporting to relevant authorities or professional bodies</li>
            </ul>
            <p className="mt-2">We reserve the right to investigate suspected violations and take appropriate action at our sole discretion.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">9. Reporting Violations</h2>
            <p>Users may report AUP violations via the in-app reporting feature, by contacting support at <span className="text-teal">support@bionhealth.co.za</span>, or by emailing <span className="text-teal">support@bionhealth.co.za</span>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">10. Changes to This Policy</h2>
            <p>We may update this AUP from time to time. Material changes will be communicated via email or in-app notification. Continued use of the Platform after changes constitutes acceptance of the updated policy.</p>
          </section>

          <div className="pt-4 border-t border-white/5 text-xs text-muted-foreground">
            <p>BION (Pty) Ltd · Pretoria, South Africa</p>
            <p>Contact: support@bionhealth.co.za</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
