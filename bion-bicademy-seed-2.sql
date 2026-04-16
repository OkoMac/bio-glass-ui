-- ============================================================
-- BION Bicademy — Seed 2: RANGER-104 through RANGER-110
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
-- Requires the base bion-bicademy-seed.sql to have been run first
-- ============================================================

DELETE FROM lessons WHERE course_id IN (
  SELECT id FROM courses WHERE course_code IN (
    'RANGER-104','RANGER-105','RANGER-106','RANGER-107','RANGER-108','RANGER-109','RANGER-110'
  )
);
DELETE FROM assessment_questions WHERE course_id IN (
  SELECT id FROM courses WHERE course_code IN (
    'RANGER-104','RANGER-105','RANGER-106','RANGER-107','RANGER-108','RANGER-109','RANGER-110'
  )
);

-- ═══════════════════════════════════════════════════════════════
-- RANGER-104 · Selling to Clients
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (course_id, lesson_number, title, content_type, content, duration_minutes, key_takeaways)
SELECT courses.id, n, l_title, 'text', l_content, dur, l_takeaways::jsonb
FROM courses,
(VALUES
  (1, 'Free vs Premium — what clients get', 5,
    '# The client product ladder

## Free
Every BION client starts here. They can:
- Discover + book verified providers
- Chat with providers via WhatsApp-native bot
- Earn Activity Points for app engagement (logging, check-ins, streaks)
- Use BION Wallet for cashless bookings

## Premium — R29/month
Adds:
- **Expenditure Rewards** on every booking (rands back as vouchers)
- Priority booking slots (where providers offer them)
- Priority support (Tier 1 AI, escalates faster)
- Ad-free discovery feed

## Who should go Premium?
Anyone spending **R600+ on wellness per month** immediately breaks even. That''s roughly one salon visit, one gym membership, or 2 fitness classes. Above that, Premium is always money-positive.',
    '["Free tier covers discovery + booking + wallet","Premium R29/mo adds Expenditure Rewards + priority","Break-even at roughly R600/mo spend","Pitch Premium to regular spenders, not occasional users"]'
  ),
  (2, 'The client referral mechanic', 5,
    '# How clients earn from BION

Any BION client can refer other clients. They earn:
- **50 Activity Points** on signup (referrer + referee both get it)
- **20% of the referred user''s Premium subscription** = R5.80/mo, perpetual

## The 100-referral threshold
Once a client has **100 active Premium referrals**, they''re invited to become a **Ranger** — the sales-rep tier that also earns from provider subs.

## Your role as a Ranger in client acquisition
You **can** sign up individual clients, but your commission structure rewards provider signups heavily more. **Focus clients as a side-funnel** — refer corporate contacts, gym members, your own network.

**IMPORTANT: Clients can refer other clients; only Rangers can refer providers.**',
    '["Clients earn 20% (R5.80/mo) on Premium referrals perpetually","50 Activity Points on signup for both sides","100 active referrals = Ranger invitation","Clients refer clients. Rangers refer providers."]'
  ),
  (3, 'Qualifying + disqualifying clients', 4,
    '# Who to sign, who to skip

## Green flags
- Already spends on gym/classes/spa monthly
- Uses WhatsApp daily
- Has a smartphone < 4 years old
- Comfortable with Paystack card checkout
- In your target suburb (for follow-through visits)

## Yellow flags (still sign, but manage expectations)
- Occasional wellness spender (R200-400/mo)
- Pensioners — they often prefer phone bookings
- Cash-heavy households

## Red flags (skip or defer)
- No smartphone
- Expressed negative view of "app-based services"
- Lives >40km from your nearest available providers
- Already burned by a competitor (will compare constantly)

## The 90-day rule
A client who doesn''t book anything in their first 90 days churns at 78%. Check in at day 14, 30, 60 — help them book something meaningful.',
    '["Green: regular wellness spender + WhatsApp daily","Yellow: occasional spender still worth signing","Red: no smartphone, bad prior experience, distance","90-day rule: first booking within 3 months or they churn"]'
  ),
  (4, 'Pitch scripts for clients', 4,
    '# The 60-second client pitch

*"Do you use WhatsApp?" (yes) "Do you ever book a salon or gym session?" (yes) "BION is an app that lets you discover and book every wellness service in one place, paid through one wallet, with cashback on every booking. Free to join — takes 30 seconds. Want me to show you?"*

## The Premium upsell (after signup)
Let them book free for a week. Then:
*"You''ve already saved X hours hunting providers. Premium is R29/mo — you get cashback on every booking. If you spend R600/mo on wellness, you''re already ahead."*

## The referral ask
After their first successful booking:
*"BION pays you R5.80 a month for every friend you refer who upgrades to Premium. Your code is in your profile. Send it to 5 people this week."*',
    '["Open with the WhatsApp + wellness spender questions","Don''t force Premium — let them book free first","First successful booking is the moment to ask for referrals","Always share the concrete R5.80/mo number"]'
  )
) AS t(n, l_title, dur, l_content, l_takeaways)
WHERE course_code = 'RANGER-104';

INSERT INTO assessment_questions (course_id, question_number, question_text, question_type, options, explanation, points)
SELECT courses.id, n, q_text, 'single', q_options::jsonb, q_exp, q_pts
FROM courses,
(VALUES
  (1, 'At roughly what monthly wellness spend does Premium break even?',
    '[{"id":"a","text":"R100","isCorrect":false},{"id":"b","text":"R600","isCorrect":true},{"id":"c","text":"R1500","isCorrect":false},{"id":"d","text":"R3000","isCorrect":false}]',
    'R600/mo ≈ one salon visit or gym membership. Above that, Premium is always net-positive.', 1),
  (2, 'Who can sign up new providers to BION?',
    '[{"id":"a","text":"Any BION client","isCorrect":false},{"id":"b","text":"Only Rangers (sales reps)","isCorrect":true},{"id":"c","text":"Only the BION admin team","isCorrect":false},{"id":"d","text":"Providers themselves","isCorrect":false}]',
    'Clients refer clients. Rangers refer providers. Clear separation of referral paths.', 2),
  (3, 'How many active Premium referrals qualifies a client to become a Ranger?',
    '[{"id":"a","text":"25","isCorrect":false},{"id":"b","text":"50","isCorrect":false},{"id":"c","text":"100","isCorrect":true},{"id":"d","text":"500","isCorrect":false}]',
    '100 active Premium referrals unlocks the Ranger invitation.', 2),
  (4, 'A client hasn''t booked anything in their first 90 days. What is their churn risk?',
    '[{"id":"a","text":"<20%","isCorrect":false},{"id":"b","text":"~40%","isCorrect":false},{"id":"c","text":"~78%","isCorrect":true},{"id":"d","text":"~95%","isCorrect":false}]',
    '78% churn rate at 90 days with no booking. Follow up at day 14, 30, 60.', 2),
  (5, 'When should you ask a newly-signed-up client for referrals?',
    '[{"id":"a","text":"Immediately on signup","isCorrect":false},{"id":"b","text":"After their first successful booking","isCorrect":true},{"id":"c","text":"After 3 months","isCorrect":false},{"id":"d","text":"Only if they upgrade to Premium","isCorrect":false}]',
    'First successful booking = proof BION works for them. That''s the conversion moment for referrals.', 1)
) AS t(n, q_text, q_options, q_exp, q_pts)
WHERE course_code = 'RANGER-104';

-- ═══════════════════════════════════════════════════════════════
-- RANGER-105 · Rewards & Loyalty
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (course_id, lesson_number, title, content_type, content, duration_minutes, key_takeaways)
SELECT courses.id, n, l_title, 'text', l_content, dur, l_takeaways::jsonb
FROM courses,
(VALUES
  (1, 'The dual-currency model', 6,
    '# Two separate reward currencies — do not confuse them

## Activity Points (engagement currency)
Earned for **non-monetary actions**: logging water intake, daily check-ins, prescription adherence, wellness habits, completing health surveys.
- **NOT earned** from spending money on bookings
- 50 pts = R1 store value
- Redeemable only in the BION store (sponsored products, swag)
- Capped at **250,000 points/year per user** (= R5,000)
- Subscribers only can redeem (prevents abuse via new-signup farming)

## Expenditure Rewards (spending-linked vouchers)
Earned as rands back when clients spend.
- Rand-denominated
- Max discount per booking: 30% (prevents "free session" stacking)
- 12-month expiry
- Premium subscribers only (it''s a key Premium benefit)

**Never market the exact % publicly.** Position as "Expenditure Rewards" without specifying the rate.',
    '["Activity Points = engagement rewards, capped 250k/yr","Expenditure Rewards = spending-linked rand vouchers","Separate currencies — never combine them","Premium subscribers only can redeem either"]'
  ),
  (2, 'Streak milestones & sponsor-funded rewards', 5,
    '# Streaks = the engagement engine

Clients build streaks by logging activity daily. Tiers:
- **Bronze**: 7-day streak
- **Silver**: 30-day streak
- **Gold**: 90-day streak
- **Platinum**: 365-day streak

## How streak rewards work
Each tier unlocks a **pool of sponsored rewards**. These aren''t funded by BION — they''re **advertiser-funded** (e.g., Woolworths sponsors the Gold tier for Q2 2026 with R500 grocery vouchers).

## Why this matters for you
- **Streaks drive app stickiness** — users who hit 7 days rarely churn
- When pitching BION to providers: "Your clients earn streak rewards just for logging with us. That builds habit with your brand."
- When pitching to potential advertisers: "Reach wellness-engaged users with non-intrusive rewards, measured by redemption."',
    '["Streaks: Bronze 7d, Silver 30d, Gold 90d, Platinum 365d","Streak rewards are advertiser-funded, not BION-funded","7-day streak = stickiness unlock","Streaks = unique pitch angle for advertisers"]'
  ),
  (3, 'Acquisition vouchers (the marketing levy)', 6,
    '# New-client acquisition mechanic

Every provider contributes a **portion of completed bookings** into an acquisition voucher pool. That pool funds vouchers given to **clients who have never booked that provider before**.

## How it works end-to-end
1. Oko''s yoga studio completes R20,000 in bookings (many small sessions)
2. A portion of that accrues in Oko''s voucher balance
3. Once the balance hits voucher-mint threshold, BION mints acquisition vouchers
4. Vouchers appear in the **Expenditure Rewards strip** on Discovery for nearby clients who''ve never booked Oko
5. A client claims + redeems one — Oko performs the service, gets paid from his own pool

## Why it works
Providers don''t need to run Instagram ads. Their best marketing budget is the one that auto-generates from their own bookings — spent only on **genuinely new** clients, never existing ones.

## What you tell providers
*"BION automatically spends a portion of your transactions on acquiring new clients for you. You never touch ads. New clients find you through our Discovery feed."*',
    '["Providers auto-fund acquisition vouchers via booking levy","Vouchers target never-booked, nearby clients only","Providers can voluntarily boost the pool for more vouchers","Eliminates the need for providers to run manual ad spend"]'
  ),
  (4, 'Tips — how they flow, tax, and handling', 5,
    '# Tipping on BION

Clients can tip providers on any booking.

## The flow
1. After service completion, client sees "Add a tip?" prompt
2. Presets: R20, R50, R100, or custom
3. Tip flows through Paystack (client pays) to the provider''s wallet
4. **Provider keeps the tip minus Paystack''s ~3.5% fee**
5. No BION platform cut on tips — ever

## Why we charge Paystack but not a BION fee
Tipping is client goodwill. Taking a platform cut would feel like tax. Paystack''s fee is unavoidable because we''re processing a card transaction. We''re transparent about it but **don''t advertise the number**.

## Tax implications for providers
Tips are taxable income in South Africa. We log them separately in the provider''s earnings report for their accountant. **Always point to the "Tax export" in Billing when asked.**',
    '["Provider gets ~96.5% of tip after Paystack","BION takes ZERO on tips","Tips are logged separately for SARS reporting","Point providers to the Tax export, don''t advise on tax yourself"]'
  )
) AS t(n, l_title, dur, l_content, l_takeaways)
WHERE course_code = 'RANGER-105';

INSERT INTO assessment_questions (course_id, question_number, question_text, question_type, options, explanation, points)
SELECT courses.id, n, q_text, 'single', q_options::jsonb, q_exp, q_pts
FROM courses,
(VALUES
  (1, 'Which of these EARNS Activity Points?',
    '[{"id":"a","text":"Paying for a booking","isCorrect":false},{"id":"b","text":"Logging water intake daily","isCorrect":true},{"id":"c","text":"Signing up a new provider","isCorrect":false},{"id":"d","text":"Receiving a tip","isCorrect":false}]',
    'Activity Points are for non-monetary engagement. Spending earns Expenditure Rewards (a different currency).', 2),
  (2, 'What is the yearly cap on Activity Points per user?',
    '[{"id":"a","text":"10,000","isCorrect":false},{"id":"b","text":"50,000","isCorrect":false},{"id":"c","text":"250,000","isCorrect":true},{"id":"d","text":"1,000,000","isCorrect":false}]',
    '250,000 points (= R5,000) per user per year. Prevents abuse from habit-farming.', 1),
  (3, 'What % of a tip does BION take?',
    '[{"id":"a","text":"0% — BION never takes a cut on tips","isCorrect":true},{"id":"b","text":"5%","isCorrect":false},{"id":"c","text":"10%","isCorrect":false},{"id":"d","text":"The full Paystack fee","isCorrect":false}]',
    'BION takes zero on tips. Provider absorbs only the unavoidable Paystack fee.', 2),
  (4, 'Who funds streak-milestone rewards?',
    '[{"id":"a","text":"BION platform","isCorrect":false},{"id":"b","text":"The providers","isCorrect":false},{"id":"c","text":"Advertisers / sponsors","isCorrect":true},{"id":"d","text":"The clients themselves","isCorrect":false}]',
    'Sponsored rewards are advertiser-funded. BION and providers don''t pay.', 1),
  (5, 'An acquisition voucher can be redeemed by:',
    '[{"id":"a","text":"Any BION client","isCorrect":false},{"id":"b","text":"A client who has previously booked that provider","isCorrect":false},{"id":"c","text":"A nearby client who has never completed a paid booking with that provider","isCorrect":true},{"id":"d","text":"Only Premium subscribers","isCorrect":false}]',
    'Acquisition vouchers are ONLY for new-to-that-provider clients. Existing customers never qualify.', 2)
) AS t(n, q_text, q_options, q_exp, q_pts)
WHERE course_code = 'RANGER-105';

-- ═══════════════════════════════════════════════════════════════
-- RANGER-106 · Storefronts & Delivery
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (course_id, lesson_number, title, content_type, content, duration_minutes, key_takeaways)
SELECT courses.id, n, l_title, 'text', l_content, dur, l_takeaways::jsonb
FROM courses,
(VALUES
  (1, 'What providers can sell', 4,
    '# Products a provider can list

## Allowed
- **Supplements** (vitamins, protein, collagen — if compliant with SA medicines act)
- **Equipment** (yoga mats, resistance bands, mini trampolines)
- **Apparel** (branded tees, gym gear)
- **Merchandise** (water bottles, tote bags)
- **Digital products** (e-books, meal plans, workout PDFs)

## Pre-approved checks via B_ AI
Every product submission goes through our B_ AI reviewer:
- Medical claims must be substantiated (no "cures cancer" type copy)
- No Schedule 4/5 medicines
- No age-restricted products to under-18 clients
- No weapons, alcohol marketing, gambling

## Hard no-gos
- Prescription medicines
- Illegal substances
- Adult content
- Animal products (meat, raw dairy) unless provider has relevant vet/food licensing',
    '["5 allowed categories: supplements, equipment, apparel, merch, digital","Every product pre-screened by B_ AI","Medical claims need substantiation","Hard no: scheduled meds, weapons, adult content"]'
  ),
  (2, 'Delivery zones — how to explain', 6,
    '# The 6 delivery zones

| Zone | Base rate | Use case |
|---|---|---|
| Pickup | R0 | Client collects at provider''s location |
| Pudo | R59 | Locker-to-locker (cheapest courier) |
| Pargo | R65 | Pickup point — Pep stores, forecourts, etc. |
| Local | R75 | Same city, door-to-door |
| Provincial | R110 | Cross-province (PTA→Durban) |
| National | R165 | Cross-country, rural coverage |

## Weight + oversize surcharges
- Items >2kg add R15/kg above 2kg
- Items with longest side >50cm add a flat R40

## How to advise providers
*"Pick the 2-3 zones most relevant to your products. Don''t try to cover everything — a yoga mat seller doesn''t need National; a supplements brand does."*

## Who covers delivery cost?
**The buyer** pays the delivery cost on top of the product price. Never deducted from the provider''s payout.',
    '["6 zones: Pickup(0), Pudo(59), Pargo(65), Local(75), Provincial(110), National(165)","Weight surcharges above 2kg, oversize above 50cm","Buyer pays delivery on top of product cost","Advise providers to enable only relevant zones"]'
  ),
  (3, 'Order fulfilment workflow', 6,
    '# The path from order to delivered

## 1. Client orders
They checkout via Paystack card payment. Order status = `paid`.

## 2. Provider gets notified
Push + WhatsApp message + dashboard badge. They see the order in /pro/orders.

## 3. Provider marks `preparing`
Usually within 24 hours. If > 48 hours passive, BION auto-messages the provider to follow up.

## 4. Provider ships / marks ready
- **Courier orders**: provider books the courier, enters tracking number
- **Pickup orders**: provider marks `ready_for_pickup`, client gets WhatsApp notification

## 5. Delivery / pickup completes
- **Courier**: provider marks `delivered` when courier confirms
- **Pickup**: provider marks `delivered` when client collects

## 6. Payout drops
Provider''s wallet is credited automatically upon delivery confirmation. Platform fees already deducted at checkout — no second pass.

## Dispute window
Client has 7 days from delivery to open a dispute. After that, order is locked and payout is final.',
    '["Order states: paid → preparing → shipped → delivered","48h no-action triggers BION auto-follow-up","Payout drops on delivered, auto-credited to wallet","7-day dispute window after delivery"]'
  )
) AS t(n, l_title, dur, l_content, l_takeaways)
WHERE course_code = 'RANGER-106';

INSERT INTO assessment_questions (course_id, question_number, question_text, question_type, options, explanation, points)
SELECT courses.id, n, q_text, 'single', q_options::jsonb, q_exp, q_pts
FROM courses,
(VALUES
  (1, 'Which of these can a provider sell on their Storefront?',
    '[{"id":"a","text":"Prescription antibiotics","isCorrect":false},{"id":"b","text":"Collagen supplements","isCorrect":true},{"id":"c","text":"Schedule 5 medicines","isCorrect":false},{"id":"d","text":"Alcoholic beverages","isCorrect":false}]',
    'Supplements are allowed if compliant with SA medicines act. Prescription/scheduled meds are never allowed.', 2),
  (2, 'A provider in Pretoria sends a 5kg package to Cape Town. Cheapest sensible zone?',
    '[{"id":"a","text":"Pickup","isCorrect":false},{"id":"b","text":"Pargo","isCorrect":false},{"id":"c","text":"Provincial","isCorrect":false},{"id":"d","text":"National","isCorrect":true}]',
    'Cross-country = National R165 base + R45 weight surcharge (3kg over 2kg). Provincial is cross-province not cross-country.', 2),
  (3, 'Who pays the delivery cost on a Storefront order?',
    '[{"id":"a","text":"Provider","isCorrect":false},{"id":"b","text":"BION","isCorrect":false},{"id":"c","text":"Buyer, on top of product price","isCorrect":true},{"id":"d","text":"Split 50/50","isCorrect":false}]',
    'Buyer always pays delivery. Provider payout is not reduced by delivery fees.', 1),
  (4, 'How long does a client have to open a dispute after delivery?',
    '[{"id":"a","text":"24 hours","isCorrect":false},{"id":"b","text":"7 days","isCorrect":true},{"id":"c","text":"14 days","isCorrect":false},{"id":"d","text":"30 days","isCorrect":false}]',
    '7-day dispute window. After that, order locks and payout is final.', 1),
  (5, 'Who reviews every product before it appears on Storefront?',
    '[{"id":"a","text":"Admin team manually","isCorrect":false},{"id":"b","text":"B_ AI risk reviewer","isCorrect":true},{"id":"c","text":"Nobody — instant publish","isCorrect":false},{"id":"d","text":"The provider themselves","isCorrect":false}]',
    'B_ AI pre-screens every product for compliance, safety, and medical-claim verification.', 2)
) AS t(n, q_text, q_options, q_exp, q_pts)
WHERE course_code = 'RANGER-106';

-- ═══════════════════════════════════════════════════════════════
-- RANGER-107 · Support Protocols
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (course_id, lesson_number, title, content_type, content, duration_minutes, key_takeaways)
SELECT courses.id, n, l_title, 'text', l_content, dur, l_takeaways::jsonb
FROM courses,
(VALUES
  (1, 'The 3-tier support structure', 6,
    '# Who handles what

## Tier 1 — B_ AI (automated)
Handled by **B_**, BION''s support AI. Resolves:
- Password resets
- Booking cancellation questions
- How-to questions
- Basic wallet balance enquiries
- Where''s-my-order tracking

**Target response time: <2 min.** 70% of tickets resolved here.

## Tier 2 — Rangers (you, once accredited)
Escalated by B_ when:
- AI confidence < 80% on resolution
- Client or provider explicitly asks for a human
- Transaction values > R500 in dispute

**Target response time: <2 hours during business hours.**

## Tier 3 — BION Admin
Escalated to admin when:
- POPIA / data privacy complaint
- Suspected fraud
- Tier 2 can''t resolve within 24h
- Legal / regulatory matter
- Platform-wide issues

**Target response time: <24 hours.**',
    '["Tier 1 = B_ AI for 70% of tickets, <2min","Tier 2 = Rangers for escalations, <2hr","Tier 3 = Admin for POPIA, fraud, legal, <24hr","AI confidence <80% triggers escalation to Ranger"]'
  ),
  (2, 'Escalation triggers — when to escalate yourself', 5,
    '# Stop and escalate

As a Ranger, some things **must go to admin**, not handled by you:

## Always escalate (Tier 3)
- Any mention of **POPIA** / **data breach** / **personal info exposure**
- Allegations of **provider misconduct** (unprofessional behaviour, no-shows, health issues during session)
- Any **refund request > R2,000**
- **Fraud** (fake accounts, stolen cards, inflated reviews)
- **Medical complications** during or after a session
- **Legal threats** ("my lawyer will contact you")

## Handle yourself (Tier 2)
- Booking changes / rebooking disputes
- Refunds < R500 where both parties agree
- Feature questions that B_ AI couldn''t answer
- Provider tool training requests

## Golden rule
**When in doubt, escalate.** Tier 3 wait time is better than mishandling a regulated matter.',
    '["POPIA, fraud, medical, legal → immediately escalate","Refunds >R2000 → escalate, don''t decide","Ranger handles small refunds + feature questions","When in doubt, always escalate"]'
  ),
  (3, 'Handoff etiquette', 5,
    '# How to escalate cleanly

## Structure your handoff note
1. **One-line summary** ("Client claims provider no-showed for R1,200 booking on 2026-04-10")
2. **Parties involved** with BION user IDs
3. **Timeline of contact so far** (when they reached out, what you tried)
4. **Specific ask for admin** ("Please review + approve refund of R1,200 and flag provider for follow-up")
5. **Attach any evidence URLs**

## What NOT to do
- Don''t promise a resolution time you can''t deliver
- Don''t take sides publicly ("you''re right, the provider was wrong") — stay neutral
- Don''t delete prior messages — admin needs full context

## Closing the loop
Once admin resolves, **YOU** communicate the outcome to the client/provider. Admin escalation doesn''t mean you disappear. You remain the relationship owner.',
    '["Always write a 5-point handoff: summary, parties, timeline, ask, evidence","Never promise specific resolution times","Stay neutral with clients — don''t assign blame","You remain the relationship owner post-escalation"]'
  )
) AS t(n, l_title, dur, l_content, l_takeaways)
WHERE course_code = 'RANGER-107';

INSERT INTO assessment_questions (course_id, question_number, question_text, question_type, options, explanation, points)
SELECT courses.id, n, q_text, 'single', q_options::jsonb, q_exp, q_pts
FROM courses,
(VALUES
  (1, 'A client asks how to reset their password. What tier handles this?',
    '[{"id":"a","text":"Tier 1 — B_ AI","isCorrect":true},{"id":"b","text":"Tier 2 — Ranger","isCorrect":false},{"id":"c","text":"Tier 3 — Admin","isCorrect":false},{"id":"d","text":"Requires platform engineering","isCorrect":false}]',
    'Password resets are self-service, handled entirely by B_ AI.', 1),
  (2, 'A client alleges the provider accessed their medical records improperly. What tier?',
    '[{"id":"a","text":"Tier 1","isCorrect":false},{"id":"b","text":"Tier 2","isCorrect":false},{"id":"c","text":"Tier 3 — escalate to admin immediately","isCorrect":true},{"id":"d","text":"Handle yourself","isCorrect":false}]',
    'POPIA / data privacy is ALWAYS Tier 3. Never handle yourself.', 2),
  (3, 'Client wants a R250 refund and the provider agrees. What tier?',
    '[{"id":"a","text":"Tier 1","isCorrect":false},{"id":"b","text":"Tier 2 — handle yourself","isCorrect":true},{"id":"c","text":"Tier 3","isCorrect":false},{"id":"d","text":"Refuse the refund","isCorrect":false}]',
    'Refunds under R500 with both parties agreeing = Tier 2 Ranger decision.', 2),
  (4, 'What''s the first element of a proper escalation handoff note?',
    '[{"id":"a","text":"Your personal opinion","isCorrect":false},{"id":"b","text":"One-line summary","isCorrect":true},{"id":"c","text":"The platform error code","isCorrect":false},{"id":"d","text":"Deletion of prior messages","isCorrect":false}]',
    'Start with a one-line summary. Admins read many tickets — they need the headline first.', 1),
  (5, 'After admin resolves an escalation, who communicates the outcome to the client?',
    '[{"id":"a","text":"Admin","isCorrect":false},{"id":"b","text":"B_ AI","isCorrect":false},{"id":"c","text":"The Ranger who owned the relationship","isCorrect":true},{"id":"d","text":"Nobody — client figures it out","isCorrect":false}]',
    'You remain the relationship owner. Admin escalation doesn''t mean you disappear.', 2)
) AS t(n, q_text, q_options, q_exp, q_pts)
WHERE course_code = 'RANGER-107';

-- ═══════════════════════════════════════════════════════════════
-- RANGER-108 · POPIA & Legal
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (course_id, lesson_number, title, content_type, content, duration_minutes, key_takeaways)
SELECT courses.id, n, l_title, 'text', l_content, dur, l_takeaways::jsonb
FROM courses,
(VALUES
  (1, 'POPIA fundamentals', 6,
    '# The Protection of Personal Information Act (POPIA)

SA''s equivalent of GDPR. **In effect since 2021.** Violations can cost up to **R10 million** or 10 years imprisonment (intentional breaches).

## 8 core conditions
1. **Accountability** — BION is responsible for data it holds
2. **Processing limitation** — minimal data, with consent
3. **Purpose specification** — only for stated reasons
4. **Further processing limitation** — no reuse for unrelated purposes
5. **Information quality** — accurate, up-to-date
6. **Openness** — transparency about what''s collected and why
7. **Security safeguards** — encrypted, access-controlled
8. **Data subject participation** — right to access, correct, delete

## What this means in practice
- We collect **only** what''s needed for the service
- Clients have a **right to delete** their data within 30 days of request
- We **must report breaches** to the Information Regulator within 72 hours
- Health data is classified as **"special personal information"** — higher bar',
    '["POPIA = SA''s GDPR, active since 2021","8 conditions: accountability, limitation, purpose, quality, openness, security, participation","Penalties up to R10m + 10 years","Health = special personal info, highest bar"]'
  ),
  (2, 'What we collect and why', 5,
    '# Data collection matrix

## Client data
- Name, email, phone (bookings + communications)
- Location (for nearby-provider search)
- Payment details (Paystack — we never see full card numbers)
- Wellness preferences (to personalise recommendations)
- Health info entered voluntarily (health profile, fitness logs)

## Provider data
- Business name, legal name, tax number
- HPCSA / SANC registration (for medical verticals)
- Bank account (for payouts — stored tokenised in Paystack)
- Service listings, availability, pricing
- Client notes (tied to booking, never cross-provider)

## What providers DON''T see
- Other providers'' client lists
- Competing providers'' session notes
- BION''s overall revenue numbers',
    '["Client data: contact + location + payment tokens + voluntary health info","Provider data: legal reg + banking + service details","Providers can only see their own clients''' || ' data","Paystack tokenises cards — BION never stores full PANs"]'
  ),
  (3, 'Health info handling', 5,
    '# Special rules for health data

Anything a user logs about their body, symptoms, medications, conditions, or treatment is **special personal information** under POPIA.

## Stricter rules
- **Explicit opt-in consent** required per category (e.g., separate consents for weight, menstrual cycle, chronic conditions)
- **Only shared with the specific provider** the user booked for that service
- **Never used for advertising** (even if the user consented to general marketing)
- **Audit trail** — every access is logged, including internal BION access
- **Right to erasure** within 30 days honoured, even against business interest

## What to tell clients asking about health data
*"Your health data is kept separate from your contact info. Only providers you specifically book see it, and only for that booking. You can download or delete it any time from Settings > Privacy."*

## What to tell providers
*"Your client''s health info is only visible to you because they booked you. If they delete their account, you lose that access. Log your notes well."*',
    '["Health info requires per-category explicit consent","Only shared with the provider booked for that service","Never used for advertising under any circumstance","Every access is logged — audit trail for compliance"]'
  ),
  (4, 'Breach response + complaints', 4,
    '# When things go wrong

## If a client claims data exposure
1. Do NOT confirm or deny — "I understand your concern. Let me get this to the right team."
2. **Escalate to admin immediately** — Tier 3
3. Log the complaint with timestamp
4. Do not update the client until admin authorises the response

## 72-hour rule
BION has **72 hours** from breach discovery to notify the Information Regulator. You are not the one making this call — but delay on Ranger side can compromise compliance.

## Dispute resolution order
1. In-platform dispute (B_ mediated)
2. BION admin review
3. Information Regulator (SA) — for POPIA breaches
4. Small Claims Court (for consumer protection up to R20k)
5. High Court (anything above)

## Final rule
**You personally are not an indemnified legal representative of BION.** Never promise legal outcomes, never accept settlements, never admit liability. Escalate and let admin handle it.',
    '["Never confirm/deny data exposure — escalate","72-hour Information Regulator notification rule","5-step dispute order: platform → admin → Regulator → Small Claims → High Court","Rangers never admit liability on BION''s behalf"]'
  )
) AS t(n, l_title, dur, l_content, l_takeaways)
WHERE course_code = 'RANGER-108';

INSERT INTO assessment_questions (course_id, question_number, question_text, question_type, options, explanation, points)
SELECT courses.id, n, q_text, 'single', q_options::jsonb, q_exp, q_pts
FROM courses,
(VALUES
  (1, 'Maximum POPIA penalty for a breach?',
    '[{"id":"a","text":"R100,000","isCorrect":false},{"id":"b","text":"R1 million","isCorrect":false},{"id":"c","text":"R10 million + up to 10 years","isCorrect":true},{"id":"d","text":"No penalty, just a warning","isCorrect":false}]',
    'Up to R10m + 10 years for intentional breaches. POPIA is a serious regulatory regime.', 2),
  (2, 'How long does BION have to notify the Information Regulator after a breach?',
    '[{"id":"a","text":"24 hours","isCorrect":false},{"id":"b","text":"72 hours","isCorrect":true},{"id":"c","text":"7 days","isCorrect":false},{"id":"d","text":"30 days","isCorrect":false}]',
    '72 hours from breach discovery. Missing this is itself a compliance failure.', 2),
  (3, 'Can BION use a client''s logged health data for targeted advertising if they opted into marketing?',
    '[{"id":"a","text":"Yes, if they opted in","isCorrect":false},{"id":"b","text":"No, never, even with marketing consent","isCorrect":true},{"id":"c","text":"Only with explicit separate consent","isCorrect":false},{"id":"d","text":"Only for paid advertising partners","isCorrect":false}]',
    'Health data is NEVER used for advertising regardless of other consent. Separate rule under POPIA.', 2),
  (4, 'A client says their ex-partner saw their period tracker in BION. What do you do?',
    '[{"id":"a","text":"Investigate the claim yourself","isCorrect":false},{"id":"b","text":"Tell them their data is secure","isCorrect":false},{"id":"c","text":"Escalate to admin immediately, don''t confirm or deny","isCorrect":true},{"id":"d","text":"Offer an immediate refund","isCorrect":false}]',
    'Data exposure claim = Tier 3 escalation. Never confirm or deny. Never promise outcomes.', 2),
  (5, 'Can a Ranger admit liability on behalf of BION?',
    '[{"id":"a","text":"Yes, for amounts under R500","isCorrect":false},{"id":"b","text":"Yes, with both parties present","isCorrect":false},{"id":"c","text":"No, never","isCorrect":true},{"id":"d","text":"Only in writing","isCorrect":false}]',
    'Rangers are not legal representatives. Never admit liability. Always escalate to admin.', 1)
) AS t(n, q_text, q_options, q_exp, q_pts)
WHERE course_code = 'RANGER-108';

-- ═══════════════════════════════════════════════════════════════
-- RANGER-109 · Commission & Payouts
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (course_id, lesson_number, title, content_type, content, duration_minutes, key_takeaways)
SELECT courses.id, n, l_title, 'text', l_content, dur, l_takeaways::jsonb
FROM courses,
(VALUES
  (1, 'Where your commissions come from', 4,
    '# Three earning streams

## 1. Provider subscription commissions
- Pro (R499/mo) → 20% (R99.80/mo)
- Elite (R999/mo) → 20% (R199.80/mo)
- Perpetual while the provider stays subscribed
- Activates **month 2** (month 1 is free trial)

## 2. Transaction fee share
- 2% of every booking your signed-up providers process
- Perpetual while provider is on the platform
- Paid monthly, reconciled on the 3rd business day

## 3. Client referral commissions
- 20% of R29 Premium = R5.80/month per active Premium referral
- Perpetual while client stays Premium
- Lower ceiling but scales with volume

## Earning calc example
Sign up 10 Elite providers doing R50k/month each:
- Sub: 10 × R199.80 = **R1,998/mo**
- Transactions: 10 × R50k × 2% = **R10,000/mo**
- Total: **~R12,000/mo recurring**',
    '["Three streams: provider sub, transaction %, client referral","20% on subs, 2% on transactions, perpetual","Provider commissions activate month 2 (month 1 = free trial)","Transactions scale way faster than subs — focus on high-GMV providers"]'
  ),
  (2, 'Payout mechanics', 5,
    '# How and when you get paid

## Monthly reconciliation
On the **3rd business day** of each month, BION calculates:
- Last month''s subscription commissions (all active subs)
- Last month''s transaction shares (all completed + non-refunded bookings)
- Deductions for refunded transactions

Reconciliation report drops in your Earnings tab.

## Payout options
- **To BION Wallet**: instant, spendable in-platform, no fee
- **Withdraw to bank**: 10% withdrawal fee, 2-3 business days via Paystack

## Why the 10% withdrawal fee?
Pays for Paystack transfers + BION''s own Paystack fees + compliance (tracking cash-out for tax/FICA). If you keep earnings in-wallet, no fee. If you need cash, you pay the convenience.

## Minimum withdrawal
R200. Below that, accumulate and withdraw later.',
    '["3rd business day monthly reconciliation","Wallet transfer = instant, free","Bank withdrawal = 10% fee, 2-3 business days","Minimum R200 withdrawal"]'
  ),
  (3, 'Tax & FICA', 5,
    '# Your Ranger income is taxable

## SARS treatment
Ranger commissions are **ordinary income** in SA. BION does not withhold tax — you are responsible for:
- Registering for provisional tax (if total annual income > R500k)
- Declaring commissions on your tax return
- VAT registration (if your annual commissions exceed R1m — then BION pays you +15% VAT on top)

## What BION provides
- **Annual IRP5-style tax export** from your Earnings page
- Monthly statements with gross and net figures
- VAT invoices once you''re VAT-registered

## FICA
If you earn > R250k/year in commissions, BION may require FICA documentation:
- Certified ID
- Proof of address (utility bill < 3 months old)
- Bank confirmation letter

We''ll ping you when you''re close to threshold — don''t wait to be asked.',
    '["Commissions are ordinary income — no withholding by BION","Annual tax export available in Earnings page","VAT reg required above R1m/year earnings","FICA docs triggered at R250k/year threshold"]'
  )
) AS t(n, l_title, dur, l_content, l_takeaways)
WHERE course_code = 'RANGER-109';

INSERT INTO assessment_questions (course_id, question_number, question_text, question_type, options, explanation, points)
SELECT courses.id, n, q_text, 'single', q_options::jsonb, q_exp, q_pts
FROM courses,
(VALUES
  (1, 'You sign up a provider on the Elite plan. When does your first commission payment post?',
    '[{"id":"a","text":"Immediately","isCorrect":false},{"id":"b","text":"End of month 1","isCorrect":false},{"id":"c","text":"3rd business day of month 2 (month 1 is free trial)","isCorrect":true},{"id":"d","text":"After 3 months","isCorrect":false}]',
    'Month 1 is free trial. Month 2 billing triggers your first commission, paid on reconciliation day (3rd business day of month 3).', 2),
  (2, 'Transaction commission rate on bookings for your signed-up providers?',
    '[{"id":"a","text":"0.5%","isCorrect":false},{"id":"b","text":"2%","isCorrect":true},{"id":"c","text":"5%","isCorrect":false},{"id":"d","text":"10%","isCorrect":false}]',
    '2% of every transaction. Note: 2% stays with BION if provider was NOT rep-signed.', 2),
  (3, 'You want to withdraw R500 to your bank. How much do you net?',
    '[{"id":"a","text":"R500","isCorrect":false},{"id":"b","text":"R475","isCorrect":false},{"id":"c","text":"R450","isCorrect":true},{"id":"d","text":"R400","isCorrect":false}]',
    '10% withdrawal fee. R500 - R50 = R450 to bank. No fee if you keep it in your BION Wallet.', 2),
  (4, 'At what annual commission level does BION require FICA documents from you?',
    '[{"id":"a","text":"R50,000","isCorrect":false},{"id":"b","text":"R100,000","isCorrect":false},{"id":"c","text":"R250,000","isCorrect":true},{"id":"d","text":"R1,000,000","isCorrect":false}]',
    'R250k/year triggers FICA. Over R1m triggers VAT registration.', 1),
  (5, 'BION withholds tax from my commissions. True or false?',
    '[{"id":"a","text":"True — BION withholds PAYE","isCorrect":false},{"id":"b","text":"False — you''re responsible for declaring it","isCorrect":true},{"id":"c","text":"Only above R500k/year","isCorrect":false},{"id":"d","text":"Only VAT","isCorrect":false}]',
    'Rangers are not employees. Commissions are ordinary income — you declare them to SARS yourself.', 1)
) AS t(n, q_text, q_options, q_exp, q_pts)
WHERE course_code = 'RANGER-109';

-- ═══════════════════════════════════════════════════════════════
-- RANGER-110 · Final Assessment (comprehensive — 10 questions)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (course_id, lesson_number, title, content_type, content, duration_minutes, key_takeaways)
SELECT courses.id, n, l_title, 'text', l_content, dur, l_takeaways::jsonb
FROM courses,
(VALUES
  (1, 'What to expect', 3,
    '# The comprehensive Ranger exam

This final assessment covers everything from RANGER-101 through RANGER-109:

- Platform fundamentals
- Revenue streams
- Provider sales
- Client sales
- Rewards & loyalty mechanics
- Storefront + delivery
- Support tiers
- POPIA compliance
- Commission & payouts

## Format
- 10 questions drawn from across the syllabus
- Pass threshold: **80%**
- Open-book: you can review earlier course material during the assessment
- Unlimited attempts, but attempt count is recorded in your profile

## What happens when you pass
- You receive your **BION Ranger certificate** (unique code, e.g. `BION-RGR-A1B2C3`)
- Your account is marked **accredited** — commission eligibility unlocks
- You''re added to Tier 2 support rotation
- If you average > 90% across all courses, you''re promoted to **Tier 2 Elite** with priority case assignment',
    '["10 comprehensive questions covering all 9 prior courses","80% pass threshold","Open-book, unlimited attempts","Pass = accredited + commission eligibility"]'
  )
) AS t(n, l_title, dur, l_content, l_takeaways)
WHERE course_code = 'RANGER-110';

INSERT INTO assessment_questions (course_id, question_number, question_text, question_type, options, explanation, points)
SELECT courses.id, n, q_text, 'single', q_options::jsonb, q_exp, q_pts
FROM courses,
(VALUES
  (1, 'BION''s North Star Metric?',
    '[{"id":"a","text":"Signups","isCorrect":false},{"id":"b","text":"QMAS (Qualified Monthly Attended Sessions)","isCorrect":true},{"id":"c","text":"Revenue","isCorrect":false},{"id":"d","text":"App ratings","isCorrect":false}]',
    'QMAS — attended sessions drive real value.', 1),
  (2, 'On a R100 standard booking, provider net after all fees including marketing levy?',
    '[{"id":"a","text":"R95","isCorrect":false},{"id":"b","text":"R90","isCorrect":true},{"id":"c","text":"R85","isCorrect":false},{"id":"d","text":"R80","isCorrect":false}]',
    '5% provider fee + 5% marketing levy = provider keeps R90.', 2),
  (3, 'Monthly commission for signing an Elite provider (R999/mo)?',
    '[{"id":"a","text":"R49.95","isCorrect":false},{"id":"b","text":"R99.90","isCorrect":false},{"id":"c","text":"R199.80","isCorrect":true},{"id":"d","text":"R499.50","isCorrect":false}]',
    '20% of R999 = R199.80/month perpetual.', 2),
  (4, 'A medical provider signs up without giving HPCSA number. What do you do?',
    '[{"id":"a","text":"Skip it","isCorrect":false},{"id":"b","text":"Collect it before completing signup","isCorrect":true},{"id":"c","text":"Let admin chase later","isCorrect":false},{"id":"d","text":"Mark it optional","isCorrect":false}]',
    'Medical verticals require HPCSA/SANC. Without it, provider cannot be activated.', 2),
  (5, 'Who funds streak-milestone rewards?',
    '[{"id":"a","text":"BION platform","isCorrect":false},{"id":"b","text":"Providers","isCorrect":false},{"id":"c","text":"Advertisers / sponsors","isCorrect":true},{"id":"d","text":"Clients","isCorrect":false}]',
    'Sponsored rewards are advertiser-funded. Zero cost to BION or providers.', 1),
  (6, 'A client alleges their health data was exposed to their ex. What tier?',
    '[{"id":"a","text":"Tier 1 B_ AI","isCorrect":false},{"id":"b","text":"Tier 2 Ranger","isCorrect":false},{"id":"c","text":"Tier 3 Admin immediately","isCorrect":true},{"id":"d","text":"Handle yourself","isCorrect":false}]',
    'POPIA/data privacy is always Tier 3. Escalate immediately, don''t confirm or deny.', 2),
  (7, 'Withdrawal fee from earnings to bank account?',
    '[{"id":"a","text":"No fee","isCorrect":false},{"id":"b","text":"5%","isCorrect":false},{"id":"c","text":"10%","isCorrect":true},{"id":"d","text":"15%","isCorrect":false}]',
    '10% covers Paystack transfers + BION fees + FICA compliance. Zero fee if kept in-wallet.', 1),
  (8, 'Who pays the delivery cost on a Storefront order?',
    '[{"id":"a","text":"Provider","isCorrect":false},{"id":"b","text":"Buyer on top of product price","isCorrect":true},{"id":"c","text":"BION","isCorrect":false},{"id":"d","text":"Split","isCorrect":false}]',
    'Buyer pays delivery. Provider payout is not reduced.', 1),
  (9, 'Break-even monthly spend for a client going Premium (R29/mo)?',
    '[{"id":"a","text":"R100","isCorrect":false},{"id":"b","text":"R600","isCorrect":true},{"id":"c","text":"R1500","isCorrect":false},{"id":"d","text":"R3000","isCorrect":false}]',
    'R600/mo wellness spend breaks even. Above that Premium is net-positive.', 1),
  (10, 'Acquisition voucher eligibility?',
    '[{"id":"a","text":"Any BION client","isCorrect":false},{"id":"b","text":"Existing clients of that provider","isCorrect":false},{"id":"c","text":"Nearby clients who have never completed a paid booking with that provider","isCorrect":true},{"id":"d","text":"Premium subscribers only","isCorrect":false}]',
    'Only never-booked, nearby clients. Acquisition is strictly for new-to-that-provider customers.', 2)
) AS t(n, q_text, q_options, q_exp, q_pts)
WHERE course_code = 'RANGER-110';

-- Confirm
SELECT
  c.course_code, c.title,
  (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS lessons,
  (SELECT COUNT(*) FROM assessment_questions WHERE course_id = c.id) AS questions
FROM courses c
WHERE c.course_code IN ('RANGER-104','RANGER-105','RANGER-106','RANGER-107','RANGER-108','RANGER-109','RANGER-110')
ORDER BY c.order_index;
