import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { validateSaId, SaIdResult } from "@/lib/saIdValidator";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle, Clock, AlertCircle, Upload, Camera,
  FileText, Building2, ChevronRight, Shield,
} from "lucide-react";

type VerificationStatus = "unverified" | "pending" | "verified";

const STORAGE_KEY = "bion_provider_verification";

interface VerificationData {
  status: VerificationStatus;
  saIdNumber?: string;
  selfieBase64?: string;
  qualificationBase64?: string;
  qualificationName?: string;
  submittedAt?: string;
}

function loadVerification(): VerificationData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { status: "unverified" };
}

function saveVerification(data: VerificationData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const statusConfig: Record<VerificationStatus, { label: string; color: string; bg: string; Icon: typeof CheckCircle }> = {
  unverified: { label: "Unverified", color: "text-coral", bg: "glass-accent-coral", Icon: AlertCircle },
  pending:    { label: "Pending Review", color: "text-amber", bg: "glass-accent-amber", Icon: Clock },
  verified:   { label: "Verified", color: "text-teal", bg: "glass-accent-teal", Icon: CheckCircle },
};

export default function ProviderVerification() {
  const navigate = useNavigate();
  const [data, setData] = useState<VerificationData>(loadVerification);

  // SA ID
  const [idInput, setIdInput] = useState(data.saIdNumber ?? "");
  const [idResult, setIdResult] = useState<SaIdResult | null>(null);

  // Files
  const selfieRef = useRef<HTMLInputElement>(null);
  const qualRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (idInput.replace(/[\s-]/g, "").length >= 13) {
      setIdResult(validateSaId(idInput));
    } else {
      setIdResult(null);
    }
  }, [idInput]);

  const update = (partial: Partial<VerificationData>) => {
    const next = { ...data, ...partial };
    setData(next);
    saveVerification(next);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "selfieBase64" | "qualificationBase64",
    nameField?: "qualificationName",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const partial: Partial<VerificationData> = { [field]: reader.result as string };
      if (nameField && file.name) partial[nameField] = file.name;
      update(partial);
    };
    reader.readAsDataURL(file);
  };

  const canSubmit =
    idResult?.valid &&
    data.selfieBase64 &&
    data.qualificationBase64 &&
    data.status === "unverified";

  const handleSubmit = () => {
    if (!canSubmit) return;
    update({
      status: "pending",
      saIdNumber: idInput.replace(/[\s-]/g, ""),
      submittedAt: new Date().toISOString(),
    });
  };

  // Check if bank is connected
  const bankConnected = (() => {
    try {
      const billing = localStorage.getItem("bion_provider_bank");
      return billing ? JSON.parse(billing)?.connected === true : false;
    } catch {
      return false;
    }
  })();

  const { label, color, bg, Icon } = statusConfig[data.status];

  const steps = [
    {
      num: 1,
      title: "SA ID Number",
      done: idResult?.valid === true,
      content: (
        <div className="space-y-2">
          <input
            value={idInput}
            onChange={(e) => setIdInput(e.target.value.replace(/[^\d\s-]/g, ""))}
            placeholder="e.g. 9001015009087"
            maxLength={15}
            disabled={data.status !== "unverified"}
            className="w-full glass-1 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent disabled:opacity-50"
          />
          <AnimatePresence mode="wait">
            {idResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {idResult.valid ? (
                  <div className="flex items-center gap-2 text-teal text-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>
                      Valid -- DOB: {idResult.details!.dateOfBirth}, {idResult.details!.gender}, {idResult.details!.citizen ? "SA Citizen" : "Permanent Resident"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-coral text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{idResult.error}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ),
    },
    {
      num: 2,
      title: "Selfie Photo",
      done: !!data.selfieBase64,
      content: (
        <div>
          <input
            ref={selfieRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "selfieBase64")}
          />
          {data.selfieBase64 ? (
            <div className="flex items-center gap-3">
              <img src={data.selfieBase64} alt="Selfie" className="w-12 h-12 rounded-xl object-cover" />
              <span className="text-xs text-teal flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Uploaded
              </span>
              {data.status === "unverified" && (
                <button
                  onClick={() => selfieRef.current?.click()}
                  className="text-xs text-indigo font-medium ml-auto"
                 title="selfieRef.current?.click()} className='text-xs text-indigo font-medium ml-aut…" aria-label="selfieRef.current?.click()} className='text-xs text-indigo font-medium ml-aut…">
                  Replace
                </button>
              )}
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => selfieRef.current?.click()}
              disabled={data.status !== "unverified"}
              className="w-full glass-1 rounded-xl p-4 flex items-center gap-3 disabled:opacity-50"
            >
              <Camera className="w-5 h-5 text-indigo" />
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">Take or upload a selfie</p>
                <p className="text-[10px] text-muted-foreground">Clear photo of your face for identity verification</p>
              </div>
            </motion.button>
          )}
        </div>
      ),
    },
    {
      num: 3,
      title: "Professional Qualification",
      done: !!data.qualificationBase64,
      content: (
        <div>
          <input
            ref={qualRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "qualificationBase64", "qualificationName")}
          />
          {data.qualificationBase64 ? (
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{data.qualificationName ?? "Document"}</p>
                <span className="text-[10px] text-teal flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Uploaded
                </span>
              </div>
              {data.status === "unverified" && (
                <button
                  onClick={() => qualRef.current?.click()}
                  className="text-xs text-indigo font-medium"
                 title="qualRef.current?.click()} className='text-xs text-indigo font-medium' > Replace" aria-label="qualRef.current?.click()} className='text-xs text-indigo font-medium' > Replace">
                  Replace
                </button>
              )}
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => qualRef.current?.click()}
              disabled={data.status !== "unverified"}
              className="w-full glass-1 rounded-xl p-4 flex items-center gap-3 disabled:opacity-50"
            >
              <Upload className="w-5 h-5 text-indigo" />
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">Upload qualification</p>
                <p className="text-[10px] text-muted-foreground">HPCSA, SANC, or relevant professional certificate</p>
              </div>
            </motion.button>
          )}
        </div>
      ),
    },
    {
      num: 4,
      title: "Bank Account",
      done: bankConnected,
      content: (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/pro/billing")}
          className="w-full glass-1 rounded-xl p-4 flex items-center gap-3"
        >
          <Building2 className="w-5 h-5 text-indigo" />
          <div className="flex-1 text-left">
            <p className="text-xs font-medium text-foreground">
              {bankConnected ? "Bank account connected" : "Connect bank account via Paystack"}
            </p>
            <p className="text-[10px] text-muted-foreground">Required for receiving payouts</p>
          </div>
          {bankConnected ? (
            <CheckCircle className="w-4 h-4 text-teal" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </motion.button>
      ),
    },
  ];

  return (
    <GlassCard className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo" />
          <h2 className="text-sm font-semibold text-foreground">Verification</h2>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-medium ${color} ${bg} rounded-pill px-2.5 py-1`}>
          <Icon className="w-3 h-3" /> {label}
        </span>
      </div>

      {/* Pending banner */}
      {data.status === "pending" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-accent-amber rounded-xl p-3 flex items-center gap-2"
        >
          <Clock className="w-4 h-4 text-amber shrink-0" />
          <p className="text-xs text-amber">Your verification is being reviewed by our team. This usually takes 1-2 business days.</p>
        </motion.div>
      )}

      {data.status === "verified" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-accent-teal rounded-xl p-3 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4 text-teal shrink-0" />
          <p className="text-xs text-teal">Your identity has been verified. Clients will see a verified badge on your profile.</p>
        </motion.div>
      )}

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: step.num * 0.05 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step.done ? "gradient-indigo text-primary-foreground" : "glass-1 text-muted-foreground"
              }`}>
                {step.done ? <CheckCircle className="w-3 h-3" /> : step.num}
              </div>
              <span className="text-xs font-medium text-foreground">{step.title}</span>
            </div>
            <div className="ml-7">{step.content}</div>
          </motion.div>
        ))}
      </div>

      {/* Submit */}
      {data.status === "unverified" && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-pill text-sm font-semibold gradient-indigo text-primary-foreground shadow-cta disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Submit for Verification
        </motion.button>
      )}
    </GlassCard>
  );
}
