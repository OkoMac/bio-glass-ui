/**
 * Provider Payment Settings — Stripe Connect Onboarding
 *
 * Allows providers to set up their Stripe Connect Express account
 * to receive direct payouts from bookings.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import ProviderNav from "@/components/ProviderNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  Wallet, CheckCircle, AlertCircle, Loader2, ArrowRight, ExternalLink, RefreshCw
} from "lucide-react";

interface ConnectStatus {
  onboarded: boolean;
  connectId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: string[];
}

export default function ProviderPaymentSettings() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/status", {
        headers: { Authorization: `Bearer ${(await user?.getIdToken())}` },
      });
      const data = await res.json();
      if (data.ok) setStatus(data.data);
    } catch (e: any) {
      setError("Failed to load payment status");
    }
    setLoading(false);
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleOnboard = async () => {
    setOnboarding(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { Authorization: `Bearer ${(await user?.getIdToken())}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.ok && data.data?.url) {
        window.location.href = data.data.url; // Redirect to Stripe onboarding
      } else {
        setError(data.error || "Failed to create onboarding link");
      }
    } catch (e: any) {
      setError("Failed to start onboarding");
    }
    setOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-obsidian">
      <ProviderNav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Wallet className="w-6 h-6 text-teal" />
          Payment Settings
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Status Card */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Payout Account</h2>

              {!status?.connectId ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">You haven't set up your payout account yet.</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Connect a bank account to receive payments directly. Stripe handles the verification — it takes about 5 minutes.
                  </p>
                  <button
                    onClick={handleOnboard}
                    disabled={onboarding}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 mx-auto"
                  >
                    {onboarding ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>
                    ) : (
                      <><ArrowRight className="w-4 h-4" /> Set Up Payout Account</>
                    )}
                  </button>
                </div>
              ) : status?.onboarded ? (
                <div>
                  <div className="flex items-center gap-3 text-green-400 mb-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Verified & Active</span>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Status</span>
                      <span className="text-green-400">Active</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Charges</span>
                      <span className={status.chargesEnabled ? "text-green-400" : "text-yellow-400"}>
                        {status.chargesEnabled ? "Enabled" : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Payouts</span>
                      <span className={status.payoutsEnabled ? "text-green-400" : "text-yellow-400"}>
                        {status.payoutsEnabled ? "Enabled" : "Pending"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleOnboard}
                    className="mt-4 text-sm text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Update Payment Details
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 text-yellow-400 mb-4">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Verification Incomplete</span>
                  </div>
                  {status.requirements?.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-400 mb-2">Required actions:</p>
                      <ul className="space-y-1">
                        {status.requirements.map((r, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-yellow-400" /> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={handleOnboard}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Complete Verification
                  </button>
                </div>
              )}
            </GlassCard>

            {/* Info card */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-white mb-3">How Payouts Work</h2>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex gap-3">
                  <span className="text-teal font-bold">1.</span>
                  <span>Client pays via Stripe — you get <strong className="text-white">90%</strong> of the booking amount</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-teal font-bold">2.</span>
                  <span>BION deducts <strong className="text-white">5% platform fee</strong> + <strong className="text-white">5% marketing fee</strong></span>
                </div>
                <div className="flex gap-3">
                  <span className="text-teal font-bold">3.</span>
                  <span>Funds are sent directly to your bank account within <strong className="text-white">2-3 business days</strong></span>
                </div>
                <div className="flex gap-3">
                  <span className="text-teal font-bold">4.</span>
                  <span>No monthly fees — you only pay when you get booked</span>
                </div>
              </div>
            </GlassCard>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-400/10 rounded-lg">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <button
              onClick={fetchStatus}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh status
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
