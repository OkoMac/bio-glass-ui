-- ============================================================
-- BION Health Logs + Health Profile persistence
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
-- Backs Progress.tsx + HealthProfile.tsx user data
-- ============================================================

-- ── Per-user per-day metric snapshots (Progress page) ──────────
CREATE TABLE IF NOT EXISTS health_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric(5, 2),
  body_fat_pct numeric(4, 2),
  lean_mass_kg numeric(5, 2),
  resting_hr int,
  steps int,
  sleep_hours numeric(4, 2),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)  -- one entry per user per day; upsert overwrites
);

CREATE INDEX IF NOT EXISTS idx_health_logs_user_date ON health_logs(user_id, log_date DESC);
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own logs" ON health_logs;
CREATE POLICY "Users see own logs" ON health_logs
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert own logs" ON health_logs;
CREATE POLICY "Users insert own logs" ON health_logs
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own logs" ON health_logs;
CREATE POLICY "Users update own logs" ON health_logs
  FOR UPDATE USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users delete own logs" ON health_logs;
CREATE POLICY "Users delete own logs" ON health_logs
  FOR DELETE USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ── Health profile (one row per user, conditions/allergies/meds) ──
CREATE TABLE IF NOT EXISTS health_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  date_of_birth date,
  height_cm int,
  blood_type text CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown')),
  conditions jsonb DEFAULT '[]'::jsonb,            -- ["Asthma","Hypertension",...]
  allergies jsonb DEFAULT '[]'::jsonb,             -- ["Penicillin","Peanuts",...]
  medications jsonb DEFAULT '[]'::jsonb,           -- [{name,dose,frequency}]
  emergency_contact_name text,
  emergency_contact_phone text,
  insurance_provider text,
  insurance_member_id text,
  goals text,
  notes text,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_profiles_user ON health_profiles(user_id);
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own health profile" ON health_profiles;
CREATE POLICY "Users see own health profile" ON health_profiles
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users upsert own health profile" ON health_profiles;
CREATE POLICY "Users upsert own health profile" ON health_profiles
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Confirm
SELECT 'health_logs' AS table_name, COUNT(*) AS row_count FROM health_logs
UNION ALL
SELECT 'health_profiles', COUNT(*) FROM health_profiles;
