import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import {
  Home, Building2, Hotel, ArrowLeft, Loader2, QrCode, Heart,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

const PROPERTY_TYPES = [
  { value: "airbnb", label: "Airbnb", icon: Home, desc: "Short-term rental" },
  { value: "guesthouse", label: "Guesthouse", icon: Building2, desc: "Guest lodge / B&B" },
  { value: "hotel", label: "Hotel", icon: Hotel, desc: "Hotel or resort" },
] as const;

export default function HostRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    hostName: "",
    propertyName: "",
    propertyType: "airbnb" as string,
    suburb: "",
    city: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hostName.trim()) {
      setError("Your name is required");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API}/api/guest/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        // Store code for dashboard
        localStorage.setItem("bion_host_code", data.data.code);
        navigate("/host/dashboard");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error - please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-obsidian text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet/20 to-obsidian" />
        <div className="relative px-5 pt-8 pb-6">
          <button onClick={() => navigate(-1)} className="mb-6 p-2 -ml-2 rounded-xl hover:bg-white/5" title="navigate(-1)} className='mb-6 p-2 -ml-2 rounded-xl hover:bg-white/5'>" aria-label="navigate(-1)} className='mb-6 p-2 -ml-2 rounded-xl hover:bg-white/5'>">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-indigo-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-wider text-white/80">BION</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Become a Wellness Partner</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Get a QR code your guests can scan to find gyms, spas, doctors &amp; more nearby. Free for hosts.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 pb-10 space-y-5">
        {/* Property Type Selector */}
        <div>
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 block">
            Property type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PROPERTY_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => update("propertyType", pt.value)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  form.propertyType === pt.value
                    ? "border-violet bg-violet/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
               title="update('propertyType', pt.value)} className= `} >" aria-label="update('propertyType', pt.value)} className= `} >">
                <pt.icon className={`w-5 h-5 mx-auto mb-1 ${form.propertyType === pt.value ? "text-violet" : "text-white/50"}`} />
                <span className="text-xs font-semibold">{pt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text fields */}
        <div className="space-y-4">
          <InputField label="Your name *" placeholder="e.g. Sarah" value={form.hostName} onChange={(v) => update("hostName", v)} />
          <InputField label="Property name" placeholder="e.g. Sandton Sunset Suite" value={form.propertyName} onChange={(v) => update("propertyName", v)} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Suburb" placeholder="e.g. Sandton" value={form.suburb} onChange={(v) => update("suburb", v)} />
            <InputField label="City" placeholder="e.g. Johannesburg" value={form.city} onChange={(v) => update("city", v)} />
          </div>
          <InputField label="Email" placeholder="you@email.com" type="email" value={form.email} onChange={(v) => update("email", v)} />
          <InputField label="Phone" placeholder="+27 XX XXX XXXX" type="tel" value={form.phone} onChange={(v) => update("phone", v)} />
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet to-indigo-600 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              Get My QR Code
            </>
          )}
        </motion.button>

        <p className="text-[11px] text-white/30 text-center leading-relaxed">
          Free forever. No credit card. Your guests get free access to wellness services near your property.
        </p>
      </form>
    </div>
  );
}

function InputField({
  label, placeholder, value, onChange, type = "text",
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-violet/50 transition-colors"
      />
    </div>
  );
}
