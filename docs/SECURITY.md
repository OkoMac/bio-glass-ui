# BION Health — Security Policy
### Last updated: 26 April 2026

---

## Secret Management

### Rules
1. **Never commit secrets to git** — `.env` files are in `.gitignore` for both repos
2. **All secrets live in Render environment variables** — not in code, not in docs, not in scripts
3. **No fallback values for secrets in code** — if a secret is missing, the feature should fail gracefully, not use a default
4. **Rotate credentials quarterly** — SMTP passwords, API tokens, service keys

### Where Secrets Are Stored

| Secret | Location | Rotation |
|--------|----------|----------|
| Supabase URL + keys | Render `.env` secret file | On compromise only |
| OpenAI API key | Render env var | Monthly (usage-based billing) |
| Paystack keys | Render env var | On compromise only |
| WhatsApp token | Render env var (permanent system user token) | On Meta revocation |
| SMTP passwords (8 channels) | Render env vars | Quarterly |
| Render API key | Local machine only (not committed) | On compromise |
| ADMIN_SETUP_TOKEN | Render env var (auto-generated) | Never changes |

### Pre-Commit Checks
- `.env` in `.gitignore` for both repos
- No real API keys in code (Stripe fallback uses empty string, not placeholder key)
- Frontend only exposes anon/public keys (safe by design)

---

## Authentication & Authorization

### Supabase Auth
- Email/password with Supabase `signInWithPassword()`
- Google OAuth with Supabase `signInWithOAuth()`
- JWT tokens auto-refreshed, stored in localStorage
- Session timeout: Supabase default (1 hour refresh window)

### Row Level Security (RLS)
- All Supabase tables have RLS enabled
- Service role key (backend only) bypasses RLS for admin operations
- Anon key (frontend) respects RLS policies

### Role-Based Access
- 5 roles: client, provider, admin, corporate, sales_rep
- Multi-role per user (stored in `user_roles` table)
- Role priority: admin > provider > corporate > sales_rep > client
- Auth guard (`RequireAuth`) checks role on every protected route

---

## Data Privacy (POPIA Compliant)

### WhatsApp
- B_ NEVER shares personal data over WhatsApp (blood type, allergies, bookings, wallet)
- Only aggregate counts allowed ("you have 3 bookings")
- All personal data requires login at bionhealth.co.za

### Data Export
- `GET /api/account/export-data` — full POPIA Section 23 export
- Includes all user data across all tables
- OTP codes redacted, passwords never stored

### Cookie Consent
- POPIA-compliant cookie banner on first visit
- Marketing tracking only loads after explicit consent
- AdSense deferred behind consent gate

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global (all routes) | 100 req | 1 min per IP |
| Auth (KYC, login) | 10 req | 1 min per IP |
| Bookings | 20 req | 1 min per IP |
| Search/providers | 30 req | 1 min per IP |
| Signup | 5 req | 1 hour per IP |
| Password reset | 3 req | 1 hour per IP |
| AI chat/photo | 50 req | 1 hour per IP |
| WhatsApp webhook | Exempt | Meta requirement |

---

## Error Monitoring

- **Sentry** configured on backend (`instrument.ts`)
- 10% trace sampling in production
- PII stripping enabled (auth headers removed)
- `uncaughtException` and `unhandledRejection` handlers capture + flush to Sentry
- Graceful shutdown drains active requests before exit
