-- ============================================================
-- BION Corporate Wellness — schema + analytics support
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
-- ============================================================

-- ── Corporate accounts (one row per corporate org) ─────────────
CREATE TABLE IF NOT EXISTS corporate_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text,
  size_band text CHECK (size_band IN ('1-10','11-50','51-200','201-1000','1000+')),
  monthly_budget_per_employee numeric(10,2) DEFAULT 500,
  contact_email text,
  contact_phone text,
  rep_referral_code text,
  rep_profile_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Corporate sees own account" ON corporate_accounts;
CREATE POLICY "Corporate sees own account" ON corporate_accounts
  FOR ALL USING (user_id = auth.uid());

-- ── Employees linked to a corporate account ────────────────────
CREATE TABLE IF NOT EXISTS corporate_employees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  corporate_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- nullable until they sign up
  employee_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text NOT NULL,
  monthly_budget numeric(10,2) NOT NULL DEFAULT 500,
  spent numeric(10,2) NOT NULL DEFAULT 0,
  sessions_used int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','suspended','removed')),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(corporate_user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_corporate_employees_corp ON corporate_employees(corporate_user_id, status);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_profile ON corporate_employees(employee_profile_id);
ALTER TABLE corporate_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Corporate sees own employees" ON corporate_employees;
CREATE POLICY "Corporate sees own employees" ON corporate_employees
  FOR ALL USING (corporate_user_id = auth.uid());

DROP POLICY IF EXISTS "Employee sees self" ON corporate_employees;
CREATE POLICY "Employee sees self" ON corporate_employees
  FOR SELECT USING (employee_user_id = auth.uid());

-- ── Preferred providers per corporate ─────────────────────────
CREATE TABLE IF NOT EXISTS corporate_providers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  corporate_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(corporate_user_id, provider_id)
);
ALTER TABLE corporate_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Corporate manages own providers" ON corporate_providers;
CREATE POLICY "Corporate manages own providers" ON corporate_providers
  FOR ALL USING (corporate_user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- View: corporate_analytics — pulls real KPI numbers from bookings
--   joined to corporate_employees. Returns one row per corporate.
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW corporate_analytics
WITH (security_invoker = true) AS
WITH employees AS (
  SELECT
    ce.corporate_user_id,
    ce.employee_profile_id,
    ce.monthly_budget,
    ce.status
  FROM corporate_employees ce
  WHERE ce.status = 'active'
),
employee_bookings AS (
  SELECT
    e.corporate_user_id,
    b.id AS booking_id,
    b.provider_id,
    b.total_price,
    b.booking_date,
    b.status AS booking_status,
    s.title AS service_title,
    p.vertical AS provider_vertical
  FROM employees e
  JOIN bookings b ON b.client_id = e.employee_profile_id
  LEFT JOIN services s ON s.id = b.service_id
  LEFT JOIN profiles p ON p.id = b.provider_id
  WHERE b.status = 'completed'
)
SELECT
  ca.user_id AS corporate_user_id,
  ca.company_name,
  (SELECT COUNT(*) FROM corporate_employees WHERE corporate_user_id = ca.user_id AND status = 'active') AS total_employees,
  (SELECT COALESCE(SUM(monthly_budget), 0) FROM corporate_employees WHERE corporate_user_id = ca.user_id AND status = 'active') AS total_budget,
  (SELECT COUNT(*) FROM corporate_providers WHERE corporate_user_id = ca.user_id) AS active_providers,
  -- MTD spend
  (SELECT COALESCE(SUM(total_price), 0) FROM employee_bookings
    WHERE corporate_user_id = ca.user_id AND booking_date >= date_trunc('month', now())) AS mtd_spend,
  -- Last 30 days spend
  (SELECT COALESCE(SUM(total_price), 0) FROM employee_bookings
    WHERE corporate_user_id = ca.user_id AND booking_date >= now() - interval '30 days') AS spend_30d,
  -- Last 90 days spend
  (SELECT COALESCE(SUM(total_price), 0) FROM employee_bookings
    WHERE corporate_user_id = ca.user_id AND booking_date >= now() - interval '90 days') AS spend_90d,
  -- Bookings count this month
  (SELECT COUNT(*) FROM employee_bookings
    WHERE corporate_user_id = ca.user_id AND booking_date >= date_trunc('month', now())) AS sessions_mtd
FROM corporate_accounts ca;

GRANT SELECT ON corporate_analytics TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- Helper RPC: recent activity for a corporate
--   Returns last N completed bookings by employees as activity feed.
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION corporate_recent_activity(p_limit int DEFAULT 10)
RETURNS TABLE (
  booking_id uuid,
  employee_name text,
  provider_name text,
  service_title text,
  amount_rand numeric,
  booking_date date,
  vertical text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    ce.name,
    pp.full_name,
    s.title,
    b.total_price,
    b.booking_date,
    pp.vertical
  FROM corporate_employees ce
  JOIN bookings b ON b.client_id = ce.employee_profile_id
  LEFT JOIN profiles pp ON pp.id = b.provider_id
  LEFT JOIN services s ON s.id = b.service_id
  WHERE ce.corporate_user_id = auth.uid()
    AND ce.status = 'active'
    AND b.status = 'completed'
  ORDER BY b.booking_date DESC, b.created_at DESC
  LIMIT p_limit;
END;
$$;
GRANT EXECUTE ON FUNCTION corporate_recent_activity TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- Helper RPC: top providers used by a corporate's employees
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION corporate_top_providers(p_limit int DEFAULT 5)
RETURNS TABLE (
  provider_id uuid,
  provider_name text,
  specialty text,
  vertical text,
  sessions int,
  total_spend numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.id,
    pp.full_name,
    pp.specialty,
    pp.vertical,
    COUNT(*)::int AS sessions,
    COALESCE(SUM(b.total_price), 0) AS total_spend
  FROM corporate_employees ce
  JOIN bookings b ON b.client_id = ce.employee_profile_id
  JOIN profiles pp ON pp.id = b.provider_id
  WHERE ce.corporate_user_id = auth.uid()
    AND ce.status = 'active'
    AND b.status = 'completed'
    AND b.booking_date >= now() - interval '90 days'
  GROUP BY pp.id, pp.full_name, pp.specialty, pp.vertical
  ORDER BY total_spend DESC
  LIMIT p_limit;
END;
$$;
GRANT EXECUTE ON FUNCTION corporate_top_providers TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- Helper RPC: spend by category / vertical (last 30 days)
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION corporate_spend_by_vertical()
RETURNS TABLE (vertical text, spend numeric, sessions int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(pp.vertical, 'other') AS v,
    COALESCE(SUM(b.total_price), 0) AS s,
    COUNT(*)::int
  FROM corporate_employees ce
  JOIN bookings b ON b.client_id = ce.employee_profile_id
  LEFT JOIN profiles pp ON pp.id = b.provider_id
  WHERE ce.corporate_user_id = auth.uid()
    AND ce.status = 'active'
    AND b.status = 'completed'
    AND b.booking_date >= now() - interval '30 days'
  GROUP BY pp.vertical;
END;
$$;
GRANT EXECUTE ON FUNCTION corporate_spend_by_vertical TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- Helper RPC: spend bucketed by week for the chart (last 8 weeks)
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION corporate_spend_buckets()
RETURNS TABLE (week_start date, spend numeric, label text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH weeks AS (
    SELECT generate_series(
      date_trunc('week', now())::date - interval '7 weeks',
      date_trunc('week', now())::date,
      interval '1 week'
    )::date AS w
  )
  SELECT
    weeks.w,
    COALESCE(SUM(b.total_price), 0),
    'W' || EXTRACT(WEEK FROM weeks.w)::text
  FROM weeks
  LEFT JOIN corporate_employees ce ON ce.corporate_user_id = auth.uid() AND ce.status = 'active'
  LEFT JOIN bookings b ON b.client_id = ce.employee_profile_id
    AND b.status = 'completed'
    AND b.booking_date >= weeks.w
    AND b.booking_date < weeks.w + interval '1 week'
  GROUP BY weeks.w
  ORDER BY weeks.w;
END;
$$;
GRANT EXECUTE ON FUNCTION corporate_spend_buckets TO authenticated;
