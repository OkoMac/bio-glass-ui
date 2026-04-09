import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function DisputeResolution() {
  const navigate = useNavigate();
  const updated = "9 April 2026";

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-20">
      <div className="mx-auto max-w-2xl px-4 pt-12 space-y-6">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dispute Resolution</h1>
            <p className="text-xs text-muted-foreground">Last updated: {updated}</p>
          </div>
        </div>

        <GlassCard className="p-6 space-y-5 text-sm text-muted-foreground leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Overview</h2>
            <p>BION is committed to fair and transparent resolution of disputes between clients and service providers. This policy outlines the process for handling complaints, refund requests, and service quality disputes on the Platform.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Types of Disputes</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li><span className="text-foreground font-medium">Service quality:</span> Service did not meet reasonable expectations or was not as described</li>
              <li><span className="text-foreground font-medium">No-show (provider):</span> Provider did not attend the scheduled appointment</li>
              <li><span className="text-foreground font-medium">No-show (client):</span> Client did not attend without prior cancellation</li>
              <li><span className="text-foreground font-medium">Billing dispute:</span> Incorrect charge, double charge, or unauthorised transaction</li>
              <li><span className="text-foreground font-medium">Safety concern:</span> Unsafe conditions, professional misconduct, or code of conduct violation</li>
              <li><span className="text-foreground font-medium">Cancellation dispute:</span> Disagreement about cancellation terms or refund amount</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. How to Raise a Dispute</h2>
            <div className="space-y-3 mt-2">
              {[
                { step: "1", title: "In-app reporting", desc: "Navigate to your booking history, select the relevant booking, and tap 'Report an Issue'. Provide a description and any supporting evidence (photos, messages)." },
                { step: "2", title: "Email support", desc: "Email disputes@bion.africa with your booking reference, provider name, date of service, and a description of the issue." },
                { step: "3", title: "Deadline", desc: "Disputes must be raised within 7 days of the service date. Billing disputes may be raised within 30 days of the transaction." },
              ].map(item => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo/10 flex items-center justify-center text-xs font-bold text-indigo shrink-0">{item.step}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Resolution Process</h2>
            <div className="space-y-3 mt-2">
              {[
                { step: "1", title: "Acknowledgement (24 hours)", desc: "BION acknowledges receipt of the dispute and assigns a case reference number." },
                { step: "2", title: "Investigation (48–72 hours)", desc: "BION reviews the booking details, payment records, messages, and any evidence provided by both parties. Both the client and provider are contacted for their account." },
                { step: "3", title: "Mediation", desc: "If the facts are disputed, BION facilitates communication between the parties to reach a mutually acceptable resolution." },
                { step: "4", title: "Decision (within 7 business days)", desc: "BION issues a written decision with reasoning. Possible outcomes include full refund, partial refund, service credit, or no action." },
                { step: "5", title: "Escalation", desc: "If either party is unsatisfied, they may escalate to the BION Dispute Review Panel or pursue external remedies (see Section 7)." },
              ].map(item => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-teal/10 flex items-center justify-center text-xs font-bold text-teal shrink-0">{item.step}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Refund Outcomes</h2>
            <div className="space-y-2">
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Provider no-show:</p>
                <p className="text-xs text-muted-foreground">Full refund to client. Provider receives a warning; repeated no-shows result in suspension.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Service quality issue (verified):</p>
                <p className="text-xs text-muted-foreground">Partial or full refund at BION's discretion. Provider may be required to offer a complimentary follow-up session.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Client no-show (no cancellation):</p>
                <p className="text-xs text-muted-foreground">No refund. Provider receives full payment for the booked session.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Billing error:</p>
                <p className="text-xs text-muted-foreground">Full refund of the erroneous amount. Processed via Paystack within 5–10 business days.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Provider Accountability</h2>
            <p>Providers with repeated valid disputes against them may face:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Reduced visibility in search results</li>
              <li>Loss of "Verified" or "Premium" badges</li>
              <li>Temporary suspension of booking capability</li>
              <li>Permanent removal from the Platform</li>
              <li>Reporting to relevant professional bodies (HPCSA, SANC, etc.)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. External Remedies</h2>
            <p>Nothing in this policy prevents users from pursuing external remedies, including:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Complaints to the National Consumer Commission under the Consumer Protection Act (CPA)</li>
              <li>Complaints to the Information Regulator under POPIA</li>
              <li>Complaints to the relevant professional body (HPCSA, AHPCSA, etc.)</li>
              <li>Small claims court proceedings</li>
              <li>Chargeback through the client's bank (note: fraudulent chargebacks may result in account suspension)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Fraudulent Disputes</h2>
            <p>Users who file knowingly false or fraudulent disputes may have their accounts suspended or terminated. Repeated fraudulent chargeback requests will be reported to Paystack and may result in the user being blocked from future transactions.</p>
          </section>

          <div className="pt-4 border-t border-white/5 text-xs text-muted-foreground">
            <p>BION (Pty) Ltd · Pretoria, South Africa</p>
            <p>Disputes: disputes@bion.africa · Support: support@bion.africa</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
