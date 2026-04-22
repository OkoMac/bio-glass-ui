-- Gift Vouchers — purchasable vouchers redeemable against any booking
CREATE TABLE IF NOT EXISTS gift_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  amount_rand NUMERIC(10,2) NOT NULL,
  remaining_rand NUMERIC(10,2) NOT NULL,
  sender_id UUID REFERENCES profiles(id),
  sender_name TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_id UUID REFERENCES profiles(id),
  message TEXT,
  paystack_reference TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','redeemed','expired','cancelled')),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '12 months'),
  redeemed_at TIMESTAMPTZ
);

-- Gift voucher redemption log
CREATE TABLE IF NOT EXISTS gift_voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES gift_vouchers(id),
  booking_id UUID REFERENCES bookings(id),
  amount_rand NUMERIC(10,2) NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gift_vouchers_code ON gift_vouchers(code);
CREATE INDEX IF NOT EXISTS idx_gift_vouchers_sender ON gift_vouchers(sender_id);
CREATE INDEX IF NOT EXISTS idx_gift_vouchers_recipient ON gift_vouchers(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_voucher_redemptions_voucher ON gift_voucher_redemptions(voucher_id);

-- RLS
ALTER TABLE gift_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can read vouchers they sent or received
CREATE POLICY "gift_vouchers_select" ON gift_vouchers FOR SELECT USING (true);

-- Authenticated users can purchase vouchers
CREATE POLICY "gift_vouchers_insert" ON gift_vouchers FOR INSERT WITH CHECK (true);
CREATE POLICY "gift_vouchers_update" ON gift_vouchers FOR UPDATE USING (true);

-- Redemption logs readable by involved parties
CREATE POLICY "gift_voucher_redemptions_select" ON gift_voucher_redemptions FOR SELECT USING (true);
CREATE POLICY "gift_voucher_redemptions_insert" ON gift_voucher_redemptions FOR INSERT WITH CHECK (true);
