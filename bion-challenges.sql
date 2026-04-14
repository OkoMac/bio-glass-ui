-- ============================================================
-- BION Challenges — wellness challenges users can join + earn points
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
-- ============================================================

CREATE TABLE IF NOT EXISTS challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('fitness','mindfulness','nutrition','consistency','social')),
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  badge text DEFAULT '🏆',
  reward_text text NOT NULL,
  reward_points int NOT NULL DEFAULT 100,
  days_total int NOT NULL DEFAULT 7,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_by_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_label text NOT NULL DEFAULT 'BION',
  location text,
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,        -- [{ label: string }]
  published boolean DEFAULT true,
  participant_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenges_published ON challenges(published, ends_at) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public sees published challenges" ON challenges;
CREATE POLICY "Public sees published challenges" ON challenges
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins manage challenges" ON challenges;
CREATE POLICY "Admins manage challenges" ON challenges
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Providers create challenges" ON challenges;
CREATE POLICY "Providers create challenges" ON challenges
  FOR INSERT WITH CHECK (
    created_by_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Per-user participation
CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  task_progress jsonb DEFAULT '[]'::jsonb,         -- [boolean,boolean,...] aligned with challenge.tasks
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own participation" ON challenge_participants;
CREATE POLICY "Users see own participation" ON challenge_participants
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users join challenges" ON challenge_participants;
CREATE POLICY "Users join challenges" ON challenge_participants
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own participation" ON challenge_participants;
CREATE POLICY "Users update own participation" ON challenge_participants
  FOR UPDATE USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Auto-bump participant_count
CREATE OR REPLACE FUNCTION bump_challenge_participant_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE challenges SET participant_count = participant_count + 1 WHERE id = NEW.challenge_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE challenges SET participant_count = GREATEST(0, participant_count - 1) WHERE id = OLD.challenge_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS challenge_participant_counter ON challenge_participants;
CREATE TRIGGER challenge_participant_counter
  AFTER INSERT OR DELETE ON challenge_participants
  FOR EACH ROW EXECUTE FUNCTION bump_challenge_participant_count();

-- Seed 8 starter BION-owned challenges
INSERT INTO challenges (title, description, category, difficulty, badge, reward_text, reward_points, days_total, ends_at, tasks, created_by_label) VALUES
  ('7-Day Hydration Habit',
    'Log 8 glasses of water every day for a week. Build the habit that keeps every other one going.',
    'consistency', 'easy', '💧', '300 Activity Points + Hydration Hero badge', 300, 7,
    now() + interval '30 days',
    '[{"label":"Day 1 — 8 glasses logged"},{"label":"Day 2 — 8 glasses logged"},{"label":"Day 3 — 8 glasses logged"},{"label":"Day 4 — 8 glasses logged"},{"label":"Day 5 — 8 glasses logged"},{"label":"Day 6 — 8 glasses logged"},{"label":"Day 7 — 8 glasses logged"}]'::jsonb,
    'BION'),

  ('First 5km Run',
    'Train your way to your first 5km in 4 weeks. Couch-to-5k programme included.',
    'fitness', 'medium', '🏃', '500 Activity Points + 5K Finisher badge', 500, 28,
    now() + interval '60 days',
    '[{"label":"Week 1 — 3 walk/run sessions"},{"label":"Week 2 — 3 sessions, longer intervals"},{"label":"Week 3 — Run 3km without stopping"},{"label":"Week 4 — Complete the 5k"}]'::jsonb,
    'BION'),

  ('5-Minute Daily Meditation',
    '5 minutes a day for 21 days. Builds a meditation habit that stays.',
    'mindfulness', 'easy', '🧘', '350 Activity Points + Calm Mind badge', 350, 21,
    now() + interval '45 days',
    '[{"label":"Day 1-7 — 5 min daily"},{"label":"Day 8-14 — Maintain consistency"},{"label":"Day 15-21 — Notice the difference"}]'::jsonb,
    'BION'),

  ('Veggie Power Week',
    'Eat 5 servings of vegetables every day for 7 days. Photo-log each meal.',
    'nutrition', 'medium', '🥗', '400 Activity Points + Plant Power badge', 400, 7,
    now() + interval '30 days',
    '[{"label":"Day 1 — 5 servings logged"},{"label":"Day 2"},{"label":"Day 3"},{"label":"Day 4"},{"label":"Day 5"},{"label":"Day 6"},{"label":"Day 7"}]'::jsonb,
    'BION'),

  ('Sleep Reset',
    'Bed by 22:30, up by 06:30 for 14 consecutive nights. Track in the sleep tracker.',
    'consistency', 'medium', '😴', '450 Activity Points + Well-Rested badge', 450, 14,
    now() + interval '45 days',
    '[{"label":"Week 1 — 7 nights consistent"},{"label":"Week 2 — Maintain"}]'::jsonb,
    'BION'),

  ('30-Day Strength Builder',
    'Three strength sessions a week for 4 weeks. Workout templates in Routines.',
    'fitness', 'hard', '💪', '750 Activity Points + Stronger You badge', 750, 30,
    now() + interval '60 days',
    '[{"label":"Week 1 — 3 sessions complete"},{"label":"Week 2 — 3 sessions"},{"label":"Week 3 — 3 sessions"},{"label":"Week 4 — 3 sessions"}]'::jsonb,
    'BION'),

  ('Refer 3 Friends',
    'Bring 3 friends to BION. Earn the Connector badge + R5.80/month per active Premium referral.',
    'social', 'easy', '🤝', '500 Activity Points + Connector badge', 500, 30,
    now() + interval '90 days',
    '[{"label":"Friend 1 signed up"},{"label":"Friend 2 signed up"},{"label":"Friend 3 signed up"}]'::jsonb,
    'BION'),

  ('Mindful Eating Reset',
    'Photo-log every meal for 7 days. Reflect on portions, hunger cues, and energy.',
    'nutrition', 'easy', '🍽️', '300 Activity Points + Mindful Eater badge', 300, 7,
    now() + interval '30 days',
    '[{"label":"Day 1 — All meals logged"},{"label":"Day 2"},{"label":"Day 3"},{"label":"Day 4"},{"label":"Day 5"},{"label":"Day 6"},{"label":"Day 7 + reflection"}]'::jsonb,
    'BION')
ON CONFLICT DO NOTHING;

-- Confirm
SELECT category, COUNT(*) AS challenges, SUM(reward_points) AS total_points
FROM challenges WHERE published = true GROUP BY category ORDER BY category;
