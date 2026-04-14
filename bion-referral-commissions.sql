-- ============================================================
-- BION Referral Commission Reconciliation
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
--
-- For every active Premium subscription (R29/mo), the referrer earns
-- 20% (R5.80/mo) into commission_earnings, while sub is active.
--
-- Runs via:
--   1. accrue_referral_commissions_for_month(YYYY-MM)  — manual call
--   2. Optional: pg_cron job to fire on the 1st of each month
-- ============================================================

-- Add active_premium_subs columns to track which clients pay Premium
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS premium_started_at timestamptz;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS premium_ended_at   timestamptz;

-- Settings — keep configurable in case rate ever changes
INSERT INTO platform_settings (key, value, description) VALUES
  ('client_premium_price', '29',     'Monthly price of client Premium subscription (R)'),
  ('referral_commission_pct', '0.20','Referrer commission as fraction of Premium sub')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- ═══════════════════════════════════════════════════════════════
-- Reconciliation function
-- For a given YYYY-MM, look at every active Premium referral and ensure
-- a commission_earnings row exists for that month.
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION accrue_referral_commissions_for_month(p_month text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_premium_price numeric;
  v_commission_pct numeric;
  v_commission_amt numeric;
  v_inserted int := 0;
  v_existing int := 0;
  v_month_start timestamptz;
  v_month_end timestamptz;
  r record;
BEGIN
  -- Validate month format
  IF NOT p_month ~ '^\d{4}-\d{2}$' THEN
    RAISE EXCEPTION 'Month must be YYYY-MM, got: %', p_month;
  END IF;

  v_month_start := (p_month || '-01')::timestamptz;
  v_month_end   := (v_month_start + interval '1 month');

  SELECT value::numeric INTO v_premium_price  FROM platform_settings WHERE key = 'client_premium_price';
  SELECT value::numeric INTO v_commission_pct FROM platform_settings WHERE key = 'referral_commission_pct';
  v_premium_price  := COALESCE(v_premium_price, 29);
  v_commission_pct := COALESCE(v_commission_pct, 0.20);
  v_commission_amt := ROUND(v_premium_price * v_commission_pct, 2);

  -- For each referral that was Premium-active during this month, ensure a row exists
  FOR r IN
    SELECT id AS referral_id, referrer_id
    FROM referrals
    WHERE subscription_active = true
      -- Premium started before month end
      AND (premium_started_at IS NULL OR premium_started_at < v_month_end)
      -- Premium not ended before month start
      AND (premium_ended_at IS NULL OR premium_ended_at > v_month_start)
  LOOP
    BEGIN
      INSERT INTO commission_earnings (user_id, referral_id, amount_rand, month, status)
      VALUES (r.referrer_id, r.referral_id, v_commission_amt, p_month, 'pending');
      v_inserted := v_inserted + 1;

      -- Mirror to earnings_transactions ledger so it shows in user's Earnings tab
      INSERT INTO earnings_transactions (user_id, amount_rand, type, reference_id, source_user_id, description)
      VALUES (
        r.referrer_id, v_commission_amt, 'referral_commission', r.referral_id,
        (SELECT referred_id FROM referrals WHERE id = r.referral_id),
        format('Premium referral commission · %s', p_month)
      );
    EXCEPTION
      WHEN unique_violation THEN
        v_existing := v_existing + 1;  -- already accrued for this month
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'month', p_month,
    'commission_per_referral', v_commission_amt,
    'inserted', v_inserted,
    'already_existed', v_existing,
    'total_active_referrals', v_inserted + v_existing
  );
END;
$$;

GRANT EXECUTE ON FUNCTION accrue_referral_commissions_for_month TO authenticated;

-- Convenience wrapper: accrue for the current month
CREATE OR REPLACE FUNCTION accrue_referral_commissions_current_month()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN accrue_referral_commissions_for_month(to_char(now(), 'YYYY-MM'));
END;
$$;

GRANT EXECUTE ON FUNCTION accrue_referral_commissions_current_month TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Optional: schedule via pg_cron if extension installed.
-- Runs at 02:00 UTC on the 1st of each month.
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  -- Only schedule if pg_cron is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing job if present
    PERFORM cron.unschedule('bion_monthly_referral_commissions')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'bion_monthly_referral_commissions'
    );
    -- Schedule fresh: 02:00 UTC on the 1st
    PERFORM cron.schedule(
      'bion_monthly_referral_commissions',
      '0 2 1 * *',
      $cron$ SELECT public.accrue_referral_commissions_current_month(); $cron$
    );
    RAISE NOTICE 'Scheduled bion_monthly_referral_commissions via pg_cron';
  ELSE
    RAISE NOTICE 'pg_cron not installed — call accrue_referral_commissions_current_month() manually each month, or invoke from your backend cron';
  END IF;
END;
$$;

-- Manual run for the current month (safe — idempotent per referral+month)
SELECT accrue_referral_commissions_current_month();
