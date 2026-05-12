import { useEffect, useState } from "react";
import { MapPin, Target, Loader2, Check } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

/**
 * Provider Service Area settings — drives acquisition-voucher eligibility.
 *   - City / Suburb (text fallback when lat/lng missing)
 *   - GPS pin via navigator.geolocation
 *   - Service radius (km) — voucher visible to clients within this radius
 */
export default function ServiceAreaCard() {
  const { profile, updateProfile } = useProfile();
  const [city, setCity] = useState("");
  const [suburb, setSuburb] = useState("");
  const [radius, setRadius] = useState(25);
  const [pinning, setPinning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setCity(profile.city ?? "");
    setSuburb(profile.suburb ?? "");
    setRadius(profile.serviceRadiusKm ?? 25);
    setPinned(!!profile.lat && !!profile.lng);
  }, [profile]);

  const pinLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported in this browser");
      return;
    }
    setPinning(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await updateProfile({
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
        });
        toast.success("Pinned to your current location");
        setPinned(true);
        setPinning(false);
      },
      (err) => {
        toast.error(err.message || "Couldn't read your location");
        setPinning(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({
        city: city.trim() || undefined,
        suburb: suburb.trim() || undefined,
        service_radius_km: radius,
      });
      toast.success("Service area updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="p-4 space-y-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service Area</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Controls who sees your acquisition vouchers. City/suburb is the fallback — GPS pin is more accurate.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">City</label>
          <input
            value={city} onChange={(e) => setCity(e.target.value)}
            placeholder="Johannesburg"
            className="w-full mt-1 bg-white/5 text-foreground text-sm rounded-xl px-3 py-2 outline-none border border-white/10 focus:border-indigo/50"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Suburb</label>
          <input
            value={suburb} onChange={(e) => setSuburb(e.target.value)}
            placeholder="Sandton"
            className="w-full mt-1 bg-white/5 text-foreground text-sm rounded-xl px-3 py-2 outline-none border border-white/10 focus:border-indigo/50"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Service radius</label>
          <span className="text-xs font-semibold text-foreground">{radius} km</span>
        </div>
        <input
          type="range" min={5} max={100} step={5}
          value={radius} onChange={(e) => setRadius(parseInt(e.target.value))}
          className="w-full accent-indigo"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>5 km</span><span>50 km</span><span>100 km</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={pinLocation} disabled={pinning}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            pinned ? "bg-teal/10 text-teal border border-teal/30" : "bg-white/5 text-foreground hover:bg-white/10"
          }`}
         aria-label="Loading" title="Loading">
          {pinning ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : pinned ? <Check className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
          {pinned ? "Location pinned" : "Pin my location"}
        </button>
        <button
          onClick={save} disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-indigo text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
          Save
        </button>
      </div>

      {profile?.lat && profile?.lng && (
        <p className="text-[10px] text-muted-foreground text-center">
          GPS: {profile.lat.toFixed(4)}, {profile.lng.toFixed(4)}
        </p>
      )}
    </GlassCard>
  );
}
