/**
 * StitchCheckoutButton — the only client-side checkout component.
 * Stripe was removed 2026-05-24.
 *
 * Stitch's checkout is hosted (not embedded), so this is a single
 * "Pay R{X}" button that calls /api/stitch/checkout/create, gets a
 * redirect URL back, and navigates the browser there. On return,
 * Stitch redirects to the return_url (Schedule page) and the webhook
 * has already marked the booking paid + fired all downstream
 * v2.0 rewards machinery.
 *
 * Backend route returns 503 with code=stitch_sandbox until production
 * creds + STITCH_ENV=production are set. We surface that gracefully.
 */

import { useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";

interface Props {
  bookingId: string;
  amountRand: number;
  onError?: (msg: string) => void;
  /** Where Stitch redirects after the user completes payment. */
  returnUrl?: string;
}

export default function StitchCheckoutButton({
  bookingId, amountRand, onError, returnUrl,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const pay = async () => {
    if (busy) return;
    setBusy(true);
    setLocalError(null);
    try {
      const res = await authFetch("/api/stitch/checkout/create", {
        method: "POST",
        body: JSON.stringify({
          bookingId,
          amount_rand: amountRand,
          // Default return lands on /schedule with ?paid=<bookingId> so the
          // page can show an explicit "Payment received, awaiting provider
          // confirmation" banner — otherwise the user lands on a list of
          // bookings with no signal that their payment just landed.
          return_url:  returnUrl ?? `${window.location.origin}/schedule?paid=${encodeURIComponent(bookingId)}`,
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        if (j.code === "stitch_sandbox") {
          const msg = "Payments aren't live yet — Stitch verification is pending. Please come back soon, or reach out to support if this is urgent.";
          setLocalError(msg);
          onError?.(msg);
          return;
        }
        if (j.code === "already_paid") {
          const msg = "This booking is already paid.";
          setLocalError(msg);
          onError?.(msg);
          return;
        }
        const msg = j.error ?? "Could not start checkout";
        setLocalError(msg);
        onError?.(msg);
        return;
      }
      // Redirect to Stitch's hosted checkout.
      window.location.href = j.data.checkout_url as string;
    } catch (e: any) {
      const msg = e?.message ?? "Network error";
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={pay}
        disabled={busy || amountRand <= 0}
        className="w-full bg-gradient-to-br from-indigo to-violet text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        {busy ? "Starting checkout…" : `Pay R${amountRand.toFixed(2)}`}
      </button>

      {localError && (
        <div className="flex items-start gap-2 p-3 glass-1 rounded-lg border border-amber-400/20 bg-amber-400/5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-foreground">{localError}</p>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
        Powered by Stitch — pay-by-bank or card. You'll be redirected to a
        secure Stitch page to complete payment. Funds release on session
        completion.
      </p>
    </div>
  );
}
