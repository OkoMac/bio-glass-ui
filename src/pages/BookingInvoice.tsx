import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Printer, Download, CheckCircle, Clock,
  AlertCircle, Loader2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
interface BookingDetail {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  total_price: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  payment_reference: string | null;
  payment_status: string | null;
  client: { id: string; full_name: string | null; email: string | null } | null;
  provider: { id: string; full_name: string | null; business_name: string | null } | null;
  service: { id: string; title: string; price_rand: number; duration_minutes: number } | null;
}

function shortId(uuid: string): string {
  return uuid.replace(/-/g, "").substring(0, 8).toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-ZA", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

// ── Component ────────────────────────────────────────────────────────
export default function BookingInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch booking details from Supabase
  useEffect(() => {
    if (!id) { setError("No booking ID provided."); setLoading(false); return; }

    const fetchBooking = async () => {
      try {
        const { data, error: dbErr } = await supabase
          .from("bookings")
          .select(`
            id, booking_date, booking_time, duration_minutes,
            total_price, status, notes, created_at,
            payment_reference, payment_status,
            client:profiles!bookings_client_id_fkey(id, full_name, email),
            provider:profiles!bookings_provider_id_fkey(id, full_name, business_name),
            service:services(id, title, price_rand, duration_minutes)
          `)
          .eq("id", id)
          .maybeSingle();

        if (dbErr) throw new Error(dbErr.message);
        if (!data) throw new Error("Booking not found.");

        setBooking(data as unknown as BookingDetail);
      } catch (err: any) {
        setError(err.message ?? "Could not load booking.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPdf = () => {
    // Use the browser's built-in print-to-PDF. This works on all platforms
    // and doesn't require any external dependencies.
    window.print();
  };

  // ── Render states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="w-10 h-10 text-coral" />
        <p className="text-sm text-foreground font-medium">{error ?? "Booking not found."}</p>
        <button onClick={() => navigate(-1)} className="text-xs text-indigo" title="navigate(-1)} className='text-xs text-indigo'>Go back" aria-label="navigate(-1)} className='text-xs text-indigo'>Go back">Go back</button>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────
  const invoiceNumber = `BION-INV-${shortId(booking.id)}`;
  const servicePrice = booking.service?.price_rand ?? booking.total_price ?? 0;
  const bookingFee = Math.round(servicePrice * 0.05);
  const totalPaid = servicePrice + bookingFee;
  const clientName = booking.client?.full_name ?? "Client";
  const providerName = booking.provider?.business_name ?? booking.provider?.full_name ?? "Provider";
  const serviceName = booking.service?.title ?? "Session";
  const duration = booking.service?.duration_minutes ?? booking.duration_minutes ?? 60;
  const paymentRef = booking.payment_reference ?? "N/A";

  const isPaid = booking.payment_status === "paid" || booking.status === "confirmed" || booking.status === "completed";

  return (
    <div className="min-h-screen bg-obsidian pb-32">
      {/* Top bar — hidden when printing */}
      <div className="print:hidden px-4 pt-8 pb-4 flex items-center justify-between max-w-2xl mx-auto">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className="glass-2 rounded-full w-10 h-10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={handlePrint}
            className="glass-1 rounded-pill px-4 py-2 text-xs font-medium text-foreground flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleDownloadPdf}
            className="gradient-indigo rounded-pill px-4 py-2 text-xs font-semibold text-primary-foreground flex items-center gap-1.5 shadow-cta">
            <Download className="w-3.5 h-3.5" /> Download
          </motion.button>
        </div>
      </div>

      {/* Invoice body */}
      <div ref={invoiceRef} className="mx-auto max-w-2xl px-4 space-y-5">
        {/* Header */}
        <GlassCard className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">BION</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Africa's Health & Wellness OS</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Invoice</p>
              <p className="text-sm font-bold font-data text-indigo mt-0.5">{invoiceNumber}</p>
            </div>
          </div>

          {/* Date + status */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Date issued</p>
              <p className="text-sm text-foreground font-medium">{formatDate(booking.created_at)}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium ${
              isPaid ? "bg-teal/10 text-teal border border-teal/20" : "bg-amber/10 text-amber border border-amber/20"
            }`}>
              {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {isPaid ? "Paid" : "Pending"}
            </div>
          </div>

          {/* Client / Provider columns */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Bill to</p>
              <p className="text-sm font-semibold text-foreground">{clientName}</p>
              {booking.client?.email && (
                <p className="text-[11px] text-muted-foreground">{booking.client.email}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Provider</p>
              <p className="text-sm font-semibold text-foreground">{providerName}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06] mb-4" />

          {/* Service line items */}
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-12 text-[10px] text-muted-foreground uppercase tracking-widest">
              <span className="col-span-5">Service</span>
              <span className="col-span-2 text-center">Duration</span>
              <span className="col-span-2 text-center">Date</span>
              <span className="col-span-3 text-right">Amount</span>
            </div>
            <div className="grid grid-cols-12 text-sm items-center">
              <span className="col-span-5 text-foreground font-medium">{serviceName}</span>
              <span className="col-span-2 text-center text-muted-foreground font-data">{duration} min</span>
              <span className="col-span-2 text-center text-muted-foreground text-xs">
                {booking.booking_date}
              </span>
              <span className="col-span-3 text-right text-foreground font-data font-medium">
                R{servicePrice.toLocaleString()}
              </span>
            </div>
            {booking.booking_time && (
              <p className="text-[11px] text-muted-foreground -mt-1">
                Time: {booking.booking_time}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06] mb-4" />

          {/* Fee breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service price</span>
              <span className="text-foreground font-data">R{servicePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">BION booking fee (5%)</span>
              <span className="text-foreground font-data">R{bookingFee.toLocaleString()}</span>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex justify-between text-base font-bold">
              <span className="text-foreground">Total paid</span>
              <span className="text-indigo font-data">R{totalPaid.toLocaleString()}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06] my-4" />

          {/* Payment reference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Payment method</p>
              <p className="text-xs text-foreground">Paystack</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Reference</p>
              <p className="text-xs text-foreground font-data break-all">{paymentRef}</p>
            </div>
          </div>

          {booking.notes && (
            <>
              <div className="h-px bg-white/[0.06] my-4" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Notes</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{booking.notes}</p>
              </div>
            </>
          )}
        </GlassCard>

        {/* Footer */}
        <div className="text-center space-y-1 pb-4">
          <p className="text-[10px] text-muted-foreground">
            BION Health (Pty) Ltd. | bionhealth.co.za
          </p>
          <p className="text-[10px] text-muted-foreground">
            Generated {formatDateTime(new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body { background: #0a0a0f !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="print:hidden"><BottomNav /></div>
    </div>
  );
}
