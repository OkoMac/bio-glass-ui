import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  providerName?: string;
  onClose: () => void;
}

export default function BookingRequestForm({ providerName = "", onClose }: Props) {
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    providerName,
    providerEmail: "",
    providerPhone: "",
    serviceDescription: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.clientName || !form.clientEmail || !form.providerName || !form.serviceDescription) {
      setError("Please fill in all required fields.");
      return;
    }
    setBusy(true);
    setError("");

    const { error: dbError } = await supabase.from("booking_requests").insert({
      client_name: form.clientName,
      client_email: form.clientEmail,
      client_phone: form.clientPhone || null,
      provider_name: form.providerName,
      provider_email: form.providerEmail || null,
      provider_phone: form.providerPhone || null,
      service_description: form.serviceDescription,
      preferred_date: form.preferredDate || null,
      preferred_time: form.preferredTime || null,
      notes: form.notes || null,
    } as any);

    if (dbError) {
      setError("Failed to submit. Please try again.");
      setBusy(false);
      return;
    }

    setBusy(false);
    setDone(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg glass-2 rounded-t-[2rem] md:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
            {done ? "Request Submitted!" : "Request a Booking"}
          </h2>
          <button onClick={onClose} className="p-2 glass-1 rounded-full" aria-label="Close" title="Close">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <CheckCircle className="w-16 h-16 text-teal mx-auto" />
              <p className="text-foreground font-medium">Your booking request has been submitted!</p>
              <p className="text-sm text-muted-foreground">
                Our sales team will contact the provider and get back to you within 24 hours.
              </p>
              <button onClick={onClose} className="rounded-pill px-6 py-3 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta" title="Done" aria-label="Done">
                Done
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" className="space-y-4">
              <p className="text-xs text-muted-foreground">
                This provider isn't on BION yet. Submit a request and our team will arrange the booking for you.
              </p>

              {error && <p className="text-xs text-coral">{error}</p>}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Your Name *</label>
                  <input value={form.clientName} onChange={e => update("clientName", e.target.value)}
                    className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
                    placeholder="Your full name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Your Email *</label>
                    <input value={form.clientEmail} onChange={e => update("clientEmail", e.target.value)}
                      type="email" className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
                      placeholder="email@example.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Your Phone</label>
                    <input value={form.clientPhone} onChange={e => update("clientPhone", e.target.value)}
                      type="tel" className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
                      placeholder="072 000 0000" />
                  </div>
                </div>

                <div className="w-full h-px bg-white/[0.06]" />

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Provider / Business Name *</label>
                  <input value={form.providerName} onChange={e => update("providerName", e.target.value)}
                    className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
                    placeholder="e.g. Dr. Smith, Glow Beauty Salon" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Provider Email</label>
                    <input value={form.providerEmail} onChange={e => update("providerEmail", e.target.value)}
                      type="email" className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
                      placeholder="If known" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Provider Phone</label>
                    <input value={form.providerPhone} onChange={e => update("providerPhone", e.target.value)}
                      type="tel" className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
                      placeholder="If known" />
                  </div>
                </div>

                <div className="w-full h-px bg-white/[0.06]" />

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Service Required *</label>
                  <input value={form.serviceDescription} onChange={e => update("serviceDescription", e.target.value)}
                    className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5"
                    placeholder="e.g. Dental check-up, Massage therapy" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Preferred Date</label>
                    <input value={form.preferredDate} onChange={e => update("preferredDate", e.target.value)}
                      type="date" className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground outline-none border border-white/5" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Preferred Time</label>
                    <input value={form.preferredTime} onChange={e => update("preferredTime", e.target.value)}
                      type="time" className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground outline-none border border-white/5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Additional Notes</label>
                  <textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2}
                    className="w-full glass-1 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/5 resize-none"
                    placeholder="Any special requirements..." />
                </div>
              </div>

              <button onClick={handleSubmit} disabled={busy}
                className="w-full rounded-pill py-4 text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta flex items-center justify-center gap-2 disabled:opacity-60" aria-label="Loading" title="Loading">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Booking Request</>}
              </button>

              <p className="text-[10px] text-muted-foreground text-center">
                A 5% platform fee applies to both client and provider for bookings made through BION.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
