# BION Platform Wiki & Knowledge Base
## Complete System Documentation
### Last updated: 25 April 2026

---

Perfect! Now let me compile all this information into a comprehensive wiki report:

## COMPLETE BION PLATFORM WIKI & KNOWLEDGE BASE

### SECTION 1: FRONTEND ROUTES (App.tsx)

**Location:** `/Users/mac/Documents/Builds/BION/bio-glass-ui/src/App.tsx`

#### **Public Routes (Unauthenticated)**
| Path | Description | Line |
|------|-------------|------|
| `/` | Directory (root landing) | 460 |
| `/directory` | Provider directory (search/browse) | 468 |
| `/welcome` | Splash onboarding screen | 469 |
| `/login` | Redirect to `/welcome?login=true` | 470 |
| `/reset-password` | Password reset page | 471 |
| `/logout` / `/signout` | Session clear & sign out | 474-475 |
| `/s/:citySlug/:categorySlug` | SEO programmatic routes (city+category) | 478 |

#### **Marketing Landing Pages**
| Path | Description | Line |
|------|-------------|------|
| `/for-providers` | Provider onboarding landing | 481 |
| `/for-corporate` | Corporate wellness landing | 482 |
| `/for-rangers` | Sales rep recruitment landing | 483 |

#### **Blog & Educational**
| Path | Description | Line |
|------|-------------|------|
| `/blog` | Blog index | 486 |
| `/blog/how-many-calories-should-i-eat` | Calorie guide | 487 |
| `/blog/what-is-bmi` | BMI guide | 488 |
| `/blog/how-much-water-should-i-drink` | Water intake guide | 489 |
| `/blog/how-to-improve-sleep` | Sleep guide | 490 |
| `/blog/find-health-provider-near-me` | Find provider guide | 491 |
| `/blog/calories-in-boerewors` | Nutrition content | 492 |

#### **Legal Pages (Public)**
| Path | Description | Line |
|------|-------------|------|
| `/legal/acceptable-use` | Acceptable use policy | 500 |
| `/legal/payment-flow` | Payment flow & processing | 501 |
| `/legal/dispute-resolution` | Disputes & resolution | 502 |
| `/legal/privacy` | Privacy policy (POPIA) | 503 |
| `/legal/terms` | Terms of service | 504 |
| `/privacy` | Redirect to `/legal/privacy` | 505 |
| `/legal/payments` | Redirect to `/legal/payment-flow` | 506 |

#### **Support & Help (Public, but tickets auth-gated)**
| Path | Description | Line |
|------|-------------|------|
| `/help` | Public help page | 495 |
| `/my-tickets` | User's support tickets (auth) | 496 |
| `/my-tickets/:id` | Single ticket detail (auth) | 497 |

#### **Client Portal Routes (Authenticated, role: client)**
| Path | Description | Line |
|------|-------------|------|
| `/home` | Client dashboard | 509 |
| `/provider/:id` | Public provider profile (public) | 518 |
| `/booking/:id/invoice` | Booking invoice PDF | 519 |
| `/schedule` | Client's bookings/calendar | 520 |
| `/messages` | Client messages with providers | 521 |
| `/profile` | Client profile edit | 522 |
| `/settings` | Client account settings | 523 |
| `/routines` | Wellness routines | 524 |
| `/progress` | Health progress tracking | 525 |
| `/quick-book` | Fast booking widget | 526 |
| `/challenges` | Wellness challenges | 527 |
| `/health-profile` | Health data profile | 528 |
| `/wallet` | Client wallet/credits | 529 |
| `/water-tracker` | Water intake tracker (public) | 530 |
| `/sleep-tracker` | Sleep tracking (public) | 532 |
| `/medical-card` | Digital medical card (public) | 534 |
| `/life-coach` | AI life coach (public) | 535 |
| `/food-tracker` | Food & calorie tracker (public) | 537 |
| `/calendar` | Booking calendar view | 539 |
| `/health-insights` | Health insights dashboard (public) | 540 |
| `/tools` | Tools hub (public) | 541 |
| `/tools/bmi-calculator` | BMI calculator (public) | 542 |
| `/billing` | Client subscription & billing | 544 |
| `/notifications` | Notification center | 545 |
| `/favorites` | Saved provider favorites | 546 |
| `/store` | Gift vouchers & products | 547 |
| `/group-bookings` | Group booking packages | 548 |
| `/gift-vouchers` | Gift voucher purchase | 549 |
| `/treatment-plans` | Client's treatment plans | 558 |
| `/program/:id` | Program detail (public) | 560 |
| `/my-programs` | Client enrolled programs | 561 |
| `/my-programs/:enrollmentId` | Program progress detail | 562 |

#### **Affiliate & Referral**
| Path | Description | Line |
|------|-------------|------|
| `/affiliate` | Affiliate dashboard (auth) | 556 |
| `/invite/:code` | Referral/invite landing (public) | 552 |

#### **Host Partner (Airbnb/Guesthouse QR Wellness)**
| Path | Description | Line |
|------|-------------|------|
| `/stay/:code` | Guest landing page (public) | 553 |
| `/host/register` | Host signup (public) | 554 |
| `/host/dashboard` | Host management (auth) | 555 |

#### **Telehealth & Intake**
| Path | Description | Line |
|------|-------------|------|
| `/call/:bookingId` | Video call room (auth) | 557 |

#### **Bicademy (Ranger Training Platform)**
| Path | Description | Line |
|------|-------------|------|
| `/bicademy` | Course listing (auth) | 590 |
| `/bicademy/:code` | Course detail (auth) | 591 |
| `/bicademy/:code/lesson/:n` | Lesson content (auth) | 592 |
| `/bicademy/:code/assessment` | Course assessment (auth) | 593 |
| `/bicademy/certificate/:courseSlug` | Certificate (auth) | 594 |

#### **Provider Portal (role: provider)**
| Path | Description | Line |
|------|-------------|------|
| `/pro/dashboard` | Provider dashboard | 565 |
| `/pro/bookings` | Incoming bookings | 566 |
| `/pro/schedule` | Availability scheduling | 567 |
| `/pro/clients` | Client list | 568 |
| `/pro/clients/:id` | Client detail & history | 569 |
| `/pro/services` | Service management | 570 |
| `/pro/messages` | Client messages | 571 |
| `/pro/analytics` | Provider analytics (Pro tier) | 572 |
| `/pro/availability` | Availability calendar | 573 |
| `/pro/settings` | Provider settings | 574 |
| `/pro/billing` | Subscription & payouts | 575 |
| `/pro/programs` | Program builder | 576 |
| `/pro/verification` | KYC/verification status | 577 |
| `/pro/storefront` | Marketplace storefront | 578 |
| `/pro/orders` | Product orders | 579 |
| `/pro/catalogs` | Service catalogs | 580 |
| `/pro/catalogs/:id` | Catalog editor | 581 |
| `/catalog/:shortUrl` | Public catalog viewer | 582 |
| `/pro/intake-forms` | Intake form builder | 583 |
| `/pro/treatment-plans` | Treatment plan management | 584 |
| `/pro/queue` | Session review queue | 585 |
| `/pro/referrals` | Provider referral links | 586 |
| `/pro/locations` | Service locations | 587 |

#### **Admin Portal (role: admin)**
| Path | Description | Line |
|------|-------------|------|
| `/admin/dashboard` | Admin overview | 597 |
| `/admin/providers` | Provider management | 598 |
| `/admin/clients` | Client management | 599 |
| `/admin/analytics` | Platform analytics | 600 |
| `/admin/settings` | Admin settings | 601 |
| `/admin/users` | User & role management | 602 |
| `/admin/verification` | KYC verification queue | 603 |
| `/admin/disputes` | Dispute resolution | 604 |
| `/admin/b-queue` | Billabong review queue | 605 |
| `/admin/catalogs` | Catalog management | 606 |
| `/admin/whatsapp` | WhatsApp conversations | 607 |
| `/admin/compliance` | POPIA/compliance | 608 |
| `/admin/provider-claims` | Provider claim reviews | 609 |
| `/admin/subscriptions` | Subscription management | 610 |
| `/admin/refunds` | Refund management | 611 |
| `/admin/tickets` | Support ticket queue | 612 |
| `/admin/b-inbox` | BION inbox/messages | 613 |
| `/admin/rangers` | Sales rep management | 614 |
| `/admin/campaigns` | Campaign management | 615 |
| `/admin/broadcasts` | Broadcast messaging | 616 |
| `/admin/outreach` | Provider outreach | 617 |

#### **Corporate Portal (role: corporate)**
| Path | Description | Line |
|------|-------------|------|
| `/corporate/dashboard` | Corporate overview | 620 |
| `/corporate/employees` | Employee wellness roster | 621 |
| `/corporate/providers` | Associated provider network | 622 |
| `/corporate/analytics` | Corporate wellness analytics | 623 |
| `/corporate/wallet` | Corporate funding wallet | 624 |
| `/corporate/settings` | Corporate settings | 625 |
| `/corporate/beneficial-owners` | Beneficial owners KYC | 626 |
| `/corporate/wellness-reports` | Wellness program reports | 627 |

#### **Sales Rep Portal (role: sales_rep)**
| Path | Description | Line |
|------|-------------|------|
| `/rep/agreement` | Onboarding agreement (gate) | 630 |
| `/rep/dashboard` | Rep performance dashboard | 631 |
| `/rep/providers` | Managed provider list | 632 |
| `/rep/settings` | Rep settings | 633 |
| `/rep/crm` | CRM lead management | 634 |
| `/rep/crm/add` | Add new lead | 635 |
| `/rep/crm/suggested` | AI-suggested leads | 636 |
| `/rep/crm/:id` | Lead detail & activities | 637 |

#### **Onboarding Routes (role-specific, skips duplicate onboarding)**
| Path | Description | Line |
|------|-------------|------|
| `/onboarding/client` | Client setup wizard | 512 |
| `/onboarding/provider` | Provider setup wizard | 513 |
| `/onboarding/corporate` | Corporate setup wizard | 514 |
| `/onboarding/admin` | Admin setup wizard | 515 |

---

### SECTION 2: BACKEND API ENDPOINTS (66 Route Files)

**Location:** `/Users/mac/Documents/Builds/BION/backend/src/routes/`

#### **Account & Authentication**
| Endpoint | Method | Description | File | Line |
|----------|--------|-------------|------|------|
| `/api/account/export-data` | GET | POPIA data export | account.ts | 4 |
| `/api/account/verify-email` | POST | Send 6-digit email code | account.ts | 6 |
| `/api/account/verify-email/confirm` | POST | Confirm email verification | account.ts | 7 |
| `/api/account/forgot-password` | POST | Send password reset email | account.ts | 8 |
| `/api/account/reset-password` | POST | Set new password | account.ts | 9 |
| `/api/account/roles` | GET | List user's roles | account.ts | 10 |
| `/api/account/switch-role` | POST | Switch active role | account.ts | 11 |

#### **Bookings & Scheduling**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/bookings` | GET | List user's bookings | bookings.ts |
| `/api/bookings` | POST | Create new booking | bookings.ts |
| `/api/bookings/:id/invoice` | GET | Booking invoice | bookings.ts |
| `/api/bookings/cancel-reasons` | GET | Cancellation reasons | bookings.ts |
| `/api/bookings/group/available` | GET | Group booking slots | bookings.ts |
| `/api/bookings/checkout` | POST | Initiate Paystack checkout | bookings-checkout.ts |
| `/api/bookings/voucher-checkout` | POST | Voucher-based checkout | bookings-checkout.ts |
| `/api/bookings/:id/reschedule` | POST | Reschedule booking | bookings-checkout.ts |
| `/api/bookings/:id/cancel` | POST | Cancel booking | bookings-checkout.ts |
| `/api/bookings/paystack-webhook` | POST | Paystack webhook handler | bookings-checkout.ts |
| `/api/bookings/verify` | GET | Verify booking payment | bookings-checkout.ts |
| `/api/bookings/:id/retry-payment` | POST | Retry failed payment | payment-recovery.ts |

#### **Providers & Search**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/providers` | GET | Search providers | providers.ts |
| `/api/providers/:id` | GET | Provider detail | providers.ts |
| `/api/providers/:id/calendar.ics` | GET | iCal export | providers.ts |
| `/api/providers/:id/ical-token` | GET | iCal token | providers.ts |
| `/api/providers/:id/slots` | GET | Available time slots | providers.ts |
| `/api/providers/:providerId/availability` | GET | Provider availability | providers.ts |
| `/api/providers/:providerId/services` | GET | Provider services | providers.ts |
| `/api/providers/:id/claim` | POST | Claim provider listing | providers.ts |
| `/api/providers/claim` | POST | Claim by phone/email | providers.ts |
| `/api/providers/claim/request-meeting` | POST | Request verification meeting | providers.ts |
| `/api/providers/claim/verify` | POST | Verify claim credentials | providers.ts |
| `/api/providers/claims/admin/:id/approve` | POST | Admin approve claim | providers.ts |
| `/api/providers/claims/admin/:id/reject` | POST | Admin reject claim | providers.ts |
| `/api/providers/claims/admin/pending` | GET | Pending claims queue | providers.ts |
| `/api/providers/photo-health` | GET | Photo quality scoring | providers.ts |
| `/api/providers/lead` | POST | Lead creation (checkout) | bookings-checkout.ts |
| `/api/admin/requested-providers` | GET | Requested new providers | smart-search.ts |

#### **Profiles & Users**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/profiles/me` | GET | Current user profile | profiles.ts |
| `/api/profiles/:id` | GET | User profile detail | profiles.ts |
| `/api/profiles/me/biopoints` | GET | User biopoints balance | profiles.ts |
| `/api/profiles/me/streaks` | GET | User engagement streaks | profiles.ts |
| `/api/profiles/signup` | POST | Profile signup | profiles.ts |
| `/api/profiles/ensure` | POST | Ensure profile exists | profiles.ts |

#### **Wallet & Payments**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/wallet/balance` | GET | Wallet balance | wallet.ts |
| `/api/wallet/payment-methods` | GET | Saved payment methods | wallet.ts |
| `/api/wallet/transactions` | GET | Transaction history | wallet.ts |
| `/api/wallet/topup` | POST | Top up wallet | wallet.ts |

#### **Subscriptions & Paystack**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/paystack/banks` | GET | List SA banks | paystack.ts |
| `/api/paystack/resolve-account` | GET | Verify bank account | paystack.ts |
| `/api/paystack/provider/setup-bank` | POST | Setup provider bank | paystack.ts |
| `/api/paystack/provider/bank-details` | GET | Get provider bank info | paystack.ts |
| `/api/paystack/subscription/bootstrap-plans` | POST | Initialize plans in Paystack | paystack.ts |
| `/api/paystack/subscriptions/provider-plans` | GET | Provider subscription tiers | paystack.ts |
| `/api/paystack/subscriptions/client-plans` | GET | Client subscription tiers | paystack.ts |
| `/api/paystack/subscription/mine` | GET | User's active subscription | paystack.ts |
| `/api/paystack/calculate-fees` | GET | Fee breakdown calculator | paystack.ts |
| `/api/paystack/verify/:reference` | GET | Verify transaction | paystack.ts |
| `/api/paystack/webhook` | POST | Subscription webhook | paystack.ts |
| `/api/paystack/admin/subscription-metrics` | GET | Subscription analytics | paystack.ts |

#### **Reviews & Ratings**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/reviews/my` | GET | User's reviews | reviews.ts |
| `/api/reviews/my-pending` | GET | Pending review requests | reviews.ts |
| `/api/reviews/rate-client` | POST | Rate client | reviews.ts |
| `/api/reviews/provider/:id` | GET | Provider reviews | reviews.ts |
| `/api/reviews/provider/:id/summary` | GET | Review summary | reviews.ts |
| `/api/reviews/provider/:profileId/score` | GET | Provider score | reviews.ts |
| `/api/reviews/client/:profileId/score` | GET | Client score | reviews.ts |
| `/api/reviews/mediate` | POST | Dispute mediation | reviews.ts |

#### **Referrals & Commissions**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/referrals/my-code` | GET | Referral code | referrals.ts |
| `/api/referrals/my-stats` | GET | Referral stats | referrals.ts |
| `/api/referrals/client/my-stats` | GET | Client referral stats | referrals.ts |
| `/api/referrals/my-referrals` | GET | List referrals | referrals.ts |
| `/api/referrals/list` | GET | Public referral list | referrals.ts |
| `/api/provider-referrals` | GET | Provider referral links | provider-referrals.ts |
| `/api/provider-referrals` | POST | Create provider referral | provider-referrals.ts |
| `/api/provider-referrals/:id` | PATCH | Update referral | provider-referrals.ts |

#### **Challenges & Wellness**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/challenges` | GET | List challenges | challenges.ts |
| `/api/challenges/my` | GET | User's challenges | challenges.ts |
| `/api/challenges/:id/join` | POST | Join challenge | challenges.ts |

#### **Programs**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/programs/:id` | GET | Program detail | programs.ts |
| `/api/programs/by-provider/:providerId` | GET | Provider programs | programs.ts |
| `/api/programs/enrollments/me` | GET | User enrollments | programs.ts |
| `/api/programs/my` | GET | User's programs | programs.ts |
| `/api/programs/:id/publish` | POST | Publish program | programs.ts |

#### **Health & Wellness**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/health-profile` | GET | User health profile | health-profile.ts |
| `/api/health-profile/:clientId` | GET | Client health profile | health-profile.ts |
| `/api/health-profile` | PUT | Update health profile | health-profile.ts |
| `/api/notes` | GET | Wellness notes | notes.ts |
| `/api/notes` | POST | Create note | notes.ts |
| `/api/notes/:id` | DELETE | Delete note | notes.ts |

#### **Messages & Communications**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/messages/conversations` | GET | Message conversations | messages.ts |
| `/api/chat` | POST | Chat message (AI) | chat.ts |

#### **Notifications**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/notifications` | GET | User notifications | notifications.ts |
| `/api/notifications/unread-count` | GET | Unread count | notifications.ts |
| `/api/notifications/:id/read` | PATCH | Mark as read | notifications.ts |
| `/api/notifications/read-all` | PATCH | Mark all as read | notifications.ts |
| `/api/notifications/push/subscribe` | POST | Subscribe to push | notifications.ts |
| `/api/notifications/push/unsubscribe` | DELETE | Unsubscribe push | notifications.ts |
| `/api/notifications/push/vapid-public-key` | GET | VAPID public key | notifications.ts |

#### **Analytics**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/analytics/provider` | GET | Provider analytics (Pro tier) | analytics.ts |
| `/api/analytics/provider/detailed` | GET | Detailed analytics | analytics.ts |
| `/api/analytics/provider/views` | GET | Page view analytics | analytics.ts |
| `/api/analytics/admin` | GET | Platform analytics | analytics.ts |
| `/api/analytics/stats` | GET | Usage stats | analytics.ts |
| `/api/analytics/utility-usage` | GET | Feature usage | analytics.ts |
| `/api/analytics/pageview` | POST | Log page view | analytics.ts |

#### **Bicademy (Ranger Training)**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/bicademy/courses` | GET | List courses | bicademy.ts |
| `/api/bicademy/courses/:slug` | GET | Course detail | bicademy.ts |
| `/api/bicademy/progress` | POST | Mark lesson complete | bicademy.ts |
| `/api/bicademy/progress/me` | GET | User progress | bicademy.ts |
| `/api/bicademy/certificate/:courseId` | GET | Certificate eligibility | bicademy.ts |

#### **Intake Forms & Treatment Plans**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/intake-forms` | GET | List forms | intake-forms.ts |
| `/api/intake-forms` | POST | Create form | intake-forms.ts |
| `/api/intake-forms/:id` | GET | Form detail | intake-forms.ts |
| `/api/intake-forms/:id/submissions` | GET | Form submissions | intake-forms.ts |
| `/api/intake-forms/:id/submit` | POST | Submit form | intake-forms.ts |
| `/api/intake-forms/:id` | DELETE | Delete form | intake-forms.ts |
| `/api/treatment-plans` | GET | List plans | treatment-plans.ts |
| `/api/treatment-plans` | POST | Create plan | treatment-plans.ts |
| `/api/treatment-plans/my` | GET | User plans | treatment-plans.ts |
| `/api/treatment-plans/:id` | PATCH | Update plan | treatment-plans.ts |
| `/api/treatment-plans/:id/check-in` | POST | Plan check-in | treatment-plans.ts |

#### **Telehealth & Video**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/telehealth/room/:bookingId` | GET | Video room token | telehealth.ts |
| `/api/telehealth/room` | POST | Create video room | telehealth.ts |
| `/api/voice/transcribe` | POST | Transcribe audio | voice.ts |

#### **Provider Locations**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/providers/locations` | GET | List locations | locations.ts |
| `/api/providers/locations` | POST | Add location | locations.ts |
| `/api/providers/locations/:id` | PATCH | Update location | locations.ts |
| `/api/providers/locations/:id` | DELETE | Delete location | locations.ts |

#### **Medical Aid Integration**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/profiles/medical-aid` | GET | User medical aid | medical-aid.ts |
| `/api/profiles/medical-aid` | PATCH | Update medical aid | medical-aid.ts |
| `/api/profiles/medical-aid` | DELETE | Remove medical aid | medical-aid.ts |

#### **Disputes & Refunds**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/disputes/mine` | GET | User disputes | disputes.ts |
| `/api/disputes/open` | POST | Raise dispute | disputes.ts |
| `/api/disputes/:id/respond` | POST | Dispute response | disputes.ts |
| `/api/disputes/:id/escalate` | POST | Escalate dispute | disputes.ts |
| `/api/disputes/:id/accept-ai` | POST | Accept AI resolution | disputes.ts |
| `/api/disputes/admin/open` | GET | Pending disputes | disputes.ts |
| `/api/disputes/admin/:id/resolve` | POST | Admin resolution | disputes.ts |

#### **Compliance & KYC**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/kyc/phone/send-otp` | POST | Send OTP | kyc.ts |
| `/api/kyc/phone/verify-otp` | POST | Verify OTP | kyc.ts |
| `/api/kyc/signup/precheck` | POST | Pre-signup check | kyc.ts |
| `/api/kyc/provider/submit-documents` | POST | Submit verification docs | kyc.ts |
| `/api/compliance/admin/booking-lookup` | GET | Book lookup (rate-limited) | compliance.ts |
| `/api/compliance/admin/events` | GET | Compliance events | compliance.ts |
| `/api/compliance/corporate/:profileId/required` | GET | Corporate KYC status | compliance.ts |
| `/api/compliance/admin/bo/approve` | POST | Approve beneficial owner | compliance.ts |
| `/api/compliance/admin/bo/reject` | POST | Reject beneficial owner | compliance.ts |
| `/api/compliance/admin/fica/release` | POST | Release FICA hold | compliance.ts |
| `/api/compliance/admin/fica/reject` | POST | Reject FICA | compliance.ts |
| `/api/compliance/admin/manual-refund` | POST | Manual refund | compliance.ts |
| `/api/compliance/corporate/beneficial-owners` | POST | Submit beneficial owners | compliance.ts |
| `/api/compliance/ranger/sars-declare` | POST | SARS declaration | compliance.ts |
| `/api/compliance/ranger/withdraw` | POST | Withdraw earnings | compliance.ts |

#### **POPIA & Data Privacy**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/popia/my-data` | GET | My personal data | popia.ts |
| `/api/popia/my-requests` | GET | Data requests | popia.ts |
| `/api/popia/consent` | POST | Record consent | popia.ts |
| `/api/popia/delete-request` | POST | Request deletion | popia.ts |
| `/api/popia/delete-cancel` | POST | Cancel deletion | popia.ts |
| `/api/popia/delete-my-data` | POST | Execute deletion | popia.ts |
| `/api/popia/export` | POST | Export data | popia.ts |
| `/api/popia/admin/delete/:profileId` | POST | Admin delete user | popia.ts |

#### **Marketing & Campaigns**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/campaigns/active` | GET | Active campaigns | campaigns.ts |
| `/api/campaigns/outreach-stats` | GET | Campaign stats | campaigns.ts |
| `/api/campaigns/whatsapp-outreach/status` | GET | WhatsApp campaign status | campaigns.ts |
| `/api/campaigns/provider-outreach` | POST | Start provider outreach | campaigns.ts |
| `/api/campaigns/whatsapp-outreach` | POST | WhatsApp outreach | campaigns.ts |
| `/api/campaigns/run-migration` | POST | Campaign migration | campaigns.ts |
| `/api/marketing/scheduled` | GET | Scheduled emails | marketing.ts |
| `/api/marketing/schedule` | POST | Schedule email | marketing.ts |
| `/api/marketing/scheduled/:id` | DELETE | Delete scheduled | marketing.ts |
| `/api/broadcasts` | GET | Broadcast list | broadcasts.ts |
| `/api/broadcasts` | POST | Create broadcast | broadcasts.ts |
| `/api/campaigns/ranger/sars-declare` | POST | Ranger SARS declaration | compliance.ts |

#### **WhatsApp Integration**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/whatsapp/webhook` | GET | WhatsApp webhook verify | whatsapp.ts |
| `/api/whatsapp/webhook` | POST | WhatsApp webhook handler | whatsapp.ts |
| `/api/whatsapp/send` | POST | Send WhatsApp | whatsapp.ts |
| `/api/whatsapp/booking-confirmation` | POST | Booking confirmation via WA | whatsapp.ts |
| `/api/whatsapp/reminder` | POST | Send reminder | whatsapp.ts |
| `/api/whatsapp/provider-notification` | POST | Notify provider | whatsapp.ts |
| `/api/whatsapp/send-reminders` | POST | Batch reminders | whatsapp.ts |
| `/api/whatsapp/broadcast` | POST | Broadcast message | whatsapp.ts |
| `/api/whatsapp/health` | GET | WhatsApp health check | whatsapp.ts |
| `/api/whatsapp/admin/conversations` | GET | Admin inbox | whatsapp.ts |
| `/api/whatsapp/admin/conversations/:phone` | GET | Conversation history | whatsapp.ts |
| `/api/whatsapp/admin/reply` | POST | Admin reply | whatsapp.ts |
| `/api/whatsapp/admin/stats` | GET | WhatsApp metrics | whatsapp.ts |

#### **Email & Transactional**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/email/send` | POST | Generic email | email.ts |
| `/api/email/booking-confirmation` | POST | Booking email | email.ts |
| `/api/email/reminder` | POST | Reminder email | email.ts |
| `/api/email/receipt` | POST | Receipt email | email.ts |
| `/api/email/welcome` | POST | Welcome email | email.ts |
| `/api/email/verification-status` | POST | Verification status | email.ts |

#### **Payouts & Transfers**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/payouts/run` | POST | Process payouts | payouts.ts |
| `/api/payouts/finalise/:transfer_code` | POST | Finalize transfer | payouts.ts |

#### **BioPoints & Rewards**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/biopoints/balance` | GET | BioPoints balance | biopoints.ts |
| `/api/biopoints/history` | GET | Points history | biopoints.ts |
| `/api/biopoints/redeem` | POST | Redeem points | biopoints.ts |

#### **Reviews & Billabong (B_)**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/b-review/sponsor` | POST | Sponsor review | b-review.ts |
| `/api/b-review/reward` | POST | Reward review | b-review.ts |
| `/api/b-review/product` | POST | Product review | b-review.ts |
| `/api/b-review/dispute` | POST | Dispute review | b-review.ts |

#### **Queue Management (B_ Session Reviews)**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/queue` | GET | Queue list | queue.ts |
| `/api/queue` | POST | Add to queue | queue.ts |
| `/api/queue/:id` | PATCH | Update queue item | queue.ts |
| `/api/queue/:id` | DELETE | Remove from queue | queue.ts |

#### **Ranger CRM**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/ranger-crm/leads` | GET | Lead list | ranger-crm.ts |
| `/api/ranger-crm/leads` | POST | Add lead | ranger-crm.ts |
| `/api/ranger-crm/leads/:id` | PATCH | Update lead | ranger-crm.ts |
| `/api/ranger-crm/leads/:id` | DELETE | Delete lead | ranger-crm.ts |
| `/api/ranger-crm/leads/:id/activities` | GET | Lead activities | ranger-crm.ts |
| `/api/ranger-crm/leads/:id/activity` | POST | Log activity | ranger-crm.ts |
| `/api/ranger-crm/follow-ups` | GET | Follow-up tasks | ranger-crm.ts |
| `/api/ranger-crm/stats` | GET | Rep stats | ranger-crm.ts |
| `/api/ranger-crm/suggested-leads` | GET | AI-suggested leads | ranger-crm.ts |
| `/api/ranger-crm/templates` | GET | Email templates | ranger-crm.ts |
| `/api/ranger-crm/admin/overview` | GET | Ranger overview | ranger-crm.ts |

#### **Support & Ticketing**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/support/tickets/mine` | GET | User tickets | support.ts |
| `/api/support/tickets/:id` | GET | Ticket detail | support.ts |
| `/api/support/tickets` | POST | Create ticket | support.ts |
| `/api/support/tickets/:id/reply` | POST | Reply to ticket | support.ts |
| `/api/support/tickets/admin/queue` | GET | Admin queue | support.ts |
| `/api/support/tickets/admin/:id/assign` | POST | Assign ticket | support.ts |
| `/api/support/tickets/admin/:id/reply` | POST | Admin reply | support.ts |
| `/api/support/tickets/admin/:id/status` | POST | Update status | support.ts |
| `/api/support/auto-ticket` | POST | Auto-create ticket | support.ts |

#### **Affiliates & Revenue**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/affiliates/register` | POST | Join affiliate program | affiliates.ts |
| `/api/affiliates/dashboard` | GET | Affiliate stats | affiliates.ts |
| `/api/affiliates/withdraw` | POST | Affiliate payout | affiliates.ts |

#### **Gift Vouchers**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/gift-vouchers/my` | GET | User vouchers | gift-vouchers.ts |
| `/api/gift-vouchers/redeem` | GET | Redeem page | gift-vouchers.ts |

#### **Packages (Group Bookings)**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/packages` | GET | Package list | packages.ts |
| `/api/packages/my` | GET | User packages | packages.ts |

#### **Spotlight (Featured Providers)**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/spotlight/active` | GET | Featured providers | spotlight.ts |
| `/api/spotlight/pricing` | GET | Spotlight pricing | spotlight.ts |

#### **Guest Landing (Airbnb Integration)**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/guest/landing/:code` | GET | Guest landing page | guest-landing.ts |
| `/api/guest/stats/:code` | GET | Guest stats | guest-landing.ts |

#### **AI Features**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/ai/estimate-calories` | POST | AI calorie estimation | ai.ts |

#### **Smart Search & Directory**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/search/smart` | GET | Smart provider search | smart-search.ts |
| `/api/search/request-provider` | POST | Request new provider | smart-search.ts |

#### **Terms & Legal**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/terms/current` | GET | Current terms version | terms.ts |
| `/api/terms/check` | GET | Check user acceptance | terms.ts |
| `/api/terms/accept` | POST | Accept terms | terms.ts |

#### **Verify & Security**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/verify/hpcsa` | POST | Verify HPCSA | verify.ts |
| `/api/verify/ocr-document` | POST | OCR document scan | verify.ts |

#### **Admin Utilities**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/admin-setup` | POST | Initial admin setup | admin-setup.ts |
| `/api/admin-setup/status` | GET | Setup status | admin-setup.ts |
| `/api/admin-setup/token` | GET | Admin token | admin-setup.ts |
| `/api/admin/metrics` | GET | Platform KPIs | admin-metrics.ts |
| `/api/admin/metrics/alerts` | GET | Operational alerts | admin-metrics.ts |
| `/api/admin/metrics/queues` | GET | Queue depths | admin-metrics.ts |
| `/api/admin/metrics/gmv` | GET | GMV (range: today/week/month) | admin-metrics.ts |
| `/api/admin/db-health` | GET | Database index status | admin-db.ts |
| `/api/admin/db-stats` | GET | Table row counts | admin-db.ts |
| `/api/admin/audit-log` | GET | Audit log | auditLog.ts |
| `/api/admin/uptime` | GET | Uptime monitoring | uptimeMonitor.ts |
| `/api/admin/email-health` | GET | Email deliverability | emailMonitor.ts |
| `/api/admin/assistant/inbox` | GET | Admin inbox | admin-assistant.ts |

#### **Corporate Features**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/corporate/employees` | GET | Employee roster | corporate.ts |
| `/api/corporate/providers` | GET | Associated providers | corporate.ts |
| `/api/corporate/stats` | GET | Wellness stats | corporate.ts |
| `/api/corporate/rep` | GET | Corporate rep info | corporate.ts |
| `/api/corporate/reports` | GET | Wellness reports | corporate-reports.ts |

#### **Health & Bio Tools**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/health` | GET | Platform health | health.ts |

#### **Debug & Testing**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/debug/throw-sentry-test` | GET | Test error logging | debug.ts |
| `/api/debug/throw-sentry-fresh` | POST | Fresh error test | debug.ts |
| `/api/debug/throw-sentry-test` | POST | Repeat error test | debug.ts |

#### **Sentry Webhook**
| Endpoint | Method | Description | File |
|----------|--------|-------------|------|
| `/api/sentry/webhook` | POST | Sentry error webhook | sentry-webhook.ts |

---

### SECTION 3: DATABASE TABLES (Supabase Schema)

**Source:** Multiple SQL migration files in `/Users/mac/Documents/Builds/BION/`

#### **Core Auth & Profiles**
1. **auth.users** — Supabase built-in
2. **public.user_roles** — User role assignments (client, provider, corporate, admin, sales_rep)
3. **public.profiles** — User profile data (full_name, email, phone, avatar_url, bio, specialty, location, experience_years, qualifications, is_featured, is_active)

#### **Bookings & Services**
4. **public.categories** — Service categories (Medical & Health, Fitness, Beauty, Mental Wellness, etc.)
5. **public.services** — Services offered by providers (provider_id, category_id, title, description, duration_minutes, price, is_free_intro, is_published)
6. **public.bookings** — Booking records (client_id, provider_id, service_id, booking_date, booking_time, status, notes, total_price, payment_status, payment_method)
7. **public.booking_requests** — Legacy unregistered booking requests

#### **Subscriptions & Payments**
8. **public.subscriptions** — Recurring subscriptions (profile_id, tier, paystack_plan_code, paystack_subscription_code, status, amount_rand, current_period_start, current_period_end, next_billing_at, cancelled_at)
9. **public.subscription_invoices** — Monthly invoice ledger (subscription_id, paystack_reference, amount_rand, ranger_commission_rand, ranger_commission_credited)
10. **public.wallet_transactions** — Wallet ledger (profile_id, type: deposit, withdrawal, booking_fee, commission, refund, booking_credit, amount, reference_id)

#### **Communications**
11. **public.messages** — Direct messages between users (sender_id, receiver_id, content, is_read)
12. **public.notifications** — User notifications (profile_id, type, title, body, data, is_read)
13. **public.whatsapp_messages** — WhatsApp message archive (phone, direction, content, meta)
14. **public.whatsapp_outbound_daily** — Daily WhatsApp cap tracker (phone, sent_date, sent_count)

#### **Rewards & Points**
15. **public.biopoints** — Legacy activity points (user_id, points, reason, created_at)
16. **public.voucher_wallet** — Rand-based rewards (user_id, amount_rand, source, expires_at, redeemed_at)
17. **public.monthly_spend** — Spending tracker for cashback (user_id, month, total_spent_rand, vouchers_earned_rand)
18. **public.activity_points** — New points system (user_id, points, action, reference_id)
19. **public.referrals** — Client-to-client referrals (referrer_id, referred_id, signup_bonus_awarded, subscription_active)
20. **public.commission_earnings** — Referral commission ledger (user_id, referral_id, amount_rand)

#### **Health & Wellness**
21. **public.health_profiles** — Client health data (profile_id, blood_type, medical_conditions, medications, allergies, emergency_contact)
22. **public.health_logs** — Health measurements (profile_id, type, value, unit, recorded_at)
23. **public.user_streaks** — Engagement streaks (user_id, current_streak, longest_streak)

#### **Provider Features**
24. **public.provider_availability** — Availability slots (provider_id, day_of_week, start_time, end_time)
25. **public.provider_analytics** — Provider performance (provider_id, bookings_count, revenue, avg_rating, cancellation_rate)
26. **public.provider_claims** — Unclaimed business verification (provider_name, email, phone, status: pending, verified, rejected)
27. **public.provider_search_capacity** — Search index optimization (provider_id, specialties, locations, availability_status)

#### **Programs & Training**
28. **public.programs** — Wellness programs (provider_id, title, description, category, price, is_published)
29. **public.courses** — Training courses (course_code, title, description, target_role, is_published)
30. **public.lessons** — Course lessons (course_id, lesson_number, title, content, quiz_data)
31. **public.enrollments** — Course enrollments (profile_id, course_id, lessons_completed, quiz_scores, status)

#### **Bicademy (Ranger Training)**
32. **public.bicademy_courses** — Ranger training catalog
33. **public.bicademy_lessons** — Training lessons
34. **public.bicademy_enrollments** — Ranger enrollments

#### **Reviews & Ratings**
35. **public.reviews** — Service reviews (reviewer_id, provider_id, rating, comment, created_at)
36. **public.ratings** — Ratings aggregation

#### **Disputes & Refunds**
37. **public.disputes** — Booking disputes (booking_id, initiator_id, reason, status: open, in_resolution, resolved, closed, amount)
38. **public.dispute_resolutions** — Dispute closure records (dispute_id, resolution_type, amount_refunded)

#### **Compliance & KYC**
39. **public.kyc_submissions** — KYC verification documents (profile_id, document_type, status, submitted_at, verified_at)
40. **public.beneficial_owners** — Corporate beneficial owner info (corporate_profile_id, full_name, id_number, ownership_percent)
41. **public.popia_consents** — GDPR/POPIA consent tracking (profile_id, consent_type, status, consented_at)
42. **public.popia_requests** — Data deletion requests (profile_id, type: export, delete, request_date, status)

#### **Intake & Treatment**
43. **public.intake_forms** — Intake form templates (provider_id, title, fields)
44. **public.intake_submissions** — Form submissions (form_id, client_id, data, submitted_at)
45. **public.treatment_plans** — Treatment plans (provider_id, client_id, description, duration, status)
46. **public.treatment_checkins** — Progress tracking (plan_id, checkin_date, notes, status)

#### **Locations**
47. **public.provider_locations** — Multi-location support (provider_id, location_name, address, city, latitude, longitude, is_primary)

#### **Medical Aid**
48. **public.medical_aids** — User medical aid registration (profile_id, scheme_name, member_id, plan_type, is_active)

#### **Support & Ticketing**
49. **public.support_tickets** — Ticket system (profile_id, subject, description, status: open, in_progress, resolved, closed, priority)
50. **public.support_replies** — Ticket responses (ticket_id, responder_id, message)

#### **CRM & Sales**
51. **public.ranger_crm_leads** — Sales rep leads (ranger_id, provider_id, status: prospect, contacted, demo, qualified, closed, notes)
52. **public.ranger_crm_activities** — Lead interaction log (lead_id, activity_type, description, next_followup)

#### **Marketing & Campaigns**
53. **public.campaigns** — Email/SMS campaigns (name, status, segment, scheduled_at, sent_at)
54. **public.broadcasts** — WhatsApp/SMS broadcasts (message, target_audience, status: pending, processing, sent, failed)
55. **public.marketing_scheduled** — Scheduled emails (recipient_id, subject, body, scheduled_at, status, sent_at)

#### **Admin & Auditing**
56. **public.admin_audit_log** — Action audit trail (admin_user_id, action, target_type, target_id, details, ip_address)
57. **public.outreach_log** — Provider outreach history (provider_id, provider_name, outreach_type, message, response, created_at)

#### **Transactional Tracking**
58. **public.email_log** — Email delivery tracking (to_email, channel, subject, status, error)
59. **public.payment_log** — Payment history (profile_id, amount, method, status, reference, error)

#### **Push Notifications**
60. **public.push_subscriptions** — Device subscriptions (profile_id, endpoint, auth, p256dh, created_at)

#### **External Integrations**
61. **public.external_providers** — Third-party provider imports (name, location, category, source_url)

#### **Feature Flags & Config**
62. **public.feature_flags** — Feature toggles (name, enabled, rollout_percent)
63. **public.page_views** — Page view analytics (page, visitor_id, created_at)

---

### SECTION 4: USER ROLES & PERMISSIONS

**Source:** `/Users/mac/Documents/Builds/BION/backend/src/middleware/auth.ts` + SQL schema

#### **Client (Residential Users)**
- Browse provider directory
- Book services (with 5% or 3.5% fee depending on Premium subscription)
- Message providers
- Leave reviews and ratings
- Track health (water, sleep, food, medical card)
- Join challenges
- Enroll in programs
- View treatment plans
- BioPoints rewards (earn by activities)
- Refer friends (50 pts bonus + 20% of Premium sub)
- Subscribe to Premium (R29/mo) for 3.5% booking fee
- Purchase gift vouchers
- Access free tools (BMI, water tracker, etc.)

#### **Provider (Health & Wellness Professionals)**
- Create profile with specialties & qualifications
- Set availability & pricing
- Accept bookings
- Manage clients
- Send/receive messages
- Claim unclaimed listings (verification)
- Create services & programs
- Build intake forms & treatment plans
- View client notes & health data
- Export payment history
- Subscribe to tiers:
  - **Free (R0)** — basic listing, 5% transaction fee
  - **Pro (R499/mo)** — analytics, CRM, programs, messaging
  - **Elite (R999/mo)** — white-label, dedicated manager, reduced 3.5% fees
- Create multi-location profiles
- White-label booking page (Elite only)
- Build product catalogs/storefronts
- Access advanced reporting
- Request payouts (monthly, 1st of month)

#### **Sales Rep (Ranger)**
- Manage provider leads & pipeline
- Log follow-up activities
- View rep performance dashboard
- Earn commissions:
  - 2% of provider bookings (first 12 months)
  - 1% after 12 months OR if provider is Elite
  - 20% of provider subscription fees (first 12 months)
  - 10% after 12 months
- Access CRM tools
- Withdraw earnings via compliance gates
- Bicademy training platform access

#### **Corporate**
- Invite employees to wellness platform
- Choose providers for employee access
- View wellness analytics & reports
- Manage corporate wallet & budget
- Submit beneficial owner info (KYC)
- Export wellness data & compliance reports

#### **Admin (BION Operations)**
- Full platform access
- Manage providers (verify, feature, disable)
- Manage clients (suspend, data deletion)
- Manage disputes (investigate, resolve)
- Process refunds & reversals
- Verify KYC submissions
- Monitor platform analytics
- Manage campaigns & broadcasts
- Review WhatsApp conversations
- Handle support tickets
- Manage subscriptions & billing
- View audit logs
- System health monitoring

---

### SECTION 5: SUBSCRIPTION TIERS & PRICING

**Source:** `/Users/mac/Documents/Builds/BION/backend/src/utils/paystack.ts`

#### **Provider Plans**
| Tier | Amount | Interval | Transaction Fee | Features |
|------|--------|----------|-----------------|----------|
| **Free** | R0 | Monthly | 5% | Basic listing, accept bookings, 5% platform fee |
| **Pro** | R499 | Monthly | 5% | Everything in Free + analytics dashboard, CRM tools, program builder, priority support, custom availability, client messaging |
| **Elite** | R999 | Monthly | 3.5% | Everything in Pro + reduced 3.5% fee, white-label booking page, dedicated account manager, advanced reporting, early feature access, unlimited service listings |

#### **Client Plans**
| Tier | Amount | Interval | Booking Fee | Features |
|------|--------|----------|-------------|----------|
| **Free** | R0 | Monthly | 5% | Browse & book, water reminders, sleep monitoring, digital medical card, AI life coach, BioPoints, health passport, 5% booking fee |
| **Premium** | R29 | Monthly | 3.5% | Everything in Free + reduced 3.5% booking fee (saves on every transaction), priority booking, premium badge |

#### **Fee Model**
```
STANDARD (Free provider OR free client):
  Service price: R100
  Client pays: R105 (R100 + R5 fee = 5%)
  Provider receives: R95 (R100 - R5 platform fee)
  Paystack fee: ~R2.58 (1.5% + R1)
  BION gross: ~R7.42
  Sales rep: 2% of total (R2.10)

PREMIUM (Provider Elite R999 + Client Premium R29):
  Service price: R100
  Client pays: R103.50 (R100 + R3.50 fee = 3.5%)
  Provider receives: R96.50 (R100 - R3.50 platform fee)
  Paystack fee: ~R2.55
  BION gross: ~R4.45
  Sales rep: 1% of total (R1.04)
```

---

### SECTION 6: WHATSAPP BOT FEATURES

**Source:** `/Users/mac/Documents/Builds/BION/backend/src/routes/whatsapp.ts`

#### **WhatsApp Commands & Flows**
| Command | Purpose | Trigger |
|---------|---------|---------|
| Booking confirmation | Sent to client after booking paid | `/api/whatsapp/booking-confirmation` |
| Booking reminders | 24h & 1h before appointment | Crons in server.ts |
| Session reminders | Post-session follow-ups | `sendPostSessionReviewRequests()` |
| Provider notifications | New booking alerts | `/api/whatsapp/provider-notification` |
| Admin alerts | Inbound message notifications | `alertOutreachReply()` |
| Broadcast messages | Bulk messaging | `/api/whatsapp/broadcast` |
| Knowledge base QA | AI-powered support | Inbound message handler |
| Daily outbound cap | Hard limit 30 msgs/phone/day | `incrementAndCheckDailyCap()` |

#### **WhatsApp Daily Cron (6am SAST)**
- Sends 24h booking reminders to clients
- Sends 1h booking reminders to providers
- Sends subscription renewal notices
- Sends provider digest emails

#### **WhatsApp Conversation Tracking**
- `/api/whatsapp/admin/conversations` — List all conversations
- `/api/whatsapp/admin/conversations/:phone` — Full history for phone
- `/api/whatsapp/admin/reply` — Admin response to inbound

---

### SECTION 7: EMAIL CHANNELS & TEMPLATES

**Source:** `/Users/mac/Documents/Builds/BION/backend/src/utils/emailChannels.ts`

#### **Email Channels (9 channels, each with unique mailbox)**
| Channel | Email | Purpose | Reply-To |
|---------|-------|---------|----------|
| **bookings** | bookings@bionhealth.co.za | Booking confirmations, schedule changes, reminders | (no reply-to) |
| **support** | support@bionhealth.co.za | General help, account issues, how-to | support@bionhealth.co.za |
| **disputes** | disputes@bionhealth.co.za | Complaints, refunds, service quality | disputes@bionhealth.co.za |
| **sales** | sales@bionhealth.co.za | Provider onboarding, sales rep comms | sales@bionhealth.co.za |
| **accounts** | accounts@bionhealth.co.za | Billing, invoices, Paystack issues | accounts@bionhealth.co.za |
| **marketing** | marketing@bionhealth.co.za | Newsletters, promotions, campaigns | (no reply-to) |
| **noreply** | noreply@bionhealth.co.za | System notifications (password resets, verification) | (no reply-to) |
| **hr** | hr@bionhealth.co.za | HR & payroll | hr@bionhealth.co.za |
| **tech** | tech@bionhealth.co.za | Technical alerts (Sentry, uptime) | tech@bionhealth.co.za |

#### **SMTP Configuration**
- **Host:** bayek.aserv.co.za (secure TLS port 465)
- **Fallback:** If channel credential missing, falls back to support@ mailbox
- **Transporter cache:** Connections pooled per channel to minimize SMTP overhead

#### **Email Transactional Flows**
| Email Type | Trigger | Sent Via | Cron |
|-----------|---------|----------|------|
| Booking confirmation | Payment success | bookings@ | Immediate |
| 24h booking reminder | Time-based | bookings@ | Daily 6am SAST |
| 1h booking reminder | Time-based | bookings@ | Daily 6am SAST |
| Weekly provider digest | Summary email | marketing@ | Weekly 8am SAST |
| Monthly client digest | Summary email | marketing@ | Monthly 1st 8am SAST |
| Subscription renewal notice | 7 days before expiry | accounts@ | Daily hourly check |
| Welcome drip (3 emails) | New signup | marketing@ | Scheduled cascade |
| Onboarding nudge | Abandoned signup | marketing@ | Daily ~7am SAST |
| Outreach provider notification | Outreach campaign | marketing@ | Scheduled |
| Password reset | /forgot-password | noreply@ | Immediate |
| Email verification | /verify-email | noreply@ | Immediate |
| Support ticket reply | Admin response | support@ | Immediate |

---

### SECTION 8: AUTOMATED SYSTEMS & CRONS

**Source:** `/Users/mac/Documents/Builds/BION/backend/src/server.ts`

#### **Daily Scheduled Jobs**
| Job | Trigger Time (SAST) | Frequency | Purpose | Function |
|-----|-------------------|-----------|---------|----------|
| **WhatsApp reminders** | 6:00 AM | Daily | Send 24h + 1h booking reminders | `scheduleDailyReminders()` |
| **Admin digest** | 8:00 AM | Daily | Alert ops team of critical issues | `scheduleDailyAdminDigest()` |
| **Ranger follow-up reminders** | 9:00 AM | Daily | Remind sales reps of leads | `scheduleRangerFollowUps()` |
| **Welcome drip emails** | 10:00 AM | Daily | Send onboarding sequence | `scheduleWelcomeDrip()` |

#### **Recurring Interval Jobs**
| Job | Interval | Purpose | Function |
|-----|----------|---------|----------|
| **Broadcast scheduler** | Every 15 min | Process queued WhatsApp/SMS broadcasts | `processScheduledBroadcasts()` |
| **Marketing scheduler** | Every 5 min | Send pending scheduled emails | Marketing queue processor |
| **Paystack payout runner** | Hourly (varies) | Process provider payouts | `processPayoutRun()` |
| **Subscription renewal check** | Every 30 min | Check & send renewal notices | `sendSubscriptionRenewalNotices()` |
| **Dispute sweep** | Every 6 hours | Escalate overdue disputes | `sweepOverdueDisputes()` |
| **Abandoned booking recovery** | Every 4 hours | Retry failed payment collections | `sweepAbandonedBookings()` |
| **Uptime monitoring** | Every 5 min | Health check API | `startUptimeMonitor()` |
| **Email deliverability** | Every 10 min | Check bounce rates | `checkEmailDeliverability()` |

#### **One-Time Scheduled Events**
| Event | Trigger | Result |
|-------|---------|--------|
| **Beneficial owner deadline** | 7+ days without submission | Admin alert |
| **FICA hold aging** | 30+ days unresolved | Escalation email |
| **Stale pending bookings** | 7+ days no status change | Admin review queue |
| **Provider claim SLA** | 14+ days pending | Admin alert |
| **Bank refund stuck** | 14+ days | Manual intervention flag |

---

### SECTION 9: THIRD-PARTY INTEGRATIONS

**Source:** Multiple files + environment variables

#### **Payment: Paystack**
- **Sub-accounts:** Provider-specific settlement for transaction splits
- **Plans:** Recurring subscription management (R499, R999, R29)
- **Subscriptions:** Webhook validation on charge.success for commission accrual
- **Transfers:** Monthly provider payouts (1st of month)
- **Plans config:** PROVIDER_PLANS, CLIENT_PLANS, SALES_REP_CONFIG in paystack.ts
- **Fee calculation:** `calculateFees()` function with provider/client tier logic

#### **Payment: Stripe (Legacy)**
- **Routes:** `/api/stripe/config`, `/api/stripe/payment-intent`, `/api/stripe/subscription`
- **Webhook:** `/api/stripe/webhook` for charge.succeeded events
- **Use:** Optional alternative to Paystack (currently in transition)

#### **Messaging: WhatsApp Cloud API (Meta)**
- **Endpoint:** `https://graph.facebook.com/v25.0/{WHATSAPP_PHONE_NUMBER_ID}/messages`
- **Auth:** Bearer token (WHATSAPP_TOKEN)
- **Features:**
  - Text messages
  - Template messages (booking confirmations, etc.)
  - Media (images, documents)
  - Interactive messages (buttons, lists)
- **Rates:** 30 msgs/phone/day hard cap
- **Webhook:** Bidirectional (inbound handled by `/api/whatsapp/webhook`)

#### **AI: OpenAI**
- **Usage:** 
  - Calorie estimation from food photos (`/api/ai/estimate-calories`)
  - AI life coach (in-app feature)
  - Knowledge base semantic search
  - Dispute resolution AI suggestions
- **Model:** GPT-4 Vision (for image analysis)
- **Auth:** API key (OPENAI_API_KEY)

#### **Video Conferencing: Agora (Telehealth)**
- **Feature:** `/api/telehealth/room` — generates video room token
- **Use:** In-app video consultations

#### **Database: Supabase**
- **Service:** PostgreSQL backend + Auth
- **Auth:** JWT-based (Supabase auth.users table)
- **Row-level security (RLS):** Enforces data privacy (users see own records)
- **Real-time:** Subscriptions for live message/notification updates
- **Storage:** Bucket for user photos, documents, avatars
- **API:** Uses Supabase client SDK for queries

#### **Cloud Infrastructure: Render**
- **Hosting:** Backend API server
- **Env vars:** RENDER_EXTERNAL_URL, RENDER_GIT_COMMIT
- **Deployment:** Git push triggers auto-deploy

#### **Monitoring: Sentry**
- **Error tracking:** Captures unhandled exceptions
- **Webhook:** `/api/sentry/webhook` for real-time alerts
- **Signing:** HMAC validation (SENTRY_WEBHOOK_SECRET)
- **Span tracking:** Performance instrumentation

#### **Analytics: Google Analytics (Frontend)**
- **Custom events:** Page views logged via `/api/analytics/pageview`
- **Utility tracking:** Feature usage metrics

#### **Search: Google Places API**
- **Use:** Provider location autocomplete, geocoding

#### **Push Notifications: Web Push (VAPID)**
- **Protocol:** Web Push Protocol (RFC 8030)
- **Keys:** VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
- **Storage:** push_subscriptions table
- **Usage:** Browser push notifications for bookings, messages, reminders

#### **Domain & DNS: Cloudflare (implicit)**
- **Domain:** bionhealth.co.za
- **Email routing:** Handles @bionhealth.co.za mail

---

### SECTION 10: ENVIRONMENT VARIABLES (Required & Optional)

**Source:** Environment config across backend services

#### **API Configuration**
| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Backend port | 4000 |
| `NODE_ENV` | Environment mode | production, development |
| `APP_URL` | Frontend URL | https://bionhealth.co.za |
| `BACKEND_URL` | Backend public URL | https://api.bionhealth.co.za |
| `FRONTEND_URL` | Frontend URL | https://bionhealth.co.za |
| `API_URL` | API endpoint | https://api.bionhealth.co.za |
| `CORS_ORIGIN` | CORS allowed origins | https://bionhealth.co.za,https://www.bionhealth.co.za |
| `ADMIN_SETUP_TOKEN` | One-time admin creation | (generated, secret) |

#### **Supabase**
| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API key (server-side only) |

#### **Payment: Paystack**
| Variable | Purpose |
|----------|---------|
| `PAYSTACK_SECRET_KEY` | API secret key |
| `PAYSTACK_BION_SUBACCOUNT` | BION's subaccount code for splits |

#### **Payment: Stripe**
| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | API secret |
| `STRIPE_PUBLISHABLE_KEY` | Public key |
| `STRIPE_WEBHOOK_SECRET` | Webhook HMAC secret |
| `STRIPE_PRICE_PROVIDER_PRO` | Price ID for Pro tier |
| `STRIPE_PRICE_PROVIDER_ELITE` | Price ID for Elite tier |
| `STRIPE_PRICE_CLIENT_PREMIUM` | Price ID for Premium tier |
| `STRIPE_SUCCESS_URL` | Post-payment redirect |
| `STRIPE_CANCEL_URL` | Cancel redirect |

#### **Messaging: WhatsApp**
| Variable | Purpose |
|----------|---------|
| `WHATSAPP_TOKEN` | Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verify token |
| `WHATSAPP_WABA_ID` | WABA ID |
| `WHATSAPP_DAILY_CAP` | Messages per phone/day (default 30) |

#### **Messaging: Meta (Deprecated?)**
| Variable | Purpose |
|----------|---------|
| `META_ACCESS_TOKEN` | Meta Graph API token |
| `META_PHONE_NUMBER_ID` | Phone number ID (alternative to WHATSAPP_PHONE_NUMBER_ID) |
| `WABA_ID` | WhatsApp Business Account ID |

#### **AI: OpenAI**
| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | API key for GPT-4 models |

#### **Email: SMTP Channels**
| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` | SMTP server | bayek.aserv.co.za |
| `SMTP_PORT` | SMTP port | 465 |
| `SMTP_PASS` | Default password (fallback) | (secret) |
| `SMTP_BOOKINGS_PASS` | bookings@ password | (secret) |
| `SMTP_SUPPORT_PASS` | support@ password | (secret) |
| `SMTP_DISPUTES_PASS` | disputes@ password | (secret) |
| `SMTP_SALES_PASS` | sales@ password | (secret) |
| `SMTP_ACCOUNTS_PASS` | accounts@ password | (secret) |
| `SMTP_MARKETING_PASS` | marketing@ password | (secret) |
| `SMTP_NOREPLY_PASS` | noreply@ password | (secret) |
| `SMTP_HR_PASS` | hr@ password | (secret) |
| `SMTP_TECH_PASS` | tech@ password | (secret) |
| `SMTP_TECH_USER` | tech@ email override | (optional) |

#### **Monitoring & Logging**
| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` | Error tracking DSN |
| `SENTRY_WEBHOOK_SECRET` | Webhook signing secret |

#### **Security & Encryption**
| Variable | Purpose |
|----------|---------|
| `ENCRYPTION_KEY` | Data encryption key |
| `REFERRAL_IP_SALT` | IP hashing for referral dedup |

#### **Push Notifications**
| Variable | Purpose |
|----------|---------|
| `VAPID_PUBLIC_KEY` | Web Push public key |
| `VAPID_PRIVATE_KEY` | Web Push private key |
| `VAPID_SUBJECT` | Web Push subject (mailto:) |

#### **Third-Party APIs**
| Variable | Purpose |
|----------|---------|
| `GOOGLE_PLACES_API_KEY` | Location autocomplete |

#### **System**
| Variable | Purpose |
|----------|---------|
| `RENDER_EXTERNAL_URL` | Render deployment URL (auto-set) |
| `RENDER_GIT_COMMIT` | Git commit SHA (auto-set) |
| `BION_WALLET_USER_ID` | Platform wallet account ID |

---

### SECTION 11: ONBOARDING FLOW (3 User Types)

**Source:** `/Users/mac/Documents/Builds/BION/bio-glass-ui/src/pages/onboarding/`

#### **Client Onboarding (5 Steps)**
1. **Welcome Billboard** — Platform intro, service highlights (Medical, Fitness, Beauty, Mental)
2. **Wellness Goals Quiz** — Primary goal, frequency, budget
3. **Profile Setup** — Display name, phone, city, DOB, service interests
4. **Social Presence** — Website, Instagram, LinkedIn, Facebook (optional)
5. **Consent Gate** — POPIA/GDPR acceptance + terms

**Completion Flag:** `localStorage.bion_onboarding_done_{userId}` = "1"

#### **Provider Onboarding (Multi-step)**
1. **Account Setup** — Email, phone, password
2. **Profile Info** — Full name, specialty, qualifications, experience
3. **Services** — Create 1+ services with duration & pricing
4. **Bank Details** — Account number, bank code, business name (Paystack subaccount)
5. **Availability** — Set weekly schedule
6. **Verification** — Document upload (license, registration)
7. **Terms & Consent** — Accept terms + POPIA

#### **Corporate Onboarding (Multi-step)**
1. **Company Details** — Registration, industry, employee count
2. **Billing Setup** — Choose subscription, payment method
3. **Beneficial Owners** — Ownership structure (KYC gate)
4. **Employee Roster** — Upload/invite employees
5. **Provider Network** — Select preferred provider categories
6. **Terms & Consent** — Accept corporate terms

#### **Sales Rep Onboarding (Agreement-based)**
1. **Agreement Page** → `/rep/agreement` — Review commission terms, sign
2. **Bypass to Dashboard** → `/rep/dashboard` — Access CRM immediately
3. **No formal onboarding wizard** — Flows straight into lead management

#### **Admin Setup (One-time)**
1. **POST /api/admin-setup** — Create first admin (requires ADMIN_SETUP_TOKEN)
2. **Bootstrap plans in Paystack** → `/api/paystack/subscription/bootstrap-plans`
3. **Create payment plans** (Provider Pro R499, Elite R999, Client Premium R29)

---

### SECTION 12: LEGAL PAGES & CONTENT

**Source:** `/Users/mac/Documents/Builds/BION/bio-glass-ui/src/pages/legal/`

| Page | Path | Purpose | Content |
|------|------|---------|---------|
| **Terms** | `/legal/terms` | Terms of Service | Platform usage rules, liability limits |
| **Privacy** | `/legal/privacy` | Privacy Policy | Data handling per POPIA |
| **Payment Flow** | `/legal/payment-flow` | Payment Terms | Paystack, fees, refund policy |
| **Dispute Resolution** | `/legal/dispute-resolution` | Dispute Process | How disputes are resolved |
| **Acceptable Use** | `/legal/acceptable-use` | Acceptable Use Policy | Prohibited conduct, abuse reporting |

#### **Terms Gate (All Users)**
- Enforced via `<TermsGate>` wrapper in App.tsx
- Redirects to `/legal/terms` if user hasn't accepted latest version
- Stored in `public.terms_acceptance` table (profile_id, version, accepted_at)

---

### SECTION 13: ADMIN-ONLY FEATURES & PAGES

**Location:** `/pro/admin/*` routes + admin endpoints

#### **Admin Dashboard** (`/admin/dashboard`)
- KPI summary (GMV, bookings, providers, clients)
- Real-time alerts (overdue disputes, FICA holds, stale bookings)
- Queue depths (verification, claims, tickets)

#### **Providers Management** (`/admin/providers`)
- Verify/feature/disable providers
- View claims in review queue
- Approve HPCSA licenses

#### **Clients Management** (`/admin/clients`)
- View client profiles
- Suspend/delete accounts
- Process POPIA data deletions

#### **Analytics** (`/admin/analytics`)
- GMV by date range (today, week, month)
- Conversion funnel
- Provider/client growth
- Churn analysis

#### **Verification Queue** (`/admin/verification`)
- KYC document review
- HPCSA license validation
- Provider claim verification

#### **Disputes** (`/admin/disputes`)
- Open disputes list
- AI-suggested resolutions
- Admin override/manual resolution
- Refund processing

#### **Compliance** (`/admin/compliance`)
- FICA hold tracking
- Beneficial owner submissions
- SARS compliance (Rangers)
- Manual refunds

#### **Subscriptions** (`/admin/subscriptions`)
- Active subscriptions
- Failed charges
- Churn monitoring

#### **WhatsApp Inbox** (`/admin/whatsapp`)
- Inbound messages from customers
- Conversation history
- Admin reply capability

#### **Support Tickets** (`/admin/tickets`)
- Ticket queue
- Assignment & routing
- Category trends

#### **Broadcasts & Campaigns** (`/admin/broadcasts`, `/admin/campaigns`)
- Scheduled SMS/WhatsApp/email
- Batch message sender
- Delivery tracking

#### **Ranger (Sales Rep) Management** (`/admin/rangers`)
- Commission accrual tracking
- Performance metrics
- Payout history

#### **Audit Log** (`/api/admin/audit-log`)
- All admin actions
- IP tracking
- Data modification history

#### **Database Health** (`/api/admin/db-health`, `/api/admin/db-stats`)
- Index status
- Table sizes & row counts
- Slow query detection

---

### SECTION 14: PROVIDER-SPECIFIC FEATURES & PAGES

**Location:** `/pro/*` routes

#### **Dashboard** (`/pro/dashboard`)
- Overview: bookings this week, revenue, client count
- Upcoming sessions
- Recent reviews
- Performance metrics

#### **Bookings** (`/pro/bookings`)
- Incoming booking requests
- Accept/decline/reschedule
- Booking history

#### **Schedule** (`/pro/schedule`)
- Calendar view of bookings
- Drag-to-reschedule
- Reminder settings

#### **Clients** (`/pro/clients`)
- Client roster
- History with each client
- Preferences & notes

#### **Services** (`/pro/services`)
- Service listings
- Create/edit pricing & duration
- Mark as free intro

#### **Messages** (`/pro/messages`)
- Client conversations
- Message archive

#### **Analytics** (`/pro/analytics`) — Pro Tier Only
- Bookings over time
- Revenue trends
- Page view stats
- Client acquisition
- Conversion rates

#### **Availability** (`/pro/availability`)
- Weekly recurring schedule
- Blackout dates
- Break times

#### **Billing** (`/pro/billing`)
- Active subscription
- Payment history
- Bank account setup
- Upcoming payout date

#### **Programs** (`/pro/programs`)
- Create wellness programs
- Set pricing & duration
- Publish for client enrollment

#### **Verification** (`/pro/verification`)
- KYC document status
- License validation
- Claim provider listing

#### **Storefront** (`/pro/storefront`)
- Product catalog
- Pricing & inventory
- Order management

#### **Orders** (`/pro/orders`)
- Incoming product orders
- Fulfillment tracking

#### **Catalogs** (`/pro/catalogs`)
- Service catalog builder
- Public gallery (short URL)
- Client-facing PDF export

#### **Intake Forms** (`/pro/intake-forms`)
- Form builder
- Submission viewer
- Data export

#### **Treatment Plans** (`/pro/treatment-plans`)
- Create client plans
- Track compliance
- Check-in logging

#### **Queue** (`/pro/queue`) — B_ Session Reviews
- Sessions pending review
- Provider feedback submission
- Quality assurance

#### **Referrals** (`/pro/referrals`)
- Generate referral links
- Track referral conversions
- Commission tracking

#### **Locations** (`/pro/locations`)
- Multi-location support
- Set primary location
- Edit address/hours per location

---

### SECTION 15: CLIENT-SPECIFIC FEATURES & PAGES

**Location:** `/home`, `/schedule`, `/messages`, etc.

#### **Home** (`/home`)
- Featured providers
- Personalized recommendations
- Recent bookings
- Health reminders

#### **Schedule** (`/schedule`)
- Booked appointments
- Calendar view
- Reschedule/cancel options
- Reminders

#### **Messages** (`/messages`)
- Provider conversations
- Message search
- Media sharing

#### **Profile** (`/profile`)
- Edit personal info
- Update health data
- Avatar upload

#### **Routines** (`/routines`)
- Saved routines
- Tracked habits
- Progress visualization

#### **Progress** (`/progress`)
- Health milestones
- Activity history
- Goal tracking

#### **Quick Book** (`/quick-book`)
- Simplified booking flow
- Favorite providers
- Saved slots

#### **Challenges** (`/challenges`)
- Join wellness challenges
- Track progress
- Earn rewards

#### **Health Profile** (`/health-profile`)
- Medical history
- Medications
- Allergies
- Emergency contact

#### **Wallet** (`/wallet`)
- Balance display
- Transaction history
- Topup options
- Voucher redemption

#### **Free Tools** (Public, no auth required)
- Water tracker (`/water-tracker`)
- Sleep tracker (`/sleep-tracker`)
- Food tracker (`/food-tracker`)
- Life coach (AI) (`/life-coach`)
- BMI calculator (`/tools/bmi-calculator`)
- Medical card (`/medical-card`)
- Calendar (`/calendar`)

#### **Billing** (`/billing`)
- Subscription (R29 Premium)
- Payment history
- Invoice download

#### **Notifications** (`/notifications`)
- All notifications
- Booking reminders
- Message alerts
- System notifications

#### **Favorites** (`/favorites`)
- Saved providers
- Quick access

#### **Bicademy** (`/bicademy`)
- Training courses (Rangers only, but accessible to all authenticated)
- Course progress
- Certificate issuance

#### **Programs** (`/my-programs`)
- Enrolled programs
- Progress tracking
- Check-ins

#### **Treatment Plans** (`/treatment-plans`)
- Provider-created plans
- Track compliance
- Document sessions

#### **Referrals**
- Referral code (`/referrals/my-code`)
- Refer friends
- Referral stats & earnings
- Commission tracking (client-to-client: 50 pts bonus + 20% of referred Premium sub)

#### **Support** (`/help`, `/my-tickets`)
- Create ticket
- View ticket history
- Track resolution

---

### SECTION 16: CORPORATE-SPECIFIC FEATURES & PAGES

**Location:** `/corporate/*` routes

#### **Dashboard** (`/corporate/dashboard`)
- Overview of wellness program
- Employee participation
- Spend vs. budget

#### **Employees** (`/corporate/employees`)
- Employee roster
- Invite new employees
- Usage per employee

#### **Providers** (`/corporate/providers`)
- Curated provider network
- Service categories available
- Provider performance

#### **Analytics** (`/corporate/analytics`)
- Wellness metrics
- Engagement trends
- ROI analysis

#### **Wallet** (`/corporate/wallet`)
- Corporate funding balance
- Monthly allowance
- Allocation by department

#### **Settings** (`/corporate/settings`)
- Company info
- Billing contacts
- Integration settings

#### **Beneficial Owners** (`/corporate/beneficial-owners`)
- Submit ownership structure
- KYC gate
- BO verification status

#### **Wellness Reports** (`/corporate/wellness-reports`)
- Engagement reports
- Health trends
- Compliance export

---

---

### SECTION 17: AUTHENTICATION & SESSION MANAGEMENT (Updated 25 April 2026)

**Source:** `src/lib/auth.ts`, `src/lib/authFetch.ts`, `src/App.tsx`, `src/pages/SplashOnboarding.tsx`

#### **Authentication Flow**
1. **Sign-in:** Email/password via Supabase `signInWithPassword()`
2. **Sign-up:** Backend `/api/profiles/signup` (email pre-confirmed via phone OTP)
3. **Google OAuth:** Supabase `signInWithOAuth({ provider: "google" })`
4. **Session storage:** Supabase JWT in localStorage, auto-refreshed
5. **Role resolution:** `fetchUserProfile()` → priority: switched role > DB role > metadata role > "client"

#### **Auth Guard (RequireAuth)**
- Wraps all protected routes in `App.tsx`
- If no user: redirects to `/welcome?login=true` (skips billboards, goes straight to sign-in form)
- If wrong role: redirects to user's role home page
- If onboarding incomplete: redirects to onboarding route

#### **Shared Auth Utility (`src/lib/authFetch.ts`)**
- `getAuthHeaders()` — returns auth headers or throws `NoSessionError`
- `authFetch(path, init)` — fetch wrapper that redirects to `/welcome?login=true` if no session
- `authFetchJson<T>(path, init)` — authFetch + JSON parse
- All 11 files with `authHeaders()` now use this shared utility
- Backend 401/403 responses with auth errors also trigger redirect

#### **Password Reset Flow**
1. User taps "Forgot password?" on sign-in screen
2. Frontend POSTs to `/api/account/forgot-password` with email
3. Backend generates recovery link via Supabase Admin API
4. Reset email sent via BION's own SMTP (not Supabase mailer)
5. User clicks link → redirected to `/reset-password` with Supabase session
6. User sets new password → `supabase.auth.updateUser({ password })`
7. Old sessions invalidated, user redirected to sign-in
8. If link expired: shows "link expired" message after 8 seconds with button to request new one

#### **Login UX Improvements (25 April 2026)**
- `?login=true` param skips billboard screens, goes directly to sign-in form
- Sign-in does NOT require role selection (DB resolves real role)
- Wrong credentials show: "Incorrect email or password. Please try again."
- Missing fields show: "Please enter your email and password."
- All 25+ auth-related redirects across the app now use `?login=true`
- Public CTAs (landing pages, "Sign up free" buttons) still go to `/welcome` without param

#### **TermsGate (`src/components/TermsGate.tsx`)**
- Wraps authenticated content
- Checks if user has accepted latest terms version (`2026-04-22-v1`)
- Caches accepted version in localStorage
- **Fail-open design:** On any API error, allows user through (never blocks)
- Shows blocking modal only when new terms version detected and not yet accepted

---

### SECTION 18: NOTIFICATION & REMINDER SYSTEM (Updated 25 April 2026)

**Architecture:** 4 independent layers merged into one UI at `/notifications`

#### **Layer 1: B_ Reminder Engine (Client-Side)**
**File:** `src/lib/reminders.ts`

Scans localStorage data and generates time-window reminders. Purely client-side.

| Type | Time Window | Priority | Data Source |
|------|-------------|----------|-------------|
| Morning Medication | 6am–10am | HIGH | `bion_routines` |
| Evening Medication | 7pm–10pm | HIGH | `bion_routines` |
| Workout | 6am–6pm (scheduled days) | MEDIUM | `bion_routines` |
| AM Skincare | 6am–9am | LOW | `bion_routines` |
| PM Skincare | 8pm–11pm | LOW | `bion_routines` |
| Morning Mindfulness | 5am–8am | MEDIUM | `bion_routines` |
| Breakfast | 7am–9am | LOW | `bion_routines` |
| Beauty Routine | 6pm–9pm (Sun+Wed) | LOW | `bion_routines` |
| Calendar Event | 1h before | HIGH | `bion_calendar_events` |
| Drink Water | 10am–8pm (if behind pace) | LOW | `bion_water_{date}` |
| Log Lunch | 12pm–2pm (if not logged) | LOW | `bion_food_tracker` |
| Log Dinner | 7pm–9pm (if not logged) | LOW | `bion_food_tracker` |
| Bedtime | 10pm+ | MEDIUM | Always |

- Dismissed state resets daily (localStorage key per day)
- `fireReminderNotifications()` fires medium/high as browser push
- Only fires if user has app open

#### **Layer 2: Booking Reminders (Client-Side Polling)**
**File:** `src/hooks/useBookingReminders.ts`

- Polls every 30 minutes for upcoming bookings within 24h
- Two reminder windows: 24h and 1h (separate localStorage keys per window)
- Uses service worker for background delivery
- Dedup: `bion_reminder_{booking.id}_{24h|1h}`

#### **Layer 3: DB Notifications (Supabase Realtime)**
**File:** `src/hooks/useNotifications.ts`

- Fetches from `notifications` table, subscribes to Realtime INSERT/UPDATE
- Created by backend on: booking confirmation, payment events, review requests
- `markAsRead()` / `markAllAsRead()` syncs to Supabase
- Up to 50 most recent loaded

#### **Layer 4: Backend Cron Jobs (Email + WhatsApp)**

**Active Crons:**

| Job | Schedule (SAST) | Channel | User Type |
|-----|----------------|---------|-----------|
| WhatsApp daily booking reminders | 6am | WhatsApp | Clients |
| Admin daily digest | 8am | Email | Admin |
| Ranger CRM follow-ups | 9am | WhatsApp | Rangers |
| Welcome drip emails | 10am | Email | All new users |
| 24h booking reminders | Hourly | Email + WhatsApp | Client + Provider |
| 1h booking reminders | Every 15min | Email + WhatsApp | Client + Provider |
| Subscription renewal notices | Hourly | Email | Providers |
| Weekly provider digest | Monday 8am | Email | Providers |
| Monthly client digest | 1st of month 9am | Email | Clients |
| Post-session review requests | Every 2h | WhatsApp + in-app | Clients |
| Subscription renewal reminders | 9am | WhatsApp | Providers |
| Payment recovery sweep | Hourly | WhatsApp | Clients |
| No-show handler | 10pm | WhatsApp | Client + Provider |
| Broadcast scheduler | Every 15min | Multi-channel | Admin-targeted |

**Disabled Crons (pending opt-in system):**
- Onboarding abandonment nudges (WhatsApp)
- Provider morning briefing (WhatsApp)
- Provider end-of-day summary (WhatsApp)
- Provider gap-filling offers (WhatsApp)
- Client wellness reminders 3x daily (WhatsApp)
- Weekly wellness digest (WhatsApp)
- Engagement nudges (WhatsApp)
- Client re-engagement (WhatsApp)

#### **Notification Bell (`src/components/NotificationBell.tsx`)**
- Floating badge on all pages (except notifications, onboarding, legal)
- Combined count: B_ reminders + DB unread notifications
- Navigates to `/notifications`

#### **Notifications Page (`src/pages/Notifications.tsx`)**
- Merges all 4 sources into unified feed
- Categories: booking, message, streak, reward, system, provider, payment, reminder, promotion, review
- Filter bar, mark all read, clear all, mute toggle
- B_ context-aware AI suggestions

#### **Nudge System (`src/components/NudgePopup.tsx`)**
- One-time contextual popups per feature per user
- Tracked via `profiles.nudges_seen` (jsonb array in Supabase)
- Nudge types: bionwallet_book, bionpoints_earned, health_tools_first, whatsapp_connect, provider_boost, corporate_points, ranger_pipeline

#### **WhatsApp Budget System**
- Monthly limit: 5,000 messages
- Daily limit: 200 messages
- Priority levels: critical (always), high (until daily limit), medium (throttled at 90%), low (throttled at 80%)
- In-memory tracking (resets on server restart — known limitation)

#### **Idempotency**
- Booking emails: `reminder_24h_sent_at`, `reminder_1h_sent_at` columns on `bookings` table
- WhatsApp daily reminders: `reminder_24h_sent_at` flag + in-memory backup Set
- Drip emails: `drip_email_log` table
- Browser reminders: localStorage keys per booking + window
- WhatsApp daily cap: `whatsapp_outbound_daily` table

---

### SECTION 19: B_ WHATSAPP BOT — TECH SUPPORT FLOWS (Added 25 April 2026)

**Source:** `backend/src/routes/whatsapp.ts`

B_ now handles common account/tech issues directly instead of routing everything to a Ranger.

#### **Auto-Resolved Issues**

| Issue Type | Detection | Action | Channel |
|-----------|-----------|--------|---------|
| Login/password problems | Regex: `log in`, `sign in`, `password`, `can't access`, `credentials`, `reset`, `locked out`, `error` | Looks up profile by phone → generates password reset link → emails it → replies with direct sign-in URL | WhatsApp + Email |
| Terms/conditions failures | Regex: `terms`, `conditions`, `accept`, `consent` | Troubleshooting steps (refresh, clear cache, try different browser) + link to full terms | WhatsApp |

#### **Tech Support Flow Detail**
1. User messages about login issue on WhatsApp
2. B_ detects via regex (not intent classifier — faster, no OpenAI call needed)
3. `findProfileByPhone(phone)` looks up their profile
4. If email found: generates Supabase recovery link via `supabase.auth.admin.generateLink()`
5. Sends reset email via BION SMTP (`noreply@bionhealth.co.za`)
6. Replies on WhatsApp with sign-in link + instructions
7. Creates support ticket for tracking (status: open, channel: whatsapp)

#### **Generic Support Flow (unchanged)**
- Intent: `support` (not login/terms related)
- Asks if user has a Ranger → routes to them
- Or shows support channels (SKIP flow)
- Auto-creates support ticket

---

### SECTION 20: BUGS FIXED — 25 APRIL 2026 SESSION

#### **Critical Fixes**

| Bug | Root Cause | Fix | Files Changed |
|-----|-----------|-----|---------------|
| "Missing authorisation header" shown to all users | `authHeaders()` in 11 files sent requests without token when no session | Created shared `getAuthHeaders()` that throws `NoSessionError` → redirects to `/welcome?login=true` | 12 files |
| Login form shows no error on wrong credentials | `if (!selectedRole) return;` silently blocked sign-in when no role selected | Removed role requirement for sign-in; added clear error messages | SplashOnboarding.tsx, App.tsx |
| Password reset link shows infinite spinner | ResetPassword page waited indefinitely for Supabase `PASSWORD_RECOVERY` event | Added 8-second timeout → shows "link expired" with button to request new one | ResetPassword.tsx |
| Users forced through billboards to sign in | Auth guard redirected to `/welcome` (no param) → users had to click through 2 screens + pick role | All auth redirects now use `?login=true` which skips to sign-in form | 16 files, 25 locations |
| WhatsApp booking reminders using UTC date | `toISOString()` returns UTC; at 6am SAST (4am UTC) "tomorrow" was wrong | Now uses SAST-adjusted date (UTC+2) | whatsapp.ts |
| WhatsApp reminder dedup lost on server restart | In-memory `Set` reset on every Render restart → duplicate sends | Now writes `reminder_24h_sent_at` to bookings table; query filters already-sent | whatsapp.ts |
| Browser booking reminder only fired once | Single localStorage key per booking → no 1-hour warning | Two separate keys per booking (`_24h` and `_1h`) | useBookingReminders.ts |

#### **User-Reported Issues Resolved**
- **Skin Nourishers** (provider): Couldn't log in, password reset didn't work, terms page errored → all fixed; sent WhatsApp with login instructions
- **All users**: "Missing authorisation header" error on protected pages → now redirected to sign-in
- **All users**: Had to click through billboard screens just to sign in → now skips to login form
- **All users**: No clear feedback on wrong password → now shows "Incorrect email or password"

---

## SUMMARY TABLE: PLATFORM ARCHITECTURE

| Component | Count | Details |
|-----------|-------|---------|
| **Frontend Routes** | 150+ | 60 public + 90 authenticated (client, provider, admin, corporate, rep) |
| **Backend Routes** | 70 | 66 route files with ~250 endpoints |
| **Database Tables** | 63 | Core schema + transactional + audit |
| **User Roles** | 5 | Client, Provider, Admin, Corporate, Sales_Rep |
| **Subscription Tiers** | 5 | Provider Free/Basic(R299)/Pro(R699), Client Free/Premium(R49) |
| **Email Channels** | 9 | Bookings, Support, Disputes, Sales, Accounts, Marketing, Noreply, HR, Tech |
| **WhatsApp Flows** | 10 | Confirmations, Reminders, Notifications, Broadcasts, QA, Alerts, Tech Support, Review Requests, Subscription Reminders, Payment Recovery |
| **Cron Jobs** | 14 active + 8 disabled | Daily + interval-based automation |
| **Third-Party Integrations** | 8 | Paystack, Stripe, WhatsApp, OpenAI, Agora, Supabase, Render, Sentry |
| **Legal Pages** | 5 | Terms, Privacy, Payment Flow, Dispute Resolution, Acceptable Use |
| **Admin Pages** | 20+ | Full platform management, compliance, CRM, campaigns, broadcasts |
| **Notification Layers** | 4 | B_ reminders (client-side) + booking reminders (polling) + DB notifications (realtime) + backend crons (email+WhatsApp) |

---

This is the complete BION platform wiki & knowledge base. Every route, endpoint, table, tier, command, and integration is cataloged with line numbers and file locations for reference.