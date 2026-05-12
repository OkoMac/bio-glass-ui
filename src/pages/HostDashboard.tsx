import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import {
  ArrowLeft, Copy, Download, QrCode, Eye, Users, CalendarCheck,
  CheckCircle, Loader2, Printer, Heart, ExternalLink,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
const SITE = "https://bionhealth.co.za";

interface HostStats {
  code: string;
  hostName: string;
  propertyName: string;
  totalScans: number;
  totalSignups: number;
  totalBookings: number;
  createdAt: string;
}

export default function HostDashboard() {
  const navigate = useNavigate();
  const [code, setCode] = useState(() => localStorage.getItem("bion_host_code") || "");
  const [stats, setStats] = useState<HostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPrintCard, setShowPrintCard] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const landingUrl = `${SITE}/stay/${code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(landingUrl)}`;

  useEffect(() => {
    if (!code) {
      navigate("/host/register");
      return;
    }
    fetch(`${API}/api/guest/stats/${code}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setStats(res.data);
        else navigate("/host/register");
      })
      .catch(() => navigate("/host/register"))
      .finally(() => setLoading(false));
  }, [code]);

  function copyLink() {
    navigator.clipboard.writeText(landingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadQR() {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `bion-qr-${code}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function printCard() {
    setShowPrintCard(true);
    setTimeout(() => window.print(), 300);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-obsidian text-white print:hidden">
        {/* Header */}
        <div className="px-5 pt-8 pb-4">
          <button onClick={() => navigate(-1)} className="mb-4 p-2 -ml-2 rounded-xl hover:bg-white/5" title="navigate(-1)} className='mb-4 p-2 -ml-2 rounded-xl hover:bg-white/5'>" aria-label="navigate(-1)} className='mb-4 p-2 -ml-2 rounded-xl hover:bg-white/5'>">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold mb-1">Host Dashboard</h1>
          <p className="text-white/50 text-sm">
            {stats?.hostName}{stats?.propertyName ? ` - ${stats.propertyName}` : ""}
          </p>
        </div>

        {/* QR Code Section */}
        <div className="px-5 mb-6">
          <GlassCard className="p-6 flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl mb-4">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-xs text-white/40 mb-4 font-mono">{code}</p>

            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                onClick={copyLink}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-violet/30 transition-colors"
               aria-label="Confirm" title="Confirm">
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/60" />}
                <span className="text-[10px] text-white/60">{copied ? "Copied!" : "Copy Link"}</span>
              </button>
              <button
                onClick={downloadQR}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-violet/30 transition-colors"
               title="Download" aria-label="Download">
                <Download className="w-4 h-4 text-white/60" />
                <span className="text-[10px] text-white/60">Download</span>
              </button>
              <button
                onClick={printCard}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-violet/30 transition-colors"
               title="Print Card" aria-label="Print Card">
                <Printer className="w-4 h-4 text-white/60" />
                <span className="text-[10px] text-white/60">Print Card</span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Stats */}
        <div className="px-5 mb-6">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Referral Stats</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Eye} label="Scans" value={stats?.totalScans ?? 0} color="text-violet" />
            <StatCard icon={Users} label="Signups" value={stats?.totalSignups ?? 0} color="text-emerald-400" />
            <StatCard icon={CalendarCheck} label="Bookings" value={stats?.totalBookings ?? 0} color="text-amber-400" />
          </div>
        </div>

        {/* Preview Link */}
        <div className="px-5 mb-6">
          <button
            onClick={() => window.open(`/stay/${code}`, "_blank")}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-violet/30 transition-colors"
           title="window.open(`/stay/$ `, '_blank')} className='w-full flex items-center justif…" aria-label="window.open(`/stay/$ `, '_blank')} className='w-full flex items-center justif…">
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-violet" />
              <div className="text-left">
                <p className="text-sm font-semibold">Preview guest page</p>
                <p className="text-[11px] text-white/40 truncate max-w-[220px]">{landingUrl}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/40" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pb-8 text-[10px] text-white/30">
          Powered by BION &mdash; Africa's health &amp; wellness platform
        </div>
      </div>

      {/* ── Printable Welcome Card (visible only during print) ── */}
      <div className="hidden print:block" ref={printRef}>
        <PrintableCard code={code} landingUrl={landingUrl} qrUrl={qrUrl} />
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <GlassCard className="p-4 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
    </GlassCard>
  );
}

function PrintableCard({ code, landingUrl, qrUrl }: { code: string; landingUrl: string; qrUrl: string }) {
  return (
    <div style={{
      width: "400px",
      margin: "40px auto",
      padding: "40px",
      border: "2px solid #6366f1",
      borderRadius: "24px",
      textAlign: "center",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: "white",
      color: "#1a1a2e",
    }}>
      {/* BION Logo */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        marginBottom: "20px",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "16px",
        }}>
          &#9829;
        </div>
        <span style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "2px" }}>BION</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
        Your Wellness Guide
      </h2>
      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px", lineHeight: "1.5" }}>
        Scan to find gyms, spas, doctors &amp; more near you
      </p>

      {/* QR */}
      <div style={{
        display: "inline-block",
        padding: "12px",
        border: "2px solid #e5e7eb",
        borderRadius: "16px",
        marginBottom: "16px",
      }}>
        <img src={qrUrl} alt="QR Code" style={{ width: "200px", height: "200px" }} />
      </div>

      <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>
        {landingUrl}
      </p>
    </div>
  );
}
