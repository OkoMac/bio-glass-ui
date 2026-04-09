import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, ArrowRight } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function PaymentFlow() {
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
            <h1 className="text-2xl font-bold text-foreground">How Payments Work</h1>
            <p className="text-xs text-muted-foreground">Last updated: {updated}</p>
          </div>
        </div>

        <GlassCard className="p-6 space-y-6 text-sm text-muted-foreground leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Overview</h2>
            <p>BION is a marketplace platform connecting clients with health, wellness, beauty, fitness, and medical service providers. All payments are processed securely through <span className="text-teal font-medium">Paystack</span>, a PCI DSS Level 1 compliant payment processor regulated by the South African Reserve Bank.</p>
            <p className="mt-2">BION does not hold client funds. Payments flow directly from client to provider via Paystack's split payment infrastructure.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Payment Flow — Step by Step</h2>
            <div className="space-y-3 mt-3">
              {[
                { step: "1", title: "Client books a service", desc: "Client selects a service, provider, date, and time through the BION app." },
                { step: "2", title: "Payment initiated", desc: "Client is directed to Paystack's secure checkout page. Card details are entered on Paystack's PCI-compliant hosted page — BION never sees or stores card numbers." },
                { step: "3", title: "Paystack processes payment", desc: "Paystack charges the client the service fee plus a 5% BION booking fee. Example: R100 service + R5 booking fee = R105 total." },
                { step: "4", title: "Split payment executed", desc: "Paystack automatically splits the payment using subaccounts: the provider receives their portion minus a 5% platform fee, and BION receives the platform commission." },
                { step: "5", title: "Provider receives payout", desc: "Paystack settles to the provider's registered South African bank account. Settlement timing follows Paystack's standard schedule (T+1 for verified accounts)." },
                { step: "6", title: "Transaction recorded", desc: "Both client and provider see the transaction in their BION dashboard with full details including amount, date, service, and status." },
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
            <h2 className="text-base font-semibold text-foreground mb-2">3. Fee Structure</h2>
            <div className="space-y-2">
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Client pays:</p>
                <p className="text-xs text-muted-foreground">Service price + 5% booking fee</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Provider receives:</p>
                <p className="text-xs text-muted-foreground">Service price minus 5% platform fee (reduced to 3.5% for Elite providers with Premium clients)</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">BION receives:</p>
                <p className="text-xs text-muted-foreground">5% booking fee + 5% platform fee minus Paystack processing fee (~2.9% + R1.50 per transaction)</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Example — R100 service:</p>
                <p className="text-xs text-muted-foreground">Client pays R105 · Provider receives R95 · BION net ≈ R7.42 after Paystack fees</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Subscription Payments</h2>
            <p><span className="text-foreground font-medium">Provider subscriptions:</span></p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Free: Basic listing + booking tools (no charge)</li>
              <li>Pro: R499/month — messaging, analytics, client management, programme builder</li>
              <li>Elite: R999/month — all Pro features + advanced analytics, white-label, API access</li>
            </ul>
            <p className="mt-2"><span className="text-foreground font-medium">Client subscriptions:</span></p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Free: Basic health tracking + booking</li>
              <li>Premium: R29/month — reduced transaction fee (3.5% instead of 5%)</li>
            </ul>
            <p className="mt-2">Subscriptions are billed monthly via Paystack recurring payments. Users can cancel at any time from their billing settings.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Corporate Wallet (BIONWallet)</h2>
            <p>Corporate accounts can load credits into a BIONWallet via Paystack. These credits are distributed to employees as wellness allowances. BIONWallet is a closed-loop credit system — not a banking product. Credits can only be spent on services within the BION platform and are non-refundable, non-transferable, and non-withdrawable.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Sales Representative Commissions</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>Sales reps earn 2% of all transactions from providers they onboard (1% for Elite providers)</li>
              <li>20% of subscription fees from providers they onboard</li>
              <li>Commissions accumulate monthly and are paid out via Paystack Transfer to the rep's registered bank account</li>
              <li>Minimum payout threshold: R100</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Refunds & Cancellations</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>Cancellations made 24+ hours before appointment: full refund minus Paystack processing fee</li>
              <li>Cancellations within 24 hours: 50% refund at provider's discretion</li>
              <li>No-shows: no refund (provider receives full payment)</li>
              <li>Service complaints: handled via dispute resolution process</li>
              <li>Refunds are processed via Paystack and returned to the original payment method within 5–10 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Security & Compliance</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>All payments processed by Paystack (PCI DSS Level 1 certified)</li>
              <li>BION never stores card numbers, CVVs, or banking PINs</li>
              <li>3D Secure authentication supported for card payments</li>
              <li>Compliant with POPIA (data protection), ECTA (electronic transactions), and CPA (consumer protection)</li>
              <li>Provider bank details verified via Paystack account validation API</li>
            </ul>
          </section>

          <div className="pt-4 border-t border-white/5 text-xs text-muted-foreground">
            <p>BION (Pty) Ltd · Pretoria, South Africa</p>
            <p>Payment processor: Paystack Payments (Pty) Ltd</p>
            <p>Contact: finance@bion.club</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
