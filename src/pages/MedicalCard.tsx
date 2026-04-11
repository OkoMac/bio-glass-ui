import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import BionAssistant from "@/components/BionAssistant";
import {
  ArrowLeft, Heart, QrCode, Shield, Phone, User, Pill,
  AlertTriangle, X, Share2, Plus, Trash2, Edit3, Save,
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
function Field({
  label, value, onChange, editing, icon: Icon, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  editing: boolean; icon: any; placeholder?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 glass-2 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {editing ? (
          <input
            value={value} onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || label}
            className="w-full bg-transparent border-b border-white/10 text-sm text-foreground outline-none py-1 placeholder:text-white/20"
          />
        ) : (
          <p className="text-sm text-foreground">{value || "Not set"}</p>
        )}
      </div>
    </div>
  );
}

// Editable list
function ListSection({
  label, items, onAdd, onRemove, editing, icon: Icon,
}: {
  label: string; items: string[]; onAdd: (v: string) => void;
  onRemove: (i: number) => void; editing: boolean; icon: any;
}) {
  const [input, setInput] = useState("");
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      {items.length === 0 && !editing && (
        <p className="text-xs text-muted-foreground ml-6">None listed</p>
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

export default function MedicalCard() {
  const navigate = useNavigate();
  const [data, setData] = useState<MedicalData>(load);
  const [editing, setEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);

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
              <h1 className="text-2xl font-bold text-foreground">Medical Card</h1>
              <p className="text-xs text-muted-foreground">Your digital health passport</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={toggleEdit}
            className="flex items-center gap-1.5 rounded-pill px-3 py-2 gradient-indigo text-primary-foreground text-xs font-semibold">
            {editing ? <><Save className="w-3.5 h-3.5" /> Save</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
          </motion.button>
        </div>

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
              onChange={(v) => update({ bloodType: v })} editing={editing} icon={Heart} placeholder="e.g. O+" />
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
            onAdd={(v) => update({ allergies: [...data.allergies, v] })}
            onRemove={(i) => update({ allergies: data.allergies.filter((_, idx) => idx !== i) })}
          />
        </GlassCard>

        {/* Conditions */}
        <GlassCard variant="glass-1" className="p-4">
          <ListSection label="Medical Conditions" items={data.conditions} icon={Heart}
            editing={editing}
            onAdd={(v) => update({ conditions: [...data.conditions, v] })}
            onRemove={(i) => update({ conditions: data.conditions.filter((_, idx) => idx !== i) })}
          />
        </GlassCard>

        {/* Medications */}
        <GlassCard variant="glass-1" className="p-4">
          <ListSection label="Current Medications" items={data.medications} icon={Pill}
            editing={editing}
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

        {/* Insurance */}
        <GlassCard variant="glass-1" className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-semibold text-foreground">Medical Aid / Insurance</span>
          </div>
          <Field label="Provider" value={data.insurance.provider}
            onChange={(v) => update({ insurance: { ...data.insurance, provider: v } })}
            editing={editing} icon={Shield} placeholder="Medical aid name" />
          <Field label="Member Number" value={data.insurance.number}
            onChange={(v) => update({ insurance: { ...data.insurance, number: v } })}
            editing={editing} icon={Shield} placeholder="Member number" />
        </GlassCard>

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowShare(true)}
          className="w-full rounded-2xl gradient-teal text-white font-semibold py-3.5 flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Share with Provider
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

      <BottomNav />
      <BionAssistant />
    </div>
  );
}
