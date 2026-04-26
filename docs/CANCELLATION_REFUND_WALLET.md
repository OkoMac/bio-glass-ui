# BION — Cancellation, Refund & Wallet Flow
### Canonical workflow, last updated: 26 April 2026

This document is the source of truth for how money moves when a booking is cancelled. If anything in code or UI contradicts this document, the code must change — not the document.

---

## The Policy (in one sentence)

**The party who cancels pays the fee.** 24h+ before the booking = 10% fee. Less than 24h = 50% fee. This applies symmetrically — client or provider, same numbers.

---

## Setup: who has the money before cancellation?

When a client books and pays via Paystack:

1. Client pays **R(service × 1.05)** — service price plus 5% client fee.
2. Paystack takes ~3.5% of the bill as their processing fee. This is **lost** on any refund (Paystack does not return it).
3. The remainder lands in BION's Paystack balance.
4. **No money has moved to the provider's wallet yet.** It only moves when the session is marked completed (no-show or session-completed flow). Until then it's effectively held by BION.
5. BION's intended take is **10% of the service price** (5% platform + 5% acquisition pool). Provider intended take is 90%.

This is why "Money held safely until sessions complete" is true — there is no auto-payout to provider on booking. The provider only sees money in their wallet after the session completes.

---

## Workflow 1: Client cancels 24h+ before booking (early)

| Step | Who | What happens |
|------|-----|--------------|
| 1 | Client | Taps Cancel on /schedule |
| 2 | Frontend | `BookingsContext.cancel()` POSTs `/api/bookings/:id/cancel` |
| 3 | Backend | `bookings-checkout.ts` /:id/cancel calculates `hoursUntil` |
| 4 | Backend | Calls `computeRefund({ kind: "client_cancel_early", channel: "wallet", ... })` |
| 5 | `refundAccounting.ts` | Returns `client_refund = bill × 0.90`, `cancellation_fee = bill × 0.10` |
| 6 | Backend | Inserts `wallet_transactions` row (type=refund, amount=+R{refund}) for client |
| 7 | Backend | Updates `wallet_balances.balance` for client |
| 8 | Backend | Updates booking: `status='cancelled'`, `payment_status='refunded'` |
| 9 | Backend | Sends WhatsApp to provider — slot freed |
| 10 | Frontend | Receives `{ refund_amount, cancellation_fee, cancel_window: "early" }` |
| 11 | UI | Shows "R{X} refunded to wallet (10% fee R{Y} kept by BION)" |

**Money flow:**
- Client paid R472.50 (service R450 + 5% fee R22.50)
- Refund = R472.50 × 0.90 = R425.25 → client wallet
- BION keeps R47.25 (the 10% fee)
- BION lost R16.54 (Paystack fee, unrecoverable)
- BION net: R47.25 - R16.54 = **R30.71**
- Provider gets nothing (no session occurred)

---

## Workflow 2: Client cancels <24h before booking (late)

Same flow as above, but `kind: "client_cancel_late"`:
- Refund = R472.50 × 0.50 = R236.25 → client wallet
- BION keeps R236.25 (the 50% fee)
- BION net: R236.25 - R16.54 = **R219.71**
- Provider gets nothing

The 50% fee compensates BION + the provider for the late notice (in practice the 50% goes to BION; provider compensation for late client cancels is a future enhancement).

---

## Workflow 3: Provider cancels (early or late)

This is where the symmetric policy actually penalizes the provider — previously they faced zero consequence.

| Step | Who | What happens |
|------|-----|--------------|
| 1 | Provider | Taps Decline or Cancel in /pro/bookings |
| 2 | Frontend | PATCHes `/api/bookings/:id/status` with `status='declined'` or `'cancelled'` |
| 3 | Backend | `bookings.ts` PATCH /:id/status — checks `status === 'declined' OR 'cancelled'` AND `payment_status === 'paid'` |
| 4 | Backend | Calculates `hoursUntil`, picks `provider_cancel_early` or `provider_cancel_late` |
| 5 | `refundAccounting.ts` | Returns `client_refund = bill (full)`, `provider_penalty = service × (0.10 or 0.50)` |
| 6 | Backend | **Credits client wallet** with the full bill |
| 7 | Backend | **Debits provider wallet** with the cancellation penalty (negative `wallet_transactions` row, type=`cancellation_penalty`) |
| 8 | Backend | Updates booking: `payment_status='refunded'` |
| 9 | Frontend | UI updates client's wallet balance, shows refund |

**Money flow (provider cancels 24h+ early on R450 service):**
- Client receives full R472.50 refund to wallet
- Provider wallet debited R45 (10% of R450 service) — recorded as `wallet_transactions { type: 'cancellation_penalty', amount: -45 }`
- BION absorbs Paystack fee R16.54
- BION net: R45 - R16.54 = **R28.46**

**Money flow (provider cancels <24h late on R450 service):**
- Client receives full R472.50 refund to wallet
- Provider wallet debited R225 (50% of R450 service)
- BION absorbs Paystack fee R16.54
- BION net: R225 - R16.54 = **R208.46**

If the provider has a negative wallet balance after the penalty, the next booking they complete will pay it down before any payout. They cannot cash-out while in negative balance. This will need to be enforced when implementing payout queue (already partially in place via velocity caps).

---

## Workflow 4: Voucher-paid booking cancellation

Acquisition vouchers are restored, no cash refund happens.

| Step | What |
|------|------|
| 1 | Client cancels |
| 2 | Backend detects `payment_status === 'paid_by_voucher'` |
| 3 | Voucher row updated: `status='claimed', redeemed_at=null, redeemed_booking_id=null` |
| 4 | Booking marked `status='cancelled'` |
| 5 | UI: "Voucher restored — use it on another provider" |

No fee. No cash refund. The voucher is a marketing instrument, not a paid product.

---

## Workflow 5: Disputes (separate from cancellations)

Disputes are for service quality, no-shows, fraud — NOT for normal cancellations. These go through `disputes.ts` and the dispute resolution flow:

1. Client raises dispute via `/api/disputes/open`
2. B_ AI reviews the case, produces a recommendation
3. Admin makes final call: `dispute_full_refund`, `dispute_partial_refund`, `dispute_no_refund`
4. `computeRefund` applies a **10% BION refund fee** to discourage refund-as-tactic
5. Admin can `waive_bion_fee` when the provider was clearly at fault

The 10% dispute fee is the original "BION refund fee" from before the policy update. It still exists for the dispute path only — cancellations now use the symmetric 10%/50% rates instead.

---

## Wallet behavior

The BION Wallet is a closed-loop credit system. Money flows in via:

1. **Direct top-up** (Paystack) — `POST /api/wallet/topup` → Paystack checkout → webhook credits wallet
2. **Refunds** — cancellations, dispute resolutions, voucher payouts
3. **Provider earnings** — booking completion (90% of service price)
4. **Ranger commissions** — booking + subscription accruals

Money flows out via:

1. **In-app spending** — pay providers in one tap (no fee)
2. **Cash-out to bank** — 10% fee, R200 minimum, executed via Paystack Transfer

All wallet operations write a `wallet_transactions` row + update `wallet_balances.balance`. Frontend `useWallet` hook reads from `wallet_balances` (single source of truth).

### Where the canceller's penalty actually goes

When a CLIENT cancels: penalty stays in BION's account (the client's payment was already in BION's holdings; only the refund portion moves).

When a PROVIDER cancels: penalty is recorded as a negative `wallet_transactions` row on the provider's wallet, dropping their balance. If they have a positive balance from previous bookings, the penalty is deducted immediately. If not, they go negative — recovered from future bookings before any payout.

---

## Files involved

### Backend (Node.js / Express)
- `backend/src/utils/refundAccounting.ts` — pure refund math, the only place that does fee calculations
- `backend/src/routes/bookings.ts` — `PATCH /:id/status` (provider decline/cancel)
- `backend/src/routes/bookings-checkout.ts` — `POST /:id/cancel` (client cancel) + checkout + webhook
- `backend/src/routes/wallet.ts` — top-up, withdraw, balance, transactions
- `backend/src/routes/disputes.ts` — dispute settlement
- `backend/src/routes/payouts.ts` — bank transfer worker (cash-out)
- `backend/src/data/b_knowledge_base.ts` — B_'s answers about refund/cancel
- `backend/src/knowledge/bion-platform.ts` — B_'s platform knowledge

### Frontend (React / Vite)
- `bio-glass-ui/src/contexts/BookingsContext.tsx` — `cancel()` function
- `bio-glass-ui/src/components/BookingSheet.tsx` — booking UI + policy text
- `bio-glass-ui/src/pages/Schedule.tsx` — cancel modal
- `bio-glass-ui/src/components/NudgePopup.tsx` — BIONWallet onboarding popup
- `bio-glass-ui/src/components/DeeperDive.tsx` — Layer-3 onboarding billboard
- `bio-glass-ui/src/pages/Help.tsx` — FAQ
- `bio-glass-ui/src/pages/legal/Terms.tsx` — legal terms

### Database (Supabase)
- `bookings` — booking records + payment_status
- `wallet_balances` — current balance per user
- `wallet_transactions` — append-only ledger
- `acquisition_vouchers` — voucher state (for voucher-paid bookings)
- `disputes` — dispute records

---

## Testing checklist

To verify the system works end-to-end:

- [ ] Create paid booking 48h in the future, cancel as client → verify 10% fee, 90% wallet refund
- [ ] Create paid booking 12h in the future, cancel as client → verify 50% fee, 50% wallet refund
- [ ] Create paid booking 48h in the future, decline as provider → verify client gets 100%, provider wallet goes -10%
- [ ] Create paid booking 12h in the future, cancel as provider → verify client gets 100%, provider wallet goes -50%
- [ ] Create voucher-paid booking, cancel → verify voucher restored, no cash refund
- [ ] Cancel an unpaid booking (status=pending, payment_status=unpaid) → verify no refund attempted, just status change
- [ ] Verify `wallet_balances` reflects correct balance after each scenario
- [ ] Verify `wallet_transactions` has correct row with correct type + reference_id
- [ ] Verify booking row has correct `payment_status` (refunded / partial_refund)
- [ ] Verify provider gets WhatsApp notification when client cancels
- [ ] Verify B_ answers correctly when asked "how do refunds work?"
