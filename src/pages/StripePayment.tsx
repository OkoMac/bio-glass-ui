/**
 * Stripe Payment Page
 * Handles booking payments via Stripe Elements (embedded card form)
 * Falls back to Stripe Checkout redirect for simpler flow
 */
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Lock } from "lucide-react";

// Stripe publishable key from env
const stripePk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePk ? loadStripe(stripePk) : null;

interface PaymentDetails {
  bookingId: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  amount: number;
  platformFee: number;
  marketingFee: number;
  total: number;
}

/**
 * Wrapper — loads Stripe Elements with the client secret
 */
export default function StripePaymentPage() {
  const [searchParams] = useSearchParams();
  const clientSecret = searchParams.get("client_secret");
  const bookingId = searchParams.get("booking_id");
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clientSecret || !bookingId) {
      setError("Missing payment information");
      setLoading(false);
      return;
    }

    // Fetch booking details from the API
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/stripe/payment-intent/${bookingId}`, {
          headers: { Authorization: `Bearer ${(await import("@/integrations/supabase/client")).supabase.auth.getSession()}` },
        });
        const data = await res.json();
        if (data.ok) {
          setDetails({
            bookingId,
            providerId: data.data.metadata?.providerId || "",
            providerName: data.data.metadata?.providerName || "Provider",
            serviceName: data.data.metadata?.serviceName || "Service",
            amount: data.data.amount / 100,
            platformFee: 0,
            marketingFee: 0,
            total: data.data.amount / 100,
          });
        }
      } catch (e: any) {
        // Show Stripe Checkout fallback
        setError("Unable to load payment details");
      }
      setLoading(false);
    };
    fetchDetails();
  }, [clientSecret, bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  if (error || !clientSecret) {
    return <PaymentError message={error || "Payment could not be initialized"} />;
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "night",
      variables: {
        colorPrimary: "#14b8a6",
        colorBackground: "#1a1a2e",
        colorText: "#e2e8f0",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
  };

  return (
    <div className="min-h-screen bg-obsidian px-4 py-8">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-teal" />
              <h1 className="text-xl font-semibold text-white">Secure Payment</h1>
            </div>

            {details && (
              <div className="mb-6 p-4 bg-white/5 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>{details.providerName}</span>
                  <span>{details.serviceName}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-medium text-white">
                  <span>Total</span>
                  <span>R{details.total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {stripePromise && (
              <Elements stripe={stripePromise} options={options}>
                <PaymentForm bookingId={bookingId!} />
              </Elements>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Payment form with Stripe Elements
 */
function PaymentForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?booking_id=${bookingId}`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setProcessing(false);
    } else {
      navigate(`/payment/success?booking_id=${bookingId}`, { replace: true });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-400/10 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
      >
        {processing ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          <><Lock className="w-4 h-4" /> Pay Now</>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Secured by Stripe · Your card details are encrypted
      </p>
    </form>
  );
}

/**
 * Payment success page
 */
export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md"
      >
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-400 mb-6">
          Your booking has been confirmed. You'll receive a confirmation shortly.
        </p>
        <button
          onClick={() => navigate(bookingId ? `/bookings/${bookingId}` : "/", { replace: true })}
          className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
        >
          View Booking
        </button>
      </motion.div>
    </div>
  );
}

/**
 * Payment error page
 */
function PaymentError({ message }: { message: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md"
      >
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Payment Error</h1>
        <p className="text-gray-400 mb-6">{message}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </motion.div>
    </div>
  );
}
