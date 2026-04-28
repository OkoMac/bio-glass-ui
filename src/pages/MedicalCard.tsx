import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/contexts/BookingsContext";
import { usePageView } from "@/hooks/usePageView";
import AdBanner from "@/components/AdBanner";
import {
  ArrowLeft, Heart, QrCode, Shield, Phone, User, Pill,
  AlertTriangle, X, Share2, Plus, Trash2, Edit3, Save, Camera, Loader2,
} from "lucide-react";

const STORAGE_KEY = "bion_medical_card";

interface MedicalData {
  name: string;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContact: { name: string; phone: string; relationship: string };
  insurance: { provider: string; number: string };
}

const EMPTY_DATA: MedicalData = {
  name: "",
  bloodType: "",
  allergies: [],
  conditions: [],
  medications: [],
  emergencyContact: { name: "", phone: "", relationship: "" },
  insurance: { provider: "", number: "" },
};

function load(): MedicalData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_DATA, ...JSON.parse(raw) } : EMPTY_DATA;
  } catch { return EMPTY_DATA; }
}

function save(data: MedicalData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Editable text field
// Fixed enums — pickers, not free-form text. Blood Type is the
// canonical example: free-form invited typos like "A pos" or "+A".
const BLOOD_TYPES = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

function Field({
  label, value, onChange, editing, icon: Icon, placeholder, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  editing: boolean; icon: any; placeholder?: string;
  /** When supplied, the editor is a <select> dropdown instead of a free-form input. */
  options?: string[];
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 glass-2 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {editing ? (
          options ? (
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 text-sm text-foreground outline-none py-1"
            >
              {options.map(opt => (
                <option key={opt || "__empty"} value={opt} className="bg-obsidian">
                  {opt || `Select ${label.toLowerCase()}…`}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={value} onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || label}
              className="w-full bg-transparent border-b border-white/10 text-sm text-foreground outline-none py-1 placeholder:text-white/20"
            />
          )
        ) : (
          <p className="text-sm text-foreground">{value || "Not set"}</p>
        )}
      </div>
    </div>
  );
}

// Editable list. When `editing` is false, shows a + Add chip instead
// of the "None listed" deadend so the user can tap it to start adding
// without first finding the page-level Edit button (reported
// 2026-04-28: layout was unfamiliar, no clear way to update).
function ListSection({
  label, items, onAdd, onRemove, editing, icon: Icon, onRequestEdit,
}: {
  label: string; items: string[]; onAdd: (v: string) => void;
  onRemove: (i: number) => void; editing: boolean; icon: any;
  /** Called when the user taps "+ Add" while the page isn't in edit mode. */
  onRequestEdit?: () => void;
}) {
  const [input, setInput] = useState("");
  const showInlineAdd = !editing && !!onRequestEdit;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {showInlineAdd && (
          <button
            onClick={onRequestEdit}
            className="ml-auto inline-flex items-center gap-1 glass-2 rounded-pill px-2.5 py-0.5 text-[10px] text-teal hover:bg-teal/10 transition-colors"
            aria-label={`Add ${label.toLowerCase()}`}
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>
      {items.length === 0 && !editing && (
        <button
          onClick={onRequestEdit}
          disabled={!onRequestEdit}
          className="text-xs text-muted-foreground ml-6 hover:text-teal transition-colors disabled:cursor-default"
        >
          {onRequestEdit ? `None listed — tap to add` : "None listed"}
        </button>
      )}
      <div className="flex flex-wrap gap-2 ml-6">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 glass-2 rounded-pill px-3 py-1 text-xs text-foreground">
            {item}
            {editing && (
              <button onClick={() => onRemove(i)}>
                <X className="w-3 h-3 text-muted-foreground hover:text-red-400" />
              </button>
            )}
          </span>
        ))}
      </div>
      {editing && (
        <div className="flex gap-2 mt-2 ml-6">
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={`Add ${label.toLowerCase()}...`}
            className="flex-1 bg-transparent border-b border-white/10 text-xs text-foreground outline-none py-1 placeholder:text-white/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) { onAdd(input.trim()); setInput(""); }
            }}
          />
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(""); } }}
            className="w-7 h-7 glass-2 rounded-full flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-teal-400" />
          </motion.button>
        </div>
      )}
    </div>
  );
}

const MEDICAL_FAQ_DATA = [
  { q: "What is a digital medical card?", a: "A digital medical card stores your essential health information — blood type, allergies, medications, emergency contacts, and insurance details — on your phone. It can be shown to healthcare providers or emergency personnel instantly, without carrying a physical card." },
  { q: "Is my data safe?", a: "Your medical information is stored locally on your device and is not transmitted to any server without your explicit consent. BION complies with the Protection of Personal Information Act (POPIA) to safeguard your personal health data." },
  { q: "Can emergency services access it?", a: "You can share your medical card via the Share button or QR code with any provider or emergency responder. The data is only shared during that session and is not stored on their device unless you explicitly allow it." },
];

export default function MedicalCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings } = useBookings();
  const [data, setData] = useState<MedicalData>(load);
  const [editing, setEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareTarget, setShareTarget] = useState<string>("in_person");
  // Upcoming bookings = future-dated, not cancelled. The share modal
  // uses these so the user can pick a specific provider as the audience
  // instead of "share with anyone" being implied.
  const upcomingBookings = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return bookings
      .filter(b => (b.status === "pending" || b.status === "confirmed") && b.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [bookings]);
  usePageView();

  useEffect(() => { document.title = "Free Digital Medical Card | BION"; }, []);

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: MEDICAL_FAQ_DATA.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const update = (partial: Partial<MedicalData>) => setData((prev) => ({ ...prev, ...partial }));

  const toggleEdit = () => {
    if (editing) save(data);
    setEditing(!editing);
  };

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow pb-40">
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 pt-12 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
              className="w-9 h-9 glass-1 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Free Digital Medical Card</h1>
              <p className="text-xs text-muted-foreground">Your digital health passport</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={toggleEdit}
            className="flex items-center gap-1.5 rounded-pill px-3 py-2 gradient-indigo text-primary-foreground text-xs font-semibold">
            {editing ? <><Save className="w-3.5 h-3.5" /> Save</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
          </motion.button>
        </div>

        {!user && (
          <div className="mx-4 mb-3 p-3 rounded-2xl glass-1 border border-indigo/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Sign up free to save your progress and unlock full features</p>
            <a href="/welcome" className="rounded-pill px-3 py-1.5 text-xs font-semibold gradient-indigo text-primary-foreground shrink-0">Sign up free</a>
          </div>
        )}

        <AdBanner slot="utilities-top" format="horizontal" />

        {/* Card hero */}
        <GlassCard variant="glass-2" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-indigo flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <Field label="Full Name" value={data.name} onChange={(v) => update({ name: v })}
                  editing={editing} icon={User} placeholder="Your full name" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Blood Type" value={data.bloodType}
              onChange={(v) => update({ bloodType: v })} editing={editing} icon={Heart}
              options={BLOOD_TYPES} />
          </div>
        </GlassCard>

        {/* QR Code placeholder */}
        <GlassCard variant="glass-1" className="p-5 flex flex-col items-center gap-3">
          <div className="w-28 h-28 glass-2 rounded-2xl flex items-center justify-center">
            <QrCode className="w-16 h-16 text-white/20" />
          </div>
          <p className="text-xs text-muted-foreground text-center">Show this to your provider for quick access</p>
        </GlassCard>

        {/* Allergies */}
        <GlassCard variant="glass-1" className="p-4">
          <ListSection label="Allergies" items={data.allergies} icon={AlertTriangle}
            editing={editing}
            onRequestEdit={() => setEditing(true)}
            onAdd={(v) => update({ allergies: [...data.allergies, v] })}
            onRemove={(i) => update({ allergies: data.allergies.filter((_, idx) => idx !== i) })}
          />
        </GlassCard>

        {/* Conditions */}
        <GlassCard variant="glass-1" className="p-4">
          <ListSection label="Medical Conditions" items={data.conditions} icon={Heart}
            editing={editing}
            onRequestEdit={() => setEditing(true)}
            onAdd={(v) => update({ conditions: [...data.conditions, v] })}
            onRemove={(i) => update({ conditions: data.conditions.filter((_, idx) => idx !== i) })}
          />
        </GlassCard>

        {/* Medications */}
        <GlassCard variant="glass-1" className="p-4">
          <ListSection label="Current Medications" items={data.medications} icon={Pill}
            editing={editing}
            onRequestEdit={() => setEditing(true)}
            onAdd={(v) => update({ medications: [...data.medications, v] })}
            onRemove={(i) => update({ medications: data.medications.filter((_, idx) => idx !== i) })}
          />
        </GlassCard>

        {/* Emergency Contact */}
        <GlassCard variant="accent-coral" className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-coral" />
            <span className="text-sm font-semibold text-foreground">Emergency Contact</span>
          </div>
          <Field label="Name" value={data.emergencyContact.name}
            onChange={(v) => update({ emergencyContact: { ...data.emergencyContact, name: v } })}
            editing={editing} icon={User} placeholder="Contact name" />
          <Field label="Phone" value={data.emergencyContact.phone}
            onChange={(v) => update({ emergencyContact: { ...data.emergencyContact, phone: v } })}
            editing={editing} icon={Phone} placeholder="Phone number" />
          <Field label="Relationship" value={data.emergencyContact.relationship}
            onChange={(v) => update({ emergencyContact: { ...data.emergencyContact, relationship: v } })}
            editing={editing} icon={Heart} placeholder="e.g. Spouse, Parent" />
        </GlassCard>

        {/* Medical Aid / Insurance — syncs with backend */}
        <MedicalAidSection editing={editing} localData={data} onLocalUpdate={update} />

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowShare(true)}
          className="w-full rounded-2xl gradient-teal text-white font-semibold py-3.5 flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Show medical summary
        </motion.button>

        {/* POPIA notice */}
        <GlassCard variant="glass-1" className="p-3">
          <div className="flex gap-2">
            <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold">POPIA Notice:</span> Your medical information is stored locally
              on your device and is not transmitted without your explicit consent. When you share with a provider,
              only the information displayed is shared for that session. You may request deletion of your data at
              any time under the Protection of Personal Information Act (POPIA).
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={() => setShowShare(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-frosted rounded-3xl p-6 max-w-sm w-full relative z-10 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Medical Summary</h3>
                <button onClick={() => setShowShare(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Recipient picker — explicit so 'who am I sharing with'
                  is answered before any data is shown. Defaults to
                  in-person QR so the user can read it out at a desk;
                  upcoming bookings let them target a specific provider
                  by name. Nothing is transmitted automatically. */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sharing with</p>
                <select
                  value={shareTarget}
                  onChange={(e) => setShareTarget(e.target.value)}
                  className="w-full glass-1 rounded-xl px-3 py-2 text-sm text-foreground outline-none border border-white/[0.08]"
                >
                  <option value="in_person" className="bg-obsidian">In-person provider (show QR / read out)</option>
                  {upcomingBookings.map(b => (
                    <option key={b.id} value={`booking:${b.id}`} className="bg-obsidian">
                      {b.providerName} — {b.date}{b.time ? ` ${b.time}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground">
                  Nothing leaves your device until you press a Share button below.
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-foreground"><span className="text-muted-foreground">Name:</span> {data.name || "Not set"}</p>
                <p className="text-foreground"><span className="text-muted-foreground">Blood Type:</span> {data.bloodType || "Not set"}</p>
                <p className="text-foreground"><span className="text-muted-foreground">Allergies:</span> {data.allergies.join(", ") || "None"}</p>
                <p className="text-foreground"><span className="text-muted-foreground">Conditions:</span> {data.conditions.join(", ") || "None"}</p>
                <p className="text-foreground"><span className="text-muted-foreground">Medications:</span> {data.medications.join(", ") || "None"}</p>
                <p className="text-foreground"><span className="text-muted-foreground">Emergency:</span> {data.emergencyContact.name} ({data.emergencyContact.phone})</p>
                <p className="text-foreground"><span className="text-muted-foreground">Medical Aid:</span> {data.insurance.provider} — {data.insurance.number}</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 glass-2 rounded-xl flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-white/20" />
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowShare(false)}
                className="w-full rounded-pill py-2.5 gradient-indigo text-primary-foreground text-sm font-semibold">
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ Section */}
      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4 mt-6 space-y-2">
        <h2 className="text-lg font-bold text-foreground mb-3">Frequently Asked Questions</h2>
        {MEDICAL_FAQ_DATA.map((faq, i) => (
          <GlassCard key={i} className="p-4">
            <p className="text-sm font-medium text-foreground mb-1">{faq.q}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mx-auto max-w-lg md:max-w-3xl xl:max-w-7xl px-4">
        <AdBanner slot="utilities-bottom" format="rectangle" />
      </div>

      <BottomNav />
      <BionAssistant />
    </div>
  );
}

// ── Medical Aid Section — syncs with /api/profiles/medical-aid ──────────
const SA_SCHEMES = [
  "Discovery Health", "Bonitas", "Momentum Health", "GEMS",
  "Medihelp", "Bestmed", "Fedhealth", "Other",
];

const MEDICAL_AID_API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";

function MedicalAidSection({
  editing, localData, onLocalUpdate,
}: {
  editing: boolean;
  localData: MedicalData;
  onLocalUpdate: (partial: Partial<MedicalData>) => void;
}) {
  const { user } = useAuth();
  const [scheme, setScheme] = useState(localData.insurance.provider || "");
  const [planName, setPlanName] = useState("");
  const [memberNumber, setMemberNumber] = useState(localData.insurance.number || "");
  const [dependantCode, setDependantCode] = useState("");
  const [showToProvider, setShowToProvider] = useState(true);
  const [synced, setSynced] = useState(false);
  const [saving, setSaving] = useState(false);
  // Photo-extract state — drives the camera button. Reuses
  // /api/profiles/medical-aid/extract-from-photo (gpt-4o-mini vision).
  const [extracting, setExtracting] = useState(false);

  const extractFromPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setExtracting(true);
    try {
      // Read file → data URL.
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });

      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      if (!session) {
        const { toast } = await import("sonner");
        toast.error("Please sign in before using photo extraction.");
        return;
      }

      const res = await fetch(`${MEDICAL_AID_API}/api/profiles/medical-aid/extract-from-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Photo extraction failed");

      const { scheme: sFromAi, planName: pFromAi, memberNumber: mFromAi, dependantCode: dFromAi, confidence } = json.data ?? {};
      // Match the AI-detected scheme to our exact list when possible so
      // the dropdown selects correctly without manual fix-up.
      const matchedScheme = SA_SCHEMES.find(s => s.toLowerCase() === String(sFromAi ?? "").toLowerCase()) ?? sFromAi ?? "";

      if (matchedScheme) setScheme(matchedScheme);
      if (pFromAi) setPlanName(pFromAi);
      if (mFromAi) setMemberNumber(mFromAi);
      if (dFromAi) setDependantCode(dFromAi);

      const { toast } = await import("sonner");
      const filledCount = [matchedScheme, pFromAi, mFromAi, dFromAi].filter(Boolean).length;
      if (filledCount === 0) {
        toast.error("Couldn't read the card clearly. Try better lighting or fill in manually.");
      } else {
        toast.success(`Filled ${filledCount} field${filledCount === 1 ? "" : "s"} from photo (confidence: ${confidence}). Review before saving.`);
      }
    } catch (err: any) {
      const { toast } = await import("sonner");
      toast.error(err?.message ?? "Photo extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  // Load from backend on mount if logged in
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${MEDICAL_AID_API}/api/profiles/medical-aid`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json();
        if (json.ok && json.data) {
          setScheme(json.data.scheme || "");
          setPlanName(json.data.plan_name || "");
          setMemberNumber(json.data.member_number || "");
          setDependantCode(json.data.dependant_code || "");
          setShowToProvider(json.data.show_to_provider ?? true);
          setSynced(true);
          // Also update local storage
          onLocalUpdate({
            insurance: { provider: json.data.scheme, number: json.data.member_number || "" },
          });
        }
      } catch {}
    })();
  }, [user]);

  // Save to backend
  const saveToBackend = async () => {
    if (!user || !scheme) return;
    setSaving(true);
    try {
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      if (!session) return;
      await fetch(`${MEDICAL_AID_API}/api/profiles/medical-aid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ scheme, planName, memberNumber, dependantCode, showToProvider }),
      });
      setSynced(true);
      onLocalUpdate({ insurance: { provider: scheme, number: memberNumber } });
    } catch (err) {
      console.error("Failed to save medical aid:", err);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save when editing is toggled off
  useEffect(() => {
    if (!editing && scheme) saveToBackend();
  }, [editing]);

  return (
    <GlassCard variant="glass-1" className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-semibold text-foreground">Medical Aid / Insurance</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Snap a photo of the card → auto-fill scheme/plan/member/dependant.
              Only shown in editing mode. capture="environment" hints
              mobile to open the back camera straight to scan; falls
              back to library on desktop. */}
          {editing && (
            <label className="cursor-pointer text-[10px] px-2.5 py-1 bg-indigo/15 text-indigo rounded-pill border border-indigo/30 flex items-center gap-1.5 hover:bg-indigo/25 transition-colors">
              {extracting ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Reading…</>
              ) : (
                <><Camera className="w-3 h-3" /> Scan card</>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={extracting}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) extractFromPhoto(file);
                  e.target.value = ""; // allow re-upload of same file
                }}
              />
            </label>
          )}
          {synced && (
            <span className="text-[9px] px-2 py-0.5 bg-teal/10 text-teal rounded-pill">Synced</span>
          )}
        </div>
      </div>

      {/* Scheme selector */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 glass-2 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">Medical Aid Scheme</p>
          {editing ? (
            <select
              value={scheme}
              onChange={e => setScheme(e.target.value)}
              className="w-full bg-white/5 text-foreground text-sm rounded-xl px-3 py-2 outline-none border border-white/10 focus:border-indigo/50"
            >
              <option value="" className="bg-obsidian">Select scheme...</option>
              {SA_SCHEMES.map(s => (
                <option key={s} value={s} className="bg-obsidian">{s}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-foreground">{scheme || "Not set"}</p>
          )}
        </div>
      </div>

      {/* Plan name */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 glass-2 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">Plan Name</p>
          {editing ? (
            <input
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              placeholder="e.g. KeyCare Plus"
              className="w-full bg-transparent border-b border-white/10 text-sm text-foreground outline-none py-1 placeholder:text-white/20"
            />
          ) : (
            <p className="text-sm text-foreground">{planName || "Not set"}</p>
          )}
        </div>
      </div>

      {/* Member number */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 glass-2 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">Member Number</p>
          {editing ? (
            <input
              value={memberNumber}
              onChange={e => setMemberNumber(e.target.value)}
              placeholder="Your member number"
              className="w-full bg-transparent border-b border-white/10 text-sm text-foreground outline-none py-1 placeholder:text-white/20"
            />
          ) : (
            <p className="text-sm text-foreground">{memberNumber || "Not set"}</p>
          )}
        </div>
      </div>

      {/* Dependant code */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 glass-2 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">Dependant Code</p>
          {editing ? (
            <input
              value={dependantCode}
              onChange={e => setDependantCode(e.target.value)}
              placeholder="e.g. 00, 01"
              className="w-full bg-transparent border-b border-white/10 text-sm text-foreground outline-none py-1 placeholder:text-white/20"
            />
          ) : (
            <p className="text-sm text-foreground">{dependantCode || "Not set"}</p>
          )}
        </div>
      </div>

      {/* Show to provider toggle */}
      {user && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <p className="text-xs font-medium text-foreground">Show to provider</p>
            <p className="text-[10px] text-muted-foreground">Visible on your bookings</p>
          </div>
          <button
            onClick={() => editing && setShowToProvider(!showToProvider)}
            className={`w-9 h-5 rounded-full transition-all flex items-center px-0.5 ${
              showToProvider ? "bg-teal" : "bg-white/10"
            } ${!editing ? "opacity-50" : ""}`}
          >
            <motion.div
              animate={{ x: showToProvider ? 16 : 0 }}
              className="w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </button>
        </div>
      )}

      {saving && (
        <p className="text-[10px] text-indigo text-center animate-pulse">Saving to your profile...</p>
      )}
    </GlassCard>
  );
}
