// Lazy loader + thin wrapper around Paystack's v2 inline checkout
// (https://js.paystack.co/v2/inline.js). The script is fetched the
// first time openPaystackInline() is called; subsequent calls reuse
// the loaded global. If the script fails to load (offline / ad-block)
// the caller can fall back to the authorization_url redirect path.

declare global {
  interface Window {
    PaystackPop?: { new (): { resumeTransaction(accessCode: string, callbacks?: PaystackCallbacks): void } };
  }
}

interface PaystackCallbacks {
  onSuccess?: (transaction: { reference: string; status: string; trans?: string }) => void;
  onCancel?: () => void;
  onLoad?: () => void;
  onError?: (err: { message?: string }) => void;
}

const INLINE_SRC = "https://js.paystack.co/v2/inline.js";

let loadPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR — no window"));
  if (window.PaystackPop) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${INLINE_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Paystack inline script failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = INLINE_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Paystack inline script failed to load"));
    document.head.appendChild(s);
  });

  return loadPromise;
}

/** Open the Paystack inline modal for an already-initialized transaction.
 *  Returns a promise that resolves with the final transaction status
 *  ("success" | "cancelled" | "load_failed"). */
export async function openPaystackInline(
  accessCode: string,
  callbacks: PaystackCallbacks = {},
): Promise<"success" | "cancelled" | "load_failed"> {
  try {
    await loadScript();
  } catch {
    callbacks.onError?.({ message: "Inline JS failed to load" });
    return "load_failed";
  }
  if (!window.PaystackPop) {
    callbacks.onError?.({ message: "PaystackPop not available after load" });
    return "load_failed";
  }

  return new Promise((resolve) => {
    const pop = new window.PaystackPop!();
    pop.resumeTransaction(accessCode, {
      onLoad: callbacks.onLoad,
      onSuccess: (tx) => {
        callbacks.onSuccess?.(tx);
        resolve("success");
      },
      onCancel: () => {
        callbacks.onCancel?.();
        resolve("cancelled");
      },
      onError: (err) => {
        callbacks.onError?.(err);
        resolve("load_failed");
      },
    });
  });
}
