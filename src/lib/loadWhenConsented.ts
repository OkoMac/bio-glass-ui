/**
 * Load third-party scripts only once the user has consented to the given
 * cookie category. If they consent later we catch the consent-changed event
 * and load then; if they revoke, the script stays (already injected) but
 * you should still gate the feature via `hasConsent()`.
 *
 * Usage (e.g. Meta Pixel / Google Ads, not wired in this commit):
 *
 *   loadWhenConsented("marketing", {
 *     src: "https://connect.facebook.net/en_US/fbevents.js",
 *     id: "meta-pixel",
 *     onLoad: () => (window as any).fbq("init", "PIXEL_ID"),
 *   });
 */

import { hasConsent, onConsentChanged, type ConsentCategory } from "./cookieConsent";

export interface LoadScriptOptions {
  src: string;
  /** Unique id so we never double-inject. */
  id: string;
  async?: boolean;
  defer?: boolean;
  /** Fires once the script tag has finished loading. */
  onLoad?: () => void;
  /** Fires if the script fails to load (network / CSP). */
  onError?: (err: Event | string) => void;
  /** Optional extra attributes (e.g. data-domain). */
  attributes?: Record<string, string>;
}

/**
 * Inject a <script> tag once the user has consented to `category`.
 * Returns a disposer — call it to cancel a pending load if the component
 * unmounts before consent is granted.
 */
export function loadWhenConsented(
  category: ConsentCategory,
  opts: LoadScriptOptions,
): () => void {
  if (typeof document === "undefined") return () => {};

  let disposed = false;
  let unsubscribe: (() => void) | null = null;

  const inject = () => {
    if (disposed) return;
    if (document.getElementById(opts.id)) return; // already injected
    const tag = document.createElement("script");
    tag.id = opts.id;
    tag.src = opts.src;
    tag.async = opts.async ?? true;
    tag.defer = opts.defer ?? false;
    if (opts.attributes) {
      for (const [k, v] of Object.entries(opts.attributes)) tag.setAttribute(k, v);
    }
    if (opts.onLoad) tag.addEventListener("load", () => opts.onLoad?.());
    if (opts.onError) tag.addEventListener("error", (ev) => opts.onError?.(ev));
    document.head.appendChild(tag);
  };

  if (hasConsent(category)) {
    inject();
  } else {
    // Wait for the first consent change that grants this category.
    unsubscribe = onConsentChanged((state) => {
      if (disposed) return;
      if (state && state[category]) {
        inject();
        unsubscribe?.();
        unsubscribe = null;
      }
    });
  }

  return () => {
    disposed = true;
    unsubscribe?.();
  };
}
