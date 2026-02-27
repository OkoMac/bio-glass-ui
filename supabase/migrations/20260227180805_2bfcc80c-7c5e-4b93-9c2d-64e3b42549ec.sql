
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'provider', 'client');

-- User roles table (CRITICAL: separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  specialty TEXT,
  vertical TEXT DEFAULT 'indigo',
  location TEXT,
  experience_years INT DEFAULT 0,
  qualifications TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT 'indigo',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_free_intro BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Provider availability
CREATE TABLE public.provider_availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_availabilities ENABLE ROW LEVEL SECURITY;

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) NOT NULL,
  provider_id UUID REFERENCES public.profiles(id) NOT NULL,
  service_id UUID REFERENCES public.services(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  notes TEXT,
  total_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','routine','voice','image')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Featured content (admin managed)
CREATE TABLE public.featured_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link TEXT,
  provider_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

-- Platform settings (admin only)
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS POLICIES

-- user_roles: users can read own, admins can manage all
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- profiles: everyone can read, users update own, admins manage all
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- categories: public read, admin manage
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- services: public read published, providers manage own, admin manage all
CREATE POLICY "Anyone can view published services" ON public.services FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin') OR provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Providers can insert services" ON public.services FOR INSERT WITH CHECK (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND public.has_role(auth.uid(), 'provider'));
CREATE POLICY "Providers can update own services" ON public.services FOR UPDATE USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Providers can delete own services" ON public.services FOR DELETE USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- provider_availabilities
CREATE POLICY "Anyone can view availabilities" ON public.provider_availabilities FOR SELECT USING (true);
CREATE POLICY "Providers can manage own availability" ON public.provider_availabilities FOR ALL USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage availabilities" ON public.provider_availabilities FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- bookings: participants can view, clients can create, admins manage all
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (
  client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Clients can create bookings" ON public.bookings FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Participants can update bookings" ON public.bookings FOR UPDATE USING (
  client_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can manage bookings" ON public.bookings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- messages: participants only
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  receiver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage messages" ON public.messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- featured_content: public read, admin manage
CREATE POLICY "Anyone can view featured content" ON public.featured_content FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage featured content" ON public.featured_content FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- platform_settings: admin only
CREATE POLICY "Admins can manage settings" ON public.platform_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Seed categories
INSERT INTO public.categories (name, description, icon, color, sort_order) VALUES
  ('Fitness', 'Personal training, gym, sports', '💪', 'teal', 1),
  ('Medical', 'Doctors, physio, biokinetics', '🏥', 'indigo', 2),
  ('Beauty', 'Skincare, hair, nails, spa', '✨', 'coral', 3),
  ('Professional', 'Coaching, consulting, tutoring', '💼', 'amber', 4),
  ('Wellness', 'Yoga, meditation, mindfulness', '🧘', 'violet', 5);
