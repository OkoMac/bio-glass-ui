# BION Health — Incident Response Runbook
### Last updated: 26 April 2026

---

## Severity Levels

| Level | Definition | Response Time | Example |
|-------|-----------|---------------|---------|
| **P1 - Critical** | Platform completely down or data breach | 15 min | Supabase outage, payment processing broken, security incident |
| **P2 - High** | Major feature broken for all users | 1 hour | Login failing, bookings not creating, WhatsApp bot down |
| **P3 - Medium** | Feature degraded for some users | 4 hours | Slow search, email not sending, push notifications broken |
| **P4 - Low** | Minor issue, workaround exists | 24 hours | UI glitch, wrong label, non-critical cron failing |

---

## First 5 Minutes Checklist

1. **Confirm the issue** — reproduce it or check error reports
2. **Check Sentry** — https://sentry.io (errors, stack traces, affected users)
3. **Check backend health** — `curl https://bion-backend.onrender.com/api/health`
4. **Check Render status** — https://status.render.com
5. **Check Supabase status** — https://status.supabase.com
6. **Notify the team** — message Oko on WhatsApp/Slack

---

## Common Scenarios

### Backend is down (502/503 errors)
1. Check Render dashboard: https://dashboard.render.com → bion-backend
2. Look at deploy logs — did the latest deploy fail?
3. **Rollback:** Render dashboard → Deploys → click previous successful deploy → "Rollback to this deploy"
4. If server crashes on startup, check `server.ts` imports and cron schedulers
5. Render auto-restarts on crash, but check memory usage (Starter plan = 512MB)

### Database connection errors
1. Check Supabase dashboard: https://supabase.com/dashboard/project/lybwhwsgduhjrwjsiqsh
2. Check connection count in Database → Reports → Connections
3. If hitting connection limit: restart the backend service on Render (frees all connections)
4. Long-term: upgrade Supabase plan for more connections + PgBouncer pooling

### Login/auth not working
1. Check if Supabase Auth is responding: `curl https://lybwhwsgduhjrwjsiqsh.supabase.co/auth/v1/health`
2. Check if the frontend `.env` has correct `VITE_SUPABASE_URL`
3. Check if the Supabase JWT hasn't expired (service role key is long-lived)
4. Common fix: user clears browser cache/cookies and tries again

### WhatsApp bot not responding
1. Check Meta API status: https://metastatus.com
2. Verify WHATSAPP_TOKEN on Render is valid (tokens can be revoked by Meta)
3. Check backend logs for `[whatsapp]` errors
4. Meta enforces 24h response window — user must message first

### Payment/Paystack errors
1. Check Paystack dashboard: https://dashboard.paystack.com
2. Check webhook delivery: Paystack → Settings → Webhooks → Recent deliveries
3. If webhook not reaching BION: check Render URL hasn't changed
4. For stuck payments: check `bookings` table for `payment_status = 'pending'`

### Email not sending
1. Check SMTP credentials on Render env vars
2. Test: `curl -X POST https://bion-backend.onrender.com/api/health` (basic check)
3. SMTP host: `bayek.aserv.co.za` port 465 (TLS)
4. If one channel fails, others may still work (9 independent SMTP accounts)

### Frontend not loading / white screen
1. Check Vercel dashboard for build status
2. Check browser console for JavaScript errors
3. Common cause: stale service worker — user should clear cache
4. Rollback: Vercel dashboard → Deployments → redeploy previous

---

## How to Rollback a Deploy

### Backend (Render)
1. Go to https://dashboard.render.com
2. Select bion-backend service
3. Click "Deploys" tab
4. Find the last working deploy (green checkmark)
5. Click it → "Rollback to this deploy"
6. Monitor health: `curl https://bion-backend.onrender.com/api/health`

### Frontend (Vercel)
1. Go to https://vercel.com/dashboard
2. Select bio-glass-ui project
3. Click "Deployments"
4. Find the last working deployment → three dots → "Promote to production"

---

## How to Scale Up

### Backend
- Render Starter plan: 1 instance, 512MB RAM
- To upgrade: Render dashboard → Settings → Instance Type → Standard ($25/mo, 2GB RAM)
- For multiple instances: upgrade to Team plan with auto-scaling

### Database
- Supabase free: 500MB storage, 2 cores, 1GB RAM
- Upgrade to Pro ($25/mo): 8GB storage, 2 cores, 4GB RAM, PgBouncer, daily backups
- Upgrade in: Supabase dashboard → Settings → Billing

---

## Contacts

| System | Support |
|--------|---------|
| Supabase | support@supabase.com or dashboard chat |
| Render | support@render.com or dashboard |
| Paystack | support@paystack.com |
| Meta (WhatsApp) | business.facebook.com → Support |
| BION Founder | Oko Macanda — omacanda@gmail.com |

---

## Database Backup & Restore

### Supabase Backups
- **Free plan:** No automated backups (manual export only)
- **Pro plan ($25/mo):** Daily automated backups, 7-day retention
- **To export manually:** Supabase dashboard → Settings → Database → Download backup

### Manual Data Export
```bash
# Via the BION API (requires auth)
curl -H "Authorization: Bearer <USER_TOKEN>" \
  https://bion-backend.onrender.com/api/account/export-data
```

### Restore from Backup
1. Contact Supabase support with project ID: `lybwhwsgduhjrwjsiqsh`
2. Specify the target restore point
3. Supabase will restore to a new project (non-destructive)
4. Update Render env vars to point at the restored project
5. Test all critical paths: login, booking, payment, WhatsApp

---

## Monitoring Endpoints

| Endpoint | What it Checks | Expected |
|----------|---------------|----------|
| `GET /api/health` | Backend + Supabase | `{ ok: true }` |
| `GET /api/admin/notification-stats` | Notification pipeline | `{ ok: true, stats: {...} }` |
| `GET /api/admin/notification-failures` | Delivery failures | `{ ok: true, failures: [] }` |
