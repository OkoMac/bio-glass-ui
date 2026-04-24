import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import RepNav from "@/components/RepNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

const CATEGORIES = ["medical", "beauty", "fitness", "wellness", "veterinary"];
const SOURCES = ["Manual", "Directory", "Referral"];

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.session?.access_token ?? ""}`,
  };
}

export default function AddLead() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Medical");
  const [location, setLocation] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("Manual");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!businessName.trim() || !contactName.trim() || !phone.trim()) {
      setError("Business name, contact name, and phone are required.");
      return;
    }
    setSaving(true);
    setError("");

    const lead = {
      id: crypto.randomUUID(),
      business_name: businessName.trim(),
      contact_name: contactName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      category,
      location: location.trim() || undefined,
      suburb: suburb.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
      source,
      stage: "new" as const,
      created_at: new Date().toISOString(),
    };

    // Save to localStorage immediately
    try {
      const all = JSON.parse(localStorage.getItem("bion_crm_leads") ?? "[]");
      all.unshift(lead);
      localStorage.setItem("bion_crm_leads", JSON.stringify(all));
    } catch { /* empty */ }

    // Send to API
    try {
      const headers = await authHeaders();
      await fetch(`${API}/api/ranger-crm/leads`, {
        method: "POST",
        headers,
        body: JSON.stringify(lead),
      });
    } catch { /* offline — local already saved */ }

    setSaving(false);
    navigate("/rep/crm");
  }

  const inputCls = "w-full glass-1 rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5";

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow">
      <div className="mx-auto max-w-3xl px-4 pt-12 pb-28 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/rep/crm")}
            className="w-9 h-9 rounded-xl glass-1 flex items-center justify-center text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Add Lead</h1>
            <p className="text-xs text-muted-foreground">Add a new prospect to your pipeline</p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-1 rounded-xl p-3 text-xs text-coral border border-red-500/20"
          >
            {error}
          </motion.div>
        )}

        <GlassCard className="p-4 space-y-4">
          {/* Business name */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Business Name *</label>
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Glow Skin Clinic"
              className={inputCls}
            />
          </div>

          {/* Contact name */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Contact Name *</label>
            <input
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="e.g. Dr. Thandi Moyo"
              className={inputCls}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Phone *</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +27 82 123 4567"
              className={inputCls}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. thandi@glowclinic.co.za"
              className={inputCls}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-2 block">Category</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <motion.button
                  key={c}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCategory(c)}
                  className={`text-xs px-3 py-1.5 rounded-pill font-medium capitalize ${
                    category === c
                      ? "gradient-indigo text-white"
                      : "glass-1 text-muted-foreground"
                  }`}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Location fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Suburb</label>
              <input
                value={suburb}
                onChange={e => setSuburb(e.target.value)}
                placeholder="e.g. Sandton"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">City</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Johannesburg"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Address / Location</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. 12 Rivonia Rd"
              className={inputCls}
            />
          </div>

          {/* Source */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-2 block">Source</label>
            <div className="flex gap-2">
              {SOURCES.map(s => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSource(s)}
                  className={`text-xs px-3 py-1.5 rounded-pill font-medium ${
                    source === s
                      ? "gradient-teal text-white"
                      : "glass-1 text-muted-foreground"
                  }`}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any initial notes about this lead..."
              className={inputCls + " resize-none"}
            />
          </div>
        </GlassCard>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-pill text-sm font-semibold gradient-indigo text-white shadow-cta flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Lead"}
        </motion.button>
      </div>

      <RepNav />
    </div>
  );
}
