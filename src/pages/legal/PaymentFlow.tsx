import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, ArrowRight } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function PaymentFlow() {
  const navigate = useNavigate();
  const updated = "21 April 2026";

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
                { step: "1", title: "Client books a service", desc: "Client selects a service, provider, date and time through the BION app or WhatsApp bot." },
                { step: "2", title: "Payment initiated", desc: "Client is directed to Paystack's PCI DSS Level 1 hosted checkout. BION never sees or stores card numbers." },
                { step: "3", title: "Paystack charges the client", desc: "Total charged = service price + 5% client fee. Example: R100 service → R105 charged." },
                { step: "4", title: "Split settlement", desc: "Paystack routes funds: 5% platform fee to BION, 5% ring-fenced to the provider's acquisition-marketing pool, the remainder (90% of the service price) to the provider's BION Wallet." },
                { step: "5", title: "Provider wallet credited on completion", desc: "Provider's share lands in their BION Wallet the moment they mark the booking completed. From there they can pay out to their South African bank account (10% cash-out fee), keep funds in-wallet, or voluntarily top up their acquisition pool." },
                { step: "6", title: "Ledger entry visible to both parties", desc: "Both client and provider see the transaction in their BION dashboard with full breakdown — amount, date, service, status, and any vouchers/rewards applied." },
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
            <p className="mb-2">Every fee is a flat percentage of the bill — fees are never compounded on each other.</p>
            <div className="space-y-2">
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Client pays:</p>
                <p className="text-xs text-muted-foreground">Service price + 5% client service fee. Premium subscribers (R29/month): reduced to 3.5%.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Provider receives (net payout):</p>
                <p className="text-xs text-muted-foreground">90% of the bill. That's the service price minus the 5% BION platform fee and a further 5% acquisition-marketing contribution that is ring-fenced into the provider's own voucher pool. Elite providers (R999/month) with Premium clients: platform fee reduced to 3.5%.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">BION receives:</p>
                <p className="text-xs text-muted-foreground">5% client fee + 5% platform fee (10% of the bill gross) minus Paystack processing (~3.5% of the charged amount) and any applicable Ranger transaction share (2%). The 5% acquisition-marketing contribution is <span className="text-foreground font-medium">not</span> BION revenue — it sits in the provider's pool and is spent on new-client vouchers.</p>
              </div>
              <div className="glass-1 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium">Example — R100 service:</p>
                <p className="text-xs text-muted-foreground">Client pays R105 · Provider net R90 · R5 to BION (platform) · R5 to provider's acquisition pool · R3.50 Paystack · ≈R1.50 BION net (up to R3.50 if no Ranger share).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Acquisition Marketing Contribution</h2>
            <p>5% of every completed booking is ring-fenced into an acquisition-marketing pool owned by the provider. BION uses this pool to mint vouchers (default face value R500) that appear in the Discovery feed for nearby clients who have never booked with that provider. When such a voucher is redeemed:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>The voucher pays the full bill to the provider (sourced from the provider's own pool).</li>
              <li>BION charges a 5% transaction fee on the face value (cost of acquisition).</li>
              <li>Clients who have already booked the provider are never eligible.</li>
            </ul>
            <p className="mt-2">Providers can voluntarily top up their pool at any time to mint additional vouchers.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Rewards & Loyalty</h2>
            <p className="mb-1"><span className="text-foreground font-medium">Activity Points</span> — engagement rewards for tracking water, food, sleep, check-ins, streaks. 50 points = R1 of in-app store value. Hard-capped at 250,000 points per user per year (= R5,000). Points expire after 18 months of user inactivity.</p>
            <p className="mt-2"><span className="text-foreground font-medium">Expenditure Rewards</span> — Premium subscribers earn Rand-denominated vouchers on qualifying monthly spend. Vouchers have a 12-month expiry and apply a maximum 30% discount per booking.</p>
            <p className="mt-2"><span className="text-foreground font-medium">Referral commissions</span> — BION clients who refer friends who activate Premium earn R5.80/month (20% of R29) per active referral, paid into the referrer's Earnings account monthly for as long as the referred client stays on Premium.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Subscription Payments</h2>
            <p><span className="text-foreground font-medium">Provider subscriptions:</span></p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Free: Basic listing + booking tools (no charge)</li>
              <li>Pro: R499/month — messaging, analytics, client management, programme builder</li>
              <li>Elite: R999/month — all Pro features + advanced analytics, white-label, API access</li>
            </ul>
            <p className="mt-2"><span className="text-foreground font-medium">Client subscriptions:</span></p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Free: discovery, booking, messaging, health tracking, activity points.</li>
              <li>Premium: R29/month — reduces the client service fee from 5% to 3.5%, unlocks Expenditure Rewards vouchers, and enables priority support.</li>
            </ul>
            <p className="mt-2">Subscriptions are billed monthly via Paystack recurring payments. Users can cancel at any time from their billing settings — active subscription benefits continue until the end of the current billing period.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. BION Wallet & Withdrawals</h2>
            <p>Provider and referrer earnings settle to a BION Wallet — a closed-loop credit system (not a banking product). Funds in a wallet can be:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Spent on any BION service (bookings, subscriptions, voluntary acquisition top-ups) with no fee.</li>
              <li>Withdrawn to the user's registered South African bank account via Paystack Transfer. A 10% cash-out fee applies — this covers Paystack transfer costs, BION Paystack fees, and FICA/regulatory compliance. Minimum withdrawal R200.</li>
            </ul>
            <p className="mt-2">Corporate Wallets are non-refundable, non-transferable and non-withdrawable: corporate credits are loaded for employee wellness spend only.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Sales Representative (Ranger) Commissions</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li><span className="text-foreground font-medium">Provider subscriptions:</span> 20% of the monthly subscription of providers the Ranger signed up — R99.80/month on a Pro plan, R199.80/month on Elite. Paid for as long as the provider stays subscribed.</li>
              <li><span className="text-foreground font-medium">Transaction share:</span> 2% of every completed booking processed by those providers. Deducted from BION's platform share — not from the provider's payout.</li>
              <li><span className="text-foreground font-medium">Client referrals:</span> R5.80/month (20% of R29) per active Premium referral, perpetual while the client stays on Premium.</li>
              <li>Commissions are accrued on the 3rd business day of each month into the Ranger's Earnings account. Minimum withdrawal R200. 10% cash-out fee applies to bank withdrawals.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">9. Refunds, Cancellations & Disputes</h2>
            <p className="mb-2"><span className="text-foreground font-medium">Client cancellations:</span></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Client cancels <span className="text-foreground font-medium">more than 24 hours</span> before the appointment: full refund to BION Wallet, no fee.</li>
              <li>Client cancels <span className="text-foreground font-medium">less than 24 hours</span> before (client's fault): 50% cancellation fee; 50% refunded to wallet.</li>
              <li>Voucher-paid bookings: voucher auto-restored to client's wallet, no fee.</li>
              <li>A cancellation questionnaire is required (7 client reasons, 6 provider reasons).</li>
            </ul>
            <p className="mt-2 mb-2"><span className="text-foreground font-medium">Provider cancellations:</span></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Provider cancels: full refund to client's wallet + provider pays a 10% transaction fee (deducted from provider's wallet) + cancellation strike on provider's record.</li>
            </ul>
            <p className="mt-2 mb-2"><span className="text-foreground font-medium">Rescheduling:</span></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Free, up to 3 times per booking.</li>
            </ul>
            <p className="mt-2 mb-2"><span className="text-foreground font-medium">No-shows & disputes:</span></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>No-shows: no refund; provider receives full payment.</li>
              <li>Disputes: email disputes@bionhealth.co.za. Admin processes with a 10% BION refund fee (waivable when provider is at fault).</li>
              <li>Service disputes are mediated in-platform by <span className="text-foreground font-medium">B_ AI</span>. Both buyer and provider submit statements + evidence within a 7-day window, B_ issues a recommendation, and the provider chooses to refund, replace, or escalate to BION admin.</li>
              <li>For product orders: a 7-day dispute window opens on delivery. Beyond that, payout is final unless fraud is suspected.</li>
            </ul>
            <p className="mt-2">B_ mediates all cancellations via WhatsApp. Refunds default to the client's BION Wallet.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">10. Security & Compliance</h2>
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
            <p>Contact: accounts@bionhealth.co.za</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
