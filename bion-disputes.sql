-- ============================================================
-- BION Order Dispute RPCs (B_ mediated)
-- Run in Supabase SQL Editor (idempotent)
--
-- FLOW:
--   1. Buyer calls raise_dispute() — order goes 'disputed', dispute row opens
--   2. Provider calls submit_provider_dispute_response() — sets their statement
--   3. Backend POST /api/b-review/dispute populates b_recommendation
--   4. Provider calls resolve_dispute() — chooses refund/replace/decline
--      - 'refund': buyer wallet credited, order refunded
--      - 'replace': order stays disputed, provider ships new item
--      - 'decline': escalates to admin queue
-- ============================================================

-- Ensure wallet_transactions has the right type constraint
-- (If existing CHECK constraint already permits 'refund', this is a no-op.)

-- ═══════════════════════════════════════════════════════════════
-- 1. Raise dispute (called by buyer)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION raise_dispute(
  p_order_id uuid,
  p_reason text,
  p_statement text,
  p_evidence jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_order record;
  v_dispute_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE user_id = auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT * INTO v_order FROM product_orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.buyer_id <> v_user_id THEN RAISE EXCEPTION 'Not your order'; END IF;
  IF v_order.status IN ('cancelled','refunded') THEN
    RAISE EXCEPTION 'Cannot dispute a % order', v_order.status;
  END IF;

  -- Only one active dispute per order
  IF EXISTS (SELECT 1 FROM order_disputes WHERE order_id = p_order_id AND resolved_at IS NULL) THEN
    RAISE EXCEPTION 'Dispute already open for this order';
  END IF;

  INSERT INTO order_disputes (order_id, raised_by, reason, buyer_statement, buyer_evidence)
  VALUES (p_order_id, v_user_id, p_reason, p_statement, COALESCE(p_evidence, '[]'::jsonb))
  RETURNING id INTO v_dispute_id;

  UPDATE product_orders SET status = 'disputed' WHERE id = p_order_id;

  RETURN jsonb_build_object('ok', true, 'dispute_id', v_dispute_id);
END;
$$;
GRANT EXECUTE ON FUNCTION raise_dispute TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 2. Provider response to dispute
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION submit_provider_dispute_response(
  p_dispute_id uuid,
  p_statement text,
  p_evidence jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_order_provider_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE user_id = auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT o.provider_id INTO v_order_provider_id
  FROM order_disputes d JOIN product_orders o ON o.id = d.order_id
  WHERE d.id = p_dispute_id;

  IF v_order_provider_id IS NULL THEN RAISE EXCEPTION 'Dispute not found'; END IF;
  IF v_order_provider_id <> v_user_id THEN RAISE EXCEPTION 'Not your order'; END IF;

  UPDATE order_disputes
  SET provider_statement = p_statement,
      provider_evidence = COALESCE(p_evidence, '[]'::jsonb)
  WHERE id = p_dispute_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION submit_provider_dispute_response TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 3. Resolve dispute (provider picks outcome after B_ recommendation)
--    Actions: 'refunded' | 'replaced' | 'declined' | 'admin_decided'
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION resolve_dispute(
  p_dispute_id uuid,
  p_resolution text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_order record;
  v_dispute record;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE user_id = auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  SELECT * INTO v_dispute FROM order_disputes WHERE id = p_dispute_id;
  IF v_dispute.id IS NULL THEN RAISE EXCEPTION 'Dispute not found'; END IF;

  SELECT * INTO v_order FROM product_orders WHERE id = v_dispute.order_id;

  -- Authorization: provider can resolve (refund/replace/decline/escalate)
  -- Admin can resolve anything
  SELECT COALESCE((SELECT 'admin' FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'),
                  CASE WHEN v_order.provider_id = v_user_id THEN 'provider' ELSE NULL END)
    INTO v_role;

  IF v_role IS NULL THEN RAISE EXCEPTION 'Not authorized to resolve this dispute'; END IF;

  IF p_resolution NOT IN ('refunded','replaced','declined','admin_decided') THEN
    RAISE EXCEPTION 'Invalid resolution: %', p_resolution;
  END IF;

  -- Providers cannot unilaterally "decline" — that goes to admin
  IF v_role = 'provider' AND p_resolution = 'declined' THEN
    p_resolution := 'admin_decided';
  END IF;

  -- Apply resolution
  IF p_resolution = 'refunded' THEN
    -- Credit buyer wallet with full amount paid
    INSERT INTO wallet_transactions (user_id, amount_rand, type, reference_id, description)
    VALUES (
      v_order.buyer_id,
      v_order.total_charged_rand,
      'refund',
      v_order.id,
      format('Refund for disputed order (R%s)', v_order.total_charged_rand)
    );
    UPDATE product_orders SET status = 'refunded' WHERE id = v_order.id;

  ELSIF p_resolution = 'replaced' THEN
    -- Reset to 'preparing' so provider can ship new item; dispute stays logged
    UPDATE product_orders SET status = 'preparing' WHERE id = v_order.id;

  ELSIF p_resolution = 'admin_decided' THEN
    -- Stays in 'disputed' until an admin picks refund or decline
    NULL;

  ELSIF p_resolution = 'declined' THEN
    -- Only reachable by admin
    UPDATE product_orders SET status = 'delivered' WHERE id = v_order.id;
  END IF;

  UPDATE order_disputes
  SET resolution = p_resolution,
      resolved_at = now(),
      resolved_by_admin_id = CASE WHEN v_role = 'admin' THEN v_user_id ELSE NULL END
  WHERE id = p_dispute_id;

  RETURN jsonb_build_object('ok', true, 'resolution', p_resolution);
END;
$$;
GRANT EXECUTE ON FUNCTION resolve_dispute TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 4. Admin escalation view
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW disputes_awaiting_admin
WITH (security_invoker = true) AS
SELECT d.*, o.buyer_id, o.provider_id, o.total_charged_rand
FROM order_disputes d
JOIN product_orders o ON o.id = d.order_id
WHERE d.resolution = 'admin_decided' OR d.resolution IS NULL;

GRANT SELECT ON disputes_awaiting_admin TO authenticated;
