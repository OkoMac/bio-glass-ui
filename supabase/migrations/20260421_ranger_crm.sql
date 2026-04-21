-- ═══════════════════════════════════════════════════════════════════════════
-- Ranger CRM — Lead tracking for BION Sales Reps ("Rangers")
-- Migration: 20260421_ranger_crm.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Leads table
CREATE TABLE IF NOT EXISTS ranger_leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ranger_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  contact_name  text NOT NULL DEFAULT '',
  phone         text,
  email         text,
  category      text NOT NULL DEFAULT 'wellness'
                  CHECK (category IN ('medical','beauty','fitness','wellness','veterinary')),
  location      text,
  suburb        text,
  city          text,
  stage         text NOT NULL DEFAULT 'new'
                  CHECK (stage IN ('new','contacted','demo_scheduled','demo_done',
                                   'negotiating','signed_up','active','lost')),
  source        text NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('manual','directory','suggested')),
  notes         text,
  next_follow_up timestamptz,
  last_contacted timestamptz,
  provider_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ranger_leads_ranger   ON ranger_leads(ranger_profile_id);
CREATE INDEX IF NOT EXISTS idx_ranger_leads_stage    ON ranger_leads(ranger_profile_id, stage);
CREATE INDEX IF NOT EXISTS idx_ranger_leads_city     ON ranger_leads(city);
CREATE INDEX IF NOT EXISTS idx_ranger_leads_followup ON ranger_leads(next_follow_up)
  WHERE next_follow_up IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ranger_leads_provider ON ranger_leads(provider_profile_id)
  WHERE provider_profile_id IS NOT NULL;

-- 2. Activity log table
CREATE TABLE IF NOT EXISTS ranger_lead_activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           uuid NOT NULL REFERENCES ranger_leads(id) ON DELETE CASCADE,
  ranger_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type              text NOT NULL
                      CHECK (type IN ('call','whatsapp','email','meeting','demo','follow_up','note')),
  notes             text,
  outcome           text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ranger_activities_lead ON ranger_lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_ranger_activities_ranger ON ranger_lead_activities(ranger_profile_id);

-- 3. RLS policies — Rangers can only see/modify their own leads & activities
ALTER TABLE ranger_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranger_lead_activities ENABLE ROW LEVEL SECURITY;

-- Rangers: full access to own leads
CREATE POLICY ranger_leads_select ON ranger_leads
  FOR SELECT USING (
    ranger_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY ranger_leads_insert ON ranger_leads
  FOR INSERT WITH CHECK (
    ranger_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY ranger_leads_update ON ranger_leads
  FOR UPDATE USING (
    ranger_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY ranger_leads_delete ON ranger_leads
  FOR DELETE USING (
    ranger_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Admins: full access to all leads
CREATE POLICY ranger_leads_admin ON ranger_leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Activity log: Rangers see own, admins see all
CREATE POLICY ranger_activities_select ON ranger_lead_activities
  FOR SELECT USING (
    ranger_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY ranger_activities_insert ON ranger_lead_activities
  FOR INSERT WITH CHECK (
    ranger_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY ranger_activities_admin ON ranger_lead_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Auto-update updated_at on ranger_leads
CREATE OR REPLACE FUNCTION update_ranger_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ranger_leads_updated_at ON ranger_leads;
CREATE TRIGGER trg_ranger_leads_updated_at
  BEFORE UPDATE ON ranger_leads
  FOR EACH ROW EXECUTE FUNCTION update_ranger_leads_updated_at();
