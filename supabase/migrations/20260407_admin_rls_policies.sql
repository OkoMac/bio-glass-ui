-- ============================================================
-- BION Platform — Admin RLS Policies
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Admin can read all user_roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_roles' AND tablename = 'user_roles') THEN
    CREATE POLICY admin_read_all_roles ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin can read all profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_profiles' AND tablename = 'profiles') THEN
    CREATE POLICY admin_read_all_profiles ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin can update all profiles (suspend/unsuspend)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_update_all_profiles' AND tablename = 'profiles') THEN
    CREATE POLICY admin_update_all_profiles ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin can read all bookings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_bookings' AND tablename = 'bookings') THEN
    CREATE POLICY admin_read_all_bookings ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin can read all messages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_messages' AND tablename = 'messages') THEN
    CREATE POLICY admin_read_all_messages ON public.messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin can read all biopoints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_biopoints' AND tablename = 'biopoints') THEN
    CREATE POLICY admin_read_all_biopoints ON public.biopoints FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin can read all services
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_services' AND tablename = 'services') THEN
    CREATE POLICY admin_read_all_services ON public.services FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Users can read their own roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_read_own_roles' AND tablename = 'user_roles') THEN
    CREATE POLICY users_read_own_roles ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can read their own profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_read_own_profile' AND tablename = 'profiles') THEN
    CREATE POLICY users_read_own_profile ON public.profiles FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_update_own_profile' AND tablename = 'profiles') THEN
    CREATE POLICY users_update_own_profile ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Platform settings: admin can read and write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_manage_settings' AND tablename = 'platform_settings') THEN
    CREATE POLICY admin_manage_settings ON public.platform_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- platform_settings table doesn't exist yet, skip
  NULL;
END $$;
