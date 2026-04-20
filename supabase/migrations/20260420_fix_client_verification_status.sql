-- Fix: clients should have provider_status = 'verified', not 'pending_verification'.
-- Only providers need KYC verification before being active.
-- This migration fixes existing client profiles and updates the column default
-- so any edge-case inserts without an explicit value still behave correctly
-- for the majority case (clients).

-- Backfill: set all existing clients to 'verified'
UPDATE public.profiles
   SET provider_status = 'verified',
       provider_status_at = now()
 WHERE user_id IN (
   SELECT user_id FROM public.user_roles WHERE role = 'client'
 )
   AND provider_status = 'pending_verification';

-- Also fix profiles that have NO role entry (defaults to client behaviour)
UPDATE public.profiles
   SET provider_status = 'verified',
       provider_status_at = now()
 WHERE user_id NOT IN (
   SELECT user_id FROM public.user_roles WHERE role IN ('provider', 'admin')
 )
   AND provider_status = 'pending_verification';

-- Change column default to 'verified' so future inserts that don't specify
-- provider_status (e.g. from unexpected code paths) default to the safe state.
-- The /ensure endpoint and WhatsApp signup now explicitly set the value anyway.
ALTER TABLE public.profiles
  ALTER COLUMN provider_status SET DEFAULT 'verified';
