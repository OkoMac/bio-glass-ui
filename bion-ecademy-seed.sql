-- ============================================================
-- BION Ecademy — Seed lessons + assessment questions for first 3 courses
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
--
-- Seeds:
--   RANGER-101: BION Platform Overview (5 lessons + 5 questions)
--   RANGER-102: The 6 Revenue Streams (5 lessons + 5 questions)
--   RANGER-103: Selling to Providers (4 lessons + 5 questions)
-- ============================================================

-- Clean slate for these 3 courses
DELETE FROM lessons WHERE course_id IN (SELECT id FROM courses WHERE course_code IN ('RANGER-101','RANGER-102','RANGER-103'));
DELETE FROM assessment_questions WHERE course_id IN (SELECT id FROM courses WHERE course_code IN ('RANGER-101','RANGER-102','RANGER-103'));

-- ═══════════════════════════════════════════════════════════════
-- RANGER-101 · BION Platform Overview
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (course_id, lesson_number, title, content_type, content, duration_minutes, key_takeaways)
SELECT courses.id, n, l_title, 'text', l_content, dur, l_takeaways::jsonb
FROM courses,
(VALUES
  (1, 'What is BION?', 5,
    '# What is BION?

BION is Africa''s first unified health, wellness and beauty industry operating system — think Shopify, but for service businesses. We serve fitness trainers, medical practitioners, beauty salons, veterinarians, and wellness consultants across South Africa, with plans to expand pan-African.

## The problem we solve

Before BION, a wellness client in Pretoria might use:
- **Instagram DMs** to enquire about a hairdresser
- **WhatsApp** to confirm a booking
- **Cash/EFT** to pay
- **Google reviews** (that no one reads)
- **Nothing** to earn loyalty rewards

Providers lose track of clients. Clients forget about providers. Nobody earns rewards. Money flows through 5 different apps.

## What BION does

One platform for:
- **Discovery** — find verified providers near you
- **Booking** — real-time availability, instant confirmation
- **Payment** — BION Wallet (closed-loop credits) + Paystack cards
- **Rewards** — Activity Points (engagement) + Expenditure Rewards (cashback)
- **Messaging** — WhatsApp-native chat with providers
- **Storefronts** — providers sell products with courier delivery',
    '["BION unifies booking, payment, and rewards for SA wellness","We serve fitness, medical, beauty, vet, wellness verticals","WhatsApp-first for 97% smartphone penetration","South Africa first, then pan-African expansion"]'
  ),
  (2, 'Who we serve (the 4 roles)', 6,
    '# The 4 BION Roles

## 1. Clients (the demand side)
Everyday South Africans looking to book wellness services. Free to sign up. Optional Premium at **R29/month** unlocks cashback-style Expenditure Rewards.

## 2. Providers (the supply side)
Service businesses — individual trainers, clinics, salons, vets, physios. Two tiers:
- **Pro** — R499/month. Full CRM, storefront, analytics.
- **Elite** — R999/month. Reduced transaction fees, priority support, featured placements.

## 3. Corporate Wellness (B2B buyers)
Companies offering employee wellness stipends. Manage budgets, track engagement, gift wellness credits.

## 4. Rangers (you, the sales rep)
You sign up providers and clients. Earn:
- **20% commission** on provider subscriptions (monthly, recurring)
- **2% of every booking transaction** your provider generates (perpetual)
- **R5.80/month** per active client referral (20% of R29 Premium)',
    '["Client = Free or Premium (R29/mo)","Provider = Pro (R499/mo) or Elite (R999/mo)","Corporate = B2B employee wellness","Rangers earn 20% on subs + 2% on transactions"]'
  ),
  (3, 'Verticals & POPIA', 6,
    '# Vertical differences matter

### Fitness (teal accent colour)
Personal trainers, gyms, yoga studios, CrossFit boxes. Lowest regulatory burden.

### Medical (indigo)
GPs, dentists, optometrists, chiropractors, physios, maternity, fertility.
- **HPCSA/SANC verification required** — we check registration numbers.
- **POPIA Act compliance is critical** — health data is "special personal information".

### Beauty (coral)
Hair, nails, skincare, day spas. Also includes bridal services.

### Professional (slate)
Psychologists, dieticians, life coaches, counsellors.

### Vet (green)
Veterinarians, pet groomers.

## POPIA at a glance
- Clients explicitly consent to data use during signup.
- Health data can only be shared with the provider they booked.
- Audit trail on every access.
- Right to deletion honoured within 30 days.

**Any client complaint about data handling is a Tier 3 escalation.**',
    '["Medical requires HPCSA/SANC verification","POPIA treats health as special personal information","5 verticals: fitness, medical, beauty, professional, vet","Right to deletion honoured within 30 days"]'
  ),
  (4, 'The WhatsApp advantage', 4,
    '# Why WhatsApp-first matters in SA

**97% of South African smartphone users have WhatsApp.** They don''t need to download the BION app to book — they can chat with our bot and complete a booking entirely in WhatsApp.

## What this unlocks
- **Lower friction for first-time users** — no app-store installs
- **Higher trust** — WhatsApp feels personal, not corporate
- **Direct provider ↔ client chat** after booking
- **Appointment reminders** arrive where they''re already looking

## When to push the app vs WhatsApp
- **Apps first**: rewards dashboard, storefronts, progress tracking, analytics
- **WhatsApp first**: first booking, reminders, simple re-bookings, support

When pitching a client who''s hesitant to download: **"Try it over WhatsApp first"**. Conversion jumps ~3×.',
    '["97% SA smartphone users have WhatsApp","WhatsApp lowers install friction for first-time users","Push native app only after first booking succeeds","Bot-driven first bookings have 3× conversion"]'
  ),
  (5, 'North Star Metric: QMAS', 4,
    '# What BION measures

Our **North Star Metric** is:

## QMAS — Qualified Monthly Attended Sessions

Not signups. Not GMV. Not reviews. **Attended sessions.**

A QMAS means:
- ✅ Client booked through BION
- ✅ Client actually showed up (provider confirmed attendance)
- ✅ Payment processed
- ✅ In the current calendar month

## Why this metric?
Signups are vanity. Bookings are optimistic. **Attended sessions are truth.** Only attended sessions generate:
- Real revenue (for provider + BION)
- Rewards (for client)
- Commissions (for you, the Ranger)

## What this means for you as a Ranger
Don''t chase signups. Chase providers who will consistently **deliver sessions**. A provider who books 50 QMAS/month is worth 20× more than one who books 1000 free signups.',
    '["QMAS = Qualified Monthly Attended Sessions","Not signups, not bookings — attended sessions","QMAS drives revenue, rewards, and commissions","Prioritise high-delivery providers over high-signup providers"]'
  )
) AS t(n, l_title, dur, l_content, l_takeaways)
WHERE course_code = 'RANGER-101';

INSERT INTO assessment_questions (course_id, question_number, question_text, question_type, options, explanation, points)
SELECT courses.id, n, q_text, 'single', q_options::jsonb, q_exp, q_pts
FROM courses,
(VALUES
  (1, 'What is BION''s North Star Metric?',
    '[{"id":"a","text":"Monthly signups","isCorrect":false},{"id":"b","text":"Gross merchandise value","isCorrect":false},{"id":"c","text":"Qualified Monthly Attended Sessions (QMAS)","isCorrect":true},{"id":"d","text":"App Store rating","isCorrect":false}]',
    'QMAS captures real value — only attended sessions generate revenue, rewards, and commissions.', 2),
  (2, 'How much does a BION Pro provider plan cost per month?',
    '[{"id":"a","text":"R299","isCorrect":false},{"id":"b","text":"R499","isCorrect":true},{"id":"c","text":"R999","isCorrect":false},{"id":"d","text":"R1499","isCorrect":false}]',
    'Pro = R499/mo (full CRM + storefront). Elite = R999/mo (reduced fees + featured placements).', 1),
  (3, 'Which vertical requires HPCSA/SANC verification?',
    '[{"id":"a","text":"Fitness","isCorrect":false},{"id":"b","text":"Beauty","isCorrect":false},{"id":"c","text":"Medical","isCorrect":true},{"id":"d","text":"Vet","isCorrect":false}]',
    'Medical providers must be registered with HPCSA (doctors, physios, psychologists) or SANC (nurses, midwives).', 2),
  (4, 'What percentage of South African smartphone users have WhatsApp?',
    '[{"id":"a","text":"72%","isCorrect":false},{"id":"b","text":"85%","isCorrect":false},{"id":"c","text":"97%","isCorrect":true},{"id":"d","text":"99%","isCorrect":false}]',
    '97% penetration means WhatsApp-first is a massive distribution advantage.', 1),
  (5, 'A client complains about how their health data is being used. What tier of support is this?',
    '[{"id":"a","text":"Tier 1 — handled by B_ AI","isCorrect":false},{"id":"b","text":"Tier 2 — handled by a Ranger","isCorrect":false},{"id":"c","text":"Tier 3 — BION admin","isCorrect":true},{"id":"d","text":"No escalation needed","isCorrect":false}]',
    'POPIA/data complaints are always Tier 3 — they can become regulatory issues and must be logged by admin.', 2)
) AS t(n, q_text, q_options, q_exp, q_pts)
WHERE course_code = 'RANGER-101';

-- ═══════════════════════════════════════════════════════════════
-- RANGER-102 · The 6 Revenue Streams
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (course_id, lesson_number, title, content_type, content, duration_minutes, key_takeaways)
SELECT courses.id, n, l_title, 'text', l_content, dur, l_takeaways::jsonb
FROM courses,
(VALUES
  (1, 'Stream 1 — Booking fees (the core)', 6,
    '# The canonical BION fee model

Every booking generates the platform''s primary revenue.

## The split — R100 bill example
| Who | Amount |
|---|---|
| Client pays | R105 (+5% client fee) |
| Provider receives | R90 (−5% provider fee −5% marketing levy) |
| **BION gross** | **R10** (10%) |
| Paystack + costs | ~R3.50 |
| **BION net per booking** | **~R3.67** (rep-signed) or **~R5.67** (direct) |

## Premium client + Elite provider
- Premium clients pay **3.5% client fee** (reduced from 5%)
- Elite providers pay **3.5% provider fee** (reduced from 5%)
- Premium × Elite = **7% total to BION** (vs 10% standard)

## What NEVER changes
Every fee is a flat % of the **bill**, never compounded. We never stack fees on top of other fees.',
    '["R100 bill → BION gross R10, provider net R90","Premium client pays 3.5% client fee","Elite provider pays 3.5% provider fee","Every fee is % of bill, never compounded"]'
  ),
  (2, 'Stream 2 — Subscriptions', 5,
    '# Recurring subscription revenue

| Plan | Price/mo | Target |
|---|---|---|
| Client Premium | R29 | Regular users wanting cashback |
| Provider Pro | R499 | Independent practitioners |
| Provider Elite | R999 | High-volume studios |
| Corporate | custom | Companies with >50 employees |

## Commission structure

- **Client Premium (R29)** → 20% (**R5.80/mo**) to the referring client, perpetual while sub active
- **Provider Pro (R499)** → 20% (**R99.80/mo**) to the signing Ranger, perpetual
- **Provider Elite (R999)** → 20% (**R199.80/mo**) to the signing Ranger, perpetual

## Why this is the most valuable stream for you

Transaction fees are ~R4 per booking. Provider Elite commission is **R200/month × 12 = R2,400/year** per provider. Sign 10 Elite providers → R24,000/year recurring.',
    '["Client Premium R29/mo → 20% to referrer","Provider Pro R499/mo → 20% to Ranger","Provider Elite R999/mo → 20% to Ranger","Recurring commissions compound far faster than per-booking"]'
  ),
  (3, 'Streams 3–4 — Vouchers & Tips', 5,
    '# Stream 3 — Expenditure Rewards (vouchers)

Clients earn rewards as they spend. Not advertised as "cashback" — positioned as **Expenditure Rewards**.
- Current rate: **0.25% of every transaction** (R50 voucher per R20k spent)
- 12-month expiry, max 30% discount per booking

## Stream 4 — Tips
Provider keeps 100% of tip amount, but absorbs the Paystack fee (~3.5%).
- Tips flow through BION''s wallet system
- Small BION revenue from tip transaction processing (already covered by the 3.5% Paystack)
- **Never** charge the client a fee on top of a tip',
    '["Expenditure Rewards = 0.25% of spend (R50 per R20k)","Do not call it cashback in marketing","Tips: provider keeps 100%, absorbs Paystack fee","Never add BION fee on top of a tip"]'
  ),
  (4, 'Stream 5 — Storefronts', 6,
    '# Provider physical product sales

Pro + Elite providers unlock **Storefronts** — sell products alongside services.

## The fee stack (same as bookings)
- Client pays 5% client fee on product subtotal
- Provider pays 5% provider fee on product subtotal
- Delivery is quoted separately (pickup / pudo / local courier / national)

## Courier delivery rates (built-in)
| Zone | Base | Notes |
|---|---|---|
| Pickup | R0 | Client collects |
| Pudo | R59 | To locker |
| Pargo | R65 | To pickup point |
| Local | R75 | Same city |
| Provincial | R110 | Cross-province |
| National | R165 | Cross-country |

Weight >2kg adds a per-kg surcharge. Oversize items (>50cm largest side) flat fee.

## B_ AI auto-review
Every product submitted for listing is screened by **B_** (our AI risk reviewer) before reaching admin. Auto-published if safe, flagged if risky.',
    '["Pro + Elite unlock Storefronts","Same 10% fee model as bookings","6 delivery zones: pickup to national","Every product goes through B_ AI review first"]'
  ),
  (5, 'Stream 6 — Advertiser sponsorships', 5,
    '# Sponsored rewards = pure upside

Advertisers pay BION to fund streak-milestone rewards for clients.

Example: **Woolworths** funds a R200 voucher for any client who hits a 30-day activity streak. Woolworths pays BION a contract fee, BION issues the voucher to the client.

## Why advertisers love it
- Targeted by vertical, city, demographic
- Measurable redemption
- No ad-blocker in sight — these are **rewards**, not ads

## How you can pitch this to providers
"BION brings you clients who are rewarded for loyalty. We can also co-fund rewards for your top customers." — Elite-tier conversation.

Advertisers also go through the B_ AI pre-approval pipeline (same as products/rewards).',
    '["Advertisers fund streak-milestone rewards","Targeted by vertical, city, demographic","Providers can co-fund rewards for their VIPs","All sponsors go through B_ AI review"]'
  )
) AS t(n, l_title, dur, l_content, l_takeaways)
WHERE course_code = 'RANGER-102';

INSERT INTO assessment_questions (course_id, question_number, question_text, question_type, options, explanation, points)
SELECT courses.id, n, q_text, 'single', q_options::jsonb, q_exp, q_pts
FROM courses,
(VALUES
  (1, 'On a R100 standard booking, what is the provider''s net after all fees including marketing levy?',
    '[{"id":"a","text":"R95","isCorrect":false},{"id":"b","text":"R90","isCorrect":true},{"id":"c","text":"R85","isCorrect":false},{"id":"d","text":"R80","isCorrect":false}]',
    'Client fee 5% + provider fee 5% + marketing levy 5% = 15% total deducted — but client fee is added on top, so provider gets 95 − 5 (levy) = R90.', 2),
  (2, 'What''s the perpetual monthly commission for referring a client to Premium (R29/mo)?',
    '[{"id":"a","text":"R2.90","isCorrect":false},{"id":"b","text":"R5.80","isCorrect":true},{"id":"c","text":"R8.70","isCorrect":false},{"id":"d","text":"R14.50","isCorrect":false}]',
    '20% of R29 = R5.80/month, for as long as the client keeps paying Premium.', 1),
  (3, 'A provider signs up to Elite (R999/mo). What is the Ranger''s monthly commission?',
    '[{"id":"a","text":"R49.95","isCorrect":false},{"id":"b","text":"R99.90","isCorrect":false},{"id":"c","text":"R199.80","isCorrect":true},{"id":"d","text":"R499.50","isCorrect":false}]',
    '20% of R999 = R199.80/month, perpetual.', 2),
  (4, 'What''s the current Expenditure Reward rate?',
    '[{"id":"a","text":"0.25%","isCorrect":true},{"id":"b","text":"1%","isCorrect":false},{"id":"c","text":"2.5%","isCorrect":false},{"id":"d","text":"5%","isCorrect":false}]',
    'R50 voucher per R20,000 spent = 0.25%. Internal rate — never advertised in marketing copy.', 2),
  (5, 'Which delivery zone covers cross-province (e.g. Pretoria → Durban)?',
    '[{"id":"a","text":"Local — R75","isCorrect":false},{"id":"b","text":"Provincial — R110","isCorrect":true},{"id":"c","text":"National — R165","isCorrect":false},{"id":"d","text":"Pargo — R65","isCorrect":false}]',
    'Provincial R110 covers cross-province. National R165 is for cross-country edge cases like rural Western Cape.', 1)
) AS t(n, q_text, q_options, q_exp, q_pts)
WHERE course_code = 'RANGER-102';

-- ═══════════════════════════════════════════════════════════════
-- RANGER-103 · Selling to Providers
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (course_id, lesson_number, title, content_type, content, duration_minutes, key_takeaways)
SELECT courses.id, n, l_title, 'text', l_content, dur, l_takeaways::jsonb
FROM courses,
(VALUES
  (1, 'Prospecting — where good providers hide', 8,
    '# Who to target (in priority order)

## Tier A: Independent mid-volume practitioners
- 3–8 years in business
- 20–80 sessions/month
- Currently juggling Instagram + WhatsApp + manual calendar
- Already charging a fair price (R300+ per session)

**These are your gold.** They have stable demand, are tired of admin, and will be profitable on day 1.

## Tier B: Boutique studios (2–5 staff)
- Yoga, Pilates, hair salons, specialist medical
- They need Elite (R999) for multi-staff scheduling
- Pitch the CRM + analytics value, not the fee savings

## Tier C: High-volume operators (10+ staff)
- F45 gyms, large salons, clinics
- These go through enterprise sales, not Rangers
- **Refer them to BION direct — you still earn 20% commission**

## Avoid
- New businesses (<6 months) — too risky, high churn
- Cash-only operators — won''t adopt digital payments
- One-man-bands with <R150 session price — unit economics don''t work',
    '["Tier A: 3-8yr practitioners doing 20-80 sessions/mo","Tier B: boutique studios need Elite for multi-staff","Tier C: high-volume goes enterprise — you still earn","Avoid new businesses <6mo and cash-only operators"]'
  ),
  (2, 'The 3-minute pitch', 7,
    '# The BION provider pitch (90 seconds → 3 min)

## Minute 1 — The pain
*"How many hours a week do you spend on WhatsApp bookings, chasing payments, and remembering client names?"*

Wait for answer. Most say 10–15 hours.

## Minute 2 — The outcome
*"BION replaces all of that. One link clients use to book. Automatic reminders. Payments processed to your wallet. Every client''s history, preferences, and last 10 sessions at your fingertips."*

## Minute 3 — The money
*"Pro plan is R499/month. Elite is R999/month. You''ll save 10+ hours a week and see 20–30% more sessions because fewer no-shows. Want to see it?"*

## What NOT to lead with
- Fee percentages (they sound like a cost)
- Technical features (they sound like work)
- Rewards/commissions (that''s your story, not theirs)',
    '["Minute 1: surface the pain","Minute 2: describe the outcome, not features","Minute 3: price + time saved","Never lead with fees or technical features"]'
  ),
  (3, 'Handling the top 5 objections', 9,
    '# Objections you''ll hear every week

## 1. "My clients only use WhatsApp."
**Your answer:** *"Exactly. BION books them through WhatsApp. They never need to download an app. You just get the admin side on your phone."*

## 2. "I don''t want to pay a monthly fee."
**Your answer:** *"You''re already paying — just in time. 10 hours a week at R200/hour is R8,000/month. Pro is R499. You''ll get 12 hours back."*

## 3. "Another system? I already tried [Fresha/Setmore/etc]."
**Your answer:** *"Those are booking systems. BION is a marketplace. You get new clients discovering you, not just existing clients booking you."*

## 4. "What if I don''t like it?"
**Your answer:** *"First month free, cancel any time. Your client data exports to CSV whenever. No lock-in."*

## 5. "How much will this actually cost me?"
Pull up the calculator. Honest maths:
- Monthly fee: R499
- Per booking: 5% + marketing levy 5% (+ Paystack ~3.5%) = ~13.5%
- But net: they get the marketing levy back as vouchers that bring new clients
- Plus no admin time, fewer no-shows, higher repeat rate

**Provide the spreadsheet. Don''t bullshit the numbers.**',
    '["WhatsApp objection: BION books through WhatsApp","Fee objection: frame in hours saved not rands spent","Fresha/Setmore: you are discovery + bookings, not just bookings","Always provide real numbers, never bullshit"]'
  ),
  (4, 'Closing + onboarding', 8,
    '# From yes to first booking

## The close
When the provider says yes, **sign them up in the meeting**. Don''t leave with "I''ll send you a link."

1. Open `/welcome` on your phone or tablet
2. Sign them up as **Provider** role with your referral code
3. Collect: full name, business name, phone, email, vertical, primary service
4. If medical: collect HPCSA/SANC number
5. They should pick Pro or Elite immediately

## First 48 hours is critical
Providers who don''t see their first booking within 48 hours churn at 40%. Your job:
- Help them set up 3–5 services in the first hour
- Help them publish their first storefront product (if applicable)
- Make sure their availability is set for the week
- Share the BION link to their first client within 24 hours

## Your commission activates on month 2
BION offers first month free to providers. **Your commission starts month 2.** Account for this in your pipeline.',
    '["Sign them up in the meeting, not after","First 48 hours prevents 40% churn","Get 3-5 services + availability set on day 1","Commission starts month 2 (month 1 is free trial)"]'
  )
) AS t(n, l_title, dur, l_content, l_takeaways)
WHERE course_code = 'RANGER-103';

INSERT INTO assessment_questions (course_id, question_number, question_text, question_type, options, explanation, points)
SELECT courses.id, n, q_text, 'single', q_options::jsonb, q_exp, q_pts
FROM courses,
(VALUES
  (1, 'Which provider type should you prioritise?',
    '[{"id":"a","text":"Brand-new businesses under 6 months","isCorrect":false},{"id":"b","text":"Independent practitioners with 3-8 years + 20-80 sessions/month","isCorrect":true},{"id":"c","text":"Cash-only operators","isCorrect":false},{"id":"d","text":"Franchise chains with 10+ staff","isCorrect":false}]',
    'Tier A = 3-8yr practitioners. Stable demand, tired of admin, profitable day 1.', 2),
  (2, 'A boutique yoga studio with 3 instructors asks about plans. What do you recommend?',
    '[{"id":"a","text":"Pro R499 — they''re small","isCorrect":false},{"id":"b","text":"Elite R999 — multi-staff scheduling","isCorrect":true},{"id":"c","text":"Custom enterprise deal","isCorrect":false},{"id":"d","text":"Client Premium instead","isCorrect":false}]',
    'Boutique studios with 2-5 staff need Elite for proper multi-staff scheduling features.', 2),
  (3, 'How should you frame the monthly fee when the provider pushes back?',
    '[{"id":"a","text":"Highlight it''s cheaper than Fresha","isCorrect":false},{"id":"b","text":"Offer a discount","isCorrect":false},{"id":"c","text":"Reframe as hours saved × their hourly rate","isCorrect":true},{"id":"d","text":"Change the subject","isCorrect":false}]',
    'Price is rands. Value is time. Turn R499 into 12 hours × their hourly rate = much more.', 2),
  (4, 'When does a Ranger''s commission on a new provider activate?',
    '[{"id":"a","text":"Immediately on signup","isCorrect":false},{"id":"b","text":"After first booking","isCorrect":false},{"id":"c","text":"Month 2 (month 1 is free trial)","isCorrect":true},{"id":"d","text":"After 10 sessions","isCorrect":false}]',
    'Month 1 is free for providers to reduce friction. Commissions start month 2 onwards.', 1),
  (5, 'A medical provider signs up but hasn''t given their HPCSA number. What do you do?',
    '[{"id":"a","text":"Skip it — not important","isCorrect":false},{"id":"b","text":"Collect it before completing signup","isCorrect":true},{"id":"c","text":"Let admin chase them later","isCorrect":false},{"id":"d","text":"Tell them it''s optional","isCorrect":false}]',
    'Medical verticals require HPCSA/SANC registration numbers. Without it, they cannot be activated for bookings.', 2)
) AS t(n, q_text, q_options, q_exp, q_pts)
WHERE course_code = 'RANGER-103';

-- Confirm
SELECT
  c.course_code,
  c.title,
  (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS lessons,
  (SELECT COUNT(*) FROM assessment_questions WHERE course_id = c.id) AS questions
FROM courses c
WHERE c.course_code IN ('RANGER-101','RANGER-102','RANGER-103')
ORDER BY c.order_index;
