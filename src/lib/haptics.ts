/**
 * Haptics — thin wrapper around Capacitor Haptics with web no-ops.
 *
 * Why a wrapper: Capacitor.Haptics throws if the plugin isn't loaded
 * (web). Wrapping with isNativePlatform() means callsites can fire
 * haptics anywhere without a guard.
 *
 * Use the named events (success/warning/error) — they map to platform
 * conventions (UINotificationFeedbackGenerator on iOS, the equivalent
 * VibratorManager pattern on Android).
 */

import { Capacitor } from "@capacitor/core";

async function safeImport() {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const mod = await import("@capacitor/haptics");
    return mod;
  } catch {
    return null;
  }
}

export const haptics = {
  /** Booking confirmed, payment succeeded, points earned. */
  async success(): Promise<void> {
    const m = await safeImport();
    if (!m) return;
    try { await m.Haptics.notification({ type: m.NotificationType.Success }); } catch { /* */ }
  },

  /** Validation failures, mild errors, low-severity warnings. */
  async warning(): Promise<void> {
    const m = await safeImport();
    if (!m) return;
    try { await m.Haptics.notification({ type: m.NotificationType.Warning }); } catch { /* */ }
  },

  /** Hard failures (payment declined, network drop). */
  async error(): Promise<void> {
    const m = await safeImport();
    if (!m) return;
    try { await m.Haptics.notification({ type: m.NotificationType.Error }); } catch { /* */ }
  },

  /** Light tap — small UI selections, list-item picks. */
  async selection(): Promise<void> {
    const m = await safeImport();
    if (!m) return;
    try { await m.Haptics.selectionChanged(); } catch { /* */ }
  },

  /** Light impact — small button presses. */
  async light(): Promise<void> {
    const m = await safeImport();
    if (!m) return;
    try { await m.Haptics.impact({ style: m.ImpactStyle.Light }); } catch { /* */ }
  },

  /** Medium impact — primary CTAs. */
  async medium(): Promise<void> {
    const m = await safeImport();
    if (!m) return;
    try { await m.Haptics.impact({ style: m.ImpactStyle.Medium }); } catch { /* */ }
  },

  /** Heavy impact — confirmations of large actions. */
  async heavy(): Promise<void> {
    const m = await safeImport();
    if (!m) return;
    try { await m.Haptics.impact({ style: m.ImpactStyle.Heavy }); } catch { /* */ }
  },
};
