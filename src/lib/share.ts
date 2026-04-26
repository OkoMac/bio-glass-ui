/**
 * Share — wraps Capacitor Share with a Web Share API fallback so the
 * same call works on iOS, Android, modern Chrome/Safari, and degrades
 * to clipboard copy on older browsers.
 *
 *   import { shareItem } from "@/lib/share";
 *   await shareItem({ title: "Dr Pillay", text: "Check this provider", url: "..." });
 *
 * Returns true if share or clipboard fallback succeeded.
 */

import { Capacitor } from "@capacitor/core";

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  /** iOS only — title for the iOS share dialog ("Share via..."). */
  dialogTitle?: string;
}

export async function shareItem(data: ShareData): Promise<{ ok: boolean; channel: "native" | "web" | "clipboard" | "none" }> {
  // Native (Capacitor)
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: data.title,
        text: data.text,
        url: data.url,
        dialogTitle: data.dialogTitle ?? "Share with",
      });
      return { ok: true, channel: "native" };
    } catch (err: any) {
      // User cancelled or plugin error — try web fallback
      if (err?.message?.toLowerCase().includes("cancel")) {
        return { ok: false, channel: "none" };
      }
      // Fall through to web/clipboard
    }
  }

  // Web Share API (modern browsers)
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title: data.title, text: data.text, url: data.url });
      return { ok: true, channel: "web" };
    } catch (err: any) {
      if (err?.name === "AbortError") return { ok: false, channel: "none" };
    }
  }

  // Clipboard fallback
  try {
    const payload = [data.title, data.text, data.url].filter(Boolean).join("\n");
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload);
      return { ok: true, channel: "clipboard" };
    }
  } catch { /* */ }

  return { ok: false, channel: "none" };
}
