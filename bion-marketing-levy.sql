-- ============================================================
-- BION: Marketing Levy + Rewards Recalibration
-- Run in Supabase SQL Editor (idempotent — safe to re-run)
--
-- CHANGES:
--   1. Spending rewards rate: 2.5% → 0.25% (R50 voucher per R20,000)
--   2. Provider marketing levy: 5% on every platform-processed booking
--   3. Acquisition voucher pool per provider (big vouchers, not many small)
--   4. "Never visited + nearby" eligibility RPC for discovery feed
--   5. Auto-mint vouchers when levy accumulates past face-value threshold
--
-- CANONICAL FEE MODEL — every rate is a % of the BILL, never compounded:
--
--   REGULAR BOOKING (R100 bill):
--     Client pays R105 (+5% client fee)
--     Provider receives R95 (-5% provider fee)
--     Minus R5 marketing levy (5% of bill) → held in provider voucher pool
--     Provider NET = R90 (exactly 90% of bill)
--     BION gross = R10 (5% client + 5% provider = 10% of bill)
--
--   VOUCHER REDEMPTION (R500 acquisition voucher used on R500 service):
--     Client pays R0 (voucher covers)
--     Provider voucher pool debited R500
--     BION charges 5% transaction fee on redemption = R25
--     Provider receives R475 cash (95% of voucher face value)
--     No Paystack (internal ledger move)
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. Recalibrate spending rewards (2.5% → 0.25%)
--    R50 voucher per R20,000 spent (same threshold, smaller voucher)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION credit_vouchers_for_spend()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_spent numeric;
  v_total_earned numeric;
  v_new_voucher_amount numeric;
  v_is_premium boolean;
BEGIN
  -- Gate on Premium (subscription wiring pending — allow all for now)
  v_is_premium := EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id);
  IF NOT v_is_premium THEN RETURN NEW; END IF;

  -- R300/month qualifier still applies
  IF NEW.total_spent_rand < 300 THEN RETURN NEW; END IF;

  -- Cumulative qualifying spend
  SELECT COALESCE(SUM(total_spent_rand), 0) INTO v_total_spent
  FROM monthly_spend
  WHERE user_id = NEW.user_id AND total_spent_rand >= 300;

  -- Cashback already issued
  SELECT COALESCE(SUM(amount_rand), 0) INTO v_total_earned
  FROM voucher_wallet
  WHERE user_id = NEW.user_id AND source = 'cashback';

  -- NEW RATE: 0.25% — R50 voucher per R20,000 spent
  v_new_voucher_amount := FLOOR(v_total_spent / 20000) * 50 - v_total_earned;

  IF v_new_voucher_amount >= 50 THEN
    INSERT INTO voucher_wallet (user_id, amount_rand, source)
    VALUES (NEW.user_id, v_new_voucher_amount, 'cashback');

    UPDATE monthly_spend
    SET vouchers_earned_rand = vouchers_earned_rand + v_new_voucher_amount
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 2. Add location fields to profiles (for "close to provider" check)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suburb text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lat numeric(9, 6);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lng numeric(9, 6);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_radius_km int DEFAULT 25;

CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(city, suburb) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_latlng ON profiles(lat, lng) WHERE lat IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- 3. Haversine distance helper (km)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION haversine_km(
  lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
) RETURNS numeric
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  r numeric := 6371; -- Earth radius in km
  dlat numeric;
  dlng numeric;
  a numeric;
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2)^2;
  RETURN r * 2 * atan2(sqrt(a), sqrt(1-a));
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 4. Provider marketing levy ledger
--    Every completed booking contributes 5% of provider's gross
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS provider_marketing_levy (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  source_amount_rand numeric(10, 2) NOT NULL,     -- Provider's gross R95 on R100 bill
  levy_rand numeric(10, 2) NOT NULL,              -- 5% of source (R4.75)
  levy_type text NOT NULL DEFAULT 'mandatory' CHECK (levy_type IN ('mandatory','voluntary_boost')),
  minted_voucher_id uuid,                         -- set when this contribution rolls up into a voucher
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_levy_provider ON provider_marketing_levy(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_levy_unminted ON provider_marketing_levy(provider_id) WHERE minted_voucher_id IS NULL;
ALTER TABLE provider_marketing_levy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers see own levy" ON provider_marketing_levy;
CREATE POLICY "Providers see own levy" ON provider_marketing_levy
  FOR SELECT USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins see all levy" ON provider_marketing_levy;
CREATE POLICY "Admins see all levy" ON provider_marketing_levy
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- 5. Acquisition vouchers (redeemable only at the minting provider)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS acquisition_vouchers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  face_value_rand numeric(10, 2) NOT NULL,         -- R500 default (fewer, bigger)
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','claimed','redeemed','expired','forfeited')),
  claimed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  redeemed_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  max_distance_km int NOT NULL DEFAULT 25,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acq_available ON acquisition_vouchers(provider_id, status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_acq_claimed_by ON acquisition_vouchers(claimed_by) WHERE claimed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_acq_expires ON acquisition_vouchers(expires_at) WHERE status IN ('available','claimed');
ALTER TABLE acquisition_vouchers ENABLE ROW LEVEL SECURITY;

-- Public can see available vouchers (so discovery feed works) — actual eligibility gated by RPC
DROP POLICY IF EXISTS "Public sees available acq vouchers" ON acquisition_vouchers;
CREATE POLICY "Public sees available acq vouchers" ON acquisition_vouchers
  FOR SELECT USING (status = 'available' OR claimed_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Providers see own vouchers" ON acquisition_vouchers;
CREATE POLICY "Providers see own vouchers" ON acquisition_vouchers
  FOR SELECT USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins see all acq vouchers" ON acquisition_vouchers;
CREATE POLICY "Admins see all acq vouchers" ON acquisition_vouchers
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- 6. Mint threshold settings
--    Default R500 face value; accumulated levy rolls up once threshold met
-- ═══════════════════════════════════════════════════════════════
INSERT INTO platform_settings (key, value, description) VALUES
  ('marketing_levy_rate', '0.05', 'Fraction of provider gross taken as acquisition marketing levy (0.05 = 5%)'),
  ('acq_voucher_face_value', '500', 'Face value (Rand) of each acquisition voucher minted from levy'),
  ('acq_voucher_expiry_days', '30', 'Days before an acquisition voucher expires if unclaimed/unredeemed'),
  ('acq_voucher_distance_km', '25', 'Default km radius for nearby-client eligibility'),
  ('spending_cashback_rate', '0.0025', 'Client spending rewards rate (0.0025 = 0.25%, R50 per R20k spent)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- ═══════════════════════════════════════════════════════════════
-- 7. Booking-completion trigger: record 5% levy + auto-mint voucher(s)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION record_provider_marketing_levy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bill numeric;
  v_levy_rate numeric;
  v_face_value numeric;
  v_expiry_days int;
  v_distance_km int;
  v_accumulated numeric;
  v_voucher_id uuid;
  v_new_voucher_count int;
  v_levy_id uuid;
BEGIN
  -- Only act on transition TO 'completed' (idempotent)
  IF NEW.status <> 'completed' THEN RETURN NEW; END IF;
  IF OLD.status = 'completed' THEN RETURN NEW; END IF;

  -- Skip if no price (free intros etc.)
  IF NEW.total_price IS NULL OR NEW.total_price <= 0 THEN RETURN NEW; END IF;

  -- All fees are a flat % of the BILL (total_price = R100 in canonical example).
  -- Provider fee 5% + marketing levy 5% are deducted from the bill (not compounded).
  v_bill := NEW.total_price;

  SELECT value::numeric INTO v_levy_rate   FROM platform_settings WHERE key = 'marketing_levy_rate';
  SELECT value::numeric INTO v_face_value  FROM platform_settings WHERE key = 'acq_voucher_face_value';
  SELECT value::int     INTO v_expiry_days FROM platform_settings WHERE key = 'acq_voucher_expiry_days';
  SELECT value::int     INTO v_distance_km FROM platform_settings WHERE key = 'acq_voucher_distance_km';

  v_levy_rate   := COALESCE(v_levy_rate, 0.05);
  v_face_value  := COALESCE(v_face_value, 500);
  v_expiry_days := COALESCE(v_expiry_days, 30);
  v_distance_km := COALESCE(v_distance_km, 25);

  -- Record levy contribution: 5% of the BILL (e.g. R100 × 5% = R5)
  INSERT INTO provider_marketing_levy (provider_id, booking_id, source_amount_rand, levy_rand, levy_type)
  VALUES (NEW.provider_id, NEW.id, v_bill, v_bill * v_levy_rate, 'mandatory')
  RETURNING id INTO v_levy_id;

  -- Accumulated un-minted levy for this provider
  SELECT COALESCE(SUM(levy_rand), 0) INTO v_accumulated
  FROM provider_marketing_levy
  WHERE provider_id = NEW.provider_id AND minted_voucher_id IS NULL;

  -- Mint as many full-face-value vouchers as the pool supports
  v_new_voucher_count := FLOOR(v_accumulated / v_face_value)::int;
  WHILE v_new_voucher_count > 0 LOOP
    INSERT INTO acquisition_vouchers (provider_id, face_value_rand, expires_at, max_distance_km)
    VALUES (NEW.provider_id, v_face_value, now() + (v_expiry_days || ' days')::interval, v_distance_km)
    RETURNING id INTO v_voucher_id;

    -- Mark the oldest un-minted levy contributions totalling this voucher as minted
    WITH to_mark AS (
      SELECT id FROM provider_marketing_levy
      WHERE provider_id = NEW.provider_id AND minted_voucher_id IS NULL
      ORDER BY created_at ASC
    ),
    running AS (
      SELECT id, SUM(levy_rand) OVER (ORDER BY created_at) AS cum
      FROM provider_marketing_levy
      WHERE provider_id = NEW.provider_id AND minted_voucher_id IS NULL
    )
    UPDATE provider_marketing_levy
    SET minted_voucher_id = v_voucher_id
    WHERE id IN (SELECT id FROM running WHERE cum <= v_face_value)
       OR id = (SELECT id FROM running WHERE cum > v_face_value ORDER BY cum LIMIT 1);

    v_new_voucher_count := v_new_voucher_count - 1;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_marketing_levy ON bookings;
CREATE TRIGGER booking_marketing_levy
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION record_provider_marketing_levy();

-- ═══════════════════════════════════════════════════════════════
-- 8. Voluntary boost: provider can top up levy to mint more vouchers
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION boost_marketing_levy(p_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_provider_id uuid;
  v_face_value numeric;
  v_expiry_days int;
  v_distance_km int;
  v_levy_id uuid;
  v_minted int := 0;
  v_accumulated numeric;
  v_voucher_id uuid;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Boost amount must be positive';
  END IF;

  SELECT id INTO v_provider_id FROM profiles WHERE user_id = auth.uid();
  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Provider profile not found';
  END IF;

  SELECT value::numeric INTO v_face_value  FROM platform_settings WHERE key = 'acq_voucher_face_value';
  SELECT value::int     INTO v_expiry_days FROM platform_settings WHERE key = 'acq_voucher_expiry_days';
  SELECT value::int     INTO v_distance_km FROM platform_settings WHERE key = 'acq_voucher_distance_km';
  v_face_value  := COALESCE(v_face_value, 500);
  v_expiry_days := COALESCE(v_expiry_days, 30);
  v_distance_km := COALESCE(v_distance_km, 25);

  INSERT INTO provider_marketing_levy (provider_id, source_amount_rand, levy_rand, levy_type)
  VALUES (v_provider_id, p_amount, p_amount, 'voluntary_boost')
  RETURNING id INTO v_levy_id;

  SELECT COALESCE(SUM(levy_rand), 0) INTO v_accumulated
  FROM provider_marketing_levy
  WHERE provider_id = v_provider_id AND minted_voucher_id IS NULL;

  WHILE v_accumulated >= v_face_value LOOP
    INSERT INTO acquisition_vouchers (provider_id, face_value_rand, expires_at, max_distance_km)
    VALUES (v_provider_id, v_face_value, now() + (v_expiry_days || ' days')::interval, v_distance_km)
    RETURNING id INTO v_voucher_id;

    WITH running AS (
      SELECT id, SUM(levy_rand) OVER (ORDER BY created_at) AS cum
      FROM provider_marketing_levy
      WHERE provider_id = v_provider_id AND minted_voucher_id IS NULL
    )
    UPDATE provider_marketing_levy
    SET minted_voucher_id = v_voucher_id
    WHERE id IN (SELECT id FROM running WHERE cum <= v_face_value)
       OR id = (SELECT id FROM running WHERE cum > v_face_value ORDER BY cum LIMIT 1);

    v_accumulated := v_accumulated - v_face_value;
    v_minted := v_minted + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'boost_amount', p_amount,
    'vouchers_minted', v_minted,
    'face_value', v_face_value,
    'remaining_pool', v_accumulated
  );
END;
$$;

GRANT EXECUTE ON FUNCTION boost_marketing_levy TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 9. Eligibility + discovery RPC
--    Returns acquisition vouchers the current user is eligible for:
--      - provider they've never completed a paid booking with
--      - within radius (haversine if lat/lng set, else city match)
--      - no already-active voucher from same provider
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION eligible_acquisition_vouchers(p_limit int DEFAULT 10)
RETURNS TABLE (
  voucher_id uuid,
  provider_id uuid,
  provider_name text,
  provider_avatar_url text,
  provider_vertical text,
  face_value_rand numeric,
  expires_at timestamptz,
  distance_km numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_profile_id uuid;
  v_user_lat numeric;
  v_user_lng numeric;
  v_user_city text;
BEGIN
  SELECT p.id, p.lat, p.lng, p.city
    INTO v_user_profile_id, v_user_lat, v_user_lng, v_user_city
  FROM profiles p WHERE p.user_id = auth.uid();

  IF v_user_profile_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    v.id,
    v.provider_id,
    pp.full_name,
    pp.avatar_url,
    pp.vertical,
    v.face_value_rand,
    v.expires_at,
    CASE
      WHEN pp.lat IS NOT NULL AND v_user_lat IS NOT NULL
        THEN haversine_km(v_user_lat, v_user_lng, pp.lat, pp.lng)
      ELSE NULL
    END AS distance_km
  FROM acquisition_vouchers v
  JOIN profiles pp ON pp.id = v.provider_id
  WHERE v.status = 'available'
    AND v.expires_at > now()
    -- Distance gate: haversine if both sides geocoded, else city fallback
    AND (
      (pp.lat IS NOT NULL AND v_user_lat IS NOT NULL
        AND haversine_km(v_user_lat, v_user_lng, pp.lat, pp.lng) <= v.max_distance_km)
      OR
      (pp.city IS NOT NULL AND v_user_city IS NOT NULL AND LOWER(pp.city) = LOWER(v_user_city))
    )
    -- Never completed a paid booking with this provider
    AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.client_id = v_user_profile_id
        AND b.provider_id = v.provider_id
        AND b.status = 'completed'
        AND b.total_price > 0
    )
    -- No active (claimed, unredeemed) voucher from same provider already held
    AND NOT EXISTS (
      SELECT 1 FROM acquisition_vouchers x
      WHERE x.provider_id = v.provider_id
        AND x.claimed_by = v_user_profile_id
        AND x.status IN ('claimed')
        AND x.expires_at > now()
    )
  ORDER BY
    CASE WHEN pp.lat IS NOT NULL AND v_user_lat IS NOT NULL
      THEN haversine_km(v_user_lat, v_user_lng, pp.lat, pp.lng) ELSE 999 END ASC,
    v.expires_at ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION eligible_acquisition_vouchers TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 10. Claim an acquisition voucher (atomic; checks eligibility)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION claim_acquisition_voucher(p_voucher_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_profile_id uuid;
  v_provider_id uuid;
  v_has_booked boolean;
  v_updated int;
BEGIN
  SELECT id INTO v_user_profile_id FROM profiles WHERE user_id = auth.uid();
  IF v_user_profile_id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT provider_id INTO v_provider_id FROM acquisition_vouchers WHERE id = p_voucher_id;
  IF v_provider_id IS NULL THEN RAISE EXCEPTION 'Voucher not found'; END IF;

  -- "Never completed a paid booking" gate
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE client_id = v_user_profile_id
      AND provider_id = v_provider_id
      AND status = 'completed' AND total_price > 0
  ) INTO v_has_booked;

  IF v_has_booked THEN
    RAISE EXCEPTION 'Not eligible: you have already booked this provider';
  END IF;

  UPDATE acquisition_vouchers
  SET status = 'claimed', claimed_by = v_user_profile_id, claimed_at = now()
  WHERE id = p_voucher_id AND status = 'available';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN RAISE EXCEPTION 'Voucher unavailable'; END IF;

  RETURN jsonb_build_object('ok', true, 'voucher_id', p_voucher_id);
END;
$$;

GRANT EXECUTE ON FUNCTION claim_acquisition_voucher TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 10b. Redeem an acquisition voucher on a booking
--      - BION charges 5% transaction fee on face value
--      - Provider receives 95% of face value to wallet
--      - Voucher marked 'redeemed' and linked to booking
-- ═══════════════════════════════════════════════════════════════

-- Add columns to track settlement on the voucher itself
ALTER TABLE acquisition_vouchers ADD COLUMN IF NOT EXISTS bion_fee_rand numeric(10,2);
ALTER TABLE acquisition_vouchers ADD COLUMN IF NOT EXISTS provider_payout_rand numeric(10,2);

INSERT INTO platform_settings (key, value, description) VALUES
  ('voucher_redemption_fee_rate', '0.05', 'BION transaction fee on voucher redemption (0.05 = 5% of face value)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

CREATE OR REPLACE FUNCTION redeem_acquisition_voucher(
  p_voucher_id uuid,
  p_booking_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_profile_id uuid;
  v_voucher record;
  v_fee_rate numeric;
  v_bion_fee numeric;
  v_provider_payout numeric;
BEGIN
  SELECT id INTO v_user_profile_id FROM profiles WHERE user_id = auth.uid();
  IF v_user_profile_id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT * INTO v_voucher FROM acquisition_vouchers WHERE id = p_voucher_id;
  IF v_voucher.id IS NULL THEN RAISE EXCEPTION 'Voucher not found'; END IF;
  IF v_voucher.status <> 'claimed' THEN RAISE EXCEPTION 'Voucher not in claimable state (status: %)', v_voucher.status; END IF;
  IF v_voucher.claimed_by <> v_user_profile_id THEN RAISE EXCEPTION 'Voucher does not belong to this user'; END IF;
  IF v_voucher.expires_at < now() THEN RAISE EXCEPTION 'Voucher expired'; END IF;

  -- Validate booking: must be this user's booking at the voucher's provider
  IF NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE id = p_booking_id
      AND client_id = v_user_profile_id
      AND provider_id = v_voucher.provider_id
  ) THEN
    RAISE EXCEPTION 'Booking does not match voucher (wrong provider or not your booking)';
  END IF;

  SELECT value::numeric INTO v_fee_rate FROM platform_settings WHERE key = 'voucher_redemption_fee_rate';
  v_fee_rate := COALESCE(v_fee_rate, 0.05);

  v_bion_fee := ROUND(v_voucher.face_value_rand * v_fee_rate, 2);
  v_provider_payout := v_voucher.face_value_rand - v_bion_fee;

  -- Mark voucher redeemed
  UPDATE acquisition_vouchers
  SET status = 'redeemed',
      redeemed_at = now(),
      redeemed_booking_id = p_booking_id,
      bion_fee_rand = v_bion_fee,
      provider_payout_rand = v_provider_payout
  WHERE id = p_voucher_id;

  -- Credit provider wallet with 95% of face value
  INSERT INTO wallet_transactions (user_id, amount_rand, type, reference_id, description)
  VALUES (
    v_voucher.provider_id,
    v_provider_payout,
    'voucher_redemption',
    p_voucher_id,
    format('Acquisition voucher redeemed (R%s face value, R%s BION fee)',
           v_voucher.face_value_rand, v_bion_fee)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'voucher_id', p_voucher_id,
    'booking_id', p_booking_id,
    'face_value', v_voucher.face_value_rand,
    'bion_fee', v_bion_fee,
    'provider_payout', v_provider_payout
  );
END;
$$;

GRANT EXECUTE ON FUNCTION redeem_acquisition_voucher TO authenticated;

-- BION revenue ledger view — isolates voucher-redemption fee income
CREATE OR REPLACE VIEW bion_voucher_fee_revenue
WITH (security_invoker = true) AS
SELECT
  COALESCE(SUM(bion_fee_rand), 0) AS lifetime_fee_rand,
  COALESCE(SUM(bion_fee_rand) FILTER (WHERE redeemed_at >= date_trunc('month', now())), 0) AS mtd_fee_rand,
  COUNT(*) FILTER (WHERE status = 'redeemed') AS redemption_count
FROM acquisition_vouchers
WHERE status = 'redeemed';

GRANT SELECT ON bion_voucher_fee_revenue TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 11. Provider stats view (levy paid, vouchers minted/claimed/redeemed)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW provider_marketing_stats
WITH (security_invoker = true) AS
SELECT
  p.id AS provider_id,
  COALESCE((SELECT SUM(levy_rand) FROM provider_marketing_levy WHERE provider_id = p.id), 0) AS lifetime_levy_rand,
  COALESCE((SELECT SUM(levy_rand) FROM provider_marketing_levy
            WHERE provider_id = p.id AND created_at >= date_trunc('month', now())), 0) AS mtd_levy_rand,
  COALESCE((SELECT COUNT(*) FROM acquisition_vouchers WHERE provider_id = p.id), 0) AS vouchers_minted,
  COALESCE((SELECT COUNT(*) FROM acquisition_vouchers
            WHERE provider_id = p.id AND status = 'available'), 0) AS vouchers_available,
  COALESCE((SELECT COUNT(*) FROM acquisition_vouchers
            WHERE provider_id = p.id AND status = 'claimed'), 0) AS vouchers_claimed,
  COALESCE((SELECT COUNT(*) FROM acquisition_vouchers
            WHERE provider_id = p.id AND status = 'redeemed'), 0) AS vouchers_redeemed,
  COALESCE((SELECT SUM(face_value_rand) FROM acquisition_vouchers
            WHERE provider_id = p.id AND status = 'redeemed'), 0) AS attributed_acquisition_rand,
  COALESCE((SELECT SUM(provider_payout_rand) FROM acquisition_vouchers
            WHERE provider_id = p.id AND status = 'redeemed'), 0) AS redeemed_payout_rand,
  COALESCE((SELECT SUM(bion_fee_rand) FROM acquisition_vouchers
            WHERE provider_id = p.id AND status = 'redeemed'), 0) AS redeemed_bion_fee_rand
FROM profiles p;

GRANT SELECT ON provider_marketing_stats TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Done. Existing 2.5%-issued vouchers remain valid; new ones at 0.25%.
-- ═══════════════════════════════════════════════════════════════
