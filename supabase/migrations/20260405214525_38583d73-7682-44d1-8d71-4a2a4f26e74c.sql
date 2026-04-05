
-- Booking requests for unregistered providers
CREATE TABLE public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  provider_name TEXT NOT NULL,
  provider_email TEXT,
  provider_phone TEXT,
  service_description TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a booking request (public form)
CREATE POLICY "Anyone can create booking requests"
ON public.booking_requests FOR INSERT
WITH CHECK (true);

-- Admins can do everything
CREATE POLICY "Admins can manage booking requests"
ON public.booking_requests FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Authenticated users can view their own requests by email
CREATE POLICY "Users can view own requests"
ON public.booking_requests FOR SELECT
USING (client_email = (SELECT email FROM profiles WHERE user_id = auth.uid() LIMIT 1));

-- Trigger for updated_at
CREATE TRIGGER update_booking_requests_updated_at
BEFORE UPDATE ON public.booking_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
