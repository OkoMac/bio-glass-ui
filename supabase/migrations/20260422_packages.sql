-- Package Deals — session bundles with bonus sessions
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES profiles(id),
  service_id UUID REFERENCES services(id),
  title TEXT NOT NULL,
  description TEXT,
  total_sessions INT NOT NULL,
  bonus_sessions INT DEFAULT 0,
  price_rand NUMERIC(10,2) NOT NULL,
  valid_days INT DEFAULT 90,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client package purchases
CREATE TABLE IF NOT EXISTS package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id),
  client_id UUID REFERENCES profiles(id),
  remaining_sessions INT NOT NULL,
  total_sessions INT NOT NULL,
  paystack_reference TEXT,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','exhausted'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_packages_provider ON packages(provider_id);
CREATE INDEX IF NOT EXISTS idx_package_purchases_client ON package_purchases(client_id);
CREATE INDEX IF NOT EXISTS idx_package_purchases_package ON package_purchases(package_id);

-- RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can read active packages
CREATE POLICY "packages_select" ON packages FOR SELECT USING (true);

-- Providers can manage their own packages
CREATE POLICY "packages_insert" ON packages FOR INSERT
  WITH CHECK (provider_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = provider_id AND user_id = auth.uid()
  ));
CREATE POLICY "packages_update" ON packages FOR UPDATE
  USING (provider_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = provider_id AND user_id = auth.uid()
  ));

-- Clients can read their own purchases
CREATE POLICY "package_purchases_select" ON package_purchases FOR SELECT
  USING (client_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = client_id AND user_id = auth.uid()
  ));

-- Insert allowed for authenticated users (purchase flow)
CREATE POLICY "package_purchases_insert" ON package_purchases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "package_purchases_update" ON package_purchases FOR UPDATE
  USING (true);
