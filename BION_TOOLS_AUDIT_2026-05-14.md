# BION Tools & Utilities — Full Audit (2026-05-14)

Read-only audit. No code changes.

---

## 1. Inventory (8 tools, all client-only)

| # | Tool | Route | Component | Status |
|---|---|---|---|---|
| 1 | BMI Calculator | `/tools/bmi-calculator` | `tools/BmiCalculator.tsx` | ✅ Works |
| 2 | Calorie & Meal Tracker | `/food-tracker` | `FoodTracker.tsx` + `useFoodSync` | ⚠️ Partial |
| 3 | Water Intake Tracker | `/water-tracker` | `WaterTracker.tsx` | ⚠️ Partial |
| 4 | Sleep Quality Tracker | `/sleep-tracker` | `SleepTracker.tsx` | ✅ Works |
| 5 | Digital Medical Card | `/medical-card` | `MedicalCard.tsx` | 🟥 GET 404 |
| 6 | Health Insights | `/health-insights` | `HealthInsights.tsx` | ✅ Derived only |
| 7 | AI Wellness Coach | `/life-coach` | `LifeCoach.tsx` | ✅ Works |
| 8 | Health Profile (Metrics/Goals/Medical/Privacy) | `/health-profile` | `HealthProfile.tsx` | ✅ Works |

Old `/tools/calorie-calculator` → 301 redirect to `/food-tracker`. ✓

---

## 2. Per-tool diagnosis

### 2.1 BMI Calculator — ✅ clean
- `calculate()`: `bmi = w/(h/100)²`, classify → state + localStorage `bion_bmi_result`
- Signed-in: POST `/api/health-profile/bmi` → bmi_log table; refresh GET `/api/health-profile/bmi/history`
- Mirrors weight into health_logs via `logToday`
- Errors: silent `console.warn` — user gets BMI but no signal that history sync failed

### 2.2 Food Tracker — ⚠️ partial
- `useFoodSync` hook: entries[], goals, monthly/yearly rollups
- Add meal → optimistic state + localStorage (`bion_food_tracker`) + `food_entries.insert`
- Goals → `daily_goals.upsert` (onConflict: user_id)
- Photo → `POST /api/ai/estimate-calories`
- **Inline water +/− on this page writes localStorage ONLY** — not water_log. 🟥
- Until commit `7e1274e` (today) all writes were silently swallowed — fixed.
- `safeSetEntries` quota-trims silently — no user feedback.

### 2.3 Water Tracker — ⚠️ partial
- Two localStorage keys: `bion_water_tracker` (full bucket) + `bion_water_${date}` (flat mirror)
- Supabase: `water_log.upsert({user_id, date, count})` onConflict `user_id,date`
- 7-day chart pulls from water_log if signed-in; falls back to localStorage
- Server-wins-on-collision for today's count
- Visibility refetch on tab return ✓
- 🟥 Streak (`bion_water_streak`) localStorage-only — wipes on clear data
- 🟥 The `bion_water_${date}` key is touched by 9 files (see §3)

### 2.4 Sleep Tracker — ✅ cleanest of the trackers
- Form: bedtime, wake time, quality 1–5
- localStorage `bion_sleep_log` + `health_logs.upsert` with `onConflict: user_id,log_date`
- Errors are loud already

### 2.5 Health Profile — ✅ mostly works
- Metrics tab: `useHealthLogs(30)` → reads last 30d; "Log today" → `logToday(patch)` upserts to health_logs
- Goals tab: `health_profiles.upsert` (height, blood type, weight target)
- Medical tab: conditions/allergies/medications → localStorage + debounced `health_profiles` sync
- Until commit `a9c799e` (today) `logToday` swallowed Postgrest errors — fixed
- ⚠️ Steps integration: comment claims Apple HealthKit auto-sync; no fallback for non-iOS

### 2.6 Medical Card — 🟥 GET handler returns 404
- Frontend: GET `/api/profiles/medical-aid` on mount, PATCH on save, POST `/extract-from-photo`
- Backend file `src/routes/medical-aid.ts` exists, mounted at `server.ts:389`
- **Live probes:**
  - GET → **404** 🟥
  - POST → 404
  - PATCH → 401 (exists, auth-gated) ✓
  - DELETE → 401 ✓
- Comment says `GET /api/profiles/medical-aid` at line 44 but the actual `router.get("/", ...)` call is likely missing or misnamed
- **Effect:** /medical-card never sees saved card on load

### 2.7 Health Insights — ✅ pure derived
- `useHealthLogs(30)` + `useHealthLogs(7)`, no writes
- Depends on health_logs being populated. Water and food data are in separate tables (water_log, food_entries), so Insights can't see them — sleep/weight/HR/steps only

### 2.8 Life Coach — ✅ works
- `POST /api/chat` SSE stream, same endpoint as BionAssistant
- Errors surface in chat UI

---

## 3. Cross-tool dependency map

`bion_water_${date}` localStorage key — **9 files touch it**:

| File | Read | Write |
|---|---|---|
| WaterTracker.tsx | ✓ | ✓ + supabase mirror |
| FoodTracker.tsx | ✓ | ✓ localStorage only 🟥 |
| BionTips.tsx | ✓ | |
| BionAssistant.tsx | ✓ | |
| BiometricsDashboard.tsx | ✓ | |
| MedicalCard.tsx | ✓ | |
| Index.tsx | ✓ | |
| useTodaySummary.ts | ✓ | |
| reminders.ts | ✓ | |

**Failure modes:**

- **A** — Phone PWA `+` → water_log → laptop opens `/water-tracker`, sees server value ✓. Laptop opens `/food-tracker`, inline counter reads empty localStorage → shows 0. ❌
- **B** — `+` on FoodTracker writes localStorage only. Server never updated. ❌
- **C** — Offline glasses pile up in localStorage. Online again → mirror upserts to server iff `local > server`. Otherwise server wins. ✅

---

## 4. Backend/table check (live probes)

Tables (all HTTP 200 ✓): water_log, food_entries, food_entries_monthly, food_entries_yearly, daily_goals, health_logs, health_profiles, bmi_log.

Endpoints:
| Endpoint | Method | HTTP | Verdict |
|---|---|---|---|
| /api/health-profile/bmi | POST | 401 | ✓ |
| /api/health-profile/bmi/history | GET | 401 | ✓ |
| /api/ai/estimate-calories | POST | 400 | ✓ |
| /api/chat | POST | 400 | ✓ |
| **/api/profiles/medical-aid** | **GET** | **404** | 🟥 |
| /api/profiles/medical-aid | PATCH | 401 | ✓ |
| /api/profiles/medical-aid | DELETE | 401 | ✓ |

Render deploy `5cf2886e` is live (finished 2026-05-13 17:24).

---

## 5. Common fragility patterns

1. **localStorage-first with optional Supabase sync.** Silent device divergence. (Toast fixes shipped today for water+food.)
2. **`supabase.from("table" as any)`** — types.ts is incomplete; schema drift surfaces as runtime 400s, not compile errors.
3. **`onConflict` upserts assume unique constraints exist.** If migration was dropped/never ran → silent duplicate inserts. Worth a separate `pg_constraint` audit.
4. **No "loading" vs "empty" distinction.** Silent SELECT 400s render forever as empty state (this was the profiles.specialty cascade earlier).
5. **Today-summary dashboard tile mixes sources** — water/steps from localStorage, sleep/weight from Supabase. Two truths on one tile.

---

## 6. Fix list (priority order)

| Pri | Fix | Effort | Risk |
|---|---|---|---|
| 🟥 P0 | Add `router.get("/", requireAuth, ...)` to `backend/src/routes/medical-aid.ts` so `/medical-card` can read saved cards | 5 min | low |
| 🟥 P0 | Wire FoodTracker inline water +/− to `water_log.upsert` instead of localStorage-only — share WaterTracker's `saveData` or call into a `useWaterCounter` hook | 15 min | low |
| 🟧 P1 | Migrate `bion-water-food-logs-2026-05-14.sql` (already drafted) — add `water_ml`/`food_calories_kcal` to health_logs so HealthInsights sees unified data | 1 min SQL + 30 min wiring | low |
| 🟧 P1 | Move all streaks (`bion_water_streak`, food, sleep) to a `user_streaks` Supabase table | 1 hr | low |
| 🟨 P2 | Regenerate `types.ts` to kill the `as any` casts; let compile catch schema drift | 30 min | medium (touches every query) |
| 🟨 P2 | Surface BMI history-save failures as toasts (currently silent `console.warn`) | 5 min | low |
| 🟨 P2 | Audit `pg_constraint` to confirm every `onConflict` upsert has its matching unique constraint | 20 min | low |
| 🟨 P3 | Add a `<HealthLoadingState>` vs `<EmptyState>` distinction so silent 400s don't look identical to "new user" | 1 hr | low |
| 🟨 P3 | HealthProfile: surface "no HealthKit available" instead of silent step gap | 30 min | low |

---

## 7. What today's commits already fixed

- `8fd72cb` — Settings Save writes to DB (no longer localStorage-only)
- `659ea35` — Location field on signup
- `a9c799e` — Checklist refetch on focus + loud health_logs errors
- `7e1274e` — water/food write failures now toast
- `2d2d814` — admin double /_proxy/ fixed
- `0a3e575` — updateProfileFields throws instead of silent rollback
- `364c292` — Checklist provider profiles select fix (the cascade root)

These ship the toast plumbing for trackers. They do NOT fix the GET 404 on medical-aid or the localStorage-only inline water counter — those are still open.

---

## 8. TL;DR

**Two real bugs:**
1. 🟥 Medical Card never loads saved cards (GET handler missing from medical-aid.ts router)
2. 🟥 Inline water counter on Food Tracker doesn't sync to backend (localStorage only)

**One architectural issue:**
- Water/food/streaks are split across separate tables + localStorage with 9 read sites — keeping them in sync is fragile by design. The `bion-water-food-logs` migration drafted in repo root is the right consolidation.

**Everything else is either:** working, already fixed in today's deploy, or a P2 hardening item.
