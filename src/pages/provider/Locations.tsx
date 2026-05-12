import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, MapPin, Plus, Trash2, Star, Edit3, Save,
  Loader2, X, Clock, Phone, Building,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Location {
  id: string;
  name: string;
  address: string | null;
  suburb: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  operating_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  is_primary: boolean;
  created_at: string;
}

export default function Locations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(() => {
    const init: Record<string, { open: string; close: string; closed: boolean }> = {};
    DAYS.forEach(d => { init[d] = { open: "09:00", close: "17:00", closed: d === "Sun" }; });
    return init;
  });

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  };

  const fetchLocations = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/providers/locations/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok) setLocations(json.data ?? []);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const resetForm = () => {
    setName(""); setAddress(""); setSuburb(""); setCity(""); setPhone("");
    setIsPrimary(false); setEditingId(null);
    const init: Record<string, { open: string; close: string; closed: boolean }> = {};
    DAYS.forEach(d => { init[d] = { open: "09:00", close: "17:00", closed: d === "Sun" }; });
    setHours(init);
  };

  const openEditForm = (loc: Location) => {
    setEditingId(loc.id);
    setName(loc.name);
    setAddress(loc.address ?? "");
    setSuburb(loc.suburb ?? "");
    setCity(loc.city ?? "");
    setPhone(loc.phone ?? "");
    setIsPrimary(loc.is_primary);
    // Restore hours
    const h: Record<string, { open: string; close: string; closed: boolean }> = {};
    DAYS.forEach(d => {
      const saved = loc.operating_hours?.[d];
      h[d] = saved ? { open: saved.open ?? "09:00", close: saved.close ?? "17:00", closed: !!saved.closed } : { open: "09:00", close: "17:00", closed: d === "Sun" };
    });
    setHours(h);
    setShowForm(true);
  };

  const saveLocation = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        name: name.trim(),
        address: address || undefined,
        suburb: suburb || undefined,
        city: city || undefined,
        phone: phone || undefined,
        operatingHours: hours,
        is_primary: isPrimary,
      };

      const url = editingId
        ? `${API}/api/providers/locations/${editingId}`
        : `${API}/api/providers/locations`;

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setShowForm(false);
        resetForm();
        await fetchLocations();
      }
    } catch (err) {
      console.error("Failed to save location:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm("Remove this location?")) return;
    try {
      const token = await getToken();
      await fetch(`${API}/api/providers/locations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchLocations();
    } catch (err) {
      console.error("Failed to delete location:", err);
    }
  };

  const makePrimary = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${API}/api/providers/locations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_primary: true }),
      });
      await fetchLocations();
    } catch (err) {
      console.error("Failed to set primary:", err);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56 relative">
      <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 z-50 w-10 h-10 glass-2 rounded-full flex items-center justify-center text-foreground hover:bg-white/[0.06] transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-20 pb-28 md:pb-8 md:pt-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-6 h-6 text-indigo" /> Locations
            </h1>
            <p className="text-xs text-muted-foreground">Manage your branches and operating hours</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Location
          </button>
        </div>

        {/* Locations list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo animate-spin" />
          </div>
        ) : locations.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Building className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No locations added yet.</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Add your practice locations so clients can find you.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {locations.map(loc => (
              <GlassCard key={loc.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      loc.is_primary ? "bg-teal/20" : "glass-2"
                    }`}>
                      <MapPin className={`w-4 h-4 ${loc.is_primary ? "text-teal" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground">{loc.name}</p>
                        {loc.is_primary && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-teal/10 text-teal rounded-pill font-medium">Primary</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {[loc.address, loc.suburb, loc.city].filter(Boolean).join(", ") || "No address"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!loc.is_primary && (
                      <button
                        onClick={() => makePrimary(loc.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-teal transition-colors"
                        title="Set as primary"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => openEditForm(loc)} className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteLocation(loc.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-coral transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {loc.phone && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {loc.phone}
                  </p>
                )}

                {/* Operating hours summary */}
                {loc.operating_hours && Object.keys(loc.operating_hours).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Hours
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {DAYS.map(d => {
                        const h = loc.operating_hours?.[d];
                        if (!h || h.closed) return null;
                        return (
                          <span key={d} className="text-[9px] px-1.5 py-0.5 glass-1 rounded text-muted-foreground">
                            {d} {h.open}-{h.close}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* ── Add/Edit Location Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => { setShowForm(false); resetForm(); }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-2 rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  {editingId ? "Edit Location" : "Add Location"}
                </h2>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Branch name *</p>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Sandton Branch"
                    className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                  />
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Address</p>
                  <input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="123 Main Street"
                    className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Suburb</p>
                    <input
                      value={suburb}
                      onChange={e => setSuburb(e.target.value)}
                      className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">City</p>
                    <input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Phone</p>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+27 12 345 6789"
                    className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-indigo/50 transition-colors"
                  />
                </div>

                {/* Primary toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Primary location</p>
                    <p className="text-[10px] text-muted-foreground">Shown as default on your profile</p>
                  </div>
                  <button
                    onClick={() => setIsPrimary(!isPrimary)}
                    className={`w-9 h-5 rounded-full transition-all flex items-center px-0.5 ${
                      isPrimary ? "bg-teal" : "bg-white/10"
                    }`}
                  >
                    <motion.div
                      animate={{ x: isPrimary ? 16 : 0 }}
                      className="w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                {/* Operating hours */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Operating hours
                  </p>
                  <div className="space-y-2">
                    {DAYS.map(d => (
                      <div key={d} className="flex items-center gap-2">
                        <button
                          onClick={() => setHours(prev => ({ ...prev, [d]: { ...prev[d], closed: !prev[d].closed } }))}
                          className={`w-10 text-[10px] font-semibold py-1 rounded-lg transition-all ${
                            hours[d].closed ? "glass-1 text-muted-foreground" : "bg-indigo/20 text-indigo"
                          }`}
                        >
                          {d}
                        </button>
                        {hours[d].closed ? (
                          <p className="text-[10px] text-muted-foreground/50 flex-1">Closed</p>
                        ) : (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="time"
                              value={hours[d].open}
                              onChange={e => setHours(prev => ({ ...prev, [d]: { ...prev[d], open: e.target.value } }))}
                              className="bg-white/5 text-foreground text-[10px] rounded-lg px-2 py-1 border border-white/10 outline-none"
                            />
                            <span className="text-[10px] text-muted-foreground">-</span>
                            <input
                              type="time"
                              value={hours[d].close}
                              onChange={e => setHours(prev => ({ ...prev, [d]: { ...prev[d], close: e.target.value } }))}
                              className="bg-white/5 text-foreground text-[10px] rounded-lg px-2 py-1 border border-white/10 outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={saveLocation}
                  disabled={saving || !name.trim()}
                  className="w-full py-3 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground disabled:opacity-40 flex items-center justify-center gap-2"
                 aria-label="Loading" title="Loading">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? "Update Location" : "Add Location"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProviderNav />
    </div>
  );
}
