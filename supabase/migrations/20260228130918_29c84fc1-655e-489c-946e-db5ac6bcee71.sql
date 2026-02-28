
-- Challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'streak', -- streak, community, provider
  category TEXT DEFAULT 'general', -- fitness, wellness, nutrition, mindfulness
  icon TEXT DEFAULT '🎯',
  target_value INTEGER NOT NULL DEFAULT 7,
  target_unit TEXT DEFAULT 'days', -- days, sessions, steps, minutes
  points_reward INTEGER NOT NULL DEFAULT 100,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  provider_id UUID REFERENCES public.profiles(id),
  max_participants INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" ON public.challenges
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage challenges" ON public.challenges
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Providers can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (
    provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'provider'::app_role)
  );

CREATE POLICY "Providers can update own challenges" ON public.challenges
  FOR UPDATE USING (
    provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- User challenge participation
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, abandoned
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges" ON public.user_challenges
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can join challenges" ON public.user_challenges
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own challenges" ON public.user_challenges
  FOR UPDATE USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage user challenges" ON public.user_challenges
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- BIOPoints ledger
CREATE TABLE public.biopoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT DEFAULT 'system', -- system, challenge, booking, referral, provider_reward
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.biopoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points" ON public.biopoints
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert points" ON public.biopoints
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage points" ON public.biopoints
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Streaks tracking
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  streak_type TEXT NOT NULL DEFAULT 'booking', -- booking, login, challenge
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks" ON public.user_streaks
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage own streaks" ON public.user_streaks
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage streaks" ON public.user_streaks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Provider rewards for clients
CREATE TABLE public.provider_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  points_value INTEGER DEFAULT 0,
  reward_type TEXT DEFAULT 'discount', -- discount, free_session, badge, custom
  is_redeemed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ
);

ALTER TABLE public.provider_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage rewards they created" ON public.provider_rewards
  FOR ALL USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clients can view own rewards" ON public.provider_rewards
  FOR SELECT USING (client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage rewards" ON public.provider_rewards
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Client notes (provider tracks out-of-office treatment)
CREATE TABLE public.client_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'general', -- general, treatment, follow_up, out_of_office
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage own client notes" ON public.client_notes
  FOR ALL USING (provider_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clients can view shared notes" ON public.client_notes
  FOR SELECT USING (client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND is_private = false);

CREATE POLICY "Admins can manage notes" ON public.client_notes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
