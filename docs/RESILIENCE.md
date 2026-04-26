# BION Health — External Dependency Resilience
### Last updated: 26 April 2026

---

## Dependency Map

| Service | Used For | Criticality | Has Fallback? |
|---------|----------|-------------|---------------|
| Supabase (DB + Auth) | Everything | **P1 Critical** | No — platform outage |
| OpenAI (GPT-4o-mini) | B_ chat, food analysis, intent classification | P3 Medium | Yes — heuristic fallback |
| WhatsApp (Meta Cloud API) | Bot, reminders, outreach | P2 High | Partial — email fallback for notifications |
| Paystack | Payment processing | P2 High | No — bookings queue until restored |
| Vercel | Frontend hosting | P1 Critical | No — use Render static hosting as DR |
| Render | Backend hosting | P1 Critical | No — manual migration to Railway/Fly |
| Bayek SMTP | Email delivery | P3 Medium | Supabase SMTP as fallback |

---

## Fallback Strategies

### Supabase Down
- **Impact:** Complete platform outage — no auth, no data, no real-time
- **Detection:** `/api/health` returns `db_connected: false`
- **Mitigation:** Monitor Supabase status page. No automatic fallback possible.
- **Recovery:** Wait for Supabase to restore. Backend auto-reconnects.
- **Prevention:** Upgrade to Supabase Pro for higher uptime SLA

### OpenAI Down
- **Impact:** B_ chat degraded, food analysis unavailable, intent classification falls back to regex
- **Detection:** OpenAI calls timeout after 15s
- **Automatic fallback:**
  - Food analysis → heuristic estimation (returns `source: "heuristic"`)
  - Intent classification → regex-based templates in WhatsApp bot
  - Chat → static KB answers + "I'm having trouble thinking right now"
- **No user-facing error** — degraded but functional

### WhatsApp API Down
- **Impact:** Bot stops responding, reminders not sent, outreach fails
- **Detection:** `sendWhatsAppText()` returns `false`
- **Mitigation:** Notification v2 pipeline marks WhatsApp deliveries as "failed" → retry worker picks up later
- **Fallback:** Users can use the web app directly (all bot features available via web)
- **Recovery:** Meta usually resolves within 1-4 hours. Retry worker auto-sends queued messages.

### Paystack Down
- **Impact:** Cannot process payments or complete bookings
- **Detection:** `paystackRequest()` throws after 15s timeout
- **Mitigation:** Show user-friendly error: "Payment is temporarily unavailable. Please try again in a few minutes."
- **No automatic retry** — payment must be user-initiated
- **Recovery:** Paystack provides status at dashboard.paystack.com

### Email (SMTP) Down
- **Impact:** Confirmations, receipts, password resets delayed
- **Detection:** `sendChannelEmail()` returns `false`
- **Automatic fallback:** Password reset falls back to Supabase's built-in mailer
- **Mitigation:** Email sends are fire-and-forget (don't block API responses)
- **Recovery:** SMTP usually recovers quickly. Queued notifications retry via delivery worker.

### Vercel Down
- **Impact:** Frontend completely unavailable
- **Detection:** bionhealth.co.za returns 502/503
- **Mitigation:** Check Vercel status page. No automatic fallback.
- **Recovery:** Vercel incidents typically resolve in <1 hour

---

## Timeout Configuration

| External Call | Timeout | Library |
|--------------|---------|---------|
| OpenAI API | 15s | `fetchWithTimeout()` |
| WhatsApp Graph API | 15s | `fetchWithTimeout()` |
| Paystack API | 15s | Custom `AbortController` |
| Supabase (frontend) | 15s | Custom `fetch` wrapper |
| SMTP email | 30s | Nodemailer default |

---

## Circuit Breaker Status

**Not yet implemented.** Planned for Week 1 post-launch using `opossum` library.

When implemented:
- OpenAI: trip after 5 consecutive failures, 30s recovery window
- WhatsApp: trip after 5 consecutive failures, 60s recovery window
- Paystack: trip after 3 consecutive failures, 30s recovery window
- Fallback message shown to users during open circuit
