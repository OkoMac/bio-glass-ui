import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import GlassCard from "@/components/GlassCard";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface EnablePushCardProps {
  /** Drives the copy — providers want booking-request alerts, clients want
   *  confirmation alerts. */
  role: "provider" | "client";
  /** Profile id is baked into the dismissal key so every device/account
   *  makes its own decision. */
  profileId: string | null | undefined;
  /** Optional override of the Tailwind className wrapping the card. */
  className?: string;
}

function dismissKey(profileId: string | null | undefined) {
  return `bion_push_card_dismissed_${profileId ?? "anon"}`;
}

/**
 * Dismissible glass-card CTA that asks the user to enable web push.
 * Only renders when:
 *   - the browser supports push (ServiceWorker + PushManager + Notification)
 *   - the user hasn't already subscribed in this browser
 *   - the user hasn't explicitly dismissed the card for this profile
 *   - permission isn't already in a decided state (granted = subscribe flow
 *     handles idempotence, denied = browser blocked, nothing we can do)
 */
export default function EnablePushCard({ role, profileId, className }: EnablePushCardProps) {
  const { supported, permission, subscribed, subscribe, loading } = usePushNotifications();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(dismissKey(profileId)) === "1"; }
    catch { return false; }
  });

  const shouldShow = useMemo(() => {
    if (!supported) return false;
    if (subscribed) return false;
    if (dismissed) return false;
    if (permission === "denied") return false;
    return true;
  }, [supported, subscribed, dismissed, permission]);

  if (!shouldShow) return null;

  const copy = role === "provider"
    ? { title: "Never miss a booking", body: "Get notified the second a client books you." }
    : { title: "Stay in the loop", body: "Know the moment a provider accepts your booking." };

  const handleEnable = async () => {
    const ok = await subscribe();
    if (ok) {
      toast.success("Notifications enabled", { description: "We'll ping this device when it matters." });
    } else if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      toast.error("Notifications blocked", { description: "Enable them in your browser settings for BION." });
    } else {
      toast.error("Couldn't enable notifications", { description: "Try again or check your connection." });
    }
  };

  const handleDismiss = () => {
    try { localStorage.setItem(dismissKey(profileId), "1"); } catch {}
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={className}
      >
        <GlassCard variant="glass-1" className="p-4 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl glass-accent-indigo flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{copy.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{copy.body}</p>
              <div className="flex gap-2 mt-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleEnable}
                  disabled={loading}
                  className="px-3 py-1.5 glass-accent-indigo rounded-pill text-[11px] font-semibold text-indigo hover:bg-white/[0.04] transition-colors disabled:opacity-60"
                >
                  {loading ? "Enabling…" : "Enable notifications"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDismiss}
                  className="px-3 py-1.5 glass-1 rounded-pill text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Not now
                </motion.button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="shrink-0 w-7 h-7 rounded-full glass-1 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
