import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  specialty: string | null;
  vertical: string | null;
  experienceYears: number | null;
  qualifications: string[];
  isActive: boolean;
  isFeatured: boolean;
  city: string | null;
  suburb: string | null;
  lat: number | null;
  lng: number | null;
  serviceRadiusKm: number | null;
}

type SupaProfile = {
  id: string; user_id: string; full_name: string; email: string | null;
  phone: string | null; bio: string | null; avatar_url: string | null;
  location: string | null; specialty: string | null; vertical: string | null;
  experience_years: number | null; qualifications: string[] | null;
  is_active: boolean | null; is_featured: boolean | null;
  city: string | null; suburb: string | null;
  lat: number | null; lng: number | null;
  service_radius_km: number | null;
};

function mapProfile(r: SupaProfile): Profile {
  return {
    id: r.id, userId: r.user_id, fullName: r.full_name,
    email: r.email ?? "", phone: r.phone,
    bio: r.bio, avatarUrl: r.avatar_url, location: r.location,
    specialty: r.specialty, vertical: r.vertical,
    experienceYears: r.experience_years,
    qualifications: r.qualifications ?? [],
    isActive: r.is_active ?? true,
    isFeatured: r.is_featured ?? false,
    city: r.city, suburb: r.suburb,
    lat: r.lat, lng: r.lng,
    serviceRadiusKm: r.service_radius_km,
  };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setProfile(mapProfile(data as SupaProfile));
        setLoading(false);
      });
  }, [user?.id]);

  const updateProfile = useCallback(async (updates: Partial<{
    full_name: string; phone: string; bio: string; avatar_url: string;
    location: string; specialty: string;
    city: string; suburb: string;
    lat: number | null; lng: number | null;
    service_radius_km: number;
  }>) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select()
      .single();
    if (!error && data) setProfile(mapProfile(data as SupaProfile));
  }, [user?.id]);

  return { profile, loading, updateProfile };
}

/** Fetch any provider's public profile by their profile id */
export function useProviderProfile(profileId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    supabase.from("profiles").select("*").eq("id", profileId).maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setProfile(mapProfile(data as SupaProfile));
        setLoading(false);
      });
  }, [profileId]);

  return { profile, loading };
}
