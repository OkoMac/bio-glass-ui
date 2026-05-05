/**
 * BION CANONICAL PRICING — frontend mirror of backend/src/config/pricing.ts
 *
 * Last updated: 2026-04-26
 *
 * KEEP IN SYNC with backend/src/config/pricing.ts. The drift-check script
 * (`scripts/check-pricing-drift.mjs`) verifies these stay aligned in CI.
 *
 * Use these constants in any UI that quotes pricing, fees, or commissions.
 * Do not hardcode prices in JSX strings.
 */

// ── Subscriptions ──────────────────────────────────────────────────────
export const SUBSCRIPTIONS = {
  client: {
    free:    { price: 0,  bookingFeeRate: 0.05 },
    premium: { price: 29, bookingFeeRate: 0.035 },
  },
  provider: {
    free:  { price: 0,   features: "basic listing + booking" },
    pro:   { price: 499, features: "CRM, analytics, messaging, programme builder" },
    elite: { price: 999, features: "Pro + advanced analytics, white-label, API, reduced platform fee" },
  },
  corporate: {
    perEmployeePerMonth: 150,
    description: "From R150/employee/month — wellness wallet (non-refundable, non-withdrawable). Custom pricing for orgs > 500 employees.",
  },
} as const;

export const TRANSACTION = {
  clientFeeRate: 0.05,
  clientFeeRatePremium: 0.035,
  bionPlatformRate: 0.05,
  acquisitionPoolRate: 0.05,
  paystackRate: 0.035,
  providerNetRate: 0.90,
} as const;

export const CANCELLATION = {
  earlyFeeRate: 0.10,
  lateFeeRate:  0.50,
  cutoffHours:  24,
} as const;

export const WALLET = {
  cashOutFeeRate:  0.10,
  cashOutMinRand:  200,
  topUpMinRand:    50,
} as const;

// Rangers earn from PROVIDER acquisition only. Client referrals are a
// separate peer-to-peer programme (CLIENT_REFERRAL below) — every BION
// client gets a unique referral code and earns R5.80/mo per Premium
// referee, regardless of whether they're a Ranger.
// 2026-05-05 — Per-transaction Ranger commission set to 0.5% flat
// per architecture review §1.3. §3.2's drop-entirely recommendation
// considered and rejected by Oko. See backend/src/config/pricing.ts
// for full reasoning.
export const RANGER = {
  bookingPercent: 0.005,         // 0.5% flat per §1.3
  subscriptionPercent: 0.20,
  payoutDayOfMonth: 3,
  withdrawalMinRand: 200,
  withdrawalFeeRate: 0.10,
} as const;

export const CLIENT_REFERRAL = {
  premiumPerpetualRand: 5.80,
  payoutDayOfMonth: 3,
} as const;

export const REWARDS = {
  pointsPerRand:        50,
  yearlyPointsCap:      250000,
  inactivityExpiryMonths: 18,
  expenditureRewardRate: 0.0025,
} as const;

// ── Tier benefits (mirror of backend/src/config/pricing.ts TIER_BENEFITS) ──
export const TIER_BENEFITS = {
  Bronze: {
    threshold: 0,
    earnMultiplier: 1.00,
    perks: ["Standard earning rate"],
  },
  Silver: {
    threshold: 1000,
    earnMultiplier: 1.05,
    perks: ["+5% on every log", "Early-access flag for new utilities"],
  },
  Gold: {
    threshold: 5000,
    earnMultiplier: 1.10,
    perks: ["+10% on every log", "1 free wellness check / month", "Priority customer support"],
  },
  Platinum: {
    threshold: 10000,
    earnMultiplier: 1.15,
    perks: ["+15% on every log", "1 free wellness check / month", "Priority booking on premium providers", "Premium support hotline"],
  },
} as const;

export type TierName = keyof typeof TIER_BENEFITS;

export function tierForBalance(balance: number): TierName {
  if (balance >= TIER_BENEFITS.Platinum.threshold) return "Platinum";
  if (balance >= TIER_BENEFITS.Gold.threshold) return "Gold";
  if (balance >= TIER_BENEFITS.Silver.threshold) return "Silver";
  return "Bronze";
}

export const BOOST = {
  oneWeekRand:   199,
  twoWeeksRand:  349,
  oneMonthRand:  599,
} as const;

export const DELIVERY = {
  pickupRand:     0,
  pudoRand:       59,
  pargoRand:      65,
  localRand:      75,
  provincialRand: 110,
  nationalRand:   165,
} as const;

export const DERIVED = {
  rangerPerProMonth:     SUBSCRIPTIONS.provider.pro.price * RANGER.subscriptionPercent,
  rangerPerEliteMonth:   SUBSCRIPTIONS.provider.elite.price * RANGER.subscriptionPercent,
  rangerPerEliteYear:    SUBSCRIPTIONS.provider.elite.price * RANGER.subscriptionPercent * 12,
  rangerPerPremiumMonth: SUBSCRIPTIONS.client.premium.price * RANGER.subscriptionPercent,
  bionTakeRate:          TRANSACTION.bionPlatformRate + TRANSACTION.acquisitionPoolRate,
} as const;

export function formatRand(amount: number): string {
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
