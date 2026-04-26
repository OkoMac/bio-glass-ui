# BION HEALTH — Production Readiness Audit
### Audit Date: 26 April 2026
### Auditor: Claude Opus 4.6 (automated codebase analysis)
### Scope: `backend/src/` + `bio-glass-ui/src/` — 25 production failure modes

---

## SUMMARY TABLE

| # | Item | Status | Risk | Ship-Blocking? |
|---|------|--------|------|----------------|
| 1 | Load testing | MEDIUM | No baseline perf numbers | No |
| 2 | Session data in server memory | **CRITICAL** | WhatsApp conversations Map + 5 other in-memory caches. Resets on deploy. | Yes |
| 3 | File uploads to app server disk | LOW | All uploads go to Supabase Storage | No |
| 4 | Synchronous email in API routes | **HIGH** | 35+ blocking `await sendChannelEmail()` in route handlers | Yes |
| 5 | No queue system | **CRITICAL** | OpenAI calls (2-8s) block request thread; 15+ crons in-process | No (mitigated) |
| 6 | Hardcoded secrets | **CRITICAL** | Real API keys in `.env`, scripts, docs committed to repo | Yes |
| 7 | Single DB, no read replica | HIGH | No connection pooling; free-tier connection limits | No |
| 8 | No CDN for static assets | LOW | Supabase Storage CDN + Vercel CDN handles this | No |
| 9 | DB migrations on app start | LOW | No auto-migrations on boot; manual SQL only | No |
| 10 | Untested backup restore | HIGH | Zero backup/restore documentation or tested procedures | No |
| 11 | Unindexed foreign key columns | LOW | All critical FKs indexed via `verify-indexes.sql` migration | No |
| 12 | No rate limiting | **HIGH** | Missing on: signup, password reset, AI chat | Yes |
| 13 | No compression | **HIGH** | No `compression()` middleware — all JSON responses uncompressed | Yes |
| 14 | No error alerting | MEDIUM | Sentry configured but missing uncaught exception handlers | Yes |
| 15 | No transactions for multi-step writes | **HIGH** | Signup, booking cancellation, Paystack webhook lack atomicity | Yes |
| 16 | Missing health check | MEDIUM | `/api/health` exists but only checks Supabase, not OpenAI/WA/Paystack | No |
| 17 | Memory leaks | MEDIUM | Maps have cleanup; intervals lack shutdown cleanup; no monitoring | No |
| 18 | No graceful shutdown | MEDIUM | SIGTERM handler exists but no request draining (hard 10s kill) | Yes |
| 19 | No fallback for third-party APIs | HIGH | WhatsApp/Paystack failures are silent; no alternate channel | No |
| 20 | All logs to console | HIGH | `console.log` only; no structured logging or log shipping | No |
| 21 | No circuit breaker | HIGH | All external calls are naive `fetch()` — will hammer failing APIs | No |
| 22 | Unparameterized search | LOW | In-memory JSON scan of 13K providers; <50ms typical. OK for now. | No |
| 23 | No timeouts on outbound HTTP | LOW | `fetchWithTimeout(15s)` used everywhere except internal cron self-calls | No |
| 24 | WebSockets not stateful-aware | N/A | Uses Supabase Realtime, no custom WebSocket code | No |
| 25 | No runbook | **CRITICAL** | Zero operational docs; no incident response procedure | Yes |

---

## DETAILED FINDINGS

### 1. NO LOAD TESTING
**Status: MEDIUM** | **Files: none**

No load testing infrastructure exists. No k6, Artillery, or Locust scripts. No documented baseline numbers (RPS, latency, error rates). Unknown how many concurrent users the system handles before degradation.

### 2. SESSION DATA IN SERVER MEMORY
**Status: CRITICAL** | **Files: `routes/whatsapp.ts:435`, `routes/referrals.ts:43`, `routes/support.ts:790`, `routes/chat.ts`, `routes/ai.ts`, `routes/voice.ts`, `services/whatsappBudget.ts`**

**7 in-memory data structures found:**

| Location | Type | Size Bound | Cleanup | Risk |
|----------|------|-----------|---------|------|
| `whatsapp.ts:435` — `conversations` Map | Full conversation history per phone | Unbounded (1h TTL per entry) | Hourly eviction | **HIGH** — resets on every deploy, active conversations lost |
| `whatsapp.ts` — `__sentReminders` Set | Dedup for daily WA reminders | Unbounded | None (grows forever) | MEDIUM — fixed by `reminder_24h_sent_at` column but Set still exists |
| `referrals.ts:43` — `attrHits` Map | IP rate limiting | Cleanup every 5min | Yes | LOW |
| `support.ts:790` — `autoTicketSeen` Map | Dedup for auto-tickets | Cap at 500 entries | Manual eviction | LOW |
| `chat.ts` — `responseCache` Map | AI response cache | 30min TTL | Every 30min | LOW |
| `chat.ts` — `chatUsage` Map | Per-user daily limits | Daily reset | Hourly | LOW |
| `ai.ts` — `photoUsage` Map | Per-user daily limits | Daily reset | Hourly | LOW |
| `voice.ts` — `voiceUsage` Map | Per-user daily limits | Daily reset | Hourly | LOW |
| `whatsappBudget.ts` — budget counters | Monthly/daily send counts | In-memory only | None | MEDIUM — resets on restart, budget can be exceeded |

**Impact:** Every server restart (including deploys) destroys all active WhatsApp conversations mid-flow. Users experience B_ "forgetting" what they were talking about.

### 3. FILE UPLOADS TO APP SERVER DISK
**Status: LOW** | **Files: none**

All file uploads route to Supabase Storage. No `multer`, `formidable`, `fs.writeFile`, or local disk writes found. Provider photos, verification documents, and profile images all use Supabase Storage public/signed URLs.

### 4. SYNCHRONOUS EMAIL IN API ROUTES
**Status: HIGH** | **Files: `bookings-checkout.ts`, `bookings.ts`, `support.ts`, `disputes.ts`, `account.ts`, `email.ts`, `popia.ts`**

**35+ `await sendChannelEmail()` calls inside route handlers that block API responses:**

| File | Count | Worst Case Latency |
|------|-------|--------------------|
| `disputes.ts` | 8 calls | 3 sequential sends = 6-15s blocking |
| `support.ts` | 6 calls | 2-5s per send |
| `email.ts` | 6 calls | 2-5s per send |
| `popia.ts` | 4 calls | 2-5s per send |
| `bookings-checkout.ts` | 2 calls | **Payment completion path** — user waits 4-10s after paying |
| `bookings.ts` | 1 call | 2-5s |
| `account.ts` | 2 calls | 2-5s (password reset, verification) |

**Impact:** SMTP timeouts or failures cascade to user-facing errors. Booking checkout (the revenue path) blocks up to 10s for email delivery.

### 5. NO QUEUE SYSTEM
**Status: CRITICAL** | **Files: `server.ts` (15+ crons), `routes/whatsapp.ts`, `routes/ai.ts`, `routes/chat.ts`, `routes/b-review.ts`, `routes/verify.ts`**

Long-running operations in API routes with no background queue:

| Operation | Duration | Location |
|-----------|----------|----------|
| OpenAI chat completion | 2-8s | `chat.ts:155`, `whatsapp.ts:532` |
| OpenAI image analysis | 3-10s | `ai.ts`, `whatsapp.ts` |
| AI verification review | 5-15s | `verify.ts:135`, `b-review.ts` (5 calls) |
| 15+ cron schedulers | Variable | All in `server.ts` main process |

No Bull, BullMQ, pg-boss, or any job queue. All long-running work runs on the main event loop.

### 6. HARDCODED SECRETS
**Status: CRITICAL** | **Files: `backend/.env`, `bio-glass-ui/.env`, `setup-production-database.js`, `update-config.sh`, `FINAL_DEPLOYMENT_STATUS.md`**

**Real API keys committed to repository:**
- Supabase service role JWT (full admin access to DB)
- Stripe test secret key
- Paystack test secret key
- WhatsApp Business API token (permanent, never-expires)
- 8 SMTP passwords (weak: `Support@bion2026`, `Bookings@bion2026`, etc.)
- Render API key (in `.claude/settings.json`)

**Even in a private repo, this is a security incident if the repo is ever shared, forked, or accessed by a compromised account.**

### 7. SINGLE DATABASE, NO READ REPLICA
**Status: HIGH** | **Files: `utils/supabase.ts`**

- Supabase free-tier plan (20 concurrent connections max)
- No PgBouncer/connection pooling configured
- 15+ cron jobs + API routes all compete for connections
- No read replica for analytics queries

### 8. NO CDN FOR STATIC ASSETS
**Status: LOW** | **Files: none**

- Frontend: Vercel handles CDN automatically
- Provider photos: Supabase Storage (Cloudflare CDN built-in)
- No images served through API routes
- Acceptable as-is.

### 9. DB MIGRATIONS ON APP START
**Status: LOW** | **Files: `server.ts:335-339`**

No auto-migrations on boot. Only a non-blocking table existence check that logs warnings. Migrations are manual (Supabase SQL Editor). This is fine for current scale.

### 10. UNTESTED BACKUP RESTORE
**Status: HIGH** | **Files: none**

Zero documentation on backup/restore procedures. Supabase manages backups on paid plans, but:
- No documented RTO/RPO
- No tested restore procedure
- No DR runbook

### 11. UNINDEXED FOREIGN KEY COLUMNS
**Status: LOW** | **Files: `data/migrations/verify-indexes.sql`**

Comprehensive index migration exists covering all critical FKs: `bookings(client_id, provider_id)`, `notifications(user_id)`, `services(provider_id)`, `reviews(provider_id, client_id, booking_id)`, `messages(sender_id, receiver_id)`, `wallet_transactions(user_id)`, `user_roles(user_id)`.

### 12. NO RATE LIMITING
**Status: HIGH** | **Files: `server.ts:156-216`, `middleware/rateLimit.ts`**

**Rate limits in place:**
- Global: 100 req/min/IP
- Auth endpoints: 10 req/min
- Bookings: 20 req/min
- Search/providers: 30 req/min
- WhatsApp webhook: exempt (Meta requirement)

**Missing rate limits:**
- Signup (`/api/profiles/signup`) — can spam account creation
- Password reset (`/api/account/forgot-password`) — brute-force risk
- AI chat (`/api/chat`) — expensive OpenAI calls, unlimited
- AI photo analysis (`/api/ai/*`) — has per-user daily cap but no IP rate limit

### 13. NO COMPRESSION
**Status: HIGH** | **Files: `server.ts`**

No `compression()` middleware. All JSON responses sent uncompressed. Provider list (13K+ records), analytics data, and notification feeds are 5-10x larger than necessary over the wire.

### 14. NO ERROR ALERTING
**Status: MEDIUM** | **Files: `instrument.ts`, `server.ts:313-328`**

Sentry IS configured with:
- DSN set, Express instrumentation
- 10% trace sampling in production
- PII stripping enabled
- Error handler registered

**Gaps:**
- No `process.on('uncaughtException')` or `process.on('unhandledRejection')` handlers
- No alerting rules configured (Slack/email notifications on errors)
- Critical paths (payments, bookings) don't have explicit error capture

### 15. NO TRANSACTIONS FOR MULTI-STEP WRITES
**Status: HIGH** | **Files: `routes/profiles.ts`, `routes/bookings.ts`, `routes/paystack.ts`**

**3 critical flows lack atomicity:**

| Flow | Steps | Failure Risk |
|------|-------|-------------|
| Signup | Create auth user → create profile → create role | Orphaned auth user if profile insert fails |
| Booking cancellation | Insert refund → insert fee → update status | Refund processed but status not updated |
| Paystack webhook | Update payment → award points → pay commission | Partial payment state |

### 16. MISSING HEALTH CHECK
**Status: MEDIUM** | **Files: `routes/health.ts`**

`/api/health` exists and checks Supabase connectivity. Does NOT check: OpenAI, WhatsApp API, Paystack, email service. Render health check is configured to use it.

### 17. MEMORY LEAKS
**Status: MEDIUM** | **Files: see Item 2**

All Maps have cleanup mechanisms. But:
- No `clearInterval()` on shutdown
- No memory monitoring or alerting
- WhatsApp conversations Map could grow large under sustained traffic

### 18. NO GRACEFUL SHUTDOWN
**Status: MEDIUM** | **Files: `server.ts:343-362`**

SIGTERM/SIGINT handlers exist. `server.close()` is called. But:
- No in-flight request draining — hard 10s kill
- No cleanup of setInterval timers
- No notification worker drain
- Background cron tasks abandoned mid-execution

### 19. NO FALLBACK FOR THIRD-PARTY APIs
**Status: HIGH** | **Files: `utils/whatsappSend.ts`, `utils/paystack.ts`, `routes/ai.ts`**

| Service | Fallback | User Impact When Down |
|---------|----------|----------------------|
| OpenAI | Heuristic estimation | Degraded but functional |
| WhatsApp | **None** | Notifications fail silently |
| Paystack | **None** | Bookings cannot be completed |
| Supabase | **None** | Complete platform outage |

### 20. ALL LOGS TO CONSOLE
**Status: HIGH** | **Files: all**

82+ `console.log/error/warn` calls in `server.ts` alone. No structured logging. No log shipping. Logs disappear on server restart. No request tracing (no correlation IDs).

### 21. NO CIRCUIT BREAKER
**Status: HIGH** | **Files: none**

Zero circuit breaker implementations. All external HTTP calls are naive `fetch()` with timeouts but no failure tracking. A slow/failing API will be hammered continuously.

### 22. UNPARAMETERIZED SEARCH
**Status: LOW** | **Files: `services/providerSearch.ts`**

In-memory JSON scan of 13K providers. Typical query <50ms. Levenshtein distance for suburb matching. Acceptable up to ~50K providers. No database query involved (all in RAM).

### 23. NO TIMEOUTS ON OUTBOUND HTTP
**Status: LOW** | **Files: `utils/fetchWithTimeout.ts`**

`fetchWithTimeout(url, options, 15000)` wrapper exists and is used for OpenAI, WhatsApp, Paystack. Only gap: internal cron self-calls to `localhost` lack timeouts.

### 24. WEBSOCKETS NOT STATEFUL-AWARE
**Status: N/A**

Uses Supabase Realtime exclusively. No custom WebSocket code. Supabase handles the stateful layer. No action needed.

### 25. NO RUNBOOK
**Status: CRITICAL** | **Files: none**

Zero operational documentation. No incident response procedure. No rollback instructions. No escalation contacts. No on-call rotation. No DR plan.

---

## PRIORITISED REMEDIATION PLAN

### SHIP-BLOCKING (Must Fix Before Launch)

| Priority | Item | Effort | Action |
|----------|------|--------|--------|
| P1 | #6 Hardcoded secrets | 2h | Rotate ALL keys. Add `.env` to `.gitignore`. Scrub git history. Create `docs/SECURITY.md`. |
| P2 | #25 No runbook | 3h | Write `docs/RUNBOOK.md` with rollback, restore, escalation procedures |
| P3 | #13 No compression | 15min | Add `compression()` middleware to Express |
| P4 | #12 Rate limiting gaps | 1h | Add rate limits to signup (5/hr), password reset (3/hr), AI chat (50/hr) |
| P5 | #14 Error alerting gaps | 1h | Add `uncaughtException`/`unhandledRejection` handlers. Add Sentry alerts. |
| P6 | #18 Graceful shutdown | 1h | Implement request draining + interval cleanup in SIGTERM handler |
| P7 | #4 Sync email in routes | 3h | Make email sends fire-and-forget (non-blocking) in all route handlers |
| P8 | #15 Missing transactions | 4h | Wrap signup, cancellation, webhook flows in Supabase RPC transactions |

### WEEK 1 (Fix in First Week Post-Launch)

| Priority | Item | Effort | Action |
|----------|------|--------|--------|
| W1 | #2 In-memory session state | 4h | Persist WhatsApp conversations to Supabase `bot_conversations` table |
| W2 | #20 Console-only logging | 3h | Replace `console.log` with Pino structured logger; ship to log service |
| W3 | #21 No circuit breaker | 2h | Wrap OpenAI/WhatsApp/Paystack calls with `opossum` circuit breaker |
| W4 | #19 No third-party fallbacks | 3h | WhatsApp down → fallback to email. Document in `docs/RESILIENCE.md` |
| W5 | #10 Untested backup restore | 2h | Document Supabase backup policy + tested restore procedure |
| W6 | #16 Incomplete health check | 1h | Add OpenAI, WhatsApp, Paystack checks to `/api/health/deep` |
| W7 | #17 Memory leak risks | 1h | Add `clearInterval()` on shutdown; add memory metrics to admin dashboard |

### WEEK 2-4 (Harden in First Month)

| Priority | Item | Effort | Action |
|----------|------|--------|--------|
| M1 | #1 Load testing | 4h | Create k6 scripts for top 5 endpoints; document baselines |
| M2 | #5 No queue system | 8h | Add pg-boss or BullMQ for AI calls and email sends |
| M3 | #7 DB connection pooling | 2h | Upgrade Supabase plan; enable PgBouncer pooler |

### SCALE GATE (Fix at 10K MAU)

| Priority | Item | Effort | Action |
|----------|------|--------|--------|
| S1 | #7 Read replica | 4h | Add Supabase read replica for analytics queries |
| S2 | #22 Search performance | 8h | Migrate to PostgreSQL FTS with tsvector/GIN indexes |
| S3 | #5 Dedicated queue | 8h | Full BullMQ/Redis queue for all background work |

### NOT APPLICABLE / RESOLVED

| Item | Reason |
|------|--------|
| #3 File uploads to disk | All uploads go to Supabase Storage |
| #8 CDN for static assets | Vercel + Supabase Storage CDN |
| #9 DB migrations on boot | No auto-migrations; manual only |
| #11 Unindexed FKs | All critical FKs indexed |
| #23 Outbound HTTP timeouts | `fetchWithTimeout(15s)` used everywhere |
| #24 WebSockets | Uses Supabase Realtime only |

---

## RISK REGISTER — Issues NOT Fixed Pre-Launch

| Item | Probability | Impact | Mitigation if Triggered |
|------|-------------|--------|------------------------|
| #2 In-memory sessions | HIGH (every deploy) | MEDIUM — active WA conversations reset | Users restart conversation; B_ re-greets. Deploy during low-traffic hours. |
| #5 No queue system | MEDIUM (under load) | HIGH — slow AI responses, event loop pressure | OpenAI has 15s timeout; fallback messages exist for AI failures |
| #7 No connection pooling | MEDIUM (>50 concurrent) | HIGH — DB connection errors | Supabase free tier auto-rejects; upgrade to paid plan with pooler |
| #10 Untested backup restore | LOW (data loss event) | CRITICAL — unknown recovery time | Supabase manages backups; contact support for restore |
| #19 No third-party fallback | MEDIUM (API outage) | HIGH — features unavailable | WhatsApp: users fall back to web app. Paystack: retry UI exists. OpenAI: heuristic fallback. |
| #20 Console logging only | LOW (incident debugging) | MEDIUM — slow root cause analysis | Render retains recent stdout logs; Sentry captures errors |
| #21 No circuit breaker | MEDIUM (API degradation) | MEDIUM — cascading slowness | 15s timeout prevents full hang; manual restart if needed |

---

## VERIFICATION CHECKLIST — Before Opening to Real Users

- [ ] All secrets rotated and removed from git history
- [ ] `.env` files in `.gitignore`
- [ ] Compression middleware enabled (verify with `curl -H "Accept-Encoding: gzip"`)
- [ ] Rate limits on signup, password reset, AI chat (verify with rapid requests)
- [ ] Sentry captures uncaught exceptions (verify with intentional throw)
- [ ] Graceful shutdown drains requests (verify with `kill -SIGTERM` during load)
- [ ] Email sends are non-blocking (verify booking checkout completes <2s)
- [ ] Signup flow is atomic (verify: kill server mid-signup, check for orphaned records)
- [ ] Runbook exists and is accessible to all team members
- [ ] Security policy documented
- [ ] Load test baseline recorded (even one run of k6 against staging)
