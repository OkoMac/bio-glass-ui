import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function DisputeResolution() {
  const navigate = useNavigate();
  const updated = "21 April 2026";

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-20">
      <div className="mx-auto max-w-2xl px-4 pt-20 space-y-6">
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
              <li><span className="text-foreground font-medium">Service quality:</span> Service did not meet reasonable expectations or was not as described (in-person or telehealth)</li>
              <li><span className="text-foreground font-medium">No-show (provider):</span> Provider did not attend the scheduled appointment or failed to join a telehealth session</li>
              <li><span className="text-foreground font-medium">No-show (client):</span> Client did not attend without prior cancellation</li>
              <li><span className="text-foreground font-medium">Billing dispute:</span> Incorrect charge, double charge, or unauthorised transaction (including group bookings, packages and gift vouchers)</li>
              <li><span className="text-foreground font-medium">Safety concern:</span> Unsafe conditions, professional misconduct, or code of conduct violation</li>
              <li><span className="text-foreground font-medium">Cancellation dispute:</span> Disagreement about cancellation terms or refund amount</li>
              <li><span className="text-foreground font-medium">Telehealth issue:</span> Technical failure, provider unreachable during video consultation, or session quality problems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. How to Raise a Dispute</h2>
            <div className="space-y-3 mt-2">
              {[
                { step: "1", title: "In-app reporting (preferred)", desc: "From your order or booking in BION, tap 'Report a problem'. Pick the reason, describe what happened, and upload photo evidence directly from the app. The evidence is uploaded to BION's private, RLS-scoped storage bucket visible only to you, the provider, and BION admins." },
                { step: "2", title: "Email fallback", desc: "If you can't use the app, email disputes@bionhealth.co.za with your booking reference, provider name, date of service, and description." },
                { step: "3", title: "Deadline", desc: "Product orders: 7 days from delivery. Service bookings: 7 days from appointment date. Billing disputes: 30 days from the transaction. After these windows the transaction is considered final." },
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
            <h2 className="text-base font-semibold text-foreground mb-2">4. Resolution Process — B_ AI Mediation</h2>
            <p className="mb-2">Disputes on BION are mediated in-platform by <span className="text-foreground font-medium">B_</span>, our AI dispute mediator. Both sides keep full ownership of the outcome — B_ only recommends.</p>
            <div className="space-y-3 mt-2">
              {[
                { step: "1", title: "Buyer opens the dispute", desc: "Order status flips to 'disputed'; the provider is notified immediately and payout is frozen." },
                { step: "2", title: "Provider responds (within 3 days)", desc: "Provider submits their side with photo evidence. Failure to respond automatically forfeits the dispute to the buyer." },
                { step: "3", title: "B_ reviews both sides", desc: "B_ reads both statements and evidence, then issues a recommendation: refund_buyer, replace_product, decline_buyer, or admin_review_needed — with a confidence score and a short reasoning." },
                { step: "4", title: "Provider decides", desc: "Provider can Refund (credits buyer's wallet with full amount, marks order refunded), Ship Replacement (order returns to 'preparing', buyer ships the original back at their own cost), or Escalate to BION admin." },
                { step: "5", title: "Admin final call", desc: "Escalated disputes land in the BION admin queue. Admin can approve a refund or decline. Decision is final subject to external remedies (Section 7)." },
                { step: "6", title: "Timeline", desc: "Full resolution target: within 7 business days from opening. B_ reviews are near-instant; provider + admin actions extend the window." },
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
            <h2 className="text-base font-semibold text-foreground mb-2">5. Cancellation Policy</h2>
            <p className="mb-2">Routine cancellations (not disputes) follow these rules. B_ mediates all cancellations via WhatsApp.</p>
            <div className="space-y-2">
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Client cancels 24h+ before appointment:</p>
                <p className="text-xs text-muted-foreground">Full refund to BION Wallet, no fee.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Client cancels &lt;24h before (client's fault):</p>
                <p className="text-xs text-muted-foreground">50% cancellation fee; 50% refunded to wallet.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Voucher-paid booking cancelled:</p>
                <p className="text-xs text-muted-foreground">Voucher auto-restored to client's wallet, no fee.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Provider cancels:</p>
                <p className="text-xs text-muted-foreground">Full refund to client's wallet. Provider pays a 10% transaction fee (deducted from their wallet) and receives a cancellation strike.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Reschedule:</p>
                <p className="text-xs text-muted-foreground">Free, up to 3 times per booking.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Cancellation questionnaire:</p>
                <p className="text-xs text-muted-foreground">Required for all cancellations (7 client reasons, 6 provider reasons).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Refund Outcomes & Settlement</h2>
            <div className="space-y-2">
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Provider no-show:</p>
                <p className="text-xs text-muted-foreground">Full refund credited to client's BION Wallet within minutes of B_ or admin confirmation. Provider receives a warning on their profile.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Service quality / product defect (verified):</p>
                <p className="text-xs text-muted-foreground">Full or partial refund per B_'s recommendation and provider decision. For products: provider can alternatively ship a replacement; the buyer returns the original at their own cost.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Client no-show (no cancellation):</p>
                <p className="text-xs text-muted-foreground">No refund. Provider receives full payout for the booked session.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Billing error / unauthorised charge:</p>
                <p className="text-xs text-muted-foreground">Full refund via Paystack to the original payment method within 5–10 business days.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Dispute refund fee:</p>
                <p className="text-xs text-muted-foreground">Admin-processed dispute refunds carry a 10% BION refund fee (waivable when the provider was at fault).</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Refund destination:</p>
                <p className="text-xs text-muted-foreground">Default is the client's BION Wallet (fast, no bank fees). Clients may request bank refund via Paystack — this applies standard 5–10 business day processing.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Provider Accountability</h2>
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
            <h2 className="text-base font-semibold text-foreground mb-2">8. External Remedies</h2>
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
            <h2 className="text-base font-semibold text-foreground mb-2">9. Fraudulent Disputes</h2>
            <p>Users who file knowingly false or fraudulent disputes may have their accounts suspended or terminated. Repeated fraudulent chargeback requests will be reported to Paystack and may result in the user being blocked from future transactions.</p>
          </section>

          <div className="pt-4 border-t border-white/5 text-xs text-muted-foreground">
            <p>BION (Pty) Ltd · Pretoria, South Africa</p>
            <p>Disputes: disputes@bionhealth.co.za · Support: support@bionhealth.co.za</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
