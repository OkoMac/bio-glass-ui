
-- Fix overly permissive biopoints insert policy
DROP POLICY "System can insert points" ON public.biopoints;

CREATE POLICY "Authenticated users can earn points" ON public.biopoints
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'provider'::app_role)
  );
