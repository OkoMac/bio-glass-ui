-- ═══════════════════════════════════════════════════════════════════
-- BION Data Persistence Migration
-- Adds tables for: routines, food tracker, calendar events,
-- provider documents, health metrics
-- ═══════════════════════════════════════════════════════════════════

-- ── Routines ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routines (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('workout','rehab','meal','skincare','medication','wellness','beauty','custom')),
  vertical      TEXT NOT NULL DEFAULT 'teal',
  days_completed INT NOT NULL DEFAULT 0,
  total_days    INT NOT NULL DEFAULT 28,
  exercises     JSONB NOT NULL DEFAULT '[]',
  created_by    TEXT NOT NULL DEFAULT 'self' CHECK (created_by IN ('self','provider')),
  provider_id   UUID REFERENCES profiles(id),
  provider_name TEXT,
  shared_with   TEXT[] DEFAULT '{}',
  schedule      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_routines_user ON routines(user_id);
CREATE INDEX idx_routines_provider ON routines(provider_id);

-- ── Routine Progress (daily check-ins) ─────────────────────────
CREATE TABLE IF NOT EXISTS routine_progress (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id  UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  exercises_done JSONB NOT NULL DEFAULT '{}',  -- {"exercise_index": true}
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(routine_id, user_id, date)
);

-- ── Food Tracker ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_entries (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  calories  INT NOT NULL DEFAULT 0,
  protein   INT DEFAULT 0,
  carbs     INT DEFAULT 0,
  fat       INT DEFAULT 0,
  meal      TEXT NOT NULL CHECK (meal IN ('breakfast','lunch','dinner','snack')),
  time      TEXT,
  photo_url TEXT,
  date      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_food_user_date ON food_entries(user_id, date);

-- ── Daily Goals (nutrition) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_goals (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  calories  INT NOT NULL DEFAULT 2000,
  protein   INT NOT NULL DEFAULT 120,
  carbs     INT NOT NULL DEFAULT 250,
  fat       INT NOT NULL DEFAULT 65,
  water     INT NOT NULL DEFAULT 8,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Water Tracking ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_log (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  count    INT NOT NULL DEFAULT 0,
  date     DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, date)
);

-- ── Calendar Events ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('fitness','medical','beauty','nutrition','medication','wellness','appointment','goal')),
  date        DATE NOT NULL,
  time        TEXT,
  duration    TEXT,
  provider    TEXT,
  location    TEXT,
  notes       TEXT,
  completed   BOOLEAN NOT NULL DEFAULT false,
  recurring   TEXT CHECK (recurring IN ('daily','weekly','monthly')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_calendar_user_date ON calendar_events(user_id, date);

-- ── Health Metrics (daily logs) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS health_metrics (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date      DATE NOT NULL DEFAULT CURRENT_DATE,
  weight    NUMERIC(5,1),
  body_fat  NUMERIC(4,1),
  lean_mass NUMERIC(5,1),
  resting_hr INT,
  steps     INT,
  sleep_hours NUMERIC(3,1),
  stress_score NUMERIC(3,1),
  spo2      INT,
  notes     TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ── Provider Documents (KYC) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS provider_documents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type    TEXT NOT NULL CHECK (doc_type IN ('sa_id','professional_reg','qualifications','insurance','business_reg','proof_address')),
  file_name   TEXT NOT NULL,
  file_url    TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  notes       TEXT
);

CREATE INDEX idx_provider_docs ON provider_documents(provider_id);

-- ── Sleep Tracking ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sleep_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  bed_time    TEXT,
  wake_time   TEXT,
  hours       NUMERIC(3,1),
  quality     INT CHECK (quality BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ── Dismissed Reminders ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dismissed_reminders (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_id TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, reminder_id, date)
);

-- ═══════════════════════════════════════════════════════════════════
-- RLS Policies — users can only see their own data
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE dismissed_reminders ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own data
CREATE POLICY "Users manage own routines" ON routines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own routine_progress" ON routine_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own food_entries" ON food_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own daily_goals" ON daily_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own water_log" ON water_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own calendar_events" ON calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own health_metrics" ON health_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own sleep_log" ON sleep_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own dismissed_reminders" ON dismissed_reminders FOR ALL USING (auth.uid() = user_id);

-- Provider documents: provider sees own, admin sees all
CREATE POLICY "Providers manage own documents" ON provider_documents FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "Admin reads all documents" ON provider_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Providers can see routines they assigned (shared_with contains their ID)
CREATE POLICY "Providers see assigned routines" ON routines FOR SELECT USING (
  auth.uid()::text = ANY(shared_with) OR auth.uid() = provider_id
);

-- Providers can see routine progress for routines they assigned
CREATE POLICY "Providers see assigned progress" ON routine_progress FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM routines
    WHERE routines.id = routine_progress.routine_id
    AND (auth.uid()::text = ANY(routines.shared_with) OR auth.uid() = routines.provider_id)
  )
);
