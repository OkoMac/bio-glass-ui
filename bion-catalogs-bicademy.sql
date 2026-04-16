-- ============================================================
-- BION Catalogs + Bicademy Schema
-- 1. Flippable product/service catalogs (for providers + BION marketing)
-- 2. Bicademy: courses, lessons, assessments, Ranger accreditation
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- PART 1: PRODUCT CATALOGS (FlippingBook-style)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS catalogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  owner_type text NOT NULL CHECK (owner_type IN ('provider', 'bion')),
  title text NOT NULL,
  description text,
  cover_image_url text,
  theme text DEFAULT 'indigo' CHECK (theme IN ('indigo', 'teal', 'coral', 'amber', 'monochrome')),
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'link_only', 'private')),
  short_url text UNIQUE,           -- e.g. "provider-fitness-2026"
  view_count int DEFAULT 0,
  share_count int DEFAULT 0,
  published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalogs_owner ON catalogs(owner_id, owner_type);
CREATE INDEX IF NOT EXISTS idx_catalogs_public ON catalogs(published, visibility) WHERE published = true;
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public sees published catalogs" ON catalogs;
CREATE POLICY "Public sees published catalogs" ON catalogs
  FOR SELECT USING (published = true AND visibility IN ('public', 'link_only'));

DROP POLICY IF EXISTS "Owners manage own catalogs" ON catalogs;
CREATE POLICY "Owners manage own catalogs" ON catalogs
  FOR ALL USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage BION catalogs" ON catalogs;
CREATE POLICY "Admins manage BION catalogs" ON catalogs
  FOR ALL USING (
    owner_type = 'bion'
    AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Individual catalog pages
CREATE TABLE IF NOT EXISTS catalog_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_id uuid NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  page_type text NOT NULL CHECK (page_type IN ('cover', 'content', 'product', 'feature', 'contact', 'cta')),
  layout text DEFAULT 'default' CHECK (layout IN ('default', 'two_column', 'full_image', 'gallery', 'text_only')),
  title text,
  subtitle text,
  body text,
  image_url text,
  gallery_images jsonb DEFAULT '[]'::jsonb,
  linked_product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  cta_text text,
  cta_link text,
  background_color text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(catalog_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_catalog_pages_catalog ON catalog_pages(catalog_id, page_number);
ALTER TABLE catalog_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "See pages of visible catalogs" ON catalog_pages;
CREATE POLICY "See pages of visible catalogs" ON catalog_pages
  FOR SELECT USING (
    catalog_id IN (SELECT id FROM catalogs WHERE published = true AND visibility IN ('public', 'link_only'))
    OR catalog_id IN (SELECT id FROM catalogs WHERE owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Owners manage own pages" ON catalog_pages;
CREATE POLICY "Owners manage own pages" ON catalog_pages
  FOR ALL USING (
    catalog_id IN (SELECT id FROM catalogs WHERE owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  );

-- ════════════════════════════════════════════════════════════
-- PART 2: BION BICADEMY (Rangers training)
-- ════════════════════════════════════════════════════════════

-- Course catalog
CREATE TABLE IF NOT EXISTS courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code text UNIQUE NOT NULL,                    -- e.g. 'RANGER-101'
  title text NOT NULL,
  description text,
  target_role text NOT NULL DEFAULT 'sales_rep' CHECK (target_role IN ('sales_rep', 'provider', 'admin', 'all')),
  difficulty text DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes int DEFAULT 30,
  order_index int DEFAULT 0,                           -- For display ordering
  passing_score int DEFAULT 80,                        -- % required to pass assessment
  required_for_accreditation boolean DEFAULT false,    -- If true, must complete to become Ranger
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_role ON courses(target_role, published);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated see published courses" ON courses;
CREATE POLICY "All authenticated see published courses" ON courses
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins manage courses" ON courses;
CREATE POLICY "Admins manage courses" ON courses
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Lessons (chapters within a course)
CREATE TABLE IF NOT EXISTS lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_number int NOT NULL,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'video', 'interactive', 'quiz', 'scenario')),
  content text,                            -- Markdown/HTML content
  video_url text,
  duration_minutes int DEFAULT 5,
  key_takeaways jsonb DEFAULT '[]'::jsonb, -- Array of bullet points
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, lesson_number)
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id, lesson_number);
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "See lessons of published courses" ON lessons;
CREATE POLICY "See lessons of published courses" ON lessons
  FOR SELECT USING (course_id IN (SELECT id FROM courses WHERE published = true));

DROP POLICY IF EXISTS "Admins manage lessons" ON lessons;
CREATE POLICY "Admins manage lessons" ON lessons
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Assessment questions
CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  question_number int NOT NULL,
  question_text text NOT NULL,
  question_type text DEFAULT 'single' CHECK (question_type IN ('single', 'multiple', 'true_false', 'scenario')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{ id, text, isCorrect }]
  explanation text,                              -- Shown after answer
  points int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_assessment_course ON assessment_questions(course_id, question_number);
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "See assessment of published courses" ON assessment_questions;
CREATE POLICY "See assessment of published courses" ON assessment_questions
  FOR SELECT USING (course_id IN (SELECT id FROM courses WHERE published = true));

DROP POLICY IF EXISTS "Admins manage assessments" ON assessment_questions;
CREATE POLICY "Admins manage assessments" ON assessment_questions
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Enrollments (user's progress per course)
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  last_lesson_id uuid REFERENCES lessons(id),
  lessons_completed jsonb DEFAULT '[]'::jsonb,    -- Array of lesson IDs
  assessment_score int,                           -- Percent correct (0-100)
  assessment_attempts int DEFAULT 0,
  assessment_passed boolean DEFAULT false,
  assessment_answers jsonb,                       -- Full answer history
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own enrollments" ON enrollments;
CREATE POLICY "Users see own enrollments" ON enrollments
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage own enrollments" ON enrollments;
CREATE POLICY "Users manage own enrollments" ON enrollments
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins see all enrollments" ON enrollments;
CREATE POLICY "Admins see all enrollments" ON enrollments
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Ranger accreditation records
CREATE TABLE IF NOT EXISTS ranger_accreditations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  accredited boolean DEFAULT false,
  accredited_at timestamptz,
  courses_completed int DEFAULT 0,
  average_score numeric(5, 2),
  certificate_code text UNIQUE,                    -- e.g. 'BION-RGR-ABC123'
  expires_at timestamptz,                          -- Annual re-accreditation
  support_tier int DEFAULT 1 CHECK (support_tier IN (1, 2)),  -- 1=basic, 2=second-tier
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ranger_accreditations_active ON ranger_accreditations(accredited) WHERE accredited = true;
ALTER TABLE ranger_accreditations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own accreditation" ON ranger_accreditations;
CREATE POLICY "Users see own accreditation" ON ranger_accreditations
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins see all accreditations" ON ranger_accreditations;
CREATE POLICY "Admins see all accreditations" ON ranger_accreditations
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ════════════════════════════════════════════════════════════
-- PART 3: Helper to check Ranger accreditation
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.check_and_award_ranger_status(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_required_count int;
  v_completed_count int;
  v_avg_score numeric;
BEGIN
  -- Count required courses
  SELECT COUNT(*) INTO v_required_count
  FROM courses WHERE target_role = 'sales_rep' AND required_for_accreditation = true AND published = true;

  -- Count passed by user
  SELECT COUNT(*), AVG(assessment_score) INTO v_completed_count, v_avg_score
  FROM enrollments e
  JOIN courses c ON c.id = e.course_id
  WHERE e.user_id = p_user_id
    AND e.assessment_passed = true
    AND c.required_for_accreditation = true;

  IF v_completed_count >= v_required_count AND v_required_count > 0 THEN
    INSERT INTO ranger_accreditations (user_id, accredited, accredited_at, courses_completed, average_score, certificate_code, expires_at, support_tier)
    VALUES (
      p_user_id, true, now(), v_completed_count, v_avg_score,
      'BION-RGR-' || UPPER(substring(p_user_id::text, 1, 6)),
      now() + interval '1 year',
      CASE WHEN v_avg_score >= 90 THEN 2 ELSE 1 END
    )
    ON CONFLICT (user_id) DO UPDATE SET
      accredited = true,
      accredited_at = COALESCE(ranger_accreditations.accredited_at, now()),
      courses_completed = v_completed_count,
      average_score = v_avg_score,
      expires_at = now() + interval '1 year',
      support_tier = CASE WHEN v_avg_score >= 90 THEN 2 ELSE 1 END;

    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_award_ranger_status TO authenticated;

-- ════════════════════════════════════════════════════════════
-- PART 4: Seed initial Ranger courses (BION academy starter content)
-- ════════════════════════════════════════════════════════════

INSERT INTO courses (course_code, title, description, target_role, order_index, passing_score, required_for_accreditation, estimated_minutes, published)
VALUES
  ('RANGER-101', 'BION Platform Overview', 'What BION does, who we serve, and the value we deliver to the South African wellness industry.', 'sales_rep', 1, 80, true, 20, true),
  ('RANGER-102', 'The 6 Revenue Streams', 'Booking fees, subscriptions, vouchers, tips, storefronts, and advertiser sponsorships — how BION makes money.', 'sales_rep', 2, 80, true, 25, true),
  ('RANGER-103', 'Selling to Providers', 'Pro (R499/mo) and Elite (R999/mo) plans. How to prospect, pitch, close.', 'sales_rep', 3, 85, true, 30, true),
  ('RANGER-104', 'Selling to Clients', 'Free + Premium (R29/mo). Referral commissions. Who qualifies for what.', 'sales_rep', 4, 80, true, 20, true),
  ('RANGER-105', 'Rewards & Loyalty', 'BioPoints (activity), Vouchers (cashback), Streak milestones (advertiser-funded).', 'sales_rep', 5, 75, true, 25, true),
  ('RANGER-106', 'Storefronts & Delivery', 'Product catalogs, courier rates, how providers sell physical goods.', 'sales_rep', 6, 80, true, 20, true),
  ('RANGER-107', 'Support Protocols', 'Tier 1 handled by B_, Tier 2 by Rangers, Tier 3 by BION admin. Escalation flow.', 'sales_rep', 7, 85, true, 30, true),
  ('RANGER-108', 'POPIA & Legal', 'Data handling, health info, dispute resolution, provider agreements.', 'sales_rep', 8, 80, true, 25, true),
  ('RANGER-109', 'Commission & Payouts', 'How you earn: 20% on client subs (referrer role), 20% on provider subs (rep role), 2% transaction fees.', 'sales_rep', 9, 85, true, 20, true),
  ('RANGER-110', 'Final Assessment', 'Comprehensive test across all modules. Pass 80% to receive Ranger accreditation.', 'sales_rep', 10, 80, true, 45, true)
ON CONFLICT (course_code) DO NOTHING;
