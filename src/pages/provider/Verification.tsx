import { useState, useRef } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import BionAssistant from "@/components/BionAssistant";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Upload, FileText, Shield, CheckCircle, AlertCircle,
  Clock, Camera, X, Eye, Trash2, CreditCard, Award, Building2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Document {
  id: string;
  type: string;
  name: string;
  status: "pending" | "verified" | "rejected";
  uploadedAt: string;
  preview?: string;
}

const REQUIRED_DOCS = [
  { type: "sa_id", label: "South African ID / Passport", desc: "Clear copy of your SA ID book, smart ID card, or passport", icon: CreditCard, required: true },
  { type: "professional_reg", label: "Professional Registration", desc: "HPCSA, SANC, SAPC, AHPCSA, or relevant body registration certificate", icon: Award, required: true },
  { type: "qualifications", label: "Qualifications", desc: "Degree, diploma, or certification relevant to your services", icon: FileText, required: true },
  { type: "insurance", label: "Professional Indemnity Insurance", desc: "Current proof of professional indemnity or liability insurance", icon: Shield, required: false },
  { type: "business_reg", label: "Business Registration (CIPC)", desc: "Company registration certificate if operating as a business", icon: Building2, required: false },
  { type: "proof_address", label: "Proof of Address", desc: "Utility bill or bank statement (not older than 3 months)", icon: FileText, required: false },
];

const STORAGE_KEY = "bion_provider_docs";

export default function ProviderVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocType, setActiveDocType] = useState<string | null>(null);

  const [documents, setDocuments] = useState<Document[]>(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [regNumber, setRegNumber] = useState(() => localStorage.getItem("bion_provider_reg_number") ?? "");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDocType) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newDoc: Document = {
        id: `doc_${Date.now()}`,
        type: activeDocType,
        name: file.name,
        status: "pending",
        uploadedAt: new Date().toLocaleDateString("en-ZA"),
        preview: file.type.startsWith("image/") ? (reader.result as string) : undefined,
      };
      const updated = [...documents.filter(d => d.type !== activeDocType), newDoc];
      setDocuments(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setActiveDocType(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const deleteDoc = (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const saveRegNumber = () => {
    localStorage.setItem("bion_provider_reg_number", regNumber);
  };

  const uploadedTypes = new Set(documents.map(d => d.type));
  const requiredDone = REQUIRED_DOCS.filter(d => d.required).every(d => uploadedTypes.has(d.type));
  const totalUploaded = documents.length;
  const totalRequired = REQUIRED_DOCS.filter(d => d.required).length;
  const verifiedCount = documents.filter(d => d.status === "verified").length;

  return (
    <div className="min-h-screen bg-obsidian bg-obsidian-glow md:pl-56">
      <div className="mx-auto max-w-2xl xl:max-w-7xl px-4 pt-12 pb-28 md:pb-8 md:pt-8 space-y-5">
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />

        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 glass-1 rounded-full flex items-center justify-center md:hidden">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Verification</h1>
            <p className="text-xs text-muted-foreground">Upload documents to verify your practice</p>
          </div>
        </div>

        {/* Status card */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              requiredDone ? "bg-teal/10" : "bg-amber/10"
            }`}>
              {requiredDone
                ? <CheckCircle className="w-6 h-6 text-teal" />
                : <Clock className="w-6 h-6 text-amber" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                {requiredDone ? "Documents Submitted" : "Verification Pending"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalUploaded} of {REQUIRED_DOCS.length} documents uploaded
                {verifiedCount > 0 && ` · ${verifiedCount} verified`}
              </p>
              <div className="h-1.5 rounded-full bg-white/5 mt-2">
                <div className={`h-full rounded-full transition-all ${requiredDone ? "bg-teal" : "bg-amber"}`}
                  style={{ width: `${Math.round((totalUploaded / REQUIRED_DOCS.length) * 100)}%` }} />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Registration number */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-indigo" />
            <p className="text-sm font-semibold text-foreground">Professional Registration Number</p>
          </div>
          <div className="flex gap-2">
            <input value={regNumber}
              onChange={e => setRegNumber(e.target.value)}
              onBlur={saveRegNumber}
              placeholder="e.g. MP 0123456 (HPCSA)"
              className="flex-1 px-3 py-2.5 glass-1 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-white/08 focus:border-indigo/40 transition-colors" />
            <button onClick={saveRegNumber}
              className="px-4 py-2.5 rounded-xl gradient-indigo text-white text-xs font-semibold">
              Save
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            HPCSA, SANC, SAPC, AHPCSA, or industry-specific registration number
          </p>
        </GlassCard>

        {/* Document list */}
        <div className="space-y-2">
          {REQUIRED_DOCS.map(docType => {
            const uploaded = documents.find(d => d.type === docType.type);
            const Icon = docType.icon;

            return (
              <GlassCard key={docType.type} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    uploaded?.status === "verified" ? "bg-teal/10" :
                    uploaded ? "bg-amber/10" : "bg-white/[0.03]"
                  }`}>
                    {uploaded?.status === "verified"
                      ? <CheckCircle className="w-4 h-4 text-teal" />
                      : uploaded
                      ? <Clock className="w-4 h-4 text-amber" />
                      : <Icon className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{docType.label}</p>
                      {docType.required && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-coral/10 text-coral border border-coral/20">Required</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{docType.desc}</p>

                    {uploaded && (
                      <div className="mt-2 flex items-center gap-2">
                        {uploaded.preview && (
                          <img src={uploaded.preview} alt={uploaded.name} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{uploaded.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Uploaded {uploaded.uploadedAt} ·{" "}
                            <span className={
                              uploaded.status === "verified" ? "text-teal" :
                              uploaded.status === "rejected" ? "text-coral" : "text-amber"
                            }>
                              {uploaded.status === "verified" ? "Verified" :
                               uploaded.status === "rejected" ? "Rejected" : "Under review"}
                            </span>
                          </p>
                        </div>
                        <button onClick={() => deleteDoc(uploaded.id)}
                          className="text-muted-foreground hover:text-coral transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => { setActiveDocType(docType.type); fileInputRef.current?.click(); }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 ${
                      uploaded
                        ? "glass-1 text-muted-foreground hover:text-foreground"
                        : "bg-gradient-to-r from-indigo to-violet text-white"
                    }`}>
                    <Upload className="w-3 h-3 inline mr-1" />
                    {uploaded ? "Replace" : "Upload"}
                  </motion.button>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Info card */}
        <GlassCard variant="accent-indigo" className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Why we verify</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Verification protects both you and your clients. Verified providers receive a badge on their profile, appear higher in search results, and build trust with potential clients. Your documents are stored securely and processed in compliance with POPIA.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <BionAssistant />
      <ProviderNav />
    </div>
  );
}
