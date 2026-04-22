-- Group Bookings — classes, workshops, group sessions
CREATE TABLE IF NOT EXISTS group_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES profiles(id),
  service_id UUID REFERENCES services(id),
  title TEXT NOT NULL,
  description TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME,
  duration_minutes INT DEFAULT 60,
  max_participants INT NOT NULL,
  current_participants INT DEFAULT 0,
  price_per_person NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','full','cancelled','completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link individual bookings to a group session
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_booking_id UUID REFERENCES group_bookings(id);

-- Index for listing available sessions
CREATE INDEX IF NOT EXISTS idx_group_bookings_status_date ON group_bookings(status, booking_date);
CREATE INDEX IF NOT EXISTS idx_group_bookings_provider ON group_bookings(provider_id);

-- RLS
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can read open group sessions
CREATE POLICY "group_bookings_select" ON group_bookings FOR SELECT USING (true);

-- Providers can insert/update their own
CREATE POLICY "group_bookings_insert" ON group_bookings FOR INSERT
  WITH CHECK (provider_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = provider_id AND user_id = auth.uid()
  ));

CREATE POLICY "group_bookings_update" ON group_bookings FOR UPDATE
  USING (provider_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = provider_id AND user_id = auth.uid()
  ));
